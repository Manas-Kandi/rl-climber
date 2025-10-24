/**
 * Main application entry point for 3D RL Climbing Game
 * Integrates all components: rendering, physics, RL environment, agent, training, and UI
 */

// Import all required components
import { RenderingEngine } from './rendering/RenderingEngine.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { ClimbingEnvironment } from './rl/ClimbingEnvironment.js';
import { DQNAgent } from './rl/DQNAgent.js';
import { PPOAgent } from './rl/PPOAgent.js';
import { TrainingOrchestrator } from './training/TrainingOrchestrator.js';
import { UIController } from './ui/UIController.js';

/**
 * Main application class that coordinates all components
 */
class ClimbingGameApp {
    constructor() {
        // Core components
        this.renderingEngine = null;
        this.physicsEngine = null;
        this.environment = null;
        this.agent = null;
        this.orchestrator = null;
        this.uiController = null;
        
        // Configuration
        this.config = {
            // Agent type: 'DQN' or 'PPO'
            agentType: 'DQN',
            
            // Physics settings
            physics: {
                gravity: -9.81,
                timeStep: 1/60
            },
            
            // Environment settings
            environment: {
                maxSteps: 500,
                groundSize: { width: 20, depth: 20 },
                wallHeight: 15,
                goalHeight: 14,
                ledges: [
                    { position: { x: 0, y: 2, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
                    { position: { x: 1, y: 4, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
                    { position: { x: -1, y: 6, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
                    { position: { x: 0, y: 8, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
                    { position: { x: 1, y: 10, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
                    { position: { x: 0, y: 12, z: -5 }, size: { x: 2, y: 0.2, z: 1 } }
                ],
                agentStart: { x: 0, y: 1, z: 0 },
                actionForces: {
                    move: 5.0,
                    jump: 8.0,
                    grab: 2.0
                }
            },
            
            // Agent hyperparameters
            dqn: {
                gamma: 0.99,
                epsilon: 1.0,
                epsilonMin: 0.01,
                epsilonDecay: 0.995,
                learningRate: 0.0003,
                bufferSize: 10000,
                batchSize: 32,
                targetUpdateFreq: 100
            },
            
            ppo: {
                gamma: 0.99,
                lambda: 0.95,
                clipEpsilon: 0.2,
                entropyCoef: 0.01,
                valueCoef: 0.5,
                learningRate: 0.0003
            },
            
            // Training settings
            training: {
                numEpisodes: 1000,
                renderInterval: 1,
                statsUpdateInterval: 10
            }
        };
        
        // Application state
        this.isInitialized = false;
        this.isRunning = false;
        this.animationId = null;
    }
    
    /**
     * Initialize all components in the correct order
     */
    async init() {
        try {
            console.log('🎮 Initializing 3D RL Climbing Game...');
            
            // Check WebGL support
            if (!this.checkWebGLSupport()) {
                throw new Error('WebGL is not supported in this browser');
            }
            
            // 1. Create RenderingEngine with canvas element
            console.log('📊 Initializing rendering engine...');
            const canvasContainer = document.getElementById('canvas-container');
            if (!canvasContainer) {
                throw new Error('Canvas container not found');
            }
            
            // Create canvas element
            const canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
            canvasContainer.appendChild(canvas);
            
            this.renderingEngine = new RenderingEngine(canvas);
            this.renderingEngine.init();
            
            // 2. Create PhysicsEngine with gravity -9.81
            console.log('⚡ Initializing physics engine...');
            this.physicsEngine = new PhysicsEngine(this.config.physics.gravity);
            this.physicsEngine.init();
            
            // 3. Create ClimbingEnvironment with physics and rendering engines
            console.log('🏔️ Initializing climbing environment...');
            const envConfig = {
                ...this.config.environment,
                agent: {
                    startPosition: this.config.environment.agentStart,
                    size: 0.5,
                    mass: 1.0
                },
                ledgePositions: this.config.environment.ledges
            };
            this.environment = new ClimbingEnvironment(
                this.physicsEngine, 
                this.renderingEngine, 
                envConfig
            );
            
            // 4. Create agent (DQNAgent or PPOAgent) with configuration
            console.log(`🤖 Initializing ${this.config.agentType} agent...`);
            if (this.config.agentType === 'DQN') {
                this.agent = new DQNAgent(9, 6, this.config.dqn);
            } else if (this.config.agentType === 'PPO') {
                this.agent = new PPOAgent(9, 6, this.config.ppo);
            } else {
                throw new Error(`Unknown agent type: ${this.config.agentType}`);
            }
            
            // 5. Create TrainingOrchestrator with environment and agent
            console.log('🎯 Initializing training orchestrator...');
            this.orchestrator = new TrainingOrchestrator(
                this.environment, 
                this.agent, 
                this.config.training
            );
            
            // 6. Create UIController with orchestrator
            console.log('🖥️ Initializing UI controller...');
            this.uiController = new UIController(this.orchestrator, this.agent);
            await this.uiController.init();
            
            // 7. Initialize all components in correct order
            console.log('🔧 Setting up environment...');
            this.setupEnvironment();
            
            // 8. Start the rendering loop
            console.log('🎬 Starting rendering loop...');
            this.startRenderingLoop();
            
            this.isInitialized = true;
            this.isRunning = true;
            
            console.log('✅ 3D RL Climbing Game initialized successfully!');
            console.log('🎮 Ready to start training!');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showError('Failed to initialize application: ' + error.message);
            throw error;
        }
    }
    
    /**
     * Check if WebGL is supported
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Set up the 3D environment with all objects
     */
    setupEnvironment() {
        // Create physics bodies first
        console.log('🏗️ Creating physics bodies...');
        
        // Create ground physics body
        this.physicsEngine.createGroundBody(
            this.config.environment.groundSize.width,
            this.config.environment.groundSize.depth,
            { x: 0, y: 0, z: 0 }
        );
        
        // Create wall physics body
        this.physicsEngine.createWallBody(
            { x: 0, y: this.config.environment.wallHeight / 2, z: -5 },
            { x: 10, y: this.config.environment.wallHeight, z: 1 }
        );
        
        // Create ledge physics bodies
        this.config.environment.ledges.forEach((ledge, index) => {
            this.physicsEngine.createLedgeBody(
                ledge.position,
                ledge.size,
                `ledge_${index}`
            );
        });
        
        // Create visual elements
        console.log('🎨 Creating visual elements...');
        
        // Create ground mesh
        const groundMesh = this.renderingEngine.createGround(
            this.config.environment.groundSize.width,
            this.config.environment.groundSize.depth
        );
        
        // Create climbing wall with ledges
        const wallGroup = this.renderingEngine.createClimbingWall(this.config.environment.ledges);
        
        // Create goal platform
        const goalMesh = this.renderingEngine.createGoal({
            x: 0,
            y: this.config.environment.goalHeight,
            z: -5
        });
        
        // Create agent mesh
        const agentMesh = this.renderingEngine.createAgent(this.config.environment.agentStart);
        
        console.log('🏗️ Environment setup complete');
    }
    
    /**
     * Start the main rendering loop
     */
    startRenderingLoop() {
        const animate = () => {
            if (!this.isRunning) return;
            
            try {
                // Step physics simulation with fixed timestep
                this.physicsEngine.step(this.config.physics.timeStep);
                
                // Update agent position in rendering engine from physics
                const agentBody = this.physicsEngine.getBody('agent');
                if (agentBody) {
                    const position = this.physicsEngine.getBodyPosition(agentBody);
                    this.renderingEngine.updateAgentPosition(position);
                    
                    // Update camera to follow agent
                    this.renderingEngine.updateCamera(position);
                }
                
                // Render the frame
                this.renderingEngine.render();
                
                // Continue the loop
                this.animationId = requestAnimationFrame(animate);
                
            } catch (error) {
                console.error('Error in rendering loop:', error);
                this.stop();
            }
        };
        
        // Start the animation loop
        animate();
    }
    
    /**
     * Stop the application
     */
    stop() {
        console.log('🛑 Stopping application...');
        
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Stop training if running
        if (this.orchestrator && this.orchestrator.isTraining) {
            this.orchestrator.stopTraining();
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        console.log('🧹 Cleaning up resources...');
        
        this.stop();
        
        // Dispose of all components
        if (this.uiController) {
            this.uiController.dispose();
        }
        
        if (this.agent) {
            this.agent.dispose();
        }
        
        if (this.renderingEngine) {
            this.renderingEngine.dispose();
        }
        
        console.log('✅ Cleanup complete');
    }
    
    /**
     * Show error message to user
     */
    showError(message) {
        // Try to show error in UI if available
        if (this.uiController) {
            this.uiController.showNotification(message, 'error');
        } else {
            // Fallback to alert
            alert('Error: ' + message);
        }
    }
    
    /**
     * Switch between DQN and PPO agents
     */
    async switchAgent(agentType) {
        if (this.config.agentType === agentType) {
            console.log(`Already using ${agentType} agent`);
            return;
        }
        
        console.log(`🔄 Switching to ${agentType} agent...`);
        
        // Stop training if running
        if (this.orchestrator && this.orchestrator.isTraining) {
            this.orchestrator.stopTraining();
        }
        
        // Dispose old agent
        if (this.agent) {
            this.agent.dispose();
        }
        
        // Create new agent
        this.config.agentType = agentType;
        if (agentType === 'DQN') {
            this.agent = new DQNAgent(9, 6, this.config.dqn);
        } else if (agentType === 'PPO') {
            this.agent = new PPOAgent(9, 6, this.config.ppo);
        }
        
        // Update orchestrator with new agent
        this.orchestrator.agent = this.agent;
        
        // Update UI controller with new agent
        this.uiController.agent = this.agent;
        
        console.log(`✅ Switched to ${agentType} agent`);
    }
}

// Global application instance
let app = null;

/**
 * Initialize the application when DOM is ready
 */
async function initializeApp() {
    try {
        app = new ClimbingGameApp();
        await app.init();
        
        // Make app globally accessible for debugging
        window.climbingGame = app;
        
    } catch (error) {
        console.error('Failed to initialize climbing game:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff0000;
            color: #ffffff;
            padding: 20px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 1000;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>Failed to Initialize Game</h3>
            <p>${error.message}</p>
            <p>Please check the console for more details.</p>
        `;
        document.body.appendChild(errorDiv);
    }
}

/**
 * Handle page unload - clean up resources
 */
function handleUnload() {
    if (app) {
        app.dispose();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Clean up on page unload
window.addEventListener('beforeunload', handleUnload);

console.log('🎮 3D RL Climbing Game - Loading...');
