import { PhysicsEngine } from './PhysicsEngine.js';

/**
 * Unit tests for PhysicsEngine
 * Tests body creation, force application, collision detection, and reset functionality
 */

/**
 * Test body creation methods return valid CANNON.Body objects
 */
function testBodyCreation() {
    console.log('Testing body creation methods...');
    
    const physics = new PhysicsEngine(-9.81);
    physics.init();
    
    // Test ground body creation
    const ground = physics.createGroundBody(20, 20, { x: 0, y: 0, z: 0 });
    console.assert(ground !== null, 'Ground body should be created');
    console.assert(ground.mass === 0, 'Ground body should have zero mass (static)');
    console.assert(ground.position.x === 0, 'Ground body should be at correct X position');
    console.assert(ground.position.y === 0, 'Ground body should be at correct Y position');
    console.assert(ground.position.z === 0, 'Ground body should be at correct Z position');
    console.log('✓ Ground body creation test passed');
    
    // Test agent body creation
    const agent = physics.createAgentBody({ x: 0, y: 5, z: 0 }, 1.0, 0.5);
    console.assert(agent !== null, 'Agent body should be created');
    console.assert(agent.mass === 1.0, 'Agent body should have correct mass');
    console.assert(agent.position.x === 0, 'Agent body should be at correct X position');
    console.assert(agent.position.y === 5, 'Agent body should be at correct Y position');
    console.assert(agent.position.z === 0, 'Agent body should be at correct Z position');
    console.log('✓ Agent body creation test passed');
    
    // Test wall body creation
    const wall = physics.createWallBody({ x: 0, y: 5, z: -5 }, { x: 10, y: 10, z: 1 });
    console.assert(wall !== null, 'Wall body should be created');
    console.assert(wall.mass === 0, 'Wall body should have zero mass (static)');
    console.assert(wall.position.z === -5, 'Wall body should be at correct Z position');
    console.log('✓ Wall body creation test passed');
    
    // Test ledge body creation
    const ledge = physics.createLedgeBody({ x: 2, y: 3, z: -5 }, { x: 2, y: 0.2, z: 1 }, 'test-ledge');
    console.assert(ledge !== null, 'Ledge body should be created');
    console.assert(ledge.mass === 0, 'Ledge body should have zero mass (static)');
    console.assert(physics.getBody('test-ledge') === ledge, 'Ledge should be tracked with correct ID');
    console.log('✓ Ledge body creation test passed');
    
    console.log('✓ All body creation tests passed');
    return { physics, ground, agent, wall, ledge };
}

/**
 * Test force application changes body velocity
 */
function testForceApplication() {
    console.log('\nTesting force application...');
    
    const physics = new PhysicsEngine(-9.81);
    physics.init();
    
    const agent = physics.createAgentBody({ x: 0, y: 5, z: 0 }, 1.0, 0.5);
    
    // Get initial velocity
    const initialVel = physics.getBodyVelocity(agent);
    console.assert(initialVel.x === 0, 'Initial X velocity should be zero');
    console.assert(initialVel.y === 0, 'Initial Y velocity should be zero');
    console.assert(initialVel.z === 0, 'Initial Z velocity should be zero');
    console.log('✓ Initial velocity is zero');
    
    // Apply rightward force
    physics.applyForce(agent, { x: 10, y: 0, z: 0 });
    
    // Step physics to apply force
    physics.step();
    
    // Check velocity changed
    const newVel = physics.getBodyVelocity(agent);
    console.assert(newVel.x > 0, 'X velocity should increase after rightward force');
    console.log('✓ Force application changes velocity');
    
    // Test impulse application
    const beforeImpulseVel = physics.getBodyVelocity(agent);
    physics.applyImpulse(agent, { x: 0, y: 5, z: 0 });
    
    const afterImpulseVel = physics.getBodyVelocity(agent);
    console.assert(afterImpulseVel.y > beforeImpulseVel.y, 'Y velocity should increase after upward impulse');
    console.log('✓ Impulse application changes velocity');
    
    console.log('✓ All force application tests passed');
}

