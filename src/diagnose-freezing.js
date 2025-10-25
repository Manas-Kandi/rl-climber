/**
 * Comprehensive diagnostic script to identify freezing issues
 * in the 3D RL Climbing Game
 */

console.log('🔍 Starting comprehensive freezing diagnosis...');

// Global diagnostic state
const diagnostics = {
    startTime: Date.now(),
    physicsSteps: 0,
    renderFrames: 0,
    agentActions: 0,
    lastAgentPosition: null,
    positionHistory: [],
    velocityHistory: [],
    actionHistory: [],
    freezeDetected: false,
    freezeStartTime: null,
    lastMovementTime: Date.now(),
    
    // Thresholds for freeze detection
    MOVEMENT_THRESHOLD: 0.01,  // Minimum movement to consider "not frozen"
    FREEZE_TIMEOUT: 2000,      // 2 seconds without movement = frozen
    VELOCITY_THRESHOLD: 0.05,  // Minimum velocity to consider "moving"
};

/**
 * Monitor agent position and detect freezing
 */
function monitorAgentMovement() {
    const app = window.climbingGame;
    if (!app || !app.physicsEngine) return;
    
    const agentBody = app.physicsEngine.getBody('agent');
    if (!agentBody) return;
    
    const currentPos = app.physicsEngine.getBodyPosition(agentBody);
    const currentVel = app.physicsEngine.getBodyVelocity(agentBody);
    const currentTime = Date.now();
    
    // Store position and velocity history
    diagnostics.positionHistory.push({
        time: currentTime,
        position: { ...currentPos },
        velocity: { ...currentVel }
    });
    
    // Keep only last 100 entries
    if (diagnostics.positionHistory.length > 100) {
        diagnostics.positionHistory.shift();
    }
    
    // Check for movement
    if (diagnostics.lastAgentPosition) {
        const deltaX = Math.abs(currentPos.x - diagnostics.lastAgentPosition.x);
        const deltaY = Math.abs(currentPos.y - diagnostics.lastAgentPosition.y);
        const deltaZ = Math.abs(currentPos.z - diagnostics.lastAgentPosition.z);
        const totalMovement = deltaX + deltaY + deltaZ;
        
        const velocityMagnitude = Math.sqrt(
            currentVel.x * currentVel.x + 
            currentVel.y * currentVel.y + 
            currentVel.z * currentVel.z
        );
        
        // Check if agent is moving
        const isMoving = totalMovement > diagnostics.MOVEMENT_THRESHOLD || 
                        velocityMagnitude > diagnostics.VELOCITY_THRESHOLD;
        
        if (isMoving) {
            diagnostics.lastMovementTime = currentTime;
            if (diagnostics.freezeDetected) {
                console.log('✅ Agent movement resumed!');
                diagnostics.freezeDetected = false;
                diagnostics.freezeStartTime = null;
            }
        } else {
            // Check for freeze
            const timeSinceMovement = currentTime - diagnostics.lastMovementTime;
            if (timeSinceMovement > diagnostics.FREEZE_TIMEOUT && !diagnostics.freezeDetected) {
                console.error('🚨 FREEZE DETECTED!');
                console.log('📊 Freeze Analysis:');
                console.log('  Time since last movement:', timeSinceMovement, 'ms');
                console.log('  Current position:', currentPos);
                console.log('  Current velocity:', currentVel);
                console.log('  Velocity magnitude:', velocityMagnitude);
                console.log('  Total movement:', totalMovement);
                
                diagnostics.freezeDetected = true;
                diagnostics.freezeStartTime = currentTime;
                
                // Analyze recent history
                analyzeRecentHistory();
                
                // Attempt to diagnose the cause
                diagnoseFreezeReason();
            }
        }
    }
    
    diagnostics.lastAgentPosition = { ...currentPos };
}

/**
 * Analyze recent position and velocity history
 */
