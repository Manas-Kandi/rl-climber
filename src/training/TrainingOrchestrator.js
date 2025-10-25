/**
 * TrainingOrchestrator manages the high-level training loop, episode execution,
 * and statistics collection for the RL climbing game.
 */
export class TrainingOrchestrator {
    /**
     * Create a TrainingOrchestrator
     * @param {ClimbingEnvironment} environment - The RL environment
     * @param {DQNAgent|PPOAgent} agent - The RL agent
     * @param {Object} config - Training configuration
     */
    constructor(environment, agent, config = {}) {
        this.environment = environment;
        this.agent = agent;
        
        // Training state variables
        this.currentEpisode = 0;
        this.isTraining = false;
        this.isPaused = false;
        this.visualTrainingMode = false; // NEW: Visual training mode flag
        this.visualTrainingDelay = 16; // NEW: Delay between steps in ms (60 FPS)
        
        // Statistics arrays
        this.rewardHistory = [];
        this.successHistory = [];
        
        // Configuration with defaults
        this.config = {
            numEpisodes: 1000,
            renderInterval: 1, // Render every N steps
            statsUpdateInterval: 10, // Update stats every N episodes
            batchSize: 32,
            targetUpdateFreq: 100, // For DQN
            autoSaveInterval: 10, // Auto-save every N episodes
            ...config
        };
        
        // Callback arrays for events
        this.episodeCompleteCallbacks = [];
        this.trainingCompleteCallbacks = [];
        
        // Model manager will be set externally
        this.modelManager = null;
    }

    /**
     * Run a single episode using DQN agent
     * @returns {Promise<{episodeReward: number, episodeSteps: number, success: boolean}>}
     */
    async runEpisodeDQN() {
        // Get initial state from environment reset
        let state = this.environment.reset();
        
        // Initialize episode variables
        let totalReward = 0;
        let steps = 0;
        let done = false;
        
        // Episode loop
        const maxSteps = this.environment.config?.maxSteps || this.environment.maxSteps || 500;
        while (!done && steps < maxSteps) {
            // Select action using epsilon-greedy policy
            const epsilon = this.agent.epsilon;
            const action = this.agent.selectAction(state, epsilon);
            
            // Execute action in environment
            const stepResult = this.environment.step(action);
            const { state: nextState, reward, done: isDone, info } = stepResult;
            
            // Store experience in replay buffer
            this.agent.remember(state, action, reward, nextState, isDone);
            
            // Train if buffer has enough samples
            if (this.agent.canTrain && this.agent.canTrain(this.config.batchSize)) {
                const trainResult = this.agent.train(this.config.batchSize);
                // Store loss for monitoring if needed
                if (info && trainResult && trainResult.loss !== undefined) {
                    info.loss = trainResult.loss;
                }
            }
            
            // Update state and accumulate reward
            state = nextState;
            totalReward += reward;
            done = isDone;
            steps++;
            
            // Render scene every N steps based on renderInterval
            if (steps % this.config.renderInterval === 0) {
                // Trigger rendering update (environment should handle this)
                if (this.environment.render) {
                    this.environment.render();
                }
            }
        }
        
        // Determine if episode was successful
        const success = this.environment.isGoalReached ? this.environment.isGoalReached() : totalReward > 50;
        
        // Get step tracking info if available
        const highestStep = this.environment.highestStepReached !== undefined ? 
            this.environment.highestStepReached : -1;
        const currentStep = this.environment.currentStepOn !== undefined ?
            this.environment.currentStepOn : -1;
        
        // Debug: Log if reward is exactly 0
        if (totalReward === 0) {
            console.warn(`⚠️ DQN Episode ended with exactly 0 reward! Steps: ${steps}, Done: ${done}`);
        }
        
        return {
            episodeReward: totalReward,
            episodeSteps: steps,
            success: success,
            highestStep: highestStep,
            currentStep: currentStep
        };
    }

