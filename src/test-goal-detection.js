/**
 * Test goal detection and rewards
 */

import { ClimbingEnvironment } from './rl/ClimbingEnvironment.js';

// Mock physics engine for testing
class MockPhysicsEngine {
    constructor() {
        this.mockPosition = { x: 0, y: 0.5, z: 3 };
        this.mockVelocity = { x: 0, y: 0, z: 0 };
        this.mockBodies = new Map();
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
    
    setMockVelocity(velocity) {
        this.mockVelocity = { ...velocity };
    }
    
    applyForce(body, force) {}
    applyImpulse(body, impulse) {}
    step() {}
    
    getCollidingBodies(body) {
        return [];
    }
}

console.log('🧪 Testing Goal Detection System\n');

// Create mock physics engine
const mockPhysics = new MockPhysicsEngine();

// Create environment
const env = new ClimbingEnvironment(mockPhysics, null, {
    maxSteps: 2000,
    goalHeight: 10.0
});

console.log('✅ Environment created\n');

// Test 1: Agent on ground (step -1)
console.log('Test 1: Agent on ground');
mockPhysics.setMockPosition({ x: 0, y: 0.5, z: 3 });
let currentStep = env.detectCurrentStep();
console.log(`  Position: (0, 0.5, 3)`);
console.log(`  Detected step: ${currentStep}`);
console.log(`  Expected: -1 (ground)`);
console.log(`  ✓ ${currentStep === -1 ? 'PASS' : 'FAIL'}\n`);

// Test 2: Agent on step 0
console.log('Test 2: Agent on step 0');
mockPhysics.setMockPosition({ x: 0, y: 1.0, z: 0 });
currentStep = env.detectCurrentStep();
console.log(`  Position: (0, 1.0, 0)`);
console.log(`  Detected step: ${currentStep}`);
console.log(`  Expected: 0`);
console.log(`  ✓ ${currentStep === 0 ? 'PASS' : 'FAIL'}\n`);

// Test 3: Agent on step 5
console.log('Test 3: Agent on step 5');
mockPhysics.setMockPosition({ x: 0, y: 6.0, z: -10 });
currentStep = env.detectCurrentStep();
console.log(`  Position: (0, 6.0, -10)`);
console.log(`  Detected step: ${currentStep}`);
console.log(`  Expected: 5`);
console.log(`  ✓ ${currentStep === 5 ? 'PASS' : 'FAIL'}\n`);

// Test 4: Agent on step 9 (last step)
console.log('Test 4: Agent on step 9 (last step)');
mockPhysics.setMockPosition({ x: 0, y: 10.0, z: -18 });
currentStep = env.detectCurrentStep();
console.log(`  Position: (0, 10.0, -18)`);
console.log(`  Detected step: ${currentStep}`);
console.log(`  Expected: 9`);
console.log(`  ✓ ${currentStep === 9 ? 'PASS' : 'FAIL'}\n`);

// Test 5: Agent on GOAL PLATFORM
console.log('Test 5: Agent on GOAL PLATFORM');
mockPhysics.setMockPosition({ x: 0, y: 11.0, z: -20 });
currentStep = env.detectCurrentStep();
const isOnGoal = env.isOnGoalPlatform({ x: 0, y: 11.0, z: -20 });
console.log(`  Position: (0, 11.0, -20)`);
console.log(`  Detected step: ${currentStep}`);
console.log(`  Is on goal platform: ${isOnGoal}`);
console.log(`  Expected: 10 (GOAL!)`);
console.log(`  ✓ ${currentStep === 10 ? 'PASS' : 'FAIL'}\n`);

// Test 6: Goal platform bounds (edge cases)
console.log('Test 6: Goal platform bounds');
const testPositions = [
    { pos: { x: 0, y: 11.0, z: -20 }, expected: true, desc: 'center' },
    { pos: { x: 1.9, y: 11.0, z: -20 }, expected: true, desc: 'right edge' },
    { pos: { x: -1.9, y: 11.0, z: -20 }, expected: true, desc: 'left edge' },
    { pos: { x: 0, y: 11.0, z: -19.0 }, expected: true, desc: 'front edge' },
    { pos: { x: 0, y: 11.0, z: -21.0 }, expected: true, desc: 'back edge' },
    { pos: { x: 2.5, y: 11.0, z: -20 }, expected: false, desc: 'outside X' },
    { pos: { x: 0, y: 11.0, z: -22 }, expected: false, desc: 'outside Z' },
    { pos: { x: 0, y: 9.0, z: -20 }, expected: false, desc: 'below platform' },
];

testPositions.forEach(test => {
    const isOnGoal = env.isOnGoalPlatform(test.pos);
    const pass = isOnGoal === test.expected;
    console.log(`  ${test.desc}: ${pass ? '✓ PASS' : '✗ FAIL'} (got ${isOnGoal}, expected ${test.expected})`);
});
console.log();

// Test 7: Reward for reaching goal
console.log('Test 7: Reward for reaching goal');
env.reset();
mockPhysics.setMockPosition({ x: 0, y: 0.5, z: 3 });
const prevState = env.getState();

// Move to goal
mockPhysics.setMockPosition({ x: 0, y: 11.0, z: -20 });
const newState = env.getState();
const reward = env.calculateReward(prevState, 0, newState);

console.log(`  Previous position: (0, 0.5, 3)`);
console.log(`  New position: (0, 11.0, -20)`);
console.log(`  Reward: ${reward}`);
console.log(`  Expected: 100.0 (GOAL REWARD)`);
console.log(`  ✓ ${reward === 100.0 ? 'PASS' : 'FAIL'}\n`);

// Test 8: Terminal condition on goal
console.log('Test 8: Terminal condition on goal');
mockPhysics.setMockPosition({ x: 0, y: 11.0, z: -20 });
const isTerminal = env.isTerminal();
console.log(`  Position: (0, 11.0, -20)`);
console.log(`  Is terminal: ${isTerminal}`);
console.log(`  Expected: true`);
console.log(`  ✓ ${isTerminal ? 'PASS' : 'FAIL'}\n`);

// Test 9: Episode stats on goal
console.log('Test 9: Episode stats on goal');
mockPhysics.setMockPosition({ x: 0, y: 11.0, z: -20 });
env.highestStepReached = 10;
const stats = env.getEpisodeStats();
console.log(`  Position: (0, 11.0, -20)`);
console.log(`  Success: ${stats.success}`);
console.log(`  Highest step: ${stats.highestStep}`);
console.log(`  Expected success: true`);
console.log(`  ✓ ${stats.success ? 'PASS' : 'FAIL'}\n`);

// Test 10: Full episode to goal
console.log('Test 10: Full episode simulation to goal');
env.reset();
mockPhysics.setMockPosition({ x: 0, y: 0.5, z: 3 });

// Simulate climbing all steps
const steps = [
    { pos: { x: 0, y: 1.0, z: 0 }, step: 0 },
    { pos: { x: 0, y: 2.0, z: -2 }, step: 1 },
    { pos: { x: 0, y: 3.0, z: -4 }, step: 2 },
    { pos: { x: 0, y: 4.0, z: -6 }, step: 3 },
    { pos: { x: 0, y: 5.0, z: -8 }, step: 4 },
    { pos: { x: 0, y: 6.0, z: -10 }, step: 5 },
    { pos: { x: 0, y: 7.0, z: -12 }, step: 6 },
    { pos: { x: 0, y: 8.0, z: -14 }, step: 7 },
    { pos: { x: 0, y: 9.0, z: -16 }, step: 8 },
    { pos: { x: 0, y: 10.0, z: -18 }, step: 9 },
    { pos: { x: 0, y: 11.0, z: -20 }, step: 10 }, // GOAL!
];

let totalReward = 0;
steps.forEach((stepData, i) => {
    const prevState = env.getState();
    mockPhysics.setMockPosition(stepData.pos);
    const newState = env.getState();
    const reward = env.calculateReward(prevState, 0, newState);
    totalReward += reward;
    
    const detectedStep = env.detectCurrentStep();
    console.log(`  Step ${i}: pos=(${stepData.pos.x}, ${stepData.pos.y.toFixed(1)}, ${stepData.pos.z}) -> detected=${detectedStep}, reward=${reward.toFixed(1)}`);
});

console.log(`\n  Total reward: ${totalReward.toFixed(1)}`);
console.log(`  Final step detected: ${env.detectCurrentStep()}`);
console.log(`  Expected final step: 10 (GOAL)`);
console.log(`  ✓ ${env.detectCurrentStep() === 10 ? 'PASS' : 'FAIL'}\n`);

console.log('🎉 Goal detection tests complete!');