function analyzeRecentHistory() {
    console.log('📈 Analyzing recent movement history...');
    
    const recent = diagnostics.positionHistory.slice(-20); // Last 20 entries
    
    if (recent.length < 2) {
        console.log('⚠️ Insufficient history data');
        return;
    }
    
    // Calculate movement patterns
    let totalMovement = 0;
    let maxVelocity = 0;
    let avgVelocity = 0;
    let velocitySum = 0;
    
    for (let i = 1; i < recent.length; i++) {
        const prev = recent[i - 1];
        const curr = recent[i];
        
        // Calculate movement
        const deltaX = Math.abs(curr.position.x - prev.position.x);
        const deltaY = Math.abs(curr.position.y - prev.position.y);
        const deltaZ = Math.abs(curr.position.z - prev.position.z);
        totalMovement += deltaX + deltaY + deltaZ;
        
        // Calculate velocity magnitude
        const velMag = Math.sqrt(
            curr.velocity.x * curr.velocity.x +
            curr.velocity.y * curr.velocity.y +
            curr.velocity.z * curr.velocity.z
        );
        
        velocitySum += velMag;
        maxVelocity = Math.max(maxVelocity, velMag);
    }
    
    avgVelocity = velocitySum / (recent.length - 1);
    
    console.log('📊 Movement Analysis:');
    console.log('  Total movement in last 20 frames:', totalMovement.toFixed(4));
    console.log('  Average velocity:', avgVelocity.toFixed(4));
    console.log('  Max velocity:', maxVelocity.toFixed(4));
    console.log('  Movement per frame:', (totalMovement / (recent.length - 1)).toFixed(6));
    
    // Check for patterns
    if (totalMovement < 0.001) {
        console.log('🔍 Pattern: Complete stillness detected');
    } else if (avgVelocity < 0.01) {
        console.log('🔍 Pattern: Very low velocity detected');
    }
}

/**
 * Diagnose potential reasons for freezing
 */
function diagnoseFreezeReason() {
    console.log('🔍 Diagnosing freeze reason...');
    
    const app = window.climbingGame;
    if (!app) return;
    
    // Check physics engine state
    if (app.physicsEngine) {
        const agentBody = app.physicsEngine.getBody('agent');
        if (agentBody) {
            console.log('⚙️ Physics Engine State:');
            console.log('  Agent mass:', agentBody.mass);
            console.log('  Linear damping:', agentBody.linearDamping);
            console.log('  Angular damping:', agentBody.angularDamping);
            console.log('  Sleep state:', agentBody.sleepState);
            console.log('  Allow sleep:', agentBody.allowSleep);
            
            // Check if body is sleeping
            if (agentBody.sleepState !== 0) {
                console.log('💤 POTENTIAL CAUSE: Agent body is in sleep state!');
                console.log('  Sleep state:', agentBody.sleepState);
                console.log('  Attempting to wake up body...');
                agentBody.wakeUp();
            }
            
            // Check collision state
            const collidingBodies = app.physicsEngine.getCollidingBodies(agentBody);
            console.log('  Colliding with:', collidingBodies.length, 'bodies');
            
            if (collidingBodies.length > 0) {
                collidingBodies.forEach((body, index) => {
                    console.log(`    Body ${index}:`, body.position);
                });
            }
        }
    }
    
    // Check environment state
    if (app.environment) {
        console.log('🏔️ Environment State:');
        console.log('  Current step:', app.environment.currentStep);
        console.log('  Can jump:', app.environment.canJump);
        console.log('  Jump cooldown:', app.environment.jumpCooldown);
        console.log('  Is grounded:', app.environment.isGrounded());
        console.log('  Is out of bounds:', app.environment.isOutOfBounds());
        
        // Check if agent is stuck in a state
        const currentStepOn = app.environment.detectCurrentStep();
        console.log('  Current step detected:', currentStepOn);
    }
    
    // Check recent actions
    if (diagnostics.actionHistory.length > 0) {
        console.log('🎮 Recent Actions:');
        const recentActions = diagnostics.actionHistory.slice(-10);
        recentActions.forEach((action, index) => {
            console.log(`  ${index}: ${action.name} (${action.time}ms ago)`);
        });
        
        // Check for repeated actions
        const lastAction = recentActions[recentActions.length - 1];
        const sameActionCount = recentActions.filter(a => a.action === lastAction.action).length;
        if (sameActionCount > 5) {
            console.log('🔄 POTENTIAL CAUSE: Repeated action detected!');
            console.log('  Action:', lastAction.name, 'repeated', sameActionCount, 'times');
        }
    }
    
    // Suggest fixes
    suggestFixes();
}

/**
 * Suggest potential fixes for the freezing issue
 */
