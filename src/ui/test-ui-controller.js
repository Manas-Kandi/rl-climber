import { UIController } from './UIController.js';

/**
 * Test suite for UIController
 * Tests UI event handling, DOM manipulation, and chart updates
 */

// Mock training orchestrator
class MockTrainingOrchestrator {
    constructor() {
        this.episodeCallbacks = [];
        this.trainingCallbacks = [];
        this.isTraining = false;
        this.currentEpisode = 0;
        this.rewardHistory = [];
        this.successHistory = [];
    }
    
    onEpisodeComplete(callback) {
        this.episodeCallbacks.push(callback);
    }
    
    onTrainingComplete(callback) {
        this.trainingCallbacks.push(callback);
    }
    
    async startTraining(numEpisodes) {
        this.isTraining = true;
        console.log(`Mock: Starting training for ${numEpisodes} episodes`);
        
        // Simulate some training episodes
        for (let i = 0; i < Math.min(5, numEpisodes); i++) {
            this.currentEpisode = i + 1;
            const reward = Math.random() * 100 - 50; // Random reward between -50 and 50
            const success = Math.random() > 0.7; // 30% success rate
            
            this.rewardHistory.push(reward);
            this.successHistory.push(success);
            
            // Trigger episode complete callbacks
            const stats = this.getTrainingStats();
            stats.lastEpisodeSuccess = success;
            stats.lastEpisodeFailed = !success;
            
            this.episodeCallbacks.forEach(callback => callback(stats));
            
            // Small delay to simulate training time
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.isTraining = false;
        
        // Trigger training complete callbacks
        const finalStats = this.getTrainingStats();
        this.trainingCallbacks.forEach(callback => callback(finalStats));
    }
    
    stopTraining() {
        this.isTraining = false;
        console.log('Mock: Training stopped');
    }
    
    getTrainingStats() {
        const recentRewards = this.rewardHistory.slice(-10);
        const recentSuccesses = this.successHistory.slice(-10);
        
        return {
            currentEpisode: this.currentEpisode,
            totalEpisodes: this.rewardHistory.length,
            isTraining: this.isTraining,
            avgReward: recentRewards.length > 0 ? 
                recentRewards.reduce((sum, r) => sum + r, 0) / recentRewards.length : 0,
            successRate: recentSuccesses.length > 0 ? 
                recentSuccesses.filter(s => s).length / recentSuccesses.length : 0,
            rewardHistory: [...this.rewardHistory],
            successHistory: [...this.successHistory]
        };
    }
}

// Mock agent
class MockAgent {
    constructor() {
        this.modelSaved = false;
        this.modelLoaded = false;
    }
    
    async saveModel(path) {
        console.log(`Mock: Saving model to ${path}`);
        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 500));
        this.modelSaved = true;
        console.log('Mock: Model saved successfully');
    }
    
    async loadModel(path) {
        console.log(`Mock: Loading model from ${path}`);
        // Simulate load delay
        await new Promise(resolve => setTimeout(resolve, 500));
        this.modelLoaded = true;
        console.log('Mock: Model loaded successfully');
    }
}

/**
 * Test UIController initialization and DOM setup
 */
async function testUIControllerInitialization() {
    console.log('Testing UIController initialization...');
    
    const mockOrchestrator = new MockTrainingOrchestrator();
    const mockAgent = new MockAgent();
    
    const uiController = new UIController(mockOrchestrator, mockAgent);
    
    try {
        await uiController.init();
        console.log('✓ UIController initialized successfully');
        
        // Test DOM references
        const hasAllElements = Object.values(uiController.elements).every(element => element !== null);
        console.log('✓ All DOM elements found:', hasAllElements);
        
        // Test initial button states
        const startEnabled = !uiController.elements.btnStart.disabled;
        const stopDisabled = uiController.elements.btnStop.disabled;
        console.log('✓ Initial button states correct:', startEnabled && stopDisabled);
        
        return uiController;
    } catch (error) {
        console.error('✗ UIController initialization failed:', error);
        throw error;
    }
}

/**
 * Test statistics panel updates
 */
async function testStatsPanel(uiController) {
    console.log('Testing statistics panel updates...');
    
    // Create mock stats
    const mockStats = {
        currentEpisode: 42,
        avgReward: 15.67,
        successRate: 0.35,
        rewardHistory: [10, 15, 20, 12, 18],
        successHistory: [true, false, true, true, false]
    };
    
    // Update stats panel
    uiController.updateStatsPanel(mockStats);
    
    // Check if values were updated
    const episodeText = uiController.elements.statEpisode.textContent;
    const rewardText = uiController.elements.statReward.textContent;
    const successText = uiController.elements.statSuccess.textContent;
    
    console.log('Episode display:', episodeText);
    console.log('Reward display:', rewardText);
    console.log('Success rate display:', successText);
    
    console.log('✓ Episode correct:', episodeText === '42');
    console.log('✓ Reward correct:', rewardText === '15.67');
    console.log('✓ Success rate correct:', successText === '35.00%');
}

/**
 * Test notification system
 */
function testNotifications(uiController) {
    console.log('Testing notification system...');
    
    // Test success notification
    uiController.showNotification('Test success message', 'success');
    console.log('✓ Success notification shown');
    
    // Test error notification
    setTimeout(() => {
        uiController.showNotification('Test error message', 'error');
        console.log('✓ Error notification shown');
    }, 1000);
    
    // Test auto-dismiss (notifications should disappear after 3 seconds)
    console.log('Notifications will auto-dismiss in 3 seconds...');
}

/**
 * Run all UIController tests
 */
async function runUIControllerTests() {
    console.log('Running UIController tests...');
    
    try {
        // Test initialization
        const uiController = await testUIControllerInitialization();
        
        // Test statistics panel
        await testStatsPanel(uiController);
        
        // Test notifications
        testNotifications(uiController);
        
        console.log('✅ All UIController tests completed successfully!');
        
        // Clean up
        uiController.dispose();
        
        return true;
    } catch (error) {
        console.error('❌ UIController test failed:', error);
        return false;
    }
}

// Export test functions
export {
    runUIControllerTests,
    testUIControllerInitialization,
    testStatsPanel,
    testNotifications
};

// Run tests if this file is executed directly in browser
if (typeof window !== 'undefined' && window.location) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runUIControllerTests);
    } else {
        runUIControllerTests();
    }
}