/**
 * Reset the model to start fresh training
 * Run: resetModel(window.climbingGame)
 */

window.resetModel = function (game) {
    console.log('🔄 Resetting model to start fresh...\n');

    if (!game || !game.agent) {
        console.error('❌ Game not initialized');
        return;
    }

    const agent = game.agent;
    const modelManager = game.modelManager;

    // Reset epsilon to start value
    if (agent.epsilon !== undefined) {
        agent.epsilon = 1.0;
        console.log('✅ Reset epsilon to 1.0 (full exploration)');
    }

    // Clear replay buffer if DQN
    if (agent.memory && agent.memory.clear) {
        agent.memory.clear();
        console.log('✅ Cleared replay buffer');
    }

    // Reset model manager stats
    if (modelManager) {
        modelManager.metadata.totalEpisodes = 0;
        modelManager.metadata.totalSteps = 0;
        modelManager.metadata.bestReward = -Infinity;
        modelManager.metadata.avgReward = 0;
        modelManager.metadata.successRate = 0;
        console.log('✅ Reset model manager metadata');
    }

    // Reset orchestrator stats
    if (game.orchestrator) {
        game.orchestrator.currentEpisode = 0;
        game.orchestrator.rewardHistory = [];
        game.orchestrator.successHistory = [];
        console.log('✅ Reset orchestrator stats');
    }

    // Optionally reinitialize neural networks
    const reinitNetworks = confirm('Do you want to reinitialize the neural networks? (This will erase all learned weights)');

    if (reinitNetworks) {
        if (agent.constructor.name === 'DQNAgent') {
            // Reinitialize DQN networks
            const stateSize = agent.stateSize;
            const actionSize = agent.actionSize;

            // Dispose old models
            if (agent.model) agent.model.dispose();
            if (agent.targetModel) agent.targetModel.dispose();

            // Create new models
            agent.model = agent.createModel(stateSize, actionSize);
            agent.targetModel = agent.createModel(stateSize, actionSize);
            agent.updateTargetNetwork();

            console.log('✅ Reinitialized DQN networks');
        } else if (agent.constructor.name === 'PPOAgent') {
            // Reinitialize PPO networks
            const stateSize = agent.stateSize;
            const actionSize = agent.actionSize;

            // Dispose old models
            if (agent.policyModel) agent.policyModel.dispose();
            if (agent.valueModel) agent.valueModel.dispose();

            // Create new models
            agent.policyModel = agent.createPolicyModel(stateSize, actionSize);
            agent.valueModel = agent.valueModel(stateSize);

            console.log('✅ Reinitialized PPO networks');
        }
    }

    // Clear localStorage
    const clearStorage = confirm('Do you want to clear saved models from localStorage?');
    if (clearStorage) {
        try {
            localStorage.removeItem('climbing-model');
            localStorage.removeItem('climbing-model-metadata');
            console.log('✅ Cleared localStorage');
        } catch (e) {
            console.error('❌ Failed to clear localStorage:', e);
        }
    }

    console.log('\n🎉 Model reset complete!');
    console.log('You can now start fresh training with the new reward structure.');
    console.log('Click "Start Training" to begin.');
};

console.log('💡 Model reset loaded! Run: resetModel(window.climbingGame)');
