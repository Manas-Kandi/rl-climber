import * as tf from '@tensorflow/tfjs';

/**
 * PPO (Proximal Policy Optimization) Agent implementation
 * Uses actor-critic architecture with separate networks for policy and value estimation
 */
export class PPOAgent {
    constructor(stateSize = 9, actionSize = 6, config = {}) {
        this.stateSize = stateSize;
        this.actionSize = actionSize;
        
        // Hyperparameters
        this.gamma = config.gamma || 0.99;
        this.lambda = config.lambda || 0.95;
        this.clipEpsilon = config.clipEpsilon || 0.2;
        this.entropyCoef = config.entropyCoef || 0.01;
        this.valueCoef = config.valueCoef || 0.5;
        this.learningRate = config.learningRate || 0.0003;
        
        // Build networks
        this.actorNetwork = this.buildActorNetwork();
        this.criticNetwork = this.buildCriticNetwork();
        
        // Create optimizers
        this.actorOptimizer = tf.train.adam(this.learningRate);
        this.criticOptimizer = tf.train.adam(this.learningRate);
        
        console.log('PPO Agent initialized with state size:', stateSize, 'action size:', actionSize);
    }
    
    /**
     * Build actor network: Input(9) → Dense(64, ReLU) → Dense(64, ReLU) → Dense(6, Softmax)
     * @returns {tf.LayersModel} Actor network model
     */
    buildActorNetwork() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [this.stateSize],
                    units: 64,
                    activation: 'relu',
                    kernelInitializer: 'glorotUniform'
                }),
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    kernelInitializer: 'glorotUniform'
                }),
                tf.layers.dense({
                    units: this.actionSize,
                    activation: 'softmax',
                    kernelInitializer: 'glorotUniform'
                })
            ]
        });
        
        console.log('Actor network built with architecture:');
        model.summary();
        return model;
    }
    
    /**
     * Build critic network: Input(9) → Dense(64, ReLU) → Dense(64, ReLU) → Dense(1, Linear)
     * @returns {tf.LayersModel} Critic network model
     */
    buildCriticNetwork() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [this.stateSize],
                    units: 64,
                    activation: 'relu',
                    kernelInitializer: 'glorotUniform'
                }),
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    kernelInitializer: 'glorotUniform'
                }),
                tf.layers.dense({
                    units: 1,
                    activation: 'linear',
                    kernelInitializer: 'glorotUniform'
                })
            ]
        });
        
        console.log('Critic network built with architecture:');
        model.summary();
        return model;
    }
    
    /**
     * Select action using policy sampling or greedy selection
     * @param {Float32Array|Array} state - Current state
     * @param {boolean} training - Whether in training mode (true) or evaluation mode (false)
     * @returns {Object} Object containing action, logProb, and value
     */
    selectAction(state, training = true) {
        return tf.tidy(() => {
            // Convert state to tensor
            const stateTensor = tf.tensor2d([state], [1, this.stateSize]);
            
            // Get action probabilities from actor network
            const actionProbs = this.actorNetwork.predict(stateTensor);
            
            // Get state value from critic network
            const stateValue = this.criticNetwork.predict(stateTensor);
            
            let action, logProb;
            
            if (training) {
                // Sample action from categorical distribution
                const actionProbsArray = actionProbs.dataSync();
                action = this.sampleFromCategorical(actionProbsArray);
                
                // Calculate log probability of selected action
                logProb = Math.log(Math.max(actionProbsArray[action], 1e-8)); // Avoid log(0)
            } else {
                // Take greedy action (argmax)
                action = actionProbs.argMax(1).dataSync()[0];
                
                // Calculate log probability for the greedy action
                const actionProbsArray = actionProbs.dataSync();
                logProb = Math.log(Math.max(actionProbsArray[action], 1e-8));
            }
            
            const value = stateValue.dataSync()[0];
            
            return {
                action: action,
                logProb: logProb,
                value: value
            };
        });
    }
    
    /**
     * Sample an action from a categorical distribution
     * @param {Float32Array} probabilities - Action probabilities
     * @returns {number} Selected action index
     */
    sampleFromCategorical(probabilities) {
        const random = Math.random();
        let cumulativeProb = 0;
        
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeProb += probabilities[i];
            if (random <= cumulativeProb) {
                return i;
            }
        }
        
        // Fallback to last action if rounding errors occur
        return probabilities.length - 1;
    }
    
    /**
     * Compute advantages using Generalized Advantage Estimation (GAE)
     * @param {Array} rewards - Array of rewards for the trajectory
     * @param {Array} values - Array of state values for the trajectory
     * @param {Array} dones - Array of done flags for the trajectory
     * @returns {Float32Array} Computed advantages
     */
    computeAdvantages(rewards, values, dones) {
        const length = rewards.length;
        const advantages = new Float32Array(length);
        let lastAdvantage = 0;
        
        // Iterate backwards through the trajectory
        for (let t = length - 1; t >= 0; t--) {
            // Calculate next value (0 if terminal, otherwise next state value)
            const nextValue = (t === length - 1) ? 0 : values[t + 1];
            const isDone = dones[t] ? 1 : 0;
            
            // Calculate TD error: delta = reward + gamma * nextValue * (1 - done) - value
            const delta = rewards[t] + this.gamma * nextValue * (1 - isDone) - values[t];
            
            // Calculate GAE: advantage = delta + gamma * lambda * nextAdvantage * (1 - done)
            advantages[t] = delta + this.gamma * this.lambda * lastAdvantage * (1 - isDone);
            lastAdvantage = advantages[t];
        }
        
        // Normalize advantages (subtract mean, divide by std)
        const mean = this.calculateMean(advantages);
        const std = this.calculateStd(advantages, mean);
        
        // Avoid division by zero
        const normalizedStd = Math.max(std, 1e-8);
        
        for (let i = 0; i < length; i++) {
            advantages[i] = (advantages[i] - mean) / normalizedStd;
        }
        
        return advantages;
    }
    
    /**
     * Calculate mean of an array
     * @param {Float32Array} array - Input array
     * @returns {number} Mean value
     */
    calculateMean(array) {
        let sum = 0;
        for (let i = 0; i < array.length; i++) {
            sum += array[i];
        }
        return sum / array.length;
    }
    
    /**
     * Calculate standard deviation of an array
     * @param {Float32Array} array - Input array
     * @param {number} mean - Pre-calculated mean
     * @returns {number} Standard deviation
     */
    calculateStd(array, mean) {
        let sumSquaredDiffs = 0;
        for (let i = 0; i < array.length; i++) {
            const diff = array[i] - mean;
            sumSquaredDiffs += diff * diff;
        }
        return Math.sqrt(sumSquaredDiffs / array.length);
    }
    
    /**
     * Train the PPO agent using collected trajectories
     * @param {Object} trajectories - Object containing states, actions, oldLogProbs, advantages, returns
     * @returns {Object} Training metrics including actor loss, critic loss, and entropy
     */
    train(trajectories) {
        const { states, actions, oldLogProbs, advantages, returns } = trajectories;
        const batchSize = states.length;
        const epochs = 10; // K epochs for PPO
        
        let totalActorLoss = 0;
        let totalCriticLoss = 0;
        let totalEntropy = 0;
        
        // Convert data to tensors once
        const statesTensor = tf.tensor2d(states, [batchSize, this.stateSize]);
        const actionsTensor = tf.tensor1d(actions, 'int32');
        const oldLogProbsTensor = tf.tensor1d(oldLogProbs);
        const advantagesTensor = tf.tensor1d(advantages);
        const returnsTensor = tf.tensor1d(returns);
        
        // Perform K epochs of minibatch updates
        for (let epoch = 0; epoch < epochs; epoch++) {
            // Get current metrics before training
            let actorLossValue, criticLossValue, entropyValue;
            
            tf.tidy(() => {
                const actionProbs = this.actorNetwork.predict(statesTensor);
                const values = this.criticNetwork.predict(statesTensor).squeeze();
                const newLogProbs = this.calculateLogProbs(actionProbs, actionsTensor);
                const ratios = tf.exp(tf.sub(newLogProbs, oldLogProbsTensor));
                const clippedRatios = tf.clipByValue(ratios, 1 - this.clipEpsilon, 1 + this.clipEpsilon);
                const surr1 = tf.mul(ratios, advantagesTensor);
                const surr2 = tf.mul(clippedRatios, advantagesTensor);
                const clippedSurrogate = tf.minimum(surr1, surr2);
                const entropy = this.calculateEntropy(actionProbs);
                
                const actorLoss = tf.neg(tf.add(
                    tf.mean(clippedSurrogate),
                    tf.mul(this.entropyCoef, entropy)
                ));
                const criticLoss = tf.mean(tf.square(tf.sub(values, returnsTensor)));
                
                actorLossValue = actorLoss.dataSync()[0];
                criticLossValue = criticLoss.dataSync()[0];
                entropyValue = entropy.dataSync()[0];
            });
            
            // Train actor network
            this.actorOptimizer.minimize(() => {
                return tf.tidy(() => {
                    // Forward pass through actor network
                    const actionProbs = this.actorNetwork.predict(statesTensor);
                    
                    // Calculate new log probabilities
                    const newLogProbs = this.calculateLogProbs(actionProbs, actionsTensor);
                    
                    // Calculate probability ratio: ratio = exp(newLogProb - oldLogProb)
                    const ratios = tf.exp(tf.sub(newLogProbs, oldLogProbsTensor));
                    
                    // Calculate clipped surrogate objective
                    const clippedRatios = tf.clipByValue(ratios, 1 - this.clipEpsilon, 1 + this.clipEpsilon);
                    const surr1 = tf.mul(ratios, advantagesTensor);
                    const surr2 = tf.mul(clippedRatios, advantagesTensor);
                    const clippedSurrogate = tf.minimum(surr1, surr2);
                    
                    // Calculate entropy for exploration
                    const entropy = this.calculateEntropy(actionProbs);
                    
                    // Actor loss: -mean(clipped surrogate) - entropyCoef * entropy
                    return tf.neg(tf.add(
                        tf.mean(clippedSurrogate),
                        tf.mul(this.entropyCoef, entropy)
                    ));
                });
            });
            
            // Train critic network
            this.criticOptimizer.minimize(() => {
                return tf.tidy(() => {
                    // Forward pass through critic network
                    const values = this.criticNetwork.predict(statesTensor).squeeze();
                    
                    // Critic loss: MSE(value, return)
                    return tf.mean(tf.square(tf.sub(values, returnsTensor)));
                });
            });
            
            totalActorLoss += actorLossValue;
            totalCriticLoss += criticLossValue;
            totalEntropy += entropyValue;
        }
        
        // Clean up tensors
        statesTensor.dispose();
        actionsTensor.dispose();
        oldLogProbsTensor.dispose();
        advantagesTensor.dispose();
        returnsTensor.dispose();
        
        return {
            actorLoss: totalActorLoss / epochs,
            criticLoss: totalCriticLoss / epochs,
            entropy: totalEntropy / epochs
        };
    }
    
    /**
     * Calculate log probabilities for given actions
     * @param {tf.Tensor} actionProbs - Action probability tensor
     * @param {tf.Tensor} actions - Action indices tensor
     * @returns {tf.Tensor} Log probabilities tensor
     */
    calculateLogProbs(actionProbs, actions) {
        // Add small epsilon to avoid log(0)
        const clippedProbs = tf.clipByValue(actionProbs, 1e-8, 1.0);
        const logProbs = tf.log(clippedProbs);
        
        // Use one-hot encoding to select log probabilities for actions
        const oneHot = tf.oneHot(actions, this.actionSize);
        return tf.sum(tf.mul(logProbs, oneHot), 1);
    }
    
    /**
     * Calculate entropy of action probability distribution
     * @param {tf.Tensor} actionProbs - Action probability tensor
     * @returns {tf.Tensor} Entropy tensor
     */
    calculateEntropy(actionProbs) {
        // Add small epsilon to avoid log(0)
        const clippedProbs = tf.clipByValue(actionProbs, 1e-8, 1.0);
        const logProbs = tf.log(clippedProbs);
        return tf.neg(tf.mean(tf.sum(tf.mul(clippedProbs, logProbs), 1)));
    }
    
    /**
     * Save both actor and critic models
     * @param {string} path - Base path for saving models
     */
    async saveModel(path) {
        try {
            // Save actor network
            const actorPath = path + '-actor';
            await this.actorNetwork.save(actorPath);
            console.log('Actor model saved to:', actorPath);
            
            // Save critic network
            const criticPath = path + '-critic';
            await this.criticNetwork.save(criticPath);
            console.log('Critic model saved to:', criticPath);
            
            console.log('PPO model saved successfully');
        } catch (error) {
            console.error('Error saving PPO model:', error);
            throw error;
        }
    }
    
    /**
     * Load both actor and critic models
     * @param {string} path - Base path for loading models
     */
    async loadModel(path) {
        try {
            // Load actor network
            const actorPath = path + '-actor';
            this.actorNetwork.dispose(); // Clean up existing model
            this.actorNetwork = await tf.loadLayersModel(actorPath);
            console.log('Actor model loaded from:', actorPath);
            
            // Load critic network
            const criticPath = path + '-critic';
            this.criticNetwork.dispose(); // Clean up existing model
            this.criticNetwork = await tf.loadLayersModel(criticPath);
            console.log('Critic model loaded from:', criticPath);
            
            console.log('PPO model loaded successfully');
        } catch (error) {
            console.error('Error loading PPO model:', error);
            console.warn('Continuing with randomly initialized networks');
            
            // Rebuild networks if loading fails
            this.actorNetwork = this.buildActorNetwork();
            this.criticNetwork = this.buildCriticNetwork();
            
            throw error;
        }
    }
    
    /**
     * Dispose of the agent and free memory
     */
    dispose() {
        if (this.actorNetwork) {
            this.actorNetwork.dispose();
        }
        if (this.criticNetwork) {
            this.criticNetwork.dispose();
        }
        if (this.actorOptimizer) {
            this.actorOptimizer.dispose();
        }
        if (this.criticOptimizer) {
            this.criticOptimizer.dispose();
        }
    }
}