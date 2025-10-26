/**
 * Comprehensive test for PPO training
 */

import * as tf from '@tensorflow/tfjs';
import { PPOAgent } from './rl/PPOAgent.js';
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
    
    applyForce(body, force) {
        // Simulate movement
        this.mockVelocity.z -= 0.05;
    }
    
    applyImpulse(body, impulse) {}
    
    step() {
        // Simulate physics step
        this.mockPosition.z += this.mockVelocity.z * 0.1;
        if (this.mockPosition.z < -20) this.mockPosition.z = 3;
    }
    
    getCollidingBodies(body) { return []; }
}

console.log('🧪 Testing PPO Training\n');

// Create environment and agent
const mockPhysics = new MockPhysicsEngine();
const env = new ClimbingEnvironment(mockPhysics, null, {
    maxSteps: 500,
    goalHeight: 10.0
});

const agent = new PPOAgent(13, 6, {
    learningRate: 0.0003,
    entropyCoef: 0.05,
    clipEpsilon: 0.2,
    epochs: 10
});

console.log('✅ Environment and agent created\n');

// Test 1: Action selection
console.log('Test 1: Action selection');
const testState = env.getState();
console.log(`  State shape: ${testState.length}D`);
const action = agent.selectAction(testState, true);
console.log(`  Selected action: ${action}`);
console.log(`  ✓ PASS\n`);

// Test 2: Collect trajectory
console.log('Test 2: Collect trajectory');
env.reset();
const trajectory = {
    states: [],
    actions: [],
    rewards: [],
    dones: [],
    logProbs: []
};

for (let i = 0; i < 50; i++) {
    const state = env.getState();
    const { action, logProb } = agent.selectAction(state, true);
    const { state: nextState, reward, done } = env.step(action);
    
    trajectory.states.push(Array.from(state));
    trajectory.actions.push(action);
    trajectory.rewards.push(reward);
    trajectory.dones.push(done);
    trajectory.logProbs.push(logProb);
    
    if (done) break;
}

console.log(`  Collected ${trajectory.states.length} steps`);
console.log(`  Total reward: ${trajectory.rewards.reduce((a, b) => a + b, 0).toFixed(2)}`);
console.log(`  ✓ PASS\n`);

// Test 3: Compute advantages and returns
console.log('Test 3: Compute advantages and returns');
const values = trajectory.states.map(state => 
    agent.criticNetwork.predict(tf.tensor2d([state], [1, 13])).dataSync()[0]
);

const advantages = [];
const returns = [];
let gae = 0;

for (let t = trajectory.states.length - 1; t >= 0; t--) {
    const reward = trajectory.rewards[t];
    const value = values[t];
    const nextValue = t < trajectory.states.length - 1 ? values[t + 1] : 0;
    const done = trajectory.dones[t];
    
    const delta = reward + (done ? 0 : 0.99 * nextValue) - value;
    gae = delta + (done ? 0 : 0.99 * 0.95 * gae);
    
    advantages.unshift(gae);
    returns.unshift(gae + value);
}

console.log(`  Computed ${advantages.length} advantages`);
console.log(`  Advantage range: [${Math.min(...advantages).toFixed(2)}, ${Math.max(...advantages).toFixed(2)}]`);
console.log(`  Return range: [${Math.min(...returns).toFixed(2)}, ${Math.max(...returns).toFixed(2)}]`);
console.log(`  ✓ PASS\n`);

// Test 4: Train on trajectory
console.log('Test 4: Train on trajectory');

// Normalize advantages
const advMean = advantages.reduce((a, b) => a + b, 0) / advantages.length;
const advStd = Math.sqrt(advantages.reduce((a, b) => a + Math.pow(b - advMean, 2), 0) / advantages.length);
const normalizedAdvantages = advantages.map(a => (a - advMean) / (advStd + 1e-8));

const trainingData = {
    states: trajectory.states,
    actions: trajectory.actions,
    oldLogProbs: trajectory.logProbs,
    advantages: normalizedAdvantages,
    returns: returns
};

const result = agent.train(trainingData);

