/**
 * UIController manages the user interface and handles user interactions
 * for the 3D RL Climbing Game. It coordinates between the UI elements
 * and the training orchestrator.
 */
export class UIController {
  constructor(orchestrator, agent) {
    this.orchestrator = orchestrator;
    this.agent = agent;
    
    // DOM element references
    this.elements = {};
    
    // Training state
    this.isTraining = false;
    
    // Chart instances (will be initialized later)
    this.rewardChart = null;
    this.successChart = null;
  }

  /**
   * Initialize the UI controller by setting up DOM references and event listeners
   */
  async init() {
    this.setupDOMReferences();
    this.setupEventListeners();
    this.setupOrchestatorCallbacks();
    await this.initializeCharts();
    console.log('UIController initialized');
  }

  /**
   * Set up references to DOM elements
   */
  setupDOMReferences() {
    this.elements = {
      // Buttons
      btnStart: document.getElementById('btn-start'),
      btnStop: document.getElementById('btn-stop'),
      btnSave: document.getElementById('btn-save'),
      btnLoad: document.getElementById('btn-load'),
      
      // Stats display
      statEpisode: document.getElementById('stat-episode'),
      statReward: document.getElementById('stat-reward'),
      statSuccess: document.getElementById('stat-success'),
      statStatus: document.getElementById('stat-status'),
      
      // Charts
      rewardChart: document.getElementById('reward-chart'),
      successChart: document.getElementById('success-chart'),
      
      // Notification
      notification: document.getElementById('notification')
    };

    // Verify all elements exist
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        console.error(`UI element not found: ${key}`);
      }
    }
  }

  /**
   * Set up event listeners for UI interactions
   */
  setupEventListeners() {
    // Training control buttons
    this.elements.btnStart.addEventListener('click', () => this.onStartTraining());
    this.elements.btnStop.addEventListener('click', () => this.onStopTraining());
    
    // Model management buttons
    this.elements.btnSave.addEventListener('click', () => this.onSaveModel());
    this.elements.btnLoad.addEventListener('click', () => this.onLoadModel());
  }

  /**
   * Set up callbacks with the training orchestrator
   */
  setupOrchestatorCallbacks() {
    // Listen for episode completion
    this.orchestrator.onEpisodeComplete((stats) => {
      this.updateStatsPanel(stats);
      this.updateCharts(stats);
      
      // Show visual feedback based on episode outcome
      if (stats.lastEpisodeSuccess) {
        this.showEpisodeSuccess();
      } else if (stats.lastEpisodeFailed) {
        this.showEpisodeFailure();
      }
    });

    // Listen for training completion
    this.orchestrator.onTrainingComplete((stats) => {
      this.showTrainingStatus('Completed');
      this.showNotification('Training completed!', 'success');
      this.setTrainingState(false);
    });
  }

  /**
   * Handle start training button click
   */
  async onStartTraining() {
    try {
      this.setTrainingState(true);
      this.showTrainingStatus('Training');
      this.showNotification('Starting training...', 'success');
      
      // Start training with default number of episodes
      await this.orchestrator.startTraining(1000);
      
    } catch (error) {
      console.error('Error starting training:', error);
      this.showNotification('Error starting training: ' + error.message, 'error');
      this.setTrainingState(false);
    }
  }

  /**
   * Handle stop training button click
   */
  onStopTraining() {
    try {
      this.orchestrator.stopTraining();
      this.showTrainingStatus('Stopped');
      this.showNotification('Training stopped', 'success');
      this.setTrainingState(false);
      
    } catch (error) {
      console.error('Error stopping training:', error);
      this.showNotification('Error stopping training: ' + error.message, 'error');
    }
  }

  /**
   * Handle save model button click
   */
  async onSaveModel() {
    try {
      this.showNotification('Saving model...', 'success');
      await this.agent.saveModel('localstorage://climbing-model');
      this.showNotification('Model saved successfully!', 'success');
      
    } catch (error) {
      console.error('Error saving model:', error);
      this.showNotification('Error saving model: ' + error.message, 'error');
    }
  }

  /**
   * Handle load model button click
   */
  async onLoadModel() {
    try {
      this.showNotification('Loading model...', 'success');
      await this.agent.loadModel('localstorage://climbing-model');
      this.showNotification('Model loaded successfully!', 'success');
      
    } catch (error) {
      console.error('Error loading model:', error);
      this.showNotification('Error loading model: ' + error.message, 'error');
    }
  }

  /**
   * Update button states based on training status
   */
  setTrainingState(isTraining) {
    this.isTraining = isTraining;
    
    // Update button states
    this.elements.btnStart.disabled = isTraining;
    this.elements.btnStop.disabled = !isTraining;
    
    // Model buttons should be disabled during training
    this.elements.btnSave.disabled = isTraining;
    this.elements.btnLoad.disabled = isTraining;
  }

  /**
   * Update the statistics panel with current training stats
   * Formats numbers with appropriate precision (2 decimal places)
   */
  updateStatsPanel(stats) {
    // Update episode number display from stats.currentEpisode
    if (this.elements.statEpisode) {
      this.elements.statEpisode.textContent = stats.currentEpisode || 0;
    }
    
    // Update current reward display from stats.avgReward
    if (this.elements.statReward) {
      const avgReward = stats.avgReward || 0;
      this.elements.statReward.textContent = avgReward.toFixed(2);
    }
    
    // Update success rate display from stats.successRate
    if (this.elements.statSuccess) {
      const successRate = stats.successRate || 0;
      this.elements.statSuccess.textContent = (successRate * 100).toFixed(2) + '%';
    }

    // Update additional stats if available
    if (stats.totalReward !== undefined && this.elements.statTotalReward) {
      this.elements.statTotalReward.textContent = stats.totalReward.toFixed(2);
    }

    if (stats.episodeSteps !== undefined && this.elements.statSteps) {
      this.elements.statSteps.textContent = stats.episodeSteps;
    }

    // Log stats update for debugging
    console.log('Stats updated:', {
      episode: stats.currentEpisode,
      avgReward: stats.avgReward?.toFixed(2),
      successRate: (stats.successRate * 100)?.toFixed(2) + '%'
    });
  }

  /**
   * Update charts with new data
   */
  updateCharts(stats) {
    if (stats.rewardHistory && this.rewardChart) {
      this.updateRewardChart(stats.rewardHistory);
    }
    
    if (stats.successHistory && this.successChart) {
      this.updateSuccessChart(stats.successHistory);
    }
  }

  /**
   * Show training status in the UI
   */
  showTrainingStatus(status) {
    if (this.elements.statStatus) {
      this.elements.statStatus.textContent = status;
    }
  }

  /**
   * Show a notification message to the user with auto-dismiss after 3 seconds
   */
  showNotification(message, type = 'success') {
    const notification = this.elements.notification;
    if (!notification) return;

    // Set message and type
    notification.textContent = message;
    notification.className = type;
    
    // Show notification
    notification.style.display = 'block';
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  /**
   * Show visual feedback when episode completes successfully (green flash)
   */
  showEpisodeSuccess() {
    const canvas = document.getElementById('canvas-container');
    if (!canvas) return;

    // Create green flash overlay
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '5';
    flash.style.opacity = '0';
    flash.style.transition = 'opacity 0.2s ease-in-out';

    document.body.appendChild(flash);

    // Animate flash
    requestAnimationFrame(() => {
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(flash);
        }, 200);
      }, 200);
    });
  }

  /**
   * Show visual feedback when episode fails (red flash)
   */
  showEpisodeFailure() {
    const canvas = document.getElementById('canvas-container');
    if (!canvas) return;

    // Create red flash overlay
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '5';
    flash.style.opacity = '0';
    flash.style.transition = 'opacity 0.2s ease-in-out';

    document.body.appendChild(flash);

    // Animate flash
    requestAnimationFrame(() => {
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(flash);
        }, 200);
      }, 200);
    });
  }

  /**
   * Initialize Chart.js charts with dark theme configuration
   */
  async initializeCharts() {
    // Import Chart.js dynamically
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    // Configure Chart.js defaults for dark theme
    Chart.defaults.color = '#ffffff';
    Chart.defaults.borderColor = '#333333';
    Chart.defaults.backgroundColor = 'rgba(0, 255, 0, 0.1)';

    // Initialize reward history chart
    this.rewardChart = new Chart(this.elements.rewardChart, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Episode Reward',
          data: [],
          borderColor: '#00ff00',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Reward History',
            color: '#ffffff'
          },
          legend: {
            labels: {
              color: '#ffffff'
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Episode',
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: '#333333'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Reward',
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: '#333333'
            }
          }
        },
        animation: {
          duration: 0 // Disable animations for performance
        }
      }
    });

    // Initialize success rate chart
    this.successChart = new Chart(this.elements.successChart, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Success Rate',
          data: [],
          borderColor: '#0099ff',
          backgroundColor: 'rgba(0, 153, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Success Rate Trends',
            color: '#ffffff'
          },
          legend: {
            labels: {
              color: '#ffffff'
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Episode',
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: '#333333'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Success Rate (%)',
              color: '#ffffff'
            },
            min: 0,
            max: 100,
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: '#333333'
            }
          }
        },
        animation: {
          duration: 0 // Disable animations for performance
        }
      }
    });

    console.log('Charts initialized successfully');
  }

  /**
   * Update reward chart with new data points
   * Limits chart data to last N episodes for performance
   */
  updateRewardChart(rewardHistory) {
    if (!this.rewardChart || !rewardHistory) return;

    const maxDataPoints = 100; // Limit to last 100 episodes for performance
    const startIndex = Math.max(0, rewardHistory.length - maxDataPoints);
    const recentRewards = rewardHistory.slice(startIndex);
    
    // Generate episode labels
    const labels = recentRewards.map((_, index) => startIndex + index + 1);
    
    // Update chart data
    this.rewardChart.data.labels = labels;
    this.rewardChart.data.datasets[0].data = recentRewards;
    
    // Update the chart
    this.rewardChart.update('none'); // 'none' mode for better performance
  }

  /**
   * Update success rate chart with new data points
   * Calculates rolling success rate over recent episodes
   */
  updateSuccessChart(successHistory) {
    if (!this.successChart || !successHistory) return;

    const maxDataPoints = 100; // Limit to last 100 episodes for performance
    const windowSize = 10; // Calculate success rate over last 10 episodes
    
    const startIndex = Math.max(0, successHistory.length - maxDataPoints);
    const recentSuccess = successHistory.slice(startIndex);
    
    // Calculate rolling success rate
    const successRates = [];
    const labels = [];
    
    for (let i = windowSize - 1; i < recentSuccess.length; i++) {
      const window = recentSuccess.slice(i - windowSize + 1, i + 1);
      const successCount = window.filter(success => success).length;
      const successRate = (successCount / windowSize) * 100;
      
      successRates.push(successRate);
      labels.push(startIndex + i + 1);
    }
    
    // Update chart data
    this.successChart.data.labels = labels;
    this.successChart.data.datasets[0].data = successRates;
    
    // Update the chart
    this.successChart.update('none'); // 'none' mode for better performance
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Remove event listeners if needed
    if (this.rewardChart) {
      this.rewardChart.destroy();
    }
    if (this.successChart) {
      this.successChart.destroy();
    }
    console.log('UIController disposed');
  }
}