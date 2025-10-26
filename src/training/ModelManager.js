/**
 * ModelManager handles persistent model storage, versioning, and automatic loading
 * Ensures progressive learning across training sessions
 * Works in both browser (localStorage) and Node.js (file system)
 */
export class ModelManager {
    constructor(agent, config = {}) {
        this.agent = agent;
        
        // Detect if running in Node.js or browser
        this.isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
        
        this.config = {
            modelBasePath: this.isNode ? 'file://./training-data/models/climbing-model' : 'localstorage://climbing-model',
            metadataKey: 'climbing-model-metadata',
            metadataPath: './training-data/models/metadata.json',
            autoSave: true,
            saveInterval: 10, // Save every N episodes
            ...config
        };
        
        this.metadata = {
            version: 0,
            totalEpisodes: 0,
            totalSteps: 0,
            bestReward: -Infinity,
            avgReward: 0,
            successRate: 0,
            lastSaved: null,
            trainingHistory: []
        };
    }
    
    /**
     * Initialize the model manager and load the latest model if available
     */
    async init() {
        console.log('📦 Initializing Model Manager...');
        
        // Try to load existing metadata
        const loaded = await this.loadMetadata();
        
        if (loaded) {
            console.log(`📊 Found existing model (v${this.metadata.version})`);
            console.log(`   Total episodes: ${this.metadata.totalEpisodes}`);
            console.log(`   Best reward: ${this.metadata.bestReward.toFixed(2)}`);
            console.log(`   Success rate: ${(this.metadata.successRate * 100).toFixed(1)}%`);
            
            // Automatically load the latest model
            await this.loadLatestModel();
        } else {
            console.log('📦 No existing model found, starting fresh');
        }
    }
    
    /**
     * Load metadata from storage (localStorage or file system)
     */
    async loadMetadata() {
        try {
            if (this.isNode) {
                // Node.js: Load from file system
                const fs = await import('fs');
                const path = await import('path');
                
                const metadataPath = this.config.metadataPath;
                if (fs.existsSync(metadataPath)) {
                    const metadataStr = fs.readFileSync(metadataPath, 'utf8');
                    this.metadata = JSON.parse(metadataStr);
                    return true;
                }
                return false;
            } else {
                // Browser: Load from localStorage
                const metadataStr = localStorage.getItem(this.config.metadataKey);
                if (metadataStr) {
                    this.metadata = JSON.parse(metadataStr);
                    return true;
                }
                return false;
            }
        } catch (error) {
            console.error('Error loading metadata:', error);
            return false;
        }
    }
    
    /**
     * Save metadata to storage (localStorage or file system)
     */
    async saveMetadata() {
        try {
            if (this.isNode) {
                // Node.js: Save to file system
                const fs = await import('fs');
                const path = await import('path');
                
                const metadataPath = this.config.metadataPath;
                const metadataDir = path.dirname(metadataPath);
                
                // Create directory if it doesn't exist
                if (!fs.existsSync(metadataDir)) {
                    fs.mkdirSync(metadataDir, { recursive: true });
                }
                
                fs.writeFileSync(metadataPath, JSON.stringify(this.metadata, null, 2));
            } else {
                // Browser: Save to localStorage
                localStorage.setItem(this.config.metadataKey, JSON.stringify(this.metadata));
            }
        } catch (error) {
            console.error('Error saving metadata:', error);
            throw error;
        }
    }
    
    /**
     * Load the latest model version
     */
    async loadLatestModel() {
        try {
            console.log(`🔄 Loading model version ${this.metadata.version}...`);
            
            const modelPath = this.config.modelBasePath;
            await this.agent.loadModel(modelPath);
            
            console.log('✅ Model loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            console.log('⚠️ Continuing with fresh model');
            return false;
        }
    }
    
    /**
     * Save the current model with updated metadata
     */
    async saveModel(episodeStats = {}) {
        try {
            console.log('💾 Saving model...');
            
            // Update metadata
            this.metadata.version++;
            this.metadata.totalEpisodes += episodeStats.episodeCount || 0;
            this.metadata.totalSteps += episodeStats.totalSteps || 0;
            this.metadata.lastSaved = new Date().toISOString();
            
            if (episodeStats.avgReward !== undefined) {
                this.metadata.avgReward = episodeStats.avgReward;
                if (episodeStats.avgReward > this.metadata.bestReward) {
                    this.metadata.bestReward = episodeStats.avgReward;
                }
            }
            
            if (episodeStats.successRate !== undefined) {
                this.metadata.successRate = episodeStats.successRate;
            }
            
            // Add to training history
            this.metadata.trainingHistory.push({
                version: this.metadata.version,
                timestamp: this.metadata.lastSaved,
                episodes: episodeStats.episodeCount || 0,
                avgReward: episodeStats.avgReward || 0,
                successRate: episodeStats.successRate || 0
            });
            
            // Keep only last 100 history entries
            if (this.metadata.trainingHistory.length > 100) {
                this.metadata.trainingHistory = this.metadata.trainingHistory.slice(-100);
            }
            
            // Save the model
            const modelPath = this.config.modelBasePath;
            await this.agent.saveModel(modelPath);
            
            // Save metadata
            await this.saveMetadata();
            
            console.log(`✅ Model saved (v${this.metadata.version})`);
            console.log(`   Total episodes: ${this.metadata.totalEpisodes}`);
            console.log(`   Avg reward: ${this.metadata.avgReward.toFixed(2)}`);
            console.log(`   Best reward: ${this.metadata.bestReward.toFixed(2)}`);
            console.log(`   Success rate: ${(this.metadata.successRate * 100).toFixed(1)}%`);
            
            return true;
        } catch (error) {
            console.error('Error saving model:', error);
            throw error;
        }
    }
    
    /**
     * Check if model should be saved based on episode count
     */
    shouldSave(currentEpisode) {
        if (!this.config.autoSave) return false;
        return currentEpisode % this.config.saveInterval === 0;
    }
    
    /**
     * Get current metadata
     */
    getMetadata() {
        return { ...this.metadata };
    }
    
    /**
     * Reset all saved models and metadata
     */
    async reset() {
        console.log('🗑️ Resetting all saved models...');
        
        try {
            // Delete model from storage
            if (this.agent.deleteModel) {
                await this.agent.deleteModel(this.config.modelBasePath);
            }
            
            // Reset metadata
            this.metadata = {
                version: 0,
                totalEpisodes: 0,
                totalSteps: 0,
                bestReward: -Infinity,
                avgReward: 0,
                successRate: 0,
                lastSaved: null,
                trainingHistory: []
            };
            
            // Clear from localStorage
            localStorage.removeItem(this.config.metadataKey);
            
            console.log('✅ All models and metadata reset');
        } catch (error) {
            console.error('Error resetting models:', error);
            throw error;
        }
    }
}
