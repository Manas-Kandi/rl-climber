import { TrainingOrchestrator } from './TrainingOrchestrator.js';

// Mock environment
class MockEnvironment {
    constructor() {
        this.maxSteps = 100;
        this.currentStep = 0;
        this.goalReached = false;
    }
    
    reset() {
        this.currentStep = 0;
        this.goalReached = false;
        return new Float32Array([0, 1, 0, 0, 0, 0, 10, 5, 0]); // Mock state
    }
    
    step(action) {
        this.currentStep++;
        const reward = Math.random() * 2 - 1; // Random reward between -1 and 1
        const done = this.currentStep >= this.maxSteps || Math.random() < 0.1; // Random termination
        
        if (done && Math.random() < 0.3) {
            this.goalReached = true;
        }
        
        return {
            state: new Float32Array([0, 1, 0, 0, 0, 0, 10, 5, this.currentStep / this.maxSteps]),
            reward: reward,
            done: done,
            info: {}
        };
    }
    
    isGoalReached() {
        return this.goalReached;
    }
    
    render() {
        // Mock render method
    }
}

// Mock DQN Agent
class DQNAgent {
    constructor() {
        this.epsilon = 1.0;
        this.epsilonDecay = 0.995;
        this.epsilonMin = 0.01;
        this.memory = [];
    }
    
    selectAction(state, epsilon) {
        return Math.floor(Math.random() * 6); // Random action 0-5
    }
    
    remember(state, action, reward, nextState, done) {
        this.memory.push({ state, action, reward, nextState, done });
        if (this.memory.length > 10000) {
            this.memory.shift();
        }
    }
    
    replay(batchSize) {
        return Math.random(); // Mock loss value
    }
    
    updateTargetNetwork() {
        console.log('Target network updated');
    }
}

// Mock PPO Agent
class PPOAgent {
    constructor() {
        this.name = 'PPOAgent';
    }
    
    selectAction(state, training) {
        return {
            action: Math.floor(Math.random() * 6),
            logProb: Math.random(),
            value: Math.random() * 10
        };
    }
    
    computeAdvantages(rewards, values, dones) {
        // Simple mock GAE computation
        const advantages = new Float32Array(rewards.length);
        for (let i = 0; i < rewards.length; i++) {
            advantages[i] = Math.random() * 2 - 1; // Random advantage
        }
        return advantages;
    }
    
    train(trajectories) {
        return {
            actorLoss: Math.random(),
            criticLoss: Math.random(),
            entropy: Math.random()
        };
    }
}

// Test TrainingOrchestrator
async function testTrainingOrchestrator() {
    console.log('Testing TrainingOrchestrator...');
    
    const environment = new MockEnvironment();
    const dqnAgent = new DQNAgent();
    const ppoAgent = new PPOAgent();
    
    // Test with DQN agent
    console.log('\n--- Testing with DQN Agent ---');
    const dqnOrchestrator = new TrainingOrchestrator(environment, dqnAgent, {
        numEpisodes: 5,
        renderInterval: 10,
        statsUpdateInterval: 2
    });
    
    // Test callback registration
    dqnOrchestrator.onEpisodeComplete((stats, result) => {
        console.log(`Episode ${stats.currentEpisode}: Reward=${result.episodeReward.toFixed(2)}, Success=${result.success}`);
    });
    
    dqnOrchestrator.onTrainingComplete((stats) => {
        console.log(`DQN Training completed! Final success rate: ${(stats.successRate * 100).toFixed(1)}%`);
    });
    
    // Test single episode
    console.log('Testing single DQN episode...');
    const dqnResult = await dqnOrchestrator.runEpisodeDQN();
    console.log('DQN Episode result:', dqnResult);
    
    // Test training loop
    console.log('Testing DQN training loop...');
    await dqnOrchestrator.startTraining(3);
    
    // Test with PPO agent
    console.log('\n--- Testing with PPO Agent ---');
    const ppoOrchestrator = new TrainingOrchestrator(environment, ppoAgent, {
        numEpisodes: 5,
        renderInterval: 10,
        statsUpdateInterval: 2
    });
    
    ppoOrchestrator.onEpisodeComplete((stats, result) => {
        console.log(`Episode ${stats.currentEpisode}: Reward=${result.episodeReward.toFixed(2)}, Success=${result.success}`);
    });
    
    ppoOrchestrator.onTrainingComplete((stats) => {
        console.log(`PPO Training completed! Final success rate: ${(stats.successRate * 100).toFixed(1)}%`);
    });
    
    // Test single episode
    console.log('Testing single PPO episode...');
    const ppoResult = await ppoOrchestrator.runEpisodePPO();
    console.log('PPO Episode result:', ppoResult);
    
    // Test training loop
    console.log('Testing PPO training loop...');
    await ppoOrchestrator.startTraining(3);
    
    // Test control methods
    console.log('\n--- Testing Control Methods ---');
    const controlOrchestrator = new TrainingOrchestrator(environment, dqnAgent);
    
    console.log('Testing pause/resume...');
    controlOrchestrator.pauseTraining();
    console.log('Is paused:', controlOrchestrator.isPaused);
    
    controlOrchestrator.resumeTraining();
    console.log('Is paused:', controlOrchestrator.isPaused);
    
    controlOrchestrator.stopTraining();
    console.log('Is training:', controlOrchestrator.isTraining);
    
    // Test statistics
    console.log('\n--- Testing Statistics ---');
    controlOrchestrator.rewardHistory = [10, 20, 30, 40, 50];
    controlOrchestrator.successHistory = [true, false, true, true, false];
    
    const stats = controlOrchestrator.getTrainingStats();
    console.log('Training stats:', {
        avgReward: stats.avgReward,
        successRate: stats.successRate,
        totalEpisodes: stats.totalEpisodes
    });
    
    console.log('Average reward (last 3):', controlOrchestrator.getAverageReward(3));
    console.log('Success rate (last 3):', controlOrchestrator.getSuccessRate(3));
    
    controlOrchestrator.resetStats();
    console.log('After reset - reward history length:', controlOrchestrator.rewardHistory.length);
    
    console.log('\nTrainingOrchestrator tests completed successfully!');
}

// Run tests
testTrainingOrchestrator().catch(console.error);