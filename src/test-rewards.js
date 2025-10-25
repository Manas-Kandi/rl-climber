/**
 * Test script to verify reward system for staircase climbing
 * Run in browser console: testRewards(window.climbingGame)
 */

window.testRewards = function(game) {
    console.log('🧪 Testing Reward System...\n');
    
    if (!game || !game.environment) {
        console.error('❌ Game not initialized');
        return;
    }
    
    const env = game.environment;
    const physics = game.physicsEngine;
    
    // Test 1: Check start position
    console.log('Test 1: Start Position');
    console.log('Expected:', env.config.agent.startPosition);
    env.reset();
    const startPos = physics.getBodyPosition(env.agentBody);
    console.log('Actual:', startPos);
    console.log('✅ Start position:', startPos.z === 3 ? 'CORRECT (z=3)' : '❌ WRONG (should be z=3)');
    console.log('');
    
    // Test 2: Step detection at different positions
    console.log('Test 2: Step Detection');
    const testPositions = [
        { pos: { x: 0, y: 1, z: 3 }, expected: -1, desc: 'Start (ground)' },
        { pos: { x: 0, y: 1, z: 0 }, expected: 0, desc: 'Step 0 (center)' },
        { pos: { x: 0, y: 2, z: -2 }, expected: 1, desc: 'Step 1 (center)' },
        { pos: { x: 0, y: 3, z: -4 }, expected: 2, desc: 'Step 2 (center)' },
        { pos: { x: 0, y: 5, z: -8 }, expected: 4, desc: 'Step 4 (center)' },
        { pos: { x: 0, y: 10, z: -18 }, expected: 9, desc: 'Step 9 (center)' },
        { pos: { x: 5, y: 2, z: -2 }, expected: -1, desc: 'Off to side' }
    ];
    
    for (const test of testPositions) {
        physics.setBodyPosition(env.agentBody, test.pos);
        const detected = env.detectCurrentStep();
        const status = detected === test.expected ? '✅' : '❌';
        console.log(`${status} ${test.desc}: detected=${detected}, expected=${test.expected}`);
    }
    console.log('');
    
    // Test 3: Reward for climbing steps
    console.log('Test 3: Reward for Climbing Steps');
    env.reset();
    
    // Simulate climbing step by step
    const stepPositions = [
        { x: 0, y: 1, z: 0 },   // Step 0 (center)
        { x: 0, y: 2, z: -2 },  // Step 1 (center)
        { x: 0, y: 3, z: -4 },  // Step 2 (center)
        { x: 0, y: 4, z: -6 }   // Step 3 (center)
    ];
    
    let totalReward = 0;
    for (let i = 0; i < stepPositions.length; i++) {
        const prevState = env.getState();
        physics.setBodyPosition(env.agentBody, stepPositions[i]);
        physics.setBodyVelocity(env.agentBody, { x: 0, y: 0, z: 0 });
        const newState = env.getState();
        const reward = env.calculateReward(prevState, 0, newState);
        totalReward += reward;
        const step = env.detectCurrentStep();
        console.log(`Step ${i}: position=(${stepPositions[i].y.toFixed(1)}, ${stepPositions[i].z.toFixed(1)}), detected=${step}, reward=${reward.toFixed(2)}, total=${totalReward.toFixed(2)}`);
    }
    console.log('');
    
    // Test 4: Continuous reward gradient
    console.log('Test 4: Reward Gradient (moving toward step 1)');
    env.reset();
    
    // Test positions moving from ground toward step 1
    const gradientTest = [
        { x: 0, y: 1, z: 2 },
        { x: 0, y: 1, z: 1 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 1.5, z: -0.5 },
        { x: 0, y: 2, z: -1 }
    ];
    
    for (let i = 0; i < gradientTest.length; i++) {
        const prevState = env.getState();
        physics.setBodyPosition(env.agentBody, gradientTest[i]);
        physics.setBodyVelocity(env.agentBody, { x: 0, y: 0, z: 0 });
        const newState = env.getState();
        const reward = env.calculateReward(prevState, 0, newState);
        const step = env.detectCurrentStep();
        console.log(`Pos ${i}: z=${gradientTest[i].z.toFixed(1)}, y=${gradientTest[i].y.toFixed(1)}, step=${step}, reward=${reward.toFixed(2)}`);
    }
    console.log('');
    
    // Test 5: Action effects
    console.log('Test 5: Action Effects');
    env.reset();
    console.log('Start position:', physics.getBodyPosition(env.agentBody));
    
    // Try moving forward (toward stairs - negative Z direction)
    console.log('Taking FORWARD action (toward stairs)...');
    for (let i = 0; i < 10; i++) {
        const result = env.step(0); // FORWARD (negative Z)
        if (i % 3 === 0) {
            const pos = physics.getBodyPosition(env.agentBody);
            console.log(`  Step ${i}: z=${pos.z.toFixed(2)}, reward=${result.reward.toFixed(2)}`);
        }
    }
    
    const finalPos = physics.getBodyPosition(env.agentBody);
    console.log('Final position:', finalPos);
    console.log('Movement:', finalPos.z < 3 ? '✅ Moving toward stairs (negative Z)' : '❌ Not moving correctly');
    console.log('');
    
    console.log('✅ Reward system test complete!');
    console.log('\nKey Findings:');
    console.log('- Agent should start at z=3 (in front of stairs)');
    console.log('- FORWARD action (0) moves toward stairs (negative Z direction)');
    console.log('- BACKWARD action (1) moves away from stairs (positive Z direction)');
    console.log('- Reaching new steps should give large rewards (20, 40, 60, etc.)');
    console.log('- Height and proximity should give continuous rewards');
};

console.log('💡 Reward test loaded! Run: testRewards(window.climbingGame)');
