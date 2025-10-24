# Persistent Learning System

## Overview

The 3D RL Climbing Game now features a **persistent learning system** that enables progressive model improvement across multiple training sessions. Instead of starting from scratch each time, the agent builds upon its previous knowledge, leading to continuous improvement over time.

## Key Features

### 1. Automatic Model Loading
- On application startup, the system automatically checks for existing saved models
- If found, the latest model is loaded automatically
- Training continues from the last saved state, not from scratch

### 2. Model Versioning
- Each save increments the model version
- Metadata tracks:
  - Version number
  - Total episodes trained (cumulative across all sessions)
  - Total steps taken
  - Best reward achieved
  - Average reward
  - Success rate
  - Last saved timestamp
  - Training history (last 100 saves)

### 3. Auto-Save During Training
- Models automatically save every 10 episodes (configurable)
- Final model is saved when training completes
- No manual intervention required for persistence

### 4. Model Metadata Display
The UI now shows:
- **Model Version**: Current version number (e.g., v15)
- **Total Episodes**: Cumulative episodes across all training sessions
- **Best Reward**: Highest average reward achieved

## Architecture

### New Components

#### ModelManager (`src/training/ModelManager.js`)
Handles all model persistence operations:
- `init()` - Loads existing metadata and model
- `saveModel(stats)` - Saves model with updated metadata
- `loadLatestModel()` - Loads the most recent model
- `getMetadata()` - Returns current model metadata
- `reset()` - Clears all saved models and metadata

#### Updated Components

**TrainingOrchestrator** (`src/training/TrainingOrchestrator.js`)
- Added `setModelManager()` method
- Auto-saves model every N episodes during training
- Saves final model when training completes

**UIController** (`src/ui/UIController.js`)
- Added model info display
- Added reset button handler
- Updates model info after saves
- Shows cumulative training statistics

**Main Application** (`src/main.js`)
- Initializes ModelManager after agent creation
- Connects ModelManager to orchestrator
- Passes ModelManager to UI controller

## Usage

### For Users

1. **First Training Session**
   ```
   - Start the app
   - Click "Start Training"
   - Model trains and auto-saves every 10 episodes
   - Close the browser when done
   ```

2. **Subsequent Sessions**
   ```
   - Start the app (model auto-loads)
   - See "Model Info" showing previous progress
   - Click "Start Training" to continue improving
   - Model builds on previous knowledge
   ```

3. **Reset Everything**
   ```
   - Click "Reset All" button
   - Confirm the action
   - All models and metadata are cleared
   - Start fresh with a new model
   ```

### For Developers

#### Initialize ModelManager
```javascript
import { ModelManager } from './training/ModelManager.js';

const modelManager = new ModelManager(agent, {
    autoSave: true,
    saveInterval: 10  // Save every 10 episodes
});

await modelManager.init();  // Loads existing model if available
```

#### Connect to Orchestrator
```javascript
orchestrator.setModelManager(modelManager);
```

#### Manual Save
```javascript
await modelManager.saveModel({
    episodeCount: 100,
    totalSteps: 50000,
    avgReward: 45.2,
    successRate: 0.75
});
```

#### Get Metadata
```javascript
const metadata = modelManager.getMetadata();
console.log(`Model v${metadata.version}`);
console.log(`Total episodes: ${metadata.totalEpisodes}`);
console.log(`Best reward: ${metadata.bestReward}`);
```

## Storage

### LocalStorage Keys
- `climbing-model` - TensorFlow.js model weights
- `climbing-model-metadata` - Model metadata JSON

### Metadata Structure
```javascript
{
    version: 15,
    totalEpisodes: 1500,
    totalSteps: 750000,
    bestReward: 52.3,
    avgReward: 48.1,
    successRate: 0.72,
    lastSaved: "2025-10-24T10:30:00.000Z",
    trainingHistory: [
        {
            version: 14,
            timestamp: "2025-10-24T10:20:00.000Z",
            episodes: 100,
            avgReward: 47.5,
            successRate: 0.70
        },
        // ... last 100 saves
    ]
}
```

## Benefits

1. **Progressive Improvement**: Each session builds on previous learning
2. **No Wasted Training**: Training progress is never lost
3. **Long-term Learning**: Models can be trained over days/weeks
4. **Transparency**: Clear visibility into cumulative progress
5. **Flexibility**: Can reset and start fresh anytime

## Configuration

### Auto-Save Interval
```javascript
// In main.js
this.modelManager = new ModelManager(this.agent, {
    autoSave: true,
    saveInterval: 10  // Change to save more/less frequently
});
```

### Training Orchestrator
```javascript
// In main.js config
training: {
    numEpisodes: 1000,
    autoSaveInterval: 10  // Must match ModelManager saveInterval
}
```

## Future Enhancements

Potential improvements:
- Multiple model slots (save different training runs)
- Export/import models as files
- Cloud storage integration
- Training session comparison
- Automatic hyperparameter adjustment based on progress
- Model rollback to previous versions

## Troubleshooting

### Model Not Loading
- Check browser console for errors
- Verify localStorage is enabled
- Check available storage space
- Try clearing browser cache

### Training Not Improving
- Check if model is actually loading (see console logs)
- Verify metadata shows increasing episode count
- Consider adjusting hyperparameters
- Try resetting and starting fresh

### Storage Full
- Browser localStorage has ~5-10MB limit
- Reset old models to free space
- Consider exporting important models
- Use smaller network architectures if needed
