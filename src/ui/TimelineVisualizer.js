/**
 * TimelineVisualizer - UI component for scrubbing through training history
 * Displays timeline of episodes with playback controls
 */

export class TimelineVisualizer {
    constructor(renderingEngine, trajectoryStorage) {
        this.renderingEngine = renderingEngine;
        this.trajectoryStorage = trajectoryStorage;

        // UI elements
        this.container = null;
        this.timeline = null;
        this.scrubber = null;
        this.playButton = null;
        this.episodeInfo = null;

        // State
        this.trajectories = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playbackSpeed = 1.0;
        this.currentTrajectory = null;
        this.currentStepIndex = 0;

        // Playback
        this.playbackInterval = null;
        this.pathLines = [];
    }

    /**
     * Initialize the timeline UI
     */
    async init() {
        // Load trajectory list
        await this.loadTrajectoryList();

        // Create UI
        this.createUI();

        // Bind events
        this.bindEvents();

        console.log('📊 Timeline visualizer initialized');
        console.log(`   Loaded ${this.trajectories.length} trajectories`);
    }

    /**
     * Load list of available trajectories
     */
    async loadTrajectoryList() {
        if (!this.trajectoryStorage) {
            console.warn('⚠️ No trajectory storage available');
            return;
        }

        this.trajectories = this.trajectoryStorage.getTrajectoryList();

        // Sort by episode number
        this.trajectories.sort((a, b) => a.episode - b.episode);
    }

    /**
     * Create timeline UI
     */
    createUI() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'timeline-visualizer';
        this.container.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 200px;
            background: rgba(0, 0, 0, 0.9);
            border-top: 2px solid #00ff00;
            padding: 20px;
            display: none;
            flex-direction: column;
            gap: 15px;
            z-index: 1000;
        `;

        // Episode info
        this.episodeInfo = document.createElement('div');
        this.episodeInfo.style.cssText = `
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
        `;
        this.episodeInfo.innerHTML = `
            <div>
                <span id="episode-number">Episode: -</span> | 
                <span id="episode-reward">Reward: -</span> | 
                <span id="episode-steps">Steps: -</span> | 
                <span id="episode-success">Status: -</span>
            </div>
            <div>
                <span id="timeline-stats">${this.trajectories.length} episodes loaded</span>
            </div>
        `;

        // Timeline container
        const timelineContainer = document.createElement('div');
        timelineContainer.style.cssText = `
            position: relative;
            height: 60px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            cursor: pointer;
        `;

        // Timeline canvas (for episode markers)
        this.timeline = document.createElement('canvas');
        this.timeline.width = window.innerWidth - 40;
        this.timeline.height = 60;
        this.timeline.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        `;
        timelineContainer.appendChild(this.timeline);

        // Scrubber
        this.scrubber = document.createElement('div');
        this.scrubber.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 3px;
            height: 100%;
            background: #00ff00;
            cursor: grab;
            z-index: 10;
        `;
        timelineContainer.appendChild(this.scrubber);

        // Controls
        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 10px;
            align-items: center;
        `;

        // Play/Pause button
        this.playButton = document.createElement('button');
        this.playButton.textContent = '▶ Play';
        this.playButton.style.cssText = `
            padding: 8px 16px;
            background: #00ff00;
            color: #000;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-weight: bold;
        `;

        // Speed control
        const speedLabel = document.createElement('span');
        speedLabel.textContent = 'Speed:';
        speedLabel.style.cssText = `
            color: #00ff00;
            font-family: 'Courier New', monospace;
        `;

        const speedControl = document.createElement('select');
        speedControl.innerHTML = `
            <option value="0.5">0.5x</option>
            <option value="1" selected>1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
        `;
        speedControl.style.cssText = `
            padding: 5px;
            background: #000;
            color: #00ff00;
            border: 1px solid #00ff00;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        `;

        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕ Close';
        closeButton.style.cssText = `
            padding: 8px 16px;
            background: #ff0000;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            margin-left: auto;
        `;

        controls.appendChild(this.playButton);
        controls.appendChild(speedLabel);
        controls.appendChild(speedControl);
        controls.appendChild(closeButton);

        // Assemble UI
        this.container.appendChild(this.episodeInfo);
        this.container.appendChild(timelineContainer);
        this.container.appendChild(controls);

        document.body.appendChild(this.container);

        // Draw timeline
        this.drawTimeline();

