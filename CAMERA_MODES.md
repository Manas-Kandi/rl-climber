# Camera Modes

## Overview

The game now supports two camera modes for better viewing experience:

### 1. Fixed Camera (Default) 📷
- **Position**: High and far back (0, 10, 20)
- **View**: Overview of entire climbing wall
- **Best for**: 
  - Watching training progress
  - Seeing the full environment
  - Understanding agent's strategy
  - Recording/streaming

### 2. Follow Camera 🎥
- **Position**: Behind and above agent (offset: 0, 5, 10)
- **View**: Follows agent smoothly
- **Best for**:
  - Manual play
  - Close-up action
  - Immersive experience
  - Debugging agent behavior

## How to Use

### Toggle Camera Mode

**Button:**
- Click "Toggle Camera" button in the UI
- Button shows current mode: "(Fixed)" or "(Follow)"

**Keyboard:**
- Press `C` key to toggle between modes
- Works anytime (except when typing in input fields)

### Default Behavior

- Game starts in **Fixed Camera** mode
- Shows entire scene from a distance
- Perfect for watching training

## Technical Details

### Fixed Camera Settings
```javascript
Position: (0, 10, 20)
Look At: (0, 7, 0)
Behavior: Static, doesn't move
```

### Follow Camera Settings
```javascript
Offset from agent: (0, 5, 10)
Lerp Speed: 0.05 (smooth following)
Behavior: Smoothly follows agent position
```

## Camera Modes in Different Scenarios

### During Training
- **Recommended**: Fixed Camera
- **Why**: See entire wall and agent's climbing path
- **Benefit**: Better understanding of learning progress

### Manual Play
- **Recommended**: Follow Camera
- **Why**: More immersive and easier to control
- **Benefit**: Better spatial awareness

### Debugging
- **Recommended**: Toggle between both
- **Why**: Fixed shows overall behavior, Follow shows details
- **Benefit**: Complete picture of what's happening

## Keyboard Shortcuts Summary

| Key | Action |
|-----|--------|
| `C` | Toggle camera mode |
| `H` | Toggle charts visibility |
| `W/↑` | Move forward |
| `S/↓` | Move backward |
| `A/←` | Move left |
| `D/→` | Move right |
| `Space` | Jump |
| `E` | Grab |

## Future Enhancements

Possible camera improvements:
- Free camera mode (user-controlled)
- Cinematic camera paths
- Multiple fixed camera positions
- Zoom in/out controls
- Camera shake effects
- Replay camera system
