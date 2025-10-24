# Quick Start Guide - Persistent Learning

## 🚀 Getting Started in 3 Steps

### 1. Install & Run
```bash
npm install
npm run dev
```

### 2. Start Training
- Click **"Start Training"** button
- Watch the agent learn to climb
- Model auto-saves every 10 episodes

### 3. Continue Later
- Close browser anytime
- Open app again later
- Model automatically loads
- Click **"Start Training"** to continue improving!

## 📊 Understanding the UI

### Model Info Panel (Top Right)
```
Model Info
├── Version: v15          ← How many times saved
├── Total Episodes: 1500  ← Cumulative across all sessions
└── Best Reward: 52.3     ← Highest average reward achieved
```

### What the Numbers Mean
- **Version**: Increments with each save (v0 = fresh, v50 = well-trained)
- **Total Episodes**: Sum of all training episodes across all sessions
- **Best Reward**: The best performance the model has achieved

## 🎮 Button Guide

| Button | What It Does | When to Use |
|--------|--------------|-------------|
| **Start Training** | Begin/continue training | Start a new session or continue training |
| **Stop Training** | Pause training | Take a break, model auto-saves |
| **Save Model** | Manual save | Save progress immediately |
| **Load Model** | Reload latest | Refresh model from storage |
| **Reset All** | Delete everything | Start completely fresh |

## 📈 Training Progress Example

### Day 1 - Morning (First Session)
```
Start: v0, Episodes: 0, Best: 0
Train: 100 episodes
End:   v10, Episodes: 100, Best: 25.3
Status: Learning basic movements ✅
```

### Day 1 - Afternoon (Second Session)
```
Start: v10, Episodes: 100, Best: 25.3  ← Continues from morning!
Train: 100 more episodes
End:   v20, Episodes: 200, Best: 38.7
Status: Discovering climbing strategies ✅
```

### Day 2 (Third Session)
```
Start: v20, Episodes: 200, Best: 38.7  ← Continues from yesterday!
Train: 150 more episodes
End:   v35, Episodes: 350, Best: 52.1
Status: Mastering ledge transitions ✅
```

## 💡 Pro Tips

### Tip 1: Let It Train Overnight
```
1. Start training before bed
2. Let it run for hours
3. Model auto-saves every 10 episodes
4. Wake up to a much better model!
```

### Tip 2: Track Your Progress
```
Watch the Model Info panel:
- Version increases = model is saving ✅
- Total Episodes increases = cumulative learning ✅
- Best Reward increases = model is improving ✅
```

### Tip 3: When to Reset
```
Reset if:
- Want to try different hyperparameters
- Model seems stuck
- Want to start a new experiment
- Testing different approaches
```

### Tip 4: Multiple Training Sessions
```
Short sessions work great:
- Train 50 episodes → auto-saves
- Close browser
- Come back later → auto-loads
- Train 50 more → builds on previous
- Repeat as needed!
```

## 🔍 Checking If It's Working

### Signs of Success ✅
1. **On Startup**: Console shows "Found existing model (vX)"
2. **Model Info**: Shows version > 0 and episodes > 0
3. **During Training**: Version increments every 10 episodes
4. **Performance**: Best reward increases over time

### Signs of Issues ❌
1. **Always v0**: Model not saving/loading
2. **Episodes reset to 0**: Storage cleared or different browser
3. **No improvement**: May need hyperparameter adjustment

## 🐛 Quick Troubleshooting

### Problem: Model shows v0 every time
**Solution**: 
- Check browser console for errors
- Ensure localStorage is enabled
- Not using incognito mode

### Problem: Training not improving
**Solution**:
- Let it train longer (100+ episodes)
- Check if model is actually loading (console logs)
- Try adjusting learning rate in code

### Problem: "Storage quota exceeded"
**Solution**:
- Click "Reset All" to clear old models
- Clear browser cache
- Use smaller network architecture

## 📚 What Gets Saved

### Automatically Saved ✅
- Neural network weights
- Model architecture
- Training statistics
- Version number
- Best reward
- Total episodes

### Not Saved ❌
- Experience replay buffer (too large)
- Current episode state
- UI state
- Temporary variables

## 🎯 Training Goals

### Beginner (v0-v10)
```
Episodes: 0-100
Best Reward: 0-30
Goal: Learn basic movements
Time: 10-30 minutes
```

### Intermediate (v10-v30)
```
Episodes: 100-300
Best Reward: 30-50
Goal: Discover climbing strategies
Time: 1-3 hours
```

### Advanced (v30-v50)
```
Episodes: 300-500
Best Reward: 50-70
Goal: Master ledge transitions
Time: 3-6 hours
```

### Expert (v50+)
```
Episodes: 500+
Best Reward: 70+
Goal: Consistently reach goal
Time: 6+ hours
```

## 🔄 Typical Workflow

### Daily Training Routine
```
Morning:
1. Open app (auto-loads yesterday's model)
2. Check Model Info (see progress)
3. Start training (50-100 episodes)
4. Close browser (auto-saves)

Evening:
1. Open app (auto-loads morning's model)
2. Check improvement in Model Info
3. Start training (50-100 episodes)
4. Close browser (auto-saves)

Result: Continuous improvement! 🎉
```

## 🎓 Learning Curve

### What to Expect

**Week 1**: Basic movements
- Agent learns to move and jump
- Occasional ledge grabs
- Best reward: 20-40

**Week 2**: Strategy development
- Consistent ledge climbing
- Better action selection
- Best reward: 40-60

**Week 3**: Mastery
- Efficient climbing paths
- High success rate
- Best reward: 60-80

**Week 4+**: Optimization
- Near-perfect performance
- Minimal wasted movements
- Best reward: 80+

## 🚨 Important Notes

### Do's ✅
- Let training run for multiple episodes
- Check Model Info regularly
- Save manually before experiments
- Use Reset All to start fresh

### Don'ts ❌
- Don't close browser mid-episode (wait for auto-save)
- Don't use incognito mode (storage won't persist)
- Don't clear browser data (will lose models)
- Don't expect instant results (learning takes time)

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ Model version increases over time
2. ✅ Total episodes keeps growing
3. ✅ Best reward improves
4. ✅ Agent reaches goal more often
5. ✅ Training continues from previous session

## 📞 Need Help?

1. Check browser console (F12) for error messages
2. Read `docs/persistent-learning.md` for details
3. Run tests: `runModelManagerTests()` in console
4. Check `docs/how-it-works.md` for visual guides

## 🎊 You're Ready!

Now you have a climbing agent that:
- ✅ Learns progressively over time
- ✅ Never forgets previous training
- ✅ Automatically saves and loads
- ✅ Gets better with each session

**Just hit "Start Training" and watch it improve!** 🚀