function suggestFixes() {
    console.log('💡 Suggested Fixes:');
    
    const app = window.climbingGame;
    if (!app) return;
    
    const fixes = [];
    
    // Check for physics issues
    const agentBody = app.physicsEngine?.getBody('agent');
    if (agentBody) {
        if (agentBody.sleepState !== 0) {
            fixes.push({
                issue: 'Agent body is sleeping',
                fix: 'Wake up the physics body',
                action: () => {
                    agentBody.wakeUp();
                    console.log('✅ Woke up agent body');
                }
            });
        }
        
        if (agentBody.linearDamping > 0.5) {
            fixes.push({
                issue: 'High linear damping',
                fix: 'Reduce linear damping',
                action: () => {
                    agentBody.linearDamping = 0.1;
                    console.log('✅ Reduced linear damping to 0.1');
                }
            });
        }
        
        const vel = app.physicsEngine.getBodyVelocity(agentBody);
        const velMag = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        if (velMag < 0.001) {
            fixes.push({
                issue: 'Zero velocity',
                fix: 'Apply small impulse to break stillness',
                action: () => {
                    app.physicsEngine.applyImpulse(agentBody, { x: 0, y: 0.1, z: 0 });
                    console.log('✅ Applied small upward impulse');
                }
            });
        }
    }
    
    // Check for environment issues
    if (app.environment) {
        if (app.environment.jumpCooldown > 0) {
            fixes.push({
                issue: 'Jump cooldown active',
                fix: 'Reset jump cooldown',
                action: () => {
                    app.environment.jumpCooldown = 0;
                    console.log('✅ Reset jump cooldown');
                }
            });
        }
    }
    
    // Display and apply fixes
    fixes.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix.issue} → ${fix.fix}`);
    });
    
    if (fixes.length > 0) {
        console.log('🔧 Applying automatic fixes...');
        fixes.forEach(fix => fix.action());
    } else {
        console.log('❓ No obvious fixes found. Manual intervention may be required.');
    }
}

/**
 * Monitor action execution
 */
function monitorActions() {
    const app = window.climbingGame;
    if (!app || !app.environment) return;
    
    // Intercept environment step function
    const originalStep = app.environment.step.bind(app.environment);
    app.environment.step = function(action) {
        const actionNames = ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'JUMP', 'GRAB'];
        const actionName = actionNames[action] || 'UNKNOWN';
        
        // Record action
        diagnostics.actionHistory.push({
            action: action,
            name: actionName,
            time: Date.now() - diagnostics.startTime
        });
        
        // Keep only last 50 actions
        if (diagnostics.actionHistory.length > 50) {
            diagnostics.actionHistory.shift();
        }
        
        diagnostics.agentActions++;
        
        // Call original step function
        const result = originalStep(action);
        
        // Log action details if freeze is detected
        if (diagnostics.freezeDetected) {
            console.log(`🎮 Action during freeze: ${actionName} (${action})`);
            console.log('  Result:', result);
        }
        
        return result;
    };
}

/**
 * Monitor physics steps
 */
function monitorPhysics() {
    const app = window.climbingGame;
    if (!app || !app.physicsEngine) return;
    
    // Intercept physics step function
    const originalStep = app.physicsEngine.step.bind(app.physicsEngine);
    app.physicsEngine.step = function(deltaTime) {
        diagnostics.physicsSteps++;
        
        // Call original step function
        const result = originalStep(deltaTime);
        
        // Monitor agent movement after each physics step
        monitorAgentMovement();
        
        return result;
    };
}

/**
 * Monitor rendering frames
 */
function monitorRendering() {
    const app = window.climbingGame;
    if (!app || !app.renderingEngine) return;
    
    // Intercept render function
    const originalRender = app.renderingEngine.render.bind(app.renderingEngine);
    app.renderingEngine.render = function() {
        diagnostics.renderFrames++;
        
        // Call original render function
        return originalRender();
    };
}

/**
 * Start comprehensive monitoring
 */
function startMonitoring() {
    console.log('🔍 Starting freeze monitoring...');
    
    // Wait for app to be ready
    const checkApp = () => {
        const app = window.climbingGame;
        if (app && app.isInitialized) {
            console.log('✅ App detected, setting up monitors...');
            
            monitorActions();
            monitorPhysics();
            monitorRendering();
            
            // Start periodic reporting
            setInterval(reportDiagnostics, 5000); // Every 5 seconds
            
            console.log('🔍 Freeze monitoring active!');
        } else {
            setTimeout(checkApp, 1000);
        }
    };
    
    checkApp();
}

/**
 * Report diagnostic statistics
 */
function reportDiagnostics() {
    const runtime = Date.now() - diagnostics.startTime;
    const runtimeSec = runtime / 1000;
    
    console.log('📊 Diagnostic Report:');
    console.log(`  Runtime: ${runtimeSec.toFixed(1)}s`);
    console.log(`  Physics steps: ${diagnostics.physicsSteps} (${(diagnostics.physicsSteps / runtimeSec).toFixed(1)}/s)`);
    console.log(`  Render frames: ${diagnostics.renderFrames} (${(diagnostics.renderFrames / runtimeSec).toFixed(1)}/s)`);
    console.log(`  Agent actions: ${diagnostics.agentActions} (${(diagnostics.agentActions / runtimeSec).toFixed(1)}/s)`);
    console.log(`  Freeze detected: ${diagnostics.freezeDetected}`);
    
    if (diagnostics.freezeDetected) {
        const freezeDuration = Date.now() - diagnostics.freezeStartTime;
        console.log(`  Freeze duration: ${freezeDuration}ms`);
    }
    
    // Check for performance issues
    const expectedPhysicsRate = 60; // 60 FPS
    const actualPhysicsRate = diagnostics.physicsSteps / runtimeSec;
    
    if (actualPhysicsRate < expectedPhysicsRate * 0.8) {
        console.warn(`⚠️ Low physics rate: ${actualPhysicsRate.toFixed(1)}/s (expected ~${expectedPhysicsRate}/s)`);
    }
}

/**
 * Manual freeze test - apply various actions and monitor response
 */
function testFreeze() {
    console.log('🧪 Running manual freeze test...');
    
    const app = window.climbingGame;
    if (!app || !app.environment) {
        console.error('❌ App not ready for testing');
        return;
    }
    
    const testActions = [0, 1, 2, 3, 4, 5]; // All possible actions
    let testIndex = 0;
    
    const runTest = () => {
        if (testIndex >= testActions.length) {
            console.log('✅ Freeze test complete');
            return;
        }
        
        const action = testActions[testIndex];
        const actionNames = ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'JUMP', 'GRAB'];
        
        console.log(`🧪 Testing action: ${actionNames[action]} (${action})`);
        
        // Record position before action
        const agentBody = app.physicsEngine.getBody('agent');
        const posBefore = app.physicsEngine.getBodyPosition(agentBody);
        const velBefore = app.physicsEngine.getBodyVelocity(agentBody);
        
        // Execute action
        app.environment.step(action);
        
        // Wait a moment and check result
        setTimeout(() => {
            const posAfter = app.physicsEngine.getBodyPosition(agentBody);
            const velAfter = app.physicsEngine.getBodyVelocity(agentBody);
            
            const deltaPos = Math.sqrt(
                Math.pow(posAfter.x - posBefore.x, 2) +
                Math.pow(posAfter.y - posBefore.y, 2) +
                Math.pow(posAfter.z - posBefore.z, 2)
            );
            
            const velMag = Math.sqrt(
                velAfter.x * velAfter.x +
                velAfter.y * velAfter.y +
                velAfter.z * velAfter.z
            );
            
            console.log(`  Position change: ${deltaPos.toFixed(4)}`);
            console.log(`  Final velocity magnitude: ${velMag.toFixed(4)}`);
            
            if (deltaPos < 0.001 && velMag < 0.001) {
                console.warn(`⚠️ Minimal response to ${actionNames[action]} action!`);
            }
            
            testIndex++;
            setTimeout(runTest, 1000); // Wait 1 second between tests
        }, 500); // Wait 500ms for action to take effect
    };
    
    runTest();
}

// Export functions for manual use
window.freezeDiagnostics = {
    start: startMonitoring,
    test: testFreeze,
    report: reportDiagnostics,
    suggest: suggestFixes,
    data: diagnostics
};

// Auto-start monitoring
startMonitoring();

console.log('🔍 Freeze diagnostics loaded! Use window.freezeDiagnostics for manual control.');