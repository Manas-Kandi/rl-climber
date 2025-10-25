# Action Space Reference

## Action Definitions

The agent has 6 discrete actions available:

| Action ID | Name | Direction | Force Vector | Use Case |
|-----------|------|-----------|--------------|----------|
| 0 | FORWARD | -Z | (0, 0, -8.0) | Move toward stairs from start |
| 1 | BACKWARD | +Z | (0, 0, +8.0) | Move away from stairs |
| 2 | LEFT | -X | (-8.0, 0, 0) | Move left |
| 3 | RIGHT | +X | (+8.0, 0, 0) | Move right |
| 4 | JUMP | +Y | (0, +8.0, 0) | Jump upward (impulse) |
| 5 | GRAB | +Y | (0, +20.0, 0) | Pull up on ledge |

## Coordinate System

```
        +Y (up)
         |
         |
         |
         +-------- +X (right)
        /
       /
      +Z (backward/away from camera)
```

## Staircase Scene Layout

```
Agent Start: (0, 1, 3)
    |
    | FORWARD action (negative Z)
    v
Step 0: z=0, y=1
    |
    v
Step 1: z=-2, y=2
    |
    v
Step 2: z=-4, y=3
    |
    v
... (continues to Step 9)
    |
    v
Goal: z=-20, y=10.5
```

## Action Constraints

### JUMP (4)
- **Requires**: Agent must be grounded (touching ground or ledge)
- **Cooldown**: 5 steps between jumps
- **Effect**: Applies upward impulse (instant velocity change)
- **Penalty**: No force applied if not grounded or on cooldown

### GRAB (5)
- **Requires**: Agent must be touching a ledge
- **Effect**: Applies upward force to pull up
- **Penalty**: No force applied if not touching ledge

### Movement (0-3)
- **No constraints**: Can always be used
- **Effect**: Applies continuous force in specified direction
- **Physics**: Subject to damping and friction

## Force Magnitudes

- **Movement force**: 8.0 units
- **Jump impulse**: 8.0 units (instant)
- **Grab force**: 20.0 units (continuous)

## Physics Settings

- **Gravity**: -9.81 m/s²
- **Linear damping**: 0.3 (friction)
- **Angular damping**: 0.5 (rotation resistance)
- **Agent mass**: 1.0 kg

## Common Action Sequences

### Climbing Stairs
1. **FORWARD (0)** - Move toward first step
2. **JUMP (4)** - Jump onto step
3. **FORWARD (0)** - Move to next step
4. **JUMP (4)** - Jump to next step
5. Repeat...

### Recovering from Fall
1. **JUMP (4)** - Get back up if fallen
2. **FORWARD/BACKWARD/LEFT/RIGHT** - Reposition
3. Continue climbing

### Precise Positioning
1. **LEFT/RIGHT (2/3)** - Align with step center
2. **FORWARD (0)** - Move onto step
3. **JUMP (4)** - Climb to next level

## Testing Actions

```javascript
// Test individual actions
const env = window.climbingGame.environment;

// Reset to start
env.reset();

// Take FORWARD action (toward stairs)
env.step(0);

// Take JUMP action
env.step(4);

// Check position
const physics = window.climbingGame.physicsEngine;
const pos = physics.getBodyPosition(env.agentBody);
console.log('Position:', pos);

// Check current step
const step = env.detectCurrentStep();
console.log('Current step:', step);
```

## Action Selection Strategy

### Random Exploration (High Epsilon)
```javascript
if (Math.random() < epsilon) {
  action = Math.floor(Math.random() * 6);  // Random action
}
```

### Greedy Policy (Low Epsilon)
```javascript
action = agent.selectAction(state, epsilon);  // Use neural network
```

### Optimal Strategy (Learned)
After training, the agent learns:
- Use FORWARD to approach steps
- Use JUMP to climb up
- Use LEFT/RIGHT to stay centered
- Avoid BACKWARD (moves away from goal)
- Use GRAB when on ledges

## Debugging Actions

```javascript
// Log action taken
const actionNames = ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'JUMP', 'GRAB'];
console.log('Action:', actionNames[action]);

// Check if action had effect
const posBefore = physics.getBodyPosition(env.agentBody);
env.step(action);
const posAfter = physics.getBodyPosition(env.agentBody);
console.log('Movement:', {
  dx: posAfter.x - posBefore.x,
  dy: posAfter.y - posBefore.y,
  dz: posAfter.z - posBefore.z
});
```
