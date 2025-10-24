# 📚 Usage Examples

This document provides practical examples of how to use and customize the 3D RL Climbing Game.

## 🤖 Switching Between Algorithms

### Using DQN Agent

```javascript
// In main.js, modify the config
const config = {
    agentType: 'DQN', // Switch to DQN
    dqn: {
        gamma: 0.99,
        epsilon: 1.0,
        epsilonMin: 0.01,
        epsilonDecay: 0.995,
        learningRate: 0.0003,
        bufferSize: 10000,
        batchSize: 32,
        targetUpdateFreq: 100
    }
};
```

### Using PPO Agent

```javascript
// In main.js, modify the config
const config = {
    agentType: 'PPO', // Switch to PPO
    ppo: {
        gamma: 0.99,
        lambda: 0.95,
        clipEpsilon: 0.2,
        entropyCoef: 0.01,
        valueCoef: 0.5,
        learningRate: 0.0003
    }
};
```

### Runtime Agent Switching

```javascript
// Switch agents during runtime
const app = window.climbingGame; // Access global app instance

// Switch to PPO
await app.switchAgent('PPO');

// Switch to DQN
await app.switchAgent('DQN');
```

## 💾 Model Management

### Saving a Trained Model

```javascript
// Save model to browser localStorage
const agent = window.climbingGame.agent;
await agent.saveModel('localstorage://my-climbing-model');

// Save model as download
await agent.saveModel('downloads://my-climbing-model');
```

### Loading a Pre-trained Model

```javascript
// Load model from browser localStorage
const agent = window.climbingGame.agent;
await agent.loadModel('localstorage://my-climbing-model');

// Check if model exists before loading
const exists = await agent.modelExists('localstorage://my-climbing-model');
if (exists) {
    await agent.loadModel('localstorage://my-climbing-model');
    console.log('Model loaded successfully!');
} else {
    console.log('No saved model found');
}
```

### Model Metadata

```javascript
// Save model with metadata
const metadata = await agent.saveModel('localstorage://my-model');
console.log('Saved model metadata:', metadata);
// Output: { stateSize: 9, actionSize: 6, timestamp: "2024-01-01T12:00:00.000Z", ... }

// Load model and get metadata
const loadedMetadata = await agent.loadModel('localstorage://my-model');
console.log('Loaded model metadata:', loadedMetadata);
```

## 🎛️ Hyperparameter Tuning

### Adjusting Learning Rate

```javascript
// For DQN
const dqnConfig = {
    learningRate: 0.001, // Higher learning rate for faster learning
    // or
    learningRate: 0.0001, // Lower learning rate for more stable learning
};

// For PPO
const ppoConfig = {
    learningRate: 0.0005, // Adjust PPO learning rate
};
```

### Modifying Exploration Strategy (DQN)

```javascript
const dqnConfig = {
    epsilon: 1.0,        // Start with full exploration
    epsilonMin: 0.05,    // Higher minimum for more exploration
    epsilonDecay: 0.999, // Slower decay for longer exploration
};
```

### Adjusting Network Architecture

```javascript
// Note: This requires modifying the agent classes
// Example for custom DQN network sizes

class CustomDQNAgent extends DQNAgent {
    buildQNetwork() {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [this.stateSize],
                    units: 128, // Larger network
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 128, // Larger network
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 64,  // Additional layer
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: this.actionSize,
                    activation: 'linear'
                })
            ]
        });
        
        model.compile({
            optimizer: this.optimizer,
            loss: 'meanSquaredError'
        });
        
        return model;
    }
}
```

### Automated Hyperparameter Tuning

```javascript
// Run automated hyperparameter tuning
const app = window.climbingGame;
const results = await app.tuneHyperparameters();

console.log('Tuning results:', results);
// The system will test different configurations and recommend the best ones
```

## 🏔️ Environment Customization

### Adding New Ledges

```javascript
const customEnvironmentConfig = {
    maxSteps: 500,
    goalHeight: 14,
    fallThreshold: -2,
    ledges: [
        // Original ledges
        { position: { x: 0, y: 2, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
        { position: { x: 1, y: 4, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
        { position: { x: -1, y: 6, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
        
        // Add new challenging ledges
        { position: { x: 2, y: 8, z: -5 }, size: { x: 1.5, y: 0.2, z: 1 } },   // Smaller ledge
        { position: { x: -2, y: 10, z: -5 }, size: { x: 1, y: 0.2, z: 1 } },    // Even smaller
        { position: { x: 0, y: 12, z: -5 }, size: { x: 2.5, y: 0.2, z: 1 } },   // Larger final ledge
        
        // Side ledges for alternative paths
        { position: { x: 3, y: 5, z: -5 }, size: { x: 1, y: 0.2, z: 1 } },
        { position: { x: -3, y: 7, z: -5 }, size: { x: 1, y: 0.2, z: 1 } },
    ]
};
```

