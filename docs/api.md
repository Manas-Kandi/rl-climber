# 📖 API Documentation

This document provides detailed API documentation for all classes and methods in the 3D RL Climbing Game.

## 🎮 ClimbingGameApp

The main application class that coordinates all components.

### Constructor

```javascript
new ClimbingGameApp()
```

Creates a new instance of the climbing game application with default configuration.

### Methods

#### `async init()`

Initializes all components in the correct order.

**Returns:** `Promise<void>`

**Throws:** Error if initialization fails

```javascript
const app = new ClimbingGameApp();
await app.init();
```

#### `async switchAgent(agentType)`

Switches between DQN and PPO agents.

**Parameters:**
- `agentType` (string): Either 'DQN' or 'PPO'

**Returns:** `Promise<void>`

```javascript
await app.switchAgent('PPO');
```

#### `getPerformanceStats()`

Gets current performance statistics.

**Returns:** `Object`
- `fps` (number): Current frames per second
- `frameTime` (number): Average frame time in milliseconds
- `renderTime` (number): Average render time in milliseconds
- `physicsTime` (number): Average physics time in milliseconds
- `memory` (Object): Memory statistics from `getMemoryStats()`

#### `optimizeRenderingPerformance()`

Optimizes rendering performance based on current metrics.

**Returns:** `void`

#### `async tuneHyperparameters()`

Runs automated hyperparameter tuning experiments.

**Returns:** `Promise<Array>` - Array of tuning results

#### `dispose()`

Cleans up all resources and disposes of components.

**Returns:** `void`

---

## 🎨 RenderingEngine

Handles 3D rendering using Three.js.

### Constructor

```javascript
new RenderingEngine(canvasElement)
```

**Parameters:**
- `canvasElement` (HTMLCanvasElement): Canvas element for WebGL rendering

### Methods

#### `init()`

Initializes the Three.js scene, camera, renderer, and lighting.

**Returns:** `void`

#### `createGround(width, depth)`

Creates the ground plane mesh.

**Parameters:**
- `width` (number): Ground width (default: 20)
- `depth` (number): Ground depth (default: 20)

**Returns:** `THREE.Mesh` - The ground mesh

#### `createClimbingWall(ledgePositions)`

Creates the climbing wall with ledges.

**Parameters:**
- `ledgePositions` (Array): Array of ledge configuration objects

**Returns:** `THREE.Group` - Wall group containing all ledges

#### `createAgent(position, size)`

Creates the agent mesh (green cube).

**Parameters:**
- `position` (Object): Initial position `{x, y, z}` (default: `{x: 0, y: 1, z: 0}`)
- `size` (number): Agent size (default: 0.5)

**Returns:** `THREE.Mesh` - The agent mesh

#### `createGoal(position)`

Creates the goal platform mesh.

**Parameters:**
- `position` (Object): Goal position `{x, y, z}` (default: `{x: 0, y: 14, z: -4}`)

**Returns:** `THREE.Mesh` - The goal mesh

#### `updateAgentPosition(position)`

Updates the agent's visual position.

**Parameters:**
- `position` (Object): New position `{x, y, z}`

**Returns:** `void`

#### `updateCamera(agentPosition)`

Updates camera to follow the agent.

**Parameters:**
- `agentPosition` (Object): Agent position `{x, y, z}`

**Returns:** `void`

#### `render()`

Renders the current frame.

**Returns:** `void`

#### `getRenderingMetrics()`

Gets rendering performance metrics.

**Returns:** `Object`
- `geometries` (number): Number of geometries in memory
- `textures` (number): Number of textures in memory
- `drawCalls` (number): Number of draw calls per frame
- `triangles` (number): Number of triangles rendered

#### `dispose()`

Cleans up rendering resources.

**Returns:** `void`

---

## ⚡ PhysicsEngine

Handles physics simulation using Cannon-es.

### Constructor

```javascript
new PhysicsEngine(gravity)
```

