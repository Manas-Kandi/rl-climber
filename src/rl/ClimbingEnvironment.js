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
    
    // Trajectory recording
    this.recordTrajectories = false;
    this.currentTrajectory = [];
    this.trajectoryHistory = [];
    this.maxTrajectories = 100; // Keep last 100 episodes
    
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
        heightGain: config.rewardWeights?.heightGain || 1.0,
        goalReached: config.rewardWeights?.goalReached || 100.0,
        survival: config.rewardWeights?.survival || 0.1,
        fall: config.rewardWeights?.fall || -50.0,
        timePenalty: config.rewardWeights?.timePenalty || -0.01,
        ledgeGrab: config.rewardWeights?.ledgeGrab || 5.0
      },
      
      // Environment dimensions
      goalHeight: config.goalHeight || 14.0,
      fallThreshold: config.fallThreshold || -2.0,
      
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
    
    // Reset agent body position to start position (0, 1, 0)
    const startPos = this.config.agent.startPosition;
    this.physicsEngine.setBodyPosition(this.agentBody, startPos);
    
    // Reset agent body velocity to zero
    this.physicsEngine.setBodyVelocity(this.agentBody, { x: 0, y: 0, z: 0 });
    
    // Reset episode step counter to 0
    this.currentStep = 0;
    
    // Reset total reward to 0
    this.totalReward = 0;
    
    // Record episode start time
    this.episodeStartTime = Date.now();
    
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
    
    console.log('Environment reset - Agent at:', startPos, 'Initial state:', initialState);
    return initialState;
  }
  
  /**
   * Calculate reward for the current step
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
    
    // Calculate height gain reward: (newY - prevY) * heightGainWeight
    if (prevState && newState) {
      // Previous Y is normalized by dividing by 15.0, so multiply to denormalize
      const prevY = prevState[1] * 15.0;
      const newY = agentPos.y;
      const heightGain = newY - prevY;
      
      if (heightGain > 0) {
        totalReward += heightGain * this.config.rewardWeights.heightGain;
      }
    }
    
    // Add survival reward: +0.1 per step
    totalReward += this.config.rewardWeights.survival;
    
    // Add time penalty: -0.01 per step
    totalReward += this.config.rewardWeights.timePenalty;
    
    // Check if goal reached: add +100 if agent Y >= goalHeight
    if (agentPos.y >= this.config.goalHeight) {
      totalReward += this.config.rewardWeights.goalReached;
    }
    
    // Check if fallen: add -50 if agent Y < fallThreshold
    if (agentPos.y < this.config.fallThreshold) {
      totalReward += this.config.rewardWeights.fall;
    }
    
    // Check if ledge grabbed: add +5 if collision with ledge detected
    const collidingBodies = this.physicsEngine.getCollidingBodies(this.agentBody);
    for (const body of collidingBodies) {
      // Check if colliding body is a ledge (bodies with 'ledge' in their ID)
      const bodyId = this.getBodyId(body);
      if (bodyId && bodyId.includes('ledge')) {
        totalReward += this.config.rewardWeights.ledgeGrab;
        break; // Only reward once per step even if touching multiple ledges
      }
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
    
    // Episode ends if agent falls below threshold
    if (agentPos.y < this.config.fallThreshold) {
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
        forceVector = { x: 0, y: actionForces.jump, z: 0 };
        useImpulse = true; // Jump uses impulse for instant effect
        break;
      case this.ACTION_SPACE.GRAB:
        // Grab applies a small upward force to help with ledge grabbing
        forceVector = { x: 0, y: actionForces.grab, z: 0 };
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
      if (agentPos.y < this.config.fallThreshold) {
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