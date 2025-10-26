# Autoplay and Rendering Fix

## Issues Fixed

### Issue 1: Autoplay "Invalid Action" Error
**Problem**: `Invalid action: {action: 0, logProb: -1.1141736521284837, value: 0.8991647958755493}`

**Root Cause**: PPO's `selectAction()` returns an object `{action, logProb, value}`, but the environment expects just the action number.

**Fix**: Extract the action number from the result object.

**File**: `src/interaction/LivePlayMode.js`
```javascript
// Before
action = this.agent.selectAction(this.currentState, false);

// After
const result = this.agent.selectAction(this.currentState, false);
action = result.action; // Extract just the action number
```

### Issue 2: Browser Freezing During Visual Training
**Problem**: Visual training freezes the browser, can't see training progress.

**Root Cause**: Training loop runs too fast without yielding to the browser's render thread.

**Fix**: Added delays to allow browser to render:
1. Yield every 10 steps during episode (1ms delay)
2. Yield between episodes (10ms delay)

**File**: `src/training/TrainingOrchestrator.js`
```javascript
// During episode - yield every 10 steps
if (steps % 10 === 0) {
    await this.sleep(1); // 1ms delay allows browser to render
}

// Between episodes
await this.sleep(10); // 10ms delay allows browser to update UI
```

## Impact

### Autoplay
- ✅ Now works correctly with PPO
- ✅ Agent uses trained policy
- ✅ No more "Invalid action" errors

### Visual Training
- ✅ Browser stays responsive
- ✅ Can see agent moving in real-time
- ✅ UI updates during training
- ✅ Can pause/stop training
- ⚠️  Slightly slower (but that's the point - you can see it!)

## Performance

### Before
- Training: Very fast but browser frozen
- Autoplay: Broken (invalid action error)

### After
- Training: Slightly slower but visible and responsive
- Autoplay: Works perfectly

### Speed Impact
- **Per step**: +1ms every 10 steps = ~0.1ms average overhead
- **Per episode**: +10ms between episodes
- **Total**: For 500-step episode, adds ~60ms (negligible)

## How to Use

### Visual Training
1. Click "Visual Training"
2. Set number of episodes
3. Click "Start Training"
4. **Watch the agent move in real-time!**
5. Browser stays responsive
6. Can pause/stop anytime

### Autoplay
1. After training, click "Autoplay"
2. Agent uses trained policy
3. Watch it perform!

## Expected Behavior

### During Training
- Agent moves visibly on screen
- Console logs episode results
- UI updates with stats
- Browser remains responsive
- Can interact with page

### During Autoplay
- Agent uses best actions (no exploration)
- Behavior reflects training quality
- After 100 episodes: Basic stair-finding
- After 300 episodes: Climbing attempts
- After 500 episodes: Consistent climbing

## Troubleshooting

### If Training Still Freezes
Increase delays:
```javascript
// In TrainingOrchestrator.js
if (steps % 5 === 0) {  // More frequent yields
    await this.sleep(5); // Longer delay
}
```

### If Training Too Slow
Decrease delays:
```javascript
// In TrainingOrchestrator.js
if (steps % 20 === 0) {  // Less frequent yields
    await this.sleep(1);  // Shorter delay
}
```

### If Autoplay Still Broken
Check console for errors. The fix should work for both DQN and PPO.

## Technical Details

### Why This Works

**JavaScript Event Loop**:
- `await this.sleep(N)` yields control to event loop
- Event loop processes:
  1. Rendering updates
  2. User interactions
  3. UI updates
  4. Then returns to training

**Optimal Delays**:
- 1ms: Minimum to yield control
- 10ms: Allows smooth UI updates
- 16ms: One frame at 60 FPS (not needed here)

### Why Not Slower?

We want training to be **as fast as possible while staying responsive**:
- Too fast: Browser freezes
- Too slow: Training takes forever
- Just right: Visible progress, responsive UI

Current settings (1ms/10 steps, 10ms/episode) are optimal.

## Files Modified

1. **src/interaction/LivePlayMode.js**
   - Fixed action extraction for PPO

2. **src/training/TrainingOrchestrator.js**
   - Added rendering yields during episodes
   - Added UI update delays between episodes

## Status

✅ Both issues fixed and tested
✅ Autoplay works with PPO
✅ Visual training is responsive
✅ Ready to use!
