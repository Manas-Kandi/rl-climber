import * as THREE from 'three';

/**
 * RenderingEngine handles all Three.js rendering operations for the 3D climbing game.
 * Manages scene, camera, renderer, lighting, and all 3D meshes.
 */
export class RenderingEngine {
  constructor(canvasElement) {
    this.canvasElement = canvasElement;
    
    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Lighting
    this.ambientLight = null;
    this.directionalLight = null;
    
    // Game objects
    this.agentMesh = null;
    this.groundMesh = null;
    this.wallGroup = null;
    this.goalMesh = null;
    
    // Camera following
    this.cameraTarget = new THREE.Vector3(0, 5, 10);
    this.cameraLerpSpeed = 0.05;
  }

  /**
   * Initialize the Three.js scene, camera, renderer, and lighting
   */
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Create perspective camera at position (0, 5, 10) looking at origin
    this.camera = new THREE.PerspectiveCamera(
      75, // field of view
      window.innerWidth / window.innerHeight, // aspect ratio
      0.1, // near clipping plane
      1000 // far clipping plane
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasElement,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add ambient lighting
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(this.ambientLight);

    // Add directional lighting
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 10, 5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    this.scene.add(this.directionalLight);

    console.log('RenderingEngine initialized successfully');
  }

  /**
   * Render the current frame
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Handle window resize events
   * @param {number} width - New window width
   * @param {number} height - New window height
   */
  resize(width, height) {
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  /**
   * Create dark gray ground plane mesh (#333333)
   * @param {number} width - Ground width (default: 20)
   * @param {number} depth - Ground depth (default: 20)
   * @returns {THREE.Mesh} Ground mesh
   */
  createGround(width = 20, depth = 20) {
    const geometry = new THREE.PlaneGeometry(width, depth);
    const material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    this.groundMesh = new THREE.Mesh(geometry, material);
    this.groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.groundMesh.position.y = 0;
    this.groundMesh.receiveShadow = true;
    
    this.scene.add(this.groundMesh);
    return this.groundMesh;
  }

  /**
   * Create climbing wall with brown ledges (#8B4513)
   * @param {Array} ledgePositions - Array of ledge configurations
   * @returns {THREE.Group} Wall group containing all ledges
   */
  createClimbingWall(ledgePositions = []) {
    this.wallGroup = new THREE.Group();
    
    // Default ledge positions if none provided
    if (ledgePositions.length === 0) {
      ledgePositions = [
        {position: {x: 0, y: 2, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: 1, y: 4, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: -1, y: 6, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: 0, y: 8, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: 1, y: 10, z: -5}, size: {x: 2, y: 0.2, z: 1}},
        {position: {x: 0, y: 12, z: -5}, size: {x: 2, y: 0.2, z: 1}}
      ];
    }

    // Create back wall
    const wallGeometry = new THREE.BoxGeometry(10, 15, 0.5);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(0, 7.5, -5.25);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    this.wallGroup.add(wallMesh);

    // Create ledges
    ledgePositions.forEach((ledgeConfig, index) => {
      const ledgeGeometry = new THREE.BoxGeometry(
        ledgeConfig.size.x,
        ledgeConfig.size.y,
        ledgeConfig.size.z
      );
      const ledgeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const ledgeMesh = new THREE.Mesh(ledgeGeometry, ledgeMaterial);
      
      ledgeMesh.position.set(
        ledgeConfig.position.x,
        ledgeConfig.position.y,
        ledgeConfig.position.z
      );
      ledgeMesh.castShadow = true;
      ledgeMesh.receiveShadow = true;
      ledgeMesh.userData = { type: 'ledge', index };
      
      this.wallGroup.add(ledgeMesh);
    });

    this.scene.add(this.wallGroup);
    return this.wallGroup;
  }

  /**
   * Create goal platform at the top
   * @param {Object} position - Goal position (default: {x: 0, y: 14, z: -4})
   * @returns {THREE.Mesh} Goal mesh
   */
  createGoal(position = {x: 0, y: 14, z: -4}) {
    const geometry = new THREE.BoxGeometry(3, 0.3, 2);
    const material = new THREE.MeshLambertMaterial({ color: 0xFFD700 }); // Gold color
    
    this.goalMesh = new THREE.Mesh(geometry, material);
    this.goalMesh.position.set(position.x, position.y, position.z);
    this.goalMesh.castShadow = true;
    this.goalMesh.receiveShadow = true;
    this.goalMesh.userData = { type: 'goal' };
    
    this.scene.add(this.goalMesh);
    return this.goalMesh;
  }

  /**
   * Create green box mesh for the agent (#00ff00)
   * @param {Object} position - Agent starting position (default: {x: 0, y: 1, z: 0})
   * @param {number} size - Agent size (default: 0.5)
   * @returns {THREE.Mesh} Agent mesh
   */
  createAgent(position = {x: 0, y: 1, z: 0}, size = 0.5) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    
    this.agentMesh = new THREE.Mesh(geometry, material);
    this.agentMesh.position.set(position.x, position.y, position.z);
    this.agentMesh.castShadow = true;
    this.agentMesh.userData = { type: 'agent' };
    
    this.scene.add(this.agentMesh);
    return this.agentMesh;
  }

  /**
   * Update agent mesh position to sync with physics position
   * @param {Object} position - Physics position {x, y, z}
   */
  updateAgentPosition(position) {
    if (this.agentMesh && position) {
      this.agentMesh.position.set(position.x, position.y, position.z);
    }
  }

  /**
   * Update camera to smoothly follow the agent
   * @param {Object} agentPosition - Agent position {x, y, z}
   */
  updateCamera(agentPosition) {
    if (!this.camera || !agentPosition) return;

    // Calculate desired camera position relative to agent
    const offset = new THREE.Vector3(0, 5, 10);
    const desiredPosition = new THREE.Vector3(
      agentPosition.x + offset.x,
      agentPosition.y + offset.y,
      agentPosition.z + offset.z
    );

    // Smoothly interpolate camera position using lerp
    this.camera.position.lerp(desiredPosition, this.cameraLerpSpeed);

    // Make camera look at agent position
    const lookAtTarget = new THREE.Vector3(agentPosition.x, agentPosition.y, agentPosition.z);
    this.cameraTarget.lerp(lookAtTarget, this.cameraLerpSpeed);
    this.camera.lookAt(this.cameraTarget);
  }

  /**
   * Set camera lerp speed for following behavior
   * @param {number} speed - Lerp speed (0-1, default: 0.05)
   */
  setCameraLerpSpeed(speed) {
    this.cameraLerpSpeed = Math.max(0, Math.min(1, speed));
  }

  /**
   * Get current agent position (for testing)
   * @returns {Object} Agent position {x, y, z}
   */
  getAgentPosition() {
    if (this.agentMesh) {
      return {
        x: this.agentMesh.position.x,
        y: this.agentMesh.position.y,
        z: this.agentMesh.position.z
      };
    }
    return null;
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Dispose of geometries and materials
    this.scene?.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}