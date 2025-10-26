# Directory Creation Fix

## 🐛 Issue

**Error**: `ENOENT: no such file or directory, mkdir '/Users/.../training-data/models/climbing-model-actor'`

**Cause**: TensorFlow.js tries to create the model directory, but the parent directory doesn't exist.

---

## ✅ Solution

Added automatic directory creation in both PPOAgent and DQNAgent before saving models.

### PPOAgent Fix

```javascript
async saveModel(path) {
    try {
        // If using file:// protocol, create directories first
        if (path.startsWith('file://')) {
            const fs = await import('fs');
            const pathModule = await import('path');
            
            // Extract file path from file:// URL
            const filePath = path.replace('file://', '');
            const actorDir = filePath + '-actor';
            const criticDir = filePath + '-critic';
            
            // Create directories recursively
            const actorDirPath = pathModule.dirname(actorDir);
            const criticDirPath = pathModule.dirname(criticDir);
            
            if (!fs.existsSync(actorDirPath)) {
                fs.mkdirSync(actorDirPath, { recursive: true });
            }
            if (!fs.existsSync(criticDirPath)) {
                fs.mkdirSync(criticDirPath, { recursive: true });
            }
        }
        
        // Save models...
        await this.actorNetwork.save(path + '-actor');
        await this.criticNetwork.save(path + '-critic');
    }
}
```

### DQNAgent Fix

```javascript
async saveModel(path) {
    try {
        // If using file:// protocol, create directory first
        if (path.startsWith('file://')) {
            const fs = await import('fs');
            const pathModule = await import('path');
            
            const filePath = path.replace('file://', '');
            const dirPath = pathModule.dirname(filePath);
            
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        }
        
        // Save model...
        await this.qNetwork.save(path);
    }
}
```

---

## 📁 Directory Structure Created

When training starts, these directories are automatically created:

```
training-data/
├── models/
│   ├── climbing-model-actor/
│   │   ├── model.json
│   │   └── weights.bin
│   ├── climbing-model-critic/
│   │   ├── model.json
│   │   └── weights.bin
│   └── metadata.json
└── trajectories/
    ├── metadata.json
    └── trajectories/
        └── episode_*.json
```

---

## ✅ Now Working

### Terminal Training
```bash
npm run train:ppo
```

**Output**:
```
💾 Saving model...
Actor model saved to: file://./training-data/models/climbing-model-actor
Critic model saved to: file://./training-data/models/climbing-model-critic
✅ Model saved (v1)
```

**No more directory errors!** ✅

---

## 🔧 Files Modified

1. **`src/rl/PPOAgent.js`** - Added directory creation before saving
2. **`src/rl/DQNAgent.js`** - Added directory creation before saving

---

## 💡 How It Works

1. **Detects file:// protocol** - Only creates directories for file system saves
2. **Extracts path** - Removes `file://` prefix to get actual path
3. **Creates parent directories** - Uses `{ recursive: true }` to create all needed directories
4. **Saves model** - TensorFlow.js can now save successfully

---

## 🎯 Benefits

- ✅ **Automatic** - No manual directory creation needed
- ✅ **Safe** - Only creates directories when using file system
- ✅ **Recursive** - Creates all parent directories
- ✅ **Works in browser** - Doesn't affect localStorage saves

---

All directory issues resolved! Training now saves models successfully. 🎉