**Parameters:**
- `gravity` (number): Gravity value (default: -9.81)

### Methods

#### `init()`

Initializes the physics world with gravity and solver configuration.

**Returns:** `void`

#### `step(deltaTime)`

Steps the physics simulation forward.

**Parameters:**
- `deltaTime` (number): Time elapsed since last step (optional, uses fixed timestep)

**Returns:** `void`

#### `createGroundBody(width, depth, position)`

Creates a static ground body.

**Parameters:**
- `width` (number): Ground width
- `depth` (number): Ground depth  
- `position` (Object): Position `{x, y, z}`

**Returns:** `CANNON.Body` - The ground body

#### `createAgentBody(position, mass, size, shape)`

Creates a dynamic agent body.

**Parameters:**
- `position` (Object): Starting position `{x, y, z}`
- `mass` (number): Agent mass
- `size` (number): Agent size
- `shape` (string): Shape type ('box' or 'sphere')

**Returns:** `CANNON.Body` - The agent body

#### `createLedgeBody(position, size, id)`

Creates a static ledge body.

**Parameters:**
- `position` (Object): Ledge position `{x, y, z}`
- `size` (Object): Ledge size `{x, y, z}`
- `id` (string): Optional identifier

**Returns:** `CANNON.Body` - The ledge body

#### `applyForce(body, force, worldPoint)`

Applies a continuous force to a body.

**Parameters:**
- `body` (CANNON.Body): The body to apply force to
- `force` (Object): Force vector `{x, y, z}`
- `worldPoint` (Object): Optional world point to apply force at

**Returns:** `void`

#### `applyImpulse(body, impulse, worldPoint)`

Applies an instant impulse to a body.

**Parameters:**
- `body` (CANNON.Body): The body to apply impulse to
- `impulse` (Object): Impulse vector `{x, y, z}`
- `worldPoint` (Object): Optional world point to apply impulse at

**Returns:** `void`

#### `getBodyPosition(body)`

Gets the position of a body.

**Parameters:**
- `body` (CANNON.Body): The body to query

**Returns:** `Object` - Position as `{x, y, z}`

#### `getBodyVelocity(body)`

Gets the velocity of a body.

**Parameters:**
- `body` (CANNON.Body): The body to query

**Returns:** `Object` - Velocity as `{x, y, z}`

#### `checkCollision(bodyA, bodyB)`

Checks if two bodies are colliding.

**Parameters:**
- `bodyA` (CANNON.Body): First body
- `bodyB` (CANNON.Body): Second body

**Returns:** `boolean` - True if bodies are colliding

#### `getCollidingBodies(body)`

Gets all bodies currently colliding with the specified body.

**Parameters:**
- `body` (CANNON.Body): The body to check collisions for

**Returns:** `Array<CANNON.Body>` - Array of colliding bodies

#### `reset()`

Resets the physics world by clearing all bodies.

**Returns:** `void`

---

## 🏔️ ClimbingEnvironment

Implements the reinforcement learning environment interface.

### Constructor

```javascript
new ClimbingEnvironment(physicsEngine, renderingEngine, config)
```

**Parameters:**
- `physicsEngine` (PhysicsEngine): The physics engine instance
- `renderingEngine` (RenderingEngine): The rendering engine instance
- `config` (Object): Environment configuration

### Methods

#### `reset()`

Resets the environment to initial state.

**Returns:** `Float32Array` - Initial state (9D vector)

#### `step(action)`

Executes one environment step.

**Parameters:**
- `action` (number): Action to take (0-5)

**Returns:** `Object`
- `state` (Float32Array): Next state (9D vector)
- `reward` (number): Reward for this step
- `done` (boolean): Episode termination flag
- `info` (Object): Additional debug information

#### `getState()`

Gets the current normalized state.

**Returns:** `Float32Array` - Current state (9D vector)
- `[0-2]`: Agent position (x, y, z) normalized
- `[3-5]`: Agent velocity (vx, vy, vz) normalized
- `[6]`: Distance to goal normalized
- `[7]`: Distance to nearest ledge normalized
- `[8]`: Episode progress (currentStep / maxSteps)

