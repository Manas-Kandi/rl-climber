# ⏱️ Episode Length Fix - More Time to Learn

## Problem
The agent wasn't getting enough time per episode to:
- Explore different strategies
- Learn from mistakes
- Discover what works and what doesn't
- Reach the stairs and attempt climbing

**Previous Settings:**
- Default: 500 steps per episode
- Curriculum levels: 200-500 steps
- Result: Episodes ended too quickly, limiting learning

## Why Longer Episodes Matter

### 1. **Exploration Time**
With only 500 steps:
- Agent spawns at (0, 1, 0)
- Stairs start at z=0
- If agent moves randomly, may not even reach stairs
- No time to try different climbing strategies

### 2. **Learning Opportunities**
Longer episodes allow:
- Multiple attempts at climbing
- Recovery from mistakes
- Trying different action sequences
- Building experience with consequences

### 3. **Reward Accumulation**
With our reward system:
- +20 per step climbed
- +15 for landing on stairs
- +10 for new records
- Need time to accumulate these rewards!

## Changes Made

### 1. Default Episode Length
**File:** `src/rl/ClimbingEnvironment.js`

```javascript
// Before
maxSteps: config.maxSteps || 500

// After
maxSteps: config.maxSteps || 5000  // 10x longer!
```

### 2. Curriculum Learning Levels
**File:** `src/rl/ClimbingEnvironment.js`

```javascript
// Before
Level 1: 200 steps
Level 2: 300 steps
Level 3: 400 steps
Level 4: 500 steps

// After
Level 1: 1000 steps  // 5x longer
Level 2: 2000 steps  // 6.7x longer
Level 3: 3000 steps  // 7.5x longer
Level 4: 5000 steps  // 10x longer
```

### 3. Main App Configuration
**File:** `src/main.js`

```javascript
environment: {
    maxSteps: 5000,  // Long episodes for thorough exploration
    // ...
}
```

### 4. Headless Training
**File:** `src/training/HeadlessTrainer.js`

```javascript
const envConfig = {
    maxSteps: 5000,  // Long episodes for thorough exploration
    // ...
}
```

### 5. Timeline Visualizer Warning
**File:** `src/ui/TimelineVisualizer.js`

Removed noisy warning for episodes with < 2 steps:
```javascript
// Before
if (steps.length < 2) {
    console.warn('Not enough steps to draw path');
    return;
}

// After
if (steps.length < 2) {
    // Silently skip - episode ended too quickly
    return;
}
```

## Impact Analysis

### Training Time
**Before (500 steps):**
- 1000 episodes = 500,000 steps
- At 60 FPS = ~138 minutes

**After (5000 steps):**
- 1000 episodes = 5,000,000 steps
- At 60 FPS = ~1,388 minutes (~23 hours)

**Solution:** Use headless training for speed!
```bash
node train.js  # Much faster without rendering
```

### Learning Quality
**Before:**
- Agent barely had time to explore
- Many episodes ended before reaching stairs
- Limited learning opportunities

**After:**
- Agent can thoroughly explore environment
- Multiple attempts at climbing per episode
- Better understanding of action consequences
- More reward accumulation opportunities

### Episode Outcomes

**Typical Episode Flow (5000 steps):**

1. **Steps 0-100:** Random exploration, finding stairs
2. **Steps 100-500:** Attempting to land on stairs
3. **Steps 500-1000:** Learning to stay on stairs
4. **Steps 1000-2000:** Attempting to climb
5. **Steps 2000-5000:** Refining climbing strategy

**Early Termination Still Possible:**
- Goal reached: Episode ends immediately (+100 reward!)
- Fell to death: Episode ends (-5 penalty)
- Out of bounds: Episode ends (-5 penalty)

So successful episodes will still be short, but struggling episodes get more time to learn.

## Expected Results

### Early Training (Episodes 1-1000)
- Longer episodes allow more exploration
- Agent discovers stairs more reliably
- More varied trajectories in visualization
- Better understanding of environment

### Mid Training (Episodes 1000-5000)
- Agent consistently reaches stairs
- Multiple climbing attempts per episode
- Learning optimal jump timing
- Accumulating higher rewards

### Late Training (Episodes 5000+)
- Efficient stair finding
- Consistent climbing progress
- Many episodes end early (goal reached!)
- High success rate

## Visualization Impact

### Before (500 steps)
- Many tiny lines (episodes too short)
- Limited path variation
- Hard to see learning progress

### After (5000 steps)
- Longer, more detailed paths
- Clear exploration patterns
- Visible learning progression
- Better understanding of agent behavior

## Performance Considerations

### Memory Usage
- Longer episodes = more trajectory data
- Each step ~100 bytes
- 5000 steps = ~500 KB per episode
- 10,000 episodes = ~5 GB total

**Mitigation:**
- Auto-prune to last 10,000 trajectories
- Compress old trajectories
- Store only successful episodes

### Training Speed
**Browser Training:**
- Slower due to rendering
- Use for debugging/visualization
- Recommended: 100-500 episodes

**Headless Training:**
- Much faster (no rendering)
- Use for bulk training
- Recommended: 1000-10,000 episodes

```bash
# Fast training
node train.js --episodes 5000
```

## Configuration Options

### Custom Episode Length
```javascript
// In your code
const env = new ClimbingEnvironment(physics, renderer, {
    maxSteps: 3000  // Custom length
});
```

### Dynamic Adjustment
```javascript
// Increase as training progresses
if (successRate > 0.5) {
    env.setMaxSteps(3000);  // Reduce for faster training
} else {
    env.setMaxSteps(5000);  // Keep long for learning
}
```

### Curriculum Learning
```javascript
// Start with easier, shorter episodes
env.enableCurriculumLearning(1);  // 1000 steps, reach step 0

// Progress to harder, longer episodes
env.enableCurriculumLearning(4);  // 5000 steps, reach step 10
```

## Monitoring Episode Length

### In Console
```javascript
// Check average episode length
showTrainingStats()

// Look for "Avg Steps" in output
```

### In Training Logs
```
Episode 100/1000
  Reward: 45.50
  Steps: 2341  // How long episode lasted
  Success: false
```

### In Visualization
- Longer lines = longer episodes
- Short lines = early termination (good or bad)
- Green lines = successful (goal reached)

## Recommendations

### For Learning
✅ **Use 5000 steps** - Gives agent plenty of time
✅ **Monitor episode length** - Should decrease as agent improves
✅ **Check success rate** - Should increase over time

### For Speed
✅ **Use headless training** - Much faster
✅ **Reduce steps if success rate > 50%** - Agent doesn't need as much time
✅ **Use curriculum learning** - Start with shorter episodes

### For Debugging
✅ **Use visual training** - See what agent is doing
✅ **Keep 5000 steps** - More time to observe behavior
✅ **Watch trajectory visualization** - Understand learning progress

## Summary

**Changed:**
- ✅ Default maxSteps: 500 → 5000 (10x increase)
- ✅ Curriculum levels: 200-500 → 1000-5000
- ✅ Main app config: 500 → 5000
- ✅ Headless trainer: 500 → 5000
- ✅ Removed noisy timeline warning

**Benefits:**
- 🎯 More exploration time
- 📈 Better learning opportunities
- 🏆 Higher reward accumulation
- 🎨 Better visualization
- 🧠 Deeper understanding of environment

**Trade-offs:**
- ⏱️ Longer training time (use headless!)
- 💾 More memory usage (auto-pruned)
- 📊 Larger trajectory files (manageable)

The agent now has **10x more time** to learn what works and what doesn't! 🚀
