import { RenderingEngine } from './RenderingEngine.js';

/**
 * Simple test to verify RenderingEngine functionality
 * This will be integrated into main.js later
 */
export function testRenderingEngine() {
  console.log('Testing RenderingEngine...');

  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.getElementById('canvas-container').appendChild(canvas);

  // Initialize rendering engine
  const renderingEngine = new RenderingEngine(canvas);
  renderingEngine.init();

  // Create environment
  renderingEngine.createGround(20, 20);
  renderingEngine.createClimbingWall();
  renderingEngine.createGoal();
  renderingEngine.createAgent();

  // Test camera following with manual position updates
  let testPosition = { x: 0, y: 1, z: 0 };
  let direction = 1;
  let time = 0;

  function animate() {
    time += 0.016; // ~60fps

    // Simulate agent movement for testing
    testPosition.x = Math.sin(time * 0.5) * 3;
    testPosition.y = 1 + Math.abs(Math.sin(time * 0.3)) * 5;
    testPosition.z = Math.cos(time * 0.2) * 2;

    // Update agent position and camera
    renderingEngine.updateAgentPosition(testPosition);
    renderingEngine.updateCamera(testPosition);

    // Render frame
    renderingEngine.render();

    requestAnimationFrame(animate);
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    renderingEngine.resize(window.innerWidth, window.innerHeight);
  });

  // Start animation loop
  animate();

  console.log('RenderingEngine test started - agent should move and camera should follow');
  
  return renderingEngine;
}