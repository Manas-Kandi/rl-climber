# Design Document

## Overview

This document outlines the technical design for a browser-based 3D climbing game with reinforcement learning. The application is a single-page web application that runs entirely in the browser, leveraging WebGL for 3D graphics, WebAssembly-accelerated physics simulation, and GPU-accelerated machine learning.

The system follows a modular architecture with clear separation between the 3D rendering layer, physics simulation, RL environment abstraction, neural network models, and training orchestration. This design enables independent development and testing of each component while maintaining clean interfaces between layers.

### Key Design Principles

1. **Browser-First**: All computation happens client-side with no backend dependencies
2. **Real-time Feedback**: Visual and statistical feedback updates continuously during training
3. **Modular Architecture**: Clear separation of concerns between rendering, physics, RL, and UI
4. **Performance-Oriented**: Optimized for smooth 60 FPS rendering during training
5. **Algorithm Flexibility**: Support both PPO and DQN with minimal code changes

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Window                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    UI Layer (HTML/CSS)                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Control Panel│  │  Stats Panel │  │   Charts    │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              3D Canvas (Three.js/WebGL)               │  │
│  │                                                         │  │
│  │    ┌─────────────────────────────────────────┐        │  │
│  │    │      Rendering Engine (Three.js)        │        │  │
│  │    │  - Scene Management                      │        │  │
│  │    │  - Camera Control                        │        │  │
│  │    │  - Mesh Rendering                        │        │  │
│  │    └─────────────────────────────────────────┘        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Application Core (JavaScript)             │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │         Training Orchestrator                     │ │  │
│  │  │  - Episode Management                             │ │  │
│  │  │  - Training Loop Control                          │ │  │
│  │  │  - Statistics Collection                          │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  ┌──────────────────┐      ┌──────────────────────┐  │  │
│  │  │  RL Environment  │◄────►│   Physics Engine     │  │  │
│  │  │  - State Space   │      │   (Cannon-es)        │  │  │
│  │  │  - Action Space  │      │   - Rigid Bodies     │  │  │
│  │  │  - Reward Calc   │      │   - Collision Det.   │  │  │
│  │  └──────────────────┘      └──────────────────────┘  │  │
│  │           ▲                                            │  │
│  │           │                                            │  │
│  │           ▼                                            │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │      RL Agent (TensorFlow.js)                    │ │  │
│  │  │  ┌────────────────┐    ┌────────────────┐       │ │  │
│  │  │  │  Actor Network │    │ Critic Network │ (PPO) │ │  │
│  │  │  └────────────────┘    └────────────────┘       │ │  │
│  │  │  ┌────────────────┐    ┌────────────────┐       │ │  │
│  │  │  │   Q-Network    │    │ Target Network │ (DQN) │ │  │
│  │  │  └────────────────┘    └────────────────┘       │ │  │
│  │  │  - Experience Buffer                             │ │  │
│  │  │  - Training Logic                                │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initialization Flow**: UI → Training Orchestrator → RL Environment → Physics Engine → Rendering Engine
2. **Training Loop Flow**: Agent selects action → Environment steps physics → Reward calculated → State updated → Agent learns → Repeat
3. **Rendering Flow**: Physics state → Environment state → Rendering Engine → WebGL → Canvas
4. **UI Update Flow**: Training statistics → Chart.js → UI panels

## Components and Interfaces

### 1. Rendering Engine (Three.js Wrapper)

**Responsibilities:**
- Manage Three.js scene, camera, renderer, and lights
- Create and update 3D meshes for environment and agent
- Handle camera following behavior
- Synchronize visual representation with physics state

**Interface:**

```javascript
class RenderingEngine {
  constructor(canvasElement)
  
  // Initialization
  init(): void
  
  // Scene management
  createGround(width, depth): THREE.Mesh
  createClimbingWall(ledgePositions): THREE.Group
  createAgent(position): THREE.Mesh
  createGoal(position): THREE.Mesh
  
  // Update methods
  updateAgentPosition(position): void
  updateCamera(targetPosition): void
  render(): void
  
  // Utility
  resize(width, height): void
  dispose(): void
}
```

### 2. Physics Engine (Cannon-es Wrapper)

