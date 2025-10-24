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
import { ModelManager } from './training/ModelManager.js';
import { UIController } from './ui/UIController.js';
import { TrajectoryVisualizer } from './visualization/TrajectoryVisualizer.js';
import { LivePlayMode } from './interaction/LivePlayMode.js';
import * as tf from '@tensorflow/tfjs';
import './diagnostics.js';
import './test-jump-fix.js';
import './test-movement.js';

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
        this.modelManager = null;
        this.uiController = null;
        
        // New features
        this.trajectoryVisualizer = null;
        this.livePlayMode = null;
        
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
                    move: 50.0,  // Increased from 5.0 for visible movement
                    jump: 8.0,   // Original value - works well
                    grab: 20.0   // Increased from 2.0 proportionally
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
            
            // Optimize TensorFlow.js backend
            await this.optimizeTensorFlowBackend();
            
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
            
            // 5.5. Create ModelManager and load latest model
            console.log('📦 Initializing model manager...');
            try {
                this.modelManager = new ModelManager(this.agent, {
                    autoSave: true,
                    saveInterval: 10
                });
                await this.modelManager.init();
                
                // Connect model manager to orchestrator
                this.orchestrator.setModelManager(this.modelManager);
            } catch (error) {
                console.error('Failed to initialize model manager:', error);
                console.log('⚠️ Continuing without persistent model management');
            }
            
            // 6. Create UIController with orchestrator
            console.log('🖥️ Initializing UI controller...');
            try {
                this.uiController = new UIController(this.orchestrator, this.agent, this.modelManager);
                await this.uiController.init();
            } catch (error) {
                throw new Error(`Failed to initialize UI controller: ${error.message}`);
            }
            
            // 7. Initialize all components in correct order
            console.log('🔧 Setting up environment...');
            this.setupEnvironment();
            
            // 7.5. Initialize new features
            console.log('📹 Initializing trajectory visualizer...');
            this.trajectoryVisualizer = new TrajectoryVisualizer(this.renderingEngine);
            
            console.log('🎮 Initializing live play mode...');
            this.livePlayMode = new LivePlayMode(this.environment, this.agent, this.renderingEngine);
            
            // 8. Optimize performance
            console.log('🚀 Optimizing performance...');
            this.optimizeBatchSizes();
            this.optimizeRenderingPerformance();
            await this.testInferenceSpeed();
            
            // 9. Start memory monitoring
            console.log('🧠 Starting memory monitoring...');
            this.startMemoryMonitoring();
            
            // 10. Start the rendering loop
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
        
        // Create boundary markers (red lines showing platform edges)
        this.renderingEngine.createBoundaryMarkers(10, 10);
        
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
        
        // Detailed performance tracking
        let renderTime = 0;
        let physicsTime = 0;
        let updateTime = 0;
        let frameTimeHistory = [];
        let adaptiveRenderingEnabled = false;
        
        // Target 60 FPS (16.67ms per frame)
        const targetFrameTime = 1000 / 60;
        let accumulator = 0;
        
        const animate = (currentTime) => {
            if (!this.isRunning) return;
            
            try {
                const frameStartTime = performance.now();
                
                // Calculate delta time
                const deltaTime = currentTime - lastTime;
                lastTime = currentTime;
                
                // Add to accumulator for fixed timestep physics
                accumulator += deltaTime;
                
                // Step physics simulation with fixed timestep
                const physicsStartTime = performance.now();
                try {
                    while (accumulator >= targetFrameTime) {
                        this.physicsEngine.step(this.config.physics.timeStep);
                        accumulator -= targetFrameTime;
                    }
                } catch (error) {
                    console.error('❌ Physics simulation error:', error);
                    // Continue with rendering even if physics fails
                }
                physicsTime = performance.now() - physicsStartTime;
                
                // Update agent position in rendering engine from physics
                const updateStartTime = performance.now();
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
                updateTime = performance.now() - updateStartTime;
                
                // Adaptive rendering - skip frames if performance is poor
                const shouldRender = !adaptiveRenderingEnabled || frameCount % this.getRenderSkipFactor() === 0;
                
                if (shouldRender) {
                    // Render the frame
                    const renderStartTime = performance.now();
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
                    renderTime = performance.now() - renderStartTime;
                } else {
                    renderTime = 0; // Skipped rendering
                }
                
                // Track frame time
                const totalFrameTime = performance.now() - frameStartTime;
                frameTimeHistory.push(totalFrameTime);
                if (frameTimeHistory.length > 60) {
                    frameTimeHistory.shift(); // Keep last 60 frames
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
            fps: this.getCurrentFPS(),
            frameTime: this.getAverageFrameTime(),
            renderTime: this.getAverageRenderTime(),
            physicsTime: this.getAveragePhysicsTime(),
            adaptiveRendering: this.isAdaptiveRenderingEnabled()
        };
    }
    
    /**
     * Get current FPS
     */
    getCurrentFPS() {
        // This will be set by the rendering loop
        return this.currentFPS || 0;
    }
    
    /**
     * Get average frame time over recent frames
     */
    getAverageFrameTime() {
        if (!this.frameTimeHistory || this.frameTimeHistory.length === 0) {
            return 0;
        }
        const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
        return sum / this.frameTimeHistory.length;
    }
    
    /**
     * Get average render time
     */
    getAverageRenderTime() {
        return this.renderTime || 0;
    }
    
    /**
     * Get average physics time
     */
    getAveragePhysicsTime() {
        return this.physicsTime || 0;
    }
    
    /**
     * Check if adaptive rendering is enabled
     */
    isAdaptiveRenderingEnabled() {
        return this.adaptiveRenderingEnabled || false;
    }
    
    /**
     * Enable or disable adaptive rendering
     */
    setAdaptiveRendering(enabled) {
        this.adaptiveRenderingEnabled = enabled;
        console.log(`🎬 Adaptive rendering ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get render skip factor based on performance
     */
    getRenderSkipFactor() {
        const avgFrameTime = this.getAverageFrameTime();
        const targetFrameTime = 1000 / 60; // 16.67ms for 60 FPS
        
        if (avgFrameTime > targetFrameTime * 2) {
            return 3; // Skip 2 out of 3 frames
        } else if (avgFrameTime > targetFrameTime * 1.5) {
            return 2; // Skip every other frame
        } else {
            return 1; // Render every frame
        }
    }
    
    /**
     * Optimize rendering performance
     */
    optimizeRenderingPerformance() {
        console.log('🚀 Optimizing rendering performance...');
        
        const stats = this.getPerformanceStats();
        console.log('Current performance stats:', stats);
        
        // Enable adaptive rendering if FPS is low
        if (stats.fps < 30) {
            console.log('⚡ Low FPS detected, enabling adaptive rendering');
            this.setAdaptiveRendering(true);
        }
        
        // Merge static geometry to reduce draw calls
        if (this.renderingEngine && this.renderingEngine.optimizeStaticGeometry) {
            this.renderingEngine.optimizeStaticGeometry();
        }
        
        // Adjust physics timestep if needed
        if (stats.physicsTime > 5) { // More than 5ms per frame
            console.log('⚡ High physics time detected, adjusting timestep');
            this.config.physics.timeStep = Math.min(this.config.physics.timeStep * 1.2, 1/30);
        }
        
        console.log('🚀 Performance optimization complete');
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
     * Optimize TensorFlow.js backend for best performance
     */
    async optimizeTensorFlowBackend() {
        console.log('🧠 Optimizing TensorFlow.js backend...');
        
        // Check current backend
        const currentBackend = tf.getBackend();
        console.log('Current TensorFlow.js backend:', currentBackend);
        
        // Try to use WebGL backend for GPU acceleration
        if (currentBackend !== 'webgl') {
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                console.log('✅ Switched to WebGL backend for GPU acceleration');
            } catch (error) {
                console.warn('⚠️ Failed to switch to WebGL backend:', error.message);
                console.log('Falling back to CPU backend');
            }
        } else {
            console.log('✅ Already using WebGL backend');
        }
        
        // Log backend capabilities
        const backend = tf.getBackend();
        console.log('Final backend:', backend);
        
        // Set memory growth to prevent OOM
        if (backend === 'webgl') {
            tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
            tf.env().set('WEBGL_FLUSH_THRESHOLD', -1);
        }
        
        // Profile tensor memory usage
        this.profileTensorMemory();
    }
    
    /**
     * Profile tensor memory usage
     */
    profileTensorMemory() {
        const memory = tf.memory();
        console.log('📊 TensorFlow.js Memory Profile:');
        console.log('  Tensors:', memory.numTensors);
        console.log('  Data Buffers:', memory.numDataBuffers);
        console.log('  Bytes:', memory.numBytes, `(${(memory.numBytes / 1024 / 1024).toFixed(2)} MB)`);
        console.log('  Unreliable:', memory.unreliable || false);
        
        // Set up periodic memory monitoring
        if (!this.tensorMemoryInterval) {
            this.tensorMemoryInterval = setInterval(() => {
                const currentMemory = tf.memory();
                if (currentMemory.numTensors > 1000) {
                    console.warn('⚠️ High tensor count:', currentMemory.numTensors);
                }
                if (currentMemory.numBytes > 100 * 1024 * 1024) { // 100MB
                    console.warn('⚠️ High memory usage:', (currentMemory.numBytes / 1024 / 1024).toFixed(2), 'MB');
                }
            }, 10000); // Check every 10 seconds
        }
    }
    
    /**
     * Optimize batch sizes for GPU utilization
     */
    optimizeBatchSizes() {
        console.log('⚡ Optimizing batch sizes for GPU utilization...');
        
        const backend = tf.getBackend();
        
        if (backend === 'webgl') {
            // Increase batch sizes for GPU
            if (this.config.dqn) {
                this.config.dqn.batchSize = Math.min(64, this.config.dqn.batchSize * 2);
                console.log('🚀 Increased DQN batch size to:', this.config.dqn.batchSize);
            }
            
            if (this.config.ppo) {
                // PPO doesn't use batch size in the same way, but we can optimize trajectory length
                console.log('🚀 PPO batch optimization: using GPU-optimized settings');
            }
        } else {
            // Smaller batch sizes for CPU
            if (this.config.dqn) {
                this.config.dqn.batchSize = Math.max(16, Math.floor(this.config.dqn.batchSize / 2));
                console.log('🐌 Reduced DQN batch size for CPU to:', this.config.dqn.batchSize);
            }
        }
    }
    
    /**
     * Test inference speed with different network sizes
     */
    async testInferenceSpeed() {
        console.log('🏃 Testing neural network inference speed...');
        
        const testState = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
        const iterations = 100;
        
        if (this.agent && this.agent.selectAction) {
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                this.agent.selectAction(testState, false); // Evaluation mode
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;
            
            console.log(`📊 Inference Performance:`);
            console.log(`  ${iterations} inferences in ${totalTime.toFixed(2)}ms`);
            console.log(`  Average: ${avgTime.toFixed(2)}ms per inference`);
            console.log(`  Throughput: ${(1000 / avgTime).toFixed(0)} inferences/second`);
            
            // Warn if inference is too slow
            if (avgTime > 10) {
                console.warn('⚠️ Slow inference detected. Consider optimizing network size or batch size.');
            }
        }
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
        
        if (this.livePlayMode) {
            this.livePlayMode.dispose();
            this.livePlayMode = null;
        }
        
        if (this.trajectoryVisualizer) {
            this.trajectoryVisualizer.dispose();
            this.trajectoryVisualizer = null;
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
    
    /**
     * Test different hyperparameter configurations
     */
    async tuneHyperparameters() {
        console.log('🎛️ Starting hyperparameter tuning...');
        
        const results = [];
        
        // Test different learning rates
        const learningRates = [0.0001, 0.0003, 0.001];
        
        // Test different network sizes
        const networkSizes = [32, 64, 128];
        
        // Test different exploration strategies (for DQN)
        const epsilonDecayRates = [0.99, 0.995, 0.999];
        
        console.log('🧪 Testing learning rates:', learningRates);
        console.log('🧪 Testing network sizes:', networkSizes);
        console.log('🧪 Testing epsilon decay rates:', epsilonDecayRates);
        
        // For demonstration, we'll test a subset of configurations
        // In practice, you'd want to run longer tests
        
        for (const lr of learningRates.slice(0, 2)) { // Test first 2 learning rates
            console.log(`\n🔬 Testing learning rate: ${lr}`);
            
            const testConfig = {
                ...this.config.dqn,
                learningRate: lr
            };
            
            const result = await this.testConfiguration('DQN', testConfig, 50); // Short test
            results.push({
                type: 'learningRate',
                value: lr,
                ...result
            });
        }
        
        // Test network sizes (simplified - would need to modify agent architecture)
        console.log('\n🔬 Testing network architectures...');
        console.log('ℹ️ Network size testing would require modifying agent architecture');
        console.log('ℹ️ Current implementation uses fixed 64-unit hidden layers');
        
        // Test epsilon decay rates
        for (const decay of epsilonDecayRates.slice(0, 2)) { // Test first 2 decay rates
            console.log(`\n🔬 Testing epsilon decay rate: ${decay}`);
            
            const testConfig = {
                ...this.config.dqn,
                epsilonDecay: decay
            };
            
            const result = await this.testConfiguration('DQN', testConfig, 50); // Short test
            results.push({
                type: 'epsilonDecay',
                value: decay,
                ...result
            });
        }
        
        // Analyze results
        this.analyzeHyperparameterResults(results);
        
        return results;
    }
    
    /**
     * Test a specific configuration
     */
    async testConfiguration(agentType, config, episodes = 100) {
        console.log(`🧪 Testing ${agentType} configuration for ${episodes} episodes...`);
        
        try {
            // Create test agent
            let testAgent;
            if (agentType === 'DQN') {
                testAgent = new DQNAgent(9, 6, config);
            } else if (agentType === 'PPO') {
                testAgent = new PPOAgent(9, 6, config);
            }
            
            // Create test orchestrator
            const testOrchestrator = new TrainingOrchestrator(
                this.environment,
                testAgent,
                { numEpisodes: episodes, renderInterval: 10 }
            );
            
            // Track results
            const rewards = [];
            const successes = [];
            let startTime = performance.now();
            
            testOrchestrator.onEpisodeComplete((stats, result) => {
                rewards.push(result.episodeReward);
                successes.push(result.success);
            });
            
            // Run training
            await testOrchestrator.startTraining(episodes);
            
            const endTime = performance.now();
            const trainingTime = endTime - startTime;
            
            // Calculate metrics
            const avgReward = rewards.reduce((a, b) => a + b, 0) / rewards.length;
            const successRate = successes.filter(s => s).length / successes.length;
            const finalRewards = rewards.slice(-10); // Last 10 episodes
            const finalAvgReward = finalRewards.reduce((a, b) => a + b, 0) / finalRewards.length;
            
            // Clean up
            testAgent.dispose();
            
            const result = {
                avgReward,
                successRate,
                finalAvgReward,
                trainingTime,
                convergenceSpeed: this.calculateConvergenceSpeed(rewards)
            };
            
            console.log(`📊 Configuration results:`, result);
            
            return result;
            
        } catch (error) {
            console.error('❌ Configuration test failed:', error);
            return {
                avgReward: -Infinity,
                successRate: 0,
                finalAvgReward: -Infinity,
                trainingTime: Infinity,
                convergenceSpeed: 0,
                error: error.message
            };
        }
    }
    
    /**
     * Calculate convergence speed (how quickly rewards improve)
     */
    calculateConvergenceSpeed(rewards) {
        if (rewards.length < 20) return 0;
        
        const firstHalf = rewards.slice(0, Math.floor(rewards.length / 2));
        const secondHalf = rewards.slice(Math.floor(rewards.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        return secondAvg - firstAvg; // Improvement from first half to second half
    }
    
    /**
     * Enable trajectory recording and visualization
     * @param {boolean} enabled - Whether to enable trajectory recording
     */
    enableTrajectoryRecording(enabled = true) {
        if (this.environment) {
            this.environment.setTrajectoryRecording(enabled);
            console.log(`📹 Trajectory recording ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    /**
     * Visualize all recorded trajectories
     * @param {Object} options - Visualization options
     */
    visualizeTrajectories(options = {}) {
        if (!this.trajectoryVisualizer || !this.environment) {
            console.warn('📹 Trajectory visualizer or environment not available');
            return;
        }
        
        const trajectories = this.environment.getTrajectoryHistory();
        if (trajectories.length === 0) {
            console.log('📹 No trajectories to visualize');
            return;
        }
        
        console.log(`📹 Visualizing ${trajectories.length} trajectories`);
        this.trajectoryVisualizer.visualizeTrajectories(trajectories, options);
    }
    
    /**
     * Replay a specific trajectory
     * @param {number} episodeIndex - Index of episode to replay (0 = most recent)
     * @param {Object} options - Replay options
     */
    replayTrajectory(episodeIndex = 0, options = {}) {
        if (!this.trajectoryVisualizer || !this.environment) {
            console.warn('📹 Trajectory visualizer or environment not available');
            return;
        }
        
        const trajectories = this.environment.getTrajectoryHistory();
        if (trajectories.length === 0) {
            console.log('📹 No trajectories to replay');
            return;
        }
        
        // Get trajectory (0 = most recent, negative indices work from end)
        const trajectory = trajectories[trajectories.length - 1 - episodeIndex];
        if (!trajectory) {
            console.warn(`📹 Trajectory at index ${episodeIndex} not found`);
            return;
        }
        
        console.log(`📹 Replaying episode ${trajectory.episode}`);
        this.trajectoryVisualizer.startTrajectoryReplay(trajectory, {
            speed: 2.0,
            showTrail: true,
            onStep: (step, index, traj) => {
                console.log(`📹 Replay step ${index}: ${step.actionName} at (${step.position.x.toFixed(2)}, ${step.position.y.toFixed(2)}, ${step.position.z.toFixed(2)})`);
            },
            onComplete: (traj) => {
                console.log(`📹 Replay complete for episode ${traj.episode}`);
            },
            ...options
        });
    }
    
    /**
     * Start live play mode
     * @param {string} mode - 'autonomous' or 'manual'
     */
    async startLivePlay(mode = 'autonomous') {
        if (!this.livePlayMode) {
            console.warn('🎮 Live play mode not available');
            return;
        }
        
        // Stop training if running
        if (this.orchestrator && this.orchestrator.isTraining) {
            console.log('🎮 Stopping training to start live play');
            this.orchestrator.stopTraining();
        }
        
        await this.livePlayMode.startLivePlay(mode);
        
        // Set up live play callbacks
        this.livePlayMode.onStep((action, result, stats) => {
            // Update UI with live play stats
            if (this.uiController) {
                this.uiController.updateStatsPanel({
                    currentEpisode: 'Live Play',
                    avgReward: stats.totalReward,
                    successRate: stats.highestPoint / this.config.environment.goalHeight
                });
            }
        });
        
        this.livePlayMode.onReset((episodeStats) => {
            console.log('🎮 Live play episode completed:', episodeStats);
        });
        
        console.log(`🎮 Live play started in ${mode} mode`);
    }
    
    /**
     * Stop live play mode
     */
    stopLivePlay() {
        if (this.livePlayMode) {
            this.livePlayMode.stopLivePlay();
            console.log('🎮 Live play stopped');
        }
    }
    
    /**
     * Switch live play mode
     * @param {string} mode - 'autonomous' or 'manual'
     */
    switchLivePlayMode(mode) {
        if (this.livePlayMode) {
            this.livePlayMode.switchMode(mode);
            console.log(`🎮 Switched to ${mode} mode`);
        }
    }
    
    /**
     * Get trajectory statistics
     * @returns {Object} Trajectory statistics
     */
    getTrajectoryStats() {
        if (!this.environment) return null;
        return this.environment.getTrajectoryStats();
    }
    
    /**
     * Clear all trajectory history
     */
    clearTrajectoryHistory() {
        if (this.environment) {
            this.environment.clearTrajectoryHistory();
        }
        if (this.trajectoryVisualizer) {
            this.trajectoryVisualizer.clearTrajectories();
        }
        console.log('📹 Trajectory history cleared');
    }
    
    /**
     * Analyze hyperparameter tuning results
     */
    analyzeHyperparameterResults(results) {
        console.log('\n📊 Hyperparameter Tuning Results Analysis:');
        console.log('=' .repeat(50));
        
        // Group results by type
        const byType = {};
        results.forEach(result => {
            if (!byType[result.type]) byType[result.type] = [];
            byType[result.type].push(result);
        });
        
        // Analyze each type
        Object.keys(byType).forEach(type => {
            console.log(`\n🔍 ${type} Results:`);
            
            const typeResults = byType[type];
            typeResults.sort((a, b) => b.finalAvgReward - a.finalAvgReward);
            
            typeResults.forEach((result, index) => {
                const rank = index + 1;
                console.log(`  ${rank}. ${type}=${result.value}:`);
                console.log(`     Final Avg Reward: ${result.finalAvgReward.toFixed(2)}`);
                console.log(`     Success Rate: ${(result.successRate * 100).toFixed(1)}%`);
                console.log(`     Convergence Speed: ${result.convergenceSpeed.toFixed(2)}`);
                console.log(`     Training Time: ${(result.trainingTime / 1000).toFixed(1)}s`);
            });
            
            // Recommend best configuration
            const best = typeResults[0];
            console.log(`\n🏆 Best ${type}: ${best.value}`);
        });
        
        // Overall best configuration
        const allResults = results.filter(r => !r.error);
        if (allResults.length > 0) {
            allResults.sort((a, b) => {
                // Score based on final reward and success rate
                const scoreA = a.finalAvgReward + (a.successRate * 50);
                const scoreB = b.finalAvgReward + (b.successRate * 50);
                return scoreB - scoreA;
            });
            
            const overall = allResults[0];
            console.log(`\n🎯 Overall Best Configuration:`);
            console.log(`   Type: ${overall.type}`);
            console.log(`   Value: ${overall.value}`);
            console.log(`   Final Avg Reward: ${overall.finalAvgReward.toFixed(2)}`);
            console.log(`   Success Rate: ${(overall.successRate * 100).toFixed(1)}%`);
        }
        
        console.log('\n✅ Hyperparameter analysis complete!');
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
