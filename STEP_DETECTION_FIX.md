# Step Detection Fix

## Problem
The step detection was using incorrect Z position calculations, causing steps to be detected incorrectly.

## Root Cause
The staircase scene creates steps with:
- **Step depth**: 2.0 units
- **Step positions**: z = -2*i (where i is step number)
  - Step 0: z = 0 (ranges from -1 to +1)
  - Step 1: z = -2 (ranges from -3 to -1)
  - Step 2: z = -4 (ranges from -5 to -3)
  - etc.

But the detection code was using:
- **Incorrect calculation**: z = -1.5*i
- This caused off-by-one errors in step detection

## Solution

### Updated Step Detection Logic

```javascript
// Correct step positions
for (let i = 0; i < 10; i++) {
  const stepCenterZ = -2.0 * i;  // Steps at 0, -2, -4, -6, -8, -10, -12, -14, -16, -18
  const stepMinZ = stepCenterZ - 1.0;  // Each step is 2 units deep
  const stepMaxZ = stepCenterZ + 1.0;
  
  // Check if agent is within this step's Z range
  if (agentPos.z >= stepMinZ && agentPos.z <= stepMaxZ) {
    // Also check height
    const expectedHeight = (i + 1) * 1.0;
    const heightDiff = Math.abs(agentPos.y - expectedHeight);
    
    if (heightDiff < 1.5) {
      return i;
    }
  }
}
```

### Step Layout

```
Step 0: center=(0, 0.5, 0),    ranges: x=[-2,+2], y=[0,1],   z=[-1,+1]
Step 1: center=(0, 1.5, -2),   ranges: x=[-2,+2], y=[1,2],   z=[-3,-1]
Step 2: center=(0, 2.5, -4),   ranges: x=[-2,+2], y=[2,3],   z=[-5,-3]
Step 3: center=(0, 3.5, -6),   ranges: x=[-2,+2], y=[3,4],   z=[-7,-5]
Step 4: center=(0, 4.5, -8),   ranges: x=[-2,+2], y=[4,5],   z=[-9,-7]
Step 5: center=(0, 5.5, -10),  ranges: x=[-2,+2], y=[5,6],   z=[-11,-9]
Step 6: center=(0, 6.5, -12),  ranges: x=[-2,+2], y=[6,7],   z=[-13,-11]
Step 7: center=(0, 7.5, -14),  ranges: x=[-2,+2], y=[7,8],   z=[-15,-13]
Step 8: center=(0, 8.5, -16),  ranges: x=[-2,+2], y=[8,9],   z=[-17,-15]
Step 9: center=(0, 9.5, -18),  ranges: x=[-2,+2], y=[9,10],  z=[-19,-17]
Goal:   center=(0, 10.5, -20), ranges: x=[-2,+2], y=[10,11], z=[-21,-19]
```

### Agent Start Position

```
Start: (0, 1, 3)
       x=0 (centered)
       y=1 (standing height)
       z=3 (in front of stairs)
```

## Action Directions

**Important**: The action names can be confusing!

- **FORWARD (action 0)**: Moves in **negative Z** direction (toward stairs)
- **BACKWARD (action 1)**: Moves in **positive Z** direction (away from stairs)

From the start position (z=3), the agent needs to use **FORWARD** to reach the stairs.

## Proximity Reward Update

Also updated the proximity reward to use correct step positions:

```javascript
// Old (incorrect)
const nextStepZ = -1.5 * (currentStep + 1);

// New (correct)
const nextStepZ = -2.0 * (currentStep + 1);
```

This ensures the agent gets rewarded for moving toward the actual next step position.

## Testing

Run the test to verify:
```javascript
testRewards(window.climbingGame)
```

Expected results:
- ✅ Step 0 detected at position (1, 0)
- ✅ Step 1 detected at position (2, -2)
- ✅ Step 2 detected at position (3, -4)
- ✅ FORWARD action moves agent toward stairs (z decreases)

## Files Modified

1. **src/rl/ClimbingEnvironment.js**
   - `detectCurrentStep()` - Fixed step position calculations
   - `calculateReward()` - Fixed proximity reward calculations

2. **src/test-rewards.js**
   - Updated to test FORWARD action instead of BACKWARD
   - Added clarification about action directions

3. **REWARD_SYSTEM_FIX.md**
   - Added action space documentation
   - Clarified movement directions

4. **ACTION_REFERENCE.md** (NEW)
   - Complete action space documentation
   - Coordinate system explanation
   - Testing examples

## Visual Reference

```
        Agent Start (0, 1, 3)
              |
              | Use FORWARD (0)
              v
        Step 0 (0, 1, 0)
              |
              | Use FORWARD (0) + JUMP (4)
              v
        Step 1 (0, 2, -2)
              |
              | Use FORWARD (0) + JUMP (4)
              v
        Step 2 (0, 3, -4)
              |
              v
            ... continues
              |
              v
        Goal (0, 10.5, -20)
```

## Impact on Learning

With correct step detection:
- Agent gets accurate feedback about which step it's on
- Rewards are triggered at the right positions
- Proximity rewards guide agent to correct locations
- Learning should be much more effective

The agent should now learn to:
1. Use FORWARD to approach stairs
2. Use JUMP to climb up
3. Chain these actions to climb all steps
4. Reach the goal consistently
