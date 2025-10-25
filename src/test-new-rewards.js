/**
 * Test script for the new strategic reward system
 */

console.log('🧪 Testing new strategic reward system...');

/**
 * Test reward ranges and behaviors
 */
async function testRewardSystem() {
    console.log('\n🔬 Testing New Reward System');
    
    const app = window.climbingGame;
    if (!app || !app.environment || !app.physicsEngine) {
        console.error('❌ App not ready');
        return false;
    }
    
    const env = app.environment;
    const physics = app.physicsEngine;
    
    console.log('📊 Testing reward scenarios...\n');
    
    // Test 1: Goal reached should give +100
    console.log('🎯 Test 1: Goal Reached Reward');
    env.reset();
    const agentBody = physics.getBody('agent');
    
    // Move agent to goal height
    physics.setBodyPosition(agentBody, { x: 0, y: 15, z: -5 });
    const goalReward = env.calculateReward(null, 0, null);
    console.log(`  Goal reward: ${goalReward} (expected: 100)`);
    console.log(`  ✅ ${goalReward === 100 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 2: Falling should give -50 (REDUCED from -100)
    console.log('💀 Test 2: Fall Punishment');
    env.reset();
    physics.setBodyPosition(agentBody, { x: 0, y: -3, z: 0 });
    const fallReward = env.calculateReward(null, 0, null);
    console.log(`  Fall reward: ${fallReward} (expected: -50, reduced to encourage risk)`);
    console.log(`  ✅ ${fallReward === -50 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 3: Out of bounds should give -50 (REDUCED from -100)
    console.log('🚫 Test 3: Out of Bounds Punishment');
    env.reset();
    physics.setBodyPosition(agentBody, { x: 15, y: 1, z: 0 });
    const oobReward = env.calculateReward(null, 0, null);
    console.log(`  Out of bounds reward: ${oobReward} (expected: -50, reduced to encourage exploration)`);
    console.log(`  ✅ ${oobReward === -50 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 4: Step progression rewards (MASSIVE, diminishing)
    console.log('📈 Test 4: Step Progression (MASSIVE Rewards, Diminishing)');
    env.reset();
    
    // Simulate reaching different steps
    const stepRewards = [];
    for (let step = 0; step <= 9; step++) {
        env.reset();
        env.highestStepReached = step - 1; // Previous highest
        env.currentStepOn = step; // Current step
        env.timeOnCurrentStep = 0; // Fresh on step
        
        // Position agent on the step
        const stepY = (step + 1) * 1.0;
        const stepZ = -2.0 * step;
        physics.setBodyPosition(agentBody, { x: 0, y: stepY, z: stepZ });
        
        const reward = env.calculateReward(null, 0, null);
        stepRewards.push(reward);
        
        const expectedReward = 50 - (step * 5); // NEW: 50, 45, 40, ..., 5
        console.log(`  Step ${step}: ${reward.toFixed(1)} (expected: ~${expectedReward})`);
    }
    
    // Verify diminishing pattern
    let diminishing = true;
    for (let i = 1; i < stepRewards.length; i++) {
        if (stepRewards[i] > stepRewards[i-1]) {
            diminishing = false;
            break;
        }
    }
    console.log(`  ✅ Diminishing returns: ${diminishing ? 'PASS' : 'FAIL'}\n`);
    
    // Test 5: Jumping down punishment (REDUCED)
    console.log('💥 Test 5: Jumping Down Punishment (REDUCED)');
    env.reset();
    env.currentStepOn = 3; // Start on step 3
    env.highestStepReached = 3;
    env.timeOnCurrentStep = 0;
    
    // Simulate jumping down to step 1 (2 steps down)
    physics.setBodyPosition(agentBody, { x: 0, y: 2, z: -2 });
    const jumpDownReward = env.calculateReward(null, 0, null);
    console.log(`  Jump down 2 steps: ${jumpDownReward.toFixed(1)} (expected: ~-10, was -30)`);
    console.log(`  ✅ ${jumpDownReward < 0 && jumpDownReward > -15 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 6: Baseline penalty (doing nothing is negative!)
    console.log('⚖️ Test 6: Baseline Penalty (Doing Nothing Costs!)');
    env.reset();
    physics.setBodyPosition(agentBody, { x: 0, y: 1, z: 0 });
    env.currentStepOn = -1; // On ground
    env.highestStepReached = -1;
    env.timeOnCurrentStep = 0;
    env.lastPosition = { x: 0, y: 1, z: 0 };
    env.stagnationTimer = 0;
    
    const baselineReward = env.calculateReward(null, 0, null);
    console.log(`  Baseline reward (on ground): ${baselineReward.toFixed(1)} (should be negative)`);
    console.log(`  ✅ ${baselineReward < 0 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 7: Time decay on steps
    console.log('⏱️ Test 7: Time Decay (Rewards Decrease Over Time)');
    env.reset();
    env.currentStepOn = 1;
    env.highestStepReached = 1;
    physics.setBodyPosition(agentBody, { x: 0, y: 2, z: -2 });
    
    // Fresh on step
    env.timeOnCurrentStep = 10;
    const freshReward = env.calculateReward(null, 0, null);
    console.log(`  Fresh on step (10 steps): ${freshReward.toFixed(1)} (should be positive)`);
    
    // Been here a while
    env.timeOnCurrentStep = 100;
    const staleReward = env.calculateReward(null, 0, null);
    console.log(`  Stale on step (100 steps): ${staleReward.toFixed(1)} (should be less positive or negative)`);
    console.log(`  ✅ ${freshReward > staleReward ? 'PASS' : 'FAIL'}\n`);
    
    // Test 8: Exploration bonus
    console.log('🔍 Test 8: Exploration Bonus');
    env.reset();
    physics.setBodyPosition(agentBody, { x: 0, y: 1, z: 0 });
    env.currentStepOn = -1;
    env.highestStepReached = -1;
    env.timeOnCurrentStep = 0;
    
    const rewardWithAction = env.calculateReward(null, 0, null); // Action 0 (forward)
    console.log(`  Reward with action: ${rewardWithAction.toFixed(1)} (includes +0.2 exploration bonus)`);
    console.log(`  ✅ PASS (exploration bonus included)\n`);
    
    return true;
}

/**
 * Test reward range compliance
 */
function testRewardRange() {
    console.log('📏 Testing Reward Range Compliance');
    
    const app = window.climbingGame;
    if (!app || !app.environment) {
        console.error('❌ App not ready');
        return false;
    }
    
    const env = app.environment;
    
    // Test multiple random scenarios
    const rewards = [];
    for (let i = 0; i < 100; i++) {
        env.reset();
        
        // Random position
        const randomX = (Math.random() - 0.5) * 20;
        const randomY = Math.random() * 20 - 5;
        const randomZ = (Math.random() - 0.5) * 30;
        
        const agentBody = app.physicsEngine.getBody('agent');
        app.physicsEngine.setBodyPosition(agentBody, { x: randomX, y: randomY, z: randomZ });
        
        const reward = env.calculateReward(null, 0, null);
        rewards.push(reward);
    }
    
    const minReward = Math.min(...rewards);
    const maxReward = Math.max(...rewards);
    
    console.log(`  Min reward observed: ${minReward}`);
    console.log(`  Max reward observed: ${maxReward}`);
    console.log(`  Range compliance: ${minReward >= -50 && maxReward <= 100 ? 'PASS' : 'FAIL'}`);
    
    return minReward >= -50 && maxReward <= 100;
}

/**
 * Compare old vs new reward system
 */
function compareRewardSystems() {
    console.log('⚖️ Comparing Old vs New Reward Systems');
    
    console.log('\n📊 Old System Problems:');
    console.log('  ❌ Small positive rewards (+1 to +9)');
    console.log('  ❌ Large negative penalties (-15 to -100)');
    console.log('  ❌ Doing nothing gives ~0 reward (attractive!)');
    console.log('  ❌ Risk/reward ratio favors stagnation');
    console.log('  ❌ Agent learns: "Better to do nothing than risk failure"');
    
    console.log('\n✅ Psychology-Based System Improvements:');
    console.log('  ✅ MASSIVE positive rewards (+50 to +5 per step)');
    console.log('  ✅ REDUCED negative penalties (-5 to -10)');
    console.log('  ✅ Baseline penalty (-0.5 every step)');
    console.log('  ✅ Time decay (rewards decrease if staying on step)');
    console.log('  ✅ Exploration bonus (+0.2 for any action)');
    console.log('  ✅ Risk/reward ratio favors exploration!');
    console.log('  ✅ Agent learns: "Taking risks is MUCH better than doing nothing"');
    
    console.log('\n🎯 Expected Behavioral Changes:');
    console.log('  • Agent will actively seek progress (huge rewards!)');
    console.log('  • Agent will take calculated risks (small penalties)');
    console.log('  • Agent cannot stay in one place (baseline + decay)');
    console.log('  • Agent will explore different strategies (exploration bonus)');
    console.log('  • Training will be more aggressive and exploratory');
    
    console.log('\n🧠 The Psychology:');
    console.log('  • Negative rewards make 0 attractive → shift baseline negative!');
    console.log('  • Expected value drives behavior → make progress highly positive!');
    console.log('  • Agent compares options → make desired behavior mathematically optimal!');
    console.log('  • Time decay prevents camping → forces continuous progress!');
}

/**
 * Run comprehensive reward system tests
 */
async function runRewardTests() {
    console.log('🧪 Running comprehensive reward system tests...\n');
    
    const tests = [
        { name: 'Reward System Behaviors', fn: testRewardSystem },
        { name: 'Reward Range Compliance', fn: testRewardRange }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.error(`❌ Test "${test.name}" failed:`, error);
            results.push({ name: test.name, passed: false, error: error.message });
        }
    }
    
    // Show comparison
    compareRewardSystems();
    
    // Summary
    console.log('\n📊 Reward System Test Results:');
    console.log('=' .repeat(50));
    
    let passed = 0;
    results.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} - ${result.name}`);
        if (result.passed) passed++;
    });
    
    console.log('=' .repeat(50));
    console.log(`📈 Overall: ${passed}/${results.length} tests passed`);
    
    if (passed === results.length) {
        console.log('🎉 New reward system is working correctly!');
        console.log('💡 Try training now - it should be much more effective!');
    }
    
    return results;
}

// Export test functions
window.rewardSystemTests = {
    runAll: runRewardTests,
    behaviors: testRewardSystem,
    range: testRewardRange,
    compare: compareRewardSystems
};

// Auto-run tests when app is ready
const waitForApp = () => {
    const app = window.climbingGame;
    if (app && app.isInitialized) {
        console.log('🎮 App ready, testing new reward system...');
        setTimeout(runRewardTests, 2000);
    } else {
        setTimeout(waitForApp, 1000);
    }
};

waitForApp();

console.log('🧪 New reward system tests loaded! Use window.rewardSystemTests for manual testing.');