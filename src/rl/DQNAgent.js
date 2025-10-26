import * as tf from '@tensorflow/tfjs';

/**
 * Deep Q-Network (DQN) Agent for the climbing game
 * Implements Q-learning with experience replay and target network
 */
export class DQNAgent {
  /**
   * Create a DQN agent
   * @param {number} stateSize - Dimension of state space (9)
   * @param {number} actionSize - Number of discrete actions (6)
   * @param {Object} config - Configuration object
   */
  constructor(stateSize = 9, actionSize = 6, config = {}) {
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    
    // Hyperparameters
    this.gamma = config.gamma || 0.99;           // Discount factor
    this.epsilon = config.epsilon || 1.0;       // Exploration rate
    this.epsilonMin = config.epsilonMin || 0.01; // Minimum exploration rate
    this.epsilonDecay = config.epsilonDecay || 0.995; // Exploration decay rate
    this.learningRate = config.learningRate || 0.0003;
    this.bufferSize = config.bufferSize || 10000; // Experience replay buffer size
    this.batchSize = config.batchSize || 32;
    this.targetUpdateFreq = config.targetUpdateFreq || 100; // Episodes between target network updates
    
    // Experience replay buffer
    this.memory = [];
    this.memoryIndex = 0;
    
    // Networks
    this.qNetwork = null;
    this.targetNetwork = null;
    this.optimizer = null;
    
    // Training tracking
    this.episodeCount = 0;
    
    this.init();
  }
  
  /**
   * Initialize the agent by building networks and optimizer
   */
  init() {
    // Use Adam optimizer with gradient clipping
    this.optimizer = tf.train.adam(this.learningRate);
    this.qNetwork = this.buildQNetwork();
    this.targetNetwork = this.buildTargetNetwork();
    
    // Check for NaN in initial weights and reinitialize if needed
    this.checkAndFixNaNWeights();
    
    console.log('DQN Agent initialized');
    console.log(`State size: ${this.stateSize}, Action size: ${this.actionSize}`);
    console.log(`Gamma: ${this.gamma}, Learning rate: ${this.learningRate}`);
  }
  
  /**
   * Check if networks have NaN weights and reinitialize if needed
   */
  checkAndFixNaNWeights() {
    // Check Q-network
    const qWeights = this.qNetwork.getWeights();
    let hasNaN = false;
    
    for (const weight of qWeights) {
      const data = weight.dataSync();
      if (data.some(v => !isFinite(v))) {
        hasNaN = true;
        console.warn('⚠️  Q-network has NaN/Inf weights, reinitializing...');
        break;
      }
    }
    
    if (hasNaN) {
      // Dispose old network
      this.qNetwork.dispose();
      // Build new one
      this.qNetwork = this.buildQNetwork();
      console.log('✅ Q-network reinitialized');
    }
    
    // Check target network
    const targetWeights = this.targetNetwork.getWeights();
    hasNaN = false;
    
    for (const weight of targetWeights) {
      const data = weight.dataSync();
      if (data.some(v => !isFinite(v))) {
        hasNaN = true;
        console.warn('⚠️  Target network has NaN/Inf weights, reinitializing...');
        break;
      }
    }
    
    if (hasNaN) {
      // Dispose old network
      this.targetNetwork.dispose();
      // Build new one
      this.targetNetwork = this.buildTargetNetwork();
      console.log('✅ Target network reinitialized');
    }
  }
  
