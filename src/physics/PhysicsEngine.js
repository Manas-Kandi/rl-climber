import * as CANNON from 'cannon-es';

/**
 * PhysicsEngine class that wraps Cannon-es physics simulation
 * Handles world initialization, body creation, and physics stepping
 */
export class PhysicsEngine {
  /**
   * Create a PhysicsEngine instance
   * @param {number} gravity - Gravity value (typically -9.81)
   */
  constructor(gravity = -9.81) {
    this.gravity = gravity;
    this.world = null;
    this.timeStep = 1 / 60; // Fixed timestep for deterministic physics
    this.bodies = new Map(); // Track created bodies
  }

  /**
   * Initialize the physics world with gravity and solver configuration
   */
  init() {
    // Create the physics world
    this.world = new CANNON.World();
    
    // Set gravity
    this.world.gravity.set(0, this.gravity, 0);
    
    // Configure world solver for better performance and stability
    this.world.solver.iterations = 10;
    this.world.solver.tolerance = 0.1;
    
    // Use SAPBroadphase for better performance with many bodies
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    
    // Enable contact material mixing
    this.world.allowSleep = false;  // CRITICAL FIX: Disable sleep to prevent freezing
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.1;
    
    console.log('PhysicsEngine initialized with gravity:', this.gravity);
  }

  /**
   * Step the physics simulation forward by the fixed timestep
   * @param {number} deltaTime - Time elapsed since last step (optional, uses fixed timestep)
   */
  step(deltaTime = this.timeStep) {
    if (!this.world) {
      console.error('Physics world not initialized. Call init() first.');
      return;
    }
    
    // Use fixed timestep for deterministic physics
    this.world.step(this.timeStep, deltaTime, 3);
  }

  /**
   * Reset the physics world by clearing all bodies and reinitializing
   */
  reset() {
    if (this.world) {
      // Remove all bodies from the world
      const bodiesToRemove = [...this.world.bodies];
      bodiesToRemove.forEach(body => {
        this.world.removeBody(body);
      });
      
      // Clear our body tracking
      this.bodies.clear();
    }
    
    // Reinitialize the world
    this.init();
    
    console.log('PhysicsEngine reset');
  }

  /**
   * Get the physics world instance
   * @returns {CANNON.World} The Cannon.js world
   */
  getWorld() {
    return this.world;
  }

  /**
   * Add a body to the physics world and track it
   * @param {CANNON.Body} body - The body to add
   * @param {string} id - Optional identifier for the body
   */
  addBody(body, id = null) {
    if (!this.world) {
      console.error('Physics world not initialized. Call init() first.');
      return;
    }
    
    this.world.addBody(body);
    
    if (id) {
      this.bodies.set(id, body);
    }
  }

  /**
   * Remove a body from the physics world
   * @param {CANNON.Body} body - The body to remove
   * @param {string} id - Optional identifier of the body
   */
  removeBody(body, id = null) {
    if (!this.world) {
      return;
    }
    
    this.world.removeBody(body);
    
    if (id && this.bodies.has(id)) {
      this.bodies.delete(id);
    }
  }

  /**
   * Get a tracked body by its identifier
   * @param {string} id - The body identifier
   * @returns {CANNON.Body|null} The body or null if not found
   */
  getBody(id) {
    return this.bodies.get(id) || null;
  }

