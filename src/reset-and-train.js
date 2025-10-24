/**
 * Quick reset and retrain script
 */

export async function resetAndTrain(app) {
    console.log('🔄 Resetting model and starting fresh training...\n');
    
    if (!app || !app.modelManager) {
        console.error('❌ App or model manager not found');
        return;
    }
    
    try {
        // Step 1: Reset the model
        console.log('Step 1: Resetting model...');
        await app.modelManager.reset();
        console.log('✅ Model reset complete\n');
        
        // Step 2: Show new reward structure
        console.log('Step 2: New Reward Structure:');
        const env = app.environment;
        console.log('  Height Gain:', env.config.rewardWeights.heightGain);
        console.log('  Ledge Grab:', env.config.rewardWeights.ledgeGrab);
        console.log('  Goal Reached:', env.config.rewardWeights.goalReached);
        console.log('  Fall Penalty:', env.config.rewardWeights.fall);
        console.log('  Out of Bounds:', env.config.rewardWeights.outOfBounds);
        console.log('');
        
        // Step 3: Start training
        console.log('Step 3: Starting training...');
        console.log('Training will run for 1000 episodes');
        console.log('Watch for:');
        console.log('  - Reward increasing over time');
        console.log('  - Agent staying on platform');
        console.log('  - Agent approaching wall');
        console.log('  - Agent using ledges');
        console.log('');
        
        // Trigger training start
        const startButton = document.getElementById('btn-start');
        if (startButton && !startButton.disabled) {
            startButton.click();
            console.log('✅ Training started!\n');
        } else {
            console.log('⚠️ Please click "Start Training" button manually\n');
        }
        
        console.log('📊 Monitor progress in the UI');
        console.log('Expected timeline:');
        console.log('  Episode 100: Reward > -10 (learning boundaries)');
        console.log('  Episode 300: Reward > 10 (approaching wall)');
        console.log('  Episode 500: Reward > 30 (using ledges)');
        console.log('  Episode 1000: Reward > 50 (climbing well)');
        
    } catch (error) {
        console.error('❌ Error during reset:', error);
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.resetAndTrain = resetAndTrain;
    console.log('💡 Reset script loaded. Run: resetAndTrain(window.climbingGame)');
}
