/**
 * Test staircase scene and rewards
 */

export async function testStaircase(app) {
    console.log('🧪 Testing Staircase Scene...\n');
    
    if (!app || !app.environment) {
        console.error('❌ App or environment not found');
        return;
    }
    
    const env = app.environment;
    
    // Test 1: Check scene objects
    console.log('Test 1: Scene Objects');
    if (app.sceneBuilder) {
        const objects = app.sceneBuilder.getSceneObjects();
        console.log('  Scene objects:', objects.length);
        objects.forEach(obj => {
            console.log(`    - ${obj.id}: pos=(${obj.obstacle.position.x}, ${obj.obstacle.position.y}, ${obj.obstacle.position.z})`);
        });
    }
    console.log('');
    
    // Test 2: Agent start position
    console.log('Test 2: Agent Start Position');
    env.reset();
    const startPos = env.physicsEngine.getBodyPosition(env.agentBody);
    console.log('  Agent starts at:', startPos);
    console.log('  Expected: x=0, y=1, z=3 (in front of stairs)');
    console.log('');
    
    // Test 3: Try to reach first step
    console.log('Test 3: Attempting to Reach First Step');
    env.reset();
    
    console.log('  Moving forward (toward stairs)...');
    for (let i = 0; i < 30; i++) {
        const result = env.step(env.ACTION_SPACE.FORWARD); // Move forward
        const pos = env.physicsEngine.getBodyPosition(env.agentBody);
        
        if (i % 10 === 0) {
            console.log(`    Step ${i}: pos=(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}), reward=${result.reward.toFixed(2)}`);
        }
    }
    
    const finalPos = env.physicsEngine.getBodyPosition(env.agentBody);
    console.log('  Final position:', finalPos);
    console.log('');
    
    // Test 4: Step detection
    console.log('Test 4: Step Detection');
    const detectedStep = env.detectCurrentStep();
    console.log('  Detected step:', detectedStep);
    console.log('  Highest step reached:', env.highestStepReached);
    console.log('  Steps visited:', Array.from(env.stepsVisited));
    console.log('');
    
    // Test 5: Try jumping onto first step
    console.log('Test 5: Jump Onto First Step');
    env.reset();
    
    // Move forward
    for (let i = 0; i < 20; i++) {
        env.step(env.ACTION_SPACE.FORWARD);
    }
    
    console.log('  Jumping...');
    const beforeJump = env.physicsEngine.getBodyPosition(env.agentBody);
    console.log('  Before jump:', beforeJump);
    
    env.step(env.ACTION_SPACE.JUMP);
    
    // Wait for jump
    for (let i = 0; i < 10; i++) {
        env.step(0);
    }
    
    const afterJump = env.physicsEngine.getBodyPosition(env.agentBody);
    console.log('  After jump:', afterJump);
    console.log('  Height gain:', (afterJump.y - beforeJump.y).toFixed(2));
    console.log('  Detected step:', env.detectCurrentStep());
    console.log('');
    
    // Test 6: Check reward for being on step
    console.log('Test 6: Reward for Being on Step');
    env.reset();
    
    // Manually place agent on first step
    env.physicsEngine.setBodyPosition(env.agentBody, { x: 0, y: 1.5, z: -1 });
    env.physicsEngine.setBodyVelocity(env.agentBody, { x: 0, y: 0, z: 0 });
    
    // Take a step
    const result = env.step(0);
    console.log('  Agent on step 0');
    console.log('  Detected step:', env.detectCurrentStep());
    console.log('  Reward:', result.reward.toFixed(2));
    console.log('  Highest step:', env.highestStepReached);
    console.log('');
    
    console.log('✅ Staircase test complete!\n');
    console.log('Summary:');
    console.log('  - Check if stairs are visible in scene');
    console.log('  - Check if agent can reach first step');
    console.log('  - Check if step detection works');
    console.log('  - Check if rewards are given');
}

// Make available globally
if (typeof window !== 'undefined') {
    window.testStaircase = testStaircase;
    console.log('💡 Staircase test loaded. Run: testStaircase(window.climbingGame)');
}
