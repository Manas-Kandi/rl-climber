/**
 * Diagnostic utilities to debug training issues
 */

/**
 * Check if the environment is working correctly
 */
export async function diagnoseEnvironment(app) {
    console.log('🔍 Running Environment Diagnostics...\n');
    
    if (!app || !app.environment) {
        console.error('❌ App or environment not found');
        return;
    }
    
    const env = app.environment;
    
    // Test 1: Reset and get initial state
    console.log('Test 1: Environment Reset');
    const initialState = env.reset();
    console.log('  Initial state:', initialState);
    console.log('  State length:', initialState.length);
    console.log('  ✅ Reset works\n');
    
    // Test 2: Take a few random actions and check rewards
    console.log('Test 2: Random Actions and Rewards');
    let totalReward = 0;
    for (let i = 0; i < 10; i++) {
        const action = Math.floor(Math.random() * 6);
        const result = env.step(action);
        console.log(`  Step ${i+1}: Action=${action}, Reward=${result.reward.toFixed(3)}, Done=${result.done}`);
        totalReward += result.reward;
        
        if (result.done) {
            console.log('  Episode ended early');
            break;
        }
    }
    console.log(`  Total reward: ${totalReward.toFixed(3)}`);
    console.log('  ✅ Step function works\n');
    
    // Test 3: Check reward weights
    console.log('Test 3: Reward Configuration');
    console.log('  Reward weights:', env.config.rewardWeights);
    console.log('  Goal height:', env.config.goalHeight);
    console.log('  Fall threshold:', env.config.fallThreshold);
    console.log('  Max steps:', env.config.maxSteps);
    console.log('  ✅ Configuration loaded\n');
    
    // Test 4: Check agent position
    console.log('Test 4: Agent Physics');
    if (env.agentBody) {
        const pos = env.physicsEngine.getBodyPosition(env.agentBody);
        const vel = env.physicsEngine.getBodyVelocity(env.agentBody);
        console.log('  Agent position:', pos);
        console.log('  Agent velocity:', vel);
        console.log('  ✅ Physics working\n');
    } else {
        console.error('  ❌ Agent body not found\n');
    }
    
    console.log('✅ Diagnostics complete!\n');
}

/**
 * Check if the agent is learning
 */
export function diagnoseAgent(app) {
    console.log('🔍 Running Agent Diagnostics...\n');
    
    if (!app || !app.agent) {
        console.error('❌ App or agent not found');
        return;
    }
    
    const agent = app.agent;
    
    // Test 1: Check agent type
    console.log('Test 1: Agent Configuration');
    console.log('  Agent type:', agent.constructor.name);
    console.log('  State size:', agent.stateSize);
    console.log('  Action size:', agent.actionSize);
    
    if (agent.epsilon !== undefined) {
        console.log('  Epsilon:', agent.epsilon.toFixed(4));
        console.log('  Learning rate:', agent.learningRate);
        console.log('  Memory size:', agent.memory?.length || 0);
    }
    console.log('  ✅ Agent configured\n');
    
    // Test 2: Test action selection
    console.log('Test 2: Action Selection');
    const testState = new Float32Array([0, 0.5, 0, 0, 0, 0, 0, 0, 0]);
    try {
        const action = agent.selectAction(testState);
        console.log('  Selected action:', action);
        console.log('  ✅ Action selection works\n');
    } catch (error) {
        console.error('  ❌ Action selection failed:', error.message, '\n');
    }
    
    // Test 3: Check Q-values (for DQN)
    if (agent.getQValues) {
        console.log('Test 3: Q-Values');
        try {
            const qValues = agent.getQValues(testState);
            console.log('  Q-values:', qValues.map(v => v.toFixed(3)));
            const maxQ = Math.max(...qValues);
            const minQ = Math.min(...qValues);
            console.log('  Max Q:', maxQ.toFixed(3));
            console.log('  Min Q:', minQ.toFixed(3));
            console.log('  Range:', (maxQ - minQ).toFixed(3));
            
            if (maxQ === minQ) {
                console.warn('  ⚠️ All Q-values are the same! Agent may not be learning.');
            } else {
                console.log('  ✅ Q-values have variation\n');
            }
        } catch (error) {
            console.error('  ❌ Q-value check failed:', error.message, '\n');
        }
    }
    
    console.log('✅ Agent diagnostics complete!\n');
}

/**
 * Check training statistics
 */
export function diagnoseTraining(app) {
    console.log('🔍 Running Training Diagnostics...\n');
    
    if (!app || !app.orchestrator) {
        console.error('❌ App or orchestrator not found');
        return;
    }
    
    const orchestrator = app.orchestrator;
    const stats = orchestrator.getTrainingStats();
    
    console.log('Training Statistics:');
    console.log('  Current episode:', stats.currentEpisode);
    console.log('  Total episodes:', stats.totalEpisodes);
    console.log('  Average reward:', stats.avgReward.toFixed(3));
    console.log('  Success rate:', (stats.successRate * 100).toFixed(1) + '%');
    console.log('  Epsilon:', stats.epsilon?.toFixed(4) || 'N/A');
    console.log('');
    
    // Check reward history
    if (stats.rewardHistory.length > 0) {
        const recentRewards = stats.rewardHistory.slice(-10);
        console.log('Last 10 episode rewards:');
        recentRewards.forEach((r, i) => {
            console.log(`  Episode ${stats.totalEpisodes - 10 + i + 1}: ${r.toFixed(3)}`);
        });
        console.log('');
        
        const maxReward = Math.max(...stats.rewardHistory);
        const minReward = Math.min(...stats.rewardHistory);
        console.log('Reward statistics:');
        console.log('  Max reward:', maxReward.toFixed(3));
        console.log('  Min reward:', minReward.toFixed(3));
        console.log('  Range:', (maxReward - minReward).toFixed(3));
        console.log('');
        
        if (maxReward === minReward) {
            console.warn('⚠️ All rewards are the same! Check environment reward calculation.');
        }
        
        if (maxReward < 0) {
            console.warn('⚠️ All rewards are negative! Agent is not succeeding.');
        }
    } else {
        console.warn('⚠️ No reward history found');
    }
    
    // Check model manager
    if (app.modelManager) {
        const metadata = app.modelManager.getMetadata();
        console.log('Model Information:');
        console.log('  Version:', metadata.version);
        console.log('  Total episodes:', metadata.totalEpisodes);
        console.log('  Best reward:', metadata.bestReward.toFixed(3));
        console.log('  Last saved:', metadata.lastSaved);
        console.log('');
    }
    
    console.log('✅ Training diagnostics complete!\n');
}

/**
 * Run all diagnostics
 */
export async function runAllDiagnostics(app) {
    console.log('🔬 Running Complete Diagnostic Suite...\n');
    console.log('='.repeat(60) + '\n');
    
    await diagnoseEnvironment(app);
    console.log('='.repeat(60) + '\n');
    
    diagnoseAgent(app);
    console.log('='.repeat(60) + '\n');
    
    diagnoseTraining(app);
    console.log('='.repeat(60) + '\n');
    
    console.log('🎉 All diagnostics complete!');
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.diagnoseEnvironment = diagnoseEnvironment;
    window.diagnoseAgent = diagnoseAgent;
    window.diagnoseTraining = diagnoseTraining;
    window.runAllDiagnostics = runAllDiagnostics;
    console.log('💡 Diagnostics loaded. Run: runAllDiagnostics(window.climbingGame)');
}