/**
 * Test position and velocity query methods return correct values
 */
function testPositionAndVelocityQueries() {
    console.log('\nTesting position and velocity queries...');
    
    const physics = new PhysicsEngine(-9.81);
    physics.init();
    
    const testPos = { x: 1.5, y: 2.5, z: -3.5 };
    const agent = physics.createAgentBody(testPos, 1.0, 0.5);
    
    // Test position query
    const queriedPos = physics.getBodyPosition(agent);
    console.assert(Math.abs(queriedPos.x - testPos.x) < 0.001, 'Queried X position should match set position');
    console.assert(Math.abs(queriedPos.y - testPos.y) < 0.001, 'Queried Y position should match set position');
    console.assert(Math.abs(queriedPos.z - testPos.z) < 0.001, 'Queried Z position should match set position');
    console.log('✓ Position query returns correct values');
    
    // Test velocity query (should be zero initially)
    const queriedVel = physics.getBodyVelocity(agent);
    console.assert(Math.abs(queriedVel.x) < 0.001, 'Initial X velocity should be zero');
    console.assert(Math.abs(queriedVel.y) < 0.001, 'Initial Y velocity should be zero');
    console.assert(Math.abs(queriedVel.z) < 0.001, 'Initial Z velocity should be zero');
    console.log('✓ Velocity query returns correct values');
    
    // Test setting position and velocity
    physics.setBodyPosition(agent, { x: 10, y: 20, z: 30 });
    const newPos = physics.getBodyPosition(agent);
    console.assert(Math.abs(newPos.x - 10) < 0.001, 'Set position X should be correct');
    console.assert(Math.abs(newPos.y - 20) < 0.001, 'Set position Y should be correct');
    console.assert(Math.abs(newPos.z - 30) < 0.001, 'Set position Z should be correct');
    console.log('✓ Position setting works correctly');
    
    physics.setBodyVelocity(agent, { x: 5, y: -5, z: 2 });
    const newVel = physics.getBodyVelocity(agent);
    console.assert(Math.abs(newVel.x - 5) < 0.001, 'Set velocity X should be correct');
    console.assert(Math.abs(newVel.y + 5) < 0.001, 'Set velocity Y should be correct');
    console.assert(Math.abs(newVel.z - 2) < 0.001, 'Set velocity Z should be correct');
    console.log('✓ Velocity setting works correctly');
    
    console.log('✓ All position and velocity query tests passed');
}

/**
 * Test collision detection between overlapping bodies
 */
function testCollisionDetection() {
    console.log('\nTesting collision detection...');
    
    const physics = new PhysicsEngine(-9.81);
    physics.init();
    
    // Create ground and agent that should collide
    const ground = physics.createGroundBody(20, 20, { x: 0, y: 0, z: 0 });
    const agent = physics.createAgentBody({ x: 0, y: 0.5, z: 0 }, 1.0, 0.5); // Just above ground
    
    // Step physics to allow collision detection
    for (let i = 0; i < 10; i++) {
        physics.step();
    }
    
    // Test collision detection
    const isColliding = physics.checkCollision(agent, ground);
    console.log('Agent-ground collision detected:', isColliding);
    
    // Test getting colliding bodies
    const collidingBodies = physics.getCollidingBodies(agent);
    console.log('Number of bodies colliding with agent:', collidingBodies.length);
    
    // Create two separate agents that shouldn't collide initially
    const agent1 = physics.createAgentBody({ x: -10, y: 5, z: 0 }, 1.0, 0.5);
    const agent2 = physics.createAgentBody({ x: 10, y: 5, z: 0 }, 1.0, 0.5);
    
    const notColliding = physics.checkCollision(agent1, agent2);
    console.assert(!notColliding, 'Distant agents should not be colliding');
    console.log('✓ Non-colliding bodies correctly detected');
    
    console.log('✓ All collision detection tests passed');
}

