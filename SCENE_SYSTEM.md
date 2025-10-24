## 🎬 Scene System - Multi-Environment Training

## Overview

The game now supports **multiple training scenes**! Start with a simple staircase to learn basic climbing, then progress to more complex environments.

## Available Scenes

### 1. Staircase (Default) 🪜
**Perfect for learning basics!**

- **Description**: 10 simple steps leading upward
- **Goal Height**: 10 units
- **Difficulty**: ⭐ Easy
- **Best For**: First training, learning to climb
- **Rewards**:
  - Height gain: +3.0 (high!)
  - Each step: +10.0
  - Goal reached: +100.0
  - Fall: -10.0 (gentle)

**Why Start Here**:
- Simple, clear objective
- Easy to understand
- Quick feedback
- Builds confidence
- Learns "up = good"

### 2. Wall Climbing 🧗
**Original parkour challenge**

- **Description**: Vertical wall with scattered ledges
- **Goal Height**: 14 units
- **Difficulty**: ⭐⭐⭐ Hard
- **Best For**: Advanced training after mastering stairs
- **Rewards**:
  - Height gain: +2.0
  - Ledge grab: +8.0
  - Goal reached: +100.0
  - Fall: -20.0

## How to Use

### Switch Scenes

**UI Buttons**:
- Click "Staircase" button
- Click "Wall" button

**Console**:
```javascript
// Load staircase
const app = window.climbingGame;
const scene = app.sceneManager.loadScene('staircase');
app.sceneBuilder.buildScene(scene);

// Load wall
const scene = app.sceneManager.loadScene('wall');
app.sceneBuilder.buildScene(scene);
```

### Training Progression

**Recommended Path**:
1. **Start**: Staircase (500-1000 episodes)
2. **Progress**: Wall (1000+ episodes)
3. **Future**: More complex scenes

## Staircase Scene Details

### Layout
```
Goal (Green) ━━━━━━━━━━━━━━ Y: 10
Step 9       ━━━━━━━━━━━━━━ Y: 9
Step 8       ━━━━━━━━━━━━━━ Y: 8
Step 7       ━━━━━━━━━━━━━━ Y: 7
Step 6       ━━━━━━━━━━━━━━ Y: 6
Step 5       ━━━━━━━━━━━━━━ Y: 5
Step 4       ━━━━━━━━━━━━━━ Y: 4
Step 3       ━━━━━━━━━━━━━━ Y: 3
Step 2       ━━━━━━━━━━━━━━ Y: 2
Step 1       ━━━━━━━━━━━━━━ Y: 1
Ground       ━━━━━━━━━━━━━━ Y: 0
Agent Start  🟢
```

### Step Properties
- **Height**: 1 unit each
- **Width**: 4 units
- **Depth**: 2 units
- **Color**: Brown
- **Spacing**: Continuous (no gaps)

### Reward Structure
```javascript
// Climbing up
+3.0 per unit height gained
+10.0 for reaching each step
+100.0 for reaching goal

// Penalties
-10.0 for falling
-30.0 for going out of bounds
-0.001 per step (tiny time pressure)
```

## Expected Learning Curve

### Staircase Training

**Episodes 0-50**: Random exploration
- Reward: -10 to 0
- Behavior: Falling, hitting boundaries
- Learning: Stay on platform

**Episodes 50-200**: Discovery
- Reward: 0 to 30
- Behavior: Moving forward, touching steps
- Learning: Steps are good

**Episodes 200-500**: Climbing
- Reward: 30 to 70
- Behavior: Climbing multiple steps
- Learning: Sequential climbing

**Episodes 500-1000**: Mastery
- Reward: 70 to 100+
- Behavior: Reaching goal consistently
- Learning: Optimal path

### Wall Training (After Staircase)

**Episodes 0-100**: Transfer learning
- Reward: 0 to 20
- Behavior: Applying staircase knowledge
- Learning: Ledges work like steps

**Episodes 100-500**: Adaptation
- Reward: 20 to 50
- Behavior: Using ledges, jumping
- Learning: Complex navigation

**Episodes 500-1000+**: Expert
- Reward: 50 to 100+
- Behavior: Efficient climbing
- Learning: Optimal ledge sequence

## Scene System Architecture

### Components

1. **SceneManager**: Defines scenes
2. **SceneBuilder**: Constructs physics + visuals
3. **Environment**: Uses scene configuration

### Adding New Scenes

```javascript
// In SceneManager.js
createMyScene() {
    return {
        name: 'my_scene',
        description: 'My custom scene',
        goalHeight: 15.0,
        agentStart: { x: 0, y: 1, z: 0 },
        obstacles: [
            {
                type: 'step',
                position: { x: 0, y: 1, z: 0 },
                size: { x: 2, y: 1, z: 2 },
                color: 0x8B4513,
                id: 'obstacle_1'
            }
        ],
        rewardConfig: {
            heightGain: 2.0,
            goalReached: 100.0,
            // ... more rewards
        }
    };
}
```

## Future Scenes (Ideas)

### 3. Parkour Course 🏃
- Mix of jumps, gaps, and platforms
- Requires timing and precision
- Medium difficulty

### 4. Maze 🌀
- Horizontal navigation
- Find the exit
- Tests exploration

### 5. Moving Platforms 🎢
- Dynamic obstacles
- Timing-based
- Advanced difficulty

### 6. Multi-Path 🔀
- Multiple routes to goal
- Tests decision making
- Strategy learning

## Training Strategy

### Curriculum Learning

**Phase 1: Basics (Staircase)**
- Goal: Learn to climb
- Duration: 500-1000 episodes
- Success: 80%+ success rate

**Phase 2: Complexity (Wall)**
- Goal: Apply to harder environment
- Duration: 1000+ episodes
- Success: 50%+ success rate

**Phase 3: Generalization (Multiple Scenes)**
- Goal: Work in any scene
- Duration: Ongoing
- Success: Adapts quickly

### Transfer Learning

Train on staircase → Save model → Load in wall scene

The agent will:
- ✅ Understand "up = good"
- ✅ Know how to jump
- ✅ Avoid boundaries
- ✅ Learn faster in new scene

## Commands

### Scene Management
```javascript
// List available scenes
app.sceneManager.getAvailableScenes()

// Load scene
app.sceneManager.loadScene('staircase')

// Get current scene
app.sceneManager.getCurrentScene()

// Build scene
app.sceneBuilder.buildScene(scene)

// Clear scene
app.sceneBuilder.clearScene()
```

### Training Workflow
```javascript
// 1. Load staircase
app.sceneManager.loadScene('staircase')
app.sceneBuilder.buildScene(scene)

// 2. Reset model
await app.modelManager.reset()

// 3. Train
// Click "Start Training"

// 4. After success, switch to wall
app.sceneManager.loadScene('wall')
app.sceneBuilder.buildScene(scene)

// 5. Continue training (transfer learning)
```

## Benefits

### 1. Easier Learning
- Start simple, progress gradually
- Clear objectives
- Quick feedback

### 2. Better Understanding
- See what agent learns
- Debug more easily
- Faster iteration

### 3. Curriculum Learning
- Build on previous knowledge
- Transfer skills between scenes
- More robust agent

### 4. Flexibility
- Test different environments
- Compare performance
- Find optimal training

## Next Steps

1. **Start with staircase** (it's loaded by default!)
2. **Reset model**: `await window.climbingGame.modelManager.reset()`
3. **Train for 500 episodes**
4. **Watch agent learn to climb stairs**
5. **Once successful, try wall scene**

The staircase is much simpler and will help the agent learn the fundamental concept: **climbing up gets rewards!** 🎯
