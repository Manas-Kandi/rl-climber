/**
 * ClimbingEnvironment implements the reinforcement learning environment interface
 * for the 3D climbing game. It coordinates between physics simulation, rendering,
 * and provides the standard RL interface (reset, step, getState).
 */
export class ClimbingEnvironment {
  /**
   * Create a ClimbingEnvironment instance
   * @param {PhysicsEngine} physicsEngine - The physics engine instance
   * @param {RenderingEngine} renderingEngine - The rendering engine instance
   * @param {Object} config - Environment configuration
   */
  constructor(physicsEngine, renderingEngine, config = {}) {
    // Store references to engines
    this.physicsEngine = physicsEngine;
    this.renderingEngine = renderingEngine;

    // Store agent body reference (will be set during initialization)
    this.agentBody = null;

    // Episode tracking variables
    this.currentStep = 0;
    this.totalReward = 0;
    this.episodeStartTime = 0;

    // Jump mechanics
    this.canJump = true;
    this.jumpCooldown = 0;
    this.jumpCooldownSteps = 3; // REDUCED: Shorter cooldown for better responsiveness

    // Step tracking for staircase
    this.highestStepReached = -1; // -1 = ground, 0-9 = steps
    this.currentStepOn = -1;
    this.stepsVisited = new Set();
    this.timeOnGround = 0;
    this.timeOnSteps = 0;
    this.timeOnCurrentStep = 0; // NEW: Track time spent on current step for decay

    // Jump tracking for penalizing wasteful jumps
    this.lastJumpStep = -1;
    this.jumpedThisStep = false;
    this.consecutiveWastefulJumps = 0;

    // Strict progress tracking
    this.stepsOffStairs = 0;  // Count steps spent NOT on stairs
    this.episodesWithoutProgress = 0;  // Count episodes without reaching new steps

    // Trajectory recording
    this.recordTrajectories = false;
    this.currentTrajectory = [];
    this.trajectoryHistory = [];
    this.maxTrajectories = 100; // Keep last 100 episodes
    this.episodeCount = 0; // Track total episodes

    // Curriculum learning
    this.curriculumMode = false;
    this.curriculumLevel = 0;
    this.curriculumGoalStep = 10; // Default: full goal

    // Reward system tracking
    this.lastPosition = null;
    this.stagnationTimer = 0;

    // Action space constants
    this.ACTION_SPACE = {
      FORWARD: 0,
      BACKWARD: 1,
      LEFT: 2,
      RIGHT: 3,
      JUMP: 4,
      GRAB: 5
    };

    // Store environment configuration with defaults
    this.config = {
      // Episode settings
      maxSteps: config.maxSteps || 2000,  // MUCH longer to allow learning

      // Reward weights
      rewardWeights: {
        heightGain: config.rewardWeights?.heightGain || 2.0,  // Increased from 1.0 to encourage climbing
        goalReached: config.rewardWeights?.goalReached || 100.0,
        survival: config.rewardWeights?.survival || 0.1,
        fall: config.rewardWeights?.fall || -20.0,  // Reduced from -50 to make learning easier
        timePenalty: config.rewardWeights?.timePenalty || -0.005,  // Reduced from -0.01
        ledgeGrab: config.rewardWeights?.ledgeGrab || 8.0,  // Increased from 5.0 to encourage ledge use
        outOfBounds: config.rewardWeights?.outOfBounds || -50.0  // Reduced from -100 to make learning easier
      },

      // Environment dimensions
      goalHeight: config.goalHeight || 14.0,
      fallThreshold: config.fallThreshold || -2.0,

      // Boundary limits (platform size)
      boundaryX: config.boundaryX || 10.0,  // ±10 units in X
      boundaryZ: config.boundaryZ || 10.0,  // ±10 units in Z

      // Agent configuration
      agent: {
        startPosition: config.agent?.startPosition || { x: 0, y: 0.5, z: 3 },  // CHANGED: Start on ground in front of stairs
        size: config.agent?.size || 0.5,
        mass: config.agent?.mass || 1.0
      },

      // Ledge positions for distance calculations
      ledgePositions: config.ledgePositions || [
        { position: { x: 0, y: 2, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
        { position: { x: 1, y: 4, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
        { position: { x: -1, y: 6, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
        { position: { x: 0, y: 8, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
        { position: { x: 1, y: 10, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
        { position: { x: 0, y: 12, z: -5 }, size: { x: 2, y: 0.2, z: 1 } }
      ],

      // Action forces - INCREASED for better responsiveness
      actionForces: {
        move: config.actionForces?.move || 15.0,  // INCREASED from 5.0 (3x more responsive)
        jump: config.actionForces?.jump || 6.0,   // DECREASED from 8.0 (more realistic)
        grab: config.actionForces?.grab || 2.0
      }
    };

    // Expose maxSteps for easier access
    this.maxSteps = this.config.maxSteps;

    // Initialize agent body if physics engine is available
    if (this.physicsEngine) {
      this.initializeAgent();
    }

    console.log('ClimbingEnvironment initialized with config:', this.config);
  }

  /**
   * Initialize the agent body in the physics world
   * @private
   */
  initializeAgent() {
    const startPos = this.config.agent.startPosition;
    const size = this.config.agent.size;
    const mass = this.config.agent.mass;

    // Create agent body in physics engine
    this.agentBody = this.physicsEngine.createAgentBody(startPos, mass, size, 'box');

    if (!this.agentBody) {
      console.error('Failed to create agent body in physics engine');
    } else {
      console.log('Agent body initialized at position:', startPos);
    }
  }

  /**
   * Get the action space size
   * @returns {number} Number of discrete actions (6)
   */
  getActionSpace() {
    return Object.keys(this.ACTION_SPACE).length;
  }

  /**
   * Get the state space size
   * @returns {number} State vector dimensionality (13)
   */
  getStateSpace() {
    return 13; // [x, y, z, vx, vy, vz, distGoal, goalDirZ, goalDirY, currentStep, distNextStep, onStairs, buffer]
  }

  /**
   * Get current episode statistics
   * @returns {Object} Episode stats {steps, totalReward, success}
   */
  getEpisodeStats() {
    const currentStep = this.detectCurrentStep();
    const success = currentStep === 10; // Success = reached goal platform

    return {
      steps: this.currentStep,
      totalReward: this.totalReward,
      success: success,
      highestStep: this.highestStepReached
    };
  }

  /**
   * Set maximum steps per episode
   * @param {number} steps - Maximum steps
   */
  setMaxSteps(steps) {
    this.config.maxSteps = steps;
  }

  /**
   * Set reward weights
   * @param {Object} weights - Reward weight configuration
   */
  setRewardWeights(weights) {
    this.config.rewardWeights = { ...this.config.rewardWeights, ...weights };
  }

  /**
   * Enable or disable trajectory recording
   * @param {boolean} enabled - Whether to record trajectories
   */
  setTrajectoryRecording(enabled) {
    this.recordTrajectories = enabled;
    if (enabled) {
      console.log('📹 Trajectory recording enabled');
    } else {
      console.log('📹 Trajectory recording disabled');
    }
  }

  /**
   * Get all recorded trajectories
   * @returns {Array} Array of trajectory objects
   */
  getTrajectoryHistory() {
    return this.trajectoryHistory;
  }

  /**
   * Get the current trajectory (in progress)
   * @returns {Array} Current trajectory steps
   */
  getCurrentTrajectory() {
    return this.currentTrajectory;
  }

  /**
   * Get the last recorded trajectory
   * @returns {Object|null} Last trajectory or null if none
   */
  getLastTrajectory() {
    if (this.trajectoryHistory.length === 0) {
      return null;
    }
    return this.trajectoryHistory[this.trajectoryHistory.length - 1];
  }

  /**
   * Clear trajectory history
   */
  clearTrajectoryHistory() {
    this.trajectoryHistory = [];
    this.currentTrajectory = [];
    console.log('📹 Trajectory history cleared');
  }

  /**
   * Enable curriculum learning mode
   * Makes the task easier by setting intermediate goals
   * @param {number} level - Curriculum level (0=disabled, 1=easiest, 4=full task)
   */
  enableCurriculumLearning(level) {
    this.curriculumLevel = level;

    switch (level) {
      case 0: // Disabled - full task
        this.curriculumMode = false;
        this.curriculumGoalStep = 10;
        this.config.maxSteps = 500;
        console.log('🎓 Curriculum learning DISABLED - Full task');
        break;

      case 1: // Level 1: Just reach Step 0
        this.curriculumMode = true;
        this.curriculumGoalStep = 0;
        this.config.maxSteps = 200;
        console.log('🎓 Curriculum Level 1: Reach Step 0 (200 steps max)');
        break;

      case 2: // Level 2: Reach Step 2
        this.curriculumMode = true;
        this.curriculumGoalStep = 2;
        this.config.maxSteps = 300;
        console.log('🎓 Curriculum Level 2: Reach Step 2 (300 steps max)');
        break;

      case 3: // Level 3: Reach Step 5
        this.curriculumMode = true;
        this.curriculumGoalStep = 5;
        this.config.maxSteps = 400;
        console.log('🎓 Curriculum Level 3: Reach Step 5 (400 steps max)');
        break;

      case 4: // Level 4: Full task
        this.curriculumMode = false;
        this.curriculumGoalStep = 10;
        this.config.maxSteps = 500;
        console.log('🎓 Curriculum Level 4: Full task (500 steps max)');
        break;

      default:
        console.warn('Invalid curriculum level:', level);
        break;
    }
  }

  /**
   * Get current curriculum status
   * @returns {Object} Curriculum info
   */
  getCurriculumStatus() {
    return {
      enabled: this.curriculumMode,
      level: this.curriculumLevel,
      goalStep: this.curriculumGoalStep,
      maxSteps: this.config.maxSteps
    };
  }

  /**
   * Get trajectory statistics
   * @returns {Object} Statistics about recorded trajectories
   */
  getTrajectoryStats() {
    if (this.trajectoryHistory.length === 0) {
      return { totalEpisodes: 0, successfulEpisodes: 0, successRate: 0 };
    }

    const successful = this.trajectoryHistory.filter(t => t.success).length;
    return {
      totalEpisodes: this.trajectoryHistory.length,
      successfulEpisodes: successful,
      successRate: successful / this.trajectoryHistory.length,
      avgSteps: this.trajectoryHistory.reduce((sum, t) => sum + t.steps, 0) / this.trajectoryHistory.length,
      avgReward: this.trajectoryHistory.reduce((sum, t) => sum + t.totalReward, 0) / this.trajectoryHistory.length
    };
  }

  /**
   * Get current state representation as 13D Float32Array
   * State vector: [x, y, z, vx, vy, vz, distGoal, goalDirZ, goalDirY, currentStep, distNextStep, onStairs, buffer]
   * @returns {Float32Array} Normalized state vector
   */
  getState() {
    if (!this.agentBody) {
      console.error('Agent body not initialized');
      return new Float32Array(13);
    }

    // Extract agent position and velocity from physics engine
    const position = this.physicsEngine.getBodyPosition(this.agentBody);
    const velocity = this.physicsEngine.getBodyVelocity(this.agentBody);

    // Calculate distance to goal platform
    // Goal platform: position { x: 0, y: 10.5, z: -20 }
    const goalPosition = { x: 0, y: 10.75, z: -20 };  // Center of goal platform top
    const distanceToGoal = Math.sqrt(
      Math.pow(position.x - goalPosition.x, 2) +
      Math.pow(position.y - goalPosition.y, 2) +
      Math.pow(position.z - goalPosition.z, 2)
    );

    // Calculate DIRECTION to goal (explicit guidance!)
    const goalDirZ = (goalPosition.z - position.z) / Math.max(0.1, Math.abs(goalPosition.z - position.z));  // -1 or +1
    const goalDirY = (goalPosition.y - position.y) / Math.max(0.1, Math.abs(goalPosition.y - position.y));  // -1 or +1

    // Detect current step
    const currentStepNum = this.detectCurrentStep();

    // Calculate distance to NEXT step (immediate sub-goal)
    const nextStep = currentStepNum + 1;
    const nextStepZ = -2.0 * nextStep;  // Steps at z=0, -2, -4, -6, ...
    const nextStepY = (nextStep + 1) * 1.0;  // Step tops at y=1, 2, 3, ...
    const distanceToNextStep = Math.sqrt(
      Math.pow(position.z - nextStepZ, 2) +
      Math.pow(position.y - nextStepY, 2)
    );

    // Create state vector and normalize values
    const state = new Float32Array(13);

    // Position (normalized to [-1, 1])
    state[0] = Math.max(-1, Math.min(1, position.x / 10.0));
    state[1] = Math.max(-1, Math.min(1, position.y / 15.0));
    state[2] = Math.max(-1, Math.min(1, position.z / 10.0));

    // Velocity (normalized to [-1, 1])
    state[3] = Math.max(-1, Math.min(1, velocity.x / 20.0));
    state[4] = Math.max(-1, Math.min(1, velocity.y / 20.0));
    state[5] = Math.max(-1, Math.min(1, velocity.z / 20.0));

    // Distance to goal (normalized to [0, 1])
    state[6] = Math.max(0, Math.min(1, distanceToGoal / 25.0));

    // EXPLICIT GOAL DIRECTION (tells agent which way to go!)
    state[7] = goalDirZ;  // -1 = go backward, +1 = go forward
    state[8] = goalDirY;  // -1 = go down, +1 = go up

    // Current step number (normalized to [0, 1])
    state[9] = Math.max(0, Math.min(1, (currentStepNum + 1) / 11.0));  // -1 to 10 → 0 to 1

    // Distance to next step (normalized to [0, 1])
    state[10] = Math.max(0, Math.min(1, distanceToNextStep / 5.0));

    // Binary: On stairs or not (0 or 1)
    state[11] = currentStepNum >= 0 ? 1.0 : 0.0;

    // Safety buffer (normalized to [0, 1])
    const bufferValue = this.safetyBuffer === Infinity ? 1.0 : Math.min(1.0, this.safetyBuffer / 200.0);
    state[12] = bufferValue;

    return state;
  }

  /**
   * Reset the environment to initialize a new episode
   * @returns {Float32Array} Initial state as 9D Float32Array
   */
  reset() {
    if (!this.agentBody) {
      console.error('Agent body not initialized, cannot reset environment');
      return new Float32Array(13);
    }

    // Reset agent body position to start position
    const startPos = this.config.agent.startPosition;
    this.physicsEngine.setBodyPosition(this.agentBody, startPos);

    // Reset agent body velocity to zero
    this.physicsEngine.setBodyVelocity(this.agentBody, { x: 0, y: 0, z: 0 });

    // Reset angular velocity too
    if (this.agentBody.angularVelocity) {
      this.agentBody.angularVelocity.set(0, 0, 0);
    }

    // Reset episode step counter to 0
    this.currentStep = 0;

    // Reset total reward to 0
    this.totalReward = 0;

    // Record episode start time
    this.episodeStartTime = Date.now();

    // Reset jump mechanics
    this.canJump = true;
    this.jumpCooldown = 0;

    // Reset step tracking
    this.highestStepReached = -1;
    this.currentStepOn = -1;
    this.stepsVisited.clear();
    this.timeOnGround = 0;
    this.timeOnSteps = 0;
    this.timeOnCurrentStep = 0; // NEW: Reset time on current step

    // Reset reward tracking
    this.lastPosition = null;
    this.stagnationTimer = 0;

    // Reset jump tracking
    this.lastJumpStep = -1;
    this.jumpedThisStep = false;
    this.consecutiveWastefulJumps = 0;

    // Reset strict progress tracking
    this.stepsOffStairs = 0;

    // Reset safety buffer system
    this.safetyBuffer = 300;  // Start with 300 steps (increased from 200)
    this.hasReachedStairs = false;

    // Increment episode counter
    this.episodeCount++;

    // Start new trajectory recording if enabled
    if (this.recordTrajectories) {
      this.currentTrajectory = [];
      const initialPos = this.physicsEngine.getBodyPosition(this.agentBody);
      this.currentTrajectory.push({
        step: 0,
        position: { ...initialPos },
        action: null,
        reward: 0,
        timestamp: Date.now()
      });
    }

    // Return initial state as Float32Array
    const initialState = this.getState();

    return initialState;
  }

  /**
   * Update the agent start position (used when switching scenes)
   * @param {Object} position - New start position {x, y, z}
   */
  updateStartPosition(position) {
    this.config.agent.startPosition = { ...position };
    console.log('Agent start position updated to:', position);
  }

  /**
   * Detect which step the agent is currently on
   * @returns {number} Step number (-1 for ground, 0-9 for steps, 10 for goal)
   */
  detectCurrentStep() {
    if (!this.agentBody) return -1;

    const agentPos = this.physicsEngine.getBodyPosition(this.agentBody);

    // Check if on goal platform
    // Goal is at position: { x: 0, y: 10.5, z: -20 }, size: { x: 4, y: 0.5, z: 2 }
    // Agent needs to be: within X bounds, at correct height, within Z bounds
    if (this.isOnGoalPlatform(agentPos)) {
      return 10; // Goal reached!
    }

    // Detect step by position (more reliable than collision detection)
    // Steps are positioned at:
    // Step 0: center z=0, ranges from z=-1 to z=+1
    // Step 1: center z=-2, ranges from z=-3 to z=-1
    // Step 2: center z=-4, ranges from z=-5 to z=-3
    // Step i: center z=-2*i, ranges from z=(-2*i-1) to z=(-2*i+1)

    // Must be in staircase Z range
    if (agentPos.z > 2 || agentPos.z < -20) {
      return -1; // Not on stairs
    }

    // Must be within staircase X bounds
    if (Math.abs(agentPos.x) > 2.5) {
      return -1; // Off to the side
    }

    // Determine step by Z position
    // Steps are at: z=0, -2, -4, -6, -8, -10, -12, -14, -16, -18
    // Step centers are at: y=0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5
    // Agent standing ON step would be at: y≈1, 2, 3, 4, 5, 6, 7, 8, 9, 10

    for (let i = 0; i < 10; i++) {
      const stepCenterZ = -2.0 * i;  // Steps at 0, -2, -4, -6, -8, -10, -12, -14, -16, -18
      const stepMinZ = stepCenterZ - 1.0;  // Each step is 2 units deep
      const stepMaxZ = stepCenterZ + 1.0;

      // Check if agent is within this step's Z range
      if (agentPos.z >= stepMinZ && agentPos.z <= stepMaxZ) {
        // Step center is at y = (i + 0.5), top surface at y = (i + 1)
        // Agent standing on step should be at y ≈ (i + 1) ± 0.5
        const stepTopY = (i + 1) * 1.0;
        const heightDiff = Math.abs(agentPos.y - stepTopY);

        // More lenient tolerance: agent must be within 1.2 units of step top
        // This allows for agent height (0.5) plus generous margin for physics settling
        if (heightDiff < 1.2) {
          return i;
        }
      }
    }

    // Default to ground
    return -1;
  }

  /**
   * Check if agent is on the goal platform
   * Goal platform: position { x: 0, y: 10.5, z: -20 }, size { x: 4, y: 0.5, z: 2 }
   * @param {Object} agentPos - Agent position {x, y, z}
   * @returns {boolean} True if agent is on goal platform
   */
  isOnGoalPlatform(agentPos) {
    // Goal platform bounds
    const goalX = 0;
    const goalY = 10.5;
    const goalZ = -20;
    const goalSizeX = 4;
    const goalSizeY = 0.5;
    const goalSizeZ = 2;

    // Calculate bounds
    const minX = goalX - goalSizeX / 2;
    const maxX = goalX + goalSizeX / 2;
    const minZ = goalZ - goalSizeZ / 2;
    const maxZ = goalZ + goalSizeZ / 2;
    const topY = goalY + goalSizeY / 2;

    // Check if agent is within X and Z bounds
    const withinX = agentPos.x >= minX && agentPos.x <= maxX;
    const withinZ = agentPos.z >= minZ && agentPos.z <= maxZ;

    // Check if agent is standing on top of platform
    // Agent center should be at platform top + agent radius (0.5)
    const onTop = Math.abs(agentPos.y - (topY + 0.5)) < 0.8;

    return withinX && withinZ && onTop;
  }

  /**
   * Check if agent is out of bounds (off the platform)
   * @returns {boolean} True if agent is outside boundary limits
   */
  isOutOfBounds() {
    if (!this.agentBody) return false;

    const agentPos = this.physicsEngine.getBodyPosition(this.agentBody);

    // Check X bounds (±10 units)
    if (Math.abs(agentPos.x) > this.config.boundaryX) {
      return true;
    }

    // Check Z bounds - stairs extend from z=3 (start) to z=-21 (goal)
    // Allow some margin beyond the goal
    if (agentPos.z > 5 || agentPos.z < -22) {
      return true;
    }

    return false;
  }

  /**
   * Check if agent is touching a ledge
   * @returns {boolean} True if agent is in contact with a ledge
   */
  isTouchingLedge() {
    if (!this.agentBody) return false;

    const collidingBodies = this.physicsEngine.getCollidingBodies(this.agentBody);

    for (const body of collidingBodies) {
      const bodyId = this.getBodyId(body);
      if (bodyId && bodyId.includes('ledge')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if agent is grounded (touching ground or ledge)
   * @returns {boolean} True if agent is on ground or ledge
   */
  isGrounded() {
    if (!this.agentBody) return false;

    const agentPos = this.physicsEngine.getBodyPosition(this.agentBody);
    const agentVel = this.physicsEngine.getBodyVelocity(this.agentBody);

    // LENIENT: Allow movement even when slightly airborne
    if (Math.abs(agentVel.y) > 5.0) {
      return false; // Definitely in air
    }

    // Check if agent is in contact with ground or ledges/steps
    const collidingBodies = this.physicsEngine.getCollidingBodies(this.agentBody);

    for (const body of collidingBodies) {
      const bodyId = this.getBodyId(body);
      // Agent is grounded if touching ground, ledge, or step
      if (bodyId && (bodyId === 'ground' || bodyId.includes('ledge') || bodyId.includes('step'))) {
        return true;
      }
    }

    // FALLBACK: Check if agent is very close to any surface
    // This helps when collision detection is unreliable
    if (agentPos.y <= 1.5 && Math.abs(agentVel.y) < 2.0) {
      return true;
    }

    return false;
  }

  /**
   * Calculate reward for the current step - ABSOLUTE BINARY SYSTEM
   * 
   * CORE PHILOSOPHY:
   * - Ground = ABSOLUTE FAILURE (-100, episode ends)
   * - Out of bounds = ABSOLUTE FAILURE (-100, episode ends)
   * - Stairs = ONLY safe place (0 baseline)
   * - Climbing = ONLY way to get positive rewards
   * 
   * NO RELATIVITY. Ground is ground. Death is death. Period.
   * 
   * @param {Float32Array} prevState - Previous state vector
   * @param {number} action - Action taken
   * @param {Float32Array} newState - New state vector after action
   * @returns {number} Total reward for this step
   */
  calculateReward(prevState, action, newState) {
    let totalReward = 0;

    // Defensive checks
    if (!this.agentBody) {
      console.error('calculateReward: agentBody is null');
      return totalReward;
    }

    const agentPos = this.physicsEngine.getBodyPosition(this.agentBody);
    const agentVel = this.physicsEngine.getBodyVelocity(this.agentBody);

    // Get previous position from state (or use current position if testing)
    let prevPos;
    if (!prevState || prevState.length < 13) {
      // For testing: use current position as previous (no movement)
      prevPos = { ...agentPos };
    } else {
      prevPos = {
        x: prevState[0] * 10.0,  // Denormalize
        y: prevState[1] * 15.0,
        z: prevState[2] * 10.0
      };
    }

    // Detect current step and track movement
    const currentStep = this.detectCurrentStep();
    const prevStepOn = this.currentStepOn;

    // Initialize tracking variables
    if (this.currentStepOn === undefined) {
      this.currentStepOn = currentStep;
      this.timeOnCurrentStep = 0;
      this.highestStepReached = Math.max(-1, currentStep);
    }

    // Track time on current step
    if (this.currentStepOn === currentStep) {
      this.timeOnCurrentStep++;
    } else {
      this.timeOnCurrentStep = 0;
      this.currentStepOn = currentStep;
    }

    // ============================================================================
    // PRIORITY 1: TERMINAL CONDITIONS (Episode Enders)
    // ============================================================================

    // 🏆 GOAL REACHED: ULTIMATE SUCCESS
    if (currentStep === 10) {
      totalReward = 100.0;
      console.log('🏆🏆🏆 GOAL REACHED! +100 🏆🏆🏆');
      return totalReward;
    }

    // 💀 FELL TO DEATH
    if (agentPos.y < this.config.fallThreshold) {
      totalReward = -5.0;
      console.log('💀 FELL TO DEATH! -5.0');
      return totalReward;
    }

    // 🚫 OUT OF BOUNDS
    if (this.isOutOfBounds()) {
      totalReward = -5.0;
      console.log('🚫 OUT OF BOUNDS! -5.0');
      return totalReward;
    }

    // ============================================================================
    // PRIORITY 2: STEP PROGRESSION (The Core Learning Signal)
    // ============================================================================

    // 🎯 CLIMBED TO A HIGHER STEP - HUGE REWARD!
    if (currentStep > prevStepOn && currentStep >= 0 && prevStepOn >= 0) {
      const stepsClimbed = currentStep - prevStepOn;
      const climbReward = 20.0 * stepsClimbed;  // MASSIVE: +20 per step!
      totalReward += climbReward;
      console.log(`🎯 CLIMBED ${stepsClimbed} STEP(S)! +${climbReward.toFixed(1)}`);
    }

    // 🎉 FIRST TIME ON STAIRS - BIG REWARD!
    if (currentStep >= 0 && prevStepOn < 0) {
      totalReward += 15.0;
      console.log('🎉 LANDED ON STAIRS! +15.0');
    }

    // 📈 NEW HIGHEST STEP - MILESTONE BONUS!
    if (currentStep > this.highestStepReached && currentStep >= 0) {
      const milestoneReward = 10.0;
      totalReward += milestoneReward;
      this.highestStepReached = currentStep;
      console.log(`📈 NEW RECORD: Step ${currentStep}! +${milestoneReward}`);
    }

    // ============================================================================
    // PRIORITY 3: NEGATIVE FEEDBACK (Discourage Bad Behavior)
    // ============================================================================

    // 📉 FELL OFF STAIRS
    if (currentStep < 0 && prevStepOn >= 0) {
      totalReward -= 8.0;
      console.log('📉 FELL OFF STAIRS! -8.0');
    }

    // ⬇️ MOVED TO LOWER STEP
    if (currentStep >= 0 && prevStepOn >= 0 && currentStep < prevStepOn) {
      const stepsLost = prevStepOn - currentStep;
      const lossReward = 5.0 * stepsLost;
      totalReward -= lossReward;
      console.log(`⬇️ MOVED DOWN ${stepsLost} STEP(S)! -${lossReward.toFixed(1)}`);
    }

    // ============================================================================
    // PRIORITY 4: GUIDANCE SIGNALS (Help Find the Stairs)
    // ============================================================================

    // 🧭 MOVING TOWARD STAIRS (when on ground)
    if (currentStep < 0) {
      const distanceToStairs = Math.abs(agentPos.z - 0);  // Stairs start at z=0
      const prevDistanceToStairs = Math.abs(prevPos.z - 0);

      if (distanceToStairs < prevDistanceToStairs) {
        totalReward += 2.0;  // Good! Moving toward stairs
      } else if (distanceToStairs > prevDistanceToStairs) {
        totalReward -= 1.0;  // Bad! Moving away from stairs
      }
    }

    // ⏱️ TIME PRESSURE (Small penalty to encourage action)
    totalReward -= 0.05;

    // 🐌 STAGNATION PENALTY (Staying on same step too long)
    if (currentStep >= 0 && this.timeOnCurrentStep > 50) {
      const stagnationPenalty = Math.min(2.0, (this.timeOnCurrentStep - 50) * 0.02);
      totalReward -= stagnationPenalty;
      if (this.timeOnCurrentStep % 50 === 0) {
        console.log(`🐌 STAGNATION: ${this.timeOnCurrentStep} steps on step ${currentStep}! -${stagnationPenalty.toFixed(2)}`);
      }
    }

    // ============================================================================
    // PRIORITY 5: HEIGHT-BASED SHAPING (Encourage upward movement)
    // ============================================================================

    // 📏 HEIGHT GAIN BONUS (Even small upward movement is good)
    const heightChange = agentPos.y - prevPos.y;
    if (heightChange > 0.1 && currentStep >= 0) {
      const heightBonus = Math.min(1.0, heightChange * 0.5);
      totalReward += heightBonus;
    }

    // ============================================================================
    // FINAL: CLAMP AND RETURN
    // ============================================================================

    // Clamp reward to reasonable range
    totalReward = Math.max(-10, Math.min(100, totalReward));

    // Debug logging (reduced frequency)
    if (this.currentStep % 100 === 0 && this.currentStep > 0) {
      console.log(`📊 Step ${this.currentStep}: R=${totalReward.toFixed(2)}, OnStep=${currentStep}, Highest=${this.highestStepReached}, Y=${agentPos.y.toFixed(1)}`);
    }

    return totalReward;
  }

  /**
   * Helper method to get body ID from the physics engine's body tracking
   * @param {CANNON.Body} body - The body to find ID for
   * @returns {string|null} Body ID or null if not found
   * @private
   */
  getBodyId(body) {
    // Search through the physics engine's body map to find the ID
    for (const [id, trackedBody] of this.physicsEngine.bodies) {
      if (trackedBody === body) {
        return id;
      }
    }
    return null;
  }

  /**
   * Check if the current episode should terminate
   * @returns {boolean} True if episode should end
   */
  isTerminal() {
    if (!this.agentBody) {
      return true;
    }

    const agentPos = this.physicsEngine.getBodyPosition(this.agentBody);
    const currentStep = this.detectCurrentStep();

    // SUCCESS: Reached goal platform!
    if (currentStep === 10) {
      return true;
    }

    // ABSOLUTE FAILURE: Buffer expired on ground
    if (currentStep < 0) {
      const buffer = this.safetyBuffer !== undefined ? this.safetyBuffer : 200;
      if (buffer <= 0) {
        return true;  // Episode ends immediately!
      }
    }

    // ABSOLUTE FAILURE: Fell to death
    if (agentPos.y < this.config.fallThreshold) {
      return true;
    }

    // ABSOLUTE FAILURE: Out of bounds
    if (this.isOutOfBounds()) {
      return true;
    }

    // TIMEOUT: Max steps reached
    if (this.currentStep >= this.config.maxSteps) {
      return true;
    }

    return false;
  }

  /**
   * Execute one environment step
   * @param {number} action - Action integer (0-5)
   * @returns {Object} Step result {state, reward, done, info}
   */
  step(action) {
    if (!this.agentBody) {
      console.error('Agent body not initialized, cannot step environment');
      return {
        state: new Float32Array(13),
        reward: 0,
        done: true,
        info: { error: 'Agent not initialized' }
      };
    }

    // Get previous state before taking action
    const prevState = this.getState();

    // Map action integer to force vector based on action constants
    const actionForces = this.config.actionForces;
    let forceVector = { x: 0, y: 0, z: 0 };
    let useImpulse = false;

    switch (action) {
      case this.ACTION_SPACE.FORWARD:
        forceVector = { x: 0, y: 0, z: -actionForces.move };
        break;
      case this.ACTION_SPACE.BACKWARD:
        forceVector = { x: 0, y: 0, z: actionForces.move };
        break;
      case this.ACTION_SPACE.LEFT:
        forceVector = { x: -actionForces.move, y: 0, z: 0 };
        break;
      case this.ACTION_SPACE.RIGHT:
        forceVector = { x: actionForces.move, y: 0, z: 0 };
        break;
      case this.ACTION_SPACE.JUMP:
        // Only allow jump if grounded and cooldown expired
        if (this.isGrounded() && this.jumpCooldown === 0) {
          forceVector = { x: 0, y: actionForces.jump, z: 0 };
          useImpulse = true; // Jump uses impulse for instant effect
          this.jumpCooldown = this.jumpCooldownSteps; // Start cooldown
        } else {
          // Jump failed - no force applied
          forceVector = { x: 0, y: 0, z: 0 };
        }
        break;
      case this.ACTION_SPACE.GRAB:
        // Grab only works when touching a ledge
        const touchingLedge = this.isTouchingLedge();
        if (touchingLedge) {
          forceVector = { x: 0, y: actionForces.grab, z: 0 };
        } else {
          // Grab failed - no force applied
          forceVector = { x: 0, y: 0, z: 0 };
        }
        break;
      default:
        console.warn('Invalid action:', action);
        break;
    }

    // Apply force or impulse to agent body via physics engine
    if (useImpulse) {
      this.physicsEngine.applyImpulse(this.agentBody, forceVector);
    } else {
      this.physicsEngine.applyForce(this.agentBody, forceVector);
    }

    // Step physics simulation forward by one timestep
    this.physicsEngine.step();

    // Get new state after physics step
    const newState = this.getState();

    // Calculate reward using calculateReward()
    const reward = this.calculateReward(prevState, action, newState);

    // Check termination conditions (fallen, goal reached, max steps)
    const done = this.isTerminal();

    // Increment step counter
    this.currentStep++;

    // Update total reward
    this.totalReward += reward;

    // Decrement jump cooldown
    if (this.jumpCooldown > 0) {
      this.jumpCooldown--;
    }

    // Create info object with additional debug information
    const agentPos = this.physicsEngine.getBodyPosition(this.agentBody);
    const info = {
      step: this.currentStep,
      totalReward: this.totalReward,
      agentPosition: agentPos,
      action: action,
      actionName: Object.keys(this.ACTION_SPACE)[action] || 'UNKNOWN'
    };

    // Record trajectory step if enabled
    if (this.recordTrajectories) {
      this.currentTrajectory.push({
        step: this.currentStep,
        position: { ...agentPos },
        action: action,
        actionName: info.actionName,
        reward: reward,
        totalReward: this.totalReward,
        timestamp: Date.now()
      });

      // If episode is done, save the trajectory
      if (done) {
        const currentStep = this.detectCurrentStep();
        const trajectoryData = {
          episode: this.episodeCount || this.trajectoryHistory.length + 1,
          steps: [...this.currentTrajectory],
          success: currentStep === 10, // Success = reached goal platform
          totalReward: this.totalReward,
          stepCount: this.currentStep,
          highestStep: this.highestStepReached,
          duration: Date.now() - this.episodeStartTime,
          finalPosition: { ...agentPos },
          finalStep: currentStep
        };

        this.trajectoryHistory.push(trajectoryData);

        // Keep only the last N trajectories
        if (this.trajectoryHistory.length > this.maxTrajectories) {
          this.trajectoryHistory.shift();
        }
      }
    }

    // Add termination reason to info if episode is done
    if (done) {
      const currentStep = this.detectCurrentStep();
      if (currentStep === 10) {
        info.terminationReason = 'goal_reached';
        info.success = true;
      } else if (this.isOutOfBounds()) {
        info.terminationReason = 'out_of_bounds';
      } else if (agentPos.y < this.config.fallThreshold) {
        info.terminationReason = 'fallen';
      } else if (this.currentStep >= this.config.maxSteps) {
        info.terminationReason = 'max_steps';
      } else if (currentStep < 0 && this.safetyBuffer <= 0) {
        info.terminationReason = 'buffer_expired';
      }
    }

    // Return {state, reward, done, info} object
    return {
      state: newState,
      reward: reward,
      done: done,
      info: info
    };
  }
}