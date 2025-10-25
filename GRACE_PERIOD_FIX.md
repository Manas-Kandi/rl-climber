# 🕐 Grace Period Fix

## The Problem

After 300 episodes, agent learned a new exploit:
```
1. Jump straight up at start
2. Land back on ground
3. Episode ends immediately (-100)
4. Repeat
```

**Why this happened:**
- Grace period was only 10 steps
- Grace zone was only 1.0 units
- Agent couldn't reach stairs in time
- Learned: "Fastest way to end episode = jump up"

## The Fix

### 1. Extended Grace Period
```javascript
// OLD
const inGracePeriod = this.currentStep < 10;  // Too short!

// NEW
const inGracePeriod = this.currentStep < 50;  // Enough time to reach stairs
```

### 2. Larger Grace Zone
```javascript
// OLD
const inStartZone = Math.abs(x - startX) < 1.0 &&
                   Math.abs(z - startZ) < 1.0;  // Too small!

// NEW
const inStartZone = Math.abs(x - startX) < 2.0 &&
                   Math.abs(z - startZ) < 3.0;  // Bigger zone
```

### 3. Reward Movement Toward Stairs During Grace Period
```javascript
// NEW: Encourage moving toward stairs
if (inGracePeriod && onGround) {
    if (movingTowardStairs) {
        reward += 0.5;  // Good!
    } else {
        reward -= 0.5;  // Bad!
    }
}
```

### 4. Reduced Entropy
```javascript
// OLD
entropyCoef: 0.2  // Too random!

// NEW
entropyCoef: 0.1  // Balanced exploration
```

## What This Does

### Grace Period (First 50 Steps):
```
Agent at start → Can move around freely
Moving toward stairs → +0.5 reward
Moving away from stairs → -0.5 penalty
Still on ground after 50 steps → -100 (episode ends)
```

### Grace Zone (2x3 units around start):
```
Agent can explore starting area
Has room to maneuver
Can try different approaches to stairs
Leaving zone while on ground → -100 (episode ends)
```

### After Grace Period:
```
Any ground contact → -100 (episode ends immediately)
Must be on stairs to survive
```

## Expected Behavior

### Episodes 1-50:
```
Agent explores starting area
Tries different movements
Gets +0.5 for moving toward stairs
Discovers: "Forward = good"
```

### Episodes 51-100:
```
Agent consistently moves toward stairs
Reaches stairs within 50 steps
Gets +10 for reaching Step 0
Discovers: "Stairs = safe + rewards"
```

### Episodes 100+:
```
Agent efficiently reaches stairs
Climbs to higher steps
Avoids ground completely
```

## Summary

**Changes:**
1. ✅ Grace period: 10 → 50 steps
2. ✅ Grace zone: 1x1 → 2x3 units
3. ✅ Added movement rewards during grace period
4. ✅ Reduced entropy: 0.2 → 0.1

**Result:** Agent has time to learn how to reach stairs before getting -100 penalty!