        // Store references
        this.speedControl = speedControl;
        this.closeButton = closeButton;
        this.timelineContainer = timelineContainer;
    }

    /**
     * Draw timeline with episode markers
     */
    drawTimeline() {
        const ctx = this.timeline.getContext('2d');
        const width = this.timeline.width;
        const height = this.timeline.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        if (this.trajectories.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('No trajectories loaded', width / 2, height / 2);
            return;
        }

        // Draw episode markers
        const episodeWidth = width / this.trajectories.length;

        this.trajectories.forEach((traj, index) => {
            const x = index * episodeWidth;

            // Color based on success/reward
            let color;
            if (traj.success) {
                color = '#00ff00'; // Green for success
            } else if (traj.reward > 0) {
                color = '#ffff00'; // Yellow for positive reward
            } else {
                color = '#ff0000'; // Red for failure
            }

            // Draw bar
            const barHeight = Math.min(height, Math.abs(traj.reward) / 10 * height);
            ctx.fillStyle = color;
            ctx.fillRect(x, height - barHeight, Math.max(1, episodeWidth - 1), barHeight);
        });

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const y = (i / 10) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    /**
     * Bind UI events
     */
    bindEvents() {
        // Timeline click
        this.timelineContainer.addEventListener('click', (e) => {
            const rect = this.timelineContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            const index = Math.floor(percent * this.trajectories.length);
            this.seekToEpisode(index);
        });

        // Scrubber drag
        let isDragging = false;
        this.scrubber.addEventListener('mousedown', () => {
            isDragging = true;
            this.scrubber.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const rect = this.timelineContainer.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const percent = x / rect.width;
            const index = Math.floor(percent * this.trajectories.length);
            this.seekToEpisode(index);
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.scrubber.style.cursor = 'grab';
            }
        });

        // Play button
        this.playButton.addEventListener('click', () => {
            this.togglePlayback();
        });

        // Speed control
        this.speedControl.addEventListener('change', (e) => {
            this.playbackSpeed = parseFloat(e.target.value);
        });

        // Close button
        this.closeButton.addEventListener('click', () => {
            this.hide();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible()) return;

            if (e.key === ' ') {
                e.preventDefault();
                this.togglePlayback();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.seekToEpisode(Math.max(0, this.currentIndex - 1));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.seekToEpisode(Math.min(this.trajectories.length - 1, this.currentIndex + 1));
            }
        });
    }

    /**
     * Seek to specific episode
     */
    async seekToEpisode(index) {
        if (index < 0 || index >= this.trajectories.length) return;

        // Stop playback if running
        if (this.isPlaying) {
            this.stopPlayback();
        }

        this.currentIndex = index;

        // Update scrubber position
        const percent = index / this.trajectories.length;
        this.scrubber.style.left = `${percent * 100}%`;

        // Load trajectory
        const metadata = this.trajectories[index];
        this.currentTrajectory = await this.trajectoryStorage.loadTrajectory(metadata.episode);

        // IMPORTANT: Reset step index AFTER loading trajectory
        this.currentStepIndex = 0;

        // Update info
        this.updateEpisodeInfo();

        // Visualize trajectory
        this.visualizeTrajectory();
    }

    /**
     * Update episode info display
     */
    updateEpisodeInfo() {
        if (!this.currentTrajectory) return;

        // Get steps array (handle both 'steps' and 'trajectory' field names)
        const steps = this.currentTrajectory.steps || this.currentTrajectory.trajectory || [];
        const totalReward = this.currentTrajectory.totalReward ||
            (steps.length > 0 ? steps[steps.length - 1].totalReward : 0) || 0;

        document.getElementById('episode-number').textContent =
            `Episode: ${this.currentTrajectory.episode}`;
        document.getElementById('episode-reward').textContent =
            `Reward: ${totalReward.toFixed(2)}`;
        document.getElementById('episode-steps').textContent =
            `Steps: ${steps.length}`;
        document.getElementById('episode-success').textContent =
            `Status: ${this.currentTrajectory.success ? '✅ Success' : '❌ Failed'}`;
    }

    /**
     * Visualize current trajectory
     */
    visualizeTrajectory() {
        if (!this.currentTrajectory || !this.renderingEngine) {
            console.warn('Cannot visualize: missing trajectory or rendering engine');
            return;
        }

        // Get steps array (trajectory field contains the actual array)
        const steps = this.currentTrajectory.trajectory || [];

        console.log(`Visualizing episode ${this.currentTrajectory.episode} with ${steps.length} steps`);

        // Clear previous path lines
        this.clearPathLines();

        // Draw path line through all positions
        this.drawPathLine(steps);

        // Position agent at start
        if (steps.length > 0) {
            const firstStep = steps[0];
            this.renderingEngine.updateAgentPosition(firstStep.position);
            this.renderingEngine.updateCamera(firstStep.position);
            this.renderingEngine.render();

            console.log(`Agent positioned at start: (${firstStep.position.x.toFixed(2)}, ${firstStep.position.y.toFixed(2)}, ${firstStep.position.z.toFixed(2)})`);
        }
    }

    /**
     * Draw path line for trajectory using Three.js
     */
    drawPathLine(steps) {
        if (!this.renderingEngine || !this.renderingEngine.scene) {
            console.warn('Cannot draw path: rendering engine not available');
            return;
        }

        if (steps.length < 2) {
            // Silently skip - episode ended too quickly
            return;
        }

        try {
            // Ensure steps is an array
            if (!Array.isArray(steps)) {
                console.error('drawPathLine: steps is not an array:', typeof steps, steps);
                return;
            }

            // Import Three.js
            import('three').then((THREE) => {
                // Create points for the line
                const points = steps.map(step =>
                    new THREE.Vector3(step.position.x, step.position.y, step.position.z)
                );

                // Create line geometry
                const geometry = new THREE.BufferGeometry().setFromPoints(points);

                // Create line material (cyan color, semi-transparent)
                const material = new THREE.LineBasicMaterial({
                    color: 0x00ffff,
                    opacity: 0.6,
                    transparent: true,
                    linewidth: 2
                });

                // Create line mesh
                const line = new THREE.Line(geometry, material);

                // Add to scene
                this.renderingEngine.scene.add(line);
                this.pathLines.push(line);

                // Render to show the line
                this.renderingEngine.render();

                console.log(`Drew path line with ${points.length} points`);
            });
        } catch (error) {
            console.error('Error drawing path line:', error);
        }
    }

    /**
     * Clear path lines
     */
    clearPathLines() {
        this.pathLines.forEach(line => {
            if (this.renderingEngine.scene) {
                this.renderingEngine.scene.remove(line);
            }
        });
        this.pathLines = [];
    }

    /**
     * Toggle playback
     */
    togglePlayback() {
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    /**
     * Start playback using requestAnimationFrame for smooth rendering
     */
    startPlayback() {
        if (!this.currentTrajectory) return;
        
        this.isPlaying = true;
        this.playButton.textContent = '⏸ Pause';
        
        let lastTime = performance.now();
        const frameDelay = (1000 / 60) / this.playbackSpeed;
        
        const animate = (currentTime) => {
            if (!this.isPlaying) return;
            
            const elapsed = currentTime - lastTime;
            
            if (elapsed >= frameDelay) {
                this.advanceStep();
                lastTime = currentTime;
            }
            
            this.playbackInterval = requestAnimationFrame(animate);
        };
        
        this.playbackInterval = requestAnimationFrame(animate);
    }

    /**
     * Stop playback
     */
    stopPlayback() {
        this.isPlaying = false;
        this.playButton.textContent = '▶ Play';

        if (this.playbackInterval) {
            cancelAnimationFrame(this.playbackInterval);
            this.playbackInterval = null;
        }
    }

    /**
     * Advance to next step
     */
    advanceStep() {
        if (!this.currentTrajectory) return;

        const steps = this.currentTrajectory.trajectory || [];

        this.currentStepIndex++;

        if (this.currentStepIndex >= steps.length) {
            if (this.currentIndex < this.trajectories.length - 1) {
                this.seekToEpisode(this.currentIndex + 1);
            } else {
                this.stopPlayback();
                this.currentStepIndex = 0;
            }
            return;
        }

        const step = steps[this.currentStepIndex];
        if (this.renderingEngine && step && step.position) {
            this.renderingEngine.updateAgentPosition(step.position);
            this.renderingEngine.updateCamera(step.position);
            this.renderingEngine.render();
        }
    }

    /**
     * Show timeline
     */
    show() {
        this.container.style.display = 'flex';

        // Seek to first episode
        if (this.trajectories.length > 0) {
            this.seekToEpisode(0);
        }
    }

    /**
     * Hide timeline
     */
    hide() {
        this.container.style.display = 'none';
        this.stopPlayback();
        this.clearPathLines();
    }

    /**
     * Check if timeline is visible
     */
    isVisible() {
        return this.container.style.display === 'flex';
    }

    /**
     * Dispose of timeline
     */
    dispose() {
        this.stopPlayback();
        this.clearPathLines();

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
