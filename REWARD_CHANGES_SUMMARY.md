# 🎯 Psychology-Based Reward System Changes

## What Changed

### Core Philosophy Shift
**OLD:** Small rewards, large penalties → Agent learns to avoid risk
**NEW:** Large rewards, small penalties → Agent learns to take risks

### The Key Insight
> **Negative rewards make 0 attractive!** If doing nothing gives 0 and risky actions have negative expected value, the agent will rationally choose to do nothing.

**Solution:** Shift the baseline negative and make progress highly rewarding!

---

## Specific Changes

### 1. Baseline Penalty (NEW!)
- **Every step now costs -0.5**
- Forces agent to seek positive rewards
- Makes "doing nothing" unattractive

### 2. Step Progression Rewards (MASSIVE INCREASE!)
| Step | Old Reward | New Reward | Change |
|------|-----------|-----------|--------|
| 0 | +9 | +50 | **+456%** |
| 1 | +8 | +45 | **+463%** |
| 2 | +7 | +40 | **+471%** |
| 3 | +6 | +35 | **+483%** |
| 4 | +5 | +30 | **+500%** |
| 5 | +4 | +25 | **+525%** |
| 6 | +3 | +20 | **+567%** |
| 7 | +2 | +15 | **+650%** |
| 8 | +1 | +10 | **+900%** |
| 9 | +1 | +5 | **+400%** |

### 3. Time Decay (NEW!)
Rewards for staying on same step decay over time:
- First 30 steps: +2.0 (good!)
- Next 30 steps: +1.0 (getting worse)
- Next 30 steps: 0.0 (neutral)
- After 90 steps: -1.0 to -5.0 (bad!)

**Prevents camping on one step!**

### 4. Reduced Penalties (MAJOR REDUCTION!)
| Action | Old Penalty | New Penalty | Change |
|--------|------------|------------|--------|
| Jump down 1 step | -15 | -5 | **-67%** |
| Fall off stairs | -25 | -10 | **-60%** |
| Death/Out of bounds | -100 | -50 | **-50%** |

### 5. Exploration Bonus (NEW!)
- +0.2 for taking any action
- Encourages trying different strategies

### 6. Other Changes
- Being on stairs: +1.0 (was +0.1)
- Being on ground: -1.0 (was -0.2)
- Stagnation triggers faster: 30 steps (was 60)

---

## Expected Value Analysis

### Scenario: Try to Climb (30% success rate)

**OLD SYSTEM:**
```
Success (30%): +8
Failure (70%): -15
Do nothing: +0.1

Expected Value: (0.3 × 8) + (0.7 × -15) = -8.1
Agent learns: "Don't climb!" ❌
```

**NEW SYSTEM:**
```
Success (30%): +45
Failure (70%): -5
Do nothing: -0.5

Expected Value: (0.3 × 45) + (0.7 × -5) - 0.5 = +9.5
Agent learns: "Climbing is great!" ✅
```

---

## Expected Behavioral Changes

### Before
- ❌ Agent finds safe spot and stays there
- ❌ Refuses to take risks
- ❌ Gets stuck in local minima
- ❌ Conservative, non-exploratory

### After
- ✅ Agent actively seeks progress
- ✅ Takes calculated risks
- ✅ Explores different strategies
- ✅ Can't stay in one place (decay + baseline)
- ✅ Aggressive, exploratory

---

## Files Modified

1. **src/rl/ClimbingEnvironment.js**
   - Added `timeOnCurrentStep` tracking
   - Completely rewrote `calculateReward()` method
   - Added baseline penalty, time decay, exploration bonus
   - Increased step rewards 4-10x
   - Reduced penalties 50-67%

2. **src/test-new-rewards.js**
   - Updated tests to match new reward values
   - Added tests for baseline penalty, time decay, exploration bonus
   - Updated expected values

3. **PSYCHOLOGY_REWARD_REDESIGN.md** (NEW)
   - Comprehensive explanation of the psychology
   - Detailed analysis of the problem and solution
   - Expected value calculations
   - Implementation details

---

## How to Test

1. **Run the test suite:**
   ```javascript
   window.rewardSystemTests.runAll()
   ```

2. **Watch for these behaviors during training:**
   - Agent should be more active and exploratory
   - Agent should climb stairs despite occasional failures
   - Agent should not camp on one step
   - Average rewards should be higher (due to larger positive values)

3. **Check the console for reward logs:**
   - Look for "NEW STEP" messages with large rewards (+50, +45, etc.)
   - Look for "TIME DECAY" messages if agent stays too long
   - Look for reduced penalties (-5, -10 instead of -15, -25)

---

## The Psychology Lesson

**Key Takeaway:** The agent will always find the path of least resistance. If that path is "do nothing," you've designed your rewards wrong!

**The Fix:**
1. Make inaction costly (negative baseline)
2. Make desired actions highly rewarding (large positive)
3. Make failures less punishing (small negative)
4. Make stagnation impossible (time decay)

**Result:** The desired behavior becomes the **mathematically optimal** choice!

---

## Next Steps

1. ✅ Reward system redesigned
2. ✅ Tests updated
3. ⏭️ Train the agent and observe behavior
4. ⏭️ Fine-tune if needed (adjust magnitudes, not structure)
5. ⏭️ Celebrate when agent learns to climb! 🎉
