# Boundary System

## Problem

The agent was jumping off the platform at every opportunity because:
- ❌ No penalty for leaving the platform
- ❌ No boundaries defined
- ❌ Episode continued even when off platform
- ❌ No visual indication of platform edges

## Solution

### 1. Boundary Limits ✅
- **X Boundary**: ±10 units
- **Z Boundary**: ±10 units
- Matches the 20x20 ground size

### 2. Out of Bounds Detection ✅
```javascript
isOutOfBounds() {
  // Check if agent is outside ±10 in X or Z
  return Math.abs(x) > 10 || Math.abs(z) > 10;
}
```

### 3. Severe Penalty ✅
- **Reward**: -100 (worst possible)
- **Comparison**:
  - Fall penalty: -50
  - Out of bounds: **-100** (2x worse!)
  - Goal reached: +100

### 4. Episode Termination ✅
- Episode ends immediately when out of bounds
- Prevents agent from wandering off platform
- Forces agent to learn to stay on platform

### 5. Visual Boundaries ✅
- Red lines at platform edges
- Semi-transparent (50% opacity)
- Always visible
- Shows exactly where boundaries are

## Reward Structure

| Event | Reward | Notes |
|-------|--------|-------|
| Out of Bounds | **-100** | Worst outcome - episode ends |
| Fall | -50 | Bad but not as bad as leaving |
| Goal Reached | +100 | Best outcome |
| Ledge Contact | +5 | Encourages climbing |
| Height Gain | +1 per unit | Only when grounded |
| Survival | +0.1 per step | Small bonus |
| Time Penalty | -0.01 per step | Encourages efficiency |

## Configuration

### In Environment Config
```javascript
config: {
  boundaryX: 10.0,  // ±10 units in X
  boundaryZ: 10.0,  // ±10 units in Z
  rewardWeights: {
    outOfBounds: -100.0  // Severe penalty
  }
}
```

### Visual Boundaries
```javascript
// Red lines at edges
createBoundaryMarkers(10, 10);
```

## Expected Behavior

### Before Fix
- Agent jumps off platform randomly
- Explores outside boundaries
- No consequence for leaving
- Difficult to learn proper climbing

### After Fix
- Agent learns to stay on platform
- Avoids edges
- Focuses on climbing wall
- Better training efficiency

## Training Impact

### Early Training (0-100 episodes)
- Agent will test boundaries
- Get -100 penalty for leaving
- Quickly learn to avoid edges

### Mid Training (100-500 episodes)
- Agent stays on platform
- Focuses on climbing
- Better exploration of valid space

### Late Training (500+ episodes)
- Agent confidently stays on platform
- Efficient climbing behavior
- No wasted actions near edges

## Termination Reasons

Episodes can now end for:
1. `out_of_bounds` - Left the platform (-100)
2. `fallen` - Fell below threshold (-50)
3. `goal_reached` - Reached goal height (+100)
4. `max_steps` - Ran out of time (0)

## Visual Indicators

### Boundary Lines
- **Color**: Red (#ff0000)
- **Opacity**: 50%
- **Position**: Ground level (y=0)
- **Shape**: Rectangle around platform

### Platform Size
- **Width**: 20 units (±10)
- **Depth**: 20 units (±10)
- **Visible**: Red lines at edges

## Testing

To verify boundaries work:

```javascript
// In browser console
const env = window.climbingGame.environment;

// Test boundary detection
env.reset();
const pos = env.physicsEngine.getBodyPosition(env.agentBody);
console.log('Position:', pos);
console.log('Out of bounds:', env.isOutOfBounds());

// Move agent out of bounds
env.physicsEngine.setBodyPosition(env.agentBody, {x: 15, y: 1, z: 0});
console.log('Out of bounds:', env.isOutOfBounds()); // Should be true
```

## Future Enhancements

Possible improvements:
- Invisible walls at boundaries (physics-based)
- Gradient penalty (worse the further out)
- Warning zone near edges (visual feedback)
- Different boundary shapes
- Adjustable boundary size
- Boundary collision sounds
