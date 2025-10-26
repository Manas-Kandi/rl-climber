/**
 * Diagnose why training isn't working
 * This script checks if the agent is actually learning
 */

import { DQNAgent } from './rl/DQNAgent.js';
import { ClimbingEnvironment } from './rl/ClimbingEnvironment.js';

// Mock physics engine
class MockPhysicsEngine {
    constructor() {
        this.mockPosition = { x: 0, y: 0.5, z: 3 };
        this.mockVelocity = { x: 0, y: 0, z: 0 };
    }
    
    createAgentBody(position, mass, size, shape) {
        return { id: 'agent', position: { ...position } };
    }
    
    getBodyPosition(body) {
        return { ...this.mockPosition };
    }
    
    getBodyVelocity(body) {
        return { ...this.mockVelocity };
    }
    
    setBodyPosition(body, position) {
        this.mockPosition = { ...position };
    }
    
    setBodyVelocity(body, velocity) {
        this.mockVelocity = { ...velocity };
    }
    
    applyForce(body, force) {}
    applyImpulse(body, impulse) {}
    step() {
        // Simulate some movement
        this.mockPosition.z -= 0.1;
        if (this.mockPosition.z < -20) this.mockPosition.z = 3;
    }
    getCollidingBodies(body) { return []; }
}

console.log('🔍 Diagnosing Training Issues\n');

// Create environment and agent
const mockPhysics = new MockPhysicsEngine();
const env = new ClimbingEnvironment(mockPhysics, null, {
    maxSteps: 500,
    goalHeight: 10.0
});

const agent = new DQNAgent(13, 6, {
    learningRate: 0.001,
    epsilon: 1.0,  // Start with full exploration
    epsilonDecay: 0.995,
    epsilonMin: 0.01,
    gamma: 0.99,
    bufferSize: 10000,
    batchSize: 32
});

console.log('✅ Environment and agent created\n');

// Test 1: Check if agent can select actions
console.log('Test 1: Action selection');
const testState = env.getState();
console.log(`  State shape: ${testState.length}D`);
const action = agent.selectAction(testState, true);
console.log(`  Selected action: ${action}`);
console.log(`  ✓ PASS\n`);

// Test 2: Check if experiences are being stored
console.log('Test 2: Experience storage');
const initialBufferSize = agent.memory ? agent.memory.length : 0;
console.log(`  Initial buffer size: ${initialBufferSize}`);

// Run a few steps
for (let i = 0; i < 10; i++) {
    const state = env.getState();
    const action = agent.selectAction(state, true);
    const { state: nextState, reward, done } = env.step(action);
    
    try {
        agent.remember(state, action, reward, nextState, done);
    } catch (error) {
        console.log(`  ❌ Error in remember(): ${error.message}`);
    }
    
    if (done) env.reset();
}

const newBufferSize = agent.memory ? agent.memory.length : 0;
console.log(`  New buffer size: ${newBufferSize}`);
console.log(`  Experiences added: ${newBufferSize - initialBufferSize}`);
console.log(`  ✓ ${newBufferSize > initialBufferSize ? 'PASS' : 'FAIL'}\n`);

// Test 3: Check if training actually updates weights
console.log('Test 3: Weight updates during training');

// Fill buffer with enough experiences
console.log('  Filling replay buffer...');
env.reset();
for (let i = 0; i < 100; i++) {
    const state = env.getState();
    const action = agent.selectAction(state, true);
    const { state: nextState, reward, done } = env.step(action);
    
    try {
        agent.remember(state, action, reward, nextState, done);
    } catch (error) {
        console.log(`  ❌ Error in remember(): ${error.message}`);
        break;
    }
    
    if (done) env.reset();
}
console.log(`  Buffer size: ${agent.memory.length}`);

// Get initial Q-values
const sampleState = env.getState();
const initialQValues = agent.getQValues(sampleState);
console.log(`  Initial Q-values: [${initialQValues.map(v => v.toFixed(3)).join(', ')}]`);

// Train multiple times
console.log('  Training for 50 batches...');
let totalLoss = 0;
let lossCount = 0;
for (let i = 0; i < 50; i++) {
    if (agent.canTrain && agent.canTrain(32)) {
        const result = agent.train(32);
        if (result && result.loss !== undefined) {
            totalLoss += result.loss;
            lossCount++;
        }
    }
}

const avgLoss = lossCount > 0 ? totalLoss / lossCount : 0;
console.log(`  Average loss: ${avgLoss.toFixed(4)}`);

// Get new Q-values
const newQValues = agent.getQValues(sampleState);
console.log(`  New Q-values: [${newQValues.map(v => v.toFixed(3)).join(', ')}]`);

// Check if Q-values changed
const qValuesChanged = initialQValues.some((v, i) => Math.abs(v - newQValues[i]) > 0.001);
console.log(`  Q-values changed: ${qValuesChanged}`);
console.log(`  ✓ ${qValuesChanged ? 'PASS' : 'FAIL'}\n`);

