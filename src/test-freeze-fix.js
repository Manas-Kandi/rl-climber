/**
 * Test script to verify freeze fixes are working correctly
 */

console.log('🧪 Testing freeze fixes...');

/**
 * Test physics sleep settings
 */
function testPhysicsSleep() {
    console.log('\n🔬 Test 1: Physics Sleep Settings');
    
    const app = window.climbingGame;
    if (!app || !app.physicsEngine) {
        console.error('❌ App not ready');
        return false;
    }
    
    const world = app.physicsEngine.getWorld();
    console.log('  allowSleep:', world.allowSleep);
    
    if (world.allowSleep === false) {
        console.log('  ✅ Physics sleep disabled correctly');
        return true;
    } else {
        console.error('  ❌ Physics sleep still enabled!');
        return false;
    }
}

/**
 * Test agent damping settings
 */
function testAgentDamping() {
    console.log('\n🔬 Test 2: Agent Damping Settings');
    
    const app = window.climbingGame;
    if (!app || !app.physicsEngine) {
        console.error('❌ App not ready');
        return false;
    }
    
    const agentBody = app.physicsEngine.getBody('agent');
    if (!agentBody) {
        console.error('❌ Agent body not found');
        return false;
    }
    
    console.log('  Linear damping:', agentBody.linearDamping);
    console.log('  Angular damping:', agentBody.angularDamping);
    
    const linearOk = agentBody.linearDamping <= 0.15;
    const angularOk = agentBody.angularDamping <= 0.35;
    
    if (linearOk && angularOk) {
        console.log('  ✅ Damping values optimized');
        return true;
    } else {
        console.error('  ❌ Damping values still too high!');
        return false;
    }
}

/**
 * Test action forces
 */
function testActionForces() {
    console.log('\n🔬 Test 3: Action Forces');
    
    const app = window.climbingGame;
    if (!app || !app.environment) {
        console.error('❌ App not ready');
        return false;
    }
    
    const forces = app.environment.config.actionForces;
    console.log('  Move force:', forces.move);
    console.log('  Jump force:', forces.jump);
    console.log('  Grab force:', forces.grab);
    
    const moveOk = forces.move >= 17.0;  // Updated for 50% sensitivity increase
    const jumpOk = forces.jump >= 9.0;
    const grabOk = forces.grab >= 20.0;
    
    if (moveOk && jumpOk && grabOk) {
        console.log('  ✅ Action forces increased');
        return true;
    } else {
        console.error('  ❌ Action forces still too low!');
        return false;
    }
}

/**
 * Test jump cooldown
 */
function testJumpCooldown() {
    console.log('\n🔬 Test 4: Jump Cooldown');
    
    const app = window.climbingGame;
    if (!app || !app.environment) {
        console.error('❌ App not ready');
        return false;
    }
    
    const cooldownSteps = app.environment.jumpCooldownSteps;
    console.log('  Jump cooldown steps:', cooldownSteps);
    
    if (cooldownSteps <= 3) {
        console.log('  ✅ Jump cooldown reduced');
        return true;
    } else {
        console.error('  ❌ Jump cooldown still too long!');
        return false;
    }
}

/**
 * Test movement responsiveness
 */
async function testMovementResponsiveness() {
    console.log('\n🔬 Test 5: Movement Responsiveness');
    
    const app = window.climbingGame;
    if (!app || !app.environment || !app.physicsEngine) {
        console.error('❌ App not ready');
        return false;
    }
    
    // Reset environment
    app.environment.reset();
    
    const agentBody = app.physicsEngine.getBody('agent');
    const startPos = app.physicsEngine.getBodyPosition(agentBody);
    console.log('  Start position:', startPos);
    
    // Test forward movement
    console.log('  Testing forward movement...');
    const result = app.environment.step(0); // FORWARD action
    
    // Wait for physics to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endPos = app.physicsEngine.getBodyPosition(agentBody);
    const endVel = app.physicsEngine.getBodyVelocity(agentBody);
    
    console.log('  End position:', endPos);
    console.log('  End velocity:', endVel);
    
    // Check if agent moved
    const deltaZ = Math.abs(endPos.z - startPos.z);
    const velMagnitude = Math.sqrt(endVel.x * endVel.x + endVel.y * endVel.y + endVel.z * endVel.z);
    
    console.log('  Position change (Z):', deltaZ.toFixed(4));
    console.log('  Velocity magnitude:', velMagnitude.toFixed(4));
    
    if (deltaZ > 0.001 || velMagnitude > 0.1) {
        console.log('  ✅ Agent responds to movement commands');
        return true;
    } else {
        console.error('  ❌ Agent not responding to movement!');
        return false;
    }
}

/**
 * Test jump responsiveness
 */
