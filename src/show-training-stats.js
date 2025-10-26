/**
 * Display comprehensive training statistics
 * Run this in the browser console: showTrainingStats()
 */

function showTrainingStats() {
    const app = window.climbingGame;
    
    if (!app || !app.modelManager) {
        console.error('❌ App or ModelManager not available');
        return;
    }
    
    const metadata = app.modelManager.getMetadata();
    
    console.clear();
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                  🎮 TRAINING STATISTICS                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n');
    
    // Model Information
    console.log('📦 MODEL INFORMATION');
    console.log('─'.repeat(65));
    console.log(`   Version:              v${metadata.version}`);
    console.log(`   Total Episodes:       ${metadata.totalEpisodes.toLocaleString()}`);
    console.log(`   Total Steps:          ${metadata.totalSteps.toLocaleString()}`);
    console.log(`   Last Saved:           ${metadata.lastSaved ? new Date(metadata.lastSaved).toLocaleString() : 'Never'}`);
    console.log('\n');
    
    // Performance Metrics
    console.log('📈 PERFORMANCE METRICS');
    console.log('─'.repeat(65));
    console.log(`   Best Reward:          ${metadata.bestReward === -Infinity ? 'N/A' : metadata.bestReward.toFixed(2)}`);
    console.log(`   Current Avg Reward:   ${metadata.avgReward.toFixed(2)}`);
    console.log(`   Success Rate:         ${(metadata.successRate * 100).toFixed(1)}%`);
    console.log('\n');
    
    // Training History
    if (metadata.trainingHistory && metadata.trainingHistory.length > 0) {
        console.log('📚 TRAINING HISTORY');
        console.log('─'.repeat(65));
        console.log(`   Total Checkpoints:    ${metadata.trainingHistory.length}`);
        console.log('\n');
        
        // Show last 10 checkpoints
        console.log('   Recent Progress (Last 10 Checkpoints):');
        console.log('   ┌─────┬─────────┬──────────┬──────────┬──────────┐');
        console.log('   │  #  │ Version │ Episodes │ Avg Rwd  │ Success  │');
        console.log('   ├─────┼─────────┼──────────┼──────────┼──────────┤');
        
        const recent = metadata.trainingHistory.slice(-10);
        recent.forEach((entry, idx) => {
            const num = String(idx + 1).padStart(3);
            const ver = String(entry.version).padStart(7);
            const eps = String(entry.episodes).padStart(8);
            const rwd = String(entry.avgReward.toFixed(2)).padStart(8);
            const suc = String((entry.successRate * 100).toFixed(1) + '%').padStart(8);
            console.log(`   │ ${num} │ ${ver} │ ${eps} │ ${rwd} │ ${suc} │`);
        });
        
        console.log('   └─────┴─────────┴──────────┴──────────┴──────────┘');
        console.log('\n');
        
        // Progress Analysis
        if (recent.length >= 2) {
            const first = recent[0];
            const last = recent[recent.length - 1];
            const rewardChange = last.avgReward - first.avgReward;
            const successChange = (last.successRate - first.successRate) * 100;
            
            console.log('📊 PROGRESS ANALYSIS (Recent Checkpoints)');
            console.log('─'.repeat(65));
            console.log(`   Reward Change:        ${rewardChange >= 0 ? '+' : ''}${rewardChange.toFixed(2)} ${rewardChange >= 0 ? '📈' : '📉'}`);
            console.log(`   Success Rate Change:  ${successChange >= 0 ? '+' : ''}${successChange.toFixed(1)}% ${successChange >= 0 ? '📈' : '📉'}`);
            console.log('\n');
        }
    }
    
    // Training Recommendations
    console.log('💡 RECOMMENDATIONS');
    console.log('─'.repeat(65));
    
    if (metadata.totalEpisodes < 1000) {
        console.log('   • Early training phase - keep training!');
        console.log('   • Agent is still learning basic movement');
    } else if (metadata.totalEpisodes < 5000) {
        console.log('   • Mid training phase - progress should be visible');
        console.log('   • Agent should be reaching stairs consistently');
    } else if (metadata.totalEpisodes < 10000) {
        console.log('   • Late training phase - fine-tuning behavior');
        console.log('   • Agent should be climbing multiple steps');
    } else {
        console.log('   • Extensive training completed!');
        console.log('   • Agent should be performing well');
    }
    
    if (metadata.successRate < 0.2) {
        console.log('   ⚠️  Low success rate - consider:');
        console.log('      - Checking reward system');
        console.log('      - Increasing training episodes');
        console.log('      - Adjusting learning rate');
    } else if (metadata.successRate < 0.5) {
        console.log('   ✅ Moderate success rate - on track!');
    } else {
        console.log('   🎉 High success rate - excellent performance!');
    }
    
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  Run showTrainingStats() again to refresh statistics         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n');
}

// Export to window
window.showTrainingStats = showTrainingStats;

console.log('📊 Training stats viewer loaded! Run: showTrainingStats()');