// Test 4: Check epsilon decay
console.log('Test 4: Epsilon decay');
const initialEpsilon = agent.epsilon;
console.log(`  Initial epsilon: ${initialEpsilon.toFixed(4)}`);

// Simulate many episodes
for (let i = 0; i < 100; i++) {
    agent.decayEpsilon();
}

const newEpsilon = agent.epsilon;
console.log(`  After 100 decays: ${newEpsilon.toFixed(4)}`);
console.log(`  Epsilon min: ${agent.epsilonMin}`);
console.log(`  ✓ ${newEpsilon < initialEpsilon ? 'PASS' : 'FAIL'}\n`);

// Test 5: Run a full training episode and check metrics
console.log('Test 5: Full training episode');
env.reset();
let episodeReward = 0;
let steps = 0;
let done = false;

while (!done && steps < 500) {
    const state = env.getState();
    const action = agent.selectAction(state, true);
    const result = env.step(action);
    
    agent.remember(state, action, result.reward, result.state, result.done);
    episodeReward += result.reward;
    done = result.done;
    steps++;
    
    // Train every 4 steps
    if (steps % 4 === 0 && agent.canTrain && agent.canTrain(32)) {
        agent.train(32);
    }
}

console.log(`  Episode steps: ${steps}`);
console.log(`  Episode reward: ${episodeReward.toFixed(2)}`);
console.log(`  Episode ended: ${done ? 'Yes' : 'No (timeout)'}`);
console.log(`  ✓ PASS\n`);

// Test 6: Check if agent behavior changes over time
console.log('Test 6: Behavior change over episodes');
console.log('  Running 20 episodes with training...');

const episodeRewards = [];
for (let episode = 0; episode < 20; episode++) {
    env.reset();
    let reward = 0;
    let done = false;
    let steps = 0;
    
    while (!done && steps < 500) {
        const state = env.getState();
        const action = agent.selectAction(state, true);
        const result = env.step(action);
        
        agent.remember(state, action, result.reward, result.state, result.done);
        reward += result.reward;
        done = result.done;
        steps++;
        
        if (steps % 4 === 0 && agent.canTrain && agent.canTrain(32)) {
            agent.train(32);
        }
    }
    
    episodeRewards.push(reward);
    agent.decayEpsilon();
}

console.log(`  Episode rewards: [${episodeRewards.map(r => r.toFixed(1)).join(', ')}]`);

const firstHalf = episodeRewards.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
const secondHalf = episodeRewards.slice(10).reduce((a, b) => a + b, 0) / 10;

console.log(`  First 10 episodes avg: ${firstHalf.toFixed(2)}`);
console.log(`  Last 10 episodes avg: ${secondHalf.toFixed(2)}`);
console.log(`  Improvement: ${(secondHalf - firstHalf).toFixed(2)}`);
console.log(`  ✓ ${secondHalf > firstHalf ? 'PASS - Agent improving!' : 'WARN - No improvement yet'}\n`);

// Summary
console.log('═══════════════════════════════════════');
console.log('DIAGNOSIS SUMMARY');
console.log('═══════════════════════════════════════\n');

console.log('✅ Action selection works');
console.log(`${newBufferSize > initialBufferSize ? '✅' : '❌'} Experience storage works`);
console.log(`${qValuesChanged ? '✅' : '❌'} Network weights update during training`);
console.log(`${newEpsilon < initialEpsilon ? '✅' : '❌'} Epsilon decay works`);
console.log(`${secondHalf > firstHalf ? '✅' : '⚠️ '} Agent shows improvement\n`);

if (!qValuesChanged) {
    console.log('🚨 CRITICAL ISSUE: Network weights not updating!');
    console.log('   Possible causes:');
    console.log('   - Learning rate too low');
    console.log('   - Gradients vanishing');
    console.log('   - Training not being called');
    console.log('   - TensorFlow.js backend issue\n');
}

if (secondHalf <= firstHalf) {
    console.log('⚠️  WARNING: No improvement over 20 episodes');
    console.log('   Possible causes:');
    console.log('   - Task too difficult');
    console.log('   - Rewards not informative enough');
    console.log('   - Exploration not finding good states');
    console.log('   - Need more training time\n');
}

console.log('Recommendations:');
if (!qValuesChanged) {
    console.log('  1. Increase learning rate to 0.01');
    console.log('  2. Check TensorFlow.js backend');
    console.log('  3. Add gradient clipping');
} else if (secondHalf <= firstHalf) {
    console.log('  1. Increase positive rewards further');
    console.log('  2. Add curriculum learning');
    console.log('  3. Increase exploration time (higher epsilon)');
    console.log('  4. Simplify task (fewer steps)');
} else {
    console.log('  ✅ Training is working! Just needs more time.');
    console.log('  Continue training for 100-500 episodes.');
}
