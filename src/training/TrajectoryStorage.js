/**
 * TrajectoryStorage - Persistent storage for training trajectories
 * Saves episode data to disk for later visualization
 */

import * as fs from 'fs';
import * as path from 'path';

export class TrajectoryStorage {
    constructor(config = {}) {
        this.config = {
            storagePath: './training-data/trajectories',
            maxTrajectories: 10000, // Keep last 10k episodes
            compressionEnabled: true,
            ...config
        };
        
        this.trajectories = [];
        this.metadataPath = null;
        this.trajectoriesPath = null;
    }
    
    /**
     * Initialize storage (create directories, load metadata)
     */
    async init() {
        // Create storage directory if it doesn't exist
        if (!fs.existsSync(this.config.storagePath)) {
            fs.mkdirSync(this.config.storagePath, { recursive: true });
        }
        
        this.metadataPath = path.join(this.config.storagePath, 'metadata.json');
        this.trajectoriesPath = path.join(this.config.storagePath, 'trajectories');
        
        // Create trajectories subdirectory
        if (!fs.existsSync(this.trajectoriesPath)) {
            fs.mkdirSync(this.trajectoriesPath, { recursive: true });
        }
        
        // Load metadata if exists
        await this.loadMetadata();
        
        console.log(`📁 Trajectory storage initialized at: ${this.config.storagePath}`);
        console.log(`   Existing trajectories: ${this.trajectories.length}`);
    }
    
    /**
     * Save a trajectory to disk
     */
    async saveTrajectory(trajectory) {
        if (!trajectory || !trajectory.episode) {
            console.warn('⚠️ Invalid trajectory, skipping save');
            return;
        }
        
        // Generate filename
        const filename = `episode_${trajectory.episode}_${Date.now()}.json`;
        const filepath = path.join(this.trajectoriesPath, filename);
        
        // Add metadata
        const trajectoryData = {
            ...trajectory,
            savedAt: new Date().toISOString(),
            filename: filename
        };
        
        // Save to disk
        try {
            fs.writeFileSync(filepath, JSON.stringify(trajectoryData, null, 2));
            
            // Add to metadata
            this.trajectories.push({
                episode: trajectory.episode,
                filename: filename,
                reward: trajectory.totalReward,
                steps: trajectory.steps.length,
                success: trajectory.success,
                savedAt: trajectoryData.savedAt
            });
            
            // Prune old trajectories if needed
            await this.pruneOldTrajectories();
            
            // Save metadata
            await this.saveMetadata();
            
        } catch (error) {
            console.error('❌ Error saving trajectory:', error);
        }
    }
    
    /**
     * Load a specific trajectory from disk
     */
    async loadTrajectory(episode) {
        const metadata = this.trajectories.find(t => t.episode === episode);
        if (!metadata) {
            console.warn(`⚠️ Trajectory for episode ${episode} not found`);
            return null;
        }
        
        const filepath = path.join(this.trajectoriesPath, metadata.filename);
        
        try {
            const data = fs.readFileSync(filepath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Error loading trajectory ${episode}:`, error);
            return null;
        }
    }
    
    /**
     * Load all trajectories metadata
     */
    async loadMetadata() {
        if (!fs.existsSync(this.metadataPath)) {
            this.trajectories = [];
            return;
        }
        
        try {
            const data = fs.readFileSync(this.metadataPath, 'utf8');
            const metadata = JSON.parse(data);
            this.trajectories = metadata.trajectories || [];
        } catch (error) {
            console.error('❌ Error loading metadata:', error);
            this.trajectories = [];
        }
    }
    
    /**
     * Save metadata to disk
     */
    async saveMetadata() {
        const metadata = {
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            totalTrajectories: this.trajectories.length,
            trajectories: this.trajectories
        };
        
        try {
            fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
        } catch (error) {
            console.error('❌ Error saving metadata:', error);
        }
    }
    
    /**
     * Prune old trajectories to stay under max limit
     */
    async pruneOldTrajectories() {
        if (this.trajectories.length <= this.config.maxTrajectories) {
            return;
        }
        
        // Sort by episode number
        this.trajectories.sort((a, b) => a.episode - b.episode);
        
        // Remove oldest trajectories
        const toRemove = this.trajectories.length - this.config.maxTrajectories;
        const removed = this.trajectories.splice(0, toRemove);
        
        // Delete files
        for (const metadata of removed) {
            const filepath = path.join(this.trajectoriesPath, metadata.filename);
            try {
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            } catch (error) {
                console.error(`❌ Error deleting trajectory file ${metadata.filename}:`, error);
            }
        }
        
        console.log(`🗑️ Pruned ${toRemove} old trajectories`);
    }
    
    /**
     * Get list of all trajectory metadata
     */
    getTrajectoryList() {
        return [...this.trajectories];
    }
    
    /**
     * Get trajectory count
     */
    getTrajectoryCount() {
        return this.trajectories.length;
    }
    
    /**
     * Get trajectories in a specific episode range
     */
    getTrajectoryRange(startEpisode, endEpisode) {
        return this.trajectories.filter(
            t => t.episode >= startEpisode && t.episode <= endEpisode
        );
    }
    
    /**
     * Get successful trajectories only
     */
    getSuccessfulTrajectories() {
        return this.trajectories.filter(t => t.success);
    }
    
    /**
     * Get statistics about stored trajectories
     */
    getStatistics() {
        if (this.trajectories.length === 0) {
            return {
                count: 0,
                avgReward: 0,
                successRate: 0,
                avgSteps: 0
            };
        }
        
        const totalReward = this.trajectories.reduce((sum, t) => sum + t.reward, 0);
        const successCount = this.trajectories.filter(t => t.success).length;
        const totalSteps = this.trajectories.reduce((sum, t) => sum + t.steps, 0);
        
        return {
            count: this.trajectories.length,
            avgReward: totalReward / this.trajectories.length,
            successRate: successCount / this.trajectories.length,
            avgSteps: totalSteps / this.trajectories.length,
            firstEpisode: this.trajectories[0].episode,
            lastEpisode: this.trajectories[this.trajectories.length - 1].episode
        };
    }
    
    /**
     * Clear all trajectories
     */
    async clearAll() {
        console.log('🗑️ Clearing all trajectories...');
        
        // Delete all trajectory files
        for (const metadata of this.trajectories) {
            const filepath = path.join(this.trajectoriesPath, metadata.filename);
            try {
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            } catch (error) {
                console.error(`❌ Error deleting ${metadata.filename}:`, error);
            }
        }
        
        // Clear metadata
        this.trajectories = [];
        await this.saveMetadata();
        
        console.log('✅ All trajectories cleared');
    }
}
