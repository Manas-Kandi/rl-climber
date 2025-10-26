/**
 * HeadlessTrainer - Train RL agent without browser UI
 * Saves trajectories to disk for later visualization
 */

import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import { ClimbingEnvironment } from '../rl/ClimbingEnvironment.js';
import { PPOAgent } from '../rl/PPOAgent.js';
import { DQNAgent } from '../rl/DQNAgent.js';
import { TrainingOrchestrator } from './TrainingOrchestrator.js';
import { ModelManager } from './ModelManager.js';
import { TrajectoryStorage } from './TrajectoryStorage.js';
import * as tf from '@tensorflow/tfjs-node'; // Use Node.js backend for faster training

/**
 * Headless trainer for terminal-based training
 */
export class HeadlessTrainer {
    constructor(config = {}) {
        this.config = {
            agentType: 'PPO',
            stateSize: 13,
            actionSize: 6,
            numEpisodes: 1000,
            saveInterval: 10,
            logInterval: 10,
            recordTrajectories: true,
            trajectoryStoragePath: './training-data/trajectories',
            modelStoragePath: './training-data/models',
            ...config
        };
        
        this.physicsEngine = null;
        this.environment = null;
        this.agent = null;
        this.orchestrator = null;
        this.modelManager = null;
        this.trajectoryStorage = null;
        
        this.isTraining = false;
        this.startTime = null;
    }
    
    /**
     * Initialize all components for headless training
     */
    async init() {
        console.log('🚀 Initializing Headless Trainer...');
        console.log('Configuration:', this.config);
        
        // Initialize TensorFlow.js with Node backend
        await tf.ready();
        console.log('✅ TensorFlow.js backend:', tf.getBackend());
        
        // Create physics engine (no rendering)
        this.physicsEngine = new PhysicsEngine(-9.81);
        this.physicsEngine.init();
        console.log('✅ Physics engine initialized');
        
        // Create environment (no rendering engine)
        const envConfig = {
            maxSteps: 5000,  // Long episodes for thorough exploration
            agent: {
                startPosition: { x: 0, y: 1, z: 0 },
                size: 0.5,
                mass: 1.0
            }
        };
        
        this.environment = new ClimbingEnvironment(
            this.physicsEngine,
            null, // No rendering engine
            envConfig
        );
        
        // Enable trajectory recording if requested
        if (this.config.recordTrajectories) {
            this.environment.setTrajectoryRecording(true);
        }
        
        console.log('✅ Environment initialized');
        
        // Create agent
        const agentConfig = this.getAgentConfig();
        if (this.config.agentType === 'PPO') {
            this.agent = new PPOAgent(
                this.config.stateSize,
                this.config.actionSize,
                agentConfig
            );
        } else if (this.config.agentType === 'DQN') {
            this.agent = new DQNAgent(
                this.config.stateSize,
                this.config.actionSize,
                agentConfig
            );
        }
        console.log(`✅ ${this.config.agentType} agent initialized`);
        
        // Create training orchestrator
        this.orchestrator = new TrainingOrchestrator(
            this.environment,
            this.agent,
            {
                numEpisodes: this.config.numEpisodes,
                renderInterval: 999999, // Never render
                statsUpdateInterval: this.config.logInterval
            }
        );
        console.log('✅ Training orchestrator initialized');
        
        // Create model manager
        this.modelManager = new ModelManager(this.agent, {
            modelBasePath: `file://${this.config.modelStoragePath}/climbing-model`,
            metadataPath: `${this.config.modelStoragePath}/metadata.json`,
            autoSave: true,
            saveInterval: this.config.saveInterval
        });
        await this.modelManager.init();
        this.orchestrator.setModelManager(this.modelManager);
        console.log('✅ Model manager initialized');
        
        // Create trajectory storage
        if (this.config.recordTrajectories) {
            this.trajectoryStorage = new TrajectoryStorage({
                storagePath: this.config.trajectoryStoragePath
            });
            await this.trajectoryStorage.init();
            console.log('✅ Trajectory storage initialized');
        }
        
        console.log('🎉 Headless trainer ready!');
    }
    
