# 🎯 Action-Outcome Reward System V2

## The Philosophy Shift

**OLD:** Episode-level rewards (reaching Step 5 = +50 total)
**NEW:** Action-level rewards (this action landed on stairs = +5 immediately)

**Why:** Agent learns EXACTLY which actions are good, not just which episodes are good!

---

## Complete Reward Structure

### ACTION-OUTCOME REWARDS (High Weight)

#### 1. Landed on Stairs
```
Previous: On ground
Action: Forward/Jump
Result: On stairs
Reward: +5.0 ✅✅

Message: "✅ ACTION RESULT: Landed on stairs! +5.0"
```

#### 2. Climbed Higher
```
Previous: On Step 2
Action: Forward/Jump
Result: On Step 3
Reward: +3.0 per step ✅

Message: "✅ ACTION RESULT: Climbed 1 step(s)! +3.0"
```

#### 3. Fell Off Stairs
```
Previous: On Step 1
Action: Backward/Jump
Result: On ground
Reward: -2.0 ❌

Message: "❌ ACTION RESULT: Fell off stairs! -2.0"
```

#### 4. Moved Down
```
Previous: On Step 3
Action: Backward
Result: On Step 2
Reward: -2.0 per step ❌

Message: "❌ ACTION RESULT: Moved down 1 step(s)! -2.0"
```

#### 5. Moving Toward Stairs (on ground)
```
Action: Forward
Result: Closer to stairs
Reward: +0.5

Action: Backward
Result: Further from stairs
Reward: -0.5
```

---

### EPISODE-LEVEL REWARDS (Very Low Weight)

#### Milestone Bonus
```
Reached new highest step
Reward: +0.5 (VERY SMALL)

Message: "📈 Episode milestone: Step 3 (+0.5 bonus)"
```

**Why so small?** Because the ACTION already got +5.0 for landing on stairs!

---

### TERMINAL PENALTIES (Moderate)

#### Death/Out of Bounds
```
Reward: -10.0 (moderate, not catastrophic)
```

#### Buffer Expired
```
Reward: -10.0 (moderate, not catastrophic)
```

**Why moderate?** Because we want to focus on action-level learning, not episode-level punishment!

---

## Reward Comparison

### OLD System (Episode-Level):
```
Episode 1:
  - Reached Step 0: +10.0
  - Reached Step 1: +9.5
  - Reached Step 2: +9.0
  Total: +28.5

Agent learns: "This episode was good"
Problem: Doesn't know WHICH actions were good!
```

### NEW System (Action-Level):
```
Episode 1:
  Step 10: Forward → Landed on Step 0 → +5.0 ✅
  Step 20: Jump → Climbed to Step 1 → +3.0 ✅
  Step 30: Jump → Climbed to Step 2 → +3.0 ✅
  Step 40: Backward → Fell off → -2.0 ❌
  Step 50: Forward → Landed on Step 0 → +5.0 ✅
  Total: +14.0

Agent learns: "Forward/Jump to stairs = +5.0!"
Agent learns: "Backward on stairs = -2.0!"
```

---

## Example Action Sequences

### Sequence 1: Good Climbing
```
Action 1: Forward (on ground)
  → Moved toward stairs: +0.5
  
Action 2: Forward (on ground)
  → Moved toward stairs: +0.5
  
Action 3: Jump (on ground)
  → Landed on Step 0: +5.0 ✅✅
  → Episode milestone: +0.5
  → Total: +6.0 for this action!
  
Action 4: Forward (on Step 0)
  → Climbed to Step 1: +3.0 ✅
  → Episode milestone: +0.5
  → Total: +3.5 for this action!
  
Action 5: Jump (on Step 1)
  → Climbed to Step 2: +3.0 ✅
  → Episode milestone: +0.5
  → Total: +3.5 for this action!

Total sequence: +13.5 ✅✅✅
```

