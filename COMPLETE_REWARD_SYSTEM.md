# Complete Reward System Reference

## Quick Overview

The reward system uses **action-consequence** feedback with a **safety buffer** and **absolute goal**.

## Reward Values

### 🏆 Success Rewards
| Event | Reward | Notes |
|-------|--------|-------|
| **Reach Goal Platform** | **+100.0** | Ultimate success! Episode ends. |
| Land on stairs (from ground) | +5.0 | First time getting on stairs |
| Climb 1 step up | +3.0 | Per step climbed |
| Reach new highest step | +0.5 | Episode milestone bonus |

### ❌ Failure Penalties
| Event | Penalty | Notes |
|-------|---------|-------|
| **Out of bounds** | **-50.0** | Episode ends immediately |
| **Buffer expired on ground** | **-50.0** | Episode ends immediately |
| Fall to death (y < -2) | -10.0 | Episode ends |
| Fall off stairs | -2.0 | Per action that causes fall |
| Move down steps | -2.0 | Per step descended |

### 📍 Movement Guidance (when on ground)
| Event | Reward | Notes |
|-------|--------|-------|
| Move toward stairs | +0.5 | Encourages finding stairs |
| Move away from stairs | -0.5 | Discourages wrong direction |

## Safety Buffer System

### How It Works
1. **Start**: 200 steps of grace period
2. **On stairs**: Buffer becomes INFINITE ♾️
3. **Leave stairs**: Buffer resets to 200 steps
4. **Buffer expires**: Episode ends with -50 penalty

### Purpose
- Gives agent time to find stairs at start
- Prevents getting stuck on ground forever
- Encourages staying on stairs once found
- Allows brief exploration off stairs

## Step Detection

| Step | Position | Height |
|------|----------|--------|
| Ground | z > 2 | y ≈ 0.5 |
| Step 0 | z ≈ 0 | y ≈ 1.0 |
| Step 1 | z ≈ -2 | y ≈ 2.0 |
| Step 2 | z ≈ -4 | y ≈ 3.0 |
| Step 3 | z ≈ -6 | y ≈ 4.0 |
| Step 4 | z ≈ -8 | y ≈ 5.0 |
| Step 5 | z ≈ -10 | y ≈ 6.0 |
| Step 6 | z ≈ -12 | y ≈ 7.0 |
| Step 7 | z ≈ -14 | y ≈ 8.0 |
| Step 8 | z ≈ -16 | y ≈ 9.0 |
| Step 9 | z ≈ -18 | y ≈ 10.0 |
| **GOAL** | **z ≈ -20** | **y ≈ 11.0** |

## Perfect Episode Example

Starting from ground, climbing all steps to goal:

```
Ground (z=3, y=0.5)
  ↓ Move toward stairs: +0.5 × N steps
Step 0 (z=0, y=1.0)
  ↓ Land on stairs: +5.0, milestone: +0.5
Step 1 (z=-2, y=2.0)
  ↓ Climb up: +3.0, milestone: +0.5
Step 2 (z=-4, y=3.0)
  ↓ Climb up: +3.0, milestone: +0.5
Step 3 (z=-6, y=4.0)
  ↓ Climb up: +3.0, milestone: +0.5
Step 4 (z=-8, y=5.0)
  ↓ Climb up: +3.0, milestone: +0.5
Step 5 (z=-10, y=6.0)
  ↓ Climb up: +3.0, milestone: +0.5
Step 6 (z=-12, y=7.0)
  ↓ Climb up: +3.0, milestone: +0.5
Step 7 (z=-14, y=8.0)
  ↓ Climb up: +3.0, milestone: +0.5
Step 8 (z=-16, y=9.0)
  ↓ Climb up: +3.0, milestone: +0.5
Step 9 (z=-18, y=10.0)
  ↓ Climb up: +3.0, milestone: +0.5
GOAL! (z=-20, y=11.0)
  ↓ Reach goal: +100.0

Total: ~137.0 (perfect climb)
```

## Boundaries

### X-axis (left/right)
- **Safe zone**: -10 to +10
- **Out of bounds**: |x| > 10

### Z-axis (forward/backward)
- **Safe zone**: -22 to +5
- **Out of bounds**: z < -22 or z > 5

### Y-axis (up/down)
- **Death threshold**: y < -2
- **Goal height**: y ≈ 11

## State Vector (13D)

The agent receives this information:
1. **Position**: x, y, z (normalized)
2. **Velocity**: vx, vy, vz (normalized)
3. **Distance to goal**: Euclidean distance
4. **Goal direction Z**: -1 (backward) or +1 (forward)
5. **Goal direction Y**: -1 (down) or +1 (up)
6. **Current step**: 0-10 (normalized)
7. **Distance to next step**: Euclidean distance
8. **On stairs**: 0 (no) or 1 (yes)
9. **Safety buffer**: 0-1 (normalized, 1 = infinite)

## Key Principles

1. **Action-Consequence**: Rewards are immediate feedback for actions
2. **Absolute Failures**: Ground/out-of-bounds are always bad
3. **Clear Goal**: +100 for reaching goal platform
4. **Progress Tracking**: Milestone bonuses for new steps
5. **Safety Buffer**: Grace period to find stairs
6. **No Exploitation**: Can't game the system by repeating actions

## Training Tips

- Agent should learn to move toward stairs (z=0)
- Once on stairs, stay on stairs (infinite buffer)
- Climb up step by step (+3.0 each)
- Reach goal platform for massive reward (+100)
- Avoid falling off or going out of bounds (-50)
