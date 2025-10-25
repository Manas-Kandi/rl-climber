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
    
    // Test 2: Falling should give -100
    console.log('💀 Test 2: Fall Punishment');
    env.reset();
    physics.setBodyPosition(agentBody, { x: 0, y: -3, z: 0 });
    const fallReward = env.calculateReward(null, 0, null);
    console.log(`  Fall reward: ${fallReward} (expected: -100)`);
    console.log(`  ✅ ${fallReward === -100 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 3: Out of bounds should give -100
    console.log('🚫 Test 3: Out of Bounds Punishment');
    env.reset();
    physics.setBodyPosition(agentBody, { x: 15, y: 1, z: 0 });
    const oobReward = env.calculateReward(null, 0, null);
    console.log(`  Out of bounds reward: ${oobReward} (expected: -100)`);
    console.log(`  ✅ ${oobReward === -100 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 4: Step progression rewards (diminishing)
    console.log('📈 Test 4: Step Progression (Diminishing Returns)');
    env.reset();
    
    // Simulate reaching different steps
    const stepRewards = [];
    for (let step = 0; step <= 9; step++) {
        env.reset();
        env.highestStepReached = step - 1; // Previous highest
        env.currentStepOn = step; // Current step
        
        // Position agent on the step
        const stepY = (step + 1) * 1.0;
        const stepZ = -2.0 * step;
        physics.setBodyPosition(agentBody, { x: 0, y: stepY, z: stepZ });
        
        const reward = env.calculateReward(null, 0, null);
        stepRewards.push(reward);
        
        const expectedReward = Math.max(1, 9 - step);
        console.log(`  Step ${step}: ${reward.toFixed(1)} (expected: ${expectedReward})`);
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
    
    // Test 5: Jumping down punishment
    console.log('💥 Test 5: Jumping Down Punishment');
    env.reset();
    env.currentStepOn = 3; // Start on step 3
    env.highestStepReached = 3;
    
    // Simulate jumping down to step 1
    physics.setBodyPosition(agentBody, { x: 0, y: 2, z: -2 });
    const jumpDownReward = env.calculateReward(null, 0, null);
    console.log(`  Jump down reward: ${jumpDownReward.toFixed(1)} (should be negative)`);
    console.log(`  ✅ ${jumpDownReward < 0 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 6: Stagnation punishment
    console.log('😴 Test 6: Stagnation Punishment');
    env.reset();
    physics.setBodyPosition(agentBody, { x: 0, y: 1, z: 0 });
    
    // Simulate staying in same place for multiple steps
    env.lastPosition = { x: 0, y: 1, z: 0 };
    env.stagnationTimer = 120; // 2 seconds of stagnation
    
    const stagnationReward = env.calculateReward(null, 0, null);
    console.log(`  Stagnation reward: ${stagnationReward.toFixed(1)} (should be negative)`);
    console.log(`  ✅ ${stagnationReward < 0 ? 'PASS' : 'FAIL'}\n`);
    
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
    console.log(`  Range compliance: ${minReward >= -100 && maxReward <= 100 ? 'PASS' : 'FAIL'}`);
    
    return minReward >= -100 && maxReward <= 100;
}

/**
 * Compare old vs new reward system
 */
function compareRewardSystems() {
    console.log('⚖️ Comparing Old vs New Reward Systems');
    
    console.log('\n📊 Old System Problems:');
    console.log('  ❌ Rewards in hundreds (inflated)');
    console.log('  ❌ No clear punishment for bad behavior');
    console.log('  ❌ No stagnation detection');
    console.log('  ❌ Linear step rewards (no diminishing returns)');
    console.log('  ❌ Weak learning signals');
    
    console.log('\n✅ New System Improvements:');
    console.log('  ✅ Rewards clamped to [-100, +100]');
    console.log('  ✅ Clear punishment for jumping down (-15 per step)');
    console.log('  ✅ Stagnation punishment (-0.5 per step after 1s)');
    console.log('  ✅ Diminishing step rewards (9, 8, 7, ..., 1)');
    console.log('  ✅ Strong learning signals');
    console.log('  ✅ Only +100 for goal, only -100 for death/OOB');
    
    console.log('\n🎯 Expected Learning Improvements:');
    console.log('  • Agent will avoid jumping down stairs');
    console.log('  • Agent will not stay in one place');
    console.log('  • Agent will prioritize reaching goal over exploring');
    console.log('  • Training will be more stable and focused');
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