async function testJumpResponsiveness() {
    console.log('\n🔬 Test 6: Jump Responsiveness');
    
    const app = window.climbingGame;
    if (!app || !app.environment || !app.physicsEngine) {
        console.error('❌ App not ready');
        return false;
    }
    
    // Reset environment
    app.environment.reset();
    
    const agentBody = app.physicsEngine.getBody('agent');
    const startPos = app.physicsEngine.getBodyPosition(agentBody);
    console.log('  Start position:', startPos);
    console.log('  Is grounded:', app.environment.isGrounded());
    
    // Test jump
    console.log('  Testing jump...');
    const result = app.environment.step(4); // JUMP action
    
    // Wait for physics to update
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const endPos = app.physicsEngine.getBodyPosition(agentBody);
    const endVel = app.physicsEngine.getBodyVelocity(agentBody);
    
    console.log('  End position:', endPos);
    console.log('  End velocity:', endVel);
    
    // Check if agent jumped
    const deltaY = endPos.y - startPos.y;
    const upwardVel = endVel.y;
    
    console.log('  Height change:', deltaY.toFixed(4));
    console.log('  Upward velocity:', upwardVel.toFixed(4));
    
    if (deltaY > 0.01 || upwardVel > 0.1) {
        console.log('  ✅ Agent responds to jump commands');
        return true;
    } else {
        console.error('  ❌ Agent not responding to jump!');
        return false;
    }
}

/**
 * Test freeze monitoring
 */
function testFreezeMonitoring() {
    console.log('\n🔬 Test 7: Freeze Monitoring');
    
    const app = window.climbingGame;
    if (!app) {
        console.error('❌ App not ready');
        return false;
    }
    
    const hasMonitoring = typeof app.checkForFreeze === 'function' && 
                         typeof app.applyFreezeRecovery === 'function';
    
    if (hasMonitoring) {
        console.log('  ✅ Freeze monitoring methods available');
        
        // Check if monitoring is active
        if (app.freezeCheckInterval) {
            console.log('  ✅ Freeze monitoring is active');
            return true;
        } else {
            console.warn('  ⚠️ Freeze monitoring not started');
            return false;
        }
    } else {
        console.error('  ❌ Freeze monitoring methods missing!');
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('🧪 Running comprehensive freeze fix tests...\n');
    
    const tests = [
        { name: 'Physics Sleep Settings', fn: testPhysicsSleep },
        { name: 'Agent Damping Settings', fn: testAgentDamping },
        { name: 'Action Forces', fn: testActionForces },
        { name: 'Jump Cooldown', fn: testJumpCooldown },
        { name: 'Movement Responsiveness', fn: testMovementResponsiveness },
        { name: 'Jump Responsiveness', fn: testJumpResponsiveness },
        { name: 'Freeze Monitoring', fn: testFreezeMonitoring }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.error(`❌ Test "${test.name}" failed with error:`, error);
            results.push({ name: test.name, passed: false, error: error.message });
        }
    }
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    let passed = 0;
    let total = results.length;
    
    results.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} - ${result.name}`);
        if (result.error) {
            console.log(`    Error: ${result.error}`);
        }
        if (result.passed) passed++;
    });
    
    console.log('=' .repeat(50));
    console.log(`📈 Overall: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
        console.log('🎉 All freeze fixes are working correctly!');
    } else {
        console.log('⚠️ Some fixes may need attention.');
    }
    
    return { passed, total, results };
}

/**
 * Manual movement test for user interaction
 */
function startManualTest() {
    console.log('\n🎮 Manual Movement Test');
    console.log('Use WASD keys and Space to test movement responsiveness.');
    console.log('Watch the console for movement feedback.');
    
    const app = window.climbingGame;
    if (!app || !app.livePlayMode) {
        console.error('❌ Live play mode not available');
        return;
    }
    
    // Start manual live play
    app.startLivePlay('manual').then(() => {
        console.log('✅ Manual test mode started');
        console.log('Press keys and observe agent movement:');
        console.log('  W/↑ - Forward');
        console.log('  S/↓ - Backward'); 
        console.log('  A/← - Left');
        console.log('  D/→ - Right');
        console.log('  Space - Jump');
        console.log('  E - Grab');
    }).catch(error => {
        console.error('❌ Failed to start manual test:', error);
    });
}

// Export test functions
window.freezeFixTests = {
    runAll: runAllTests,
    manual: startManualTest,
    physics: testPhysicsSleep,
    damping: testAgentDamping,
    forces: testActionForces,
    cooldown: testJumpCooldown,
    movement: testMovementResponsiveness,
    jump: testJumpResponsiveness,
    monitoring: testFreezeMonitoring
};

// Auto-run tests when app is ready
const waitForApp = () => {
    const app = window.climbingGame;
    if (app && app.isInitialized) {
        console.log('🎮 App ready, running freeze fix tests...');
        setTimeout(runAllTests, 2000); // Wait 2 seconds for full initialization
    } else {
        setTimeout(waitForApp, 1000);
    }
};

waitForApp();

console.log('🧪 Freeze fix tests loaded! Use window.freezeFixTests for manual testing.');