**Responsibilities:**
- Manage Cannon.js physics world
- Create rigid bodies for all physical objects
- Handle collision detection and response
- Step physics simulation forward in time

**Interface:**

```javascript
class PhysicsEngine {
  constructor(gravity)
  
  // Initialization
  init(): void
  
  // Body creation
  createGroundBody(width, depth): CANNON.Body
  createWallBody(position, size): CANNON.Body
  createAgentBody(position, mass): CANNON.Body
  createLedgeBody(position, size): CANNON.Body
  
  // Simulation
  step(deltaTime): void
  
  // Actions
  applyForce(body, force, worldPoint): void
  applyImpulse(body, impulse, worldPoint): void
  
  // Queries
  getBodyPosition(body): {x, y, z}
  getBodyVelocity(body): {x, y, z}
  checkCollision(bodyA, bodyB): boolean
  
  // Utility
  reset(): void
}
```

### 3. RL Environment

**Responsibilities:**
- Implement standard RL environment interface (reset, step)
- Manage episode lifecycle
- Calculate state representation
- Compute rewards based on agent behavior
- Coordinate between physics and agent

**Interface:**

```javascript
class ClimbingEnvironment {
  constructor(physicsEngine, renderingEngine, config)
  
  // Standard RL interface
  reset(): Float32Array  // Returns initial state (9D)
  step(action): {
    state: Float32Array,    // Next state (9D)
    reward: number,         // Reward for this step
    done: boolean,          // Episode termination flag
    info: object           // Additional debug info
  }
  
  // State space
  getState(): Float32Array  // [x, y, z, vx, vy, vz, distGoal, distLedge, progress]
  
  // Action space
  getActionSpace(): number  // Returns 6 (discrete actions)
  
  // Reward calculation
  calculateReward(prevState, action, newState): number
  
  // Episode management
  isTerminal(): boolean
  getEpisodeStats(): {steps, totalReward, success}
  
  // Configuration
  setMaxSteps(steps): void
  setRewardWeights(weights): void
}
```

### 4. Neural Network Models

**Responsibilities:**
- Define network architectures for PPO or DQN
- Handle forward passes for action selection
- Compute loss functions
- Perform gradient descent updates
- Save and load model weights

**PPO Actor-Critic Interface:**

```javascript
class PPOAgent {
  constructor(stateSize, actionSize, config)
  
  // Networks
  buildActorNetwork(): tf.LayersModel
  buildCriticNetwork(): tf.LayersModel
  
  // Action selection
  selectAction(state, training=true): {
    action: number,
    logProb: number,
    value: number
  }
  
  // Training
  train(trajectories): {
    actorLoss: number,
    criticLoss: number,
    entropy: number
  }
  
  // GAE computation
  computeAdvantages(rewards, values, dones): Float32Array
  
  // Model persistence
  async saveModel(path): void
  async loadModel(path): void
  
  // Hyperparameters
  setLearningRate(lr): void
  setClipEpsilon(epsilon): void
}
```

**DQN Interface:**

```javascript
class DQNAgent {
  constructor(stateSize, actionSize, config)
  
  // Networks
  buildQNetwork(): tf.LayersModel
  buildTargetNetwork(): tf.LayersModel
  
  // Action selection
  selectAction(state, epsilon): number
  
  // Experience replay
  remember(state, action, reward, nextState, done): void
  replay(batchSize): {loss: number, qValues: number[]}
  
  // Target network update
  updateTargetNetwork(): void
  
  // Model persistence
  async saveModel(path): void
  async loadModel(path): void
  
  // Hyperparameters
  setEpsilon(epsilon): void
  setLearningRate(lr): void
}
```

### 5. Training Orchestrator

**Responsibilities:**
- Manage high-level training loop
- Coordinate between environment and agent
- Collect and aggregate statistics
- Handle start/stop/pause controls
- Trigger UI updates

**Interface:**

