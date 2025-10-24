import { PhysicsEngine } from './PhysicsEngine.js';

/**
 * Simple test to verify PhysicsEngine functionality
 */
function testPhysicsEngine() {
  console.log('Testing PhysicsEngine...');
  
  // Create and initialize physics engine
  const physics = new PhysicsEngine(-9.81);
  physics.init();
  
  // Test body creation
  console.log('Creating bodies...');
  const ground = physics.createGroundBody(20, 20, { x: 0, y: 0, z: 0 });
  const agent = physics.createAgentBody({ x: 0, y: 5, z: 0 }, 1.0, 0.5);
  const ledge = physics.createLedgeBody({ x: 2, y: 3, z: -5 }, { x: 2, y: 0.2, z: 1 });
  
  // Test position queries
  console.log('Initial agent position:', physics.getBodyPosition(agent));
  console.log('Initial agent velocity:', physics.getBodyVelocity(agent));
  
  // Test force application
  console.log('Applying rightward force...');
  physics.applyForce(agent, { x: 10, y: 0, z: 0 });
  
  // Test impulse application (jump)
  console.log('Applying upward impulse (jump)...');
  physics.applyImpulse(agent, { x: 0, y: 5, z: 0 });
  
  // Run simulation for a few steps
  console.log('Running simulation...');
  for (let i = 0; i < 10; i++) {
    physics.step();
    
    if (i % 3 === 0) {
      const pos = physics.getBodyPosition(agent);
      const vel = physics.getBodyVelocity(agent);
      console.log(`Step ${i}: pos(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}) vel(${vel.x.toFixed(2)}, ${vel.y.toFixed(2)}, ${vel.z.toFixed(2)})`);
    }
  }
  
  // Test collision detection
  const collidingBodies = physics.getCollidingBodies(agent);
  console.log('Bodies colliding with agent:', collidingBodies.length);
  
  // Test reset
  console.log('Testing reset...');
  physics.reset();
  console.log('Physics engine reset successfully');
  
  console.log('PhysicsEngine test completed!');
}

// Export for use in other modules
export { testPhysicsEngine };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPhysicsEngine();
}