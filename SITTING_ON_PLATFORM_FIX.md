# Fix: Agent Sitting on Platform

## Problem
Agent jumps once on the starting platform and then just sits there, not moving toward the stairs.

## Root Cause
The agent was getting small positive rewards for staying on the platform:
- Height reward: y=1 * 0.3 = +0.3
- Time penalty: -0.01
- Net: +0.29 per step

This is positive, so the agent learned that "sitting still = good". There was **no incentive to move forward** toward the stairs.

## Solution Applied

### 1. Added Forward Progress Reward
Added a strong continuous reward for moving toward the stairs:

```javascript
// === FORWARD PROGRESS REWARD ===
if (agentPos.z < 3 && agentPos.z > -20) {
  // Reward increases as agent moves forward (toward negative Z)
  // At z=3 (start): 0 reward
  // At z=0 (Step 0): 1.5 reward
  // At z=-18 (Step 9): 10.5 reward
  const forwardProgress = (3 - agentPos.z) * 0.5;
  totalReward += forwardProgress;
}
```

Now the reward structure is:
- **At z=3 (starting platform)**: 0.3 (height) + 0 (progress) - 0.01 (time) = **0.29**
- **At z=2 (moving forward)**: 0.3 + 0.5 - 0.01 = **0.79**
- **At z=1 (closer to stairs)**: 0.3 + 1.0 - 0.01 = **1.29**
- **At z=0 (Step 0)**: 0.3 + 1.5 + 20 (step) - 0.01 = **21.79**

Clear gradient! Moving forward = more reward.

### 2. Old Model Has Bad Behavior
The existing model (v11, 2293 episodes) learned the OLD reward structure where sitting still was okay. It needs to be reset or retrained.

## How to Fix

### Option 1: Reset Model (Recommended)
Start completely fresh with new reward structure:

```javascript
resetModel(window.climbingGame)
```

This will:
1. Reset epsilon to 1.0 (full exploration)
2. Clear replay buffer
3. Reset statistics
4. Optionally reinitialize neural networks
5. Optionally clear localStorage

Then click "Start Training" to begin fresh.

### Option 2: Continue Training (Slower)
The agent will eventually learn the new reward structure, but it will take longer because it has to "unlearn" the old behavior.

Just click "Start Training" and wait for 100-200 episodes.

## Expected Behavior After Fix

### With Fresh Model
- **Episodes 1-20**: Random exploration, agent tries different actions
- **Episodes 20-50**: Agent learns FORWARD action gives more reward
- **Episodes 50-100**: Agent consistently moves toward stairs
- **Episodes 100-200**: Agent reaches Step 0 regularly
- **Episodes 200+**: Agent climbs multiple steps

### With Old Model (Continued Training)
- **Episodes 1-50**: Agent still sits (old behavior)
- **Episodes 50-100**: Gradually explores more
- **Episodes 100-200**: Starts moving forward occasionally
- **Episodes 200-300**: Consistently moves forward
- **Episodes 300+**: Climbs stairs

## Reward Breakdown

### Sitting on Platform (z=3, y=1)
```
Height:   +0.30
Progress: +0.00  (at z=3)
Time:     -0.01
Total:    +0.29 per step
```

### Moving Forward (z=2, y=1)
```
Height:   +0.30
Progress: +0.50  (moved 1 unit forward)
Time:     -0.01
Total:    +0.79 per step
```

### Reaching Step 0 (z=0, y=1)
```
Height:   +0.30
Progress: +1.50  (moved 3 units forward)
Step:     +20.00 (new step reached!)
On-step:  +0.50
Time:     -0.01
Total:    +22.29 for that step
```

### Reaching Step 1 (z=-2, y=2)
```
Height:   +0.60
Progress: +2.50  (moved 5 units forward)
Step:     +40.00 (new step reached!)
On-step:  +0.50
Proximity:+0.50  (near next step)
Time:     -0.01
Total:    +44.09 for that step
```

## Verification

### 1. Check Reward Gradient
```javascript
// Test rewards at different positions
const env = window.climbingGame.environment;
const physics = window.climbingGame.physicsEngine;

// At start
physics.setBodyPosition(env.agentBody, {x: 0, y: 1, z: 3});
let r1 = env.calculateReward(env.getState(), 0, env.getState());
console.log('At z=3:', r1);

// Moving forward
physics.setBodyPosition(env.agentBody, {x: 0, y: 1, z: 2});
let r2 = env.calculateReward(env.getState(), 0, env.getState());
console.log('At z=2:', r2);

// At Step 0
physics.setBodyPosition(env.agentBody, {x: 0, y: 1, z: 0});
let r3 = env.calculateReward(env.getState(), 0, env.getState());
console.log('At z=0:', r3);
```

Should see increasing rewards as Z decreases.

### 2. Watch Training
After resetting, watch for:
- Agent exploring different actions
- Agent occasionally moving forward
- Console showing "NEW STEP 0!" messages
- Rewards increasing over episodes

### 3. Check Stats
After 50 episodes:
- Average reward should be > 5
- Some episodes should reach Step 0
- Highest step should be ≥ 0

## Why This Works

### Before Fix
```
Sitting still: +0.29 per step
Moving forward: +0.29 per step (no difference!)
```
Agent had no reason to move.

### After Fix
```
Sitting still (z=3): +0.29 per step
Moving forward (z=2): +0.79 per step (2.7x better!)
Reaching Step 0 (z=0): +22.29 (77x better!)
```
Clear incentive to move forward!

## Additional Notes

### Why Not Just Penalize Sitting?
We could add a penalty for staying at z=3, but positive rewards are generally better for learning than negative penalties. The forward progress reward creates a smooth gradient that guides the agent.

### Why 0.5 Multiplier?
The multiplier `(3 - agentPos.z) * 0.5` was chosen to:
- Be significant enough to matter (0.5 per unit)
- Not overwhelm the step rewards (20, 40, 60...)
- Create a smooth gradient
- Scale appropriately with distance (21 units total = 10.5 max reward)

### What If Agent Still Sits?
If after resetting the model the agent still sits:
1. Increase the forward progress multiplier to 1.0
2. Add a small penalty for being at z > 2
3. Reduce epsilon decay to explore more
4. Check that FORWARD action is working (run `testRewards()`)

## Files Modified

1. **src/rl/ClimbingEnvironment.js**
   - Added forward progress reward
   - Encourages movement toward stairs

2. **src/reset-model.js** (NEW)
   - Tool to reset model and start fresh
   - Clears old learned behavior

## Summary

The agent was sitting because there was no reward gradient for moving forward. Now there is:
- **Sitting**: +0.29/step
- **Moving forward**: +0.79/step
- **Reaching stairs**: +22+/step

Reset the model with `resetModel(window.climbingGame)` and start training fresh!
