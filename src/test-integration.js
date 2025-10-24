/**
 * Integration tests for the 3D RL Climbing Game
 * Tests full episode execution, training loops, and component interactions
 */

import { RenderingEngine } from './rendering/RenderingEngine.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { ClimbingEnvironment } from './rl/ClimbingEnvironment.js';
import { DQNAgent } from './rl/DQNAgent.js';
import { PPOAgent } from './rl/PPOAgent.js';
import { TrainingOrchestrator } from './training/TrainingOrchestrator.js';

/**
 * Test full episode execution completes without errors
 */
async function testFullEpisodeExecution() {
    console.log('Testing full episode execution...');
    
    // Create mock canvas for rendering engine
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    try {
        // Initialize components
        const renderingEngine = new RenderingEngine(canvas);
        renderingEngine.init();
        
        const physicsEngine = new PhysicsEngine(-9.81);
        physicsEngine.init();
        
        // Create environment bodies
        physicsEngine.createGroundBody(20, 20, { x: 0, y: 0, z: 0 });
        physicsEngine.createWallBody({ x: 0, y: 7.5, z: -5 }, { x: 10, y: 15, z: 1 });
        
        const envConfig = {
            maxSteps: 50, // Short episode for testing
            goalHeight: 14,
            fallThreshold: -2,
            agent: {
                startPosition: { x: 0, y: 1, z: 0 },
                size: 0.5,
                mass: 1.0
            },
            ledgePositions: [
                { position: { x: 0, y: 2, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
                { position: { x: 1, y: 4, z: -5 }, size: { x: 2, y: 0.2, z: 1 } }
            ]
        };
        
        const environment = new ClimbingEnvironment(physicsEngine, renderingEngine, envConfig);
        const agent = new DQNAgent(9, 6, { epsilon: 1.0, batchSize: 4 });
        
        // Run a complete episode
        let state = environment.reset();
        let totalReward = 0;
        let steps = 0;
        let done = false;
        
        console.log('Starting episode execution...');
        
        while (!done && steps < 50) {
            // Agent selects action
            const action = agent.selectAction(state, 1.0); // Full exploration
            
            // Environment steps
            const stepResult = environment.step(action);
            const { state: nextState, reward, done: isDone, info } = stepResult;
            
            // Store experience
            agent.remember(state, action, reward, nextState, isDone);
            
            // Update for next step
            state = nextState;
            totalReward += reward;
            done = isDone;
            steps++;
            
            // Step physics
            physicsEngine.step();
            
            // Update rendering (without actually rendering to avoid WebGL issues in tests)
            const agentBody = physicsEngine.getBody('agent');
            if (agentBody) {
                const position = physicsEngine.getBodyPosition(agentBody);
                renderingEngine.updateAgentPosition(position);
                renderingEngine.updateCamera(position);
            }
        }
        
        console.log(`Episode completed: ${steps} steps, ${totalReward.toFixed(2)} total reward`);
        console.log('Episode termination reason:', done ? 'Terminal state' : 'Max steps');
        
        // Verify episode completed properly
        console.assert(steps > 0, 'Episode should have at least one step');
        console.assert(typeof totalReward === 'number', 'Total reward should be a number');
        console.assert(typeof done === 'boolean', 'Done flag should be boolean');
        
        // Clean up
        agent.dispose();
        renderingEngine.dispose();
        
        console.log('✓ Full episode execution test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Full episode execution test failed:', error);
        return false;
    }
}

/**
 * Test training loop runs for 10 episodes successfully
 */
async function testTrainingLoop() {
    console.log('\nTesting training loop execution...');
    
    // Create mock canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    try {
        // Initialize components
        const renderingEngine = new RenderingEngine(canvas);
        renderingEngine.init();
        
        const physicsEngine = new PhysicsEngine(-9.81);
        physicsEngine.init();
        
        // Create environment bodies
        physicsEngine.createGroundBody(20, 20, { x: 0, y: 0, z: 0 });
        
        const envConfig = {
            maxSteps: 20, // Very short episodes for testing
            goalHeight: 14,
            fallThreshold: -2,
            agent: {
                startPosition: { x: 0, y: 1, z: 0 },
                size: 0.5,
                mass: 1.0
            },
            ledgePositions: [
                { position: { x: 0, y: 2, z: -5 }, size: { x: 2, y: 0.2, z: 1 } }
            ]
        };
        
        const environment = new ClimbingEnvironment(physicsEngine, renderingEngine, envConfig);
        const agent = new DQNAgent(9, 6, { 
            epsilon: 1.0, 
            batchSize: 4,
            bufferSize: 100
        });
        
        const orchestrator = new TrainingOrchestrator(environment, agent, {
            numEpisodes: 10,
            renderInterval: 5,
            statsUpdateInterval: 2
        });
        
        // Track training progress
        let episodeCount = 0;
        let totalRewards = [];
        
        orchestrator.onEpisodeComplete((stats, result) => {
            episodeCount++;
            totalRewards.push(result.episodeReward);
            console.log(`Episode ${episodeCount}: Reward=${result.episodeReward.toFixed(2)}, Steps=${result.episodeSteps}`);
        });
        
        let trainingCompleted = false;
        orchestrator.onTrainingComplete((stats) => {
            trainingCompleted = true;
            console.log('Training completed with final stats:', {
                episodes: stats.totalEpisodes,
                avgReward: stats.avgReward.toFixed(2),
                successRate: (stats.successRate * 100).toFixed(1) + '%'
            });
        });
        
        // Start training
        console.log('Starting training loop...');
        await orchestrator.startTraining(10);
        
        // Verify training completed
        console.assert(episodeCount === 10, 'Should complete exactly 10 episodes');
        console.assert(totalRewards.length === 10, 'Should have rewards for all episodes');
        console.assert(trainingCompleted, 'Training complete callback should be called');
        
        // Verify agent learned (has experiences)
        console.assert(agent.getMemorySize() > 0, 'Agent should have stored experiences');
        
        // Clean up
        agent.dispose();
        renderingEngine.dispose();
        
        console.log('✓ Training loop test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Training loop test failed:', error);
        return false;
    }
}

/**
 * Test agent actions affect environment state
 */
async function testAgentEnvironmentInteraction() {
    console.log('\nTesting agent-environment interaction...');
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    try {
        // Initialize components
        const renderingEngine = new RenderingEngine(canvas);
        renderingEngine.init();
        
        const physicsEngine = new PhysicsEngine(-9.81);
        physicsEngine.init();
        
        physicsEngine.createGroundBody(20, 20, { x: 0, y: 0, z: 0 });
        
        const envConfig = {
            maxSteps: 100,
            agent: {
                startPosition: { x: 0, y: 1, z: 0 },
                size: 0.5,
                mass: 1.0
            },
            ledgePositions: []
        };
        
        const environment = new ClimbingEnvironment(physicsEngine, renderingEngine, envConfig);
        
        // Reset environment and get initial state
        const initialState = environment.reset();
        const initialAgentPos = physicsEngine.getBodyPosition(physicsEngine.getBody('agent'));
        
        console.log('Initial agent position:', initialAgentPos);
        console.log('Initial state:', Array.from(initialState).map(x => x.toFixed(3)));
        
        // Test different actions affect the environment
        const actions = [
            { action: 0, name: 'FORWARD' },
            { action: 1, name: 'BACKWARD' },
            { action: 2, name: 'LEFT' },
            { action: 3, name: 'RIGHT' },
            { action: 4, name: 'JUMP' }
        ];
        
        for (const { action, name } of actions) {
            // Reset for each test
            environment.reset();
            const beforeState = environment.getState();
            const beforePos = physicsEngine.getBodyPosition(physicsEngine.getBody('agent'));
            
            // Apply action multiple times to see effect
            for (let i = 0; i < 5; i++) {
                environment.step(action);
                physicsEngine.step(); // Step physics to apply forces
            }
            
            const afterState = environment.getState();
            const afterPos = physicsEngine.getBodyPosition(physicsEngine.getBody('agent'));
            
            // Check that action had some effect
            const positionChanged = 
                Math.abs(afterPos.x - beforePos.x) > 0.01 ||
                Math.abs(afterPos.y - beforePos.y) > 0.01 ||
                Math.abs(afterPos.z - beforePos.z) > 0.01;
            
            const stateChanged = beforeState.some((val, i) => Math.abs(val - afterState[i]) > 0.01);
            
            console.log(`${name} action: Position changed=${positionChanged}, State changed=${stateChanged}`);
            
            // At least one should change (position or state)
            console.assert(positionChanged || stateChanged, `${name} action should affect agent state or position`);
        }
        
        // Clean up
        renderingEngine.dispose();
        
        console.log('✓ Agent-environment interaction test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Agent-environment interaction test failed:', error);
        return false;
    }
}

/**
 * Test rendering updates reflect physics changes
 */
async function testRenderingPhysicsSync() {
    console.log('\nTesting rendering-physics synchronization...');
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    try {
        // Initialize components
        const renderingEngine = new RenderingEngine(canvas);
        renderingEngine.init();
        
        const physicsEngine = new PhysicsEngine(-9.81);
        physicsEngine.init();
        
        // Create visual elements
        renderingEngine.createGround(20, 20);
        renderingEngine.createAgent({ x: 0, y: 5, z: 0 });
        
        // Create physics bodies
        physicsEngine.createGroundBody(20, 20, { x: 0, y: 0, z: 0 });
        const agentBody = physicsEngine.createAgentBody({ x: 0, y: 5, z: 0 }, 1.0, 0.5);
        
        // Get initial positions
        const initialPhysicsPos = physicsEngine.getBodyPosition(agentBody);
        const initialRenderPos = renderingEngine.getAgentPosition();
        
        console.log('Initial physics position:', initialPhysicsPos);
        console.log('Initial render position:', initialRenderPos);
        
        // Apply force and step physics
        physicsEngine.applyForce(agentBody, { x: 10, y: 0, z: 0 });
        
        for (let i = 0; i < 10; i++) {
            physicsEngine.step();
            
            // Update rendering to match physics
            const physicsPos = physicsEngine.getBodyPosition(agentBody);
            renderingEngine.updateAgentPosition(physicsPos);
            
            // Check synchronization
            const renderPos = renderingEngine.getAgentPosition();
            
            const syncError = Math.sqrt(
                Math.pow(physicsPos.x - renderPos.x, 2) +
                Math.pow(physicsPos.y - renderPos.y, 2) +
                Math.pow(physicsPos.z - renderPos.z, 2)
            );
            
            console.assert(syncError < 0.001, `Rendering should sync with physics (error: ${syncError})`);
        }
        
        // Verify final positions are synchronized
        const finalPhysicsPos = physicsEngine.getBodyPosition(agentBody);
        const finalRenderPos = renderingEngine.getAgentPosition();
        
        console.log('Final physics position:', finalPhysicsPos);
        console.log('Final render position:', finalRenderPos);
        
        const finalSyncError = Math.sqrt(
            Math.pow(finalPhysicsPos.x - finalRenderPos.x, 2) +
            Math.pow(finalPhysicsPos.y - finalRenderPos.y, 2) +
            Math.pow(finalPhysicsPos.z - finalRenderPos.z, 2)
        );
        
        console.assert(finalSyncError < 0.001, 'Final positions should be synchronized');
        
        // Test camera following
        renderingEngine.updateCamera(finalPhysicsPos);
        console.log('Camera updated to follow agent');
        
        // Clean up
        renderingEngine.dispose();
        
        console.log('✓ Rendering-physics synchronization test passed');
        return true;
        
    } catch (error) {
        console.error('❌ Rendering-physics synchronization test failed:', error);
        return false;
    }
}

/**
 * Test UI updates when training progresses (mock test)
 */
async function testUITrainingUpdates() {
    console.log('\nTesting UI training updates...');
    
    try {
        // Create mock DOM elements for UI testing
        const mockStatsPanel = {
            statEpisode: { textContent: '0' },
            statReward: { textContent: '0.00' },
            statSuccess: { textContent: '0.00%' },
            statStatus: { textContent: 'Ready' }
        };
        
        // Mock UI controller
        const mockUIController = {
            elements: mockStatsPanel,
            updateStatsPanel: function(stats) {
                this.elements.statEpisode.textContent = stats.currentEpisode || 0;
                this.elements.statReward.textContent = (stats.avgReward || 0).toFixed(2);
                this.elements.statSuccess.textContent = ((stats.successRate || 0) * 100).toFixed(2) + '%';
            }
        };
        
        // Test stats updates
        const testStats = {
            currentEpisode: 42,
            avgReward: 15.67,
            successRate: 0.35
        };
        
        mockUIController.updateStatsPanel(testStats);
        
        // Verify updates
        console.assert(mockStatsPanel.statEpisode.textContent === '42', 'Episode should update');
        console.assert(mockStatsPanel.statReward.textContent === '15.67', 'Reward should update');
        console.assert(mockStatsPanel.statSuccess.textContent === '35.00%', 'Success rate should update');
        
        console.log('Mock UI stats updated correctly');
        
        // Test progressive updates
        for (let episode = 1; episode <= 5; episode++) {
            const progressStats = {
                currentEpisode: episode,
                avgReward: Math.random() * 20 - 10,
                successRate: Math.random() * 0.5
            };
            
            mockUIController.updateStatsPanel(progressStats);
            
            console.assert(
                parseInt(mockStatsPanel.statEpisode.textContent) === episode,
                `Episode ${episode} should be displayed`
            );
        }
        
        console.log('✓ UI training updates test passed');
        return true;
        
    } catch (error) {
        console.error('❌ UI training updates test failed:', error);
        return false;
    }
}

/**
 * Run all integration tests
 */
export async function runIntegrationTests() {
    console.log('Running Integration Tests...\n');
    
    const results = [];
    
    try {
        results.push(await testFullEpisodeExecution());
        results.push(await testTrainingLoop());
        results.push(await testAgentEnvironmentInteraction());
        results.push(await testRenderingPhysicsSync());
        results.push(await testUITrainingUpdates());
        
        const passedTests = results.filter(result => result).length;
        const totalTests = results.length;
        
        console.log(`\n📊 Integration Test Results: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ All integration tests passed!');
            return true;
        } else {
            console.log('❌ Some integration tests failed');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Integration tests failed with error:', error);
        return false;
    }
}

// Export individual test functions
export {
    testFullEpisodeExecution,
    testTrainingLoop,
    testAgentEnvironmentInteraction,
    testRenderingPhysicsSync,
    testUITrainingUpdates
};