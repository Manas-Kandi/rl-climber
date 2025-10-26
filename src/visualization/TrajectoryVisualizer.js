import * as THREE from 'three';

/**
 * TrajectoryVisualizer handles visualization of agent trajectories and historical paths
 */
export class TrajectoryVisualizer {
    constructor(renderingEngine) {
        this.renderingEngine = renderingEngine;
        this.scene = renderingEngine.scene;
        
        // Trajectory visualization objects
        this.trajectoryLines = [];
        this.trajectoryPoints = [];
        this.currentReplayIndex = 0;
        this.isReplaying = false;
        this.replaySpeed = 1.0;
        
        // Ghost agent for replay
        this.ghostAgent = null;
        this.ghostTrail = null;
        
        // Materials for different trajectory types
        this.materials = {
            successful: new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.7, transparent: true }),
            failed: new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true }),
            current: new THREE.LineBasicMaterial({ color: 0x00ffff, opacity: 0.9, transparent: true }),
            ghost: new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 0.6, transparent: true })
        };
        
        console.log('📹 TrajectoryVisualizer initialized');
    }
    
    /**
     * Visualize all trajectories from history
     * @param {Array} trajectories - Array of trajectory objects
     * @param {Object} options - Visualization options
     */
    visualizeTrajectories(trajectories, options = {}) {
        const {
            showSuccessful = true,
            showFailed = true,
            maxTrajectories = 10,
            fadeOlder = true
        } = options;
        
        // Clear existing trajectory visualizations
        this.clearTrajectories();
        
        console.log(`📹 Visualizing ${trajectories.length} trajectories`);
        
        // Take the most recent trajectories
        const recentTrajectories = trajectories.slice(-maxTrajectories);
        
        recentTrajectories.forEach((trajectory, index) => {
            if (trajectory.success && !showSuccessful) return;
            if (!trajectory.success && !showFailed) return;
            
            this.createTrajectoryLine(trajectory, index, recentTrajectories.length, fadeOlder);
        });
    }
    
    /**
     * Create a line visualization for a single trajectory
     * @param {Object} trajectory - Trajectory object
     * @param {number} index - Index in the trajectory list
     * @param {number} total - Total number of trajectories
     * @param {boolean} fadeOlder - Whether to fade older trajectories
     */
    createTrajectoryLine(trajectory, index, total, fadeOlder) {
        const points = [];
        
        // Extract positions from trajectory (handle both old and new format)
        const steps = trajectory.steps || trajectory.trajectory || [];
        steps.forEach(step => {
            points.push(new THREE.Vector3(step.position.x, step.position.y, step.position.z));
        });
        
        if (points.length < 2) return; // Need at least 2 points for a line
        
        // Create geometry
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Choose material based on success and age
        let material;
        if (trajectory.success) {
            material = this.materials.successful.clone();
        } else {
            material = this.materials.failed.clone();
        }
        
        // Fade older trajectories
        if (fadeOlder) {
            const age = (total - index - 1) / total;
            material.opacity *= (1 - age * 0.7); // Fade to 30% opacity for oldest
        }
        
        // Create line
        const line = new THREE.Line(geometry, material);
        line.userData = {
            type: 'trajectory',
            episode: trajectory.episode,
            success: trajectory.success,
            totalReward: trajectory.totalReward
        };
        
        this.scene.add(line);
        this.trajectoryLines.push(line);
        
        // Add start and end markers
        this.addTrajectoryMarkers(trajectory, material.color);
    }
    
    /**
     * Add start and end markers for a trajectory
     * @param {Object} trajectory - Trajectory object
     * @param {THREE.Color} color - Color for the markers
     */
    addTrajectoryMarkers(trajectory, color) {
        const steps = trajectory.steps || trajectory.trajectory || [];
        if (steps.length === 0) return;
        
        const startPos = steps[0].position;
        const endPos = steps[steps.length - 1].position;
        
        // Start marker (small sphere)
        const startGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const startMaterial = new THREE.MeshBasicMaterial({ 
            color: color, 
            opacity: 0.8, 
            transparent: true 
        });
        const startMarker = new THREE.Mesh(startGeometry, startMaterial);
        startMarker.position.set(startPos.x, startPos.y, startPos.z);
        startMarker.userData = { type: 'trajectory-start' };
        
        this.scene.add(startMarker);
        this.trajectoryPoints.push(startMarker);
        
        // End marker (larger sphere or different shape for goal)
        const endGeometry = trajectory.success ? 
            new THREE.ConeGeometry(0.15, 0.3, 6) : 
            new THREE.SphereGeometry(0.12, 8, 6);
        const endMaterial = new THREE.MeshBasicMaterial({ 
            color: trajectory.success ? 0xffd700 : color,
            opacity: 0.9, 
            transparent: true 
        });
        const endMarker = new THREE.Mesh(endGeometry, endMaterial);
        endMarker.position.set(endPos.x, endPos.y, endPos.z);
        endMarker.userData = { 
            type: 'trajectory-end',
            success: trajectory.success
        };
        
        this.scene.add(endMarker);
        this.trajectoryPoints.push(endMarker);
    }
    
    /**
     * Start replaying a specific trajectory
     * @param {Object} trajectory - Trajectory to replay
     * @param {Object} options - Replay options
     */
    startTrajectoryReplay(trajectory, options = {}) {
        const {
            speed = 1.0,
            showTrail = true,
            onStep = null,
            onComplete = null
        } = options;
        
        console.log(`📹 Starting replay of episode ${trajectory.episode}`);
        
        this.isReplaying = true;
        this.replaySpeed = speed;
        this.currentReplayIndex = 0;
        this.replayTrajectory = trajectory;
        this.replayOptions = { showTrail, onStep, onComplete };
        
        // Create ghost agent
        this.createGhostAgent();
        
        // Create trail if requested
        if (showTrail) {
            this.createGhostTrail();
        }
        
        // Start the replay loop
        this.replayLoop();
    }
    
    /**
     * Create a ghost agent for trajectory replay
     */
    createGhostAgent() {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.ghostAgent = new THREE.Mesh(geometry, this.materials.ghost);
        this.ghostAgent.userData = { type: 'ghost-agent' };
        
        // Position at start
        const steps = this.replayTrajectory.steps || this.replayTrajectory.trajectory || [];
        const startPos = steps[0].position;
        this.ghostAgent.position.set(startPos.x, startPos.y, startPos.z);
        
        this.scene.add(this.ghostAgent);
    }
    
    /**
     * Create a trail that follows the ghost agent
     */
    createGhostTrail() {
        const points = [this.ghostAgent.position.clone()];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        this.ghostTrail = new THREE.Line(geometry, this.materials.current);
        this.ghostTrail.userData = { type: 'ghost-trail' };
        
        this.scene.add(this.ghostTrail);
    }
    
    /**
     * Main replay loop
     */
    replayLoop() {
        const steps = this.replayTrajectory.steps || this.replayTrajectory.trajectory || [];
        
        if (!this.isReplaying || this.currentReplayIndex >= steps.length) {
            this.stopTrajectoryReplay();
            return;
        }
        
        const step = steps[this.currentReplayIndex];
        
        // Update ghost agent position
        if (this.ghostAgent) {
            this.ghostAgent.position.set(step.position.x, step.position.y, step.position.z);
        }
        
        // Update trail
        if (this.ghostTrail && this.currentReplayIndex > 0) {
            const steps = this.replayTrajectory.steps || this.replayTrajectory.trajectory || [];
            const points = steps
                .slice(0, this.currentReplayIndex + 1)
                .map(s => new THREE.Vector3(s.position.x, s.position.y, s.position.z));
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            this.ghostTrail.geometry.dispose();
            this.ghostTrail.geometry = geometry;
        }
        
        // Call step callback
        if (this.replayOptions.onStep) {
            this.replayOptions.onStep(step, this.currentReplayIndex, this.replayTrajectory);
        }
        
        this.currentReplayIndex++;
        
        // Schedule next step
        const delay = 100 / this.replaySpeed; // Base delay of 100ms
        setTimeout(() => this.replayLoop(), delay);
    }
    
    /**
     * Stop trajectory replay
     */
    stopTrajectoryReplay() {
        console.log('📹 Stopping trajectory replay');
        
        this.isReplaying = false;
        
        // Remove ghost agent and trail
        if (this.ghostAgent) {
            this.scene.remove(this.ghostAgent);
            this.ghostAgent.geometry.dispose();
            this.ghostAgent.material.dispose();
            this.ghostAgent = null;
        }
        
        if (this.ghostTrail) {
            this.scene.remove(this.ghostTrail);
            this.ghostTrail.geometry.dispose();
            this.ghostTrail.material.dispose();
            this.ghostTrail = null;
        }
        
        // Call completion callback
        if (this.replayOptions && this.replayOptions.onComplete) {
            this.replayOptions.onComplete(this.replayTrajectory);
        }
    }
    
    /**
     * Clear all trajectory visualizations
     */
    clearTrajectories() {
        // Remove trajectory lines
        this.trajectoryLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.trajectoryLines = [];
        
        // Remove trajectory points
        this.trajectoryPoints.forEach(point => {
            this.scene.remove(point);
            point.geometry.dispose();
            point.material.dispose();
        });
        this.trajectoryPoints = [];
        
        console.log('📹 Cleared all trajectory visualizations');
    }
    
    /**
     * Toggle trajectory visibility
     * @param {boolean} visible - Whether trajectories should be visible
     */
    setTrajectoriesVisible(visible) {
        this.trajectoryLines.forEach(line => {
            line.visible = visible;
        });
        
        this.trajectoryPoints.forEach(point => {
            point.visible = visible;
        });
    }
    
    /**
     * Get trajectory visualization statistics
     * @returns {Object} Statistics about current visualizations
     */
    getVisualizationStats() {
        return {
            trajectoryLines: this.trajectoryLines.length,
            trajectoryPoints: this.trajectoryPoints.length,
            isReplaying: this.isReplaying,
            replayProgress: this.isReplaying ? 
                this.currentReplayIndex / (this.replayTrajectory.steps || this.replayTrajectory.trajectory || []).length : 0
        };
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        this.stopTrajectoryReplay();
        this.clearTrajectories();
        
        // Dispose materials
        Object.values(this.materials).forEach(material => {
            material.dispose();
        });
        
        console.log('📹 TrajectoryVisualizer disposed');
    }
}