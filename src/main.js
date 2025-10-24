// Main application entry point
import { testRenderingEngine } from './rendering/test-rendering.js';

console.log('3D RL Climbing Game - Initializing...');

// For now, run rendering engine test
// This will be replaced with full application initialization in later tasks
try {
  const renderingEngine = testRenderingEngine();
  console.log('RenderingEngine test initialized successfully');
} catch (error) {
  console.error('Failed to initialize RenderingEngine test:', error);
}

// Future initialization will include:
// - PhysicsEngine
// - ClimbingEnvironment
// - Agent (DQN or PPO)
// - TrainingOrchestrator
// - UIController
