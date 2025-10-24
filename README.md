# 🎮 3D RL Climbing Game

A minimalist web-based 3D climbing game where an AI agent learns to climb obstacles using reinforcement learning. Watch as the agent discovers climbing strategies through trial and error, all running entirely in your browser!

![Game Screenshot](docs/screenshot.png)
*The agent learning to climb in real-time*

## ✨ Features

- **🎬 Real-time 3D Visualization** - Watch the agent learn with Three.js WebGL rendering
- **⚡ Physics Simulation** - Realistic climbing physics with Cannon-es
- **🤖 Reinforcement Learning** - Choose between PPO and DQN algorithms (TensorFlow.js)
- **📊 Live Statistics** - Real-time training charts and performance metrics
- **💾 Model Persistence** - Save and load trained models in browser storage
- **🌐 Browser-based** - No backend required, runs entirely client-side
- **🎯 Performance Optimized** - Adaptive rendering and memory management
- **🧪 Hyperparameter Tuning** - Built-in tools for optimization

## 🎯 Quick Start

### Prerequisites

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **Modern web browser** with WebGL 2.0 support:
  - Chrome 90+ (recommended)
  - Firefox 88+
  - Safari 14+
  - Edge 90+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 3d-rl-climbing-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - The application will automatically open at `http://localhost:5173`
   - If it doesn't open automatically, navigate to the URL manually

### Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## 🎮 How to Use

### Basic Training

1. **Start Training** - Click the "Start Training" button to begin
2. **Watch & Learn** - Observe the agent (green cube) attempt to climb
3. **Monitor Progress** - Check the real-time statistics and charts
4. **Save Models** - Save successful models for later use

### Advanced Features

- **Switch Algorithms** - Toggle between DQN and PPO in the code
- **Adjust Hyperparameters** - Modify learning rates, network sizes, etc.
- **Performance Tuning** - Use built-in optimization tools
- **Custom Environments** - Add new ledges or modify the climbing wall

### Controls

| Button | Action |
|--------|--------|
| Start Training | Begin the RL training loop |
| Stop Training | Pause/stop the current training |
| Save Model | Save the current model to browser storage |
| Load Model | Load a previously saved model |

## 🏗️ Project Structure

```
3d-rl-climbing-game/
├── src/
│   ├── rendering/          # 🎨 Three.js rendering engine
│   │   ├── RenderingEngine.js
│   │   └── test-rendering.js
│   ├── physics/            # ⚡ Cannon-es physics simulation
│   │   ├── PhysicsEngine.js
│   │   └── test-physics.js
│   ├── rl/                 # 🤖 Reinforcement learning
│   │   ├── ClimbingEnvironment.js
│   │   ├── DQNAgent.js
│   │   ├── PPOAgent.js
│   │   └── test-*.js
│   ├── training/           # 🎯 Training orchestration
│   │   ├── TrainingOrchestrator.js
│   │   └── test-training-orchestrator.js
│   ├── ui/                 # 🖥️ User interface
│   │   ├── UIController.js
│   │   └── test-ui-controller.js
│   ├── test-integration.js # 🧪 Integration tests
│   └── main.js            # 🚀 Application entry point
├── index.html             # 📄 HTML entry point
├── vite.config.js         # ⚙️ Vite configuration
├── package.json           # 📦 Dependencies
└── README.md              # 📖 This file
```

## 🔧 Configuration

### Agent Configuration

The application supports both DQN and PPO agents with configurable hyperparameters:

```javascript
// DQN Configuration
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

// PPO Configuration
const ppoConfig = {
    gamma: 0.99,           // Discount factor
    lambda: 0.95,          // GAE lambda
    clipEpsilon: 0.2,      // PPO clip parameter
    entropyCoef: 0.01,     // Entropy coefficient
    valueCoef: 0.5,        // Value function coefficient
    learningRate: 0.0003   // Learning rate
};
```

### Environment Configuration

Customize the climbing environment:

```javascript
const environmentConfig = {
    maxSteps: 500,         // Maximum steps per episode
    goalHeight: 14,        // Height of the goal platform
    fallThreshold: -2,     // Fall detection threshold
    ledges: [              // Ledge positions and sizes
        { position: { x: 0, y: 2, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
        // Add more ledges...
    ]
};
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests (open browser console to see results)
npm run dev
# Then open browser console and run:
# - Physics tests: runPhysicsEngineTests()
# - RL tests: testStateCalculation(), testRewardCalculation()
# - Integration tests: runIntegrationTests()
```

## 🚀 Performance

### System Requirements

- **Minimum**: 4GB RAM, integrated graphics, modern browser
- **Recommended**: 8GB+ RAM, dedicated GPU, Chrome browser
- **Optimal**: 16GB+ RAM, modern GPU with WebGL 2.0 support

### Performance Features

- **Adaptive Rendering** - Automatically adjusts frame rate based on performance
- **Memory Management** - Automatic tensor cleanup and garbage collection
- **GPU Acceleration** - Uses WebGL backend for TensorFlow.js when available
- **Batch Optimization** - Automatically optimizes batch sizes for your hardware

## 🛠️ Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| [Three.js](https://threejs.org/) | 3D rendering and WebGL | ^0.160.0 |
| [Cannon-es](https://github.com/pmndrs/cannon-es) | Physics simulation | ^0.20.0 |
| [TensorFlow.js](https://www.tensorflow.org/js) | Machine learning | ^4.15.0 |
| [Chart.js](https://www.chartjs.org/) | Data visualization | ^4.4.1 |
| [Vite](https://vitejs.dev/) | Build tool and dev server | ^5.0.11 |

## 🐛 Troubleshooting

### Common Issues

**WebGL not supported**
- Ensure your browser supports WebGL 2.0
- Update your graphics drivers
- Try a different browser (Chrome recommended)

**Low performance/FPS**
- Enable hardware acceleration in browser settings
- Close other tabs and applications
- Reduce browser zoom level
- Enable adaptive rendering in the application

**Training not starting**
- Check browser console for error messages
- Ensure WebGL is working (visit [webglreport.com](https://webglreport.com))
- Try refreshing the page
- Clear browser cache and reload

**Memory issues**
- Monitor memory usage in browser dev tools
- Reduce training episode length
- Use smaller batch sizes
- Enable automatic memory cleanup

### Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 90+ | ✅ Fully supported | Recommended browser |
| Firefox 88+ | ✅ Fully supported | Good performance |
| Safari 14+ | ⚠️ Limited | Some WebGL limitations |
| Edge 90+ | ✅ Fully supported | Good performance |

### Getting Help

1. Check the browser console for error messages
2. Verify WebGL support at [webglreport.com](https://webglreport.com)
3. Try the application in an incognito/private window
4. Update your browser to the latest version

## 📚 Learning Resources

- [Reinforcement Learning Introduction](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html)
- [PPO Algorithm Explained](https://openai.com/blog/openai-baselines-ppo/)
- [DQN Algorithm Explained](https://www.nature.com/articles/nature14236)
- [Three.js Documentation](https://threejs.org/docs/)
- [TensorFlow.js Guide](https://www.tensorflow.org/js/guide)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the PPO algorithm
- DeepMind for the DQN algorithm
- Three.js community for excellent 3D web graphics
- TensorFlow.js team for bringing ML to the browser