### Modifying Reward Structure

```javascript
const customRewardWeights = {
    heightGain: 2.0,      // Double reward for gaining height
    goalReached: 200.0,   // Higher goal reward
    survival: 0.05,       // Lower survival reward (encourage efficiency)
    fall: -100.0,         // Higher fall penalty
    timePenalty: -0.02,   // Higher time penalty
    ledgeGrab: 10.0       // Higher ledge grab reward
};

// Apply custom rewards
const environment = window.climbingGame.environment;
environment.setRewardWeights(customRewardWeights);
```

### Creating Different Difficulty Levels

```javascript
// Easy mode - more and larger ledges
const easyConfig = {
    ledges: [
        { position: { x: 0, y: 1.5, z: -5 }, size: { x: 3, y: 0.3, z: 1.5 } },
        { position: { x: 0, y: 3, z: -5 }, size: { x: 3, y: 0.3, z: 1.5 } },
        { position: { x: 0, y: 4.5, z: -5 }, size: { x: 3, y: 0.3, z: 1.5 } },
        { position: { x: 0, y: 6, z: -5 }, size: { x: 3, y: 0.3, z: 1.5 } },
        { position: { x: 0, y: 7.5, z: -5 }, size: { x: 3, y: 0.3, z: 1.5 } },
        { position: { x: 0, y: 9, z: -5 }, size: { x: 3, y: 0.3, z: 1.5 } },
        { position: { x: 0, y: 10.5, z: -5 }, size: { x: 3, y: 0.3, z: 1.5 } },
        { position: { x: 0, y: 12, z: -5 }, size: { x: 3, y: 0.3, z: 1.5 } },
    ],
    goalHeight: 13,
    maxSteps: 300
};

// Hard mode - fewer and smaller ledges
const hardConfig = {
    ledges: [
        { position: { x: 1, y: 3, z: -5 }, size: { x: 1, y: 0.1, z: 0.8 } },
        { position: { x: -1.5, y: 6, z: -5 }, size: { x: 0.8, y: 0.1, z: 0.8 } },
        { position: { x: 2, y: 9, z: -5 }, size: { x: 0.6, y: 0.1, z: 0.8 } },
        { position: { x: -0.5, y: 12, z: -5 }, size: { x: 1, y: 0.1, z: 0.8 } },
    ],
    goalHeight: 15,
    maxSteps: 800,
    fallThreshold: -1
};
```

## 📊 Performance Monitoring

### Getting Performance Statistics

```javascript
const app = window.climbingGame;

// Get current performance stats
const perfStats = app.getPerformanceStats();
console.log('Performance:', perfStats);
// Output: { fps: 60, frameTime: 16.7, renderTime: 8.2, physicsTime: 2.1, ... }

// Get memory statistics
const memStats = app.getMemoryStats();
console.log('Memory:', memStats);
// Output: { numTensors: 45, numBytes: 2048576, numMB: 2.0, ... }

// Get rendering metrics
const renderStats = app.renderingEngine.getRenderingMetrics();
console.log('Rendering:', renderStats);
// Output: { drawCalls: 12, triangles: 1024, geometries: 8, ... }
```

### Performance Optimization

```javascript
const app = window.climbingGame;

// Enable adaptive rendering for low-end devices
app.setAdaptiveRendering(true);

// Optimize rendering performance
app.optimizeRenderingPerformance();

// Test inference speed
await app.testInferenceSpeed();

// Manual memory cleanup
app.cleanupMemory();
```

## 🧪 Training Experiments

### Quick Training Test

```javascript
// Run a quick 50-episode training session
const app = window.climbingGame;
const orchestrator = app.orchestrator;

// Set up callbacks to monitor progress
orchestrator.onEpisodeComplete((stats, result) => {
    console.log(`Episode ${stats.currentEpisode}: Reward=${result.episodeReward.toFixed(2)}`);
});

orchestrator.onTrainingComplete((stats) => {
    console.log('Training complete! Final success rate:', (stats.successRate * 100).toFixed(1) + '%');
});

// Start training
await orchestrator.startTraining(50);
```

### Comparing Algorithms

