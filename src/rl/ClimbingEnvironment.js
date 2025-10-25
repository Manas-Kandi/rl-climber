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
    
    // Trajectory recording
    this.recordTrajectories = false;
    this.currentTrajectory = [];
    this.trajectoryHistory = [];
    this.maxTrajectories = 100; // Keep last 100 episodes
    
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
      maxSteps: config.maxSteps || 500,
      
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
        startPosition: config.agent?.startPosition || { x: 0, y: 1, z: 0 },
        size: config.agent?.size || 0.5,
        mass: config.agent?.mass || 1.0
      },
      
      // Ledge positions for distance calculations
      ledgePositions: config.ledgePositions || [
        {position: {x: 0, y: 2, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: 1, y: 4, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: -1, y: 6, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: 0, y: 8, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: 1, y: 10, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: 0, y: 12, z: -5}, size: {x: 2, y: 0.2, z: 1}}
      ],
      
      // Action forces
      actionForces: {
        move: config.actionForces?.move || 5.0,
        jump: config.actionForces?.jump || 8.0,
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
   * @returns {number} State vector dimensionality (9)
   */
  getStateSpace() {
    return 9; // [x, y, z, vx, vy, vz, distGoal, distLedge, progress]
  }
  
  /**
   * Get current episode statistics
   * @returns {Object} Episode stats {steps, totalReward, success}
   */
  getEpisodeStats() {
    const agentPos = this.physicsEngine.getBodyPosition(this.agentBody);
    const success = agentPos.y >= this.config.goalHeight;
    
    return {
      steps: this.currentStep,
      totalReward: this.totalReward,
      success: success
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
   * Clear trajectory history
   */
  clearTrajectoryHistory() {
    this.trajectoryHistory = [];
    this.currentTrajectory = [];
    console.log('📹 Trajectory history cleared');
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
   * Get current state representation as 9D Float32Array
   * State vector: [x, y, z, vx, vy, vz, distGoal, distLedge, progress]
   * @returns {Float32Array} Normalized state vector
   */
  getState() {
    if (!this.agentBody) {
      console.error('Agent body not initialized');
      return new Float32Array(9);
    }
    
    // Extract agent position and velocity from physics engine
    const position = this.physicsEngine.getBodyPosition(this.agentBody);
    const velocity = this.physicsEngine.getBodyVelocity(this.agentBody);
    
    // Calculate distance to goal using Euclidean distance
    const goalPosition = { x: 0, y: this.config.goalHeight, z: -4 };
    const distanceToGoal = Math.sqrt(
      Math.pow(position.x - goalPosition.x, 2) +
      Math.pow(position.y - goalPosition.y, 2) +
      Math.pow(position.z - goalPosition.z, 2)
    );
    
    // Calculate distance to nearest ledge by iterating ledge positions
    let distanceToNearestLedge = Infinity;
    for (const ledge of this.config.ledgePositions) {
      const ledgePos = ledge.position;
      const distance = Math.sqrt(
        Math.pow(position.x - ledgePos.x, 2) +
        Math.pow(position.y - ledgePos.y, 2) +
        Math.pow(position.z - ledgePos.z, 2)
      );
      distanceToNearestLedge = Math.min(distanceToNearestLedge, distance);
    }
    
    // Calculate episode progress as currentStep / maxSteps
    const episodeProgress = this.currentStep / this.config.maxSteps;
    
    // Create state vector and normalize values to appropriate ranges
    const state = new Float32Array(9);
    
    // Normalize position to [-1, 1] range (assuming world bounds of ±10)
    state[0] = Math.max(-1, Math.min(1, position.x / 10.0));  // x position
    state[1] = Math.max(-1, Math.min(1, position.y / 15.0));  // y position (0-15 range)
    state[2] = Math.max(-1, Math.min(1, position.z / 10.0));  // z position
    
    // Normalize velocity to [-1, 1] range (assuming max velocity of ±20)
    state[3] = Math.max(-1, Math.min(1, velocity.x / 20.0));  // x velocity
    state[4] = Math.max(-1, Math.min(1, velocity.y / 20.0));  // y velocity
    state[5] = Math.max(-1, Math.min(1, velocity.z / 20.0));  // z velocity
    
    // Normalize distance to goal to [0, 1] range (max distance ~20)
    state[6] = Math.max(0, Math.min(1, distanceToGoal / 20.0));
    
    // Normalize distance to nearest ledge to [0, 1] range (max distance ~15)
    state[7] = Math.max(0, Math.min(1, distanceToNearestLedge / 15.0));
    
    // Episode progress is already in [0, 1] range
    state[8] = Math.max(0, Math.min(1, episodeProgress));
    
    return state;
  }
  
  /**
   * Reset the environment to initialize a new episode
   * @returns {Float32Array} Initial state as 9D Float32Array
   */
  reset() {
    if (!this.agentBody) {
      console.error('Agent body not initialized, cannot reset environment');
      return new Float32Array(9);
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
    
    // Check if on goal
    if (agentPos.y >= this.config.goalHeight - 0.5) {
      return 10; // Goal
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
        
        // Tighter tolerance: agent must be within 0.8 units of step top
        // This allows for agent height (0.5) plus small margin
        if (heightDiff < 0.8) {
          return i;
        }
      }
    }
    
    // Default to ground
    return -1;
  }

  /**
   * Check if agent is out of bounds (off the platform)
   * @returns {boolean} True if agent is outside boundary limits
   */
  isOutOfBounds() {
    if (!this.agentBody) return false;
    
    const agentPos = this.physicsEngine.getBodyPosition(this.agentBody);
    
    // Check if agent is outside X or Z boundaries
    if (Math.abs(agentPos.x) > this.config.boundaryX || 
        Math.abs(agentPos.z) > this.config.boundaryZ) {
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
    
    // IMPROVED: More lenient velocity check for better grounding detection
    if (Math.abs(agentVel.y) > 3.0) {
      return false;
    }
    
    // Check if agent is in contact with ground or ledges
    const collidingBodies = this.physicsEngine.getCollidingBodies(this.agentBody);
    
    for (const body of collidingBodies) {
      const bodyId = this.getBodyId(body);
      // Agent is grounded if touching ground or any ledge
      if (bodyId && (bodyId === 'ground' || bodyId.includes('ledge'))) {
        return true;
      }
    }
    
    // FALLBACK: Check if agent is very close to ground level
    // This helps when collision detection is unreliable
    if (agentPos.y <= 1.2 && Math.abs(agentVel.y) < 1.0) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate reward for the current step - PSYCHOLOGY-BASED REWARD SYSTEM
   * 
   * KEY PRINCIPLES:
   * 1. Make "doing nothing" NEGATIVE (baseline is -0.5, not 0)
   * 2. Make progress HIGHLY POSITIVE (20-50 points per step)
   * 3. Make failures LESS PUNISHING (-5 to -10, not -15 to -45)
   * 4. Add TIME DECAY (rewards decrease if staying on same step)
   * 5. Add EXPLORATION BONUS (reward trying new actions)
   * 
   * This makes the risk/reward ratio favor exploration over stagnation!
   * 
   * Range: -50 (worst behavior) to +100 (goal reached)
   * @param {Float32Array} prevState - Previous state vector
   * @param {number} action - Action taken
   * @param {Float32Array} newState - New state vector after action
   * @returns {number} Total reward for this step
   */
  calculateReward(prevState, action, newState) {
    let totalReward = 0;
    
    if (!this.agentBody) {
      return totalReward;
    }
    
    const agentPos = this.physicsEngine.getBodyPosition(this.agentBody);
    
    // Detect current step and track movement
    const currentStep = this.detectCurrentStep();
    const prevStepOn = this.currentStepOn;
    
    // Track time on current step for decay rewards
    if (this.currentStepOn === currentStep) {
      this.timeOnCurrentStep++;
    } else {
      this.timeOnCurrentStep = 0;
      this.currentStepOn = currentStep;
    }
    
    // Track time on current position for stagnation detection
    if (!this.lastPosition) {
      this.lastPosition = { ...agentPos };
      this.stagnationTimer = 0;
    }
    
    const positionChange = Math.sqrt(
      Math.pow(agentPos.x - this.lastPosition.x, 2) +
      Math.pow(agentPos.y - this.lastPosition.y, 2) +
      Math.pow(agentPos.z - this.lastPosition.z, 2)
    );
    
    if (positionChange < 0.1) {
      this.stagnationTimer++;
    } else {
      this.stagnationTimer = 0;
      this.lastPosition = { ...agentPos };
    }
    
    // === 1. BASELINE: DOING NOTHING IS NEGATIVE ===
    // This is the KEY psychological shift - make 0 unattractive!
    totalReward -= 0.5; // Every step costs -0.5 by default
    
    // === 2. GOAL REACHED: MAXIMUM REWARD ===
    if (agentPos.y >= this.config.goalHeight) {
      totalReward += 100.0; // ONLY way to get +100
      console.log('🏆 GOAL REACHED! +100 (MAXIMUM REWARD)');
      return totalReward; // Return immediately, no other rewards matter
    }
    
    // === 3. STEP PROGRESSION: HUGE POSITIVE REWARDS ===
    // Make progress 4-10x more valuable than penalties!
    if (currentStep > this.highestStepReached && currentStep >= 0) {
      // MASSIVE rewards: Step 0=+50, Step 1=+45, Step 2=+40, ..., Step 9=+5
      const stepReward = 50 - (currentStep * 5);
      totalReward += stepReward;
      this.highestStepReached = currentStep;
      this.stepsVisited.add(currentStep);
      console.log(`🎯 NEW STEP ${currentStep}! Reward: +${stepReward} (HUGE!)`);
    }
    
    // === 4. TIME DECAY: REWARDS DECREASE IF STAYING ON SAME STEP ===
    // This prevents "camping" on a step
    if (currentStep >= 0 && this.timeOnCurrentStep > 0) {
      // Decay formula: First 30 steps = +2, next 30 = +1, next 30 = 0, then negative
      let decayReward = 0;
      if (this.timeOnCurrentStep <= 30) {
        decayReward = 2.0; // Still good
      } else if (this.timeOnCurrentStep <= 60) {
        decayReward = 1.0; // Getting worse
      } else if (this.timeOnCurrentStep <= 90) {
        decayReward = 0.0; // Neutral
      } else {
        decayReward = -1.0 * Math.min(5, (this.timeOnCurrentStep - 90) / 30); // Max -5
      }
      totalReward += decayReward;
      
      if (this.timeOnCurrentStep % 60 === 0 && this.timeOnCurrentStep > 60) {
        console.log(`⏱️ TIME DECAY on step ${currentStep}: ${decayReward.toFixed(1)} (been here ${(this.timeOnCurrentStep/60).toFixed(1)}s)`);
      }
    }
    
    // === 5. REDUCED PUNISHMENTS FOR FAILURES ===
    // Make failures hurt less so risk-taking is more attractive!
    
    // 5a. JUMPING OFF STAIRS (Moving to lower step) - REDUCED PENALTY
    if (prevStepOn >= 0 && currentStep >= 0 && currentStep < prevStepOn) {
      const jumpOffPenalty = -5 * (prevStepOn - currentStep); // Was -15, now -5
      totalReward += jumpOffPenalty;
      console.log(`💥 JUMPED DOWN from step ${prevStepOn} to ${currentStep}! Penalty: ${jumpOffPenalty} (reduced)`);
    }
    
    // 5b. FALLING OFF STAIRS (Going from step to ground) - REDUCED PENALTY
    if (prevStepOn >= 0 && currentStep === -1) {
      const fallOffPenalty = -10; // Was -25, now -10
      totalReward += fallOffPenalty;
      console.log(`💥 FELL OFF STAIRS from step ${prevStepOn}! Penalty: ${fallOffPenalty} (reduced)`);
    }
    
    // 5c. STAGNATION PUNISHMENT (Staying in one place) - INCREASED
    if (this.stagnationTimer >= 30) { // Trigger faster (was 60)
      const stagnationPenalty = -1.0 * Math.min(10, (this.stagnationTimer - 30) / 10); // Max -10
      totalReward += stagnationPenalty;
      if (this.stagnationTimer % 30 === 0) { // Log more frequently
        console.log(`😴 STAGNATION! No movement for ${(this.stagnationTimer/60).toFixed(1)}s. Penalty: ${stagnationPenalty.toFixed(1)}`);
      }
    }
    
    // === 6. TERMINAL PUNISHMENTS (Episode ending) - REDUCED ===
    
    // 6a. Falling below ground - REDUCED PENALTY
    if (agentPos.y < this.config.fallThreshold) {
      totalReward += -50.0; // Was -100, now -50
      console.log('💀 FELL TO DEATH! Penalty: -50 (reduced to encourage risk)');
      return totalReward;
    }
    
    // 6b. Going out of bounds - REDUCED PENALTY
    if (this.isOutOfBounds()) {
      totalReward += -50.0; // Was -100, now -50
      console.log('🚫 OUT OF BOUNDS! Penalty: -50 (reduced to encourage exploration)');
      return totalReward;
    }
    
    // === 7. EXPLORATION BONUS ===
    // Small bonus for taking ANY action (encourages trying things)
    if (action !== undefined && action !== null) {
      totalReward += 0.2; // Small exploration bonus
    }
    
    // === 8. SMALL GUIDANCE REWARDS ===
    
    // 8a. Being on stairs is GOOD (but not as good as progressing)
    if (currentStep >= 0) {
      totalReward += 1.0; // Decent bonus for being on stairs
    } else {
      totalReward -= 1.0; // Penalty for being on ground (on top of baseline -0.5)
    }
    
    // 8b. Forward progress bonus (approaching stairs)
    if (agentPos.z < 2 && agentPos.z > -20) {
      const forwardBonus = Math.max(0, (2 - agentPos.z)) * 0.1; // Max +0.2
      totalReward += forwardBonus;
    }
    
    // 8c. Penalty for being off-center (but small)
    if (Math.abs(agentPos.x) > 1.5) {
      totalReward -= 0.3;
    }
    
    // === 9. CLAMP FINAL REWARD TO RANGE [-50, +100] ===
    totalReward = Math.max(-50, Math.min(100, totalReward));
    
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
    
    // Episode ends if agent falls below threshold
    if (agentPos.y < this.config.fallThreshold) {
      return true;
    }
    
    // Episode ends if agent goes out of bounds
    if (this.isOutOfBounds()) {
      return true;
    }
    
    // Episode ends if agent reaches goal
    if (agentPos.y >= this.config.goalHeight) {
      return true;
    }
    
    // Episode ends if max steps reached
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
        state: new Float32Array(9),
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
        this.trajectoryHistory.push({
          episode: this.trajectoryHistory.length + 1,
          trajectory: [...this.currentTrajectory],
          success: agentPos.y >= this.config.goalHeight,
          totalReward: this.totalReward,
          steps: this.currentStep,
          duration: Date.now() - this.episodeStartTime
        });
        
        // Keep only the last N trajectories
        if (this.trajectoryHistory.length > this.maxTrajectories) {
          this.trajectoryHistory.shift();
        }
      }
    }
    
    // Add termination reason to info if episode is done
    if (done) {
      if (this.isOutOfBounds()) {
        info.terminationReason = 'out_of_bounds';
      } else if (agentPos.y < this.config.fallThreshold) {
        info.terminationReason = 'fallen';
      } else if (agentPos.y >= this.config.goalHeight) {
        info.terminationReason = 'goal_reached';
      } else if (this.currentStep >= this.config.maxSteps) {
        info.terminationReason = 'max_steps';
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