#### `calculateReward(prevState, action, newState)`

Calculates reward for the current step.

**Parameters:**
- `prevState` (Float32Array): Previous state
- `action` (number): Action taken
- `newState` (Float32Array): New state

**Returns:** `number` - Total reward

#### `isTerminal()`

Checks if the episode should end.

**Returns:** `boolean` - True if episode should end

#### `getActionSpace()`

Gets the action space size.

**Returns:** `number` - Number of discrete actions (6)

#### `getStateSpace()`

Gets the state space size.

**Returns:** `number` - State vector dimensionality (9)

#### `setMaxSteps(steps)`

Sets the maximum steps per episode.

**Parameters:**
- `steps` (number): Maximum steps

**Returns:** `void`

#### `setRewardWeights(weights)`

Sets custom reward weights.

**Parameters:**
- `weights` (Object): Reward weight configuration

**Returns:** `void`

---

## 🤖 DQNAgent

Deep Q-Network agent implementation.

### Constructor

```javascript
new DQNAgent(stateSize, actionSize, config)
```

**Parameters:**
- `stateSize` (number): Dimension of state space (default: 9)
- `actionSize` (number): Number of discrete actions (default: 6)
- `config` (Object): Configuration object

### Methods

#### `selectAction(state, epsilon)`

Selects action using epsilon-greedy policy.

**Parameters:**
- `state` (Float32Array): Current state
- `epsilon` (number): Exploration rate (optional)

**Returns:** `number` - Selected action index [0-5]

#### `remember(state, action, reward, nextState, done)`

Stores experience in replay buffer.

**Parameters:**
- `state` (Float32Array): Current state
- `action` (number): Action taken
- `reward` (number): Reward received
- `nextState` (Float32Array): Next state
- `done` (boolean): Episode termination flag

**Returns:** `void`

#### `replay(batchSize)`

Trains the Q-network using experience replay.

**Parameters:**
- `batchSize` (number): Size of batch to sample (optional)

**Returns:** `Object`
- `loss` (number): Training loss value
- `batchSize` (number): Actual batch size used
- `epsilon` (number): Current epsilon value

#### `updateTargetNetwork()`

Updates target network by copying weights from main Q-network.

**Returns:** `void`

#### `getQValues(state)`

Gets Q-values for a given state.

**Parameters:**
- `state` (Float32Array): Current state

**Returns:** `Array<number>` - Q-values for all actions

#### `async saveModel(path)`

Saves the Q-network model.

**Parameters:**
- `path` (string): Path to save the model

**Returns:** `Promise<Object>` - Model metadata

#### `async loadModel(path)`

Loads a Q-network model.

**Parameters:**
- `path` (string): Path to load the model from

**Returns:** `Promise<Object>` - Model metadata

#### `dispose()`

Disposes of the agent and frees memory.

**Returns:** `void`

---

## 🧠 PPOAgent

Proximal Policy Optimization agent implementation.

### Constructor

```javascript
new PPOAgent(stateSize, actionSize, config)
```

**Parameters:**
- `stateSize` (number): Dimension of state space (default: 9)
- `actionSize` (number): Number of discrete actions (default: 6)
- `config` (Object): Configuration object

### Methods

#### `selectAction(state, training)`

Selects action using policy sampling or greedy selection.

**Parameters:**
- `state` (Float32Array): Current state
- `training` (boolean): Whether in training mode (default: true)

**Returns:** `Object`
- `action` (number): Selected action index
- `logProb` (number): Log probability of selected action
- `value` (number): State value estimate

#### `computeAdvantages(rewards, values, dones)`

Computes advantages using Generalized Advantage Estimation (GAE).

**Parameters:**
- `rewards` (Array): Array of rewards for the trajectory
- `values` (Array): Array of state values for the trajectory
- `dones` (Array): Array of done flags for the trajectory