  /**
   * Create a static ground plane body
   * @param {number} width - Ground width
   * @param {number} depth - Ground depth
   * @param {Object} position - Position {x, y, z}
   * @returns {CANNON.Body} The ground body
   */
  createGroundBody(width = 20, depth = 20, position = { x: 0, y: 0, z: 0 }) {
    // Create a box shape for the ground
    const groundShape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.1, depth / 2));
    
    // Create the body with zero mass (static)
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    
    // Set position
    groundBody.position.set(position.x, position.y, position.z);
    
    // Configure material properties
    groundBody.material = new CANNON.Material({
      friction: 0.3,
      restitution: 0.1
    });
    
    // Add to world and track
    this.addBody(groundBody, 'ground');
    
    console.log('Ground body created at:', position);
    return groundBody;
  }

  /**
   * Create a static wall body for collision
   * @param {Object} position - Wall position {x, y, z}
   * @param {Object} size - Wall size {x, y, z}
   * @returns {CANNON.Body} The wall body
   */
  createWallBody(position = { x: 0, y: 5, z: -5 }, size = { x: 10, y: 10, z: 1 }) {
    // Create a box shape for the wall
    const wallShape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    
    // Create the body with zero mass (static)
    const wallBody = new CANNON.Body({ mass: 0 });
    wallBody.addShape(wallShape);
    
    // Set position
    wallBody.position.set(position.x, position.y, position.z);
    
    // Configure material properties
    wallBody.material = new CANNON.Material({
      friction: 0.4, // Higher friction for climbing
      restitution: 0.1
    });
    
    // Add to world and track
    this.addBody(wallBody, 'wall');
    
    console.log('Wall body created at:', position);
    return wallBody;
  }

  /**
   * Create a static ledge body
   * @param {Object} position - Ledge position {x, y, z}
   * @param {Object} size - Ledge size {x, y, z}
   * @param {string} id - Optional identifier for the ledge
   * @returns {CANNON.Body} The ledge body
   */
  createLedgeBody(position, size = { x: 2, y: 0.2, z: 1 }, id = null) {
    // Create a box shape for the ledge
    const ledgeShape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    
    // Create the body with zero mass (static)
    const ledgeBody = new CANNON.Body({ mass: 0 });
    ledgeBody.addShape(ledgeShape);
    
    // Set position
    ledgeBody.position.set(position.x, position.y, position.z);
    
    // Configure material properties for good grip
    ledgeBody.material = new CANNON.Material({
      friction: 0.6, // High friction for gripping
      restitution: 0.1
    });
    
    // Add to world and track with unique ID
    const ledgeId = id || `ledge_${position.x}_${position.y}_${position.z}`;
    this.addBody(ledgeBody, ledgeId);
    
    console.log('Ledge body created at:', position, 'with ID:', ledgeId);
    return ledgeBody;
  }

  /**
   * Create a dynamic agent body with mass
   * @param {Object} position - Agent starting position {x, y, z}
   * @param {number} mass - Agent mass
   * @param {number} size - Agent size (radius for sphere or half-extent for box)
   * @param {string} shape - Shape type: 'box' or 'sphere'
   * @returns {CANNON.Body} The agent body
   */
  createAgentBody(position = { x: 0, y: 1, z: 0 }, mass = 1.0, size = 0.5, shape = 'box') {
    let agentShape;
    
    // Create shape based on type
    if (shape === 'sphere') {
      agentShape = new CANNON.Sphere(size);
    } else {
      // Default to box
      agentShape = new CANNON.Box(new CANNON.Vec3(size, size, size));
    }
    
    // Create the body with specified mass (dynamic)
    const agentBody = new CANNON.Body({ mass: mass });
    agentBody.addShape(agentShape);
    
    // Set position
    agentBody.position.set(position.x, position.y, position.z);
    
    // Configure material properties
    agentBody.material = new CANNON.Material({
      friction: 0.3,
      restitution: 0.1
    });
    
    // Configure linear and angular damping to prevent excessive spinning
    agentBody.linearDamping = 0.1;  // REDUCED: Lower damping for better responsiveness
    agentBody.angularDamping = 0.3;  // REDUCED: Lower damping to prevent freezing
    
    // Add to world and track
    this.addBody(agentBody, 'agent');
    
    console.log('Agent body created at:', position, 'with mass:', mass);
    return agentBody;
  }

  /**
   * Remove a body from the physics world
   * @param {string} id - Body ID to remove
   */
  removeBody(id) {
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(id);
      console.log('Removed body:', id);
    }
  }

  /**
   * Apply a continuous force to a body
   * @param {CANNON.Body} body - The body to apply force to
   * @param {Object} force - Force vector {x, y, z}
   * @param {Object} worldPoint - Optional world point to apply force at
   */
  applyForce(body, force, worldPoint = null) {
    if (!body) {
      console.error('Cannot apply force: body is null or undefined');
      return;
    }
    
    const forceVec = new CANNON.Vec3(force.x, force.y, force.z);
    
    if (worldPoint) {
      const pointVec = new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z);
      body.applyForce(forceVec, pointVec);
    } else {
      body.applyForce(forceVec);
    }
  }

  /**
   * Apply an instant impulse to a body (useful for jumping)
   * @param {CANNON.Body} body - The body to apply impulse to
   * @param {Object} impulse - Impulse vector {x, y, z}
   * @param {Object} worldPoint - Optional world point to apply impulse at
   */
  applyImpulse(body, impulse, worldPoint = null) {
    if (!body) {
      console.error('Cannot apply impulse: body is null or undefined');
      return;
    }
    
    const impulseVec = new CANNON.Vec3(impulse.x, impulse.y, impulse.z);
    
    if (worldPoint) {
      const pointVec = new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z);
      body.applyImpulse(impulseVec, pointVec);
    } else {
      body.applyImpulse(impulseVec);
    }
  }

  /**
   * Get the position of a body
   * @param {CANNON.Body} body - The body to query
   * @returns {Object} Position as {x, y, z}
   */
  getBodyPosition(body) {
    if (!body) {
      console.error('Cannot get position: body is null or undefined');
      return { x: 0, y: 0, z: 0 };
    }
    
    return {
      x: body.position.x,
      y: body.position.y,
      z: body.position.z
    };
  }

  /**
   * Get the velocity of a body
   * @param {CANNON.Body} body - The body to query
   * @returns {Object} Velocity as {x, y, z}
   */
  getBodyVelocity(body) {
    if (!body) {
      console.error('Cannot get velocity: body is null or undefined');
      return { x: 0, y: 0, z: 0 };
    }
    
    return {
      x: body.velocity.x,
      y: body.velocity.y,
      z: body.velocity.z
    };
  }

  /**
   * Check if two bodies are colliding
   * @param {CANNON.Body} bodyA - First body
   * @param {CANNON.Body} bodyB - Second body
   * @returns {boolean} True if bodies are colliding
   */
  checkCollision(bodyA, bodyB) {
    if (!bodyA || !bodyB) {
      console.error('Cannot check collision: one or both bodies are null or undefined');
      return false;
    }
    
    if (!this.world) {
      console.error('Cannot check collision: physics world not initialized');
      return false;
    }
    
    // Check if bodies are in contact
    for (let i = 0; i < this.world.contacts.length; i++) {
      const contact = this.world.contacts[i];
      if ((contact.bi === bodyA && contact.bj === bodyB) ||
          (contact.bi === bodyB && contact.bj === bodyA)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get all bodies currently colliding with the specified body
   * @param {CANNON.Body} body - The body to check collisions for
   * @returns {Array<CANNON.Body>} Array of colliding bodies
   */
  getCollidingBodies(body) {
    if (!body || !this.world) {
      return [];
    }
    
    const collidingBodies = [];
    
    for (let i = 0; i < this.world.contacts.length; i++) {
      const contact = this.world.contacts[i];
      if (contact.bi === body) {
        collidingBodies.push(contact.bj);
      } else if (contact.bj === body) {
        collidingBodies.push(contact.bi);
      }
    }
    
    return collidingBodies;
  }

  /**
   * Set the position of a body
   * @param {CANNON.Body} body - The body to move
   * @param {Object} position - New position {x, y, z}
   */
  setBodyPosition(body, position) {
    if (!body) {
      console.error('Cannot set position: body is null or undefined');
      return;
    }
    
    body.position.set(position.x, position.y, position.z);
  }

  /**
   * Set the velocity of a body
   * @param {CANNON.Body} body - The body to modify
   * @param {Object} velocity - New velocity {x, y, z}
   */
  setBodyVelocity(body, velocity) {
    if (!body) {
      console.error('Cannot set velocity: body is null or undefined');
      return;
    }
    
    body.velocity.set(velocity.x, velocity.y, velocity.z);
  }
}