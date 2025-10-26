/**
 * BrowserTrajectoryLoader - Load trajectories from file system in browser
 * Uses fetch API to load trajectory files saved by headless training
 */

export class BrowserTrajectoryLoader {
    constructor(config = {}) {
        this.config = {
            trajectoryPath: '/training-data/trajectories',
            ...config
        };
        
        this.trajectories = [];
        this.metadata = null;
    }
    
    /**
     * Initialize and load trajectory metadata
     */
    async init() {
        try {
            // Load metadata file
            const metadataUrl = `${this.config.trajectoryPath}/metadata.json`;
            const response = await fetch(metadataUrl);
            
            if (!response.ok) {
                console.warn('No trajectory metadata found. Run headless training first.');
                return false;
            }
            
            this.metadata = await response.json();
            this.trajectories = this.metadata.trajectories || [];
            
            console.log(`📊 Loaded ${this.trajectories.length} trajectory metadata entries`);
            return true;
            
        } catch (error) {
            console.warn('Could not load trajectory metadata:', error.message);
            console.log('💡 Tip: Run "npm run train:ppo" first to generate training data');
            return false;
        }
    }
    
    /**
     * Load a specific trajectory by episode number
     */
    async loadTrajectory(episode) {
        const metadata = this.trajectories.find(t => t.episode === episode);
        if (!metadata) {
            console.warn(`Trajectory for episode ${episode} not found`);
            return null;
        }
        
        try {
            const trajectoryUrl = `${this.config.trajectoryPath}/trajectories/${metadata.filename}`;
            const response = await fetch(trajectoryUrl);
            
            if (!response.ok) {
                console.error(`Failed to load trajectory: ${response.statusText}`);
                return null;
            }
            
            const trajectory = await response.json();
            return trajectory;
            
        } catch (error) {
            console.error(`Error loading trajectory ${episode}:`, error);
            return null;
        }
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
            firstEpisode: this.trajectories[0]?.episode || 0,
            lastEpisode: this.trajectories[this.trajectories.length - 1]?.episode || 0
        };
    }
}
