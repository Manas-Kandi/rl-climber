# 🎯 Tiny Rewards Reference (Easy to Understand!)

## Why Tiny Rewards?

**Old system:** Episode rewards of -2495 (what does this mean??)
**New system:** Episode rewards of -5 to +15 (clear and interpretable!)

## Complete Reward Table

| Event | Old Reward | New Reward | Notes |
|-------|-----------|------------|-------|
| **Baseline (every step)** | -0.5 | **-0.01** | Small time penalty |
| **Being on ground** | -1.0 | **-0.02** | Slightly worse |
| **Being on stairs** | +1.0 | **+0.02** | Slightly better |
| **Exploration bonus** | +0.2 | **+0.005** | Tiny encouragement |
| **Off-center** | -0.3 | **-0.006** | Tiny penalty |
| **Forward movement** | +0.1 | **+0.002** | Tiny guidance |
| | | | |
| **Step 0 reached** | +50 | **+1.0** | Clear positive! |
| **Step 1 reached** | +45 | **+0.9** | Still great! |
| **Step 2 reached** | +40 | **+0.8** | Good progress! |
| **Step 3 reached** | +35 | **+0.7** | Keep going! |
| **Step 4 reached** | +30 | **+0.6** | Nice! |
| **Step 5 reached** | +25 | **+0.5** | Halfway! |
| **Step 6 reached** | +20 | **+0.4** | Almost there! |
| **Step 7 reached** | +15 | **+0.3** | So close! |
| **Step 8 reached** | +10 | **+0.2** | Nearly done! |
| **Step 9 reached** | +5 | **+0.1** | Last step! |
| **Goal reached** | +100 | **+10.0** | SUCCESS! |
| | | | |
| **Time decay (fresh)** | +2.0 | **+0.05** | Just arrived |
| **Time decay (30s)** | +1.0 | **+0.02** | Getting old |
| **Time decay (60s)** | 0.0 | **0.0** | Neutral |
| **Time decay (90s+)** | -5.0 | **-0.1** | Move on! |
| | | | |
| **Jump down 1 step** | -5 | **-0.1** | Small mistake |
| **Jump down 2 steps** | -10 | **-0.2** | Bigger mistake |
| **Fall off stairs** | -10 | **-0.2** | Oops |
| **Stagnation** | -10 | **-0.2** | Do something! |
| **Death (fall)** | -50 | **-1.0** | Episode over |
| **Out of bounds** | -50 | **-1.0** | Episode over |

## Expected Episode Rewards

### Terrible Episode (stuck on ground, 500 steps)
```
Baseline:     -0.01 × 500 = -5.0
Ground:       -0.02 × 500 = -10.0
Stagnation:   -0.2
Total:        ≈ -15
```
**Clear negative signal!**

### Bad Episode (wandering, 400 steps)
```
Baseline:     -0.01 × 400 = -4.0
Ground:       -0.02 × 300 = -6.0
Exploration:  +0.005 × 400 = +2.0
Total:        ≈ -8
```
**Still negative, but exploring helps**

### Okay Episode (reached Step 0, 300 steps)
```
Baseline:     -0.01 × 300 = -3.0
Ground:       -0.02 × 250 = -5.0
Stairs:       +0.02 × 50 = +1.0
Step 0:       +1.0
Total:        ≈ -6
```
**Still negative overall, but got +1.0 for progress!**

### Good Episode (reached Step 3, 350 steps)
```
Baseline:     -0.01 × 350 = -3.5
Steps 0-3:    +1.0 +0.9 +0.8 +0.7 = +3.4
Stairs:       +0.02 × 200 = +4.0
Total:        ≈ +4
```
**Positive! Agent knows it did well!**

### Great Episode (reached Step 7, 400 steps)
```
Baseline:     -0.01 × 400 = -4.0
Steps 0-7:    +1.0 +0.9 +0.8 +0.7 +0.6 +0.5 +0.4 +0.3 = +5.2
Stairs:       +0.02 × 300 = +6.0
Total:        ≈ +7
```
**Strong positive signal!**