```javascript
const app = window.climbingGame;

// Test DQN
console.log('Testing DQN...');
await app.switchAgent('DQN');
await app.orchestrator.startTraining(100);
const dqnStats = app.orchestrator.getTrainingStats();

// Test PPO
console.log('Testing PPO...');
await app.switchAgent('PPO');
app.orchestrator.resetStats(); // Clear previous stats
await app.orchestrator.startTraining(100);
const ppoStats = app.orchestrator.getTrainingStats();

// Compare results
console.log('DQN Results:', {
    avgReward: dqnStats.avgReward,
    successRate: dqnStats.successRate
});

console.log('PPO Results:', {
    avgReward: ppoStats.avgReward,
    successRate: ppoStats.successRate
});
```

### Custom Training Loop

```javascript
// Create a custom training loop with specific conditions
const app = window.climbingGame;
const environment = app.environment;
const agent = app.agent;

async function customTrainingLoop() {
    let episode = 0;
    let bestReward = -Infinity;
    
    while (episode < 1000) {
        // Reset environment
        let state = environment.reset();
        let totalReward = 0;
        let steps = 0;
        let done = false;
        
        // Run episode
        while (!done && steps < 500) {
            const action = agent.selectAction(state, agent.epsilon);
            const result = environment.step(action);
            
            // Store experience (for DQN)
            if (agent.remember) {
                agent.remember(state, action, result.reward, result.state, result.done);
            }
            
            state = result.state;
            totalReward += result.reward;
            done = result.done;
            steps++;
        }
        
        // Train agent (for DQN)
        if (agent.replay && agent.canTrain()) {
            agent.replay();
        }
        
        // Update epsilon (for DQN)
        if (agent.decayEpsilon) {
            agent.decayEpsilon();
        }
        
        // Track best performance
        if (totalReward > bestReward) {
            bestReward = totalReward;
            console.log(`New best reward: ${bestReward.toFixed(2)} at episode ${episode}`);
            
            // Save best model
            await agent.saveModel('localstorage://best-model');
        }
        
        episode++;
        
        // Log progress
        if (episode % 50 === 0) {
            console.log(`Episode ${episode}: Reward=${totalReward.toFixed(2)}, Steps=${steps}`);
        }
    }
    
    console.log('Custom training complete!');
}

// Run custom training
await customTrainingLoop();
```

## 🔧 Advanced Configuration

### Custom Physics Settings

```javascript
// Modify physics parameters
const app = window.climbingGame;
const physics = app.physicsEngine;

// Adjust gravity
physics.world.gravity.set(0, -15, 0); // Stronger gravity

// Modify agent properties
const agentBody = physics.getBody('agent');
if (agentBody) {
    agentBody.linearDamping = 0.2;  // More air resistance
    agentBody.angularDamping = 0.3; // More rotational damping
}
```

### Custom Action Forces

```javascript
// Modify action forces in the environment config
const customActionForces = {
    move: 8.0,  // Stronger horizontal movement
    jump: 12.0, // Higher jumps
    grab: 3.0   // Stronger grab assistance
};

// Apply to environment
const environment = app.environment;
environment.config.actionForces = customActionForces;
```

### Real-time Parameter Adjustment

```javascript
// Create a simple parameter adjustment interface
function createParameterControls() {
    const controls = document.createElement('div');
    controls.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px;
        border-radius: 5px;
        font-family: monospace;
    `;
    
    controls.innerHTML = `
        <h4>Live Parameters</h4>
        <label>Learning Rate: <input type="range" id="lr" min="0.0001" max="0.01" step="0.0001" value="0.0003"></label><br>
        <label>Epsilon: <input type="range" id="eps" min="0" max="1" step="0.01" value="0.5"></label><br>
        <label>Jump Force: <input type="range" id="jump" min="5" max="20" step="0.5" value="8"></label><br>
        <button onclick="applyParameters()">Apply</button>
    `;
    
    document.body.appendChild(controls);
}

function applyParameters() {
    const app = window.climbingGame;
    const lr = parseFloat(document.getElementById('lr').value);
    const eps = parseFloat(document.getElementById('eps').value);
    const jump = parseFloat(document.getElementById('jump').value);
    
    // Apply learning rate
    if (app.agent.setLearningRate) {
        app.agent.setLearningRate(lr);
    }
    
    // Apply epsilon
    if (app.agent.setEpsilon) {
        app.agent.setEpsilon(eps);
    }
    
    // Apply jump force
    app.environment.config.actionForces.jump = jump;
    
    console.log('Parameters updated:', { lr, eps, jump });
}

// Create the controls
createParameterControls();
```

These examples should give you a comprehensive understanding of how to customize and extend the 3D RL Climbing Game for your specific needs!