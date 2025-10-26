# 🎬 Trajectory Visualization Fix

## Problem
When running terminal training (`node train.js`), the visualization showed:
- Only a tiny line
- Same line for all 2000+ episodes
- No visible progress or changes

## Root Cause
The trajectory data format was inconsistent between:
1. **Environment** - Saved trajectories with nested structure
2. **Visualizer** - Expected different format
3. **Episode Counter** - Not properly tracked

## Fixes Applied

### 1. Standardized Trajectory Format
**File:** `src/rl/ClimbingEnvironment.js`

Changed trajectory structure from:
```javascript
{
  episode: X,
  trajectory: [...steps...],  // Nested array
  success: true,
  totalReward: 50
}
```

To:
```javascript
{
  episode: X,
  steps: [...steps...],  // Direct array
  success: true,
  totalReward: 50,
  stepCount: 100,
  highestStep: 5,
  finalPosition: {x, y, z},
  finalStep: 5
}
```

### 2. Added Episode Counter
**File:** `src/rl/ClimbingEnvironment.js`

Added proper episode tracking:
```javascript
// In constructor
this.episodeCount = 0;

// In reset()
this.episodeCount++;

// In trajectory save
episode: this.episodeCount
```

This ensures each trajectory has a unique, sequential episode number.

### 3. Updated Visualizer to Handle Both Formats
**File:** `src/visualization/TrajectoryVisualizer.js`

Made visualizer backward compatible:
```javascript
// Handle both old and new format
const steps = trajectory.steps || trajectory.trajectory || [];
```

This allows visualization of:
- Old trajectories (with `trajectory.trajectory`)
- New trajectories (with `trajectory.steps`)
- Empty trajectories (graceful fallback)

### 4. Enhanced Trajectory Data
Added more metadata to each trajectory:
- `stepCount` - Total steps taken
- `highestStep` - Highest stair reached
- `finalPosition` - Where agent ended
- `finalStep` - Which step agent was on at end
- `duration` - Episode duration in ms

## How It Works Now

### During Training
1. **Episode starts** → `episodeCount++`
2. **Each step** → Position, action, reward recorded
3. **Episode ends** → Complete trajectory saved with metadata
4. **Storage** → Trajectory written to disk with unique filename

### During Visualization
1. **Load metadata** → Get list of all episodes
2. **Select episode** → Load specific trajectory file
3. **Parse data** → Handle both old/new formats
4. **Render** → Draw path line in 3D space

## Testing the Fix

### 1. Run Training
```bash
node train.js
```

### 2. Check Trajectory Files
```bash
ls training-data/trajectories/trajectories/
```

You should see files like:
```
episode_1_1234567890.json
episode_2_1234567891.json
episode_3_1234567892.json
...
```

### 3. Check Metadata
```bash
cat training-data/trajectories/metadata.json
```

Should show:
```json
{
  "version": "1.0",
  "totalTrajectories": 2000,
  "trajectories": [
    {
      "episode": 1,
      "filename": "episode_1_1234567890.json",
      "reward": 15.5,
      "steps": 100,
      "success": false
    },
    ...
  ]
}
```

### 4. Visualize in Browser
1. Open the app
2. Click "📊 Visualize History"
3. You should see:
   - Multiple colored lines (one per episode)
   - Green lines = successful episodes
   - Red lines = failed episodes
   - Lines should show different paths

## Expected Results

### Before Fix
- ❌ Single tiny line
- ❌ No variation between episodes
- ❌ No progress visible

### After Fix
- ✅ Multiple trajectory lines
- ✅ Each episode shows unique path
- ✅ Progress visible over time
- ✅ Successful episodes highlighted in green
- ✅ Can replay individual episodes

## Trajectory Data Structure

### Complete Trajectory Object
```javascript
{
  // Identification
  episode: 1234,
  
  // Path data
  steps: [
    {
      step: 0,
      position: {x: 0, y: 1, z: 0},
      action: 0,
      actionName: "forward",
      reward: 0.5,
      totalReward: 0.5,
      timestamp: 1234567890
    },
    // ... more steps
  ],
  
  // Outcome
  success: false,
  totalReward: 15.5,
  stepCount: 100,
  highestStep: 3,
  
  // Final state
  finalPosition: {x: 0, y: 2.5, z: -4},
  finalStep: 2,
  
  // Metadata
  duration: 5000,
  savedAt: "2024-01-01T12:00:00.000Z",
  filename: "episode_1234_1234567890.json"
}
```

## Visualization Features

### Timeline Visualizer
- Shows all trajectories as colored lines
- Green = successful (reached goal)
- Red = failed
- Opacity fades for older episodes
- Can select specific episode to replay

### Replay Mode
- Click on episode to replay
- Ghost agent follows exact path
- Shows action taken at each step
- Displays reward received
- Can pause/resume/stop

## Performance Notes

### Storage
- Each trajectory ~10-50 KB
- 10,000 episodes ≈ 100-500 MB
- Auto-prunes to keep last 10,000
- Metadata file tracks all episodes

### Loading
- Metadata loads instantly
- Individual trajectories load on demand
- Visualization renders 100+ trajectories smoothly
- Can filter by success/failure

## Troubleshooting

### No Trajectories Showing
**Check:**
1. Did training complete? (`node train.js`)
2. Are files created? (`ls training-data/trajectories/trajectories/`)
3. Is metadata valid? (`cat training-data/trajectories/metadata.json`)

**Solution:**
- Run training again
- Check console for errors
- Verify file permissions

### Visualization Shows Old Data
**Check:**
1. Browser cache (hard refresh: Cmd+Shift+R)
2. Metadata timestamp
3. Episode numbers

**Solution:**
- Clear browser cache
- Reload page
- Check metadata.json for latest episodes

### Lines Too Small/Invisible
**Check:**
1. Camera position
2. Agent starting position
3. Trajectory data has valid positions

**Solution:**
- Reset camera (C key)
- Check trajectory positions in JSON
- Verify physics engine is working

## Summary

✅ **Trajectory format standardized** - Consistent structure
✅ **Episode counter added** - Unique episode numbers
✅ **Visualizer updated** - Handles both formats
✅ **Metadata enhanced** - More useful information
✅ **Backward compatible** - Works with old data

The visualization should now show:
- Unique path for each episode
- Progress over training
- Success/failure patterns
- Detailed replay capability

Run `node train.js` and then visualize to see the improvements!
