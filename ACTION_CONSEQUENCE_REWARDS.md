# 🎯 Action-Consequence Reward System

## The Problem

After 156 episodes: **-255.78 average reward, 0% success rate**

The agent is completely stuck because rewards are too abstract and delayed. It can't figure out which actions are good!

## The Solution: Immediate Action-Consequence Feedback

**Every action gets INSTANT feedback based on what it DIRECTLY caused!**

### Core Principle
```
Action → Immediate Consequence → Immediate Reward/Penalty

NOT: Action → Wait 500 steps → Get confusing aggregate reward
```

---

## Complete Reward Breakdown

### 1. MOVEMENT ACTIONS (WASD)

#### Forward/Backward/Left/Right:

**Did you move toward stairs?**
```javascript
if (movedTowardStairs) {
    reward += 0.2;  // ✅ Good move!
} else if (movedAwayFromStairs) {
    reward -= 0.2;  // ❌ Bad move!
}
```

**Did you gain height?**
```javascript
if (heightGain > 0.1) {
    reward += heightGain * 0.5;  // ✅ Climbing!
} else if (heightGain < -0.1) {
    reward -= |heightGain| * 0.3;  // ❌ Falling!
}
```

**Did you get on/off stairs?**
```javascript
if (justGotOnStairs) {
    reward += 0.5;  // ✅ Great!
} else if (justFellOffStairs) {
    reward -= 0.5;  // ❌ Bad!
}
```

---

### 2. JUMP ACTION

**Did jump lead to new step?**
```javascript
if (reachedNewStep) {
    reward += 2.0;  // Step reward
    reward += 0.5;  // ✅ PRODUCTIVE JUMP bonus!
} else {
    reward -= 0.3;  // ❌ WASTEFUL JUMP penalty!
}
```

**Repeated wasteful jumps?**
```javascript
if (consecutiveWastefulJumps > 2) {
    reward -= 0.1 * (jumps - 2);  // ❌ Stop spamming!
}
```

---

### 3. STEP PROGRESSION

**Reached new step?**
```javascript
Step 0: +2.0  // HUGE!
Step 1: +1.85
Step 2: +1.70
Step 3: +1.55
...
Step 9: +0.65
```

**With productive jump:**
```javascript
Step 0: +2.0 + 0.5 = +2.5  // MASSIVE!
```

---

### 4. POSITION REWARDS

**Where are you?**
```javascript
On stairs:  +0.05 per step  // ✅ Good position
Off stairs: -0.1 per step   // ❌ Bad position
```

---

### 5. BACKWARD MOVEMENT

**Moved to lower step?**
```javascript
Down 1 step: -0.5  // ❌ Wrong direction!
Down 2 steps: -1.0
Down 3 steps: -1.5
```

---

### 6. TERMINAL PENALTIES

**Episode-ending failures:**
```javascript
Death:        -5.0  // ❌ Game over
Out of bounds: -5.0  // ❌ Game over
```

---

## Example Action Sequences

### Scenario 1: Good Forward Movement

```
Action: FORWARD
Before: z=3, y=0.5, step=-1 (ground)
After:  z=2.5, y=0.5, step=-1

Rewards:
  Moved toward stairs: +0.2 ✅
  Still off stairs:    -0.1
  Total:               +0.1 ✅

Agent learns: "Forward is good!"
```

---

### Scenario 2: Productive Jump

```
Action: JUMP
Before: z=0.5, y=0.5, step=-1 (ground)
After:  z=0, y=1.5, step=0 (Step 0!)

Rewards:
  Moved toward stairs: +0.2
  Height gain:         +0.5 (1.0 * 0.5)
  Got on stairs:       +0.5
  Reached Step 0:      +2.0 ✅✅
  Productive jump:     +0.5 ✅
  On stairs bonus:     +0.05
  Total:               +3.75 ✅✅✅

Agent learns: "THAT jump was AMAZING!"
```

---

### Scenario 3: Wasteful Jump

```
Action: JUMP
Before: z=5, y=0.5, step=-1 (ground)
After:  z=5, y=1.2, step=-1 (still ground)

Rewards:
  No progress:         0
  Height gain:         +0.35 (0.7 * 0.5)
  Still off stairs:    -0.1
  Wasteful jump:       -0.3 ❌
  Total:               -0.05 ❌

Agent learns: "That jump was useless!"
```

---

### Scenario 4: Moving Away

```
Action: BACKWARD
Before: z=2, y=0.5, step=-1
After:  z=2.5, y=0.5, step=-1

Rewards:
  Moved away from stairs: -0.2 ❌
  Still off stairs:       -0.1
  Total:                  -0.3 ❌

Agent learns: "Backward is bad!"
```

