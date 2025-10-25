# 🧠 Psychology-Based Reward System Redesign

## The Problem: Why Negative Rewards Make 0 Attractive

### The Core Issue
When you have negative rewards (penalties), the agent learns that **doing nothing (0 reward) is better than doing something bad (negative reward)**. This creates:

1. **Risk Aversion**: Agent prefers guaranteed 0 over potential +9/-15
2. **Local Minima**: Agent finds a "safe spot" and refuses to leave
3. **Conservative Behavior**: Agent avoids necessary risks to reach higher rewards
4. **Stagnation**: "Better to do nothing than risk failure"

### Example: The Math Problem

**Old System:**
- Try to climb from Step 1 to Step 2:
  - Success (30% chance): +8 points
  - Failure (70% chance): -15 points
  - Do nothing: +0.1 points (safe!)

**Expected Value Calculation:**
```
(0.3 × 8) + (0.7 × -15) = 2.4 - 10.5 = -8.1
```

**Agent learns:** "Don't try to climb, just stay put!" ❌

The math makes exploration **mathematically unattractive**, even though we want the agent to explore!

---

## The Solution: 4 Key Psychological Principles

### 1. **Shift the Baseline: Make "Doing Nothing" Negative**

**Old System:**
- Standing still: ~0 reward
- Agent thinks: "This is fine!"

**New System:**
- Every step costs: **-0.5 baseline penalty**
- Agent thinks: "I'm losing points just standing here! I need to DO something!"

**Why it works:** Forces the agent to seek positive rewards to overcome the baseline penalty.

---

### 2. **Massive Positive Rewards for Progress**

**Old System:**
- Step progression: +1 to +9 points
- Penalties: -15 to -45 points
- Ratio: Penalties are 2-5x larger than rewards

**New System:**
- Step progression: **+50 to +5 points** (diminishing)
  - Step 0: +50
  - Step 1: +45
  - Step 2: +40
  - ...
  - Step 9: +5
- Penalties: -5 to -10 points
- Ratio: **Rewards are 5-10x larger than penalties!**

**Why it works:** Makes the risk/reward ratio favor exploration. Even with low success rate, expected value is positive!

**New Math:**
```
Try to climb from Step 1 to Step 2:
- Success (30% chance): +45 points
- Failure (70% chance): -5 points
- Do nothing: -0.5 points per step

Expected Value: (0.3 × 45) + (0.7 × -5) = 13.5 - 3.5 = +10.0 ✅
```

**Agent learns:** "Even if I fail most of the time, trying is MUCH better than doing nothing!"

---

### 3. **Time Decay: Rewards Decrease Over Time**

**Problem:** Agent might find Step 1 and camp there forever.

**Solution:** Rewards for staying on the same step decay over time:

```
Time on Step 1:
- First 30 steps (0.5s):  +2.0 per step  ✅ Good!
- Next 30 steps (1.0s):   +1.0 per step  ⚠️ Getting worse
- Next 30 steps (1.5s):    0.0 per step  😐 Neutral
- After 90 steps (1.5s+): -1.0 to -5.0   ❌ Bad!
```

**Why it works:** Forces progression to maintain positive rewards. Can't camp on one step forever!

---

### 4. **Exploration Bonus: Reward Trying New Things**

**New System:**
- Small bonus (+0.2) for taking ANY action
- Even if action fails, exploration itself is rewarded

**Why it works:** Encourages risk-taking and trying different strategies.

---

## Complete Reward Structure

### Positive Rewards (What We Want)
| Action | Reward | Notes |
|--------|--------|-------|
| **Reach Goal** | +100 | Maximum reward! |
| **New Step 0** | +50 | Huge reward for first step |
| **New Step 1** | +45 | Still massive |
| **New Step 2** | +40 | Diminishing but large |
| **New Step 9** | +5 | Still positive! |
| **On Stairs** | +1.0 | Better than ground |
| **Time Decay (fresh)** | +2.0 | First 30 steps on step |
| **Exploration** | +0.2 | Just for trying |
| **Forward Progress** | +0.1 | Approaching stairs |

### Negative Rewards (What We Don't Want)
| Action | Penalty | Notes |
|--------|---------|-------|
| **Baseline** | -0.5 | Every step costs this |
| **On Ground** | -1.0 | Should be on stairs |
| **Stagnation** | -1.0 to -10 | Not moving at all |
| **Time Decay (old)** | -1.0 to -5.0 | Been on step too long |
| **Jump Down** | -5 per step | Was -15, now reduced |
| **Fall Off** | -10 | Was -25, now reduced |
| **Off Center** | -0.3 | Should stay centered |
| **Death/OOB** | -50 | Was -100, now reduced |