  /**
   * Build the main Q-network
   * Architecture: Input(9) → Dense(64, ReLU) → Dense(64, ReLU) → Dense(6, Linear)
   * @returns {tf.LayersModel} The Q-network model
   */
  buildQNetwork() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.stateSize],
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal',
          name: 'hidden1'
        }),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal',
          name: 'hidden2'
        }),
        tf.layers.dense({
          units: this.actionSize,
          activation: 'linear',
          kernelInitializer: 'heNormal',
          name: 'output'
        })
      ]
    });
    
    model.compile({
      optimizer: this.optimizer,
      loss: 'meanSquaredError'
    });
    
    return model;
  }
  
  /**
   * Build the target network with same architecture as Q-network
   * @returns {tf.LayersModel} The target network model
   */
  buildTargetNetwork() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.stateSize],
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal',
          name: 'target_hidden1'
        }),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal',
          name: 'target_hidden2'
        }),
        tf.layers.dense({
          units: this.actionSize,
          activation: 'linear',
          kernelInitializer: 'heNormal',
          name: 'target_output'
        })
      ]
    });
    
    // Copy weights from main network to target network
    this.copyWeights(this.qNetwork, model);
    
    return model;
  }
  
  /**
   * Copy weights from source model to target model
   * @param {tf.LayersModel} sourceModel - Source model to copy from
   * @param {tf.LayersModel} targetModel - Target model to copy to
   */
  copyWeights(sourceModel, targetModel) {
    if (!sourceModel || !targetModel) return;
    
    const sourceWeights = sourceModel.getWeights();
    targetModel.setWeights(sourceWeights);
  }
  
  /**
   * Get current hyperparameters
   * @returns {Object} Current hyperparameters
   */
  getHyperparameters() {
    return {
      gamma: this.gamma,
      epsilon: this.epsilon,
      epsilonMin: this.epsilonMin,
      epsilonDecay: this.epsilonDecay,
      learningRate: this.learningRate,
      bufferSize: this.bufferSize,
      batchSize: this.batchSize,
      targetUpdateFreq: this.targetUpdateFreq
    };
  }
  
  /**
   * Set epsilon value for exploration
   * @param {number} epsilon - New epsilon value
   */
  setEpsilon(epsilon) {
    this.epsilon = Math.max(epsilon, this.epsilonMin);
  }
  
  /**
   * Set learning rate
   * @param {number} lr - New learning rate
   */
  setLearningRate(lr) {
    this.learningRate = lr;
    // Create new optimizer with updated learning rate
    this.optimizer = tf.train.adam(this.learningRate);
    this.qNetwork.compile({
      optimizer: this.optimizer,
      loss: 'meanSquaredError'
    });
  }
  
  /**
   * Select action using epsilon-greedy policy
   * @param {Float32Array|Array} state - Current state (9D)
   * @param {number} epsilon - Exploration rate (optional, uses instance epsilon if not provided)
   * @returns {number} Selected action index [0-5]
   */
  selectAction(state, epsilon = null) {
    if (epsilon === null) {
      epsilon = this.epsilon;
    }
    
    // Ensure state is properly formatted
    if (!state || state.length !== this.stateSize) {
      throw new Error(`Invalid state: expected length ${this.stateSize}, got ${state ? state.length : 'null'}`);
    }
    
    return tf.tidy(() => {
      // Generate random number for epsilon-greedy decision
      const randomValue = Math.random();
      
      if (randomValue < epsilon) {
        // Exploration: return random action from [0, 5]
        return Math.floor(Math.random() * this.actionSize);
      } else {
        // Exploitation: run forward pass through Q-network and return argmax
        const stateTensor = tf.tensor2d([Array.from(state)], [1, this.stateSize]);
        const qValues = this.qNetwork.predict(stateTensor);
        const actionIndex = qValues.argMax(1).dataSync()[0];
        
        return actionIndex;
      }
    });
  }
  
  /**
   * Get Q-values for a given state (for debugging/visualization)
   * @param {Float32Array|Array} state - Current state (9D)
   * @returns {Array} Q-values for all actions
   */
  getQValues(state) {
    if (!state || state.length !== this.stateSize) {
      throw new Error(`Invalid state: expected length ${this.stateSize}, got ${state ? state.length : 'null'}`);
    }
    
    return tf.tidy(() => {
      const stateTensor = tf.tensor2d([Array.from(state)], [1, this.stateSize]);
      const qValues = this.qNetwork.predict(stateTensor);
      return Array.from(qValues.dataSync());
    });
  }
  
  /**
   * Decay epsilon for exploration schedule
   */
  decayEpsilon() {
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
  }
  
  /**
   * Store experience in replay buffer
   * @param {Float32Array|Array} state - Current state
   * @param {number} action - Action taken
   * @param {number} reward - Reward received
   * @param {Float32Array|Array} nextState - Next state
   * @param {boolean} done - Whether episode is done
   */
  remember(state, action, reward, nextState, done) {
    // Validate inputs
    if (!state || state.length !== this.stateSize) {
      throw new Error(`Invalid state: expected length ${this.stateSize}, got ${state ? state.length : 'null'}`);
    }
    if (!nextState || nextState.length !== this.stateSize) {
      throw new Error(`Invalid nextState: expected length ${this.stateSize}, got ${nextState ? nextState.length : 'null'}`);
    }
    if (!Number.isInteger(action) || action < 0 || action >= this.actionSize) {
      throw new Error(`Invalid action: expected integer in [0, ${this.actionSize - 1}], got ${action}`);
    }
    if (typeof reward !== 'number' || !isFinite(reward)) {
      throw new Error(`Invalid reward: expected finite number, got ${reward}`);
    }
    if (typeof done !== 'boolean') {
      throw new Error(`Invalid done flag: expected boolean, got ${done}`);
    }
    
    const experience = {
      state: Array.from(state),
      action: action,
      reward: reward,
      nextState: Array.from(nextState),
      done: done
    };
    
    // Implement circular buffer logic (overwrite oldest when full)
    if (this.memory.length < this.bufferSize) {
      this.memory.push(experience);
    } else {
      this.memory[this.memoryIndex] = experience;
      this.memoryIndex = (this.memoryIndex + 1) % this.bufferSize;
    }
  }
  
  /**
   * Sample random batch from experience replay buffer
   * @param {number} batchSize - Size of batch to sample
   * @returns {Object} Batch containing arrays of states, actions, rewards, nextStates, dones
   */
  replay(batchSize = null) {
    if (batchSize === null) {
      batchSize = this.batchSize;
    }
    
    // Check if we have enough experiences
    if (this.memory.length < batchSize) {
      throw new Error(`Not enough experiences: need ${batchSize}, have ${this.memory.length}`);
    }
    
    // Sample batchSize experiences uniformly from buffer
    const batch = {
      states: [],
      actions: [],
      rewards: [],
      nextStates: [],
      dones: []
    };
    
    const sampledIndices = new Set();
    
    // Sample unique random indices
    while (sampledIndices.size < batchSize) {
      const randomIndex = Math.floor(Math.random() * this.memory.length);
      sampledIndices.add(randomIndex);
    }
    
    // Extract experiences at sampled indices
    for (const index of sampledIndices) {
      const experience = this.memory[index];
      batch.states.push(experience.state);
      batch.actions.push(experience.action);
      batch.rewards.push(experience.reward);
      batch.nextStates.push(experience.nextState);
      batch.dones.push(experience.done);
    }
    
    return batch;
  }
  
  /**
   * Get current memory buffer size
   * @returns {number} Number of experiences in buffer
   */
  getMemorySize() {
    return this.memory.length;
  }
  
  /**
   * Check if buffer has enough experiences for training
   * @param {number} minSize - Minimum number of experiences needed
   * @returns {boolean} Whether buffer has enough experiences
   */
  canTrain(minSize = null) {
    if (minSize === null) {
      minSize = this.batchSize;
    }
    return this.memory.length >= minSize;
  }
  
  /**
   * Clear the experience replay buffer
   */
  clearMemory() {
    this.memory = [];
    this.memoryIndex = 0;
  }
  
  /**
   * Train the Q-network using experience replay
   * @param {number} batchSize - Size of batch to sample (optional)
   * @returns {Object} Training results containing loss value
   */
  train(batchSize = null) {
    if (!this.canTrain(batchSize)) {
      throw new Error('Not enough experiences to train');
    }
    
    // Sample batch from replay buffer
    const batch = this.replay(batchSize);
    
    return tf.tidy(() => {
      // Convert batch data to tensors
      const states = tf.tensor2d(batch.states);
      const nextStates = tf.tensor2d(batch.nextStates);
      const actions = batch.actions;
      const rewards = batch.rewards;
      const dones = batch.dones;
      
      // Compute current Q-values: qNetwork(state)[action]
      const currentQValues = this.qNetwork.predict(states);
      
      // Compute target Q-values: reward + gamma * max(targetNetwork(nextState)) for non-terminal states
      const nextQValues = this.targetNetwork.predict(nextStates);
      const maxNextQValues = nextQValues.max(1);
      
      // Create target Q-values tensor
      const targetQValues = currentQValues.clone();
      const targetQValuesData = targetQValues.dataSync();
      const maxNextQValuesData = maxNextQValues.dataSync();
      
      // Update target Q-values for the actions that were taken
      for (let i = 0; i < batch.states.length; i++) {
        const action = actions[i];
        const reward = rewards[i];
        const done = dones[i];
        const maxNextQ = maxNextQValuesData[i];
        
        // Check for NaN/Infinity in inputs
        if (!isFinite(reward)) {
          console.error(`Invalid reward at index ${i}: ${reward}`);
          continue;
        }
        if (!isFinite(maxNextQ)) {
          console.error(`Invalid maxNextQ at index ${i}: ${maxNextQ}`);
          continue;
        }
        
        // Q-learning update: Q(s,a) = reward + gamma * max(Q(s',a')) if not done, else reward
        let targetValue = done ? reward : reward + this.gamma * maxNextQ;
        
        // Clip target value to prevent explosion
        targetValue = Math.max(-100, Math.min(100, targetValue));
        
        // Update the target Q-value for the specific action
        const flatIndex = i * this.actionSize + action;
        targetQValuesData[flatIndex] = targetValue;
      }
      
      // Create updated target tensor
      const updatedTargets = tf.tensor(targetQValuesData, targetQValues.shape);
      
      // Perform gradient descent using optimizer.minimize() with gradient clipping
      let lossValue;
      const grads = tf.variableGrads(() => {
        const predictions = this.qNetwork.predict(states);
        const loss = tf.losses.meanSquaredError(updatedTargets, predictions);
        lossValue = loss.dataSync()[0];
        return loss;
      });
      
      // Clip gradients to prevent explosion
      const clippedGrads = {};
      const clipNorm = 1.0;  // Clip gradients to max norm of 1.0
      
      for (const varName in grads.grads) {
        const grad = grads.grads[varName];
        // Clip by global norm
        const norm = tf.norm(grad).dataSync()[0];
        if (norm > clipNorm) {
          clippedGrads[varName] = tf.mul(grad, clipNorm / norm);
        } else {
          clippedGrads[varName] = grad;
        }
      }
      
      // Apply clipped gradients
      this.optimizer.applyGradients(clippedGrads);
      
      // Dispose gradients manually
      Object.values(grads.grads).forEach(grad => grad.dispose());
      
      // Check for NaN in weights after training
      const weights = this.qNetwork.getWeights();
      let hasNaN = false;
      for (const weight of weights) {
        const data = weight.dataSync();
        if (data.some(v => !isFinite(v))) {
          hasNaN = true;
          console.error('❌ NaN detected in weights after training! Reinitializing network...');
          // Reinitialize network
          this.qNetwork.dispose();
          this.qNetwork = this.buildQNetwork();
          this.updateTargetNetwork();
          break;
        }
      }
      
      return {
        loss: lossValue,
        batchSize: batch.states.length,
        epsilon: this.epsilon,
        hasNaN: hasNaN
      };
    });
  }
  
  /**
   * Perform a single training step with provided batch
   * This is a lower-level method that doesn't sample from replay buffer
   * @param {Object} batch - Batch containing states, actions, rewards, nextStates, dones
   * @returns {Object} Training results containing loss value
   */
  trainBatch(batch) {
    if (!batch || !batch.states || !batch.actions || !batch.rewards || !batch.nextStates || !batch.dones) {
      throw new Error('Invalid batch: missing required fields');
    }
    
    if (batch.states.length === 0) {
      throw new Error('Empty batch provided');
    }
    
    return tf.tidy(() => {
      // Convert batch data to tensors
      const states = tf.tensor2d(batch.states);
      const nextStates = tf.tensor2d(batch.nextStates);
      const actions = batch.actions;
      const rewards = batch.rewards;
      const dones = batch.dones;
      
      // Compute current Q-values
      const currentQValues = this.qNetwork.predict(states);
      
      // Compute target Q-values using target network
      const nextQValues = this.targetNetwork.predict(nextStates);
      const maxNextQValues = nextQValues.max(1);
      
      // Create target Q-values
      const targetQValues = currentQValues.clone();
      const targetQValuesData = targetQValues.dataSync();
      const maxNextQValuesData = maxNextQValues.dataSync();
      
      // Update target Q-values for taken actions
      for (let i = 0; i < batch.states.length; i++) {
        const action = actions[i];
        const reward = rewards[i];
        const done = dones[i];
        const maxNextQ = maxNextQValuesData[i];
        
        const targetValue = done ? reward : reward + this.gamma * maxNextQ;
        const flatIndex = i * this.actionSize + action;
        targetQValuesData[flatIndex] = targetValue;
      }
      
      const updatedTargets = tf.tensor(targetQValuesData, targetQValues.shape);
      
      // Compute loss and perform gradient descent
      let lossValue;
      this.optimizer.minimize(() => {
        const predictions = this.qNetwork.predict(states);
        const loss = tf.losses.meanSquaredError(updatedTargets, predictions);
        lossValue = loss.dataSync()[0];
        return loss;
      });
      
      return {
        loss: lossValue,
        batchSize: batch.states.length
      };
    });
  }
  
  /**
   * Update target network by copying weights from main Q-network
   * This should be called periodically (e.g., every N episodes)
   */
  updateTargetNetwork() {
    if (!this.qNetwork || !this.targetNetwork) {
      throw new Error('Networks not initialized');
    }
    
    tf.tidy(() => {
      // Get weights from main Q-network
      const qNetworkWeights = this.qNetwork.getWeights();
      
      // Copy weights to target network
      this.targetNetwork.setWeights(qNetworkWeights);
    });
    
    console.log('Target network updated');
  }
  
  /**
   * Get the number of episodes since last target network update
   * @returns {number} Episode count
   */
  getEpisodeCount() {
    return this.episodeCount;
  }
  
  /**
   * Increment episode count (should be called at end of each episode)
   */
  incrementEpisodeCount() {
    this.episodeCount++;
    
    // Automatically update target network if needed
    if (this.episodeCount % this.targetUpdateFreq === 0) {
      this.updateTargetNetwork();
    }
  }
  
  /**
   * Reset episode count
   */
  resetEpisodeCount() {
    this.episodeCount = 0;
  }
  
  /**
   * Save the Q-network model to storage
   * @param {string} path - Path to save the model (e.g., 'localstorage://dqn-model' or 'downloads://dqn-model')
   * @returns {Promise} Promise that resolves when model is saved
   */
  async saveModel(path = 'localstorage://dqn-climbing-model') {
    if (!this.qNetwork) {
      throw new Error('Q-network not initialized');
    }
    
    try {
      // If using file:// protocol, create directory first
      if (path.startsWith('file://')) {
        const fs = await import('fs');
        const pathModule = await import('path');
        
        // Extract file path from file:// URL
        const filePath = path.replace('file://', '');
        const dirPath = pathModule.dirname(filePath);
        
        // Create directory recursively
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }
      
      // Save the main Q-network
      await this.qNetwork.save(path);
      
      // Save hyperparameters and training state as metadata
      const metadata = {
        stateSize: this.stateSize,
        actionSize: this.actionSize,
        gamma: this.gamma,
        epsilon: this.epsilon,
        epsilonMin: this.epsilonMin,
        epsilonDecay: this.epsilonDecay,
        learningRate: this.learningRate,
        bufferSize: this.bufferSize,
        batchSize: this.batchSize,
        targetUpdateFreq: this.targetUpdateFreq,
        episodeCount: this.episodeCount,
        memorySize: this.memory.length,
        timestamp: new Date().toISOString()
      };
      
      // Save metadata to localStorage if using localstorage scheme
      if (path.startsWith('localstorage://')) {
        const metadataKey = path.replace('localstorage://', '') + '-metadata';
        localStorage.setItem(metadataKey, JSON.stringify(metadata));
      }
      
      console.log(`DQN model saved to ${path}`);
      console.log('Model metadata:', metadata);
      
      return metadata;
    } catch (error) {
      console.error('Error saving DQN model:', error);
      throw new Error(`Failed to save model: ${error.message}`);
    }
  }
  
  /**
   * Load a Q-network model from storage
   * @param {string} path - Path to load the model from
   * @returns {Promise} Promise that resolves when model is loaded
   */
  async loadModel(path = 'localstorage://dqn-climbing-model') {
    try {
      // Load the Q-network model
      const loadedModel = await tf.loadLayersModel(path);
      
      // Dispose of existing networks
      if (this.qNetwork) {
        this.qNetwork.dispose();
      }
      if (this.targetNetwork) {
        this.targetNetwork.dispose();
      }
      
      // Set the loaded model as the main Q-network
      this.qNetwork = loadedModel;
      
      // Recompile with current optimizer
      this.qNetwork.compile({
        optimizer: this.optimizer,
        loss: 'meanSquaredError'
      });
      
      // Create new target network and copy weights
      this.targetNetwork = this.buildTargetNetwork();
      this.updateTargetNetwork();
      
      // Load metadata if available
      let metadata = null;
      if (path.startsWith('localstorage://')) {
        const metadataKey = path.replace('localstorage://', '') + '-metadata';
        const metadataStr = localStorage.getItem(metadataKey);
        if (metadataStr) {
          metadata = JSON.parse(metadataStr);
          
          // Restore hyperparameters if they match the current configuration
          if (metadata.stateSize === this.stateSize && metadata.actionSize === this.actionSize) {
            this.epsilon = metadata.epsilon || this.epsilon;
            this.episodeCount = metadata.episodeCount || 0;
            console.log('Restored training state from metadata');
          } else {
            console.warn('Model dimensions do not match current configuration, using current hyperparameters');
          }
        }
      }
      
      console.log(`DQN model loaded from ${path}`);
      if (metadata) {
        console.log('Loaded metadata:', metadata);
      }
      
      return metadata;
    } catch (error) {
      console.error('Error loading DQN model:', error);
      throw new Error(`Failed to load model: ${error.message}`);
    }
  }
  
  /**
   * Check if a saved model exists at the given path
   * @param {string} path - Path to check for saved model
   * @returns {Promise<boolean>} Promise that resolves to true if model exists
   */
  async modelExists(path = 'localstorage://dqn-climbing-model') {
    try {
      if (path.startsWith('localstorage://')) {
        const modelKey = path.replace('localstorage://', '');
        const modelInfo = localStorage.getItem(modelKey + '_info');
        return modelInfo !== null;
      }
      
      // For other schemes, try to load model info
      const modelInfo = await tf.io.getModelArtifactsInfoForURL(path);
      return modelInfo !== null;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Delete a saved model
   * @param {string} path - Path of the model to delete
   * @returns {Promise} Promise that resolves when model is deleted
   */
  async deleteModel(path = 'localstorage://dqn-climbing-model') {
    try {
      if (path.startsWith('localstorage://')) {
        const modelKey = path.replace('localstorage://', '');
        const metadataKey = modelKey + '-metadata';
        
        // Remove model data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(modelKey)) {
            localStorage.removeItem(key);
          }
        });
        
        // Remove metadata
        localStorage.removeItem(metadataKey);
        
        console.log(`Model deleted from ${path}`);
      } else {
        console.warn('Delete operation only supported for localStorage models');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      throw new Error(`Failed to delete model: ${error.message}`);
    }
  }
  
  /**
   * Dispose of all models and free memory
   */
  dispose() {
    if (this.qNetwork) {
      this.qNetwork.dispose();
    }
    if (this.targetNetwork) {
      this.targetNetwork.dispose();
    }
    if (this.optimizer) {
      this.optimizer.dispose();
    }
    
    // Clear memory buffer
    this.memory = [];
    
    console.log('DQN Agent disposed');
  }
}