---

### Scenario 5: Climbing Multiple Steps

```
Episode actions:
1. FORWARD: +0.1 (toward stairs)
2. FORWARD: +0.1 (toward stairs)
3. JUMP: +3.75 (reached Step 0!)
4. FORWARD: +0.25 (on stairs, toward goal)
5. JUMP: +3.35 (reached Step 1!)
6. FORWARD: +0.25
7. JUMP: +3.2 (reached Step 2!)

Total: +11.0 ✅✅✅

Agent learns: "This sequence is OPTIMAL!"
```

---

## Comparison: Old vs New

### OLD System (Confusing):
```
Episode 1:
  500 actions taken
  Final reward: -255.78
  Agent thinks: "Which of my 500 actions caused this??" 🤷

Agent learns: Nothing useful
```

### NEW System (Clear):
```
Episode 1:
  Action 1 (FORWARD): +0.1 ✅
  Action 2 (FORWARD): +0.1 ✅
  Action 3 (JUMP): +3.75 ✅✅✅
  Action 4 (BACKWARD): -0.3 ❌
  ...

Agent learns: "Forward and jump to stairs = good!"
```

---

## Why This Works

### 1. Immediate Credit Assignment
```
OLD: "I got -255 after 500 steps... why?"
NEW: "I got +3.75 for THAT jump!" ✅
```

### 2. Dense Rewards
```
OLD: Sparse rewards every 100 steps
NEW: Reward EVERY SINGLE STEP ✅
```

### 3. Clear Cause-Effect
```
OLD: Abstract penalties accumulate
NEW: "This action → This consequence → This reward" ✅
```

### 4. Proportional Feedback
```
OLD: Binary (good/bad)
NEW: Proportional (how good/bad) ✅
```

---

## Expected Training Behavior

### Episodes 1-20: Discovery
```
Agent tries random actions
Gets immediate feedback on each
Discovers: "Forward toward stairs = +0.2"
Discovers: "Jump to stairs = +3.75"
Average reward: -50 to 0
```

### Episodes 21-50: Learning
```
Agent starts moving toward stairs
Tries jumping at different positions
Discovers optimal jump timing
Average reward: 0 to +5
```

### Episodes 51-100: Optimization
```
Agent consistently reaches Step 0-2
Learns to chain actions
Discovers: "Forward → Forward → Jump = +4.0"
Average reward: +5 to +10
```

### Episodes 100+: Mastery
```
Agent climbs to Step 5+
Efficient action sequences
Minimal wasted actions
Average reward: +10 to +20
```

---

## Key Changes from Previous System

| Aspect | Old | New | Why Better |
|--------|-----|-----|-----------|
| **Movement reward** | 0 | **±0.2** | Immediate feedback |
| **Height reward** | 0 | **±0.5** | Proportional to gain |
| **Step reward** | +1.0 | **+2.0** | Bigger signal |
| **Productive jump** | +0.1 | **+0.5** | Much clearer |
| **Wasteful jump** | -0.08 | **-0.3** | Stronger deterrent |
| **Position bonus** | Complex | **Simple** | Clear signal |
| **Terminal penalty** | -10.0 | **-5.0** | Less catastrophic |
| **Accumulating penalties** | Yes | **No** | Simpler |
| **Episode penalties** | Yes | **No** | Focus on actions |

---

## Reward Range

**Per action:**
```
Best:  +3.75 (productive jump to new step)
Worst: -5.0 (death/out of bounds)
Typical good: +0.2 to +0.5
Typical bad: -0.1 to -0.3
```

**Per episode:**
```
Terrible: -50 (all bad actions)
Bad: -10 to 0 (mostly bad actions)
Okay: 0 to +5 (some good actions)
Good: +5 to +15 (reaching Step 2-3)
Great: +15 to +30 (reaching Step 5+)
Perfect: +30+ (reaching goal)
```

---

## Summary

**Every action now gets IMMEDIATE, CLEAR feedback:**

1. ✅ **Move toward stairs** → +0.2
2. ✅ **Gain height** → +0.5 per unit
3. ✅ **Get on stairs** → +0.5
4. ✅ **Reach new step** → +2.0
5. ✅ **Productive jump** → +0.5 bonus
6. ❌ **Move away** → -0.2
7. ❌ **Lose height** → -0.3 per unit
8. ❌ **Fall off stairs** → -0.5
9. ❌ **Wasteful jump** → -0.3
10. ❌ **Backward movement** → -0.5 per step

**Result:** Agent knows EXACTLY which actions are good/bad!

**No more confusion. Crystal clear cause-and-effect!** 🎯
