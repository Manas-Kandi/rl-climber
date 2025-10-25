/**
 * Diagnostic script to understand why the agent isn't learning
 */
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { ClimbingEnvironment } from './rl/ClimbingEnvironment.js';
import { PPOAgent } from './rl/PPOAgent.js';

console.log('🔍 LEARNING DIAGNOSIS STARTING...\n');

// Create minimal environment
const physicsEngine = new PhysicsEngine();
const environment = new ClimbingEnvironment(physicsEngine, null, {
    maxSteps: 500
});

// Create agent
const agent = new PPOAgent(9, 6, {
    learningRate: 0.0003,
    gamma: 0.99,
    lambda: 0.95,
    clipEpsilon: 0.2,
    entropyCoef: 0.01
});

console.log('📊 TESTING REWARD SYSTEM:\n');

// Test 1: What rewards does the agent get for doing nothing?
let state = environment.reset();
let totalReward = 0;
let stepCount = 0;

console.log('Test 1: Standing still on ground');
for (let i = 0; i < 10; i++) {
    const result = environment.step(4); // Jump action (but won't work if not grounded properly)
    totalReward += result.reward;
    stepCount++;
    if (i === 0) {
        console.log(`  Step ${i}: Reward = ${result.reward.toFixed(2)}, Position = (${result.info.agentPosition.x.toFixed(2)}, ${result.info.agentPosition.y.toFixed(2)}, ${result.info.agentPosition.z.toFixed(2)})`);
    }
}
console.log(`  Total reward after 10 steps: ${totalReward.toFixed(2)}`);
console.log(`  Average per step: ${(totalReward / stepCount).toFixed(2)}\n`);

// Test 2: What's the action distribution?
console.log('Test 2: Action selection distribution');
state = environment.reset();
const actionCounts = [0, 0, 0, 0, 0, 0];
for (let i = 0; i < 100; i++) {
    const { action } = agent.selectAction(state, true);
    actionCounts[action]++;
}
console.log('  Action distribution (100 samples):');
console.log(`    FORWARD (0):  ${actionCounts[0]}%`);
console.log(`    BACKWARD (1): ${actionCounts[1]}%`);
console.log(`    LEFT (2):     ${actionCounts[2]}%`);
console.log(`    RIGHT (3):    ${actionCounts[3]}%`);
console.log(`    JUMP (4):     ${actionCounts[4]}%`);
console.log(`    GRAB (5):     ${actionCounts[5]}%\n`);

// Test 3: What happens in a typical episode?
console.log('Test 3: Simulating one episode');
state = environment.reset();
totalReward = 0;
let done = false;
stepCount = 0;
let highestY = 0;
let lowestY = 100;

while (!done && stepCount < 50) {
    const { action } = agent.selectAction(state, true);
    const result = environment.step(action);
    
    state = result.state;
    totalReward += result.reward;
    done = result.done;
    stepCount++;
    
    const y = result.info.agentPosition.y;
    highestY = Math.max(highestY, y);
    lowestY = Math.min(lowestY, y);
    
    if (stepCount <= 5 || stepCount % 10 === 0) {
        console.log(`  Step ${stepCount}: Action=${result.info.actionName}, Reward=${result.reward.toFixed(2)}, Y=${y.toFixed(2)}, Total=${totalReward.toFixed(2)}`);
    }
}

console.log(`\n  Episode Summary:`);
console.log(`    Total steps: ${stepCount}`);
console.log(`    Total reward: ${totalReward.toFixed(2)}`);
console.log(`    Avg reward/step: ${(totalReward / stepCount).toFixed(2)}`);
console.log(`    Highest Y: ${highestY.toFixed(2)}`);
console.log(`    Lowest Y: ${lowestY.toFixed(2)}`);
console.log(`    Done: ${done}`);
console.log(`    Highest step reached: ${environment.highestStepReached}\n`);

// Test 4: Check if the baseline penalty is too harsh
console.log('Test 4: Reward breakdown analysis');
console.log('  Expected rewards:');
console.log('    Baseline penalty: -0.5 per step');
console.log('    On ground penalty: -1.0 per step');
console.log('    Total per step on ground: -1.5');
console.log('    After 500 steps on ground: -750');
console.log('    After 1000 steps: -1500');
console.log('    After 2000 steps: -3000 ⚠️\n');

console.log('💡 DIAGNOSIS:');
console.log('  If avg reward is around -2824 after 27k steps:');
console.log('    -2824 / 27060 = -0.104 per step');
console.log('    This is MUCH BETTER than expected -1.5!');
console.log('    Agent is getting POSITIVE rewards somewhere!\n');

console.log('🤔 HYPOTHESIS:');
console.log('  The agent IS exploring and getting rewards,');
console.log('  but the LEARNING RATE or NETWORK might be the issue.\n');

// Test 5: Check network outputs
console.log('Test 5: Network output analysis');
state = environment.reset();
const { action, logProb, value } = agent.selectAction(state, true);
console.log(`  State value estimate: ${value.toFixed(4)}`);
console.log(`  Selected action: ${action}`);
console.log(`  Log probability: ${logProb.toFixed(4)}\n`);

console.log('🔍 DIAGNOSIS COMPLETE!\n');
console.log('📋 RECOMMENDATIONS:');
console.log('  1. Check if learning rate is too low (0.0003 might be too small)');
console.log('  2. Check if entropy coefficient is too low (0.01 might not encourage exploration)');
console.log('  3. Check if the agent is stuck in a local minimum');
console.log('  4. Consider curriculum learning (start with easier task)');
console.log('  5. Check if the network is actually updating (gradient flow)');
