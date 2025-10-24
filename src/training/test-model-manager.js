/**
 * Test suite for ModelManager
 * Tests model persistence, versioning, and metadata management
 */

import { ModelManager } from './ModelManager.js';
import { DQNAgent } from '../rl/DQNAgent.js';

/**
 * Run all ModelManager tests
 */
export async function runModelManagerTests() {
    console.log('🧪 Starting ModelManager Tests...\n');
    
    let passedTests = 0;
    let failedTests = 0;
    
    // Test 1: Initialization with no existing model
    try {
        console.log('Test 1: Initialize ModelManager with no existing model');
        
        // Clear any existing data
        localStorage.removeItem('climbing-model-metadata');
        
        const agent = new DQNAgent(9, 6);
        const modelManager = new ModelManager(agent);
        await modelManager.init();
        
        const metadata = modelManager.getMetadata();
        
        if (metadata.version === 0 && metadata.totalEpisodes === 0) {
            console.log('✅ Test 1 PASSED: Fresh initialization works correctly\n');
            passedTests++;
        } else {
            console.error('❌ Test 1 FAILED: Metadata not initialized correctly');
            console.error('Expected: version=0, totalEpisodes=0');
            console.error('Got:', metadata);
            failedTests++;
        }
        
        agent.dispose();
    } catch (error) {
        console.error('❌ Test 1 FAILED with error:', error.message, '\n');
        failedTests++;
    }
    
    // Test 2: Save and load model
    try {
        console.log('Test 2: Save and load model with metadata');
        
        const agent = new DQNAgent(9, 6);
        const modelManager = new ModelManager(agent);
        await modelManager.init();
        
        // Save model with stats
        await modelManager.saveModel({
            episodeCount: 100,
            totalSteps: 50000,
            avgReward: 45.5,
            successRate: 0.75
        });
        
        const metadata = modelManager.getMetadata();
        
        if (metadata.version === 1 && 
            metadata.totalEpisodes === 100 &&
            metadata.avgReward === 45.5 &&
            metadata.successRate === 0.75) {
            console.log('✅ Test 2 PASSED: Model saved with correct metadata\n');
            passedTests++;
        } else {
            console.error('❌ Test 2 FAILED: Metadata not saved correctly');
            console.error('Expected: version=1, totalEpisodes=100, avgReward=45.5');
            console.error('Got:', metadata);
            failedTests++;
        }
        
        agent.dispose();
    } catch (error) {
        console.error('❌ Test 2 FAILED with error:', error.message, '\n');
        failedTests++;
    }
    
    // Test 3: Cumulative episode tracking
    try {
        console.log('Test 3: Cumulative episode tracking across saves');
        
        const agent = new DQNAgent(9, 6);
        const modelManager = new ModelManager(agent);
        await modelManager.init();
        
        // First save
        await modelManager.saveModel({
            episodeCount: 50,
            totalSteps: 25000,
            avgReward: 30.0,
            successRate: 0.5
        });
        
        // Second save
        await modelManager.saveModel({
            episodeCount: 50,
            totalSteps: 25000,
            avgReward: 40.0,
            successRate: 0.6
        });
        
        const metadata = modelManager.getMetadata();
        
        if (metadata.version === 2 && metadata.totalEpisodes === 100) {
            console.log('✅ Test 3 PASSED: Cumulative episodes tracked correctly\n');
            passedTests++;
        } else {
            console.error('❌ Test 3 FAILED: Cumulative tracking incorrect');
            console.error('Expected: version=2, totalEpisodes=100');
            console.error('Got:', metadata);
            failedTests++;
        }
        
        agent.dispose();
    } catch (error) {
        console.error('❌ Test 3 FAILED with error:', error.message, '\n');
        failedTests++;
    }
    
    // Test 4: Best reward tracking
    try {
        console.log('Test 4: Best reward tracking');
        
        const agent = new DQNAgent(9, 6);
        const modelManager = new ModelManager(agent);
        await modelManager.init();
        
        // Save with lower reward
        await modelManager.saveModel({
            episodeCount: 10,
            avgReward: 20.0
        });
        
        // Save with higher reward
        await modelManager.saveModel({
            episodeCount: 10,
            avgReward: 50.0
        });
        
        // Save with lower reward again
        await modelManager.saveModel({
            episodeCount: 10,
            avgReward: 30.0
        });
        
        const metadata = modelManager.getMetadata();
        
        if (metadata.bestReward === 50.0) {
            console.log('✅ Test 4 PASSED: Best reward tracked correctly\n');
            passedTests++;
        } else {
            console.error('❌ Test 4 FAILED: Best reward not tracked correctly');
            console.error('Expected: bestReward=50.0');
            console.error('Got:', metadata.bestReward);
            failedTests++;
        }
        
        agent.dispose();
    } catch (error) {
        console.error('❌ Test 4 FAILED with error:', error.message, '\n');
        failedTests++;
    }
    
    // Test 5: Training history
    try {
        console.log('Test 5: Training history tracking');
        
        const agent = new DQNAgent(9, 6);
        const modelManager = new ModelManager(agent);
        await modelManager.init();
        
        // Save multiple times
        for (let i = 0; i < 5; i++) {
            await modelManager.saveModel({
                episodeCount: 10,
                avgReward: 10 + i * 5,
                successRate: 0.1 + i * 0.1
            });
        }
        
        const metadata = modelManager.getMetadata();
        
        if (metadata.trainingHistory.length === 5 &&
            metadata.trainingHistory[0].version === 1 &&
            metadata.trainingHistory[4].version === 5) {
            console.log('✅ Test 5 PASSED: Training history tracked correctly\n');
            passedTests++;
        } else {
            console.error('❌ Test 5 FAILED: Training history not tracked correctly');
            console.error('Expected: 5 history entries');
            console.error('Got:', metadata.trainingHistory.length, 'entries');
            failedTests++;
        }
        
        agent.dispose();
    } catch (error) {
        console.error('❌ Test 5 FAILED with error:', error.message, '\n');
        failedTests++;
    }
    
    // Test 6: Reset functionality
    try {
        console.log('Test 6: Reset all models and metadata');
        
        const agent = new DQNAgent(9, 6);
        const modelManager = new ModelManager(agent);
        await modelManager.init();
        
        // Save some data
        await modelManager.saveModel({
            episodeCount: 100,
            avgReward: 50.0
        });
        
        // Reset
        await modelManager.reset();
        
        const metadata = modelManager.getMetadata();
        
        if (metadata.version === 0 && 
            metadata.totalEpisodes === 0 &&
            metadata.bestReward === -Infinity) {
            console.log('✅ Test 6 PASSED: Reset works correctly\n');
            passedTests++;
        } else {
            console.error('❌ Test 6 FAILED: Reset did not clear metadata');
            console.error('Expected: version=0, totalEpisodes=0, bestReward=-Infinity');
            console.error('Got:', metadata);
            failedTests++;
        }
        
        agent.dispose();
    } catch (error) {
        console.error('❌ Test 6 FAILED with error:', error.message, '\n');
        failedTests++;
    }
    
    // Test 7: Load existing model on init
    try {
        console.log('Test 7: Load existing model on initialization');
        
        // First, create and save a model
        const agent1 = new DQNAgent(9, 6);
        const modelManager1 = new ModelManager(agent1);
        await modelManager1.init();
        
        await modelManager1.saveModel({
            episodeCount: 50,
            avgReward: 35.0
        });
        
        agent1.dispose();
        
        // Now create a new instance and check if it loads
        const agent2 = new DQNAgent(9, 6);
        const modelManager2 = new ModelManager(agent2);
        await modelManager2.init();
        
        const metadata = modelManager2.getMetadata();
        
        if (metadata.version === 1 && metadata.totalEpisodes === 50) {
            console.log('✅ Test 7 PASSED: Existing model loaded on init\n');
            passedTests++;
        } else {
            console.error('❌ Test 7 FAILED: Existing model not loaded');
            console.error('Expected: version=1, totalEpisodes=50');
            console.error('Got:', metadata);
            failedTests++;
        }
        
        agent2.dispose();
    } catch (error) {
        console.error('❌ Test 7 FAILED with error:', error.message, '\n');
        failedTests++;
    }
    
    // Clean up
    console.log('🧹 Cleaning up test data...');
    localStorage.removeItem('climbing-model-metadata');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 ModelManager Test Results:');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50) + '\n');
    
    return {
        passed: passedTests,
        failed: failedTests,
        total: passedTests + failedTests
    };
}

// Auto-run tests if this file is imported
if (typeof window !== 'undefined') {
    window.runModelManagerTests = runModelManagerTests;
    console.log('💡 ModelManager tests loaded. Run with: runModelManagerTests()');
}
