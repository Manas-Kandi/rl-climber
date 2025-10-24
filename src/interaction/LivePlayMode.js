/**
 * LivePlayMode allows real-time interaction with the trained agent
 * Users can control the agent or watch it play autonomously
 */
export class LivePlayMode {
    constructor(environment, agent, renderingEngine) {
        this.environment = environment;
        this.agent = agent;
        this.renderingEngine = renderingEngine;
        
        // Live play state
        this.isActive = false;
        this.mode = 'autonomous'; // 'autonomous' or 'manual'
        this.currentState = null;
        this.animationId = null;
        
        // Manual control state
        this.keysPressed = new Set();
        this.lastActionTime = 0;
        this.actionCooldown = 16; // ms between actions (~60 FPS)
        
        // Statistics
        this.sessionStats = {
            startTime: null,
            totalSteps: 0,
            totalReward: 0,
            highestPoint: 0,
            actionsUsed: {}
        };
        
        // Callbacks
        this.onStepCallbacks = [];
        this.onResetCallbacks = [];
        this.onModeChangeCallbacks = [];
        
        console.log('🎮 LivePlayMode initialized');
    }
    
    /**
     * Start live play mode
     * @param {string} mode - 'autonomous' or 'manual'
     */
    async startLivePlay(mode = 'autonomous') {
        if (this.isActive) {
            console.log('🎮 Live play already active');
            return;
        }
        
        console.log(`🎮 Starting live play in ${mode} mode`);
        
        this.isActive = true;
        this.mode = mode;
        
        // Reset environment and get initial state
        this.currentState = this.environment.reset();
        
        // Initialize session stats
        this.sessionStats = {
            startTime: Date.now(),
            totalSteps: 0,
            totalReward: 0,
            highestPoint: 0,
            actionsUsed: {}
        };
        
        // Set up input handlers for manual mode
        if (mode === 'manual') {
            this.setupManualControls();
        }
        
        // Start the live play loop
        this.startLivePlayLoop();
        
        // Notify callbacks
        this.onModeChangeCallbacks.forEach(callback => callback(mode));
    }
    
    /**
     * Stop live play mode
     */
    stopLivePlay() {
        if (!this.isActive) return;
        
        console.log('🎮 Stopping live play');
        
        this.isActive = false;
        
        // Stop the animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Remove manual control handlers
        this.removeManualControls();
        
        // Log final stats
        this.logSessionStats();
    }
    
    /**
     * Switch between autonomous and manual modes
     * @param {string} newMode - 'autonomous' or 'manual'
     */
    switchMode(newMode) {
        if (!this.isActive || this.mode === newMode) return;
        
        console.log(`🎮 Switching from ${this.mode} to ${newMode} mode`);
        
        const oldMode = this.mode;
        this.mode = newMode;
        
        if (newMode === 'manual') {
            this.setupManualControls();
        } else {
            this.removeManualControls();
        }
        
        // Notify callbacks
        this.onModeChangeCallbacks.forEach(callback => callback(newMode, oldMode));
    }
    
    /**
     * Main live play loop
     */
    startLivePlayLoop() {
        const loop = () => {
            if (!this.isActive) return;
            
            try {
                let action = null;
                
                if (this.mode === 'autonomous') {
                    // Let the agent decide
                    action = this.agent.selectAction(this.currentState, false); // Evaluation mode
                } else if (this.mode === 'manual') {
                    // Get action from user input
                    action = this.getManualAction();
                }
                
                if (action !== null) {
                    this.executeAction(action);
                }
                
                // Continue the loop
                this.animationId = requestAnimationFrame(loop);
                
            } catch (error) {
                console.error('🎮 Error in live play loop:', error);
                this.stopLivePlay();
            }
        };
        
        loop();
    }
    
    /**
     * Execute an action in the environment
     * @param {number} action - Action to execute
     */
    executeAction(action) {
        // Step the environment
        const result = this.environment.step(action);
        
        // Update current state
        this.currentState = result.state;
        
        // Update statistics
        this.updateSessionStats(action, result);
        
        // Notify step callbacks
        this.onStepCallbacks.forEach(callback => {
            callback(action, result, this.sessionStats);
        });
        
        // Check if episode ended
        if (result.done) {
            console.log('🎮 Episode completed in live play');
            this.resetEpisode();
        }
    }
    
    /**
     * Reset the episode and start a new one
     */
    resetEpisode() {
        console.log('🎮 Resetting episode in live play');
        
        // Reset environment
        this.currentState = this.environment.reset();
        
        // Log episode stats
        const episodeStats = { ...this.sessionStats };
        
        // Reset step-based stats but keep session totals
        this.sessionStats.totalSteps = 0;
        this.sessionStats.totalReward = 0;
        this.sessionStats.highestPoint = 0;
        
        // Notify reset callbacks
        this.onResetCallbacks.forEach(callback => callback(episodeStats));
    }
    
    /**
     * Set up manual control event listeners
     */
    setupManualControls() {
        console.log('🎮 Setting up manual controls');
        
        // Keyboard event listeners
        this.keyDownHandler = (event) => this.handleKeyDown(event);
        this.keyUpHandler = (event) => this.handleKeyUp(event);
        
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        
        // Show control instructions
        this.showControlInstructions();
    }
    
    /**
     * Remove manual control event listeners
     */
    removeManualControls() {
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
            document.removeEventListener('keyup', this.keyUpHandler);
        }
        