```javascript
class TrainingOrchestrator {
  constructor(environment, agent, config)
  
  // Training control
  async startTraining(numEpisodes): void
  pauseTraining(): void
  resumeTraining(): void
  stopTraining(): void
  
  // Episode execution
  async runEpisode(): {
    episodeReward: number,
    episodeSteps: number,
    success: boolean
  }
  
  // Statistics
  getTrainingStats(): {
    currentEpisode: number,
    avgReward: number,
    successRate: number,
    rewardHistory: number[],
    successHistory: boolean[]
  }
  
  // Callbacks
  onEpisodeComplete(callback): void
  onTrainingComplete(callback): void
  
  // Configuration
  setRenderInterval(interval): void  // Render every N steps
  setStatsUpdateInterval(interval): void
}
```

### 6. UI Controller

**Responsibilities:**
- Handle user interactions
- Update DOM elements with training statistics
- Manage Chart.js visualizations
- Control training orchestrator

**Interface:**

```javascript
class UIController {
  constructor(orchestrator)
  
  // Initialization
  init(): void
  setupEventListeners(): void
  
  // Control handlers
  onStartTraining(): void
  onStopTraining(): void
  onSaveModel(): void
  onLoadModel(): void
  
  // Stats updates
  updateStatsPanel(stats): void
  updateRewardChart(rewardHistory): void
  updateSuccessChart(successHistory): void
  
  // Visual feedback
  showTrainingStatus(status): void
  showNotification(message, type): void
}
```

## Data Models

### State Representation

```javascript
// 9-dimensional state vector
const state = new Float32Array([
  agentX,           // 0: Agent X position (normalized)
  agentY,           // 1: Agent Y position (normalized)
  agentZ,           // 2: Agent Z position (normalized)
  velocityX,        // 3: Agent X velocity (normalized)
  velocityY,        // 4: Agent Y velocity (normalized)
  velocityZ,        // 5: Agent Z velocity (normalized)
  distanceToGoal,   // 6: Euclidean distance to goal (normalized)
  distanceToLedge,  // 7: Distance to nearest ledge (normalized)
  episodeProgress   // 8: Current step / max steps
]);
```

### Action Space

```javascript
const ACTION_SPACE = {
  FORWARD: 0,   // Apply forward force
  BACKWARD: 1,  // Apply backward force
  LEFT: 2,      // Apply left force
  RIGHT: 3,     // Apply right force
  JUMP: 4,      // Apply upward impulse
  GRAB: 5       // Attempt to grab ledge (if close enough)
};
```

### Reward Structure

```javascript
const rewardConfig = {
  heightGain: 1.0,        // Per unit height gained
  goalReached: 100.0,     // Reaching the goal platform
  survival: 0.1,          // Per step survived
  fall: -50.0,            // Falling below threshold
  timePenalty: -0.01,     // Per step (encourages efficiency)
  ledgeGrab: 5.0,         // Successfully grabbing a ledge
  invalidAction: -1.0     // Attempting invalid action
};
```

### Training Configuration

```javascript
const trainingConfig = {
  // Episode settings
  maxEpisodes: 5000,
  maxStepsPerEpisode: 500,
  
  // PPO hyperparameters
  ppo: {
    learningRate: 0.0003,
    gamma: 0.99,
    lambda: 0.95,
    clipEpsilon: 0.2,
    entropyCoef: 0.01,
    valueCoef: 0.5,
    batchSize: 64,
    epochs: 10
  },
  
  // DQN hyperparameters
  dqn: {
    learningRate: 0.0003,
    gamma: 0.99,
    epsilonStart: 1.0,
    epsilonEnd: 0.01,
    epsilonDecay: 0.995,
    batchSize: 32,
    bufferSize: 10000,
    targetUpdateFreq: 100
  },
  
  // Rendering settings
  renderEveryNSteps: 1,
  statsUpdateInterval: 10  // episodes
};
```

### Environment Configuration

