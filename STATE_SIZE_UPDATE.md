# State Size Update: 9D → 13D

## Issue
Error: "Invalid state: expected length 9, got 13"

## Root Cause
The state vector was expanded from 9D to 13D to include explicit goal information, but agent initialization was still using the old 9D size.

## Changes Made

### State Vector Expansion (Previous Work)
**Old 9D state:**
1. x, y, z (position)
2. vx, vy, vz (velocity)
3. distGoal (distance to goal)
4. currentStep (which step agent is on)
5. distNextStep (distance to next step)

**New 13D state:**
1. x, y, z (position)
2. vx, vy, vz (velocity)
3. distGoal (distance to goal)
4. **goalDirZ** (direction to goal in Z: -1 or +1) ← NEW
5. **goalDirY** (direction to goal in Y: -1 or +1) ← NEW
6. currentStep (which step agent is on)
7. distNextStep (distance to next step)
8. **onStairs** (binary: 0 or 1) ← NEW
9. **buffer** (safety buffer: 0 to 1) ← NEW

### Files Updated

#### 1. src/rl/ClimbingEnvironment.js
- `getStateSpace()`: Already returns 13 ✅
- `reset()`: Error return changed from `Float32Array(9)` → `Float32Array(13)`
- `step()`: Error return changed from `Float32Array(9)` → `Float32Array(13)`

#### 2. src/main.js
All agent instantiations updated:
```javascript
// Before
new PPOAgent(9, 6, config)
new DQNAgent(9, 6, config)

// After
new PPOAgent(13, 6, config)
new DQNAgent(13, 6, config)
```

Three locations updated:
- Initial agent creation (line ~197)
- Agent switching (line ~1187)
- Agent testing (line ~1279)

## Why 13D?

The expanded state provides **explicit guidance** to the agent:

1. **goalDirZ/goalDirY**: Tells agent which direction to move (no need to infer from position)
2. **onStairs**: Binary flag for immediate feedback about being on stairs
3. **buffer**: Shows how much time left before penalty (creates urgency)

These additions make learning faster by providing clearer signals about:
- Where to go (goal direction)
- Where you are (on stairs or not)
- How much time you have (buffer countdown)

## Testing

Run the game and start visual training - the error should be gone!

The agent will now receive the full 13D state vector with explicit goal information.

## Note

If you have saved models from before, they were trained on 9D state and won't work with the new 13D state. You'll need to:
1. Delete old models: `localStorage.clear()` in browser console
2. Train new models with 13D state

This is expected when changing state representation.
