# Headless Training & Timeline Visualization Guide

## 🎯 Overview

Train your RL agent in the terminal (headless mode) for maximum speed, then visualize the training history in the browser with a timeline scrubber.

**Benefits**:
- ⚡ **Faster training** - No browser rendering overhead
- 📊 **Better logging** - Clean terminal output
- 💾 **Persistent history** - All trajectories saved to disk
- 🎬 **Replay any episode** - Scrub through timeline to see progress
- 🔄 **Train & visualize separately** - Train overnight, visualize later

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Train in Terminal
```bash
# Train with PPO for 1000 episodes
npm run train:ppo

# Train with DQN for 1000 episodes
npm run train:dqn

# Fast training without trajectory recording
npm run train:fast

# Custom training
node train.js --episodes 500 --agent PPO
```

### 3. Visualize in Browser
```bash
# Start the web UI
npm run dev

# Open browser to http://localhost:5173
# Click "Visualize History" button
# Scrub through timeline to see agent progress
```

---

## 📁 File Structure

```
project/
├── train.js                          # Terminal training script
├── training-data/                    # Training data storage
│   ├── models/                       # Saved models
│   │   ├── ppo-actor/
│   │   └── ppo-critic/
│   └── trajectories/                 # Episode trajectories
│       ├── metadata.json             # Trajectory index
│       └── trajectories/
│           ├── episode_1_*.json
│           ├── episode_2_*.json
│           └── ...
├── src/
│   ├── training/
│   │   ├── HeadlessTrainer.js       # Headless training engine
│   │   └── TrajectoryStorage.js     # Trajectory persistence
│   └── ui/
│       └── TimelineVisualizer.js    # Timeline UI component
```

---

## 🎮 Terminal Training

### Basic Usage

```bash
# Default: PPO, 1000 episodes, with trajectories
npm run train

# Specify agent type
node train.js --agent PPO
node train.js --agent DQN

# Specify number of episodes
node train.js --episodes 500

# Disable trajectory recording (faster)
node train.js --no-trajectories

# Custom paths
node train.js --model-path ./my-models --trajectory-path ./my-trajectories
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-e, --episodes <number>` | Number of episodes | 1000 |
| `-a, --agent <type>` | Agent type (PPO/DQN) | PPO |
| `--no-trajectories` | Disable trajectory recording | false |
| `--save-interval <number>` | Model save interval | 10 |
| `--log-interval <number>` | Log interval | 10 |
| `--model-path <path>` | Model storage path | ./training-data/models |
| `--trajectory-path <path>` | Trajectory storage path | ./training-data/trajectories |

### Training Output

```
🎮 3D RL Climbing Game - Headless Training
════════════════════════════════════════════════════════════
Configuration:
  Agent: PPO
  Episodes: 1000
  Record Trajectories: true
  Save Interval: 10 episodes
  Log Interval: 10 episodes
  Model Path: ./training-data/models
  Trajectory Path: ./training-data/trajectories
════════════════════════════════════════════════════════════

🚀 Initializing Headless Trainer...
✅ TensorFlow.js backend: tensorflow
✅ Physics engine initialized
✅ Environment initialized
✅ PPO agent initialized
✅ Training orchestrator initialized
✅ Model manager initialized
✅ Trajectory storage initialized
🎉 Headless trainer ready!

🎯 Starting training...
Episodes: 1000
Agent: PPO
Recording trajectories: true
────────────────────────────────────────────────────────────

📊 Episode 10/1000
   Reward: 12.45
   Steps: 234
   Success: ❌
   Avg Reward (100): 8.32
   Success Rate (100): 0.0%
   Time: 0.5m (20.0 ep/min)
   Memory: 87 tensors, 12.3 MB

...

════════════════════════════════════════════════════════════
🎉 TRAINING COMPLETE
════════════════════════════════════════════════════════════
Total Episodes: 1000
Total Time: 50.0 minutes
Average Reward: 45.67
Success Rate: 23.4%
Episodes/min: 20.0
Trajectories Saved: 1000
Storage Path: ./training-data/trajectories
Model Path: ./training-data/models
════════════════════════════════════════════════════════════
```

