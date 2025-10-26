# Performance Optimization Quick Reference

## 🎯 Frame Rate Guarantees

### Visual Training Mode
```
Target: 60 FPS
Minimum: 50 FPS (adaptive rendering kicks in)
Frame Budget: 16.67ms per frame
```

### Key Metrics to Monitor
```javascript
// Check current performance
const stats = app.getPerformanceStats();

console.log('FPS:', stats.fps);              // Current frames per second
console.log('Frame Time:', stats.frameTime); // Average frame time (ms)
console.log('Physics Time:', stats.physicsTime); // Physics computation time
console.log('Render Time:', stats.renderTime);   // Rendering time
console.log('Adaptive:', stats.adaptiveRendering); // Is adaptive mode on?
```

---

## 🚀 Optimization Features

### 1. Precise Frame Timing
- **What**: Yields control every 16.67ms or 5 steps
- **Why**: Prevents blocking, allows smooth rendering
- **Where**: `TrainingOrchestrator.runEpisodePPOVisual()` and `runEpisodeDQNVisual()`

### 2. Limited Physics Steps
- **What**: Maximum 3 physics steps per frame
- **Why**: Prevents "spiral of death" where physics takes too long
- **Where**: `main.js` rendering loop

### 3. Adaptive Rendering
- **What**: Automatically skips frames when FPS < 50
- **Why**: Maintains smooth experience even on slower hardware
- **Triggers**: 
  - Enables after 2 seconds of FPS < 50
  - Disables when FPS >= 58

### 4. Intelligent Frame Skipping
- **Visual Training**: Conservative (prioritize smoothness)
  - Skip factor 1: Render every frame (< 1.8x target time)
  - Skip factor 2: Render every 2nd frame (< 2.5x target time)
  - Skip factor 3: Render every 3rd frame (> 2.5x target time)
  
- **Background Training**: Aggressive (prioritize speed)
  - Skip factor 2: Render every 2nd frame (> 1.0x target time)
  - Skip factor 4: Render every 4th frame (> 1.5x target time)

### 5. Rendering Engine Optimizations
- Frustum culling enabled
- Bounding sphere/box computation
- Medium precision materials
- Object sorting for batching
- High-performance GPU preference

---

## 📊 Performance Monitoring

### Automatic Logging
```
🎬 FPS: 60 | Frame: 15.23ms | Physics: 2.45ms | Render: 8.12ms
```

### Console Warnings
```
⚠️ Low FPS detected: 45 FPS
⚡ Enabling adaptive rendering (FPS: 48)
✅ Disabling adaptive rendering (FPS: 60)
⚠️ High tensor count: 523
```

---

## 🎮 Usage Examples

### Start Optimized Visual Training
```javascript
// Automatically uses all optimizations
orchestrator.startVisualTraining(1000);
```

### Manual Adaptive Control
```javascript
// Force enable
app.setAdaptiveRendering(true);

// Force disable
app.setAdaptiveRendering(false);

// Check state
const isAdaptive = app.isAdaptiveRenderingEnabled();
```

### Get Detailed Stats
```javascript
const stats = app.getPerformanceStats();
console.log('Performance Report:', {
    fps: stats.fps,
    frameTime: stats.frameTime.toFixed(2) + 'ms',
    physicsTime: stats.physicsTime.toFixed(2) + 'ms',
    renderTime: stats.renderTime.toFixed(2) + 'ms',
    adaptive: stats.adaptiveRendering ? 'ON' : 'OFF',
    memory: stats.memory.numMB + 'MB'
});
```

---

## 🔧 Troubleshooting

### Problem: FPS drops below 50
**Solution**: Adaptive rendering will enable automatically
**Manual**: Check physics time - may be too complex

### Problem: Stuttering/jank
**Solution**: Check frame time consistency
**Manual**: Reduce scene complexity or increase skip factor

### Problem: Memory warnings
**Solution**: Memory monitoring will alert automatically
**Manual**: Run `app.cleanupMemory()`

### Problem: Training too slow
**Solution**: Use background training mode instead of visual
**Manual**: Increase frame skip factor

---

## 💡 Best Practices

### For Smooth Visuals
1. ✅ Use visual training mode
2. ✅ Let adaptive rendering handle performance
3. ✅ Close other browser tabs
4. ✅ Monitor FPS occasionally

### For Maximum Speed
1. ✅ Use background training mode
2. ✅ Minimize browser window
3. ✅ Let aggressive frame skipping work
4. ✅ Focus on training throughput

### For Development
1. ✅ Check performance stats regularly
2. ✅ Monitor memory usage
3. ✅ Watch for physics time spikes
4. ✅ Verify adaptive rendering triggers

---

## 📈 Performance Targets

| Mode | Target FPS | Min FPS | Frame Budget | Physics Steps |
|------|-----------|---------|--------------|---------------|
| Visual Training | 60 | 50 | 16.67ms | Max 3 |
| Background Training | N/A | N/A | N/A | Max 3 |
| Normal/Idle | 60 | 55 | 16.67ms | Max 3 |

---

## 🎯 Optimization Checklist

- [x] Precise frame timing (16.67ms target)
- [x] Limited physics steps (max 3 per frame)
- [x] Adaptive rendering (auto-enable at FPS < 50)
- [x] Intelligent frame skipping (mode-aware)
- [x] Rendering engine optimizations (culling, batching)
- [x] Performance monitoring (FPS, frame time, memory)
- [x] Automatic adaptation (no manual intervention needed)
- [x] Comprehensive logging (warnings and info)

---

## 🚀 Result

**Smooth 60 FPS visual training with automatic performance adaptation!**

All optimizations work together to ensure:
- Consistent frame rates
- Responsive UI
- Smooth animations
- Efficient resource usage
- Automatic adaptation to hardware capabilities
