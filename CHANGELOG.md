# Changelog

## [Unreleased] - 2025-10-24

### Added - Persistent Learning System

#### New Features
- **Progressive Model Training**: Models now automatically save and load across sessions, enabling continuous improvement over time
- **Automatic Model Loading**: On startup, the application automatically loads the most recent trained model
- **Model Versioning**: Each save increments the version and tracks cumulative training progress
- **Training History**: Tracks the last 100 training sessions with metadata
- **Model Info Display**: New UI panel showing model version, total episodes, and best reward
- **Reset Functionality**: New "Reset All" button to clear all saved models and start fresh
- **Auto-Save During Training**: Models automatically save every 10 episodes (configurable)

#### New Components
- `src/training/ModelManager.js` - Handles all model persistence, versioning, and metadata management
- `src/training/test-model-manager.js` - Comprehensive test suite for ModelManager
- `docs/persistent-learning.md` - Complete documentation of the persistent learning system

#### Modified Components
- `src/training/TrainingOrchestrator.js`
  - Added `setModelManager()` method to connect with ModelManager
  - Integrated auto-save functionality during training loop
  - Saves final model when training completes
  - Added `autoSaveInterval` configuration option

- `src/ui/UIController.js`
  - Added `modelManager` parameter to constructor
  - Added `setModelManager()` method
  - Added `updateModelInfo()` method to display model metadata
  - Added `onResetModel()` handler for reset button
  - Updated `onSaveModel()` and `onLoadModel()` to use ModelManager
  - Model info updates automatically during training

- `src/main.js`
  - Added ModelManager import
  - Integrated ModelManager initialization after agent creation
  - Connected ModelManager to TrainingOrchestrator
  - Passed ModelManager to UIController

- `index.html`
  - Added "Reset All" button to control panel
  - Added "Model Info" section to stats panel with:
    - Model version display
    - Total episodes counter
    - Best reward tracker

- `src/training/index.js`
  - Added ModelManager export

- `README.md`
  - Updated features list to highlight progressive learning
  - Added "Progressive Learning System" section
  - Updated controls table with new buttons
  - Added usage instructions for persistent training

#### Technical Details

**Storage**
- Models saved to browser localStorage using TensorFlow.js save API
- Metadata stored separately in localStorage as JSON
- Storage keys: `climbing-model` (model) and `climbing-model-metadata` (metadata)

**Metadata Structure**
```javascript
{
    version: number,           // Increments with each save
    totalEpisodes: number,     // Cumulative across all sessions
    totalSteps: number,        // Cumulative steps taken
    bestReward: number,        // Best average reward achieved
    avgReward: number,         // Most recent average reward
    successRate: number,       // Most recent success rate
    lastSaved: string,         // ISO timestamp
    trainingHistory: Array     // Last 100 saves
}
```

**Auto-Save Configuration**
- Default: Every 10 episodes
- Configurable via ModelManager constructor
- Also saves on training completion

**Benefits**
1. No training progress is lost between sessions
2. Models improve continuously over days/weeks
3. Clear visibility into cumulative progress
4. Can reset and start fresh anytime
5. Transparent versioning and history tracking

### Testing
- Added comprehensive test suite with 7 test cases
- Tests cover initialization, save/load, versioning, metadata tracking, and reset
- Run tests with: `runModelManagerTests()` in browser console

### Documentation
- Created `docs/persistent-learning.md` with complete system documentation
- Updated README.md with usage instructions
- Added inline code documentation

### Future Enhancements
Potential improvements for future versions:
- Multiple model slots (save different training runs)
- Export/import models as downloadable files
- Cloud storage integration
- Training session comparison tools
- Automatic hyperparameter adjustment based on progress
- Model rollback to previous versions
- Training analytics dashboard