```javascript
const environmentConfig = {
  // World dimensions
  groundSize: {width: 20, depth: 20},
  wallHeight: 15,
  goalHeight: 14,
  
  // Ledge configuration
  ledges: [
    {position: {x: 0, y: 2, z: -5}, size: {x: 2, y: 0.2, z: 1}},
    {position: {x: 1, y: 4, z: -5}, size: {x: 2, y: 0.2, z: 1}},
    {position: {x: -1, y: 6, z: -5}, size: {x: 2, y: 0.2, z: 1}},
    {position: {x: 0, y: 8, z: -5}, size: {x: 2, y: 0.2, z: 1}},
    {position: {x: 1, y: 10, z: -5}, size: {x: 2, y: 0.2, z: 1}},
    {position: {x: 0, y: 12, z: -5}, size: {x: 2, y: 0.2, z: 1}}
  ],
  
  // Agent configuration
  agent: {
    startPosition: {x: 0, y: 1, z: 0},
    size: 0.5,
    mass: 1.0
  },
  
  // Physics settings
  physics: {
    gravity: -9.81,
    timeStep: 1/60,
    friction: 0.3,
    restitution: 0.1
  },
  
  // Action forces
  actionForces: {
    move: 5.0,      // Horizontal movement force
    jump: 8.0,      // Jump impulse
    grab: 2.0       // Grab assistance force
  }
};
```

## Error Handling

### Physics Errors

```javascript
// Handle physics instability
try {
  physicsEngine.step(deltaTime);
} catch (error) {
  console.error('Physics simulation error:', error);
  // Reset physics world to stable state
  physicsEngine.reset();
  environment.reset();
}
```

### Neural Network Errors

```javascript
// Handle tensor memory leaks
tf.tidy(() => {
  // All tensor operations here
  const action = agent.selectAction(state);
  return action;
});

// Handle model loading errors
try {
  await agent.loadModel('localstorage://climbing-model');
} catch (error) {
  console.warn('Could not load model:', error);
  // Continue with randomly initialized model
}
```

### Rendering Errors

```javascript
// Handle WebGL context loss
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  console.error('WebGL context lost');
  // Attempt to restore context
  setTimeout(() => {
    renderer.forceContextRestore();
  }, 1000);
});
```

### Training Errors

```javascript
// Handle NaN losses
if (isNaN(loss) || !isFinite(loss)) {
  console.error('Invalid loss detected:', loss);
  // Reduce learning rate
  agent.setLearningRate(agent.learningRate * 0.5);
  // Skip this update
  return;
}
```

## Testing Strategy

### Unit Tests

1. **Physics Engine Tests**
   - Test body creation and initialization
   - Verify collision detection accuracy
   - Test force and impulse application
   - Validate position and velocity queries

2. **RL Environment Tests**
   - Test state space dimensionality and normalization
   - Verify reward calculation logic
   - Test episode termination conditions
   - Validate reset functionality

3. **Neural Network Tests**
   - Test network architecture creation
   - Verify forward pass output shapes
   - Test gradient computation
   - Validate model save/load functionality

4. **Training Logic Tests**
   - Test experience buffer operations (DQN)
   - Verify advantage calculation (PPO)
   - Test epsilon decay (DQN)
   - Validate batch sampling

### Integration Tests

1. **Environment-Physics Integration**
   - Test that actions correctly affect physics
   - Verify state updates reflect physics changes
   - Test collision-based rewards

2. **Agent-Environment Integration**
   - Test full episode execution
   - Verify action selection affects environment
   - Test training loop convergence on simple task

3. **Rendering-Physics Sync**
   - Verify visual position matches physics position
   - Test camera following behavior
   - Validate frame rate under load

### End-to-End Tests

1. **Training Pipeline**
   - Run 100 episodes and verify statistics collection
   - Test model save and load during training
   - Verify UI updates correctly

2. **Performance Tests**
   - Measure FPS during training
   - Monitor memory usage over 1000 episodes
   - Test tensor disposal (no memory leaks)

3. **User Interaction Tests**
   - Test start/stop/pause controls
   - Verify model save/load from UI
   - Test chart updates

### Manual Testing Checklist

- [ ] Agent spawns at correct position
- [ ] Agent responds to actions visually
- [ ] Rewards display correctly in UI
- [ ] Charts update in real-time
- [ ] Training can be paused and resumed
- [ ] Model can be saved and loaded
- [ ] Success rate improves over episodes
- [ ] No visual glitches or stuttering
- [ ] Browser console shows no errors
- [ ] Works in Chrome, Firefox, Safari

## Performance Optimization

### Rendering Optimizations

1. **Reduce Draw Calls**
   - Merge static geometry (ground, walls) into single mesh
   - Use instanced rendering for repeated elements if needed

