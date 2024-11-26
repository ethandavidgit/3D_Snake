// 3d_snake_game_improving_visuals.js

// Initialize shared variables
let scene, camera, renderer, snake, cube, food, controls, highlightedFace, composer;

// Function to create and return highlighted edges for one face of the cube
function setupHighlightedFace(size) {
    const blueEdgesMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.8 });
    const highlightedFaceGeometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(size, size));
    const highlightedFace = new THREE.LineSegments(highlightedFaceGeometry, blueEdgesMaterial);
    highlightedFace.position.set(0, 0, size / 2);
    return highlightedFace;
}
const cubeSize = 17;
let snakeSegments = [{ x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: -2, y: 0, z: 0 }];
const snakeGeometry = new THREE.BoxGeometry(1, 1, 1);
const snakeEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
let direction = { x: 1, y: 0, z: 0 };
let lastMoveTime = 0;
const moveInterval = 500; // Slow down to a manageable speed
let directionIndicator;


// Initialize the game
function init() {
    // Clear previous renderer if exists
    if (renderer) {
        document.body.removeChild(renderer.domElement);
    }

    // Reset snake segments
    snakeSegments = [{ x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: -2, y: 0, z: 0 }];

    // Setup scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Set background color to black

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 20, 20);  // Set a farther initial view
    camera.lookAt(0, 0, 0);

    // Set up OrbitControls for mouse rotation
    controls = new THREE.OrbitControls(camera, document.body);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enableZoom = true;
    controls.maxPolarAngle = Math.PI;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add ambient light to the scene
    const light = new THREE.AmbientLight(0xcccccc, 1);
    scene.add(light);

    // Add point light to enhance 3D effect
    const pointLight = new THREE.PointLight(0xffffff, 10);
    pointLight.position.set(25, 45, 15);
    scene.add(pointLight);

    // Setup and add objects to the scene
    cube = setupCube(cubeSize); 
    scene.add(cube);

    snake = setupSnake(snakeSegments); 
    scene.add(snake);

    food = setupFood({ x: -4, y: 4, z: 4 }); 
    scene.add(food);

    // Highlight one face of the cube
    highlightedFace = setupHighlightedFace(cubeSize);
    scene.add(highlightedFace);

    // Set up post-processing for glow effect
    const renderScene = new THREE.RenderPass(scene, camera);

    // Ensure necessary imports are included for post-processing
    if (typeof THREE.RenderPass === 'undefined' || typeof THREE.UnrealBloomPass === 'undefined' || typeof THREE.EffectComposer === 'undefined') {
        console.error('Make sure to include RenderPass, UnrealBloomPass, and EffectComposer from three.js/examples/jsm/postprocessing.');
        return;
    }

    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2,  // strength of bloom
        1.2,  // radius of bloom
        0.1  // threshold of bloom
    );

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    animate();
}

// Animation loop
function animate(time) {
    requestAnimationFrame(animate);

    // Update controls for smooth camera rotation
    controls.update();

    // Update the snake and render the scene
    updateSnake(time);


    // Make the food pulse by changing its opacity
    if (food) {
        const pulseOpacity = 0.2 * Math.sin(time * 0.005) + 0.8; // Opacity range between 0.2 and 1
        food.material.opacity = pulseOpacity;
    }

    composer.render();
}

// Handle key press events
function handleKeyPress(event) {
    switch(event.key) {
        case 'w': case 'ArrowUp': if (direction.y === 0) setDirection('y', 1); break;
        case 's': case 'ArrowDown': if (direction.y === 0) setDirection('y', -1); break;
        case 'a': case 'ArrowLeft': if (direction.x === 0) setDirection('x', -1); break;
        case 'd': case 'ArrowRight': if (direction.x === 0) setDirection('x', 1); break;
        case 'q': if (direction.z === 0) setDirection('z', 1); break; // Move along z-axis forward
        case 'e': if (direction.z === 0) setDirection('z', -1); break; // Move along z-axis backward
    }
}

function setDirection(axis, value) {
    direction = { x: 0, y: 0, z: 0 };
    direction[axis] = value;
}

// Function to create and return the main transparent cube with faint edges
function setupCube(size = 20) {
    const cubeGeometry = new THREE.BoxGeometry(size, size, size);
    const cubeEdges = new THREE.EdgesGeometry(cubeGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.2 });
    const cubeEdge = new THREE.LineSegments(cubeEdges, edgeMaterial);
    return cubeEdge;
}

