# Debug Timeline Visualizer

## 🔍 Debugging Steps

### 1. Open Browser Console
Press `F12` or right-click → Inspect → Console

### 2. Check if Timeline is Loaded
Paste this in console:
```javascript
window.climbingGame.timelineVisualizer
```

**Expected**: Should show the TimelineVisualizer object
**If null**: Timeline not initialized

### 3. Check Trajectories Loaded
```javascript
window.climbingGame.timelineVisualizer.trajectories.length
```

**Expected**: Should show 1789
**If 0**: Trajectories not loaded

### 4. Check Current Trajectory
```javascript
window.climbingGame.timelineVisualizer.currentTrajectory
```

**Expected**: Should show trajectory object after clicking episode
**If null**: Episode not loaded

### 5. Check Rendering Engine
```javascript
window.climbingGame.timelineVisualizer.renderingEngine
```

**Expected**: Should show RenderingEngine object
**If null**: Rendering engine not connected

### 6. Manual Test - Load Episode
```javascript
// Load episode 1
await window.climbingGame.timelineVisualizer.seekToEpisode(0);
console.log('Current trajectory:', window.climbingGame.timelineVisualizer.currentTrajectory);
```

### 7. Manual Test - Start Playback
```javascript
window.climbingGame.timelineVisualizer.startPlayback();
```

### 8. Check for Errors
Look for any red error messages in the console

---

## 🐛 Common Issues

### Issue: "Cannot read property 'trajectory' of null"
**Cause**: Trajectory not loaded
**Fix**: Check if trajectory files exist in training-data/trajectories/trajectories/

### Issue: "renderingEngine is null"
**Cause**: Rendering engine not passed to timeline
**Fix**: Check main.js initialization

### Issue: Play button does nothing
**Cause**: No trajectory loaded or playback already running
**Fix**: Click an episode first, then press play

### Issue: Agent doesn't move
**Cause**: Steps array is empty or positions are invalid
**Fix**: Check trajectory file format

---

## 📊 Expected Console Output

When clicking an episode:
```
🎬 Seeking to episode index 0
📥 Loading trajectory for episode 1
✅ Loaded trajectory: {episode: 1, trajectory: Array(92), ...}
Visualizing episode 1 with 92 steps
Agent positioned at start: (0.00, 1.00, 0.00)
```

When pressing play:
```
▶️ Starting playback with 92 steps at 1x speed
```

During playback (every frame):
```
(Agent position updates silently)
```

---

## 🔧 Manual Fix

If nothing works, try this in console:
```javascript
// 1. Get the timeline
const tl = window.climbingGame.timelineVisualizer;

// 2. Load a trajectory manually
const trajectory = await tl.trajectoryStorage.loadTrajectory(1);
console.log('Loaded:', trajectory);

// 3. Set it as current
tl.currentTrajectory = trajectory;
tl.currentStepIndex = 0;

// 4. Get steps
const steps = trajectory.trajectory || trajectory.steps || [];
console.log('Steps:', steps.length);

// 5. Move agent to first position
if (steps.length > 0) {
    const pos = steps[0].position;
    tl.renderingEngine.updateAgentPosition(pos);
    tl.renderingEngine.render();
    console.log('Agent at:', pos);
}

// 6. Try playback
tl.startPlayback();
```

---

## 📝 What to Report

Please share:
1. Output of step 1-5 above
2. Any error messages (red text)
3. What happens when you click play
4. Browser and version (Chrome/Firefox/Safari)

This will help identify the exact issue!
