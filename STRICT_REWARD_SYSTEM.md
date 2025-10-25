# 🎯 Strict Reward System - Progress or Perish!

## The Core Problem

**Agent keeps finding reward hacks:**
- "Jumping off is better than flailing" ✅ (agent logic)
- "Staying on Step 0 is better than trying" ✅ (agent logic)
- "Something > nothing, so I'll do the minimum" ✅ (agent logic)

**Root cause:** We're rewarding "slightly better than terrible" instead of requiring actual progress!

## The New Philosophy

### OLD System (Exploitable):
```
Ground:    -0.05 per step (bad)
Step 0:    +0.10 per step (good!)
Step 5:    +0.20 per step (better!)

Agent learns: "Step 0 is good enough!" ✅
```

### NEW System (Strict):
```
Ground:    -0.10 per step + accumulating penalty (TERRIBLE!)
Step 0:    0.00 per step (baseline, nothing special)
Step 5:    0.00 per step (baseline, nothing special)
Progress:  +1.0 (ONLY way to get positive rewards!)

Agent learns: "Must climb or suffer!" ✅
```

---

## Complete Reward Structure

### 1. NOT On Stairs = Heavy Accumulating Penalty ❌

```javascript
if (currentStep < 0) {
    // Base penalty
    totalReward -= 0.1;  // 10x worse than before
    
    // ACCUMULATING penalty
    this.stepsOffStairs++;
    const accumulatingPenalty = min(2.0, stepsOffStairs * 0.01);
    totalReward -= accumulatingPenalty;
}
```

**Math:**
```
Step 1 off stairs:   -0.10 - 0.01 = -0.11
Step 10 off stairs:  -0.10 - 0.10 = -0.20
Step 50 off stairs:  -0.10 - 0.50 = -0.60
Step 100 off stairs: -0.10 - 1.00 = -1.10
Step 200+ off stairs: -0.10 - 2.00 = -2.10 (capped)
```

**Result:** The longer you stay off stairs, the worse it gets!

---

### 2. On Stairs = Baseline (0) ⚪

```javascript
if (currentStep >= 0) {
    // Being on stairs = 0 reward
    // This is BASELINE, not a reward!
    this.stepsOffStairs = 0;  // Reset counter
}
```

**Result:** Being on stairs is expected, not rewarded!

---

### 3. Climbing Up = ONLY Positive Reward ✅

```javascript
if (currentStep > highestStepReached && currentStep >= 0) {
    const stepReward = 1.0 - (currentStep * 0.1);
    totalReward += stepReward;
    
    // With jump bonus if applicable
    if (jumpedThisStep) {
        totalReward += 0.1;
    }
}
```

**Result:** ONLY climbing gives positive rewards!

---

### 4. Episode-Level Penalty for No Progress ❌❌

```javascript
reset() {
    if (highestStepReached < 0) {
        // Didn't reach any steps!
        episodesWithoutProgress++;
        const penalty = -1.0 * min(10, episodesWithoutProgress);
        totalReward += penalty;
    } else {
        episodesWithoutProgress = 0;  // Reset
    }
}
```

**Accumulating penalties:**
```
Episode 1 no progress:  -1.0
Episode 2 no progress:  -2.0
Episode 3 no progress:  -3.0
Episode 10+ no progress: -10.0 (capped)
```

**Result:** Repeated failures accumulate penalties across episodes!

---

### 5. Terminal Penalties = Massive ❌❌❌

```javascript
if (isOutOfBounds() || fellToDeath()) {
    totalReward += -10.0;
}
```

**Result:** Instant death is always terrible!

---

## Complete Episode Scenarios

### Scenario 1: Stay on Ground (Terrible!)

```
Steps 1-500 off stairs:
  Base penalty:         -0.1 × 500 = -50.0
  Accumulating penalty: -2.0 × 300 = -600.0 (capped at 200 steps)
  Total:                -650.0 ❌❌❌

Episode ends without progress:
  Episode penalty:      -1.0 (first time)
  Next episode penalty: -2.0 (second time)
  ...accumulates...
```

**Agent learns:** "This is the WORST possible strategy!"

