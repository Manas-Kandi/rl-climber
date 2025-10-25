/**
 * SceneManager handles different training environments/scenes
 * Allows switching between different obstacle courses
 */
export class SceneManager {
    constructor(physicsEngine, renderingEngine) {
        this.physicsEngine = physicsEngine;
        this.renderingEngine = renderingEngine;
        
        // Available scenes
        this.scenes = {
            staircase: this.createStaircaseScene.bind(this),
            wall: this.createWallScene.bind(this),
            // Future: parkour, maze, etc.
        };
        
        this.currentScene = null;
        this.currentSceneName = null;
    }
    
    /**
     * Load a scene by name
     * @param {string} sceneName - Name of scene to load
     * @returns {Object} Scene configuration
     */
    loadScene(sceneName) {
        if (!this.scenes[sceneName]) {
            console.error('Scene not found:', sceneName);
            return null;
        }
        
        console.log('🎬 Loading scene:', sceneName);
        
        // Clear current scene if exists
        if (this.currentScene) {
            this.clearScene();
        }
        
        // Create new scene
        this.currentScene = this.scenes[sceneName]();
        this.currentSceneName = sceneName;
        
        console.log('✅ Scene loaded:', sceneName);
        return this.currentScene;
    }
    
    /**
     * Clear current scene (remove all objects)
     */
    clearScene() {
        // This would remove physics bodies and meshes
        // For now, just log
        console.log('Clearing scene:', this.currentSceneName);
    }
    
    /**
     * Create a simple staircase scene
     * Perfect for learning basic climbing
     */
    createStaircaseScene() {
        const scene = {
            name: 'staircase',
            description: 'Simple staircase with 10 steps',
            goalHeight: 10.0,
            agentStart: { x: 0, y: 1, z: 3 },  // Start in front of stairs
            obstacles: [],
            rewardConfig: {
                heightGain: 3.0,      // High reward for climbing
                goalReached: 100.0,
                survival: 0.1,
                fall: -10.0,          // Less harsh for learning
                timePenalty: -0.001,  // Very small
                stepReward: 10.0,     // Reward for reaching each step
                outOfBounds: -30.0
            }
        };
        
        // Create 10 steps
        const stepHeight = 1.0;
        const stepDepth = 2.0;
        const stepWidth = 4.0;
        
        for (let i = 0; i < 10; i++) {
            const step = {
                type: 'step',
                position: {
                    x: 0,
                    y: stepHeight * (i + 0.5),
                    z: -stepDepth * i
                },
                size: {
                    x: stepWidth,
                    y: stepHeight,
                    z: stepDepth
                },
                color: 0x8B4513,  // Brown
                id: `step_${i}`,
                rewardValue: 10.0  // Reward for reaching this step
            };
            scene.obstacles.push(step);
        }
        
        // Create goal platform at top
        scene.obstacles.push({
            type: 'goal',
            position: { x: 0, y: 10.5, z: -20 },
            size: { x: 4, y: 0.5, z: 2 },
            color: 0x00ff00,  // Green
            id: 'goal'
        });
        
        return scene;
    }
    
    /**
     * Create the original wall climbing scene
     */
    createWallScene() {
        const scene = {
            name: 'wall',
            description: 'Vertical wall with ledges',
            goalHeight: 14.0,
            agentStart: { x: 0, y: 1, z: 0 },
            obstacles: [],
            rewardConfig: {
                heightGain: 2.0,
                goalReached: 100.0,
                survival: 0.1,
                fall: -20.0,
                timePenalty: -0.005,
                ledgeGrab: 8.0,
                outOfBounds: -50.0
            }
        };
        
        // Create ledges
        const ledges = [
            { position: { x: 0, y: 2, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
            { position: { x: 1, y: 4, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
            { position: { x: -1, y: 6, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
            { position: { x: 0, y: 8, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
            { position: { x: 1, y: 10, z: -5 }, size: { x: 2, y: 0.2, z: 1 } },
            { position: { x: 0, y: 12, z: -5 }, size: { x: 2, y: 0.2, z: 1 } }
        ];
        
        ledges.forEach((ledge, i) => {
            scene.obstacles.push({
                type: 'ledge',
                position: ledge.position,
                size: ledge.size,
                color: 0x8B4513,
                id: `ledge_${i}`
            });
        });
        
        // Goal at top
        scene.obstacles.push({
            type: 'goal',
            position: { x: 0, y: 14, z: -5 },
            size: { x: 2, y: 0.5, z: 1 },
            color: 0x00ff00,
            id: 'goal'
        });
        
        return scene;
    }
    
    /**
     * Get current scene configuration
     */
    getCurrentScene() {
        return this.currentScene;
    }
    
    /**
     * Get list of available scenes
     */
    getAvailableScenes() {
        return Object.keys(this.scenes);
    }
}