### Perfect Episode (goal reached, 300 steps)
```
Baseline:     -0.01 × 300 = -3.0
All steps:    +1.0 +0.9 +0.8 +0.7 +0.6 +0.5 +0.4 +0.3 +0.2 +0.1 = +5.5
Goal:         +10.0
Stairs:       +0.02 × 200 = +4.0
Total:        ≈ +16
```
**Maximum reward! Clear success!**

## Interpretation Guide

| Episode Reward | Meaning | Agent Behavior |
|---------------|---------|----------------|
| **-15 to -10** | Terrible | Stuck on ground, not exploring |
| **-10 to -5** | Bad | Wandering aimlessly |
| **-5 to 0** | Poor | Trying but not reaching stairs |
| **0 to +2** | Okay | Reached Step 0 occasionally |
| **+2 to +5** | Good | Reaching Step 2-3 |
| **+5 to +10** | Great | Reaching Step 5-7 |
| **+10 to +16** | Excellent | Reaching goal! |

## Training Progress Expectations

### Episodes 1-20 (Random exploration)
- **Avg reward:** -12 to -8
- **Interpretation:** Agent is exploring, mostly on ground
- **What to look for:** Occasional +1.0 from reaching Step 0

### Episodes 21-50 (Learning basics)
- **Avg reward:** -8 to -2
- **Interpretation:** Agent learning that stairs give rewards
- **What to look for:** More frequent Step 0 reaches

### Episodes 51-100 (Climbing skills)
- **Avg reward:** -2 to +3
- **Interpretation:** Agent reaching Step 2-3 regularly
- **What to look for:** Consistent positive rewards

### Episodes 101-200 (Mastery)
- **Avg reward:** +3 to +8
- **Interpretation:** Agent reaching Step 5-7
- **What to look for:** Occasional goal reaches (+16)

### Episodes 200+ (Optimization)
- **Avg reward:** +8 to +12
- **Interpretation:** Agent consistently reaching high steps
- **What to look for:** 20-30% success rate

## Debugging with Tiny Rewards

### If avg reward is -15:
❌ Agent is completely stuck
→ Check if physics allows movement
→ Increase exploration (entropy)

### If avg reward is -8:
⚠️ Agent is exploring but not learning
→ Increase learning rate
→ Enable curriculum learning

### If avg reward is -2:
✅ Agent is learning! Just needs more time
→ Keep training
→ Watch for Step 0 reaches

### If avg reward is +5:
✅✅ Agent is doing well!
→ Increase difficulty (curriculum level)
→ Reduce max steps for faster episodes

### If avg reward is +12:
🎉 Agent has mastered the task!
→ Test in live play mode
→ Save the model

## Why This Is Better

### Old System Problems:
- Episode reward: -2495 (meaningless number)
- Can't tell if -2495 is good or bad
- Huge swings make debugging hard
- Network gets confused by scale

### New System Benefits:
- Episode reward: -8 or +5 (clear meaning!)
- Can immediately tell if agent is improving
- Small, consistent rewards
- Network learns stable policy

## The Math

All rewards scaled by **~0.02** (1/50):
- Old: +50 → New: +1.0 (50 × 0.02)
- Old: -50 → New: -1.0 (50 × 0.02)
- Old: +100 → New: +10.0 (but special case)

**Result:** Same relative importance, but interpretable scale!

## Quick Reference Card

```
GOOD THINGS (positive rewards):
  Step 0:     +1.0  ← Biggest regular reward
  Step 5:     +0.5  ← Halfway there
  Goal:       +10.0 ← Ultimate success
  On stairs:  +0.02 ← Small bonus

BAD THINGS (negative rewards):
  Baseline:   -0.01 ← Time passing
  On ground:  -0.02 ← Slightly worse
  Death:      -1.0  ← Episode ends
  Stagnation: -0.2  ← Do something!

EPISODE TOTALS:
  Stuck:      -15   ← Need help
  Exploring:  -8    ← Learning
  Step 0:     -6    ← Progress!
  Step 3:     +4    ← Good!
  Goal:       +16   ← Perfect!
```

Print this and keep it next to your monitor! 📋
