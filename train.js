#!/usr/bin/env node

/**
 * Terminal-based training script
 * Train RL agent without browser UI, save trajectories for later visualization
 * 
 * Usage:
 *   node train.js --episodes 1000 --agent PPO
 *   node train.js --episodes 500 --agent DQN --no-trajectories
 */

import { HeadlessTrainer } from './src/training/HeadlessTrainer.js';
import { program } from 'commander';

// Parse command line arguments
program
    .name('train')
    .description('Train RL climbing agent in headless mode')
    .option('-e, --episodes <number>', 'Number of episodes to train', '1000')
    .option('-a, --agent <type>', 'Agent type (PPO or DQN)', 'PPO')
    .option('--no-trajectories', 'Disable trajectory recording')
    .option('--save-interval <number>', 'Model save interval (episodes)', '10')
    .option('--log-interval <number>', 'Log interval (episodes)', '10')
    .option('--model-path <path>', 'Model storage path', './training-data/models')
    .option('--trajectory-path <path>', 'Trajectory storage path', './training-data/trajectories')
    .parse(process.argv);

const options = program.opts();

// Configuration
const config = {
    agentType: options.agent.toUpperCase(),
    numEpisodes: parseInt(options.episodes),
    recordTrajectories: options.trajectories !== false,
    saveInterval: parseInt(options.saveInterval),
    logInterval: parseInt(options.logInterval),
    modelStoragePath: options.modelPath,
    trajectoryStoragePath: options.trajectoryPath
};

// Validate agent type
if (config.agentType !== 'PPO' && config.agentType !== 'DQN') {
    console.error('❌ Invalid agent type. Must be PPO or DQN');
    process.exit(1);
}

// Main training function
async function main() {
    console.log('🎮 3D RL Climbing Game - Headless Training');
    console.log('═'.repeat(60));
    console.log('Configuration:');
    console.log(`  Agent: ${config.agentType}`);
    console.log(`  Episodes: ${config.numEpisodes}`);
    console.log(`  Record Trajectories: ${config.recordTrajectories}`);
    console.log(`  Save Interval: ${config.saveInterval} episodes`);
    console.log(`  Log Interval: ${config.logInterval} episodes`);
    console.log(`  Model Path: ${config.modelStoragePath}`);
    if (config.recordTrajectories) {
        console.log(`  Trajectory Path: ${config.trajectoryStoragePath}`);
    }
    console.log('═'.repeat(60));
    console.log('');
    
    // Create trainer
    const trainer = new HeadlessTrainer(config);
    
    try {
        // Initialize
        await trainer.init();
        
        // Start training
        await trainer.train();
        
        // Clean up
        trainer.dispose();
        
        console.log('\n✅ Training session complete!');
        console.log('');
        console.log('Next steps:');
        console.log('  1. Open the web UI');
        console.log('  2. Click "Visualize History"');
        console.log('  3. Scrub through the timeline to see agent progress');
        console.log('');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Training failed:', error);
        console.error(error.stack);
        
        trainer.dispose();
        process.exit(1);
    }
}

// Handle interrupts gracefully
process.on('SIGINT', () => {
    console.log('\n\n⚠️ Training interrupted by user');
    console.log('Saving progress...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n⚠️ Training terminated');
    console.log('Saving progress...');
    process.exit(0);
});

// Run
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