---

## 🎬 Timeline Visualization

### Opening the Timeline

1. Start the web UI: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Click **"Visualize History"** button
4. Timeline appears at bottom of screen

### Timeline UI

```
┌─────────────────────────────────────────────────────────┐
│ Episode: 234 | Reward: 45.2 | Steps: 156 | Status: ✅   │
├─────────────────────────────────────────────────────────┤
│ ▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁  │
│                        ▲ Scrubber                        │
├─────────────────────────────────────────────────────────┤
│ ▶ Play | Speed: [1x ▼] | 1000 episodes loaded | ✕ Close│
└─────────────────────────────────────────────────────────┘
```

### Timeline Features

**Episode Markers**:
- 🟢 **Green bars** - Successful episodes
- 🟡 **Yellow bars** - Positive reward (not successful)
- 🔴 **Red bars** - Failed episodes
- **Bar height** - Proportional to reward magnitude

**Scrubber**:
- **Click timeline** - Jump to episode
- **Drag scrubber** - Scrub through episodes
- **Arrow keys** - Navigate episodes (← →)

**Playback Controls**:
- **▶ Play** - Auto-play through episodes
- **⏸ Pause** - Pause playback
- **Speed** - 0.5x, 1x, 2x, 4x
- **Space bar** - Toggle play/pause

**Path Visualization**:
- Shows agent's path through 3D space
- Color-coded by action taken
- Updates in real-time during playback

---

## 📊 Trajectory Data Format

### Trajectory File Structure

```json
{
  "episode": 234,
  "totalReward": 45.23,
  "success": true,
  "savedAt": "2024-01-15T10:30:00.000Z",
  "filename": "episode_234_1705315800000.json",
  "steps": [
    {
      "step": 0,
      "position": { "x": 0, "y": 1, "z": 0 },
      "velocity": { "x": 0, "y": 0, "z": 0 },
      "action": 0,
      "actionName": "forward",
      "reward": 0.1,
      "done": false
    },
    {
      "step": 1,
      "position": { "x": 0.1, "y": 1, "z": 0 },
      "velocity": { "x": 0.5, "y": 0, "z": 0 },
      "action": 0,
      "actionName": "forward",
      "reward": 0.2,
      "done": false
    }
    // ... more steps
  ]
}
```

### Metadata File

```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "totalTrajectories": 1000,
  "trajectories": [
    {
      "episode": 1,
      "filename": "episode_1_1705315000000.json",
      "reward": 12.34,
      "steps": 234,
      "success": false,
      "savedAt": "2024-01-15T10:00:00.000Z"
    }
    // ... more episodes
  ]
}
```

---

## 🔧 Advanced Usage

### Custom Training Script

```javascript
import { HeadlessTrainer } from './src/training/HeadlessTrainer.js';

const trainer = new HeadlessTrainer({
    agentType: 'PPO',
    numEpisodes: 1000,
    recordTrajectories: true,
    saveInterval: 10,
    logInterval: 10
});

await trainer.init();
await trainer.train();
trainer.dispose();
```

### Loading Trajectories Programmatically

```javascript
import { TrajectoryStorage } from './src/training/TrajectoryStorage.js';

const storage = new TrajectoryStorage({
    storagePath: './training-data/trajectories'
});

await storage.init();

// Get all trajectories
const list = storage.getTrajectoryList();

// Load specific episode
const trajectory = await storage.loadTrajectory(234);

// Get statistics
const stats = storage.getStatistics();
console.log('Success rate:', stats.successRate);
console.log('Average reward:', stats.avgReward);
```

### Integrating Timeline in Custom UI

```javascript
import { TimelineVisualizer } from './src/ui/TimelineVisualizer.js';

const timeline = new TimelineVisualizer(
    renderingEngine,
    trajectoryStorage
);

await timeline.init();
timeline.show();

// Control programmatically
timeline.seekToEpisode(234);
timeline.startPlayback();
timeline.setSpeed(2.0);
```

