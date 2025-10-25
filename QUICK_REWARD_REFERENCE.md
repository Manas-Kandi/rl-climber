# 🎯 Quick Reward System Reference

## TL;DR - What Changed

**Problem:** Agent learned "doing nothing is better than risking failure"
**Solution:** Made progress 5-10x more rewarding, failures 50-67% less punishing, and doing nothing actively negative

---

## New Reward Values (Quick Reference)

### 🎉 Positive Rewards
```
Goal Reached:        +100  (unchanged)
Step 0 (first):      +50   (was +9)
Step 1:              +45   (was +8)
Step 2:              +40   (was +7)
Step 3:              +35   (was +6)
Step 4:              +30   (was +5)
Step 5:              +25   (was +4)
Step 6:              +20   (was +3)
Step 7:              +15   (was +2)
Step 8:              +10   (was +1)
Step 9:              +5    (was +1)

On stairs:           +1.0  (was +0.1)
Time decay (fresh):  +2.0  (NEW!)
Exploration bonus:   +0.2  (NEW!)
```

### 💥 Negative Penalties
```
Baseline (every step): -0.5  (NEW!)
On ground:             -1.0  (was -0.2)
Jump down (per step):  -5    (was -15)
Fall off stairs:       -10   (was -25)
Death/Out of bounds:   -50   (was -100)
Time decay (stale):    -5    (NEW!)
Stagnation:            -10   (was -5)
```

---

## The Math That Matters

### Try to Climb (30% success rate)
```
OLD: (0.3 × 8) + (0.7 × -15) = -8.1  ❌ Don't climb!
NEW: (0.3 × 45) + (0.7 × -5) = +10.0 ✅ Climb!
```

### Do Nothing
```
OLD: +0.1 per step  ✅ Safe!
NEW: -0.5 per step  ❌ Terrible!
```

**Result:** Climbing is now 10x better than doing nothing!

---

## Time Decay Schedule

```
Time on Step:     Reward:
0-30 steps        +2.0   ✅ Good
31-60 steps       +1.0   ⚠️ Getting worse
61-90 steps       0.0    😐 Neutral
91+ steps         -1 to -5  ❌ Bad
```

**Prevents camping on one step!**

---

## Expected Behaviors

### Before
- Agent finds safe spot and stays there
- Refuses to take risks
- Gets stuck in local minima

### After
- Agent actively seeks progress
- Takes calculated risks
- Can't stay in one place (decay + baseline)

---

## Quick Test Commands

```javascript
// Run all tests
window.rewardSystemTests.runAll()

// Test specific behaviors
window.rewardSystemTests.behaviors()

// Test reward ranges
window.rewardSystemTests.range()

// Compare old vs new
window.rewardSystemTests.compare()
```

---

## Files Modified

1. `src/rl/ClimbingEnvironment.js` - Reward calculation
2. `src/test-new-rewards.js` - Updated tests
3. `PSYCHOLOGY_REWARD_REDESIGN.md` - Full explanation
4. `REWARD_CHANGES_SUMMARY.md` - Detailed changes
5. `BEFORE_AFTER_COMPARISON.md` - Side-by-side comparison

---

## Key Insight

> **Negative rewards make 0 attractive!**
> 
> Solution: Shift baseline negative + make progress highly positive
> 
> Result: Desired behavior becomes mathematically optimal!

---

## Training Expectations

| Metric | Before | After |
|--------|--------|-------|
| Episodes to success | 500+ | 100-200 |
| Success rate (1000 eps) | 5-10% | 30-50% |
| Average reward | -50 to +50 | +100 to +300 |

---

## If Agent Still Doesn't Learn

### Increase Progress Rewards
```javascript
const stepReward = 100 - (currentStep * 10); // Even bigger!
```

### Increase Time Decay
```javascript
if (this.timeOnCurrentStep > 20) { // Trigger faster
  decayReward = -2.0; // Stronger penalty
}
```

### Increase Baseline Penalty
```javascript
totalReward -= 1.0; // Make doing nothing worse
```

### Decrease Failure Penalties
```javascript
jumpOffPenalty = -2 * steps; // Even less punishing
```

---

## The Psychology

**Agent's Decision Process:**
1. Calculate expected value of each action
2. Choose action with highest expected value
3. Learn from rewards

**Our Job:**
- Make desired behavior have highest expected value
- Use reward magnitude, not just sign
- Consider probability × reward, not just reward

**Key Formula:**
```
E[action] = Σ (probability × reward)

If E[desired] > E[undesired]:
  Agent learns desired behavior ✅
Else:
  Agent learns undesired behavior ❌
```

---

## Remember

The agent doesn't know what you want. It only knows what gets rewards.

**Design rewards to make the desired behavior the mathematically optimal choice!**

🎉 Happy training!
