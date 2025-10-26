# 🚀 Training Quick Start Guide

## Start Training (3 Steps)

### 1. Open the App
```
Open index.html in your browser
```

### 2. Start Training
Click one of these buttons:
- **"Fast Training"** - No rendering, maximum speed
- **"Visual Training"** - See the agent learn in real-time

### 3. Monitor Progress
Open browser console and run:
```javascript
showTrainingStats()
```

---

## What You'll See

### In the UI (Top Right)
```
Model Info
  Version: v11
  Total Episodes: 50,100
  Best Reward: 97.27
```

### In the Console
```
🎯 CLIMBED 1 STEP(S)! +20.0
📈 NEW RECORD: Step 3! +10.0
🏆 GOAL REACHED! +100
```

### Training Stats (Run `showTrainingStats()`)
```
╔═══════════════════════════════════════════════╗
║         🎮 TRAINING STATISTICS                ║
╚═══════════════════════════════════════════════╝

📦 MODEL INFORMATION
   Version:              v11
   Total Episodes:       50,100
   Total Steps:          25,050,000
   
📈 PERFORMANCE METRICS
   Best Reward:          97.27
   Current Avg Reward:   45.32
   Success Rate:         52.9%
```

---

## Reward System (What the Agent Learns)

### 🎯 DO THIS (Big Rewards)
- Climb higher: **+20 per step**
- Land on stairs: **+15**
- New record: **+10**
- Reach goal: **+100**

### ❌ AVOID THIS (Small Penalties)
- Fall off: **-8**
- Move down: **-5 per step**
- Die: **-5**

### 🧭 GUIDANCE
- Move toward stairs: **+2**
- Move away: **-1**
- Do nothing: **-0.05 per step**

---

## Expected Timeline

| Episodes | What Happens | Success Rate | Avg Reward |
|----------|--------------|--------------|------------|
| 0-1,000 | Learning to move | 0-10% | -5 to +10 |
| 1,000-5,000 | Finding stairs | 10-30% | +10 to +30 |
| 5,000+ | Climbing well | 30-60% | +30 to +60 |

---

## Commands

### View Stats
```javascript
showTrainingStats()
```

### Reset Everything
```javascript
app.modelManager.reset()
```

### Check Current Episode
```javascript
app.orchestrator.currentEpisode
```

---

## Success Indicators

✅ **Training is Working:**
- Console shows climbing rewards (+20)
- Success rate increasing
- Avg reward trending up
- Agent reaches stairs consistently

❌ **Training Needs Help:**
- Success rate stuck at 0%
- Avg reward not improving
- No climbing rewards in console
- Agent frozen or not moving

---

## Quick Troubleshooting

**Problem:** Agent not moving
**Solution:** Check console for freeze detection, reload page

**Problem:** Training too slow
**Solution:** Use "Fast Training" or run `node train.js`

**Problem:** Want to start fresh
**Solution:** Run `app.modelManager.reset()`

---

## Files to Check

- `ULTIMATE_REWARD_SYSTEM.md` - Full reward documentation
- `REWARD_SYSTEM_COMPLETE.md` - Complete implementation guide
- `src/rl/ClimbingEnvironment.js` - Reward code (line 682)

---

## That's It!

1. Click "Fast Training"
2. Run `showTrainingStats()` every 1000 episodes
3. Watch the agent learn to climb!

The reward system is designed so the agent **WILL** learn to climb. The math guarantees it - climbing rewards are 2.5x larger than penalties!
