# Reward Structure Tuning

## Problem

The agent was:
- ❌ Getting -83.47 average reward
- ❌ 0% success rate
- ❌ Jumping away from the wall
- ❌ Not using ledges
- ❌ Using old exploited model (v534)

## Root Causes

1. **Old Model**: Learned flying exploit, now broken with fixes
2. **Too Restrictive**: Height reward only when grounded
3. **Too Harsh**: Large penalties discouraged exploration
4. **Not Enough Guidance**: No reward for approaching wall

## New Reward Structure

### Positive Rewards (Encourage Good Behavior)

| Event | Old | New | Why |
|-------|-----|-----|-----|
| Height Gain (grounded) | +1.0 | +2.0 | Encourage climbing |
| Height Gain (airborne) | 0 | +0.6 | Allow jumping between ledges |
| Ledge Contact | +5.0 | +8.0 | Make ledges more attractive |
| Grab on Ledge | +2.0 | +3.0 | Encourage proper grab use |
| Near Wall | 0 | +0.5 | Guide agent toward wall |
| Goal Reached | +100 | +100 | Ultimate goal |
| Survival | +0.1 | +0.1 | Stay alive |

### Negative Rewards (Discourage Bad Behavior)

| Event | Old | New | Why |
|-------|-----|-----|-----|
| Fall | -50 | -20 | Less harsh, allow learning |
| Out of Bounds | -100 | -50 | Less harsh, allow learning |
| Failed Jump | -0.5 | -0.1 | Don't over-penalize |
| Time Penalty | -0.01 | -0.005 | Less pressure |

## Key Changes

### 1. Height Gain Reward ✅
```javascript
// OLD: Only reward when grounded
if (heightGain > 0 && isGrounded()) {
  reward += heightGain * 1.0;
}

// NEW: Reward airborne too (but less)
if (heightGain > 0) {
  if (isGrounded() || isTouchingLedge()) {
    reward += heightGain * 2.0;  // Full reward
  } else {
    reward += heightGain * 0.6;  // 30% of 2.0 when airborne
  }
}
```

### 2. Ledge Rewards ✅
```javascript
// Increased base reward
ledgeGrab: 8.0  // Was 5.0

// Increased grab bonus
if (action === GRAB && isTouchingLedge()) {
  reward += 3.0;  // Was 2.0
}
```

### 3. Wall Proximity Reward ✅
```javascript
// NEW: Encourage approaching the wall
if (agentPos.z < -3 && agentPos.z > -7) {
  reward += 0.5;  // Near the climbing wall
}
```

### 4. Reduced Penalties ✅
```javascript
fall: -20.0          // Was -50.0
outOfBounds: -50.0   // Was -100.0
failedJump: -0.1     // Was -0.5
timePenalty: -0.005  // Was -0.01
```

## Expected Behavior

### Early Training (0-100 episodes)
- **Reward**: -20 to 0
- **Behavior**: Random exploration, learning boundaries
- **Goal**: Stop falling off platform

### Mid Training (100-500 episodes)
- **Reward**: 0 to 30
- **Behavior**: Approaching wall, touching ledges
- **Goal**: Learn to use ledges

### Late Training (500-1000 episodes)
- **Reward**: 30 to 60
- **Behavior**: Climbing ledges, using grab
- **Goal**: Reach higher ledges

### Expert (1000+ episodes)
- **Reward**: 60 to 100+
- **Behavior**: Efficient climbing, reaching goal
- **Goal**: Consistent success

## How to Reset and Retrain

### Step 1: Reset the Model
```javascript
// In browser console:
await window.climbingGame.modelManager.reset()
```

This will:
- Delete the old exploited model (v534)
- Reset to v0
- Clear all training history
- Start fresh

### Step 2: Start Training
1. Click "Start Training" button
2. Watch the agent learn from scratch
3. Be patient - learning takes time!

### Step 3: Monitor Progress
Watch for these signs of learning:
- ✅ Reward increasing over time
- ✅ Agent staying on platform
- ✅ Agent approaching wall
- ✅ Agent touching ledges
- ✅ Success rate increasing

## Training Tips

### 1. Let It Run
- Don't stop training too early
- Agent needs 500-1000 episodes minimum
- Learning is gradual

### 2. Watch the Patterns
- Early: Random movement
- Mid: Approaching wall
- Late: Using ledges
- Expert: Reaching goal

### 3. Adjust If Needed
If after 500 episodes:
- Still falling off: Increase out-of-bounds penalty
- Not approaching wall: Increase wall proximity reward
- Not using ledges: Increase ledge rewards
- Not jumping: Reduce failed jump penalty

## Reward Tuning Commands

```javascript
// Check current rewards
const env = window.climbingGame.environment;
console.log(env.config.rewardWeights);

// Manually adjust (for testing)
env.config.rewardWeights.heightGain = 3.0;
env.config.rewardWeights.ledgeGrab = 10.0;
```

## Success Metrics

### Good Training Run
- Episode 100: Avg reward > -10
- Episode 300: Avg reward > 10
- Episode 500: Avg reward > 30
- Episode 1000: Avg reward > 50

### Poor Training Run
- Episode 100: Avg reward < -30
- Episode 300: Avg reward < 0
- Episode 500: Avg reward < 10
- → Need to adjust rewards or reset

## Common Issues

### Issue: Agent keeps falling
**Solution**: 
- Increase survival reward
- Reduce fall penalty
- Add ground contact reward

### Issue: Agent ignores ledges
**Solution**:
- Increase ledge grab reward
- Add wall proximity reward
- Reduce time penalty

### Issue: Agent too cautious
**Solution**:
- Increase height gain reward
- Reduce failed jump penalty
- Add exploration bonus

### Issue: Agent too reckless
**Solution**:
- Increase fall penalty
- Increase out-of-bounds penalty
- Reduce height gain reward

## Next Steps

1. **Reset the model** (critical!)
2. **Start fresh training**
3. **Monitor for 100 episodes**
4. **Check if reward is improving**
5. **Adjust if needed**

The new reward structure should make learning much easier and more natural! 🎯