    /**
     * Get agent configuration based on type
     */
    getAgentConfig() {
        if (this.config.agentType === 'PPO') {
            return {
                gamma: 0.99,
                lambda: 0.95,
                clipEpsilon: 0.2,
                entropyCoef: 0.05,
                valueCoef: 0.5,
                learningRate: 0.0003,
                epochs: 10
            };
        } else if (this.config.agentType === 'DQN') {
            return {
                gamma: 0.99,
                epsilon: 1.0,
                epsilonMin: 0.05,
                epsilonDecay: 0.998,
                learningRate: 0.001,
                bufferSize: 10000,
                batchSize: 64
            };
        }
    }
    
    /**
     * Start training
     */
    async train() {
        if (this.isTraining) {
            console.warn('⚠️ Training already in progress');
            return;
        }
        
        this.isTraining = true;
        this.startTime = Date.now();
        
        console.log('\n🎯 Starting training...');
        console.log(`Episodes: ${this.config.numEpisodes}`);
        console.log(`Agent: ${this.config.agentType}`);
        console.log(`Recording trajectories: ${this.config.recordTrajectories}`);
        console.log('─'.repeat(60));
        
        // Set up episode callback to save trajectories
        this.orchestrator.onEpisodeComplete(async (stats, result) => {
            // Save trajectory if recording is enabled
            if (this.config.recordTrajectories && this.trajectoryStorage) {
                const trajectory = this.environment.getLastTrajectory();
                if (trajectory) {
                    await this.trajectoryStorage.saveTrajectory(trajectory);
                }
            }
            
            // Log progress
            if (stats.currentEpisode % this.config.logInterval === 0) {
                this.logProgress(stats, result);
            }
        });
        
        // Start training
        await this.orchestrator.startTraining(this.config.numEpisodes);
        
        this.isTraining = false;
        
        // Final summary
        this.logFinalSummary();
        
        console.log('\n✅ Training complete!');
    }
    
    /**
     * Log training progress
     */
    logProgress(stats, result) {
        const elapsed = Date.now() - this.startTime;
        const elapsedMin = (elapsed / 1000 / 60).toFixed(1);
        const episodesPerMin = (stats.currentEpisode / (elapsed / 1000 / 60)).toFixed(1);
        
        console.log(`\n📊 Episode ${stats.currentEpisode}/${this.config.numEpisodes}`);
        console.log(`   Reward: ${result.episodeReward.toFixed(2)}`);
        console.log(`   Steps: ${result.episodeSteps}`);
        console.log(`   Success: ${result.success ? '✅' : '❌'}`);
        console.log(`   Avg Reward (100): ${stats.avgReward.toFixed(2)}`);
        console.log(`   Success Rate (100): ${(stats.successRate * 100).toFixed(1)}%`);
        console.log(`   Time: ${elapsedMin}m (${episodesPerMin} ep/min)`);
        
        if (this.config.agentType === 'DQN') {
            console.log(`   Epsilon: ${stats.epsilon.toFixed(3)}`);
        }
        
        // Memory stats
        const memory = tf.memory();
        console.log(`   Memory: ${memory.numTensors} tensors, ${(memory.numBytes / 1024 / 1024).toFixed(1)} MB`);
    }
    
    /**
     * Log final training summary
     */
    logFinalSummary() {
        const stats = this.orchestrator.getTrainingStats();
        const elapsed = Date.now() - this.startTime;
        const elapsedMin = (elapsed / 1000 / 60).toFixed(1);
        
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 TRAINING COMPLETE');
        console.log('═'.repeat(60));
        console.log(`Total Episodes: ${stats.totalEpisodes}`);
        console.log(`Total Time: ${elapsedMin} minutes`);
        console.log(`Average Reward: ${stats.avgReward.toFixed(2)}`);
        console.log(`Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
        console.log(`Episodes/min: ${(stats.totalEpisodes / (elapsed / 1000 / 60)).toFixed(1)}`);
        
        if (this.config.recordTrajectories && this.trajectoryStorage) {
            console.log(`Trajectories Saved: ${this.trajectoryStorage.getTrajectoryCount()}`);
            console.log(`Storage Path: ${this.config.trajectoryStoragePath}`);
        }
        
        console.log(`Model Path: ${this.config.modelStoragePath}`);
        console.log('═'.repeat(60));
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.agent) {
            this.agent.dispose();
        }
        
        console.log('✅ Resources cleaned up');
    }
}
