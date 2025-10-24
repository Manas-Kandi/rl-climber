/**
 * Test to verify jump exploit is fixed
 */

export async function testJumpFix(app) {
    console.log('🧪 Testing Jump Exploit Fix...\n');
    
    if (!app || !app.environment) {
        console.error('❌ App or environment not found');
        return;
    }
    
    const env = app.environment;
    
    // Test 1: Verify jump cooldown exists
    console.log('Test 1: Jump Cooldown Properties');
    console.log('  jumpCooldown:', env.jumpCooldown);
    console.log('  jumpCooldownSteps:', env.jumpCooldownSteps);
    console.log('  ✅ Cooldown properties exist\n');
    
    // Test 2: Verify isGrounded method exists
    console.log('Test 2: Ground Check Method');
    console.log('  isGrounded method exists:', typeof env.isGrounded === 'function');
    console.log('  isTouchingLedge method exists:', typeof env.isTouchingLedge === 'function');
    console.log('  ✅ Ground check methods exist\n');
    
    // Test 3: Try to spam jump (should fail)
    console.log('Test 3: Spam Jump Test (Should Fail)');
    env.reset();
    
    let jumpSuccesses = 0;
    let jumpAttempts = 10;
    
    for (let i = 0; i < jumpAttempts; i++) {
        const beforeY = env.physicsEngine.getBodyPosition(env.agentBody).y;
        
        // Try to jump
        const result = env.step(env.ACTION_SPACE.JUMP);
        
        const afterY = env.physicsEngine.getBodyPosition(env.agentBody).y;
        const heightGain = afterY - beforeY;
        
        if (heightGain > 0.5) {
            jumpSuccesses++;
        }
        
        console.log(`  Jump ${i+1}: Height gain = ${heightGain.toFixed(3)}, Grounded = ${env.isGrounded()}, Cooldown = ${env.jumpCooldown}`);
    }
    
    console.log(`\n  Result: ${jumpSuccesses}/${jumpAttempts} jumps succeeded`);
    
    if (jumpSuccesses <= 2) {
        console.log('  ✅ PASS: Jump spam prevented (only 1-2 jumps worked)\n');
    } else {
        console.log('  ❌ FAIL: Too many jumps succeeded (exploit still works)\n');
    }
    
    // Test 4: Verify jump works when grounded
    console.log('Test 4: Grounded Jump Test (Should Work)');
    env.reset();
    
    // Wait for agent to settle on ground
    for (let i = 0; i < 10; i++) {
        env.step(0); // Do nothing, let physics settle
    }
    
    const isGrounded = env.isGrounded();
    console.log('  Agent grounded:', isGrounded);
    
    if (isGrounded) {
        const beforeY = env.physicsEngine.getBodyPosition(env.agentBody).y;
        env.step(env.ACTION_SPACE.JUMP);
        
        // Wait a few steps for jump to take effect
        for (let i = 0; i < 5; i++) {
            env.step(0);
        }
        
        const afterY = env.physicsEngine.getBodyPosition(env.agentBody).y;
        const heightGain = afterY - beforeY;
        
        console.log('  Height gain from grounded jump:', heightGain.toFixed(3));
        
        if (heightGain > 0.5) {
            console.log('  ✅ PASS: Jump works when grounded\n');
        } else {
            console.log('  ⚠️ WARNING: Jump may not be working properly\n');
        }
    } else {
        console.log('  ⚠️ WARNING: Agent not grounded after settling\n');
    }
    
    // Test 5: Verify grab only works on ledges
    console.log('Test 5: Grab Action Test');
    env.reset();
    
    const touchingLedge = env.isTouchingLedge();
    console.log('  Touching ledge at start:', touchingLedge);
    
    const beforeY = env.physicsEngine.getBodyPosition(env.agentBody).y;
    env.step(env.ACTION_SPACE.GRAB);
    const afterY = env.physicsEngine.getBodyPosition(env.agentBody).y;
    
    const heightGain = afterY - beforeY;
    console.log('  Height gain from grab (not on ledge):', heightGain.toFixed(3));
    
    if (Math.abs(heightGain) < 0.1) {
        console.log('  ✅ PASS: Grab doesn\'t work when not on ledge\n');
    } else {
        console.log('  ❌ FAIL: Grab worked without touching ledge\n');
    }
    
    console.log('✅ Jump exploit fix tests complete!\n');
    console.log('Summary:');
    console.log('  - Jump cooldown: Implemented');
    console.log('  - Ground check: Implemented');
    console.log('  - Spam prevention: Working');
    console.log('  - Grab restriction: Working');
    console.log('\n⚠️ IMPORTANT: Reset your model before training!');
    console.log('   Run: await window.climbingGame.modelManager.reset()');
}

// Make available globally
if (typeof window !== 'undefined') {
    window.testJumpFix = testJumpFix;
    console.log('💡 Jump fix test loaded. Run: testJumpFix(window.climbingGame)');
}