---

### Scenario 2: Reach Step 0 and Stay (Okay)

```
Steps 1-50 off stairs:
  Base penalty:         -0.1 × 50 = -5.0
  Accumulating penalty: -0.5 × 25 = -12.5
  
Reach Step 0:
  Step reward:          +1.0 ✅
  
Steps 51-500 on Step 0:
  Reward:               0.0 × 450 = 0.0 (baseline)
  
Total:                  -16.5 ⚠️ (Still negative!)
```

**Agent learns:** "Better than ground, but still not good!"

---

### Scenario 3: Climb to Step 5 (Good!)

```
Steps 1-50 off stairs:
  Base penalty:         -0.1 × 50 = -5.0
  Accumulating penalty: -12.5
  
Climb Steps 0-5:
  Step rewards:         +1.0 +0.9 +0.8 +0.7 +0.6 +0.5 = +4.5 ✅
  
Steps 51-300 on Step 5:
  Reward:               0.0 × 250 = 0.0 (baseline)
  
Total:                  -13.0 ⚠️ (Still negative!)
```

**Agent learns:** "Better, but need to climb faster!"

---

### Scenario 4: Climb to Step 9 Quickly (Best!)

```
Steps 1-20 off stairs:
  Base penalty:         -0.1 × 20 = -2.0
  Accumulating penalty: -2.0
  
Climb Steps 0-9:
  Step rewards:         +1.0 +0.9 +0.8 +0.7 +0.6 +0.5 +0.4 +0.3 +0.2 +0.1 = +5.5 ✅✅
  
Steps 21-200 on Step 9:
  Reward:               0.0 × 180 = 0.0 (baseline)
  
Total:                  +1.5 ✅ (Finally positive!)
```

**Agent learns:** "Climb quickly = only way to win!"

---

### Scenario 5: Reach Goal (Perfect!)

```
Steps 1-20 off stairs:
  Base penalty:         -2.0
  Accumulating penalty: -2.0
  
Climb all steps:
  Step rewards:         +5.5
  
Reach goal:
  Goal reward:          +10.0 ✅✅✅
  
Total:                  +11.5 ✅✅✅ (Best possible!)
```

**Agent learns:** "This is the ONLY truly good outcome!"

---

## Comparison: Old vs New

| Strategy | Old Reward | New Reward | Change |
|----------|-----------|------------|--------|
| **Stay on ground** | -30.0 | **-650.0** | 21x worse! |
| **Jump out of bounds** | -10.0 | **-10.0** | Same |
| **Reach Step 0, stay** | +45.0 ✅ | **-16.5** ❌ | Now negative! |
| **Climb to Step 5** | +41.5 ✅ | **-13.0** ❌ | Now negative! |
| **Climb to Step 9** | +40.0 ✅ | **+1.5** ✅ | Barely positive |
| **Reach goal** | +16.5 ✅ | **+11.5** ✅ | Still best |

**Key insight:** Only climbing high or reaching goal gives positive rewards!

---

## Why This Works

### Principle 1: Baseline is Stairs, Not Ground
```
OLD: Ground = bad, Stairs = good
NEW: Ground = terrible, Stairs = baseline (0)

Result: Agent MUST get on stairs just to stop bleeding rewards!
```

### Principle 2: Accumulating Penalties
```
OLD: -0.05 per step off stairs (constant)
NEW: -0.1 to -2.1 per step off stairs (accumulating)

Result: Agent can't afford to stay off stairs!
```

### Principle 3: Episode-Level Accountability
```
OLD: Each episode independent
NEW: Failed episodes accumulate penalties

Result: Agent can't just "try again" without consequence!
```

### Principle 4: Only Progress Rewarded
```
OLD: Being on stairs = +0.1 per step
NEW: Being on stairs = 0 per step

Result: Agent must CLIMB, not just reach stairs!
```

---

## Expected Training Behavior

### Episodes 1-10: Panic Phase
```
Agent tries everything
Gets massive penalties for staying on ground
Discovers: "Must get on stairs!"
Average reward: -200 to -500
```

