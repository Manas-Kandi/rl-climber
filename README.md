# 3D RL Climbing Game

A minimalist web-based 3D climbing game where an AI agent learns to climb obstacles using reinforcement learning.

## Features

- Real-time 3D visualization with Three.js
- Physics simulation with Cannon-es
- Reinforcement learning with TensorFlow.js (PPO and DQN algorithms)
- Live training statistics and charts
- Browser-based - no backend required

## Prerequisites

- Node.js (v16 or higher)
- Modern web browser with WebGL 2.0 support

## Installation

```bash
npm install
```

## Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will open automatically at `http://localhost:3000`

## Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
├── src/
│   ├── rendering/     # Three.js rendering engine
│   ├── physics/       # Cannon-es physics engine
│   ├── rl/            # RL environment and agents
│   ├── training/      # Training orchestration
│   ├── ui/            # UI controller and charts
│   └── main.js        # Application entry point
├── index.html         # HTML entry point
├── vite.config.js     # Vite configuration
└── package.json       # Project dependencies
```

## Usage

1. Click "Start Training" to begin the RL training loop
2. Watch the agent learn to climb in real-time
3. Monitor statistics and charts for training progress
4. Save trained models to browser storage
5. Load previously trained models to continue training

## Technologies

- **Three.js** - 3D rendering
- **Cannon-es** - Physics simulation
- **TensorFlow.js** - Machine learning
- **Chart.js** - Data visualization
- **Vite** - Build tool and dev server

## License

MIT
