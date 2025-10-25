# Reward System Fix for Staircase Climbing

## Problem
The agent was not learning to climb the stairs because:
1. **Broken step detection** - Collision-based detection was unreliable
2. **Weak reward signals** - Not enough incentive to climb
3. **Conflicting rewards** - Different reward components were fighting each other
4. **No gradient** - Agent couldn't learn intermediate steps toward goal

## Solution

### 1. Position-Based Step Detection
Instead of relying on collision detection, we now detect steps based on the agent's position:
- Each step has a known Z position range
- Agent must be within X bounds (±2.5 units)
- Agent must be at approximately the right height
- Much more reliable than collision detection

```javascript
// Step 0: z = 0 to -2, height ≈ 1
// Step 1: z = -1 to -3, height ≈ 2
// Step 2: z = -2 to -4, height ≈ 3
// etc.
```

### 2. Clear Reward Structure

#### Primary Reward: Reaching New Steps
- **Step 0**: +20 points
- **Step 1**: +40 points
- **Step 2**: +60 points
- **Step N**: +(N+1) × 20 points

This creates a strong incentive to progress up the stairs.

#### Continuous Height Reward
- **+0.3 per unit height**
- Provides gradient between steps
- Helps agent learn to climb even when not on a step

#### Proximity to Next Step
- **Up to +1.0 for being close to next step**
- Inverse distance reward
- Guides agent toward the next objective

#### Staying on Steps Bonus
- **+0.5 per timestep on any step**
- Encourages staying on stairs vs falling off

#### Penalties
- **-0.5 for being off-center** (|x| > 1.5)
- **-0.01 per timestep** (efficiency pressure)
- **-50 for falling** (y < -2)
- **-50 for out of bounds**

### 3. Reward Gradient Example

Moving from ground to Step 1:
```
Position (y, z)  | Step | Reward Components
(1.0, 2.0)       | -1   | height: 0.3, time: -0.01 = 0.29
(1.0, 1.0)       | -1   | height: 0.3, proximity: 0.5 = 0.79
(1.0, 0.0)       | 0    | height: 0.3, step: 20, on_step: 0.5 = 20.79
(1.5, -0.5)      | 0    | height: 0.45, on_step: 0.5, proximity: 0.8 = 1.75
(2.0, -1.0)      | 1    | height: 0.6, step: 40, on_step: 0.5 = 41.1
```

The agent gets:
1. Small continuous rewards for moving in the right direction
2. Large discrete rewards for reaching new steps
3. Bonus for staying on steps
4. Guidance toward the next step

## Testing

Run in browser console:
```javascript
testRewards(window.climbingGame)
```

This will verify:
- Start position is correct (z=3)
- Step detection works at all positions
- Rewards increase when climbing
- Gradient exists between steps
- Actions move agent correctly

## Expected Behavior

With these changes, the agent should:
1. **Start at (0, 1, 3)** - in front of the stairs
2. **Learn to move forward** (FORWARD action = negative Z direction) toward stairs
3. **Get immediate feedback** when reaching each step
4. **Follow the reward gradient** between steps
5. **Progressively climb** all 10 steps to reach the goal

## Action Space
- **FORWARD (0)**: Move in negative Z direction (toward stairs from start position)
- **BACKWARD (1)**: Move in positive Z direction (away from stairs)
- **LEFT (2)**: Move in negative X direction
- **RIGHT (3)**: Move in positive X direction
- **JUMP (4)**: Jump upward
- **GRAB (5)**: Grab ledge (when touching one)

## Key Metrics to Watch

During training, you should see:
- **Highest step reached** increasing over episodes
- **Total reward** growing as agent climbs higher
- **Episode length** initially short, then longer as agent explores
- **Success rate** (reaching goal) increasing after ~100-200 episodes

## Hyperparameter Recommendations

For staircase scene:
- **Max steps**: 500 (enough time to climb all stairs)
- **Epsilon decay**: 0.998 (explore longer)
- **Learning rate**: 0.001 (learn faster)
- **Batch size**: 64 (more stable)
- **Target update**: 50 (update more frequently)

These are already set in the default config.
