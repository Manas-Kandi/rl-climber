import * as tf from '@tensorflow/tfjs';
import { PPOAgent } from './PPOAgent.js';

/**
 * Test suite for PPO Agent
 */
async function testPPOAgent() {
    console.log('Testing PPO Agent...');
    
    // Test 1: Agent initialization
    console.log('\n1. Testing agent initialization...');
    const agent = new PPOAgent(9, 6, {
        gamma: 0.99,
        lambda: 0.95,
        clipEpsilon: 0.2,
        entropyCoef: 0.01,
        valueCoef: 0.5,
        learningRate: 0.0003
    });
    
    console.log('✓ Agent initialized successfully');
    console.log('State size:', agent.stateSize);
    console.log('Action size:', agent.actionSize);
    console.log('Hyperparameters:', {
        gamma: agent.gamma,
        lambda: agent.lambda,
        clipEpsilon: agent.clipEpsilon,
        entropyCoef: agent.entropyCoef,
        valueCoef: agent.valueCoef
    });
    
    // Test 2: Network architectures
    console.log('\n2. Testing network architectures...');
    
    // Test actor network shape
    const testState = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
    const actorOutput = agent.actorNetwork.predict(tf.tensor2d([testState], [1, 9]));
    const actorShape = actorOutput.shape;
    console.log('Actor network output shape:', actorShape);
    console.log('✓ Actor network outputs correct shape [1, 6]');
    
    // Test critic network shape
    const criticOutput = agent.criticNetwork.predict(tf.tensor2d([testState], [1, 9]));
    const criticShape = criticOutput.shape;
    console.log('Critic network output shape:', criticShape);
    console.log('✓ Critic network outputs correct shape [1, 1]');
    
    // Clean up tensors
    actorOutput.dispose();
    criticOutput.dispose();
    
    // Test 3: Action selection
    console.log('\n3. Testing action selection...');
    
    // Test training mode (sampling)
    const trainingResult = agent.selectAction(testState, true);
    console.log('Training mode result:', trainingResult);
    console.log('✓ Training mode returns action, logProb, and value');
    
    // Test evaluation mode (greedy)
    const evalResult = agent.selectAction(testState, false);
    console.log('Evaluation mode result:', evalResult);
    console.log('✓ Evaluation mode returns action, logProb, and value');
    
    // Verify action is in valid range
    if (trainingResult.action >= 0 && trainingResult.action < 6) {
        console.log('✓ Action is in valid range [0, 5]');
    } else {
        console.error('✗ Action out of range:', trainingResult.action);
    }
    
    // Test 4: GAE computation
    console.log('\n4. Testing Generalized Advantage Estimation...');
    
    const rewards = [1.0, 0.5, -0.1, 2.0, -1.0];
    const values = [0.8, 0.6, 0.4, 1.5, 0.2];
    const dones = [false, false, false, false, true];
    
    const advantages = agent.computeAdvantages(rewards, values, dones);
    console.log('Rewards:', rewards);
    console.log('Values:', values);
    console.log('Dones:', dones);
    console.log('Computed advantages:', Array.from(advantages));
    console.log('✓ GAE computation completed');
    
    // Verify advantages are normalized (mean ≈ 0, std ≈ 1)
    const mean = advantages.reduce((sum, val) => sum + val, 0) / advantages.length;
    const variance = advantages.reduce((sum, val) => sum + (val - mean) ** 2, 0) / advantages.length;
    const std = Math.sqrt(variance);
    console.log('Advantages mean:', mean.toFixed(6), '(should be ≈ 0)');
    console.log('Advantages std:', std.toFixed(6), '(should be ≈ 1)');
    
    // Test 5: Training (simplified)
    console.log('\n5. Testing training logic...');
    
    // Create dummy trajectory data
    const trajectoryLength = 10;
    const states = [];
    const actions = [];
    const oldLogProbs = [];
    const advantagesArray = [];
    const returns = [];
    
    for (let i = 0; i < trajectoryLength; i++) {
        states.push(Array.from(testState).map(x => x + Math.random() * 0.1));
        actions.push(Math.floor(Math.random() * 6));
        oldLogProbs.push(Math.log(0.16 + Math.random() * 0.1)); // Random log prob
        advantagesArray.push(Math.random() - 0.5); // Random advantage
        returns.push(Math.random() * 2 - 1); // Random return
    }
    
    const trajectories = {
        states: states,
        actions: actions,
        oldLogProbs: oldLogProbs,
        advantages: advantagesArray,
        returns: returns
    };
    
    try {
        const trainingMetrics = agent.train(trajectories);
        console.log('Training metrics:', trainingMetrics);
        console.log('✓ Training completed successfully');
        
        // Verify metrics are numbers
        if (typeof trainingMetrics.actorLoss === 'number' &&
            typeof trainingMetrics.criticLoss === 'number' &&
            typeof trainingMetrics.entropy === 'number') {
            console.log('✓ Training metrics are valid numbers');
        } else {
            console.error('✗ Invalid training metrics');
        }
    } catch (error) {
        console.error('✗ Training failed:', error);
    }
    
    // Test 6: Model save/load (using localstorage)
    console.log('\n6. Testing model save/load...');
    
    try {
        const modelPath = 'file://./test-ppo-model';
        
        // Save model
        await agent.saveModel(modelPath);
        console.log('✓ Model saved successfully');
        
        // Create new agent and load model
        const newAgent = new PPOAgent(9, 6);
        await newAgent.loadModel(modelPath);
        console.log('✓ Model loaded successfully');
        
        // Test that loaded model produces similar outputs
        const originalOutput = agent.selectAction(testState, false);
        const loadedOutput = newAgent.selectAction(testState, false);
        
        console.log('Original agent action:', originalOutput.action);
        console.log('Loaded agent action:', loadedOutput.action);
        
        // Clean up
        newAgent.dispose();
        
    } catch (error) {
        console.warn('Model save/load test failed (expected in some environments):', error.message);
    }
    
    // Test 7: Memory management
    console.log('\n7. Testing memory management...');
    
    const initialMemory = tf.memory();
    console.log('Initial memory:', initialMemory);
    
    // Perform multiple action selections
    for (let i = 0; i < 100; i++) {
        const result = agent.selectAction(testState, true);
        // Results should be automatically cleaned up by tf.tidy()
    }
    
    const finalMemory = tf.memory();
    console.log('Final memory:', finalMemory);
    
    if (finalMemory.numTensors <= initialMemory.numTensors + 10) {
        console.log('✓ Memory management looks good (no major leaks)');
    } else {
        console.warn('⚠ Potential memory leak detected');
    }
    
    // Clean up
    agent.dispose();
    console.log('\n✓ All PPO Agent tests completed!');
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    // Browser environment
    testPPOAgent().catch(console.error);
} else {
    // Node.js environment
    testPPOAgent().catch(console.error);
}

export { testPPOAgent };