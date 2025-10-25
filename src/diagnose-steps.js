/**
 * Deep diagnostic for step detection issues
 * Run: diagnoseSteps(window.climbingGame)
 */

window.diagnoseSteps = function(game) {
    console.log('🔍 DEEP STEP DETECTION DIAGNOSIS\n');
    
    if (!game || !game.environment) {
        console.error('❌ Game not initialized');
        return;
    }
    
    const env = game.environment;
    const physics = game.physicsEngine;
    const sceneBuilder = game.sceneBuilder;
    
    // 1. Check actual step physics bodies
    console.log('═══ ACTUAL STEP POSITIONS (from physics) ═══');
    const sceneObjects = sceneBuilder.getSceneObjects();
    sceneObjects.forEach(obj => {
        if (obj.id && obj.id.startsWith('step_')) {
            const body = obj.physicsBody;
            if (body) {
                const pos = body.position;
                const shape = body.shapes[0];
                const halfExtents = shape.halfExtents;
                console.log(`${obj.id}:`);
                console.log(`  Center: (${pos.x}, ${pos.y}, ${pos.z})`);
                console.log(`  Half extents: (${halfExtents.x}, ${halfExtents.y}, ${halfExtents.z})`);
                console.log(`  Y range: [${pos.y - halfExtents.y}, ${pos.y + halfExtents.y}]`);
                console.log(`  Z range: [${pos.z - halfExtents.z}, ${pos.z + halfExtents.z}]`);
            }
        }
    });
    console.log('');
    
    // 2. Check what detection code expects
    console.log('═══ DETECTION CODE EXPECTATIONS ═══');
    for (let i = 0; i < 10; i++) {
        const stepCenterZ = -2.0 * i;
        const stepMinZ = stepCenterZ - 1.0;
        const stepMaxZ = stepCenterZ + 1.0;
        const expectedHeight = (i + 1) * 1.0;
        console.log(`Step ${i}:`);
        console.log(`  Expected height: ${expectedHeight} (±1.5 tolerance)`);
        console.log(`  Z range: [${stepMinZ}, ${stepMaxZ}]`);
    }
    console.log('');
    
    // 3. Test agent at various positions
    console.log('═══ AGENT POSITION TESTS ═══');
    const testCases = [
        { pos: { x: 0, y: 1, z: 3 }, desc: 'Start position' },
        { pos: { x: 0, y: 0.5, z: 0 }, desc: 'Step 0 center' },
        { pos: { x: 0, y: 1, z: 0 }, desc: 'Step 0 top' },
        { pos: { x: 0, y: 1.5, z: -2 }, desc: 'Step 1 center' },
        { pos: { x: 0, y: 2, z: -2 }, desc: 'Step 1 top' },
        { pos: { x: 0, y: 2.5, z: -4 }, desc: 'Step 2 center' },
        { pos: { x: 0, y: 3, z: -4 }, desc: 'Step 2 top' },
        { pos: { x: 0, y: 1, z: -1 }, desc: 'Boundary Step 0/1' },
        { pos: { x: 0, y: 2, z: -3 }, desc: 'Boundary Step 1/2' }
    ];
    
    testCases.forEach(test => {
        physics.setBodyPosition(env.agentBody, test.pos);
        const detected = env.detectCurrentStep();
        const heightDiff = Math.abs(test.pos.y - ((detected + 1) * 1.0));
        console.log(`${test.desc}:`);
        console.log(`  Position: (${test.pos.x}, ${test.pos.y}, ${test.pos.z})`);
        console.log(`  Detected: Step ${detected}`);
        console.log(`  Height diff: ${heightDiff.toFixed(2)}`);
        console.log('');
    });
    
    // 4. Check collision detection
    console.log('═══ COLLISION DETECTION TEST ═══');
    const collisionTests = [
        { pos: { x: 0, y: 0.5, z: 0 }, desc: 'Inside Step 0' },
        { pos: { x: 0, y: 1.5, z: -2 }, desc: 'Inside Step 1' },
        { pos: { x: 0, y: 1, z: 3 }, desc: 'Start (in air)' }
    ];
    
    collisionTests.forEach(test => {
        physics.setBodyPosition(env.agentBody, test.pos);
        physics.step(); // Let physics settle
        const collidingBodies = physics.getCollidingBodies(env.agentBody);
        console.log(`${test.desc}:`);
        console.log(`  Position: (${test.pos.x}, ${test.pos.y}, ${test.pos.z})`);
        console.log(`  Colliding with ${collidingBodies.length} bodies`);
        collidingBodies.forEach(body => {
            const bodyId = env.getBodyId(body);
            console.log(`    - ${bodyId || 'unknown'}`);
        });
        console.log('');
    });
    
    // 5. Check if agent can actually reach steps
    console.log('═══ MOVEMENT TEST ═══');
    env.reset();
    console.log('Starting position:', physics.getBodyPosition(env.agentBody));
    console.log('Taking 20 FORWARD actions...');
    
    for (let i = 0; i < 20; i++) {
        env.step(0); // FORWARD
        if (i % 5 === 0) {
            const pos = physics.getBodyPosition(env.agentBody);
            const step = env.detectCurrentStep();
            console.log(`  After ${i} steps: pos=(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}), step=${step}`);
        }
    }
    
    const finalPos = physics.getBodyPosition(env.agentBody);
    const finalStep = env.detectCurrentStep();
    console.log(`Final: pos=(${finalPos.x.toFixed(2)}, ${finalPos.y.toFixed(2)}, ${finalPos.z.toFixed(2)}), step=${finalStep}`);
    console.log('');
    
    // 6. Summary
    console.log('═══ DIAGNOSIS SUMMARY ═══');
    console.log('Issues found:');
    
    // Check if agent starts in air
    env.reset();
    const startPos = physics.getBodyPosition(env.agentBody);
    if (startPos.y > 0.6) {
        console.log('⚠️  Agent starts in AIR at y=' + startPos.y);
        console.log('    Should start at y≈0.5 to be on ground');
    }
    
    // Check height expectations
    console.log('⚠️  Detection expects agent at y=1 for Step 0');
    console.log('    But Step 0 center is at y=0.5 (range 0-1)');
    console.log('    Agent standing ON step would be at y≈1 (top surface)');
    
    // Check tolerance
    console.log('⚠️  Height tolerance is 1.5 units - very forgiving');
    console.log('    Agent can be 1.5 units above/below and still count');
    
    console.log('\n✅ Diagnosis complete!');
};

console.log('💡 Step diagnosis loaded! Run: diagnoseSteps(window.climbingGame)');