**Returns:** `Float32Array` - Computed advantages

#### `train(trajectories)`

Trains the PPO agent using collected trajectories.

**Parameters:**
- `trajectories` (Object): Object containing trajectory data
  - `states` (Array): Array of states
  - `actions` (Array): Array of actions
  - `oldLogProbs` (Array): Array of old log probabilities
  - `advantages` (Array): Array of advantages
  - `returns` (Array): Array of returns

**Returns:** `Object`
- `actorLoss` (number): Actor network loss
- `criticLoss` (number): Critic network loss
- `entropy` (number): Policy entropy

#### `async saveModel(path)`

Saves both actor and critic models.

**Parameters:**
- `path` (string): Base path for saving models

**Returns:** `Promise<void>`

#### `async loadModel(path)`

Loads both actor and critic models.

**Parameters:**
- `path` (string): Base path for loading models

**Returns:** `Promise<void>`

#### `dispose()`

Disposes of the agent and frees memory.

**Returns:** `void`

---

## 🎯 TrainingOrchestrator

Manages the high-level training loop and statistics collection.

### Constructor

```javascript
new TrainingOrchestrator(environment, agent, config)
```

**Parameters:**
- `environment` (ClimbingEnvironment): The RL environment
- `agent` (DQNAgent|PPOAgent): The RL agent
- `config` (Object): Training configuration

### Methods

#### `async startTraining(numEpisodes)`

Starts the main training loop.

**Parameters:**
- `numEpisodes` (number): Number of episodes to train for (optional)

**Returns:** `Promise<void>`

#### `pauseTraining()`

Pauses the training loop.

**Returns:** `void`

#### `resumeTraining()`

Resumes the training loop.

**Returns:** `void`

#### `stopTraining()`

Stops the training loop.

**Returns:** `void`

#### `getTrainingStats()`

Gets current training statistics.

**Returns:** `Object`
- `currentEpisode` (number): Current episode number
- `totalEpisodes` (number): Total episodes completed
- `isTraining` (boolean): Whether currently training
- `isPaused` (boolean): Whether training is paused
- `avgReward` (number): Average reward over recent episodes
- `successRate` (number): Success rate over recent episodes
- `rewardHistory` (Array): Complete reward history
- `successHistory` (Array): Complete success history

#### `onEpisodeComplete(callback)`

Registers a callback for episode completion events.

**Parameters:**
- `callback` (Function): Callback function `(stats, result) => {}`

**Returns:** `void`

#### `onTrainingComplete(callback)`

Registers a callback for training completion events.

**Parameters:**
- `callback` (Function): Callback function `(stats) => {}`

**Returns:** `void`

#### `resetStats()`

Clears training history and resets statistics.

**Returns:** `void`

---

## 🖥️ UIController

Manages the user interface and handles user interactions.

### Constructor

```javascript
new UIController(orchestrator, agent)
```

**Parameters:**
- `orchestrator` (TrainingOrchestrator): Training orchestrator instance
- `agent` (DQNAgent|PPOAgent): RL agent instance

### Methods

#### `async init()`

Initializes the UI controller and sets up event listeners.

**Returns:** `Promise<void>`

#### `updateStatsPanel(stats)`

Updates the statistics panel with current training stats.

**Parameters:**
- `stats` (Object): Training statistics object

**Returns:** `void`

#### `showNotification(message, type)`

Shows a notification message to the user.

**Parameters:**
- `message` (string): Notification message
- `type` (string): Notification type ('success' or 'error')

**Returns:** `void`

#### `updateRewardChart(rewardHistory)`

Updates the reward chart with new data points.

**Parameters:**
- `rewardHistory` (Array): Array of episode rewards

**Returns:** `void`

#### `updateSuccessChart(successHistory)`

Updates the success rate chart with new data points.

**Parameters:**
- `successHistory` (Array): Array of success flags

**Returns:** `void`

#### `dispose()`

