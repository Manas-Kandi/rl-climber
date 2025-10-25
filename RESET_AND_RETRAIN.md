# 🔄 Reset and Retrain Guide

## The Problem

After 111 episodes: **-64.99 average reward, 0% success rate**

The agent reached Step 2 once but is now stuck on ground. This means:
1. ✅ The agent CAN physically reach stairs (it did once)
2. ❌ The agent learned a BAD policy from previous reward systems
3. ❌ The agent is stuck in a local minimum

## Why This Happens

**The agent's neural network remembers the OLD reward system:**
- Old system: "Being on Step 0 = +45 reward"
- New system: "Being on Step 0 = +2.0 reward"
- Agent's brain: "I learned Step 0 is amazing, why try harder?"

**Result:** Agent is stuck with outdated knowledge!

## The Solution: Reset + Retrain

### Option 1: Reset Networks (Recommended)

**In browser console:**
```javascript
// Reset the agent's brain to random weights
app.agent.resetNetworks();

// Start training fresh
// The agent will explore from scratch with new reward system
```

**What this does:**
- Deletes all learned knowledge
- Resets networks to random weights
- Agent explores from scratch
- Learns the NEW reward system

---

### Option 2: Increase Exploration (Already Done)

I've already increased the entropy coefficient:
```javascript
// OLD
entropyCoef: 0.05  // Some exploration

// NEW
entropyCoef: 0.2   // MASSIVE exploration!
```

**What this does:**
- Forces agent to try random actions
- Prevents getting stuck in local minimum
- Discovers new strategies

---

### Option 3: Increase Learning Rate (Already Done)

I've already increased the learning rate:
```javascript
// OLD
learningRate: 0.003

// NEW
learningRate: 0.01  // 3x faster unlearning!
```

**What this does:**
- Agent unlearns bad policy faster
- Adapts to new reward system quicker
- Overcomes local minimum

---

## How to Reset and Retrain

### Step 1: Stop Current Training
```
Click "Stop Training" button
```

### Step 2: Reset Networks
```javascript
// In browser console (F12)
app.agent.resetNetworks();
```

You should see:
```
🔄 Resetting networks to random initialization...
✅ Networks reset! Agent will explore from scratch.
```

### Step 3: Start Training Again
```
Click "Visual Training" or "Fast Training"
```

### Step 4: Watch for Progress
```
Episode 1-10: Random exploration
Episode 11-30: Discovers forward movement
Episode 31-50: Reaches Step 0
Episode 51-100: Climbs to Step 2-3
```

---

## What to Expect

### With Reset Networks:

**Episodes 1-20:**
```
Avg Reward: -10 to 0
Behavior: Random exploration
Learning: "Forward toward stairs = +0.2"
```

**Episodes 21-50:**
```
Avg Reward: 0 to +5
Behavior: Moving toward stairs
Learning: "Jump to stairs = +2.5"
```

**Episodes 51-100:**
```
Avg Reward: +5 to +15
Behavior: Reaching Step 0-2
Learning: "Climb higher = more reward"
```

**Episodes 100+:**
```
Avg Reward: +15 to +30
Behavior: Climbing to Step 5+
Learning: "Optimal climbing sequence"
```

---

### Without Reset (Just Higher Exploration):

**Episodes 1-50:**
```
Avg Reward: -50 to -20
Behavior: Stuck in old policy
Learning: Slowly unlearning bad habits
```

**Episodes 51-100:**
```
Avg Reward: -20 to 0
Behavior: Starting to explore
Learning: Discovering new strategies
```

**Episodes 100-200:**
```
Avg Reward: 0 to +10
Behavior: Reaching stairs
Learning: New reward system
```

**Result:** Takes 2-3x longer but eventually works

---

## Diagnostic Logging

I've added logging every 100 steps:
```
📊 Step 100: Reward=-0.15, Pos=(0.5, 0.5, 2.8), OnStep=-1
📊 Step 200: Reward=+0.20, Pos=(0.2, 0.6, 1.5), OnStep=-1
📊 Step 300: Reward=+2.50, Pos=(0.0, 1.5, 0.0), OnStep=0
```

**What to look for:**
- Reward trending upward? ✅ Learning!
- Z position decreasing? ✅ Moving toward stairs!
- OnStep increasing? ✅ Climbing!

---

## Why Reset is Better

### Without Reset:
```
Agent: "I learned Step 0 = +45"
New system: "Step 0 = +2.0"
Agent: "That's worse! I'll stay on ground"
Result: Stuck for 100+ episodes
```

### With Reset:
```
Agent: "I know nothing"
New system: "Step 0 = +2.0"
Agent: "That's the best I've seen!"
Result: Learns in 50 episodes
```

---

## Alternative: Delete Saved Model

If reset doesn't work, delete the saved model:

**In browser console:**
```javascript
// Delete saved model from IndexedDB
await app.modelManager.deleteModel();

// Refresh page
location.reload();
```

**What this does:**
- Deletes all saved weights
- Forces fresh start on page load
- Guaranteed clean slate

---

## Hyperparameter Changes Made

| Parameter | Old | New | Effect |
|-----------|-----|-----|--------|
| **Entropy Coef** | 0.05 | **0.2** | 4x more exploration |
| **Learning Rate** | 0.003 | **0.01** | 3x faster learning |
| **Clip Epsilon** | 0.3 | **0.3** | Same |
| **Epochs** | 20 | **20** | Same |

**Result:** Agent will explore MUCH more and learn MUCH faster!

---

## Quick Commands

### Reset Networks:
```javascript
app.agent.resetNetworks();
```

### Check Current Hyperparameters:
```javascript
app.agent.getHyperparameters();
```

### Update Hyperparameters:
```javascript
app.agent.updateHyperparameters({
    entropyCoef: 0.3,  // Even more exploration
    learningRate: 0.02  // Even faster learning
});
```

### Delete Saved Model:
```javascript
await app.modelManager.deleteModel();
```

---

## Summary

**The agent is stuck because it learned a bad policy from the old reward system.**

**Solutions (in order of preference):**

1. ✅ **Reset networks** (fastest, cleanest)
   ```javascript
   app.agent.resetNetworks();
   ```

2. ✅ **Wait for high exploration to work** (slower, but automatic)
   - Already increased entropy to 0.2
   - Will eventually unlearn bad policy
   - Takes 100-200 episodes

3. ✅ **Delete saved model** (nuclear option)
   ```javascript
   await app.modelManager.deleteModel();
   location.reload();
   ```

**Recommendation:** Reset networks and start training fresh!

The new action-consequence reward system is MUCH clearer, the agent just needs to forget the old system first! 🔄
