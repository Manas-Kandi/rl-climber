# Quick Fix Guide - Staircase Learning

## What Was Fixed
The agent wasn't learning to climb stairs. Now it has:
- ✅ Reliable step detection (position-based)
- ✅ Strong reward signals for progress (+20, +40, +60...)
- ✅ Continuous gradient between steps
- ✅ Visual feedback in UI

## How to Test

### 1. Run the Test Script
Open browser console and run:
```javascript
testRewards(window.climbingGame)
```

**Expected output:**
- ✅ Start position: (0, 1, 3)
- ✅ Step detection working at all heights
- ✅ Rewards increase when climbing
- ✅ FORWARD action (0) moves toward stairs (negative Z)

### 2. Start Training
1. Click "Start Training" button
2. Watch the UI stats panel
3. Look for:
   - **Current Step**: Shows where agent is now
   - **Highest Step**: Shows best progress this episode
   - **Avg Reward**: Should increase over time

### 3. Monitor Console
Look for messages like:
```
🎯 NEW STEP 0! Reward: +20.0
🎯 NEW STEP 1! Reward: +40.0
🎯 NEW STEP 2! Reward: +60.0
```

## What to Expect

### First 10 Episodes
- Random exploration
- Occasionally reaching Step 0
- Rewards: 0-20 range
- Learning basic movement

### After 50 Episodes
- Consistently reaching Steps 0-2
- Rewards: 20-50 range
- Learning to chain movements

### After 200 Episodes
- Reaching Steps 3-5
- Rewards: 50-150 range
- Developing climbing strategy

### After 500 Episodes
- Reaching Steps 7-9
- Rewards: 150-300 range
- Approaching goal

## Troubleshooting

### Agent Not Moving
**Check:**
```javascript
const env = window.climbingGame.environment;
console.log('Start pos:', env.config.agent.startPosition);
console.log('Move force:', env.config.actionForces.move);
```
**Should be:**
- Start pos: `{x: 0, y: 1, z: 3}`
- Move force: `8.0`

### Agent Moving But Not Climbing
**Check step detection:**
```javascript
const env = window.climbingGame.environment;
const physics = window.climbingGame.physicsEngine;
const pos = physics.getBodyPosition(env.agentBody);
const step = env.detectCurrentStep();
console.log('Position:', pos, 'Step:', step);
```

### No Reward Increase
**Check reward calculation:**
```javascript
const env = window.climbingGame.environment;
console.log('Highest step:', env.highestStepReached);
console.log('Current step:', env.currentStepOn);
```

## Key Changes

### Reward Structure
| Event | Reward | Purpose |
|-------|--------|---------|
| Reach Step 0 | +20 | First step incentive |
| Reach Step 1 | +40 | Progressive reward |
| Reach Step 2 | +60 | Exponential growth |
| Reach Step N | +(N+1)×20 | Strong motivation |
| Height gain | +0.3/unit | Continuous gradient |
| Near next step | +0.5 | Guidance |
| On any step | +0.5/step | Encouragement |
| Off-center | -0.5 | Stay aligned |
| Time | -0.01/step | Efficiency |
| Fall | -50 | Strong penalty |

### Step Detection
- **Old**: Collision-based (unreliable)
- **New**: Position-based (reliable)
- Checks X, Y, Z coordinates
- Works even when not touching

### Movement Control
- **Old**: 15.0 force (too strong)
- **New**: 8.0 force (better control)
- Easier to stay on steps
- Less overshooting

## Files to Check

If something's not working, check these files:
1. `src/rl/ClimbingEnvironment.js` - Reward and detection logic
2. `src/training/TrainingOrchestrator.js` - Training loop
3. `src/ui/UIController.js` - UI updates
4. `index.html` - UI elements

## Quick Commands

```javascript
// Test rewards
testRewards(window.climbingGame)

// Check agent position
const env = window.climbingGame.environment;
const physics = window.climbingGame.physicsEngine;
physics.getBodyPosition(env.agentBody)

// Check current step
env.detectCurrentStep()

// Check highest step reached
env.highestStepReached

// Reset and test
env.reset()
```

## Success Indicators

✅ **Working correctly if:**
- Test script passes all checks
- Console shows "NEW STEP" messages
- UI shows step progress
- Rewards increase over episodes
- Highest step grows over time

❌ **Not working if:**
- Agent stays at (0, 1, 3) forever
- No "NEW STEP" messages
- Rewards stay near 0
- Highest step stays at -1

## Need Help?

1. Run `testRewards(window.climbingGame)` first
2. Check console for errors
3. Verify start position is (0, 1, 3)
4. Make sure staircase scene is loaded
5. Check that training is actually running

## Documentation

For more details, see:
- `STAIRCASE_LEARNING_FIX.md` - Complete fix explanation
- `REWARD_SYSTEM_FIX.md` - Reward structure details
- `CHANGES_SUMMARY.md` - All changes made