---

## Risk/Reward Analysis

### Scenario 1: Try to Climb (30% success rate)
```
Expected Value:
(0.3 × 45) + (0.7 × -5) - 0.5 = 13.5 - 3.5 - 0.5 = +9.5 ✅

Agent learns: "Climbing is GREAT!"
```

### Scenario 2: Do Nothing
```
Reward per step: -0.5 (baseline) - 1.0 (stagnation) = -1.5 ❌

Agent learns: "Doing nothing is TERRIBLE!"
```

### Scenario 3: Camp on Step 1
```
First 30 steps: +2.0 - 0.5 = +1.5 per step ✅
Next 30 steps:  +1.0 - 0.5 = +0.5 per step ⚠️
Next 30 steps:   0.0 - 0.5 = -0.5 per step ❌
After 90 steps: -1.0 - 0.5 = -1.5 per step ❌❌

Agent learns: "I can rest briefly, but need to keep moving!"
```

---

## Key Insights

### 1. Relative Value Theory
The agent doesn't care about absolute values, only **relative** values:
- If penalties are larger than rewards → avoid risk
- If rewards are larger than penalties → take risks
- If doing nothing is 0 → prefer safety
- If doing nothing is negative → forced to act

### 2. Expected Value Drives Behavior
The agent will **always** choose the action with highest expected value:
```
E[action] = Σ (probability × reward)
```

Our job is to make the **desired behavior** have the highest expected value!

### 3. The "Do Nothing" Trap
If "do nothing" gives 0 reward, and risky actions have negative expected value, the agent will **rationally choose** to do nothing. This is not a bug, it's optimal behavior given bad reward design!

### 4. Magnitude Matters More Than Sign
It's not about positive vs negative, it's about **relative magnitude**:
- Small positive + large negative = risk aversion
- Large positive + small negative = risk seeking
- Zero baseline + any negative = stagnation

---

## Implementation Changes

### Added to Constructor
```javascript
this.timeOnCurrentStep = 0; // Track time on current step for decay
```

### Modified calculateReward()
1. **Baseline penalty**: -0.5 every step
2. **Massive step rewards**: +50 to +5 (was +9 to +1)
3. **Time decay**: Rewards decrease if staying on same step
4. **Reduced penalties**: -5 to -10 (was -15 to -45)
5. **Exploration bonus**: +0.2 for any action
6. **Terminal penalties**: -50 (was -100)

### Modified reset()
```javascript
this.timeOnCurrentStep = 0; // Reset time on current step
```

---

## Expected Behavioral Changes

### Before (Old System)
- ❌ Agent finds safe spot and stays there
- ❌ Refuses to take risks
- ❌ Gets stuck in local minima
- ❌ Prefers doing nothing over exploration
- ❌ Conservative, non-exploratory policy

### After (New System)
- ✅ Agent actively seeks progress
- ✅ Takes calculated risks
- ✅ Explores different strategies
- ✅ Can't stay in one place (decay forces movement)
- ✅ Aggressive, exploratory policy

---

## Testing the New System

### What to Watch For

1. **Early Episodes**: Agent should be more active, trying different actions
2. **Mid Training**: Agent should learn to climb stairs despite occasional failures
3. **Late Training**: Agent should efficiently climb without camping on steps
4. **Reward Graphs**: Should see higher average rewards (due to larger positive values)
5. **Success Rate**: Should improve as agent learns risk-taking pays off

### Red Flags

- If agent still camps on one step → increase time decay penalty
- If agent is too reckless → slightly increase failure penalties
- If agent ignores stairs → increase step progression rewards
- If agent doesn't explore → increase exploration bonus

---

## The Psychology Lesson

**Key Takeaway:** In RL, the agent will **always** find the path of least resistance. If that path is "do nothing," you've designed your rewards wrong!

**The Fix:** Make the path of least resistance be the **behavior you want**:
1. Make inaction costly (negative baseline)
2. Make desired actions highly rewarding (large positive)
3. Make failures less punishing (small negative)
4. Make stagnation impossible (time decay)

**Remember:** The agent doesn't know what you want. It only knows what gets rewards. Design your rewards to make the desired behavior the **mathematically optimal** choice!

---

## References

This redesign is based on fundamental RL principles:
- **Reward Shaping**: Designing rewards to guide learning
- **Exploration vs Exploitation**: Balancing risk and safety
- **Temporal Credit Assignment**: Rewards decay over time
- **Relative Value Theory**: Agents compare options, not absolute values

The key insight: **Negative rewards make 0 attractive!** Shift the baseline to make progress the only viable strategy.
