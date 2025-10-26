# Quick Fix Summary

## What Was Wrong
1. **Reward crash**: TypeError when accessing null state
2. **Adversarial rewards**: Terminal penalties (-50) >> positive rewards (+3-5)
3. **High damping**: Angular damping 0.8 prevented settling
4. **Strict detection**: Step detection tolerance too tight (0.8)
5. **Short buffer**: Only 200 steps to find stairs

## What Was Fixed
1. ✅ Added defensive checks in calculateReward
2. ✅ Rebalanced rewards: penalties -5 to -10, rewards +5 to +100
3. ✅ Added baseline penalty: -0.1 per step (makes "do nothing" bad)
4. ✅ Reduced damping: 0.8 → 0.3
5. ✅ Lenient detection: 0.8 → 1.2 tolerance
6. ✅ Increased buffer: 200 → 300 steps

## New Reward Values

**Positive:**
- Goal: +100
- Land on stairs: +10
- Climb 1 step: +5
- Milestone: +1
- Move to stairs: +1

**Negative:**
- Per-step: -0.1
- Fall off: -3
- Fell to death: -5
- Out of bounds: -8
- Buffer expired: -10

## Expected Value
- **Climb successfully**: +150 ✅
- **Climb and fail**: +27 ✅
- **Do nothing**: -40 ❌

## Quick Start
1. Run: `node src/test-reward-fix.js`
2. Clear: `localStorage.clear()` in browser
3. Train: Start visual training for 100 episodes
4. Watch: Average reward should trend upward

## Success Criteria
- ✅ No crashes
- ✅ Avg reward > -10 (was -60)
- ✅ Agent moves toward stairs
- ✅ Some episodes reach step 1+
- ✅ Upward trend over time

## Files Changed
- `src/rl/ClimbingEnvironment.js` - Rewards, buffer, detection
- `src/physics/PhysicsEngine.js` - Damping

## If Still Not Learning
1. Increase positive rewards further
2. Add curriculum learning (start with 2-3 steps)
3. Increase exploration (higher epsilon)
4. Check console for errors

## Core Insight
**Make expected value of attempting progress POSITIVE**

The agent optimizes expected return. If trying to climb has negative expected value, it won't try. By making progress rewarding and failure less catastrophic, we create a learning gradient.
