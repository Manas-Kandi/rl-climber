# How Progressive Learning Works

## Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Startup                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              ModelManager Initialization                     │
│  • Check localStorage for existing model                     │
│  • Load metadata if available                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
            Model Found?        No Model
                    │               │
                    ↓               ↓
        ┌───────────────────┐  ┌──────────────────┐
        │  Load Model v15   │  │  Fresh Model v0  │
        │  Episodes: 1500   │  │  Episodes: 0     │
        │  Best: 52.3       │  │  Best: -∞        │
        └───────────────────┘  └──────────────────┘
                    │               │
                    └───────┬───────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   User Clicks "Start Training"               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Training Loop Begins                      │
│  • Agent uses loaded weights (or random if fresh)            │
│  • Learns from environment interactions                      │
│  • Updates neural network weights                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Every 10 Episodes
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Auto-Save Triggered                       │
│  • Save model weights to localStorage                        │
│  • Update metadata:                                          │
│    - Increment version                                       │
│    - Add episodes to total                                   │
│    - Update best reward if improved                          │
│    - Add entry to training history                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Continue Training
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              User Stops Training or Closes Browser           │
│  • Final auto-save triggered                                 │
│  • All progress preserved in localStorage                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Later Session...
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              User Opens App Again                            │
│  • Model v16 automatically loads                             │
│  • Shows: Episodes: 1600, Best: 54.1                         │
│  • Ready to continue training from this point                │
└─────────────────────────────────────────────────────────────┘
```

## Example Training Timeline

### Session 1 (Day 1)
```
Time: 10:00 AM
Action: Start fresh training
Model: v0 → v10
Episodes: 0 → 100
Best Reward: -∞ → 25.3
Status: Learning basic movements
```

### Session 2 (Day 1, Later)
```
Time: 2:00 PM
Action: Continue training (auto-loaded v10)
Model: v10 → v20
Episodes: 100 → 200
Best Reward: 25.3 → 38.7
Status: Discovering climbing strategies
```

### Session 3 (Day 2)
```
Time: 9:00 AM
Action: Continue training (auto-loaded v20)
Model: v20 → v35
Episodes: 200 → 350
Best Reward: 38.7 → 52.1
Status: Mastering ledge transitions
```

### Session 4 (Day 3)
```
Time: 11:00 AM
Action: Continue training (auto-loaded v35)
Model: v35 → v50
Episodes: 350 → 500
Best Reward: 52.1 → 68.4
Status: Consistently reaching goal
```

## Data Flow Diagram

```
┌──────────────┐
│   Browser    │
│ localStorage │
└──────┬───────┘
       │
       │ save/load
       │
       ↓
┌──────────────────┐      ┌─────────────────┐
│  ModelManager    │◄────►│  TensorFlow.js  │
│  • Versioning    │      │  Model Weights  │
│  • Metadata      │      └─────────────────┘
│  • History       │
└────────┬─────────┘
         │
         │ manages
         │
         ↓
┌──────────────────┐      ┌─────────────────┐
│ TrainingOrch.    │◄────►│   DQN/PPO       │
│ • Training Loop  │      │   Agent         │
│ • Auto-save      │      │   • Learning    │
└────────┬─────────┘      └─────────────────┘
         │
         │ updates
         │
         ↓
┌──────────────────┐
│  UIController    │
│  • Display Stats │
│  • Model Info    │
│  • User Actions  │
└──────────────────┘
```

## Metadata Evolution

### Initial State (v0)
```json
{
  "version": 0,
  "totalEpisodes": 0,
  "totalSteps": 0,
  "bestReward": -Infinity,
  "avgReward": 0,
  "successRate": 0,
  "lastSaved": null,
  "trainingHistory": []
}
```

### After First Save (v1)
```json
{
  "version": 1,
  "totalEpisodes": 10,
  "totalSteps": 5000,
  "bestReward": 15.2,
  "avgReward": 15.2,
  "successRate": 0.2,
  "lastSaved": "2025-10-24T10:10:00.000Z",
  "trainingHistory": [
    {
      "version": 1,
      "timestamp": "2025-10-24T10:10:00.000Z",
      "episodes": 10,
      "avgReward": 15.2,
      "successRate": 0.2
    }
  ]
}
```

### After Multiple Sessions (v50)
```json
{
  "version": 50,
  "totalEpisodes": 500,
  "totalSteps": 250000,
  "bestReward": 68.4,
  "avgReward": 65.1,
  "successRate": 0.85,
  "lastSaved": "2025-10-26T11:30:00.000Z",
  "trainingHistory": [
    // ... last 100 saves
    {
      "version": 50,
      "timestamp": "2025-10-26T11:30:00.000Z",
      "episodes": 10,
      "avgReward": 65.1,
      "successRate": 0.85
    }
  ]
}
```

## Key Concepts

### 1. Cumulative Learning
- Each training session builds on previous knowledge
- Neural network weights are preserved and improved
- No "forgetting" between sessions

### 2. Version Tracking
- Each save increments the version number
- Easy to track how many times the model has been updated
- History shows progression over time

### 3. Automatic Persistence
- No manual save required (though available)
- Saves every 10 episodes during training
- Final save when training stops
- Automatic load on startup

### 4. Metadata Tracking
- Total episodes across all sessions
- Best reward ever achieved
- Recent performance metrics
- Training history for analysis

### 5. Reset Capability
- Can start fresh anytime
- Clears all saved data
- Useful for testing different approaches

## Benefits Over Traditional Approach

### Traditional (No Persistence)
```
Session 1: Train 100 episodes → Close browser → Lost
Session 2: Train 100 episodes → Close browser → Lost
Session 3: Train 100 episodes → Close browser → Lost
Result: Never improves beyond 100 episodes of training
```

### With Persistent Learning
```
Session 1: Train 100 episodes → Auto-save → v10
Session 2: Load v10 → Train 100 more → Auto-save → v20
Session 3: Load v20 → Train 100 more → Auto-save → v30
Result: Continuous improvement, 300 total episodes of training
```

## Storage Considerations

### Browser localStorage Limits
- Typical limit: 5-10 MB per domain
- Model size: ~500 KB - 2 MB (depending on architecture)
- Metadata size: ~10-50 KB
- Can store multiple training sessions comfortably

### What Gets Saved
1. **Model Weights**: Neural network parameters (largest)
2. **Model Architecture**: Network structure definition
3. **Metadata**: Training statistics and history (smallest)

### What Doesn't Get Saved
- Experience replay buffer (too large, not needed)
- Temporary training variables
- Rendering state
- UI state

## Troubleshooting

### Model Not Loading
**Symptom**: Shows v0 with 0 episodes on startup
**Causes**:
- First time using the app (expected)
- localStorage was cleared
- Different browser/incognito mode
- Storage quota exceeded

**Solution**: Check browser console for error messages

### Training Not Improving
**Symptom**: Performance plateaus or decreases
**Causes**:
- Hyperparameters need adjustment
- Model has converged to local optimum
- Environment is too difficult

**Solution**: 
- Try adjusting learning rate
- Reset and try different hyperparameters
- Simplify environment temporarily

### Storage Full
**Symptom**: Save fails with quota error
**Causes**:
- localStorage limit reached
- Too many other sites using storage

**Solution**:
- Reset old models
- Clear browser data for other sites
- Use smaller network architecture
