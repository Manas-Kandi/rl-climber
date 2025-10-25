# Staircase Learning Fix

## Problem Summary
The agent was not learning to climb the stairs. It would stay in one place and not make progress. The training was ineffective.

## Root Causes

### 1. Unreliable Step Detection
- Used collision detection which was inconsistent
- Agent couldn't tell which step it was on
- Rewards weren't being triggered properly

### 2. Weak Reward Signals
- Step rewards were too small compared to other rewards
- No clear gradient to guide learning
- Conflicting reward components

### 3. Poor Reward Structure
- Height bonus and ground penalty were fighting each other
- No intermediate rewards between steps
- Agent couldn't learn the path to success

## Solutions Implemented

### 1. Position-Based Step Detection (`ClimbingEnvironment.js`)
```javascript
detectCurrentStep() {
  // Now uses agent's (x, y, z) position
  // Each step has known Z range and expected height
  // Much more reliable than collision detection
}
```

**Benefits:**
- Consistent detection every frame
- Works even when not perfectly touching step
- Easy to debug and verify

### 2. Redesigned Reward System

#### Primary Signal: Step Progress
- **Step 0**: +20 points
- **Step 1**: +40 points  
- **Step 2**: +60 points
- **Step N**: +(N+1) × 20 points

This creates massive incentive to climb higher.

#### Continuous Gradient: Height Reward
- **+0.3 per unit height**
- Provides smooth gradient between steps
- Helps agent learn climbing motion

#### Guidance: Proximity to Next Step
- **Up to +1.0 for being near next step**
- Inverse distance reward
- Points agent in right direction

#### Staying Power: On-Step Bonus
- **+0.5 per timestep on any step**
- Encourages staying on stairs
- Discourages falling off

### 3. Reduced Movement Force
Changed from 15.0 to 8.0 for better control on stairs.

### 4. Added Test Script
`src/test-rewards.js` - Run `testRewards(window.climbingGame)` to verify:
- Start position correct
- Step detection working
- Rewards increasing with progress
- Actions moving agent correctly

## Expected Training Behavior

### Early Episodes (1-50)
- Random exploration
- Occasionally reaching Step 0 or 1
- Rewards: 0-30 range
- Learning basic movement

### Mid Training (50-200)
- Consistently reaching Steps 0-3
- Starting to chain movements
- Rewards: 30-100 range
- Learning climbing strategy

### Late Training (200-500)
- Reaching Steps 5-9
- Efficient climbing
- Rewards: 100-300 range
- Optimizing path

### Mastery (500+)
- Consistently reaching goal
- Rewards: 300-500 range
- Fast, efficient climbing

## How to Verify Fix

### 1. Run Reward Test
```javascript
testRewards(window.climbingGame)
```

Check that:
- ✅ Start position is (0, 1, 3)
- ✅ Step detection works at all heights
- ✅ Rewards increase when climbing
- ✅ BACKWARD action moves toward stairs

### 2. Watch Training
Start training and observe:
- **Episode reward** should increase over time
- **Highest step reached** should grow
- **Agent position** should move up stairs
- **Console logs** show "NEW STEP X!" messages

### 3. Check Metrics
After 50 episodes:
- Average reward should be > 20
- Max reward should be > 50
- Highest step should be ≥ 2

After 200 episodes:
- Average reward should be > 50
- Max reward should be > 150
- Highest step should be ≥ 5

## Troubleshooting

### Agent Not Moving
- Check start position: should be (0, 1, 3)
- Check action forces: should be 8.0
- Run `testRewards()` to verify actions work

### Agent Moving But Not Climbing
- Check step detection: run `testRewards()`
- Verify rewards are being given for new steps
- Check console for "NEW STEP" messages

### Rewards Not Increasing
- Verify step detection is working
- Check that highest step is being tracked
- Look for reward calculation errors in console

### Agent Falling Off
- Reduce movement force if too high
- Check physics damping settings
- Verify boundary penalties are working

## Files Modified

1. **src/rl/ClimbingEnvironment.js**
   - `detectCurrentStep()` - Position-based detection
   - `calculateReward()` - New reward structure
   - `reset()` - Better initialization
   - `updateStartPosition()` - New method for scene switching

2. **src/main.js**
   - Reduced movement force to 8.0
   - Added test-rewards.js import

3. **src/test-rewards.js** (NEW)
   - Comprehensive reward system testing
   - Verifies all components working

4. **REWARD_SYSTEM_FIX.md** (NEW)
   - Detailed reward structure documentation

## Next Steps

1. **Run the test**: `testRewards(window.climbingGame)`
2. **Start training**: Click "Start Training"
3. **Monitor progress**: Watch episode rewards and highest step
4. **Adjust if needed**: Tweak reward weights if learning is too slow/fast

The agent should now learn to climb the stairs progressively, with clear feedback at each step!