### Episodes 11-30: Discovery Phase
```
Agent learns to reach Step 0
Still gets negative rewards (not climbing)
Discovers: "Step 0 isn't enough!"
Average reward: -50 to -10
```

### Episodes 31-60: Climbing Phase
```
Agent learns to climb to Step 2-3
Starts getting less negative rewards
Discovers: "Climbing = less pain!"
Average reward: -10 to 0
```

### Episodes 61-100: Optimization Phase
```
Agent learns to climb to Step 5-9
Finally gets positive rewards
Discovers: "Fast climbing = winning!"
Average reward: 0 to +5
```

### Episodes 100+: Mastery Phase
```
Agent consistently reaches Step 9 or goal
Maximizes positive rewards
Average reward: +5 to +11
```

---

## Console Messages

### Off Stairs Too Long:
```
⚠️ OFF STAIRS for 60 steps! Penalty: -0.70
⚠️ OFF STAIRS for 120 steps! Penalty: -1.30
⚠️ OFF STAIRS for 200 steps! Penalty: -2.10
```

### Episode Failure:
```
❌ EPISODE FAILED! No progress for 1 episodes. Penalty: -1.0
❌ EPISODE FAILED! No progress for 5 episodes. Penalty: -5.0
❌ EPISODE FAILED! No progress for 10 episodes. Penalty: -10.0
```

### Progress Made:
```
🎯 NEW STEP 0! Reward: +1.00
🎯 NEW STEP 5! Reward: +0.50
🏆 GOAL REACHED! +10.0 (MAXIMUM REWARD)
```

---

## Fine-Tuning Parameters

### If agent still doesn't climb:
```javascript
// Increase off-stairs penalty
totalReward -= 0.2;  // Instead of 0.1

// Increase accumulating penalty
const accumulatingPenalty = min(5.0, stepsOffStairs * 0.02);
```

### If agent climbs but too slowly:
```javascript
// Add time pressure
if (currentStep >= 0 && currentStep < 5) {
    totalReward -= 0.01;  // Penalty for being on low steps
}
```

### If agent reaches Step 0 and stops:
```javascript
// Penalize staying on low steps
if (currentStep === 0 && timeOnCurrentStep > 100) {
    totalReward -= 0.05;
}
```

---

## Summary of Changes

| Aspect | Old | New | Impact |
|--------|-----|-----|--------|
| **Off stairs penalty** | -0.05 | **-0.1 to -2.1** | Accumulating! |
| **On stairs reward** | +0.1 | **0.0** | Baseline, not reward |
| **Height bonus** | +0.02 per level | **0.0** | Removed |
| **Exploration bonus** | +0.005 | **0.0** | Removed |
| **Episode penalty** | 0 | **-1.0 to -10.0** | NEW! Accumulating |
| **Progress requirement** | Optional | **MANDATORY** | Must climb! |

---

## The Philosophy

### OLD System:
```
"Let's make climbing attractive!"
Result: Agent finds minimum effort strategy
```

### NEW System:
```
"Let's make NOT climbing unbearable!"
Result: Agent MUST climb to survive
```

---

## Expected Results

**After 50 episodes:**
- Agent consistently reaches Step 0
- Average reward: -10 to 0
- Learning: "Must get on stairs"

**After 100 episodes:**
- Agent climbs to Step 3-5
- Average reward: 0 to +2
- Learning: "Must climb higher"

**After 200 episodes:**
- Agent reaches Step 7-9 or goal
- Average reward: +2 to +10
- Learning: "Fast climbing = optimal"

---

## Summary

**The strict reward system:**

1. ✅ **Makes being off stairs unbearable** (accumulating -0.1 to -2.1)
2. ✅ **Makes being on stairs baseline** (0 reward, not positive)
3. ✅ **Makes only climbing rewarded** (+1.0 per new step)
4. ✅ **Adds episode-level accountability** (-1.0 to -10.0 for no progress)
5. ✅ **Removes all reward hacks** (no bonuses for "good enough")

**Result:** Agent MUST climb or suffer increasingly severe penalties!

**No more exploits. Progress or perish!** 🎯