        this.hideControlInstructions();
    }
    
    /**
     * Handle key down events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        // Prevent default browser behavior for game keys
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
        if (gameKeys.includes(event.code)) {
            event.preventDefault();
        }
        
        this.keysPressed.add(event.code);
    }
    
    /**
     * Handle key up events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
        this.keysPressed.delete(event.code);
    }
    
    /**
     * Get manual action based on current key presses
     * @returns {number|null} Action index or null if no action
     */
    getManualAction() {
        const now = Date.now();
        
        // Respect action cooldown
        if (now - this.lastActionTime < this.actionCooldown) {
            return null;
        }
        
        // Map keys to actions
        const keyActionMap = {
            'ArrowUp': 0,    // FORWARD
            'KeyW': 0,       // FORWARD
            'ArrowDown': 1,  // BACKWARD
            'KeyS': 1,       // BACKWARD
            'ArrowLeft': 2,  // LEFT
            'KeyA': 2,       // LEFT
            'ArrowRight': 3, // RIGHT
            'KeyD': 3,       // RIGHT
            'Space': 4,      // JUMP
            'KeyE': 5        // GRAB
        };
        
        // Find the first pressed key that maps to an action
        for (const key of this.keysPressed) {
            if (keyActionMap.hasOwnProperty(key)) {
                this.lastActionTime = now;
                return keyActionMap[key];
            }
        }
        
        return null;
    }
    
    /**
     * Update session statistics
     * @param {number} action - Action taken
     * @param {Object} result - Environment step result
     */
    updateSessionStats(action, result) {
        this.sessionStats.totalSteps++;
        this.sessionStats.totalReward += result.reward;
        
        // Track highest point reached
        const agentPos = result.info.agentPosition;
        if (agentPos.y > this.sessionStats.highestPoint) {
            this.sessionStats.highestPoint = agentPos.y;
        }
        
        // Track action usage
        const actionName = result.info.actionName;
        if (!this.sessionStats.actionsUsed[actionName]) {
            this.sessionStats.actionsUsed[actionName] = 0;
        }
        this.sessionStats.actionsUsed[actionName]++;
    }
    
    /**
     * Show control instructions overlay
     */
    showControlInstructions() {
        // Remove existing instructions
        this.hideControlInstructions();
        
        const instructions = document.createElement('div');
        instructions.id = 'live-play-instructions';
        instructions.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            z-index: 1000;
            text-align: center;
        `;
        
        instructions.innerHTML = `
            <div style="margin-bottom: 10px;"><strong>🎮 Manual Control Mode</strong></div>
            <div>
                <span style="color: #00ff00;">WASD / Arrow Keys:</span> Move &nbsp;&nbsp;
                <span style="color: #00ff00;">Space:</span> Jump &nbsp;&nbsp;
                <span style="color: #00ff00;">E:</span> Grab
            </div>
        `;
        
        document.body.appendChild(instructions);
    }
    
    /**
     * Hide control instructions overlay
     */
    hideControlInstructions() {
        const existing = document.getElementById('live-play-instructions');
        if (existing) {
            existing.remove();
        }
    }
    
    /**
     * Log session statistics
     */
    logSessionStats() {
        const duration = Date.now() - this.sessionStats.startTime;
        const durationSec = duration / 1000;
        
        console.log('🎮 Live Play Session Stats:');
        console.log(`  Duration: ${durationSec.toFixed(1)}s`);
        console.log(`  Total Steps: ${this.sessionStats.totalSteps}`);
        console.log(`  Total Reward: ${this.sessionStats.totalReward.toFixed(2)}`);
        console.log(`  Highest Point: ${this.sessionStats.highestPoint.toFixed(2)}`);
        console.log(`  Actions Used:`, this.sessionStats.actionsUsed);
    }
    
    /**
     * Get current session statistics
     * @returns {Object} Current session stats
     */
    getSessionStats() {
        return {
            ...this.sessionStats,
            duration: this.sessionStats.startTime ? Date.now() - this.sessionStats.startTime : 0,
            isActive: this.isActive,
            mode: this.mode
        };
    }
    
    /**
     * Register callback for step events
     * @param {Function} callback - Callback function (action, result, stats) => {}
     */
    onStep(callback) {
        this.onStepCallbacks.push(callback);
    }
    
    /**
     * Register callback for episode reset events
     * @param {Function} callback - Callback function (episodeStats) => {}
     */
    onReset(callback) {
        this.onResetCallbacks.push(callback);
    }
    
    /**
     * Register callback for mode change events
     * @param {Function} callback - Callback function (newMode, oldMode) => {}
     */
    onModeChange(callback) {
        this.onModeChangeCallbacks.push(callback);
    }
    
    /**
     * Force a manual reset of the current episode
     */
    forceReset() {
        if (this.isActive) {
            this.resetEpisode();
        }
    }
    
    /**
     * Get available control modes
     * @returns {Array} Array of available modes
     */
    getAvailableModes() {
        return ['autonomous', 'manual'];
    }
    
    /**
     * Check if live play is currently active
     * @returns {boolean} Whether live play is active
     */
    isLivePlayActive() {
        return this.isActive;
    }
    
    /**
     * Dispose of live play mode resources
     */
    dispose() {
        this.stopLivePlay();
        
        // Clear callbacks
        this.onStepCallbacks = [];
        this.onResetCallbacks = [];
        this.onModeChangeCallbacks = [];
        
        console.log('🎮 LivePlayMode disposed');
    }
}