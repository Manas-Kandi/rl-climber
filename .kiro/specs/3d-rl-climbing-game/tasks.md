# Implementation Plan

- [x] 1. Initialize project structure and dependencies
  - Create package.json with project metadata
  - Install core dependencies: three, cannon-es, @tensorflow/tfjs, chart.js
  - Install Vite as dev dependency
  - Configure Vite with vite.config.js
  - Create index.html entry point
  - Set up basic directory structure: src/, src/rendering/, src/physics/, src/rl/, src/training/, src/ui/
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. Implement basic rendering engine with Three.js
  - [x] 2.1 Create RenderingEngine class with scene initialization
    - Write RenderingEngine constructor that accepts canvas element
    - Implement init() method to create Three.js scene, camera, and WebGL renderer
    - Add perspective camera at position (0, 5, 10) looking at origin
    - Add ambient and directional lighting to scene
    - Implement render() method for frame rendering
    - Implement resize() method for responsive canvas
    - _Requirements: 1.1, 1.2_
  
  - [x] 2.2 Implement environment geometry creation methods
    - Write createGround() method to generate dark gray plane mesh (#333333)
    - Write createClimbingWall() method to create wall with brown ledges (#8B4513)
    - Write createGoal() method to create goal platform at top
    - Write createAgent() method to create green box mesh (#00ff00)
    - Add all created meshes to scene
    - _Requirements: 1.4, 1.5, 1.6, 2.1_
  
  - [x] 2.3 Implement camera following and update logic
    - Write updateAgentPosition() method to sync agent mesh with physics position
    - Write updateCamera() method to smoothly follow agent
    - Implement camera lerp for smooth following behavior
    - Test camera tracking with manual position updates
    - _Requirements: 1.8, 6.6_

- [x] 3. Implement physics engine with Cannon-es
  - [x] 3.1 Create PhysicsEngine class with world initialization
    - Write PhysicsEngine constructor accepting gravity parameter
    - Implement init() method to create CANNON.World with gravity
    - Configure world solver and broadphase (SAPBroadphase)
    - Implement step() method for physics simulation with fixed timestep
    - Write reset() method to clear and reinitialize world
    - _Requirements: 1.3, 1.7_
  
  - [x] 3.2 Implement rigid body creation methods
    - Write createGroundBody() to create static ground plane
    - Write createWallBody() to create static wall collision
    - Write createLedgeBody() to create static ledge bodies
    - Write createAgentBody() to create dynamic agent body with mass
    - Configure friction and restitution properties for all bodies
    - Add all bodies to physics world
    - _Requirements: 1.7, 2.2_
  
  - [x] 3.3 Implement force application and query methods
    - Write applyForce() method to apply continuous forces to bodies
    - Write applyImpulse() method to apply instant impulses (for jumping)
    - Write getBodyPosition() to query body position as {x, y, z}
    - Write getBodyVelocity() to query body velocity
    - Write checkCollision() to detect collisions between bodies
    - Test force application with simple scenarios
    - _Requirements: 2.3_

- [x] 4. Implement RL environment interface
  - [x] 4.1 Create ClimbingEnvironment class with basic structure
    - Write ClimbingEnvironment constructor accepting physics, rendering engines, and config
    - Store references to physics engine, rendering engine, and agent body
    - Initialize episode tracking variables (step count, total reward)
    - Define action space constants (FORWARD=0, BACKWARD=1, LEFT=2, RIGHT=3, JUMP=4, GRAB=5)
    - Store environment configuration (max steps, reward weights, ledge positions)
    - _Requirements: 3.1, 2.3, 2.4_
  
  - [x] 4.2 Implement state space representation
    - Write getState() method to return 9D Float32Array
    - Extract agent position (x, y, z) from physics engine
    - Extract agent velocity (vx, vy, vz) from physics engine
    - Calculate distance to goal using Euclidean distance
    - Calculate distance to nearest ledge by iterating ledge positions
    - Calculate episode progress as currentStep / maxSteps
    - Normalize all state values to appropriate ranges
    - Write unit tests for state calculation
    - _Requirements: 2.4, 3.9_
  
  - [x] 4.3 Implement reset() method
    - Write reset() method to initialize new episode
    - Reset agent body position to start position (0, 1, 0)
    - Reset agent body velocity to zero
    - Reset episode step counter to 0
    - Reset total reward to 0
    - Return initial state as Float32Array
    - _Requirements: 3.1_
  
  - [x] 4.4 Implement reward calculation logic
    - Write calculateReward() method accepting previous state, action, new state
    - Calculate height gain reward: (newY - prevY) * heightGainWeight
    - Add survival reward: +0.1 per step
    - Add time penalty: -0.01 per step
    - Check if goal reached: add +100 if agent Y >= goalHeight
    - Check if fallen: add -50 if agent Y < fallThreshold
    - Check if ledge grabbed: add +5 if collision with ledge detected
    - Return total reward as number
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 4.5 Implement step() method
    - Write step(action) method to execute one environment step
    - Map action integer to force vector based on action constants
    - Apply force or impulse to agent body via physics engine
    - Step physics simulation forward by one timestep
    - Get new state after physics step
    - Calculate reward using calculateReward()
    - Check termination conditions (fallen, goal reached, max steps)
    - Increment step counter
    - Return {state, reward, done, info} object
    - _Requirements: 3.2, 3.8_

- [x] 5. Implement neural network models with TensorFlow.js
  - [x] 5.1 Create DQN agent class with Q-network architecture
    - Write DQNAgent constructor accepting state size (9), action size (6), config
    - Implement buildQNetwork() to create Q-network: Input(9) → Dense(64, ReLU) → Dense(64, ReLU) → Dense(6, Linear)
    - Implement buildTargetNetwork() with same architecture as Q-network
    - Initialize both networks with random weights
    - Create Adam optimizer with learning rate 0.0003
    - Store hyperparameters: gamma, epsilon, buffer size
    - _Requirements: 4.3, 4.4, 5.7, 5.8_
  
  - [x] 5.2 Implement DQN action selection and exploration
    - Write selectAction(state, epsilon) method for epsilon-greedy policy
    - Generate random number and compare with epsilon
    - If exploring: return random action from [0, 5]
    - If exploiting: run forward pass through Q-network and return argmax
    - Wrap tensor operations in tf.tidy() to prevent memory leaks
    - Write unit tests for action selection
    - _Requirements: 5.5_
  
  - [x] 5.3 Implement experience replay buffer for DQN
    - Create experience buffer as array with max capacity 10,000
    - Write remember(state, action, reward, nextState, done) to store experience
    - Implement circular buffer logic (overwrite oldest when full)
    - Write replay(batchSize) method to sample random batch
    - Sample batchSize experiences uniformly from buffer
    - Return batch as arrays of states, actions, rewards, nextStates, dones
    - _Requirements: 5.4_
  
  - [x] 5.4 Implement DQN training logic
    - Write train() method within replay() that performs gradient descent
    - Compute target Q-values: reward + gamma * max(targetNetwork(nextState)) for non-terminal states
    - Compute current Q-values: qNetwork(state)[action]
    - Calculate MSE loss between current and target Q-values
    - Perform gradient descent using optimizer.minimize()
    - Return loss value for monitoring
    - Wrap all tensor operations in tf.tidy()
    - _Requirements: 5.11_
  
  - [x] 5.5 Implement target network update for DQN
    - Write updateTargetNetwork() method to copy Q-network weights to target network
    - Use tf.tidy() to manage tensor memory
    - Iterate through Q-network layers and copy weights to target network layers
    - Call this method every N episodes (e.g., 100)
    - _Requirements: 5.6_
  
  - [x] 5.6 Implement model save and load for DQN
    - Write async saveModel(path) to save Q-network weights
    - Use tf.LayersModel.save() with 'localstorage://' or 'downloads://' scheme
    - Write async loadModel(path) to load Q-network weights
    - Copy loaded weights to target network after loading
    - Handle errors gracefully with try-catch
    - _Requirements: 4.6, 4.7_

- [x] 6. Implement PPO agent as alternative algorithm
  - [x] 6.1 Create PPO agent class with actor-critic architecture
    - Write PPOAgent constructor accepting state size (9), action size (6), config
    - Implement buildActorNetwork(): Input(9) → Dense(64, ReLU) → Dense(64, ReLU) → Dense(6, Softmax)
    - Implement buildCriticNetwork(): Input(9) → Dense(64, ReLU) → Dense(64, ReLU) → Dense(1, Linear)
    - Initialize both networks with random weights
    - Create separate Adam optimizers for actor and critic with learning rate 0.0003
    - Store hyperparameters: gamma, lambda, clipEpsilon, entropyCoef, valueCoef
    - _Requirements: 4.1, 4.2, 5.7, 5.8_
  
  - [x] 6.2 Implement PPO action selection with policy sampling
    - Write selectAction(state, training) method
    - Run forward pass through actor network to get action probabilities
    - Run forward pass through critic network to get state value
    - Sample action from categorical distribution if training=true
    - Take argmax action if training=false
    - Calculate log probability of selected action
    - Return {action, logProb, value}
    - Wrap tensor operations in tf.tidy()
    - _Requirements: 5.11_
  
  - [x] 6.3 Implement Generalized Advantage Estimation (GAE)
    - Write computeAdvantages(rewards, values, dones) method
    - Initialize advantages array with same length as rewards
    - Iterate backwards through trajectory
    - Calculate TD error: delta = reward + gamma * nextValue * (1 - done) - value
    - Calculate GAE: advantage = delta + gamma * lambda * nextAdvantage * (1 - done)
    - Return advantages as Float32Array
    - Normalize advantages (subtract mean, divide by std)
    - _Requirements: 5.1_
  
  - [x] 6.4 Implement PPO training logic with clipped objective
    - Write train(trajectories) method accepting batch of experiences
    - Extract states, actions, oldLogProbs, advantages, returns from trajectories
    - Perform K epochs of minibatch updates (K=10)
    - For each epoch: compute new action probabilities and values
    - Calculate probability ratio: ratio = exp(newLogProb - oldLogProb)
    - Calculate clipped surrogate: min(ratio * advantage, clip(ratio, 1-ε, 1+ε) * advantage)
    - Calculate actor loss: -mean(clipped surrogate) - entropyCoef * entropy
    - Calculate critic loss: MSE(value, return)
    - Perform gradient descent on both networks
    - Return {actorLoss, criticLoss, entropy}
    - _Requirements: 5.2, 5.3, 5.11_
  
  - [x] 6.5 Implement model save and load for PPO
    - Write async saveModel(path) to save both actor and critic networks
    - Save actor to path + '-actor' and critic to path + '-critic'
    - Write async loadModel(path) to load both networks
    - Handle errors gracefully with try-catch
    - _Requirements: 4.6, 4.7_

- [x] 7. Implement training orchestrator
  - [x] 7.1 Create TrainingOrchestrator class with episode management
    - Write TrainingOrchestrator constructor accepting environment, agent, config
    - Initialize training state variables: currentEpisode, isTraining, isPaused
    - Initialize statistics arrays: rewardHistory, successHistory
    - Store configuration: numEpisodes, renderInterval, statsUpdateInterval
    - Create callback arrays for episode and training completion events
    - _Requirements: 5.10_
  
  - [x] 7.2 Implement single episode execution for DQN
    - Write async runEpisodeDQN() method
    - Call environment.reset() to get initial state
    - Initialize episode variables: totalReward, steps, done
    - Loop until done or max steps reached
    - Select action using agent.selectAction(state, epsilon)
    - Execute action with environment.step(action)
    - Store experience in agent replay buffer
    - If buffer has enough samples, call agent.replay(batchSize)
    - Update state and accumulate reward
    - Render scene every N steps based on renderInterval
    - Return {episodeReward, episodeSteps, success}
    - _Requirements: 5.10_
  
  - [x] 7.3 Implement single episode execution for PPO
    - Write async runEpisodePPO() method
    - Call environment.reset() to get initial state
    - Initialize trajectory storage arrays: states, actions, rewards, logProbs, values, dones
    - Loop until done or max steps reached
    - Select action using agent.selectAction(state, training=true)
    - Execute action with environment.step(action)
    - Store (state, action, reward, logProb, value, done) in trajectory
    - Update state and accumulate reward
    - Render scene every N steps
    - After episode ends, compute advantages and returns
    - Call agent.train(trajectory) to update policy
    - Return {episodeReward, episodeSteps, success}
    - _Requirements: 5.10_
  
  - [x] 7.4 Implement main training loop
    - Write async startTraining(numEpisodes) method
    - Set isTraining flag to true
    - Loop for numEpisodes iterations
    - Check isPaused flag and wait if paused
    - Call runEpisode() (DQN or PPO based on agent type)
    - Store episode results in history arrays
    - Update epsilon (DQN) or other hyperparameters if needed
    - Call episode complete callbacks with statistics
    - Every N episodes, update target network (DQN) or log progress
    - After all episodes, set isTraining to false and call training complete callbacks
    - _Requirements: 5.10_
  
  - [x] 7.5 Implement training control methods
    - Write pauseTraining() to set isPaused flag
    - Write resumeTraining() to clear isPaused flag
    - Write stopTraining() to set isTraining to false
    - Write getTrainingStats() to return current statistics object
    - Write onEpisodeComplete(callback) to register episode callbacks
    - Write onTrainingComplete(callback) to register completion callbacks
    - _Requirements: 6.8, 6.9_

- [x] 8. Implement UI controller and visualization
  - [x] 8.1 Create HTML structure and CSS styling
    - Write index.html with full-screen canvas element
    - Create control panel div with start/stop/save/load buttons
    - Create stats panel div with episode, reward, success rate displays
    - Create chart containers for reward and success rate charts
    - Write CSS for minimalist dark theme (#1a1a1a background)
    - Style buttons, panels, and text with monospace fonts
    - Make layout responsive with flexbox or grid
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.10, 6.11_
  
  - [x] 8.2 Create UIController class with event handling
    - Write UIController constructor accepting training orchestrator
    - Implement init() to set up DOM references
    - Implement setupEventListeners() to attach click handlers to buttons
    - Write onStartTraining() handler to call orchestrator.startTraining()
    - Write onStopTraining() handler to call orchestrator.stopTraining()
    - Write onSaveModel() handler to call agent.saveModel()
    - Write onLoadModel() handler to call agent.loadModel()
    - Disable/enable buttons based on training state
    - _Requirements: 6.8, 6.9_
  
  - [x] 8.3 Implement statistics display updates
    - Write updateStatsPanel(stats) method
    - Update episode number display from stats.currentEpisode
    - Update current reward display from stats.avgReward
    - Update success rate display from stats.successRate
    - Format numbers with appropriate precision (2 decimal places)
    - Call this method from orchestrator episode callbacks
    - _Requirements: 6.4, 6.5, 6.6, 6.7_
  
  - [x] 8.4 Implement Chart.js visualizations
    - Initialize Chart.js line chart for reward history
    - Initialize Chart.js line chart for success rate trends
    - Write updateRewardChart(rewardHistory) to add new data points
    - Write updateSuccessChart(successHistory) to add new data points
    - Configure charts with dark theme colors
    - Limit chart data to last N episodes for performance
    - Update charts from orchestrator callbacks
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 8.5 Implement visual feedback and notifications
    - Write showTrainingStatus(status) to display training/paused/stopped state
    - Write showNotification(message, type) for success/error messages
    - Add visual indicator when episode completes successfully (green flash)
    - Add visual indicator when episode fails (red flash)
    - Implement notification auto-dismiss after 3 seconds
    - _Requirements: 7.7_

- [ ] 9. Integrate all components and create main application
  - [ ] 9.1 Create main application entry point
    - Write main.js to instantiate all components
    - Create RenderingEngine with canvas element
    - Create PhysicsEngine with gravity -9.81
    - Create ClimbingEnvironment with physics and rendering engines
    - Create agent (DQNAgent or PPOAgent) with configuration
    - Create TrainingOrchestrator with environment and agent
    - Create UIController with orchestrator
    - Initialize all components in correct order
    - _Requirements: 9.5_
  
  - [ ] 9.2 Implement rendering loop synchronization
    - Create animation loop using requestAnimationFrame
    - Call physicsEngine.step() with fixed timestep
    - Call renderingEngine.updateAgentPosition() with physics position
    - Call renderingEngine.updateCamera() with agent position
    - Call renderingEngine.render() to draw frame
    - Ensure loop runs at 60 FPS
    - _Requirements: 7.4, 7.5_
  
  - [ ] 9.3 Implement memory management and cleanup
    - Wrap all TensorFlow.js operations in tf.tidy()
    - Manually dispose large tensors after use
    - Add memory monitoring with tf.memory() logging
    - Implement dispose() methods for all components
    - Call dispose on window unload event
    - _Requirements: 8.5_
  
  - [ ] 9.4 Add error handling and WebGL detection
    - Check for WebGL support on page load
    - Display error message if WebGL not available
    - Add try-catch blocks around physics, rendering, and training code
    - Log errors to console with context
    - Implement graceful degradation where possible
    - Add WebGL context loss handler
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10. Write automated tests
  - [ ] 10.1 Write unit tests for physics engine
    - Test body creation methods return valid CANNON.Body objects
    - Test force application changes body velocity
    - Test position and velocity query methods return correct values
    - Test collision detection between overlapping bodies
    - Test reset() clears all bodies from world
    - _Requirements: 1.7, 2.2, 2.3_
  
  - [ ] 10.2 Write unit tests for RL environment
    - Test getState() returns Float32Array of length 9
    - Test state values are normalized to expected ranges
    - Test reset() returns valid initial state
    - Test step() returns object with correct keys
    - Test reward calculation for different scenarios (height gain, fall, goal)
    - Test episode termination conditions
    - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
  
  - [ ] 10.3 Write unit tests for neural networks
    - Test DQN network creation with correct input/output shapes
    - Test PPO actor network outputs probabilities that sum to 1
    - Test PPO critic network outputs single value
    - Test action selection returns valid action indices
    - Test model save and load preserves weights
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ] 10.4 Write integration tests
    - Test full episode execution completes without errors
    - Test training loop runs for 10 episodes successfully
    - Test agent actions affect environment state
    - Test rendering updates reflect physics changes
    - Test UI updates when training progresses
    - _Requirements: 5.10, 6.7, 7.4, 7.5_

- [ ] 11. Optimize performance and tune hyperparameters
  - [ ] 11.1 Profile and optimize rendering performance
    - Measure FPS during training with performance.now()
    - Merge static geometry to reduce draw calls
    - Implement adaptive rendering (skip frames if FPS drops)
    - Test performance with different render intervals
    - Ensure 30+ FPS maintained during training
    - _Requirements: 7.4, 8.1, 8.2_
  
  - [ ] 11.2 Optimize neural network performance
    - Verify TensorFlow.js uses WebGL backend with tf.getBackend()
    - Profile tensor memory usage with tf.memory()
    - Optimize batch sizes for GPU utilization
    - Test inference speed with different network sizes
    - Ensure no memory leaks over 1000 episodes
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ] 11.3 Tune hyperparameters for learning performance
    - Test different learning rates (0.0001, 0.0003, 0.001)
    - Test different network sizes (32, 64, 128 hidden units)
    - Test different reward weights for shaped rewards
    - Test different exploration strategies (epsilon decay rates)
    - Measure success rate after 1000 episodes for each configuration
    - Select best hyperparameters based on convergence speed and final performance
    - _Requirements: 5.7, 5.8, 5.9, 5.10_

- [ ] 12. Create documentation and examples
  - [ ] 12.1 Write README with setup instructions
    - Document project overview and features
    - List prerequisites (Node.js, modern browser)
    - Provide installation steps (npm install)
    - Provide run instructions (npm run dev)
    - Document build process (npm run build)
    - Add screenshots or GIFs of training
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 12.2 Add code comments and JSDoc
    - Add JSDoc comments to all public methods
    - Document parameter types and return values
    - Add inline comments for complex algorithms (GAE, PPO loss)
    - Document configuration options
    - _Requirements: All requirements_
  
  - [ ] 12.3 Create usage examples
    - Write example of loading pre-trained model
    - Write example of adjusting hyperparameters
    - Write example of modifying environment (adding ledges)
    - Document how to switch between DQN and PPO
    - _Requirements: 4.6, 4.7_