    /**
     * Run a single episode using PPO agent
     * @returns {Promise<{episodeReward: number, episodeSteps: number, success: boolean}>}
     */
    async runEpisodePPO() {
        // Get initial state from environment reset
        let state = this.environment.reset();
        
        // Initialize trajectory storage arrays
        const states = [];
        const actions = [];
        const rewards = [];
        const logProbs = [];
        const values = [];
        const dones = [];
        
        // Initialize episode variables
        let totalReward = 0;
        let steps = 0;
        let done = false;
        
        // Episode loop
        const maxSteps = this.environment.config?.maxSteps || this.environment.maxSteps || 500;
        while (!done && steps < maxSteps) {
            // Select action using policy (training=true for exploration)
            const actionResult = this.agent.selectAction(state, true);
            const { action, logProb, value } = actionResult;
            
            // Execute action in environment
            const stepResult = this.environment.step(action);
            const { state: nextState, reward, done: isDone, info } = stepResult;
            
            // Store trajectory data
            states.push(Array.from(state)); // Convert Float32Array to regular array
            actions.push(action);
            rewards.push(reward);
            logProbs.push(logProb);
            values.push(value);
            dones.push(isDone);
            
            // Update state and accumulate reward
            state = nextState;
            totalReward += reward;
            done = isDone;
            steps++;
            
            // Render scene every N steps
            if (steps % this.config.renderInterval === 0) {
                // Trigger rendering update
                if (this.environment.render) {
                    this.environment.render();
                }
            }
        }
        
        // After episode ends, compute advantages and returns
        const trajectory = {
            states: states,
            actions: actions,
            rewards: rewards,
            logProbs: logProbs,
            values: values,
            dones: dones
        };
        
        // Compute advantages using GAE
        const advantages = this.agent.computeAdvantages(rewards, values, dones);
        trajectory.advantages = Array.from(advantages);
        
        // Compute returns (advantages + values)
        const returns = advantages.map((adv, i) => adv + values[i]);
        trajectory.returns = returns;
        
        // Train the agent with this trajectory
        const trainingResult = this.agent.train([trajectory]);
        
        // Store training metrics if available (could be used for logging)
        if (trainingResult) {
            // Training metrics are available in trainingResult
            // Can be logged or stored for monitoring
        }
        
        // Determine if episode was successful
        const success = this.environment.isGoalReached ? this.environment.isGoalReached() : totalReward > 50;
        
        // Get step tracking info if available
        const highestStep = this.environment.highestStepReached !== undefined ? 
            this.environment.highestStepReached : -1;
        const currentStep = this.environment.currentStepOn !== undefined ?
            this.environment.currentStepOn : -1;
        
        return {
            episodeReward: totalReward,
            episodeSteps: steps,
            success: success,
            highestStep: highestStep,
            currentStep: currentStep
        };
    }

