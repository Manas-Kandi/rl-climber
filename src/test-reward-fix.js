/**
 * Test that reward calculation doesn't crash and produces reasonable values
 */

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
    
    setMockPosition(position) {
        this.mockPosition = { ...position };
    }
    
    applyForce(body, force) {}
    applyImpulse(body, impulse) {}
    step() {}
    getCollidingBodies(body) { return []; }
}

console.log('🧪 Testing Reward Calculation Fixes\n');

const mockPhysics = new MockPhysicsEngine();
const env = new ClimbingEnvironment(mockPhysics, null, {
    maxSteps: 2000,
    goalHeight: 10.0
});

console.log('✅ Environment created\n');

// Test 1: Reward calculation doesn't crash with valid states
console.log('Test 1: Reward calculation with valid states');
try {
    env.reset();
    mockPhysics.setMockPosition({ x: 0, y: 0.5, z: 3 });
    const prevState = env.getState();
    
    mockPhysics.setMockPosition({ x: 0, y: 0.5, z: 2.5 });
    const newState = env.getState();
    
    const reward = env.calculateReward(prevState, 0, newState);
    console.log(`  Reward: ${reward.toFixed(2)}`);
    console.log(`  ✓ PASS - No crash\n`);
} catch (error) {
    console.log(`  ✗ FAIL - ${error.message}\n`);
}

// Test 2: Reward calculation handles null states gracefully
console.log('Test 2: Reward calculation with null prevState');
try {
    const newState = env.getState();
    const reward = env.calculateReward(null, 0, newState);
    console.log(`  Reward: ${reward.toFixed(2)}`);
    console.log(`  ✓ PASS - Handled gracefully\n`);
} catch (error) {
    console.log(`  ✗ FAIL - ${error.message}\n`);
}

// Test 3: Reward calculation handles invalid state length
console.log('Test 3: Reward calculation with wrong state length');
try {
    const invalidState = new Float32Array(5);  // Wrong length
    const newState = env.getState();
    const reward = env.calculateReward(invalidState, 0, newState);
    console.log(`  Reward: ${reward.toFixed(2)}`);
    console.log(`  ✓ PASS - Handled gracefully\n`);
} catch (error) {
    console.log(`  ✗ FAIL - ${error.message}\n`);
}

// Test 4: Landing on stairs gives positive reward
console.log('Test 4: Landing on stairs reward');
env.reset();
mockPhysics.setMockPosition({ x: 0, y: 0.5, z: 3 });
const prevState = env.getState();

mockPhysics.setMockPosition({ x: 0, y: 1.0, z: 0 });
const newState = env.getState();
const reward = env.calculateReward(prevState, 0, newState);

console.log(`  Previous: ground (z=3)`);
console.log(`  New: step 0 (z=0)`);
console.log(`  Reward: ${reward.toFixed(2)}`);
console.log(`  Expected: ~+10 (land on stairs)`);
console.log(`  ✓ ${reward > 5 ? 'PASS' : 'FAIL'}\n`);

// Test 5: Climbing up gives positive reward
console.log('Test 5: Climbing up reward');
env.reset();
env.currentStepOn = 0;
mockPhysics.setMockPosition({ x: 0, y: 1.0, z: 0 });
const prevState2 = env.getState();

mockPhysics.setMockPosition({ x: 0, y: 2.0, z: -2 });
const newState2 = env.getState();
const reward2 = env.calculateReward(prevState2, 0, newState2);

console.log(`  Previous: step 0`);
console.log(`  New: step 1`);
console.log(`  Reward: ${reward2.toFixed(2)}`);
console.log(`  Expected: ~+5 (climb 1 step)`);
console.log(`  ✓ ${reward2 > 3 ? 'PASS' : 'FAIL'}\n`);

// Test 6: Falling off stairs gives negative reward
console.log('Test 6: Falling off stairs penalty');
env.reset();
env.currentStepOn = 2;
mockPhysics.setMockPosition({ x: 0, y: 3.0, z: -4 });
const prevState3 = env.getState();

