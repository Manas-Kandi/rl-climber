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
            ...config
        };
        
        // Callback arrays for events
        this.episodeCompleteCallbacks = [];
        this.trainingCompleteCallbacks = [];
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
        while (!done && steps < this.environment.maxSteps) {
            // Select action using epsilon-greedy policy
            const epsilon = this.agent.epsilon;
            const action = this.agent.selectAction(state, epsilon);
            
            // Execute action in environment
            const stepResult = this.environment.step(action);
            const { state: nextState, reward, done: isDone, info } = stepResult;
            
            // Store experience in replay buffer
            this.agent.remember(state, action, reward, nextState, isDone);
            
            // Train if buffer has enough samples
            if (this.agent.memory.length >= this.config.batchSize) {
                const loss = this.agent.replay(this.config.batchSize);
                // Store loss for monitoring if needed
                if (info && loss !== undefined) {
                    info.loss = loss;
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
        
        return {
            episodeReward: totalReward,
            episodeSteps: steps,
            success: success
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
        while (!done && steps < this.environment.maxSteps) {
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
        
        return {
            episodeReward: totalReward,
            episodeSteps: steps,
            success: success
        };
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
            
            // Allow other tasks to run
            await this.sleep(1);
        }
        
        // Training complete
        this.isTraining = false;
        console.log('Training completed!');
        
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