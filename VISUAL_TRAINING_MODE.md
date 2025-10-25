# 🎬 Visual Training Mode

## What is Visual Training Mode?

Visual Training Mode allows you to watch the agent learn in real-time at autoplay speed. Instead of training as fast as possible (thousands of steps per second), the agent trains at a human-watchable pace (~60 FPS), so you can see exactly what it's doing and how it's learning.

---

## How to Use

### 1. Start Visual Training

Click the **"Visual Training"** button in the control panel.

The agent will:
- Train one episode at a time
- Show every step in real-time (autoplay speed)
- Display episode results after each episode
- Continue training until you stop it

### 2. Watch the Agent Learn

You'll see:
- **Agent movement** in real-time (red cube)
- **Episode counter** updating after each episode
- **Reward and success rate** updating live
- **Console logs** showing episode results

### 3. Stop Training

Click the **"Stop Training"** button to stop at any time.

The model will be auto-saved periodically.

---

## Visual Training vs Fast Training

| Feature | Fast Training | Visual Training |
|---------|--------------|-----------------|
| **Speed** | ~1000 steps/sec | ~60 steps/sec (autoplay) |
| **Visualization** | No | Yes, real-time |
| **Use Case** | Quick learning | Debugging, watching |
| **Episodes/hour** | ~7,200 | ~120 |
| **Console logs** | Every 100 episodes | Every episode |

---

## UI Elements

### Control Panel

```
Training
├─ Fast Training      (train as fast as possible)
├─ Visual Training    (train at autoplay speed) ← NEW!
└─ Stop Training      (stop current training)

Episodes Trained: 0   ← NEW! Total episodes counter
```

### Stats Panel

```
Statistics
├─ Episode: 0         (current episode in progress)
├─ Avg Reward: 0.00   (average over last 100)
├─ Success Rate: 0%   (success over last 100)
├─ Status: Ready      (training status)
├─ Current Step: -    (which step agent is on)
└─ Highest Step: -    (highest step reached)
```

---

## Console Output

### Visual Training Mode

```
🎬 Starting VISUAL training mode for 10000 episodes...
   Training at ~60 FPS (autoplay speed)

🏆 Episode 0: Reward=45.2, Steps=120, Highest Step=1
❌ Episode 1: Reward=-5.3, Steps=45, Highest Step=0
🏆 Episode 2: Reward=85.7, Steps=200, Highest Step=3
...
```

### Fast Training Mode

```
Starting training for 1000 episodes...

📊 Episode 0: Reward=45.20, Steps=120, Success=false
📊 Episode 100: Reward=85.70, Steps=200, Success=true
...
```

---

## Technical Details

### How It Works

**Visual Training Mode:**
1. Runs one episode at a time
2. Adds 16ms delay between each step (60 FPS)
3. Renders every frame
4. Logs every episode result
5. Continues until stopped

**Implementation:**
```javascript
// In TrainingOrchestrator.js
async runEpisodeDQNVisual() {
  while (!done && steps < maxSteps) {
    // Select action
    const action = this.agent.selectAction(state, epsilon);
    
    // Execute action
    const stepResult = this.environment.step(action);
    
    // Train agent
    this.agent.train(batchSize);
    
    // VISUAL MODE: Add delay for visualization
    await this.sleep(16); // 16ms = ~60 FPS
  }
}
```

### Adjusting Speed

You can adjust the visual training speed:

```javascript
// In browser console
window.climbingGame.orchestrator.setVisualTrainingSpeed(30); // 30 FPS (slower)
window.climbingGame.orchestrator.setVisualTrainingSpeed(60); // 60 FPS (default)
```

---

## Use Cases

### 1. Debugging Behavior
Watch the agent to see if it's:
- Getting stuck in corners
- Falling off stairs
- Learning to climb
- Exploring properly

### 2. Understanding Learning
See how the agent's behavior changes over time:
- Early episodes: Random exploration
- Mid episodes: Learning patterns
- Late episodes: Refined strategy