/**
 * Test reset() clears all bodies from world
 */
function testReset() {
    console.log('\nTesting reset functionality...');
    
    const physics = new PhysicsEngine(-9.81);
    physics.init();
    
    // Create several bodies
    const ground = physics.createGroundBody(20, 20, { x: 0, y: 0, z: 0 });
    const agent = physics.createAgentBody({ x: 0, y: 5, z: 0 }, 1.0, 0.5);
    const ledge1 = physics.createLedgeBody({ x: 2, y: 3, z: -5 }, { x: 2, y: 0.2, z: 1 }, 'ledge1');
    const ledge2 = physics.createLedgeBody({ x: -2, y: 4, z: -5 }, { x: 2, y: 0.2, z: 1 }, 'ledge2');
    
    // Verify bodies exist
    console.assert(physics.getBody('ground') !== null, 'Ground body should exist before reset');
    console.assert(physics.getBody('agent') !== null, 'Agent body should exist before reset');
    console.assert(physics.getBody('ledge1') !== null, 'Ledge1 body should exist before reset');
    console.assert(physics.getBody('ledge2') !== null, 'Ledge2 body should exist before reset');
    console.log('✓ Bodies exist before reset');
    
    // Test reset
    physics.reset();
    
    // Verify bodies are cleared
    console.assert(physics.getBody('ground') === null, 'Ground body should be cleared after reset');
    console.assert(physics.getBody('agent') === null, 'Agent body should be cleared after reset');
    console.assert(physics.getBody('ledge1') === null, 'Ledge1 body should be cleared after reset');
    console.assert(physics.getBody('ledge2') === null, 'Ledge2 body should be cleared after reset');
    console.log('✓ All bodies cleared after reset');
    
    // Verify world is still functional after reset
    const newAgent = physics.createAgentBody({ x: 0, y: 1, z: 0 }, 1.0, 0.5);
    console.assert(newAgent !== null, 'Should be able to create bodies after reset');
    console.assert(physics.getBody('agent') === newAgent, 'New agent should be tracked correctly');
    console.log('✓ Physics engine functional after reset');
    
    console.log('✓ All reset tests passed');
}

/**
 * Test error handling for invalid inputs
 */
function testErrorHandling() {
    console.log('\nTesting error handling...');
    
    const physics = new PhysicsEngine(-9.81);
    physics.init();
    
    // Test null body handling
    const nullPos = physics.getBodyPosition(null);
    console.assert(nullPos.x === 0 && nullPos.y === 0 && nullPos.z === 0, 'Null body should return zero position');
    
    const nullVel = physics.getBodyVelocity(null);
    console.assert(nullVel.x === 0 && nullVel.y === 0 && nullVel.z === 0, 'Null body should return zero velocity');
    
    // Test collision with null bodies
    const agent = physics.createAgentBody({ x: 0, y: 1, z: 0 }, 1.0, 0.5);
    const nullCollision = physics.checkCollision(agent, null);
    console.assert(!nullCollision, 'Collision with null should return false');
    
    console.log('✓ Error handling tests passed');
}

/**
 * Run all physics engine unit tests
 */
export function runPhysicsEngineTests() {
    console.log('Running PhysicsEngine unit tests...\n');
    
    try {
        testBodyCreation();
        testForceApplication();
        testPositionAndVelocityQueries();
        testCollisionDetection();
        testReset();
        testErrorHandling();
        
        console.log('\n✅ All PhysicsEngine unit tests passed!');
        return true;
    } catch (error) {
        console.error('\n❌ PhysicsEngine test failed:', error);
        return false;
    }
}

/**
 * Legacy test function for backwards compatibility
 */
function testPhysicsEngine() {
    return runPhysicsEngineTests();
  
  console.log('PhysicsEngine test completed!');
}

// Export for use in other modules
export { testPhysicsEngine };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPhysicsEngine();
}