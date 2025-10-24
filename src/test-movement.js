/**
 * Test movement actions to diagnose why WASD isn't working
 */

export async function testMovement(app) {
    console.log('🧪 Testing Movement Actions...\n');
    
    if (!app || !app.environment) {
        console.error('❌ App or environment not found');
        return;
    }
    
    const env = app.environment;
    
    // Test each movement action
    const actions = [
        { name: 'FORWARD', action: env.ACTION_SPACE.FORWARD, axis: 'z', expected: 'negative' },
        { name: 'BACKWARD', action: env.ACTION_SPACE.BACKWARD, axis: 'z', expected: 'positive' },
        { name: 'LEFT', action: env.ACTION_SPACE.LEFT, axis: 'x', expected: 'negative' },
        { name: 'RIGHT', action: env.ACTION_SPACE.RIGHT, axis: 'x', expected: 'positive' }
    ];
    
    for (const test of actions) {
        console.log(`\nTest: ${test.name} (Action ${test.action})`);
        
        // Reset environment
        env.reset();
        
        // Let physics settle
        for (let i = 0; i < 10; i++) {
            env.step(0); // No action
        }
        
        // Get initial position
        const beforePos = env.physicsEngine.getBodyPosition(env.agentBody);
        console.log(`  Before: x=${beforePos.x.toFixed(3)}, y=${beforePos.y.toFixed(3)}, z=${beforePos.z.toFixed(3)}`);
        
        // Apply action multiple times
        for (let i = 0; i < 20; i++) {
            env.step(test.action);
        }
        
        // Get final position
        const afterPos = env.physicsEngine.getBodyPosition(env.agentBody);
        console.log(`  After:  x=${afterPos.x.toFixed(3)}, y=${afterPos.y.toFixed(3)}, z=${afterPos.z.toFixed(3)}`);
        
        // Calculate movement
        const dx = afterPos.x - beforePos.x;
        const dy = afterPos.y - beforePos.y;
        const dz = afterPos.z - beforePos.z;
        
        console.log(`  Delta:  dx=${dx.toFixed(3)}, dy=${dy.toFixed(3)}, dz=${dz.toFixed(3)}`);
        
        // Check if movement occurred on expected axis
        const moved = Math.abs(test.axis === 'x' ? dx : dz) > 0.1;
        
        if (moved) {
            console.log(`  ✅ PASS: Movement detected on ${test.axis} axis`);
        } else {
            console.log(`  ❌ FAIL: No movement detected`);
            
            // Debug info
            const vel = env.physicsEngine.getBodyVelocity(env.agentBody);
            console.log(`  Velocity: x=${vel.x.toFixed(3)}, y=${vel.y.toFixed(3)}, z=${vel.z.toFixed(3)}`);
            
            const body = env.agentBody;
            console.log(`  Body mass: ${body.mass}`);
            console.log(`  Body damping: linear=${body.linearDamping}, angular=${body.angularDamping}`);
        }
    }
    
    // Test force magnitude
    console.log('\n\nForce Configuration:');
    console.log('  Move force:', env.config.actionForces.move);
    console.log('  Jump force:', env.config.actionForces.jump);
    console.log('  Grab force:', env.config.actionForces.grab);
    
    console.log('\n✅ Movement test complete!');
}

// Make available globally
if (typeof window !== 'undefined') {
    window.testMovement = testMovement;
    console.log('💡 Movement test loaded. Run: testMovement(window.climbingGame)');
}