---

## 💡 Tips & Best Practices

### Training

1. **Start with fewer episodes** - Test with 100 episodes first
2. **Use PPO for stability** - More reliable than DQN
3. **Monitor memory** - Watch for tensor leaks
4. **Save frequently** - Use `--save-interval 10`
5. **Train overnight** - Let it run for 1000+ episodes

### Visualization

1. **Load timeline after training** - Don't visualize during training
2. **Use playback speed** - 2x or 4x to see progress faster
3. **Look for patterns** - Watch how agent improves over time
4. **Compare episodes** - Jump between early and late episodes
5. **Check successful episodes** - See what strategies work

### Storage

1. **Trajectories take space** - ~1-5 KB per episode
2. **Limit to 10k episodes** - Automatic pruning enabled
3. **Disable for speed** - Use `--no-trajectories` for fast training
4. **Backup important runs** - Copy `training-data/` folder

---

## 🐛 Troubleshooting

### Training Issues

**Problem**: `Cannot find module '@tensorflow/tfjs-node'`
```bash
npm install @tensorflow/tfjs-node
```

**Problem**: Training is slow
- Use `--no-trajectories` flag
- Reduce `--episodes` count
- Check CPU/memory usage

**Problem**: Out of memory
- Reduce batch size in agent config
- Enable automatic cleanup
- Restart training periodically

### Visualization Issues

**Problem**: No trajectories loaded
- Check `./training-data/trajectories/` exists
- Verify `metadata.json` is present
- Run training first with trajectories enabled

**Problem**: Timeline not showing
- Click "Visualize History" button
- Check browser console for errors
- Verify trajectory files are valid JSON

**Problem**: Playback is choppy
- Reduce playback speed
- Close other browser tabs
- Check rendering performance

---

## 📈 Performance Comparison

| Mode | Speed | Visuals | Use Case |
|------|-------|---------|----------|
| **Headless Training** | 60+ ep/min | ❌ | Fast training, overnight runs |
| **Visual Training** | 35 ep/min | ✅ | Watch learning in real-time |
| **Timeline Playback** | Variable | ✅ | Review training history |

---

## 🎯 Workflow Example

### Complete Training & Visualization Workflow

```bash
# 1. Train overnight (headless)
node train.js --episodes 5000 --agent PPO

# 2. Next morning, start web UI
npm run dev

# 3. Open browser, click "Visualize History"

# 4. Scrub through timeline to see:
#    - Early episodes: Random exploration
#    - Middle episodes: Learning patterns
#    - Late episodes: Successful climbing

# 5. Identify best episodes
#    - Look for green bars (success)
#    - Check highest rewards
#    - Watch successful strategies

# 6. Continue training if needed
node train.js --episodes 1000 --agent PPO
# (Appends to existing trajectories)
```

---

## 🚀 Next Steps

1. **Run your first training session**:
   ```bash
   npm run train:ppo
   ```

2. **Visualize the results**:
   - Start web UI
   - Click "Visualize History"
   - Scrub through timeline

3. **Experiment with parameters**:
   - Try different agents (PPO vs DQN)
   - Adjust episode counts
   - Compare training runs

4. **Analyze learning progress**:
   - Watch early vs late episodes
   - Identify successful strategies
   - Understand failure modes

---

## 📚 Related Documentation

- `PERFORMANCE_STATUS.md` - Performance optimizations
- `MEMORY_LEAK_FIX.md` - Memory management
- `VISUAL_TRAINING_PERFORMANCE.md` - Visual training details
- `QUICK_START_GUIDE.md` - General getting started guide

---

## 🎉 Summary

You now have a complete system for:
- ✅ **Fast headless training** in terminal
- ✅ **Persistent trajectory storage** to disk
- ✅ **Timeline visualization** with scrubber
- ✅ **Playback controls** for reviewing episodes
- ✅ **Separate training & visualization** workflows

**Train fast, visualize later! 🚀**
