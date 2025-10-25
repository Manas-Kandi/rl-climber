# Action Plan: Get Agent Climbing

## The Problem
Agent sits on starting platform and doesn't move toward stairs.

## The Fix
Added forward progress reward - agent now gets increasing rewards for moving toward stairs.

## What You Need to Do

### Step 1: Reset the Model
The old model learned bad behavior (sitting = good). Reset it:

```javascript
resetModel(window.climbingGame)
```

When prompted:
- **Reinitialize neural networks?** → YES (start completely fresh)
- **Clear localStorage?** → YES (remove old saved model)

### Step 2: Start Training
Click "Start Training" button

### Step 3: Watch for Progress
Monitor these indicators:

**First 20 episodes:**
- Agent should explore randomly
- Occasionally moves forward
- Rewards: 0-10 range

**Episodes 20-50:**
- Agent starts moving forward more often
- Console shows "NEW STEP 0!" occasionally
- Rewards: 5-30 range

**Episodes 50-100:**
- Agent consistently reaches Step 0
- Sometimes reaches Step 1
- Rewards: 20-60 range

**Episodes 100+:**
- Agent climbs multiple steps
- Rewards: 50-200+ range

### Step 4: Verify It's Working
After 50 episodes, check:
- Average reward > 5
- Max reward > 20
- Highest step ≥ 0
- Console shows "NEW STEP" messages

## If Agent Still Sits

### Quick Diagnostic
```javascript
// Check reward gradient
const env = window.climbingGame.environment;
const physics = window.climbingGame.physicsEngine;

physics.setBodyPosition(env.agentBody, {x: 0, y: 1, z: 3});
console.log('At start:', env.calculateReward(env.getState(), 0, env.getState()));

physics.setBodyPosition(env.agentBody, {x: 0, y: 1, z: 2});
console.log('Forward 1:', env.calculateReward(env.getState(), 0, env.getState()));

physics.setBodyPosition(env.agentBody, {x: 0, y: 1, z: 0});
console.log('At Step 0:', env.calculateReward(env.getState(), 0, env.getState()));
```

Should see: ~0.3 → ~0.8 → ~22

### If Gradient is Wrong
The forward progress reward might not be applied. Check:
```javascript
const env = window.climbingGame.environment;
console.log('Config:', env.config);
```

### If Gradient is Right But Agent Still Sits
Increase exploration:
```javascript
const agent = window.climbingGame.agent;
agent.epsilon = 1.0;  // Full exploration
agent.epsilonDecay = 0.995;  // Slower decay
```

## Expected Reward Structure

| Position | Height | Progress | Step | Total |
|----------|--------|----------|------|-------|
| z=3 (start) | +0.3 | +0.0 | - | **+0.3** |
| z=2 (forward) | +0.3 | +0.5 | - | **+0.8** |
| z=1 (closer) | +0.3 | +1.0 | - | **+1.3** |
| z=0 (Step 0) | +0.3 | +1.5 | +20 | **+22** |
| z=-2 (Step 1) | +0.6 | +2.5 | +40 | **+43** |

Clear gradient: Moving forward = more reward!

## Success Criteria

After 100 episodes, you should see:
- ✅ Average reward > 10
- ✅ Max reward > 50
- ✅ Highest step ≥ 2
- ✅ Agent moves forward consistently
- ✅ Console shows "NEW STEP" messages

## Timeline

- **Minutes 1-5**: Reset model, start training
- **Minutes 5-15**: Watch first 50 episodes, verify movement
- **Minutes 15-30**: Continue to 100 episodes, see climbing
- **Minutes 30-60**: Continue to 200+ episodes, see mastery

## Quick Commands

```javascript
// Reset everything
resetModel(window.climbingGame)

// Check current state
const env = window.climbingGame.environment;
const physics = window.climbingGame.physicsEngine;
console.log('Position:', physics.getBodyPosition(env.agentBody));
console.log('Step:', env.detectCurrentStep());

// Check agent stats
const agent = window.climbingGame.agent;
console.log('Epsilon:', agent.epsilon);
console.log('Memory size:', agent.memory?.buffer?.length || 0);

// Force exploration
agent.epsilon = 1.0;

// Check training stats
const orch = window.climbingGame.orchestrator;
console.log('Episode:', orch.currentEpisode);
console.log('Avg reward:', orch.rewardHistory.slice(-10).reduce((a,b)=>a+b,0)/10);
```

## Bottom Line

1. **Reset model**: `resetModel(window.climbingGame)`
2. **Start training**: Click button
3. **Wait 50 episodes**: ~5-10 minutes
4. **Verify progress**: Agent should move forward and reach Step 0

The forward progress reward creates a clear gradient that guides the agent from the starting platform to the stairs. With a fresh model, it should learn this quickly!
