/**
 * Unit tests for ClimbingEnvironment state calculation
 */
import { ClimbingEnvironment } from './ClimbingEnvironment.js';

// Mock physics engine for testing
class MockPhysicsEngine {
  constructor() {
    this.mockPosition = { x: 0, y: 1, z: 0 };
    this.mockVelocity = { x: 0, y: 0, z: 0 };
  }
  
  createAgentBody() {
    return { id: 'mock-agent' };
  }
  
  getBodyPosition() {
    return this.mockPosition;
  }
  
  getBodyVelocity() {
    return this.mockVelocity;
  }
  
  setMockPosition(pos) {
    this.mockPosition = pos;
  }
  
  setMockVelocity(vel) {
    this.mockVelocity = vel;
  }
}

// Mock rendering engine for testing
class MockRenderingEngine {
  // Empty mock - not needed for state tests
}

/**
 * Test state calculation functionality
 */
function testStateCalculation() {
  console.log('Testing ClimbingEnvironment state calculation...');
  
  const mockPhysics = new MockPhysicsEngine();
  const mockRendering = new MockRenderingEngine();
  
  const env = new ClimbingEnvironment(mockPhysics, mockRendering);
  
  // Test 1: Initial state
  console.log('Test 1: Initial state');
  const initialState = env.getState();
  console.log('Initial state:', initialState);
  console.log('State length:', initialState.length);
  console.log('Expected length: 9');
  console.log('Test 1 passed:', initialState.length === 9);
  
  // Test 2: State normalization
  console.log('\nTest 2: State normalization');
  mockPhysics.setMockPosition({ x: 5, y: 10, z: -3 });
  mockPhysics.setMockVelocity({ x: 10, y: -5, z: 2 });
  env.currentStep = 250; // Half way through episode
  
  const normalizedState = env.getState();
  console.log('Normalized state:', normalizedState);
  
  // Check that all values are within expected ranges
  const positionInRange = normalizedState[0] >= -1 && normalizedState[0] <= 1 &&
                         normalizedState[1] >= -1 && normalizedState[1] <= 1 &&
                         normalizedState[2] >= -1 && normalizedState[2] <= 1;
  
  const velocityInRange = normalizedState[3] >= -1 && normalizedState[3] <= 1 &&
                         normalizedState[4] >= -1 && normalizedState[4] <= 1 &&
                         normalizedState[5] >= -1 && normalizedState[5] <= 1;
  
  const distancesInRange = normalizedState[6] >= 0 && normalizedState[6] <= 1 &&
                          normalizedState[7] >= 0 && normalizedState[7] <= 1;
  
  const progressInRange = normalizedState[8] >= 0 && normalizedState[8] <= 1;
  
  console.log('Position values in range [-1, 1]:', positionInRange);
  console.log('Velocity values in range [-1, 1]:', velocityInRange);
  console.log('Distance values in range [0, 1]:', distancesInRange);
  console.log('Progress value in range [0, 1]:', progressInRange);
  console.log('Test 2 passed:', positionInRange && velocityInRange && distancesInRange && progressInRange);
  
  // Test 3: Distance calculations
  console.log('\nTest 3: Distance calculations');
  mockPhysics.setMockPosition({ x: 0, y: 14, z: -4 }); // At goal position
  const goalState = env.getState();
  console.log('State at goal position:', goalState);
  console.log('Distance to goal should be near 0:', goalState[6] < 0.1);
  
  // Test 4: Episode progress
  console.log('\nTest 4: Episode progress');
  env.currentStep = 0;
  const startProgress = env.getState()[8];
  env.currentStep = 500;
  const endProgress = env.getState()[8];
  console.log('Progress at start:', startProgress);
  console.log('Progress at end:', endProgress);
  console.log('Progress increases correctly:', startProgress < endProgress);
  
  console.log('\nAll state calculation tests completed!');
}

/**
 * Test reset functionality
 */
