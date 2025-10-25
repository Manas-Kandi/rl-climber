import * as THREE from 'three';

/**
 * SceneBuilder constructs physics and visual elements for scenes
 */
export class SceneBuilder {
    constructor(physicsEngine, renderingEngine) {
        this.physicsEngine = physicsEngine;
        this.renderingEngine = renderingEngine;
        this.sceneObjects = [];
    }
    
    /**
     * Build a scene from configuration
     * @param {Object} sceneConfig - Scene configuration from SceneManager
     */
    buildScene(sceneConfig) {
        console.log('🏗️ Building scene:', sceneConfig.name);
        
        // Clear previous scene
        this.clearScene();
        
        // Build each obstacle
        sceneConfig.obstacles.forEach(obstacle => {
            this.buildObstacle(obstacle);
        });
        
        // Update agent start position if specified
        if (sceneConfig.agentStart && this.renderingEngine.agentMesh) {
            this.renderingEngine.agentMesh.position.set(
                sceneConfig.agentStart.x,
                sceneConfig.agentStart.y,
                sceneConfig.agentStart.z
            );
        }
        
        console.log('✅ Scene built with', sceneConfig.obstacles.length, 'obstacles');
    }
    
    /**
     * Build a single obstacle (physics + visual)
     * @param {Object} obstacle - Obstacle configuration
     */
    buildObstacle(obstacle) {
        const { type, position, size, color, id } = obstacle;
        
        // Create physics body
        let physicsBody;
        if (type === 'step' || type === 'ledge' || type === 'goal') {
            physicsBody = this.physicsEngine.createLedgeBody(
                position,
                size,
                id
            );
        }
        
        // Create visual mesh
        let mesh;
        if (type === 'step') {
            mesh = this.createStepMesh(position, size, color);
        } else if (type === 'ledge') {
            mesh = this.createLedgeMesh(position, size, color);
        } else if (type === 'goal') {
            mesh = this.createGoalMesh(position, size, color);
        }
        
        // Track for cleanup
        this.sceneObjects.push({
            id,
            physicsBody,
            mesh,
            obstacle
        });
    }
    
    /**
     * Create a step mesh (box)
     */
    createStepMesh(position, size, color) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.renderingEngine.scene.add(mesh);
        return mesh;
    }
    
    /**
     * Create a ledge mesh (thin box)
     */
    createLedgeMesh(position, size, color) {
        return this.createStepMesh(position, size, color);
    }
    
    /**
     * Create a goal mesh (glowing platform)
     */
    createGoalMesh(position, size, color) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshLambertMaterial({ 
            color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(position.x, position.y, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        this.renderingEngine.scene.add(mesh);
        return mesh;
    }
    
    /**
     * Clear all scene objects
     */
    clearScene() {
        console.log('🧹 Clearing scene objects...');
        
        this.sceneObjects.forEach(obj => {
            // Remove physics body
            if (obj.physicsBody && this.physicsEngine.removeBody) {
                this.physicsEngine.removeBody(obj.id);
            }
            
            // Remove mesh
            if (obj.mesh && this.renderingEngine.scene) {
                this.renderingEngine.scene.remove(obj.mesh);
                if (obj.mesh.geometry) obj.mesh.geometry.dispose();
                if (obj.mesh.material) obj.mesh.material.dispose();
            }
        });
        
        this.sceneObjects = [];
        console.log('✅ Scene cleared');
    }
    
    /**
     * Get scene objects
     */
    getSceneObjects() {
        return this.sceneObjects;
    }
}
