/**
 * Comprehensive Auto Play Debug Script
 * Run in browser console: debugAutoPlay()
 */

async function debugAutoPlay() {
    console.clear();
    console.log('🔍 ═══════════════════════════════════════════════════════');
    console.log('🔍 AUTO PLAY COMPREHENSIVE DEBUG');
    console.log('🔍 ═══════════════════════════════════════════════════════\n');
    
    const app = window.climbingGame;
    
    if (!app) {
        console.error('❌ CRITICAL: App not initialized');
        return;
    }
    
    // 1. Check App Components
    console.log('📦 1. CHECKING APP COMPONENTS');
    console.log('─'.repeat(60));
    console.log('✓ App exists:', !!app);
    console.log('✓ Agent exists:', !!app.agent);
    console.log('✓ Environment exists:', !!app.environment);
    console.log('✓ Physics exists:', !!app.physicsEngine);
    console.log('✓ Rendering exists:', !!app.renderingEngine);
    console.log('✓ LivePlayMode exists:', !!app.livePlayMode);
    console.log('✓ ModelManager exists:', !!app.modelManager);
    console.log('\n');
    
    // 2. Check Agent State
    console.log('🤖 2. CHECKING AGENT STATE');
    console.log('─'.repeat(60));
    if (app.agent) {
        console.log('Agent type:', app.agent.constructor.name);
        console.log('State size:', app.agent.stateSize);
        console.log('Action size:', app.agent.actionSize);
        console.log('Has actor network:', !!app.agent.actorNetwork);
        console.log('Has critic network:', !!app.agent.criticNetwork);
        
        // Test action selection
        try {
            const testState = new Float32Array(13).fill(0);
            const result = app.agent.selectAction(testState, false);
            console.log('✓ Action selection works:', result);
            console.log('  Selected action:', result.action);
            console.log('  Action is valid:', result.action >= 0 && result.action < 6);
        } catch (error) {
            console.error('❌ Action selection failed:', error.message);
        }
    }
    console.log('\n');
    
    // 3. Check Model State
    console.log('💾 3. CHECKING MODEL STATE');
    console.log('─'.repeat(60));
    if (app.modelManager) {
        const metadata = app.modelManager.getMetadata();
        console.log('Model version:', metadata.version);
        console.log('Total episodes:', metadata.totalEpisodes);
        console.log('Best reward:', metadata.bestReward);
        console.log('Success rate:', (metadata.successRate * 100).toFixed(1) + '%');
        console.log('Last saved:', metadata.lastSaved || 'Never');
        
        // Check localStorage
        const actorExists = localStorage.getItem('tensorflowjs_models/climbing-model-actor/info');
        const criticExists = localStorage.getItem('tensorflowjs_models/climbing-model-critic/info');
        console.log('Actor in localStorage:', !!actorExists);
        console.log('Critic in localStorage:', !!criticExists);
    }
    console.log('\n');
    
    // 4. Check Environment State
    console.log('🏔️ 4. CHECKING ENVIRONMENT STATE');
    console.log('─'.repeat(60));
    if (app.environment) {
        console.log('Max steps:', app.environment.maxSteps);
        console.log('Current step:', app.environment.currentStep);
        console.log('Agent body exists:', !!app.environment.agentBody);
        
        if (app.environment.agentBody) {
            const pos = app.physicsEngine.getBodyPosition(app.environment.agentBody);
            const vel = app.physicsEngine.getBodyVelocity(app.environment.agentBody);
            console.log('Agent position:', pos);
            console.log('Agent velocity:', vel);
            
            // Test state generation
            try {
                const state = app.environment.getState();
                console.log('✓ State generation works');
                console.log('  State length:', state.length);
                console.log('  State sample:', Array.from(state.slice(0, 5)));
            } catch (error) {
                console.error('❌ State generation failed:', error.message);
            }
        }
    }
    console.log('\n');
    
    // 5. Check LivePlayMode State
    console.log('🎮 5. CHECKING LIVE PLAY MODE');
    console.log('─'.repeat(60));
    if (app.livePlayMode) {
        console.log('Is active:', app.livePlayMode.isActive);
        console.log('Mode:', app.livePlayMode.mode);
        console.log('Current state exists:', !!app.livePlayMode.currentState);
        console.log('Animation ID:', app.livePlayMode.animationId);
        
        const stats = app.livePlayMode.getSessionStats();
        console.log('Session stats:', stats);
    }
    console.log('\n');
    
    // 6. Test Full Auto Play Flow
    console.log('🧪 6. TESTING AUTO PLAY FLOW');
    console.log('─'.repeat(60));
    
    try {
        // Stop if already running
        if (app.livePlayMode && app.livePlayMode.isActive) {
            console.log('⚠️ Auto play already running, stopping first...');
            app.stopLivePlay();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('Step 1: Resetting environment...');
        const initialState = app.environment.reset();
        console.log('✓ Initial state:', initialState.length, 'values');
        
        console.log('\nStep 2: Testing agent action selection...');
        const actionResult = app.agent.selectAction(initialState, false);
        console.log('✓ Action selected:', actionResult.action);
        
        console.log('\nStep 3: Testing environment step...');
        const stepResult = app.environment.step(actionResult.action);
        console.log('✓ Step result:', {
            reward: stepResult.reward,
            done: stepResult.done,
            stateLength: stepResult.state.length
        });
        
        console.log('\nStep 4: Testing rendering update...');
        if (app.renderingEngine && stepResult.info.agentPosition) {
            app.renderingEngine.updateAgentPosition(stepResult.info.agentPosition);
            app.renderingEngine.render();
            console.log('✓ Rendering updated');
        }
        
        console.log('\n✅ AUTO PLAY FLOW TEST PASSED');
        
    } catch (error) {
        console.error('\n❌ AUTO PLAY FLOW TEST FAILED:', error);
        console.error('Stack:', error.stack);
    }
    
    console.log('\n');
    
    // 7. Performance Check
    console.log('⚡ 7. PERFORMANCE CHECK');
    console.log('─'.repeat(60));
    console.log('FPS:', app.performanceStats?.fps || 'N/A');
    console.log('Frame time:', app.performanceStats?.frameTime?.toFixed(2) + 'ms' || 'N/A');
    console.log('Physics time:', app.performanceStats?.physicsTime?.toFixed(2) + 'ms' || 'N/A');
    console.log('Render time:', app.performanceStats?.renderTime?.toFixed(2) + 'ms' || 'N/A');
    console.log('\n');
    
    // 8. Recommendations
    console.log('💡 8. RECOMMENDATIONS');
    console.log('─'.repeat(60));
    
    const issues = [];
    
    if (!app.modelManager || app.modelManager.getMetadata().totalEpisodes === 0) {
        issues.push('⚠️ No trained model - agent will act randomly');
        issues.push('   Solution: Train model first (click "Fast Training")');
    }
    
    if (!localStorage.getItem('tensorflowjs_models/climbing-model-actor/info')) {
        issues.push('⚠️ No model in localStorage');
        issues.push('   Solution: Train in browser, not terminal');
    }
    
    if (app.livePlayMode && !app.livePlayMode.isActive) {
        issues.push('✓ Auto play is ready to start');
    }
    
    if (issues.length === 0) {
        console.log('✅ No issues detected - Auto Play should work!');
    } else {
        issues.forEach(issue => console.log(issue));
    }
    
    console.log('\n');
    console.log('🔍 ═══════════════════════════════════════════════════════');
    console.log('🔍 DEBUG COMPLETE');
    console.log('🔍 ═══════════════════════════════════════════════════════');
    
    return {
        app: !!app,
        agent: !!app?.agent,
        environment: !!app?.environment,
        livePlayMode: !!app?.livePlayMode,
        modelManager: !!app?.modelManager,
        hasTrainedModel: app?.modelManager?.getMetadata().totalEpisodes > 0,
        modelInLocalStorage: !!localStorage.getItem('tensorflowjs_models/climbing-model-actor/info'),
        issues: issues
    };
}

// Export to window
window.debugAutoPlay = debugAutoPlay;

console.log('🔍 Auto Play Debug loaded! Run: debugAutoPlay()');