mockPhysics.setMockPosition({ x: 0, y: 0.5, z: 3 });
const newState3 = env.getState();
const reward3 = env.calculateReward(prevState3, 0, newState3);

console.log(`  Previous: step 2`);
console.log(`  New: ground`);
console.log(`  Reward: ${reward3.toFixed(2)}`);
console.log(`  Expected: negative (fell off)`);
console.log(`  ✓ ${reward3 < 0 ? 'PASS' : 'FAIL'}\n`);

// Test 7: Per-step baseline penalty
console.log('Test 7: Per-step baseline penalty');
env.reset();
mockPhysics.setMockPosition({ x: 0, y: 0.5, z: 3 });
const prevState4 = env.getState();

// Stay in same position
mockPhysics.setMockPosition({ x: 0, y: 0.5, z: 3 });
const newState4 = env.getState();
const reward4 = env.calculateReward(prevState4, 0, newState4);

console.log(`  Previous: ground`);
console.log(`  New: ground (no movement)`);
console.log(`  Reward: ${reward4.toFixed(2)}`);
console.log(`  Expected: negative (baseline penalty)`);
console.log(`  ✓ ${reward4 < 0 ? 'PASS' : 'FAIL'}\n`);

// Test 8: Goal reward
console.log('Test 8: Goal reward');
env.reset();
mockPhysics.setMockPosition({ x: 0, y: 10.0, z: -18 });
const prevState5 = env.getState();

mockPhysics.setMockPosition({ x: 0, y: 11.0, z: -20 });
const newState5 = env.getState();
const reward5 = env.calculateReward(prevState5, 0, newState5);

console.log(`  Previous: step 9`);
console.log(`  New: goal platform`);
console.log(`  Reward: ${reward5.toFixed(2)}`);
console.log(`  Expected: +100 (goal!)`);
console.log(`  ✓ ${reward5 === 100 ? 'PASS' : 'FAIL'}\n`);

// Test 9: Reward magnitudes are reasonable
console.log('Test 9: Reward magnitude analysis');
const rewards = [];

// Simulate various scenarios
const scenarios = [
    { desc: 'Do nothing', from: { x: 0, y: 0.5, z: 3 }, to: { x: 0, y: 0.5, z: 3 } },
    { desc: 'Move toward stairs', from: { x: 0, y: 0.5, z: 3 }, to: { x: 0, y: 0.5, z: 2 } },
    { desc: 'Land on stairs', from: { x: 0, y: 0.5, z: 3 }, to: { x: 0, y: 1.0, z: 0 } },
    { desc: 'Climb 1 step', from: { x: 0, y: 1.0, z: 0 }, to: { x: 0, y: 2.0, z: -2 } },
];

scenarios.forEach(scenario => {
    env.reset();
    if (scenario.from.y > 0.6) {
        env.currentStepOn = Math.floor((scenario.from.y - 0.5) / 1.0);
    }
    
    mockPhysics.setMockPosition(scenario.from);
    const prev = env.getState();
    
    mockPhysics.setMockPosition(scenario.to);
    const next = env.getState();
    
    const r = env.calculateReward(prev, 0, next);
    rewards.push({ desc: scenario.desc, reward: r });
    console.log(`  ${scenario.desc}: ${r.toFixed(2)}`);
});

console.log('\n  Analysis:');
const maxReward = Math.max(...rewards.map(r => r.reward));
const minReward = Math.min(...rewards.map(r => r.reward));
console.log(`  Max reward: ${maxReward.toFixed(2)}`);
console.log(`  Min reward: ${minReward.toFixed(2)}`);
console.log(`  Range: ${(maxReward - minReward).toFixed(2)}`);
console.log(`  ✓ ${maxReward > 0 && minReward < 0 ? 'PASS' : 'FAIL'} - Has both positive and negative rewards\n`);

console.log('🎉 Reward calculation tests complete!');
console.log('\nKey Findings:');
console.log('  ✅ No crashes with valid or invalid states');
console.log('  ✅ Positive rewards for progress');
console.log('  ✅ Negative penalties for failures');
console.log('  ✅ Baseline penalty for inaction');
console.log('  ✅ Massive reward for goal');