    /**
     * Set the model manager for persistent training
     * @param {ModelManager} modelManager - The model manager instance
     */
    setModelManager(modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Start visual training mode (real-time, one episode at a time)
     * @param {number} numEpisodes - Number of episodes to train for (default: continuous)
     * @returns {Promise<void>}
     */
    async startVisualTraining(numEpisodes = null) {
        const totalEpisodes = numEpisodes || 10000; // Default to many episodes
        
        // Set training flags
        this.isTraining = true;
        this.isPaused = false;
        this.visualTrainingMode = true;
        
        console.log(`🎬 Starting VISUAL training mode for ${totalEpisodes} episodes...`);
        console.log(`   Training at ~${Math.round(1000/this.visualTrainingDelay)} FPS (autoplay speed)`);
        
        // Main visual training loop
        for (let episode = 0; episode < totalEpisodes && this.isTraining; episode++) {
            this.currentEpisode = episode;
            
            // Check if training is paused
            while (this.isPaused && this.isTraining) {
                await this.sleep(100);
            }
            
            // Exit if training was stopped
            if (!this.isTraining) {
                break;
            }
            
            // Run episode in visual mode (with delays between steps)
            let episodeResult;
            if (this.agent.constructor.name === 'DQNAgent' || this.agent.memory) {
                episodeResult = await this.runEpisodeDQNVisual();
            } else if (this.agent.constructor.name === 'PPOAgent' || this.agent.computeAdvantages) {
                episodeResult = await this.runEpisodePPOVisual();
            } else {
                // Default to DQN
                episodeResult = await this.runEpisodeDQNVisual();
            }
            
            // Store episode results
            this.rewardHistory.push(episodeResult.episodeReward);
            this.successHistory.push(episodeResult.success);
            
            // Log every episode in visual mode
            const successIcon = episodeResult.success ? '🏆' : '❌';
            console.log(`${successIcon} Episode ${episode}: Reward=${episodeResult.episodeReward.toFixed(1)}, Steps=${episodeResult.episodeSteps}, Highest Step=${episodeResult.highestStep}`);
            
            // Update hyperparameters
            if (this.agent.constructor.name === 'DQNAgent' || this.agent.memory) {
                if (this.agent.epsilonDecay) {
                    this.agent.epsilon = Math.max(
                        this.agent.epsilonMin || 0.01,
                        this.agent.epsilon * this.agent.epsilonDecay
                    );
                }
                
                if (episode % this.config.targetUpdateFreq === 0 && this.agent.updateTargetNetwork) {
                    this.agent.updateTargetNetwork();
                }
            }
            
            // Call episode complete callbacks
            const stats = this.getTrainingStats();
            this.episodeCompleteCallbacks.forEach(callback => {
                try {
                    callback(stats, episodeResult);
                } catch (error) {
                    console.error('Error in episode complete callback:', error);
                }
            });
            
            // Auto-save periodically
            if (this.modelManager && episode > 0 && episode % this.config.autoSaveInterval === 0) {
                try {
                    const avgReward = this.getAverageReward(Math.min(100, this.rewardHistory.length));
                    const successRate = this.getSuccessRate(Math.min(100, this.successHistory.length));
                    
                    await this.modelManager.saveModel({
                        episodeCount: episode,
                        totalSteps: episode * (this.environment.maxSteps || 500),
                        avgReward: avgReward,
                        successRate: successRate
                    });
                } catch (error) {
                    console.error('Error auto-saving model:', error);
                }
            }
            
            // Small delay between episodes
            await this.sleep(500); // 0.5 second pause between episodes
        }
        
        // Training complete
        this.isTraining = false;
        this.visualTrainingMode = false;
        console.log('🎬 Visual training completed!');
        
        // Save final model
        if (this.modelManager) {
            try {
                const avgReward = this.getAverageReward(Math.min(100, this.rewardHistory.length));
                const successRate = this.getSuccessRate(Math.min(100, this.successHistory.length));
                
                await this.modelManager.saveModel({
                    episodeCount: totalEpisodes,
                    totalSteps: totalEpisodes * (this.environment.maxSteps || 500),
                    avgReward: avgReward,
                    successRate: successRate
                });
                
                console.log('✅ Final model saved');
            } catch (error) {
                console.error('Error saving final model:', error);
            }
        }
        
        // Call training complete callbacks
        const finalStats = this.getTrainingStats();
        this.trainingCompleteCallbacks.forEach(callback => {
            try {
                callback(finalStats);
            } catch (error) {
                console.error('Error in training complete callback:', error);
            }
        });
    }

    /**
     * Run a single episode in visual mode (DQN) - with delays for visualization
     * @returns {Promise<{episodeReward: number, episodeSteps: number, success: boolean}>}
     */
    async runEpisodeDQNVisual() {
        let state = this.environment.reset();
        
        let totalReward = 0;
        let steps = 0;
        let done = false;
        
        const maxSteps = this.environment.config?.maxSteps || this.environment.maxSteps || 500;
        while (!done && steps < maxSteps) {
            // Select action
            const epsilon = this.agent.epsilon;
            const action = this.agent.selectAction(state, epsilon);
            
            // Execute action
            const stepResult = this.environment.step(action);
            const { state: nextState, reward, done: isDone, info } = stepResult;
            
            // Store experience
            this.agent.remember(state, action, reward, nextState, isDone);
            
            // Train if possible
            if (this.agent.canTrain && this.agent.canTrain(this.config.batchSize)) {
                const trainResult = this.agent.train(this.config.batchSize);
                if (info && trainResult && trainResult.loss !== undefined) {
                    info.loss = trainResult.loss;
                }
            }
            
            // Update state
            state = nextState;
            totalReward += reward;
            done = isDone;
            steps++;
            
            // VISUAL MODE: Add delay between steps for visualization
            await this.sleep(this.visualTrainingDelay);
        }
        
        const success = this.environment.isGoalReached ? this.environment.isGoalReached() : totalReward > 50;
        const highestStep = this.environment.highestStepReached !== undefined ? 
            this.environment.highestStepReached : -1;
        const currentStep = this.environment.currentStepOn !== undefined ?
            this.environment.currentStepOn : -1;
        
        return {
            episodeReward: totalReward,
            episodeSteps: steps,
            success: success,
            highestStep: highestStep,
            currentStep: currentStep
        };
    }

    /**
     * Run a single episode in visual mode (PPO) - with delays for visualization
     * @returns {Promise<{episodeReward: number, episodeSteps: number, success: boolean}>}
     */
    async runEpisodePPOVisual() {
        let state = this.environment.reset();
        
        const states = [];
        const actions = [];
        const rewards = [];
        const logProbs = [];
        const values = [];
        const dones = [];
        
        let totalReward = 0;
        let steps = 0;
        let done = false;
        
        const maxSteps = this.environment.config?.maxSteps || this.environment.maxSteps || 500;
        while (!done && steps < maxSteps) {
            // Select action
            const actionResult = this.agent.selectAction(state, true);
            const { action, logProb, value } = actionResult;
            
            // Execute action
            const stepResult = this.environment.step(action);
            const { state: nextState, reward, done: isDone, info } = stepResult;
            
            // Store trajectory data
            states.push(Array.from(state));
            actions.push(action);
            rewards.push(reward);
            logProbs.push(logProb);
            values.push(value);
            dones.push(isDone);
            
            // Update state
            state = nextState;
            totalReward += reward;
            done = isDone;
            steps++;
            
            // VISUAL MODE: Add delay between steps for visualization
            await this.sleep(this.visualTrainingDelay);
        }
        
        // Compute advantages and train
        const trajectory = {
            states: states,
            actions: actions,
            rewards: rewards,
            logProbs: logProbs,
            values: values,
            dones: dones
        };
        
        const advantages = this.agent.computeAdvantages(rewards, values, dones);
        trajectory.advantages = Array.from(advantages);
        
        const returns = advantages.map((adv, i) => adv + values[i]);
        trajectory.returns = returns;
        
        this.agent.train([trajectory]);
        
        const success = this.environment.isGoalReached ? this.environment.isGoalReached() : totalReward > 50;
        const highestStep = this.environment.highestStepReached !== undefined ? 
            this.environment.highestStepReached : -1;
        const currentStep = this.environment.currentStepOn !== undefined ?
            this.environment.currentStepOn : -1;
        
        return {
            episodeReward: totalReward,
            episodeSteps: steps,
            success: success,
            highestStep: highestStep,
            currentStep: currentStep
        };
    }

    /**
     * Set the visual training speed (FPS)
     * @param {number} fps - Frames per second (1-60)
     */
    setVisualTrainingSpeed(fps) {
        fps = Math.max(1, Math.min(60, fps)); // Clamp between 1-60
        this.visualTrainingDelay = Math.round(1000 / fps);
        console.log(`🎬 Visual training speed set to ${fps} FPS (${this.visualTrainingDelay}ms delay)`);
    }

    /**
     * Start the main training loop
     * @param {number} numEpisodes - Number of episodes to train for
     * @returns {Promise<void>}
     */
    async startTraining(numEpisodes = null) {
        const totalEpisodes = numEpisodes || this.config.numEpisodes;
        
        // Set training flag
        this.isTraining = true;
        this.isPaused = false;
        
        console.log(`Starting training for ${totalEpisodes} episodes...`);
        
        // Main training loop
        for (let episode = 0; episode < totalEpisodes && this.isTraining; episode++) {
            this.currentEpisode = episode;
            
            // Check if training is paused
            while (this.isPaused && this.isTraining) {
                await this.sleep(100); // Wait 100ms before checking again
            }
            
            // Exit if training was stopped
            if (!this.isTraining) {
                break;
            }
            
            // Run episode based on agent type
            let episodeResult;
            if (this.agent.constructor.name === 'DQNAgent' || this.agent.memory) {
                // DQN agent has memory property
                episodeResult = await this.runEpisodeDQN();
            } else if (this.agent.constructor.name === 'PPOAgent' || this.agent.computeAdvantages) {
                // PPO agent has computeAdvantages method
                episodeResult = await this.runEpisodePPO();
            } else {
                // Try to detect based on available methods
                if (typeof this.agent.remember === 'function') {
                    episodeResult = await this.runEpisodeDQN();
                } else if (typeof this.agent.computeAdvantages === 'function') {
                    episodeResult = await this.runEpisodePPO();
                } else {
                    // Default to DQN
                    episodeResult = await this.runEpisodeDQN();
                }
            }
            
            // Store episode results in history arrays
            this.rewardHistory.push(episodeResult.episodeReward);
            this.successHistory.push(episodeResult.success);
            
            // Debug: Log rewards occasionally
            if (episode % 100 === 0) {
                console.log(`📊 Episode ${episode}: Reward=${episodeResult.episodeReward.toFixed(2)}, Steps=${episodeResult.episodeSteps}, Success=${episodeResult.success}`);
            }
            
            // Update hyperparameters if needed
            if (this.agent.constructor.name === 'DQNAgent' || this.agent.memory) {
                // Update epsilon for DQN
                if (this.agent.epsilonDecay) {
                    this.agent.epsilon = Math.max(
                        this.agent.epsilonMin || 0.01,
                        this.agent.epsilon * this.agent.epsilonDecay
                    );
                }
                
                // Update target network periodically
                if (episode % this.config.targetUpdateFreq === 0 && this.agent.updateTargetNetwork) {
                    this.agent.updateTargetNetwork();
                }
            }
            
            // Call episode complete callbacks with statistics
            const stats = this.getTrainingStats();
            this.episodeCompleteCallbacks.forEach(callback => {
                try {
                    callback(stats, episodeResult);
                } catch (error) {
                    console.error('Error in episode complete callback:', error);
                }
            });
            
            // Log progress every N episodes
            if (episode % this.config.statsUpdateInterval === 0) {
                const avgReward = this.getAverageReward(Math.min(100, this.rewardHistory.length));
                const successRate = this.getSuccessRate(Math.min(100, this.successHistory.length));
                console.log(`Episode ${episode}: Avg Reward: ${avgReward.toFixed(2)}, Success Rate: ${(successRate * 100).toFixed(1)}%`);
            }
            
            // Auto-save model periodically if model manager is available
            if (this.modelManager && episode > 0 && episode % this.config.autoSaveInterval === 0) {
                try {
                    const avgReward = this.getAverageReward(Math.min(100, this.rewardHistory.length));
                    const successRate = this.getSuccessRate(Math.min(100, this.successHistory.length));
                    
                    await this.modelManager.saveModel({
                        episodeCount: episode,
                        totalSteps: episode * (this.environment.maxSteps || 500),
                        avgReward: avgReward,
                        successRate: successRate
                    });
                } catch (error) {
                    console.error('Error auto-saving model:', error);
                }
            }
            
            // Allow other tasks to run
            await this.sleep(1);
        }
        
        // Training complete - save final model
        this.isTraining = false;
        console.log('Training completed!');
        
        // Save final model if model manager is available
        if (this.modelManager) {
            try {
                const avgReward = this.getAverageReward(Math.min(100, this.rewardHistory.length));
                const successRate = this.getSuccessRate(Math.min(100, this.successHistory.length));
                
                await this.modelManager.saveModel({
                    episodeCount: totalEpisodes,
                    totalSteps: totalEpisodes * (this.environment.maxSteps || 500),
                    avgReward: avgReward,
                    successRate: successRate
                });
                
                console.log('✅ Final model saved');
            } catch (error) {
                console.error('Error saving final model:', error);
            }
        }
        
        // Call training complete callbacks
        const finalStats = this.getTrainingStats();
        this.trainingCompleteCallbacks.forEach(callback => {
            try {
                callback(finalStats);
            } catch (error) {
                console.error('Error in training complete callback:', error);
            }
        });
    }
    
    /**
     * Helper method to sleep for a given number of milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Pause the training loop
     */
    pauseTraining() {
        this.isPaused = true;
        console.log('Training paused');
    }
    
    /**
     * Resume the training loop
     */
    resumeTraining() {
        this.isPaused = false;
        console.log('Training resumed');
    }
    
    /**
     * Stop the training loop
     */
    stopTraining() {
        this.isTraining = false;
        this.isPaused = false;
        console.log('Training stopped');
    }
    
    /**
     * Get current training statistics
     * @returns {Object} Training statistics object
     */
    getTrainingStats() {
        const recentRewards = this.rewardHistory.slice(-100); // Last 100 episodes
        const recentSuccesses = this.successHistory.slice(-100);
        
        return {
            currentEpisode: this.currentEpisode,
            totalEpisodes: this.rewardHistory.length,
            isTraining: this.isTraining,
            isPaused: this.isPaused,
            avgReward: this.getAverageReward(recentRewards.length),
            successRate: this.getSuccessRate(recentSuccesses.length),
            rewardHistory: [...this.rewardHistory], // Copy to prevent external modification
            successHistory: [...this.successHistory],
            epsilon: this.agent.epsilon || null, // For DQN agents
            totalSteps: this.rewardHistory.length * (this.environment.maxSteps || 500)
        };
    }
    
    /**
     * Register a callback for episode completion events
     * @param {Function} callback - Callback function to call when episode completes
     */
    onEpisodeComplete(callback) {
        if (typeof callback === 'function') {
            this.episodeCompleteCallbacks.push(callback);
        } else {
            console.warn('Episode complete callback must be a function');
        }
    }
    
    /**
     * Register a callback for training completion events
     * @param {Function} callback - Callback function to call when training completes
     */
    onTrainingComplete(callback) {
        if (typeof callback === 'function') {
            this.trainingCompleteCallbacks.push(callback);
        } else {
            console.warn('Training complete callback must be a function');
        }
    }
    
    /**
     * Calculate average reward over the last N episodes
     * @param {number} n - Number of recent episodes to average
     * @returns {number} Average reward
     */
    getAverageReward(n = 100) {
        if (this.rewardHistory.length === 0) return 0;
        
        const recentRewards = this.rewardHistory.slice(-n);
        const sum = recentRewards.reduce((acc, reward) => acc + reward, 0);
        return sum / recentRewards.length;
    }
    
    /**
     * Calculate success rate over the last N episodes
     * @param {number} n - Number of recent episodes to check
     * @returns {number} Success rate (0-1)
     */
    getSuccessRate(n = 100) {
        if (this.successHistory.length === 0) return 0;
        
        const recentSuccesses = this.successHistory.slice(-n);
        const successCount = recentSuccesses.filter(success => success).length;
        return successCount / recentSuccesses.length;
    }
    
    /**
     * Clear training history and reset statistics
     */
    resetStats() {
        this.currentEpisode = 0;
        this.rewardHistory = [];
        this.successHistory = [];
        console.log('Training statistics reset');
    }
}