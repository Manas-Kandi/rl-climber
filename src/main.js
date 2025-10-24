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
import * as tf from '@tensorflow/tfjs';

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
        
        // Memory monitoring
        this.memoryMonitorInterval = null;
        this.lastMemoryCheck = 0;
    }
    
    /**
     * Initialize all components in the correct order
     */
    async init() {
        try {
            console.log('🎮 Initializing 3D RL Climbing Game...');
            
            // Check WebGL support
            if (!this.checkWebGLSupport()) {
                const message = 'WebGL is not supported in this browser. Please use a modern browser with WebGL support (Chrome, Firefox, Safari, Edge).';
                this.showError(message);
                throw new Error(message);
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
            
            // Set up WebGL error handling
            this.setupWebGLErrorHandling(canvas);
            
            this.renderingEngine = new RenderingEngine(canvas);
            this.renderingEngine.init();
            
            // 2. Create PhysicsEngine with gravity -9.81
            console.log('⚡ Initializing physics engine...');
            try {
                this.physicsEngine = new PhysicsEngine(this.config.physics.gravity);
                this.physicsEngine.init();
            } catch (error) {
                throw new Error(`Failed to initialize physics engine: ${error.message}`);
            }
            
            // 3. Create ClimbingEnvironment with physics and rendering engines
            console.log('🏔️ Initializing climbing environment...');
            try {
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
            } catch (error) {
                throw new Error(`Failed to initialize climbing environment: ${error.message}`);
            }
            
            // 4. Create agent (DQNAgent or PPOAgent) with configuration
            console.log(`🤖 Initializing ${this.config.agentType} agent...`);
            try {
                if (this.config.agentType === 'DQN') {
                    this.agent = new DQNAgent(9, 6, this.config.dqn);
                } else if (this.config.agentType === 'PPO') {
                    this.agent = new PPOAgent(9, 6, this.config.ppo);
                } else {
                    throw new Error(`Unknown agent type: ${this.config.agentType}`);
                }
            } catch (error) {
                throw new Error(`Failed to initialize ${this.config.agentType} agent: ${error.message}`);
            }
            
            // 5. Create TrainingOrchestrator with environment and agent
            console.log('🎯 Initializing training orchestrator...');
            try {
                this.orchestrator = new TrainingOrchestrator(
                    this.environment, 
                    this.agent, 
                    this.config.training
                );
            } catch (error) {
                throw new Error(`Failed to initialize training orchestrator: ${error.message}`);
            }
            
            // 6. Create UIController with orchestrator
            console.log('🖥️ Initializing UI controller...');
            try {
                this.uiController = new UIController(this.orchestrator, this.agent);
                await this.uiController.init();
            } catch (error) {
                throw new Error(`Failed to initialize UI controller: ${error.message}`);
            }
            
            // 7. Initialize all components in correct order
            console.log('🔧 Setting up environment...');
            this.setupEnvironment();
            
            // 8. Start memory monitoring
            console.log('🧠 Starting memory monitoring...');
            this.startMemoryMonitoring();
            
            // 9. Start the rendering loop
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
     * Check if WebGL is supported and get detailed info
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                console.error('❌ WebGL is not supported in this browser');
                return false;
            }
            
            // Get WebGL info for debugging
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                console.log('🎮 WebGL Info:', { vendor, renderer });
            }
            
            // Check for required extensions
            const requiredExtensions = ['OES_element_index_uint'];
            const missingExtensions = [];
            
            for (const ext of requiredExtensions) {
                if (!gl.getExtension(ext)) {
                    missingExtensions.push(ext);
                }
            }
            
            if (missingExtensions.length > 0) {
                console.warn('⚠️ Missing WebGL extensions:', missingExtensions);
            }
            
            console.log('✅ WebGL is supported and ready');
            return true;
            
        } catch (error) {
            console.error('❌ Error checking WebGL support:', error);
            return false;
        }
    }
    
    /**
     * Set up WebGL context loss handling
     */
    setupWebGLErrorHandling(canvas) {
        // Handle WebGL context loss
        canvas.addEventListener('webglcontextlost', (event) => {
            console.error('❌ WebGL context lost!');
            event.preventDefault();
            
            // Stop the rendering loop
            this.stop();
            
            // Show error to user
            this.showError('WebGL context was lost. The application will attempt to restore it.');
            
            // Attempt to restore context after a delay
            setTimeout(() => {
                console.log('🔄 Attempting to restore WebGL context...');
                this.attemptWebGLRestore();
            }, 1000);
        });
        
        // Handle WebGL context restored
        canvas.addEventListener('webglcontextrestored', (event) => {
            console.log('✅ WebGL context restored!');
            
            try {
                // Reinitialize rendering engine
                this.renderingEngine.init();
                
                // Restart rendering loop
                this.startRenderingLoop();
                
                this.showError('WebGL context restored successfully!', 'success');
                
            } catch (error) {
                console.error('❌ Failed to restore WebGL context:', error);
                this.showError('Failed to restore WebGL context: ' + error.message);
            }
        });
    }
    
    /**
     * Attempt to restore WebGL context
     */
    attemptWebGLRestore() {
        try {
            if (this.renderingEngine && this.renderingEngine.renderer) {
                this.renderingEngine.renderer.forceContextRestore();
            }
        } catch (error) {
            console.error('❌ Failed to force WebGL context restore:', error);
            this.showError('Unable to restore WebGL context. Please refresh the page.');
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
     * Start the main rendering loop with 60 FPS target
     */
    startRenderingLoop() {
        // Performance monitoring
        let lastTime = 0;
        let frameCount = 0;
        let fpsUpdateTime = 0;
        let currentFPS = 0;
        
        // Target 60 FPS (16.67ms per frame)
        const targetFrameTime = 1000 / 60;
        let accumulator = 0;
        
        const animate = (currentTime) => {
            if (!this.isRunning) return;
            
            try {
                // Calculate delta time
                const deltaTime = currentTime - lastTime;
                lastTime = currentTime;
                
                // Add to accumulator for fixed timestep physics
                accumulator += deltaTime;
                
                // Step physics simulation with fixed timestep
                // Run multiple physics steps if we're behind
                try {
                    while (accumulator >= targetFrameTime) {
                        this.physicsEngine.step(this.config.physics.timeStep);
                        accumulator -= targetFrameTime;
                    }
                } catch (error) {
                    console.error('❌ Physics simulation error:', error);
                    // Continue with rendering even if physics fails
                }
                
                // Update agent position in rendering engine from physics
                try {
                    const agentBody = this.physicsEngine.getBody('agent');
                    if (agentBody) {
                        const position = this.physicsEngine.getBodyPosition(agentBody);
                        this.renderingEngine.updateAgentPosition(position);
                        
                        // Update camera to follow agent
                        this.renderingEngine.updateCamera(position);
                    }
                } catch (error) {
                    console.error('❌ Agent position update error:', error);
                    // Continue with rendering
                }
                
                // Render the frame
                try {
                    this.renderingEngine.render();
                } catch (error) {
                    console.error('❌ Rendering error:', error);
                    // If rendering fails repeatedly, stop the loop
                    if (this.renderingErrorCount > 10) {
                        console.error('❌ Too many rendering errors, stopping application');
                        this.stop();
                        return;
                    }
                    this.renderingErrorCount = (this.renderingErrorCount || 0) + 1;
                }
                
                // FPS monitoring (update every second)
                frameCount++;
                if (currentTime - fpsUpdateTime >= 1000) {
                    currentFPS = Math.round((frameCount * 1000) / (currentTime - fpsUpdateTime));
                    frameCount = 0;
                    fpsUpdateTime = currentTime;
                    
                    // Log FPS occasionally for monitoring
                    if (Math.random() < 0.1) { // 10% chance to log
                        console.log(`🎬 Rendering at ${currentFPS} FPS`);
                    }
                    
                    // Warn if FPS is too low
                    if (currentFPS < 30) {
                        console.warn(`⚠️ Low FPS detected: ${currentFPS} FPS`);
                    }
                    
                    // Check memory usage in rendering loop occasionally
                    if (Math.random() < 0.05) { // 5% chance to check
                        const memory = this.getMemoryStats();
                        if (memory.numTensors > 500) {
                            console.warn(`⚠️ High tensor count in render loop: ${memory.numTensors}`);
                        }
                    }
                }
                
                // Continue the loop
                this.animationId = requestAnimationFrame(animate);
                
            } catch (error) {
                console.error('❌ Error in rendering loop:', error);
                this.stop();
            }
        };
        
        // Start the animation loop
        console.log('🎬 Starting 60 FPS rendering loop...');
        this.animationId = requestAnimationFrame(animate);
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
     * Get current rendering performance stats
     */
    getPerformanceStats() {
        return {
            isRunning: this.isRunning,
            isInitialized: this.isInitialized,
            agentType: this.config.agentType,
            memory: this.getMemoryStats(),
        };
    }
    
    /**
     * Get TensorFlow.js memory statistics
     */
    getMemoryStats() {
        const memory = tf.memory();
        return {
            numTensors: memory.numTensors,
            numDataBuffers: memory.numDataBuffers,
            numBytes: memory.numBytes,
            unreliable: memory.unreliable || false,
            // Convert bytes to MB for readability
            numMB: Math.round(memory.numBytes / 1024 / 1024 * 100) / 100
        };
    }
    
    /**
     * Start memory monitoring
     */
    startMemoryMonitoring() {
        console.log('🧠 Starting memory monitoring...');
        
        // Log initial memory state
        const initialMemory = this.getMemoryStats();
        console.log('📊 Initial memory state:', initialMemory);
        
        // Monitor memory every 30 seconds
        this.memoryMonitorInterval = setInterval(() => {
            const currentMemory = this.getMemoryStats();
            
            // Log memory stats occasionally
            if (Math.random() < 0.1) { // 10% chance to log
                console.log('🧠 Memory stats:', currentMemory);
            }
            
            // Warn if memory usage is high
            if (currentMemory.numTensors > 1000) {
                console.warn('⚠️ High tensor count detected:', currentMemory.numTensors);
            }
            
            if (currentMemory.numMB > 100) {
                console.warn('⚠️ High memory usage detected:', currentMemory.numMB, 'MB');
            }
            
            // Force garbage collection if available (Chrome DevTools)
            if (window.gc && currentMemory.numMB > 200) {
                console.log('🗑️ Forcing garbage collection...');
                window.gc();
            }
            
        }, 30000); // Every 30 seconds
    }
    
    /**
     * Stop memory monitoring
     */
    stopMemoryMonitoring() {
        if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
            this.memoryMonitorInterval = null;
            console.log('🧠 Memory monitoring stopped');
        }
    }
    
    /**
     * Perform manual memory cleanup
     */
    cleanupMemory() {
        console.log('🧹 Performing manual memory cleanup...');
        
        const beforeMemory = this.getMemoryStats();
        
        // Dispose of any orphaned tensors
        tf.disposeVariables();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        const afterMemory = this.getMemoryStats();
        
        console.log('📊 Memory cleanup results:');
        console.log('  Before:', beforeMemory);
        console.log('  After:', afterMemory);
        console.log('  Freed:', beforeMemory.numTensors - afterMemory.numTensors, 'tensors');
    }
    
    /**
     * Clean up resources and dispose of all components
     */
    dispose() {
        console.log('🧹 Cleaning up resources...');
        
        const beforeMemory = this.getMemoryStats();
        console.log('📊 Memory before cleanup:', beforeMemory);
        
        this.stop();
        
        // Stop memory monitoring
        this.stopMemoryMonitoring();
        
        // Dispose of all components in reverse order of creation
        if (this.uiController) {
            this.uiController.dispose();
            this.uiController = null;
        }
        
        if (this.orchestrator) {
            // TrainingOrchestrator doesn't have dispose method, just stop training
            if (this.orchestrator.isTraining) {
                this.orchestrator.stopTraining();
            }
            this.orchestrator = null;
        }
        
        if (this.agent) {
            this.agent.dispose();
            this.agent = null;
        }
        
        if (this.environment) {
            // ClimbingEnvironment doesn't have dispose method currently
            this.environment = null;
        }
        
        if (this.physicsEngine) {
            // PhysicsEngine doesn't have dispose method, but reset clears bodies
            this.physicsEngine.reset();
            this.physicsEngine = null;
        }
        
        if (this.renderingEngine) {
            this.renderingEngine.dispose();
            this.renderingEngine = null;
        }
        
        // Final memory cleanup
        this.cleanupMemory();
        
        const afterMemory = this.getMemoryStats();
        console.log('📊 Memory after cleanup:', afterMemory);
        
        console.log('✅ Cleanup complete');
    }
    
    /**
     * Show error message to user with detailed context
     */
    showError(message, type = 'error', context = null) {
        // Log error with context
        if (context) {
            console.error(`❌ ${message}`, context);
        } else {
            console.error(`❌ ${message}`);
        }
        
        // Try to show error in UI if available
        if (this.uiController) {
            this.uiController.showNotification(message, type);
        } else {
            // Fallback to creating error display
            this.createErrorDisplay(message, type);
        }
    }
    
    /**
     * Create error display when UI controller is not available
     */
    createErrorDisplay(message, type = 'error') {
        // Remove existing error displays
        const existingErrors = document.querySelectorAll('.climbing-game-error');
        existingErrors.forEach(el => el.remove());
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'climbing-game-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? '#ff0000' : '#00ff00'};
            color: #ffffff;
            padding: 20px 30px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            max-width: 80%;
            word-wrap: break-word;
        `;
        
        const title = type === 'error' ? '❌ Error' : '✅ Success';
        errorDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">${title}</h3>
            <p style="margin: 0;">${message}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
                ${type === 'error' ? 'Check the console for more details.' : ''}
            </p>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds for success, keep errors until clicked
        if (type !== 'error') {
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 5000);
        } else {
            // Allow clicking to dismiss error
            errorDiv.style.cursor = 'pointer';
            errorDiv.addEventListener('click', () => errorDiv.remove());
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
function handleUnload(event) {
    if (app) {
        console.log('🔄 Page unloading, cleaning up resources...');
        app.dispose();
        
        // Give a moment for cleanup to complete
        const message = 'Cleaning up 3D RL Climbing Game resources...';
        event.returnValue = message;
        return message;
    }
}

/**
 * Handle visibility change - pause/resume when tab is hidden/visible
 */
function handleVisibilityChange() {
    if (app && app.isInitialized) {
        if (document.hidden) {
            console.log('👁️ Tab hidden, pausing application...');
            if (app.orchestrator && app.orchestrator.isTraining) {
                app.orchestrator.pauseTraining();
            }
        } else {
            console.log('👁️ Tab visible, resuming application...');
            if (app.orchestrator && app.orchestrator.isPaused) {
                app.orchestrator.resumeTraining();
            }
        }
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
window.addEventListener('unload', handleUnload);

// Handle tab visibility changes
document.addEventListener('visibilitychange', handleVisibilityChange);

console.log('🎮 3D RL Climbing Game - Loading...');