### Sequence 2: Bad Actions
```
Action 1: Backward (on ground)
  → Moved away from stairs: -0.5
  
Action 2: Backward (on ground)
  → Moved away from stairs: -0.5
  
Action 3: Jump (on ground, far from stairs)
  → Still on ground: 0
  
Action 4: Backward (on ground)
  → Moved away from stairs: -0.5

Total sequence: -1.5 ❌
```

### Sequence 3: Climbing then Falling
```
Action 1: Jump (on Step 2)
  → Climbed to Step 3: +3.0 ✅
  
Action 2: Backward (on Step 3)
  → Moved to Step 2: -2.0 ❌
  
Action 3: Backward (on Step 2)
  → Fell to ground: -2.0 ❌

Total sequence: -1.0 ❌
```

---

## Reward Weights

| Reward Type | Weight | Frequency | Impact |
|-------------|--------|-----------|--------|
| **Landed on stairs** | +5.0 | Rare | HIGH |
| **Climbed up** | +3.0/step | Rare | HIGH |
| **Fell off** | -2.0 | Rare | MEDIUM |
| **Moved down** | -2.0/step | Rare | MEDIUM |
| **Toward stairs** | +0.5 | Common | LOW |
| **Away from stairs** | -0.5 | Common | LOW |
| **Episode milestone** | +0.5 | Rare | VERY LOW |
| **Terminal failure** | -10.0 | Very rare | MEDIUM |

---

## Why This Works Better

### 1. Immediate Credit Assignment
```
OLD: "I got +28.5 this episode... which of my 500 actions caused that?"
NEW: "Action 3 gave me +5.0! That's the one!" ✅
```

### 2. Clear Action-Consequence
```
OLD: "Reaching Step 5 is good"
NEW: "THIS jump to stairs is good" ✅
```

### 3. Dense Rewards
```
OLD: Sparse rewards every 50-100 steps
NEW: Reward EVERY action that matters ✅
```

### 4. Proportional Feedback
```
OLD: Step 0 = +10, Step 1 = +9.5 (similar)
NEW: Landing = +5, Climbing = +3 (clear difference) ✅
```

---

## Expected Training Behavior

### Episodes 1-50:
```
Agent tries random actions
Gets +5.0 for landing on stairs
Learns: "Forward + Jump = +5.0!"
Average reward per action: -0.5 to +0.5
```

### Episodes 51-100:
```
Agent consistently lands on stairs
Gets +3.0 for climbing
Learns: "Forward on stairs = +3.0!"
Average reward per action: +0.5 to +1.0
```

### Episodes 100-200:
```
Agent climbs multiple steps
Chains good actions together
Learns: "Forward → Jump → Forward = +11.0!"
Average reward per action: +1.0 to +2.0
```

### Episodes 200+:
```
Agent masters climbing
Efficient action sequences
Minimal wasted actions
Average reward per action: +2.0 to +3.0
```

---

## Frontend Chart Suggestion

### New Chart: "Action Rewards"
```
X-axis: Step number (within episode)
Y-axis: Reward per action
Plot: Line chart showing reward for each action

This shows:
- Which actions get positive rewards
- When agent makes good/bad decisions
- Learning progress within episodes
```

### Existing Chart: "Episode Rewards"
```
Keep this! But now it shows:
- Sum of all action rewards
- Episode milestones (small)
- Overall episode performance
```

---

## Summary

**Action-Outcome Rewards (High Weight):**
- Landed on stairs: +5.0
- Climbed up: +3.0 per step
- Fell off: -2.0
- Moved down: -2.0 per step
- Toward/away stairs: ±0.5

**Episode-Level Rewards (Very Low Weight):**
- Milestone bonus: +0.5 (tiny!)

**Terminal Penalties (Moderate):**
- Death/Out of bounds: -10.0
- Buffer expired: -10.0

**Result:** Agent learns from EVERY action, not just episodes! 🎯