### 3. Demonstrating to Others
Show people how RL works in real-time:
- Easy to follow
- Clear cause and effect
- Engaging to watch

### 4. Testing Reward Changes
After modifying rewards, watch to see if:
- Agent explores more/less
- Agent takes more/less risks
- Agent learns faster/slower

---

## Performance Impact

### Visual Training Mode
- **CPU**: Moderate (rendering + training)
- **GPU**: Moderate (rendering every frame)
- **Memory**: Low (same as fast training)
- **Training Speed**: ~60 steps/sec

### Fast Training Mode
- **CPU**: High (training only)
- **GPU**: Low (minimal rendering)
- **Memory**: Low
- **Training Speed**: ~1000 steps/sec

**Recommendation:** Use visual training for the first 10-100 episodes to watch the agent learn, then switch to fast training for bulk learning.

---

## Tips

### 1. Start with Visual Training
Watch the first 10-20 episodes to see if:
- Agent is moving at all
- Rewards are working correctly
- Agent is exploring the environment
- Physics is behaving properly

### 2. Switch to Fast Training
Once you're confident the agent is learning correctly:
1. Stop visual training
2. Click "Fast Training"
3. Let it run for 1000+ episodes

### 3. Check Back Periodically
Use "Auto Play" button to watch the trained agent:
- See how much it's improved
- Identify remaining issues
- Decide if more training is needed

### 4. Use Console Logs
Visual training logs every episode:
```
🏆 = Success (reached goal)
❌ = Failure (fell or timeout)
```

Watch for:
- Increasing rewards over time
- Higher step numbers over time
- More 🏆 and fewer ❌

---

## Troubleshooting

### Agent Not Moving
**Problem:** Agent just stands still
**Solution:** 
- Check if training is actually running (console logs)
- Verify baseline penalty is working (should lose points for standing)
- Increase exploration (epsilon for DQN)

### Training Too Slow
**Problem:** Visual training is too slow to watch
**Solution:**
```javascript
// Speed up to 120 FPS (faster but still visible)
window.climbingGame.orchestrator.setVisualTrainingSpeed(120);
```

### Training Too Fast
**Problem:** Can't see what's happening
**Solution:**
```javascript
// Slow down to 30 FPS (easier to follow)
window.climbingGame.orchestrator.setVisualTrainingSpeed(30);
```

### Console Spam
**Problem:** Too many console logs
**Solution:** Visual training logs every episode by design. If it's too much, use fast training instead.

---

## Keyboard Shortcuts

While watching visual training:

- **C** - Toggle camera mode (fixed/follow)
- **H** - Hide/show charts
- **ESC** - Stop training (if implemented)

---

## Example Session

```
1. Open the game
2. Click "Visual Training"
3. Watch for 20 episodes
4. Observe:
   - Episode 0-5: Random movement, low rewards
   - Episode 6-10: Starting to approach stairs
   - Episode 11-15: Learning to climb first step
   - Episode 16-20: Attempting higher steps
5. Click "Stop Training"
6. Click "Fast Training" for 1000 episodes
7. Click "Auto Play" to see final result
```

---

## Future Enhancements

Potential additions:
- [ ] Speed slider in UI (1-120 FPS)
- [ ] Pause/resume during visual training
- [ ] Step-by-step mode (manual advance)
- [ ] Highlight current action being taken
- [ ] Show Q-values or policy probabilities
- [ ] Record video of training session

---

## Summary

**Visual Training Mode** lets you watch the agent learn in real-time at autoplay speed. It's perfect for:
- Understanding how the agent learns
- Debugging behavior issues
- Testing reward changes
- Demonstrating RL to others

**Key Features:**
- ✅ Real-time visualization (~60 FPS)
- ✅ Episode-by-episode logging
- ✅ Live stats updates
- ✅ Total episodes counter
- ✅ Can run indefinitely until stopped
- ✅ Auto-saves periodically

**Use it when:** You want to see what's happening
**Use fast training when:** You want results quickly

🎬 Happy watching!
