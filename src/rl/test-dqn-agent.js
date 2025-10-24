import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from './DQNAgent.js';

/**
 * Unit tests for DQN Agent action selection
 */

// Test configuration
const TEST_STATE_SIZE = 9;
const TEST_ACTION_SIZE = 6;
const TEST_CONFIG = {
  gamma: 0.99,
  epsilon: 0.5,
  learningRate: 0.001,
  bufferSize: 1000
};

/**
 * Test DQN Agent initialization
 */
function testDQNAgentInitialization() {
  console.log('Testing DQN Agent initialization...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, TEST_CONFIG);
  
  // Test basic properties
  console.assert(agent.stateSize === TEST_STATE_SIZE, 'State size should match');
  console.assert(agent.actionSize === TEST_ACTION_SIZE, 'Action size should match');
  console.assert(agent.gamma === TEST_CONFIG.gamma, 'Gamma should match config');
  console.assert(agent.epsilon === TEST_CONFIG.epsilon, 'Epsilon should match config');
  
  // Test networks exist
  console.assert(agent.qNetwork !== null, 'Q-network should be initialized');
  console.assert(agent.targetNetwork !== null, 'Target network should be initialized');
  console.assert(agent.optimizer !== null, 'Optimizer should be initialized');
  
  // Test network shapes
  const qNetworkOutputShape = agent.qNetwork.outputShape;
  console.assert(qNetworkOutputShape[1] === TEST_ACTION_SIZE, 'Q-network output shape should match action size');
  
  // Test that networks can make predictions
  const testState = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  const qValues = agent.getQValues(testState);
  console.assert(qValues.length === TEST_ACTION_SIZE, 'Q-network should output correct number of Q-values');
  
  agent.dispose();
  console.log('✓ DQN Agent initialization test passed');
}

/**
 * Test action selection with exploration (epsilon = 1.0)
 */
function testActionSelectionExploration() {
  console.log('Testing action selection with exploration...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, { epsilon: 1.0 });
  const testState = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  
  // With epsilon = 1.0, should always explore (random actions)
  const actions = [];
  for (let i = 0; i < 100; i++) {
    const action = agent.selectAction(testState, 1.0);
    actions.push(action);
    
    // Action should be valid integer in range [0, 5]
    console.assert(Number.isInteger(action), 'Action should be integer');
    console.assert(action >= 0 && action < TEST_ACTION_SIZE, 'Action should be in valid range');
  }
  
  // With random exploration, we should see variety in actions
  const uniqueActions = new Set(actions);
  console.assert(uniqueActions.size > 1, 'Should have variety in random actions');
  
  agent.dispose();
  console.log('✓ Action selection exploration test passed');
}

/**
 * Test action selection with exploitation (epsilon = 0.0)
 */
function testActionSelectionExploitation() {
  console.log('Testing action selection with exploitation...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, { epsilon: 0.0 });
  const testState = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  
  // With epsilon = 0.0, should always exploit (same action for same state)
  const firstAction = agent.selectAction(testState, 0.0);
  
  // Action should be valid
  console.assert(Number.isInteger(firstAction), 'Action should be integer');
  console.assert(firstAction >= 0 && firstAction < TEST_ACTION_SIZE, 'Action should be in valid range');
  
  // Same state should produce same action when exploiting
  for (let i = 0; i < 10; i++) {
    const action = agent.selectAction(testState, 0.0);
    console.assert(action === firstAction, 'Same state should produce same action when exploiting');
  }
  
  agent.dispose();
  console.log('✓ Action selection exploitation test passed');
}

/**
 * Test Q-values computation
 */
function testQValuesComputation() {
  console.log('Testing Q-values computation...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE);
  const testState = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  
  const qValues = agent.getQValues(testState);
  
  // Should return array of Q-values
  console.assert(Array.isArray(qValues), 'Q-values should be array');
  console.assert(qValues.length === TEST_ACTION_SIZE, 'Should have Q-value for each action');
  
  // All Q-values should be numbers
  qValues.forEach((qValue, index) => {
    console.assert(typeof qValue === 'number', `Q-value ${index} should be number`);
    console.assert(isFinite(qValue), `Q-value ${index} should be finite`);
  });
  
  agent.dispose();
  console.log('✓ Q-values computation test passed');
}

/**
 * Test invalid state handling
 */
function testInvalidStateHandling() {
  console.log('Testing invalid state handling...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE);
  
  // Test null state
  try {
    agent.selectAction(null);
    console.assert(false, 'Should throw error for null state');
  } catch (error) {
    console.assert(error.message.includes('Invalid state'), 'Should throw invalid state error');
  }
  
  // Test wrong size state
  try {
    agent.selectAction(new Float32Array([1, 2, 3])); // Wrong size
    console.assert(false, 'Should throw error for wrong size state');
  } catch (error) {
    console.assert(error.message.includes('Invalid state'), 'Should throw invalid state error');
  }
  
  agent.dispose();
  console.log('✓ Invalid state handling test passed');
}

/**
 * Test epsilon decay
 */
function testEpsilonDecay() {
  console.log('Testing epsilon decay...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, {
    epsilon: 1.0,
    epsilonMin: 0.01,
    epsilonDecay: 0.9
  });
  
  const initialEpsilon = agent.epsilon;
  agent.decayEpsilon();
  const decayedEpsilon = agent.epsilon;
  
  console.assert(decayedEpsilon < initialEpsilon, 'Epsilon should decrease after decay');
  console.assert(decayedEpsilon === initialEpsilon * 0.9, 'Epsilon should decay by decay factor');
  
  // Test minimum epsilon
  agent.epsilon = 0.005; // Below minimum
  agent.decayEpsilon();
  console.assert(agent.epsilon === 0.01, 'Epsilon should not go below minimum');
  
  agent.dispose();
  console.log('✓ Epsilon decay test passed');
}

/**
 * Test experience replay buffer
 */
function testExperienceReplayBuffer() {
  console.log('Testing experience replay buffer...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, { bufferSize: 5 });
  
  // Test initial state
  console.assert(agent.getMemorySize() === 0, 'Buffer should start empty');
  console.assert(!agent.canTrain(1), 'Should not be able to train with empty buffer');
  
  // Create test experiences
  const state1 = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  const state2 = new Float32Array([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);
  const state3 = new Float32Array([0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1]);
  
  // Add experiences
  agent.remember(state1, 0, 1.0, state2, false);
  console.assert(agent.getMemorySize() === 1, 'Buffer size should increase');
  
  agent.remember(state2, 1, 2.0, state3, false);
  console.assert(agent.getMemorySize() === 2, 'Buffer size should increase');
  
  agent.remember(state3, 2, 3.0, state1, true);
  console.assert(agent.getMemorySize() === 3, 'Buffer size should increase');
  
  // Test can train
  console.assert(agent.canTrain(2), 'Should be able to train with enough experiences');
  
  // Test circular buffer (add more than buffer size)
  for (let i = 0; i < 5; i++) {
    agent.remember(state1, i % 6, i, state2, i === 4);
  }
  console.assert(agent.getMemorySize() === 5, 'Buffer should be at max capacity');
  
  // Add one more to test overwriting
  agent.remember(state2, 3, 10.0, state3, false);
  console.assert(agent.getMemorySize() === 5, 'Buffer should stay at max capacity');
  
  agent.dispose();
  console.log('✓ Experience replay buffer test passed');
}

/**
 * Test replay batch sampling
 */
function testReplayBatchSampling() {
  console.log('Testing replay batch sampling...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, { bufferSize: 100, batchSize: 4 });
  
  // Add enough experiences
  const state = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  const nextState = new Float32Array([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);
  
  for (let i = 0; i < 10; i++) {
    agent.remember(state, i % 6, i * 0.1, nextState, i === 9);
  }
  
  // Test batch sampling
  const batch = agent.replay(4);
  
  console.assert(batch.states.length === 4, 'Batch should have correct number of states');
  console.assert(batch.actions.length === 4, 'Batch should have correct number of actions');
  console.assert(batch.rewards.length === 4, 'Batch should have correct number of rewards');
  console.assert(batch.nextStates.length === 4, 'Batch should have correct number of next states');
  console.assert(batch.dones.length === 4, 'Batch should have correct number of done flags');
  
  // Test batch content
  batch.states.forEach((state, index) => {
    console.assert(Array.isArray(state), `State ${index} should be array`);
    console.assert(state.length === TEST_STATE_SIZE, `State ${index} should have correct length`);
  });
  
  batch.actions.forEach((action, index) => {
    console.assert(Number.isInteger(action), `Action ${index} should be integer`);
    console.assert(action >= 0 && action < TEST_ACTION_SIZE, `Action ${index} should be in valid range`);
  });
  
  batch.rewards.forEach((reward, index) => {
    console.assert(typeof reward === 'number', `Reward ${index} should be number`);
  });
  
  batch.dones.forEach((done, index) => {
    console.assert(typeof done === 'boolean', `Done ${index} should be boolean`);
  });
  
  agent.dispose();
  console.log('✓ Replay batch sampling test passed');
}

/**
 * Test invalid experience handling
 */
function testInvalidExperienceHandling() {
  console.log('Testing invalid experience handling...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE);
  const validState = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  
  // Test invalid state
  try {
    agent.remember(null, 0, 1.0, validState, false);
    console.assert(false, 'Should throw error for null state');
  } catch (error) {
    console.assert(error.message.includes('Invalid state'), 'Should throw invalid state error');
  }
  
  // Test invalid action
  try {
    agent.remember(validState, -1, 1.0, validState, false);
    console.assert(false, 'Should throw error for invalid action');
  } catch (error) {
    console.assert(error.message.includes('Invalid action'), 'Should throw invalid action error');
  }
  
  // Test invalid reward
  try {
    agent.remember(validState, 0, NaN, validState, false);
    console.assert(false, 'Should throw error for NaN reward');
  } catch (error) {
    console.assert(error.message.includes('Invalid reward'), 'Should throw invalid reward error');
  }
  
  // Test replay with insufficient experiences
  try {
    agent.replay(5);
    console.assert(false, 'Should throw error for insufficient experiences');
  } catch (error) {
    console.assert(error.message.includes('Not enough experiences'), 'Should throw insufficient experiences error');
  }
  
  agent.dispose();
  console.log('✓ Invalid experience handling test passed');
}

/**
 * Test DQN training logic
 */
function testDQNTrainingLogic() {
  console.log('Testing DQN training logic...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, { 
    batchSize: 4,
    learningRate: 0.01 // Higher learning rate for visible changes
  });
  
  // Add training experiences
  const state1 = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  const state2 = new Float32Array([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);
  const state3 = new Float32Array([0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1]);
  
  // Add enough experiences for training
  for (let i = 0; i < 10; i++) {
    const state = i % 2 === 0 ? state1 : state2;
    const nextState = i % 2 === 0 ? state2 : state3;
    agent.remember(state, i % 6, Math.random() * 2 - 1, nextState, i === 9);
  }
  
  console.assert(agent.canTrain(), 'Should be able to train with enough experiences');
  
  // Test training
  const trainingResult = agent.train(4);
  
  console.assert(typeof trainingResult.loss === 'number', 'Training should return loss value');
  console.assert(isFinite(trainingResult.loss), 'Loss should be finite');
  console.assert(trainingResult.loss >= 0, 'Loss should be non-negative');
  console.assert(trainingResult.batchSize === 4, 'Should return correct batch size');
  console.assert(typeof trainingResult.epsilon === 'number', 'Should return epsilon value');
  
  // Test training with insufficient experiences
  agent.clearMemory();
  try {
    agent.train();
    console.assert(false, 'Should throw error when training with insufficient experiences');
  } catch (error) {
    console.assert(error.message.includes('Not enough experiences'), 'Should throw insufficient experiences error');
  }
  
  agent.dispose();
  console.log('✓ DQN training logic test passed');
}

/**
 * Test batch training
 */
function testBatchTraining() {
  console.log('Testing batch training...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, { learningRate: 0.01 });
  
  // Create test batch
  const batch = {
    states: [
      [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
      [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1]
    ],
    actions: [0, 1, 2],
    rewards: [1.0, -0.5, 0.5],
    nextStates: [
      [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1],
      [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2]
    ],
    dones: [false, false, true]
  };
  
  // Test batch training
  const result = agent.trainBatch(batch);
  
  console.assert(typeof result.loss === 'number', 'Should return loss value');
  console.assert(isFinite(result.loss), 'Loss should be finite');
  console.assert(result.loss >= 0, 'Loss should be non-negative');
  console.assert(result.batchSize === 3, 'Should return correct batch size');
  
  // Test invalid batch
  try {
    agent.trainBatch({ states: [] });
    console.assert(false, 'Should throw error for empty batch');
  } catch (error) {
    console.assert(error.message.includes('Empty batch'), 'Should throw empty batch error');
  }
  
  try {
    agent.trainBatch(null);
    console.assert(false, 'Should throw error for null batch');
  } catch (error) {
    console.assert(error.message.includes('Invalid batch'), 'Should throw invalid batch error');
  }
  
  agent.dispose();
  console.log('✓ Batch training test passed');
}

/**
 * Test target network update
 */
function testTargetNetworkUpdate() {
  console.log('Testing target network update...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, { 
    targetUpdateFreq: 3,
    learningRate: 0.01
  });
  
  const testState = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  
  // Get initial Q-values from both networks
  const initialQValues = agent.getQValues(testState);
  const initialTargetQValues = tf.tidy(() => {
    const stateTensor = tf.tensor2d([Array.from(testState)], [1, TEST_STATE_SIZE]);
    const qValues = agent.targetNetwork.predict(stateTensor);
    return Array.from(qValues.dataSync());
  });
  
  // Initially, both networks should have the same weights (copied during initialization)
  for (let i = 0; i < initialQValues.length; i++) {
    console.assert(Math.abs(initialQValues[i] - initialTargetQValues[i]) < 1e-6, 
      'Initial Q-values should match target Q-values');
  }
  
  // Train the main network to change its weights
  const state1 = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  const state2 = new Float32Array([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);
  
  // Add experiences and train
  for (let i = 0; i < 10; i++) {
    agent.remember(state1, 0, 1.0, state2, false);
  }
  
  // Train multiple times to change weights
  for (let i = 0; i < 5; i++) {
    agent.train(4);
  }
  
  // Get Q-values after training
  const trainedQValues = agent.getQValues(testState);
  const targetQValuesAfterTraining = tf.tidy(() => {
    const stateTensor = tf.tensor2d([Array.from(testState)], [1, TEST_STATE_SIZE]);
    const qValues = agent.targetNetwork.predict(stateTensor);
    return Array.from(qValues.dataSync());
  });
  
  // Main network should have changed, target network should be the same
  let mainNetworkChanged = false;
  for (let i = 0; i < trainedQValues.length; i++) {
    if (Math.abs(trainedQValues[i] - initialQValues[i]) > 1e-6) {
      mainNetworkChanged = true;
      break;
    }
  }
  console.assert(mainNetworkChanged, 'Main network should have changed after training');
  
  // Target network should still be the same
  for (let i = 0; i < targetQValuesAfterTraining.length; i++) {
    console.assert(Math.abs(targetQValuesAfterTraining[i] - initialTargetQValues[i]) < 1e-6, 
      'Target network should not have changed');
  }
  
  // Manually update target network
  agent.updateTargetNetwork();
  
  const targetQValuesAfterUpdate = tf.tidy(() => {
    const stateTensor = tf.tensor2d([Array.from(testState)], [1, TEST_STATE_SIZE]);
    const qValues = agent.targetNetwork.predict(stateTensor);
    return Array.from(qValues.dataSync());
  });
  
  // After update, target network should match main network
  for (let i = 0; i < trainedQValues.length; i++) {
    console.assert(Math.abs(trainedQValues[i] - targetQValuesAfterUpdate[i]) < 1e-6, 
      'Target network should match main network after update');
  }
  
  agent.dispose();
  console.log('✓ Target network update test passed');
}

/**
 * Test automatic target network update
 */
function testAutomaticTargetNetworkUpdate() {
  console.log('Testing automatic target network update...');
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, { 
    targetUpdateFreq: 2 // Update every 2 episodes
  });
  
  // Test episode counting
  console.assert(agent.getEpisodeCount() === 0, 'Should start with 0 episodes');
  
  agent.incrementEpisodeCount();
  console.assert(agent.getEpisodeCount() === 1, 'Should increment episode count');
  
  agent.incrementEpisodeCount();
  console.assert(agent.getEpisodeCount() === 2, 'Should increment episode count');
  
  // Reset episode count
  agent.resetEpisodeCount();
  console.assert(agent.getEpisodeCount() === 0, 'Should reset episode count');
  
  agent.dispose();
  console.log('✓ Automatic target network update test passed');
}

/**
 * Test model save and load functionality
 */
async function testModelSaveAndLoad() {
  console.log('Testing model save and load...');
  
  // Skip this test in Node.js environment since localStorage is not available
  if (typeof window === 'undefined') {
    console.log('⚠️ Skipping model save/load test in Node.js environment (localStorage not available)');
    return;
  }
  
  const agent1 = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE, { 
    epsilon: 0.5,
    learningRate: 0.01
  });
  
  const testState = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  
  // Train the agent a bit to change its weights
  const state1 = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
  const state2 = new Float32Array([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]);
  
  for (let i = 0; i < 10; i++) {
    agent1.remember(state1, 0, 1.0, state2, false);
  }
  
  for (let i = 0; i < 3; i++) {
    agent1.train(4);
  }
  
  // Get Q-values before saving
  const originalQValues = agent1.getQValues(testState);
  const originalEpsilon = agent1.epsilon;
  
  // Increment episode count
  agent1.incrementEpisodeCount();
  agent1.incrementEpisodeCount();
  const originalEpisodeCount = agent1.getEpisodeCount();
  
  // Save the model
  const testModelPath = 'localstorage://test-dqn-model';
  
  try {
    const metadata = await agent1.saveModel(testModelPath);
    console.assert(typeof metadata === 'object', 'Save should return metadata');
    console.assert(metadata.stateSize === TEST_STATE_SIZE, 'Metadata should contain correct state size');
    console.assert(metadata.actionSize === TEST_ACTION_SIZE, 'Metadata should contain correct action size');
    
    // Check if model exists
    const exists = await agent1.modelExists(testModelPath);
    console.assert(exists, 'Model should exist after saving');
    
    // Create a new agent and load the model
    const agent2 = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE);
    
    const loadedMetadata = await agent2.loadModel(testModelPath);
    console.assert(typeof loadedMetadata === 'object', 'Load should return metadata');
    
    // Check that Q-values match
    const loadedQValues = agent2.getQValues(testState);
    
    for (let i = 0; i < originalQValues.length; i++) {
      console.assert(Math.abs(originalQValues[i] - loadedQValues[i]) < 1e-6, 
        `Q-value ${i} should match after loading`);
    }
    
    // Check that hyperparameters were restored
    console.assert(Math.abs(agent2.epsilon - originalEpsilon) < 1e-6, 'Epsilon should be restored');
    console.assert(agent2.getEpisodeCount() === originalEpisodeCount, 'Episode count should be restored');
    
    // Clean up
    await agent1.deleteModel(testModelPath);
    
    // Check that model no longer exists
    const existsAfterDelete = await agent1.modelExists(testModelPath);
    console.assert(!existsAfterDelete, 'Model should not exist after deletion');
    
    agent1.dispose();
    agent2.dispose();
    
    console.log('✓ Model save and load test passed');
  } catch (error) {
    agent1.dispose();
    console.error('Model save/load test failed:', error);
    throw error;
  }
}

/**
 * Test model save/load error handling
 */
async function testModelSaveLoadErrorHandling() {
  console.log('Testing model save/load error handling...');
  
  // Skip this test in Node.js environment since localStorage is not available
  if (typeof window === 'undefined') {
    console.log('⚠️ Skipping model save/load error handling test in Node.js environment');
    return;
  }
  
  const agent = new DQNAgent(TEST_STATE_SIZE, TEST_ACTION_SIZE);
  
  // Test loading non-existent model
  try {
    await agent.loadModel('localstorage://non-existent-model');
    console.assert(false, 'Should throw error for non-existent model');
  } catch (error) {
    console.assert(error.message.includes('Failed to load model'), 'Should throw load error');
  }
  
  // Test model exists for non-existent model
  const exists = await agent.modelExists('localstorage://non-existent-model');
  console.assert(!exists, 'Non-existent model should return false');
  
  agent.dispose();
  console.log('✓ Model save/load error handling test passed');
}

/**
 * Run all tests
 */
export async function runDQNAgentTests() {
  console.log('Running DQN Agent tests...\n');
  
  try {
    testDQNAgentInitialization();
    testActionSelectionExploration();
    testActionSelectionExploitation();
    testQValuesComputation();
    testInvalidStateHandling();
    testEpsilonDecay();
    testExperienceReplayBuffer();
    testReplayBatchSampling();
    testInvalidExperienceHandling();
    testDQNTrainingLogic();
    testBatchTraining();
    testTargetNetworkUpdate();
    testAutomaticTargetNetworkUpdate();
    await testModelSaveAndLoad();
    await testModelSaveLoadErrorHandling();
    
    console.log('\n✅ All DQN Agent tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ DQN Agent test failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDQNAgentTests();
}