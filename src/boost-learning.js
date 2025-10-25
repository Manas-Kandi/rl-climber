/**
 * Boost Learning Script
 * Increases learning rate and enables curriculum learning WITHOUT resetting the model
 * Run this to help a stuck agent start learning faster
 */

import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { RenderingEngine } from './rendering/RenderingEngine.js';
import { ClimbingEnvironment } from './rl/ClimbingEnvironment.js';
import { PPOAgent } from './rl/PPOAgent.js';
import { TrainingOrchestrator } from './training/TrainingOrchestrator.js';
import { ModelManager } from './training/ModelManager.js';
import { UIController } from './ui/UIController.js';

console.log('🚀 BOOST LEARNING MODE\n');
console.log('This will:');
console.log('  ✅ Load your existing model (no reset!)');
console.log('  ✅ Increase learning rate 10x (0.0003 → 0.003)');
console.log('  ✅ Increase exploration 5x (entropy 0.01 → 0.05)');
console.log('  ✅ Enable curriculum learning (easier goals first)');
console.log('  ✅ Train with boosted settings\n');

// Initialize engines
const physicsEngine = new PhysicsEngine();
const renderingEngine = new RenderingEngine('renderCanvas');

// Initialize environment
const environment = new ClimbingEnvironment(physicsEngine, renderingEngine);

// Initialize agent with BOOSTED hyperparameters
const agent = new PPOAgent(9, 6, {
    learningRate: 0.003,    // 10x faster
    entropyCoef: 0.05,      // 5x more exploration
    clipEpsilon: 0.3,       // Larger updates
    epochs: 20              // More learning per episode
});

// Initialize training orchestrator
const orchestrator = new TrainingOrchestrator(environment, agent, {
    numEpisodes: 1000,
    autoSaveInterval: 10
});

// Initialize model manager
const modelManager = new ModelManager(agent, 'climbing-model');
orchestrator.setModelManager(modelManager);

// Initialize UI
const uiController = new UIController(orchestrator, environment, renderingEngine);

// Try to load existing model
console.log('📂 Loading existing model...');
try {
    await modelManager.loadModel();
    console.log('✅ Model loaded successfully!');
    console.log('   Your training progress is preserved!\n');
} catch (error) {
    console.log('⚠️ No existing model found, starting fresh');
    console.log('   (This is fine for first run)\n');
}

// Display current hyperparameters
console.log('🔧 Current Hyperparameters:');
const params = agent.getHyperparameters();
Object.entries(params).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
});
console.log('');

// Enable curriculum learning - Level 1 (easiest)
console.log('🎓 Enabling Curriculum Learning...');
environment.enableCurriculumLearning(1);
console.log('   Goal: Just reach Step 0');
console.log('   Max steps: 200 (faster episodes = more learning)\n');

// Add progress monitoring
let episodeCount = 0;
let successCount = 0;
let recentHighestSteps = [];

orchestrator.onEpisodeComplete((stats, episodeResult) => {
    episodeCount++;
    if (episodeResult.success) successCount++;
    
    recentHighestSteps.push(episodeResult.highestStep);
    if (recentHighestSteps.length > 20) recentHighestSteps.shift();
    
    // Log every 10 episodes
    if (episodeCount % 10 === 0) {
        const avgHighest = recentHighestSteps.reduce((a, b) => a + b, 0) / recentHighestSteps.length;
        const successRate = (successCount / episodeCount * 100).toFixed(1);
        
        console.log(`📊 Episode ${episodeCount}:`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Avg Highest Step (last 20): ${avgHighest.toFixed(1)}`);
        console.log(`   Latest Reward: ${episodeResult.episodeReward.toFixed(1)}`);
        
        // Auto-advance curriculum if doing well
        if (episodeCount >= 50 && successRate > 30) {
            const currStatus = environment.getCurriculumStatus();
            if (currStatus.level < 4) {
                console.log(`\n🎓 ADVANCING CURRICULUM! Level ${currStatus.level} → ${currStatus.level + 1}\n`);
                environment.enableCurriculumLearning(currStatus.level + 1);
                successCount = 0; // Reset for new level
                episodeCount = 0;
            }
        }
        
        // If still stuck after 50 episodes, boost even more
        if (episodeCount === 50 && avgHighest < 0) {
            console.log('\n⚠️ Still stuck! EMERGENCY BOOST!\n');
            agent.updateHyperparameters({
                learningRate: 0.01,  // 33x original!
                entropyCoef: 0.1     // 10x original!
            });
        }
    }
});

// Start training
console.log('🎬 Starting boosted training...\n');
console.log('Watch for:');
console.log('  🎯 "NEW STEP" messages (agent reaching stairs)');
console.log('  📊 Progress reports every 10 episodes');
console.log('  🎓 Automatic curriculum advancement\n');

await orchestrator.startTraining(200); // Train for 200 episodes

console.log('\n✅ Boosted training complete!');
console.log('   Model saved with improvements');
console.log('   You can continue training or test the agent\n');