function testReset() {
  console.log('\nTesting ClimbingEnvironment reset functionality...');
  
  const mockPhysics = new MockPhysicsEngine();
  const mockRendering = new MockRenderingEngine();
  
  // Add methods needed for reset
  mockPhysics.setBodyPosition = function(body, pos) {
    this.mockPosition = pos;
  };
  
  mockPhysics.setBodyVelocity = function(body, vel) {
    this.mockVelocity = vel;
  };
  
  const env = new ClimbingEnvironment(mockPhysics, mockRendering);
  
  // Modify environment state
  env.currentStep = 100;
  env.totalReward = 50;
  mockPhysics.setMockPosition({ x: 5, y: 10, z: -3 });
  mockPhysics.setMockVelocity({ x: 10, y: -5, z: 2 });
  
  console.log('Before reset - Step:', env.currentStep, 'Reward:', env.totalReward);
  console.log('Before reset - Position:', mockPhysics.getBodyPosition());
  console.log('Before reset - Velocity:', mockPhysics.getBodyVelocity());
  
  // Reset environment
  const initialState = env.reset();
  
  console.log('After reset - Step:', env.currentStep, 'Reward:', env.totalReward);
  console.log('After reset - Position:', mockPhysics.getBodyPosition());
  console.log('After reset - Velocity:', mockPhysics.getBodyVelocity());
  console.log('Initial state length:', initialState.length);
  
  // Verify reset worked correctly
  const stepReset = env.currentStep === 0;
  const rewardReset = env.totalReward === 0;
  const positionReset = mockPhysics.getBodyPosition().x === 0 && 
                       mockPhysics.getBodyPosition().y === 1 && 
                       mockPhysics.getBodyPosition().z === 0;
  const velocityReset = mockPhysics.getBodyVelocity().x === 0 && 
                       mockPhysics.getBodyVelocity().y === 0 && 
                       mockPhysics.getBodyVelocity().z === 0;
  const stateReturned = initialState instanceof Float32Array && initialState.length === 9;
  
  console.log('Step counter reset:', stepReset);
  console.log('Total reward reset:', rewardReset);
  console.log('Position reset to start:', positionReset);
  console.log('Velocity reset to zero:', velocityReset);
  console.log('Initial state returned correctly:', stateReturned);
  
  const allTestsPassed = stepReset && rewardReset && positionReset && velocityReset && stateReturned;
  console.log('Reset test passed:', allTestsPassed);
  
  console.log('\nReset functionality tests completed!');
}

/**
 * Test reward calculation functionality
 */
function testRewardCalculation() {
  console.log('\nTesting ClimbingEnvironment reward calculation...');
  
  const mockPhysics = new MockPhysicsEngine();
  const mockRendering = new MockRenderingEngine();
  
  // Add methods needed for reward calculation
  mockPhysics.setBodyPosition = function(body, pos) {
    this.mockPosition = pos;
  };
  
  mockPhysics.setBodyVelocity = function(body, vel) {
    this.mockVelocity = vel;
  };
  
  mockPhysics.getCollidingBodies = function(body) {
    return this.mockCollidingBodies || [];
  };
  
  mockPhysics.bodies = new Map();
  
  const env = new ClimbingEnvironment(mockPhysics, mockRendering);
  
  // Test 1: Basic survival and time penalty
  console.log('Test 1: Basic survival and time penalty');
  mockPhysics.setMockPosition({ x: 0, y: 1, z: 0 });
  const basicReward = env.calculateReward(null, 0, null);
  const expectedBasic = 0.1 + (-0.01); // survival + time penalty
  console.log('Basic reward:', basicReward);
  console.log('Expected:', expectedBasic);
  console.log('Basic reward test passed:', Math.abs(basicReward - expectedBasic) < 0.001);
  
  // Test 2: Height gain reward
  console.log('\nTest 2: Height gain reward');
  const prevState = new Float32Array([0, 0.06666667, 0, 0, 0, 0, 0.68, 0.34, 0]); // y=1
  mockPhysics.setMockPosition({ x: 0, y: 3, z: 0 }); // Gained 2 units height
  const newState = new Float32Array([0, 0.2, 0, 0, 0, 0, 0.68, 0.34, 0]); // y=3
  const heightReward = env.calculateReward(prevState, 0, newState);
  console.log('Previous Y (denormalized):', prevState[1] * 15.0);
  console.log('New Y:', 3);
  console.log('Height gain should be:', 3 - (prevState[1] * 15.0));
  console.log('Height gain reward:', heightReward);
  console.log('Should include height gain bonus (>0.1):', heightReward > 0.1);
  
  // Test 3: Goal reached reward
  console.log('\nTest 3: Goal reached reward');
  mockPhysics.setMockPosition({ x: 0, y: 15, z: 0 }); // Above goal height (14)
  const goalReward = env.calculateReward(null, 0, null);
  console.log('Goal reward:', goalReward);
  console.log('Should include goal bonus (>100):', goalReward > 100);
  
  // Test 4: Fall penalty
  console.log('\nTest 4: Fall penalty');
  mockPhysics.setMockPosition({ x: 0, y: -3, z: 0 }); // Below fall threshold (-2)
  const fallReward = env.calculateReward(null, 0, null);
  console.log('Fall reward:', fallReward);
  console.log('Should include fall penalty (<-40):', fallReward < -40);
  
  // Test 5: Ledge grab reward
  console.log('\nTest 5: Ledge grab reward');
  mockPhysics.setMockPosition({ x: 0, y: 2, z: 0 });
  const mockLedgeBody = { id: 'mock-ledge' };
  mockPhysics.mockCollidingBodies = [mockLedgeBody];
  mockPhysics.bodies.set('ledge_0_2_-5', mockLedgeBody);
  const ledgeReward = env.calculateReward(null, 0, null);
  console.log('Ledge grab reward:', ledgeReward);
  console.log('Should include ledge bonus (>5):', ledgeReward > 5);
  
  console.log('\nReward calculation tests completed!');
}