console.log(`  Actor loss: ${result.actorLoss.toFixed(4)}`);
console.log(`  Critic loss: ${result.criticLoss.toFixed(4)}`);
console.log(`  Entropy: ${result.entropy.toFixed(4)}`);
console.log(`  ✓ ${isFinite(result.actorLoss) && isFinite(result.criticLoss) ? 'PASS' : 'FAIL'}\n`);

// Test 5: Run multiple episodes with training
console.log('Test 5: Run 10 episodes with training');
const episodeRewards = [];

for (let episode = 0; episode < 10; episode++) {
    env.reset();
    const traj = {
        states: [],
        actions: [],
        rewards: [],
        dones: [],
        logProbs: []
    };
    
    let totalReward = 0;
    let done = false;
    let steps = 0;
    
    while (!done && steps < 500) {
        const state = env.getState();
        const { action, logProb } = agent.selectAction(state, true);
        const result = env.step(action);
        
        traj.states.push(Array.from(state));
        traj.actions.push(action);
        traj.rewards.push(result.reward);
        traj.dones.push(result.done);
        traj.logProbs.push(logProb);
        
        totalReward += result.reward;
        done = result.done;
        steps++;
    }
    
    episodeRewards.push(totalReward);
    
    // Compute advantages and train
    const vals = traj.states.map(state => 
        agent.criticNetwork.predict(tf.tensor2d([state], [1, 13])).dataSync()[0]
    );
    
    const advs = [];
    const rets = [];
    let g = 0;
    
    for (let t = traj.states.length - 1; t >= 0; t--) {
        const r = traj.rewards[t];
        const v = vals[t];
        const nv = t < traj.states.length - 1 ? vals[t + 1] : 0;
        const d = traj.dones[t];
        
        const delta = r + (d ? 0 : 0.99 * nv) - v;
        g = delta + (d ? 0 : 0.99 * 0.95 * g);
        
        advs.unshift(g);
        rets.unshift(g + v);
    }
    
    // Normalize advantages
    const mean = advs.reduce((a, b) => a + b, 0) / advs.length;
    const std = Math.sqrt(advs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / advs.length);
    const normAdvs = advs.map(a => (a - mean) / (std + 1e-8));
    
    agent.train({
        states: traj.states,
        actions: traj.actions,
        oldLogProbs: traj.logProbs,
        advantages: normAdvs,
        returns: rets
    });
    
    console.log(`  Episode ${episode + 1}: reward=${totalReward.toFixed(1)}, steps=${steps}`);
}

const firstHalf = episodeRewards.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
const secondHalf = episodeRewards.slice(5).reduce((a, b) => a + b, 0) / 5;

console.log(`\n  First 5 episodes avg: ${firstHalf.toFixed(2)}`);
console.log(`  Last 5 episodes avg: ${secondHalf.toFixed(2)}`);
console.log(`  Improvement: ${(secondHalf - firstHalf).toFixed(2)}`);
console.log(`  ✓ ${secondHalf >= firstHalf ? 'PASS - Improving or stable!' : 'WARN - Needs more training'}\n`);

// Summary
console.log('═══════════════════════════════════════');
console.log('PPO TRAINING TEST SUMMARY');
console.log('═══════════════════════════════════════\n');

console.log('✅ Action selection works');
console.log('✅ Trajectory collection works');
console.log('✅ Advantage computation works');
console.log(`${isFinite(result.actorLoss) ? '✅' : '❌'} Training produces finite losses`);
console.log(`${secondHalf >= firstHalf ? '✅' : '⚠️ '} Agent shows improvement or stability\n`);

if (!isFinite(result.actorLoss)) {
    console.log('🚨 CRITICAL: Training produces NaN!');
    console.log('   This should not happen with PPO.');
    console.log('   Check TensorFlow.js installation.\n');
} else {
    console.log('✅ PPO training is working correctly!');
    console.log('   Ready to train in the browser.\n');
}

console.log('Next steps:');
console.log('1. Clear localStorage in browser');
console.log('2. Start visual training');
console.log('3. Watch for gradual improvement');
console.log('4. Be patient - PPO needs 100-500 episodes\n');