2. **Frustum Culling**
   - Let Three.js automatically cull objects outside camera view

3. **Level of Detail**
   - Use simpler geometry for distant objects (if scene grows)

4. **Texture Optimization**
   - Use solid colors instead of textures for minimalist aesthetic
   - Reduces memory and improves performance

### Physics Optimizations

1. **Fixed Time Step**
   - Use fixed time step (1/60s) for deterministic physics
   - Accumulate time and step multiple times if needed

2. **Simplified Collision Shapes**
   - Use boxes and spheres instead of complex meshes
   - Reduces collision detection overhead

3. **Spatial Partitioning**
   - Cannon-es handles this internally with broadphase
   - Use CANNON.SAPBroadphase for better performance

### Neural Network Optimizations

1. **GPU Acceleration**
   - Ensure TensorFlow.js uses WebGL backend
   - Verify with `tf.getBackend()`

2. **Batch Operations**
   - Process multiple experiences in single forward pass
   - Use batched tensor operations

3. **Memory Management**
   - Wrap tensor operations in `tf.tidy()`
   - Manually dispose large tensors when done
   - Monitor memory with `tf.memory()`

4. **Model Optimization**
   - Use smaller batch sizes if memory constrained
   - Consider quantization for inference (post-training)

### Training Loop Optimizations

1. **Asynchronous Rendering**
   - Use `requestAnimationFrame` for rendering
   - Don't block training loop on rendering

2. **Adaptive Rendering**
   - Render every N steps instead of every step
   - Increase N if FPS drops below threshold

3. **Web Workers** (Advanced)
   - Move training computation to Web Worker
   - Keep rendering on main thread
   - Communicate via postMessage

### Code-Level Optimizations

```javascript
// Reuse objects instead of creating new ones
const tempVector = new CANNON.Vec3();

function applyMovement(body, direction) {
  tempVector.set(direction.x, direction.y, direction.z);
  body.applyForce(tempVector);
}

// Use typed arrays for state
const state = new Float32Array(9);

// Batch tensor operations
tf.tidy(() => {
  const stateTensor = tf.tensor2d([state], [1, 9]);
  const action = model.predict(stateTensor);
  return action.dataSync()[0];
});
```

## Deployment Considerations

### Build Process

1. **Vite Build**
   - Run `npm run build` to create production bundle
   - Outputs to `dist/` directory
   - Minifies JavaScript and optimizes assets

2. **Asset Optimization**
   - Three.js and TensorFlow.js are large libraries
   - Use tree-shaking to remove unused code
   - Consider CDN for large dependencies

### Hosting

1. **Static Hosting**
   - Deploy to Netlify, Vercel, GitHub Pages, or similar
   - No server-side code required
   - Just serve static HTML/JS/CSS

2. **HTTPS Required**
   - Some browser features require HTTPS
   - Most static hosts provide free HTTPS

### Browser Compatibility

1. **Minimum Requirements**
   - WebGL 2.0 support
   - ES6+ JavaScript support
   - IndexedDB for model storage

2. **Tested Browsers**
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

3. **Fallbacks**
   - Detect WebGL support on load
   - Show error message if not supported
   - Provide link to compatible browser

### Performance Targets

- **Initial Load**: < 5 seconds on broadband
- **FPS During Training**: 30-60 FPS
- **Memory Usage**: < 500 MB
- **Training Speed**: 10-20 episodes/minute

## Future Enhancements

1. **Multiple Difficulty Levels**
   - Easy: Fewer, larger ledges
   - Hard: More ledges, smaller gaps, moving platforms

2. **Curriculum Learning**
   - Start with simple wall
   - Gradually increase difficulty as agent improves

3. **Multi-Agent Training**
   - Multiple agents training simultaneously
   - Compare different algorithms side-by-side

4. **Advanced Visualizations**
   - Heatmap of visited positions
   - Action probability distributions
   - Value function visualization

5. **Model Comparison**
   - Save multiple models
   - Compare performance metrics
   - A/B testing interface

6. **Export Training Data**
   - Download training statistics as CSV
   - Export trained model for analysis
   - Share models with others