/**
 * Test step method functionality
 */
function testStepMethod() {
  console.log('\nTesting ClimbingEnvironment step method...');
  
  const mockPhysics = new MockPhysicsEngine();
  const mockRendering = new MockRenderingEngine();
  
  // Add all methods needed for step
  mockPhysics.setBodyPosition = function(body, pos) {
    this.mockPosition = pos;
  };
  
  mockPhysics.setBodyVelocity = function(body, vel) {
    this.mockVelocity = vel;
  };
  
  mockPhysics.getCollidingBodies = function(body) {
    return this.mockCollidingBodies || [];
  };
  
  mockPhysics.applyForce = function(body, force) {
    console.log('Applied force:', force);
  };
  
  mockPhysics.applyImpulse = function(body, impulse) {
    console.log('Applied impulse:', impulse);
  };
  
  mockPhysics.step = function() {
    // Mock physics step - could update position slightly
  };
  
  mockPhysics.bodies = new Map();
  
  const env = new ClimbingEnvironment(mockPhysics, mockRendering);
  
  // Test 1: Basic step execution
  console.log('Test 1: Basic step execution');
  mockPhysics.setMockPosition({ x: 0, y: 1, z: 0 });
  const stepResult = env.step(0); // FORWARD action
  
  console.log('Step result keys:', Object.keys(stepResult));
  console.log('Has state:', stepResult.state instanceof Float32Array);
  console.log('Has reward:', typeof stepResult.reward === 'number');
  console.log('Has done:', typeof stepResult.done === 'boolean');
  console.log('Has info:', typeof stepResult.info === 'object');
  console.log('Step counter incremented:', env.currentStep === 1);
  
  // Test 2: Different actions
  console.log('\nTest 2: Different actions');
  env.step(1); // BACKWARD
  env.step(2); // LEFT
  env.step(3); // RIGHT
  env.step(4); // JUMP (should use impulse)
  env.step(5); // GRAB
  console.log('Step counter after 6 actions:', env.currentStep);
  
  // Test 3: Termination conditions
  console.log('\nTest 3: Termination conditions');
  
  // Test fall termination
  mockPhysics.setMockPosition({ x: 0, y: -3, z: 0 }); // Below fall threshold
  const fallResult = env.step(0);
  console.log('Fall termination - done:', fallResult.done);
  console.log('Fall termination reason:', fallResult.info.terminationReason);
  
  // Reset for goal test
  env.reset();
  mockPhysics.setMockPosition({ x: 0, y: 15, z: 0 }); // Above goal height
  const goalResult = env.step(0);
  console.log('Goal termination - done:', goalResult.done);
  console.log('Goal termination reason:', goalResult.info.terminationReason);
  
  // Test 4: Max steps termination
  console.log('\nTest 4: Max steps termination');
  env.reset();
  env.currentStep = 500; // At max steps
  mockPhysics.setMockPosition({ x: 0, y: 5, z: 0 }); // Normal position
  const maxStepsResult = env.step(0);
  console.log('Max steps termination - done:', maxStepsResult.done);
  console.log('Max steps termination reason:', maxStepsResult.info.terminationReason);
  
  console.log('\nStep method tests completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStateCalculation();
  testReset();
  testRewardCalculation();
  testStepMethod();
}

export { testStateCalculation, testReset, testRewardCalculation, testStepMethod };