Cleans up UI resources.

**Returns:** `void`

---

## 🔧 Configuration Objects

### DQN Configuration

```javascript
const dqnConfig = {
    gamma: 0.99,           // Discount factor
    epsilon: 1.0,          // Initial exploration rate
    epsilonMin: 0.01,      // Minimum exploration rate
    epsilonDecay: 0.995,   // Exploration decay rate
    learningRate: 0.0003,  // Learning rate
    bufferSize: 10000,     // Experience replay buffer size
    batchSize: 32,         // Training batch size
    targetUpdateFreq: 100  // Target network update frequency
};
```

### PPO Configuration

```javascript
const ppoConfig = {
    gamma: 0.99,           // Discount factor
    lambda: 0.95,          // GAE lambda parameter
    clipEpsilon: 0.2,      // PPO clip parameter
    entropyCoef: 0.01,     // Entropy coefficient
    valueCoef: 0.5,        // Value function coefficient
    learningRate: 0.0003   // Learning rate
};
```

### Environment Configuration

```javascript
const environmentConfig = {
    maxSteps: 500,         // Maximum steps per episode
    goalHeight: 14,        // Height of the goal platform
    fallThreshold: -2,     // Fall detection threshold
    agent: {
        startPosition: { x: 0, y: 1, z: 0 },
        size: 0.5,
        mass: 1.0
    },
    ledgePositions: [      // Array of ledge configurations
        { position: { x: 0, y: 2, z: -5 }, size: { x: 2, y: 0.2, z: 1 } }
    ],
    rewardWeights: {
        heightGain: 1.0,
        goalReached: 100.0,
        survival: 0.1,
        fall: -50.0,
        timePenalty: -0.01,
        ledgeGrab: 5.0
    },
    actionForces: {
        move: 5.0,
        jump: 8.0,
        grab: 2.0
    }
};
```

### Training Configuration

```javascript
const trainingConfig = {
    numEpisodes: 1000,     // Number of episodes to train
    renderInterval: 1,     // Render every N steps
    statsUpdateInterval: 10 // Update stats every N episodes
};
```

---

## 🎯 Action Space

The environment supports 6 discrete actions:

| Action | Value | Description |
|--------|-------|-------------|
| FORWARD | 0 | Move forward (negative Z direction) |
| BACKWARD | 1 | Move backward (positive Z direction) |
| LEFT | 2 | Move left (negative X direction) |
| RIGHT | 3 | Move right (positive X direction) |
| JUMP | 4 | Apply upward impulse |
| GRAB | 5 | Attempt to grab nearby ledge |

## 📊 State Space

The environment provides a 9-dimensional state vector:

| Index | Component | Range | Description |
|-------|-----------|-------|-------------|
| 0 | Agent X | [-1, 1] | Normalized X position |
| 1 | Agent Y | [-1, 1] | Normalized Y position |
| 2 | Agent Z | [-1, 1] | Normalized Z position |
| 3 | Velocity X | [-1, 1] | Normalized X velocity |
| 4 | Velocity Y | [-1, 1] | Normalized Y velocity |
| 5 | Velocity Z | [-1, 1] | Normalized Z velocity |
| 6 | Distance to Goal | [0, 1] | Normalized distance to goal |
| 7 | Distance to Ledge | [0, 1] | Normalized distance to nearest ledge |
| 8 | Episode Progress | [0, 1] | Current step / max steps |

## 🏆 Reward Structure

The reward function combines multiple components:

- **Height Gain**: +1.0 per unit height gained
- **Goal Reached**: +100.0 for reaching the goal platform
- **Survival**: +0.1 per step survived
- **Fall Penalty**: -50.0 for falling below threshold
- **Time Penalty**: -0.01 per step (encourages efficiency)
- **Ledge Grab**: +5.0 for successfully grabbing a ledge

Total reward per step = heightGain × 1.0 + survival × 0.1 + timePenalty × (-0.01) + [special bonuses/penalties]