// Function to initialize the snake as a 3D object group and return it
function setupSnake(initialSegments = [{ x: 0, y: 0, z: 0 }]) {
    const snakeGroup = new THREE.Group();
    const snakeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, 
        emissive: 0x00ff00, 
        emissiveIntensity: 0.8, 
        metalness: 0.3, 
        roughness: 0.5, 
        transparent: true, 
        opacity: 0.7
    });

    initialSegments.forEach(segment => {
        const segmentMesh = new THREE.Mesh(snakeGeometry, snakeMaterial);
        const segmentEdges = new THREE.EdgesGeometry(snakeGeometry);
        const segmentLine = new THREE.LineSegments(segmentEdges, snakeEdgeMaterial);
        segmentMesh.add(segmentLine);
        segmentMesh.position.set(segment.x, segment.y, segment.z);
        snakeGroup.add(segmentMesh);
    });

    return snakeGroup;
}

// Function to create and return the food object positioned within the cube
function setupFood(position = { x: 1, y: 1, z: 1 }) {
    const foodGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const foodMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000, 
        emissive: 0xff0000, 
        emissiveIntensity: 1, 
        metalness: 0.5, 
        roughness: 0.4, 
        transparent: true, 
        opacity: 0.7 
    });

    const food = new THREE.Mesh(foodGeometry, foodMaterial);
    food.position.set(position.x, position.y, position.z);
    return food;
}

// Function to update the snake's movement and handle collisions
function updateSnake(time) {
    if (time - lastMoveTime >= moveInterval) {
        lastMoveTime = time;

        // Move each segment to the position of the previous segment
        for (let i = snakeSegments.length - 1; i > 0; i--) {
            snakeSegments[i] = { ...snakeSegments[i - 1] };
        }

        // Move the snake's head in the current direction
        snakeSegments[0].x += direction.x;
        snakeSegments[0].y += direction.y;
        snakeSegments[0].z += direction.z;

        // Check for boundary collisions
        if (Math.abs(snakeSegments[0].x) >= cubeSize / 2 ||
            Math.abs(snakeSegments[0].y) >= cubeSize / 2 ||
            Math.abs(snakeSegments[0].z) >= cubeSize / 2) {
            setTimeout(() => { alert("Game Over! Snake hit the cube boundary."); resetGame(); }, 0);
            return;
        }

        // Check if the snake collides with itself
        for (let i = 1; i < snakeSegments.length; i++) {
            if (snakeSegments[0].x === snakeSegments[i].x &&
                snakeSegments[0].y === snakeSegments[i].y &&
                snakeSegments[0].z === snakeSegments[i].z) {
                setTimeout(() => { alert("Game Over! Snake collided with itself."); resetGame(); }, 0);
                return;
            }
        }

        // Check if the snake's head has reached the food
        if (Math.abs(snakeSegments[0].x - food.position.x) < 2 &&
            Math.abs(snakeSegments[0].y - food.position.y) < 2 &&
            Math.abs(snakeSegments[0].z - food.position.z) < 2) {
            // Add three new segments to the snake
            const lastSegment = snakeSegments[snakeSegments.length - 1];
            for (let i = 0; i < 3; i++) {
                snakeSegments.push({ ...lastSegment });
                const segmentMesh = new THREE.Mesh(snakeGeometry, snake.children[0].material);
                const segmentEdges = new THREE.EdgesGeometry(snakeGeometry);
                const segmentLine = new THREE.LineSegments(segmentEdges, snakeEdgeMaterial);
                segmentMesh.add(segmentLine);
                segmentMesh.position.set(lastSegment.x, lastSegment.y, lastSegment.z);
                snake.add(segmentMesh);
            }

            // Remove the old food and add a new one at a random position
            scene.remove(food);
            const newFoodPosition = {
                x: Math.floor(Math.random() * cubeSize - cubeSize / 2),
                y: Math.floor(Math.random() * cubeSize - cubeSize / 2),
                z: Math.floor(Math.random() * cubeSize - cubeSize / 2)
            };
            food = setupFood(newFoodPosition);
            scene.add(food);
        }

        // Update snake position in the scene
        snake.children.forEach((segment, index) => {
            segment.position.set(snakeSegments[index].x, snakeSegments[index].y, snakeSegments[index].z);
        });
    }
}

function resetGame() {
    // Remove current objects from the scene
    scene.remove(snake);
    scene.remove(food);
    scene.remove(highlightedFace);

    // Reinitialize game elements
    init();
}

// Start the game and listen for key presses
document.addEventListener('keydown', handleKeyPress);
init();
