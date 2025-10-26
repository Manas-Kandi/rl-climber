# Next Steps - Getting the Agent to Learn

## What Was Fixed

All critical issues have been addressed:
- ✅ Reward calculation crash fixed (defensive checks added)
- ✅ Reward scaling rebalanced (positive expected value for climbing)
- ✅ Physics damping reduced (0.8 → 0.3)
- ✅ Step detection made more lenient (0.8 → 1.2 tolerance)
- ✅ Safety buffer increased (200 → 300 steps)
- ✅ Per-step baseline penalty added (-0.1)

## Immediate Actions

### 1. Test the Fixes (5 minutes)
```bash
# Test reward calculation
node src/test-reward-fix.js

# Test goal detection
node src/test-goal-detection.js
```

Expected output:
- ✅ All tests pass
- ✅ No TypeError crashes
- ✅ Positive rewards for progress
- ✅ Negative penalties for failures

### 2. Clear Old Models (1 minute)
Open browser console and run:
```javascript
localStorage.clear()
```

This removes old models trained on the broken reward system.

### 3. Start Training (30-60 minutes)
1. Open the game in browser
2. Click "Visual Training" mode
3. Set episodes to 100
4. Click "Start Training"
5. Watch the console and UI

### 4. Monitor These Metrics

**Early Signs of Success (Episodes 1-20):**
- Average reward > -10 (was -60)
- Agent moves toward stairs occasionally
- Some episodes reach step 0 or 1
- No TypeError crashes

**Mid-Training Progress (Episodes 20-50):**
- Average reward > 0
- Agent consistently finds stairs
- Regularly reaches steps 2-3
- Highest step reached increases

**Late-Training Success (Episodes 50-100):**
- Average reward > +20
- Agent climbs 4-6 steps regularly
- Occasional goal reaches (1-5% success rate)
- Consistent upward trend

## What to Watch For

### Good Signs ✅
- Average reward trending upward
- Agent moves toward stairs (z decreasing)
- Step detection shows agent on stairs (not always -1)
- Highest step reached increases over episodes
- Some positive reward episodes

### Bad Signs ❌
- Average reward stays below -20
- Agent doesn't move or moves randomly
- Always shows step -1 (never on stairs)
- No improvement after 50 episodes

## If Still Not Learning After 100 Episodes

### Option A: Further Increase Positive Rewards
```javascript
// In ClimbingEnvironment.js, increase these:
Land on stairs: +10.0 → +15.0
Climb 1 step:   +5.0  → +8.0
```

### Option B: Add Curriculum Learning
Start with easier task (2-3 steps) then gradually increase:
```javascript
// In main.js or training config
env.enableCurriculumLearning(1);  // Start with step 0 only
// After 50 episodes with >50% success:
env.enableCurriculumLearning(2);  // Increase to step 2
// Continue increasing...
```

### Option C: Increase Exploration
```javascript
// In PPOAgent config
epsilon: 0.3  // Higher exploration (was 0.1)
```

### Option D: Simplify Physics
```javascript
// In PhysicsEngine.js
agentBody.linearDamping = 0.05;   // Increase from 0.01
agentBody.angularDamping = 0.5;   // Increase from 0.3
```

## Expected Training Timeline

### Phase 1: Random Exploration (Episodes 1-20)
- Agent explores randomly
- Occasionally stumbles onto stairs
- Average reward: -10 to +5
- Success rate: 0%

### Phase 2: Stair Discovery (Episodes 20-50)
- Agent learns stairs are good
- Moves toward stairs more often
- Average reward: +5 to +15
- Success rate: 0%

### Phase 3: Climbing Attempts (Episodes 50-100)
- Agent tries to climb
- Reaches steps 3-5 regularly
- Average reward: +15 to +30
- Success rate: 0-1%

### Phase 4: Consistent Climbing (Episodes 100-300)
- Agent climbs reliably
- Reaches steps 6-8
- Average reward: +30 to +50
- Success rate: 1-5%

### Phase 5: Goal Reaching (Episodes 300+)
- Agent occasionally reaches goal
- Climbs 8-10 steps regularly
- Average reward: +50 to +80
- Success rate: 5-15%

## Debugging Tips

### If Agent Doesn't Move
Check console for:
- Freeze detection messages
- Physics warnings
- Action selection logs

Try:
- Increase action forces in config
- Reduce damping further
- Check if agent body is created

### If Agent Falls Immediately
Check:
- Step detection tolerance (should be 1.2)
- Angular damping (should be 0.3)
- Starting position (should be on ground, not in air)

### If Rewards Look Wrong
Check console for:
- Reward component logs
- Step detection logs
- Buffer status logs

Run:
```bash
node src/test-reward-fix.js
```

### If Training is Slow
- Reduce max steps per episode (2000 → 1000)
- Increase training batch size
- Use faster computer/GPU
- Reduce rendering quality

## Success Criteria

**Minimum Success (After 100 episodes):**
- ✅ Average reward > 0
- ✅ Agent reaches step 1+ in >50% of episodes
- ✅ Upward trend in average reward

**Good Success (After 300 episodes):**
- ✅ Average reward > +20
- ✅ Agent reaches step 5+ in >50% of episodes
- ✅ Occasional goal reaches (1-5%)

**Excellent Success (After 500+ episodes):**
- ✅ Average reward > +50
- ✅ Agent reaches step 8+ in >50% of episodes
- ✅ Regular goal reaches (10-20%)

## Files to Monitor

1. **Browser Console**
   - Reward logs
   - Step detection logs
   - Error messages

2. **UI Stats Panel**
   - Average reward
   - Success rate
   - Highest step reached

3. **Training Metrics**
   - Episode rewards (should trend up)
   - Loss values (should decrease)
   - Epsilon (should decay)

## Quick Reference: New Reward Values

```
Positive Rewards:
  Goal reached:      +100.0
  Land on stairs:    +10.0
  Climb 1 step:      +5.0
  Milestone bonus:   +1.0
  Move to stairs:    +1.0

Negative Penalties:
  Per-step baseline: -0.1
  Move away:         -0.3
  Fall off stairs:   -3.0
  Move down:         -3.0/step
  Fell to death:     -5.0
  Out of bounds:     -8.0
  Buffer expired:    -10.0
```

## Contact/Help

If you're still stuck after trying these steps:
1. Share console logs from 10-20 episodes
2. Share training metrics (avg reward, success rate)
3. Share any error messages
4. Describe what the agent is doing (or not doing)

## Final Notes

**Be Patient**: RL training takes time. Even with perfect rewards, the agent needs hundreds of episodes to learn complex behaviors.

**Iterate**: If one approach doesn't work, try another. RL is empirical - what works in theory may need tuning in practice.

**Monitor**: Watch the metrics closely. Small improvements (avg reward going from -10 to 0) are progress!

**Celebrate Small Wins**: First time agent reaches step 1? That's progress! First time it climbs 2 steps? Even better!

Good luck! 🚀
