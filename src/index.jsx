// ============================================// STATE MANAGEMENT (Zustand)// ============================================
import { store } from './store.js';

// ============================================// HAND GESTURE DETECTION// ============================================
import {
    initHandGestureDetection,
    getCurrentGesture,
    toggleCamera
} from './utils/handGesture.js';

// ============================================
// GEOMETRY UTILS
// ============================================
import { 
    sphericalToCartesian, 
    coneDistribution, 
    spiralDistribution, 
    createStarShape, 
    randomDistribution, 
    calculateRippleForce, 
    photoRingPosition, 
    generateExplosionPosition, 
    ringDistribution,
    generateTextParticles
} from './utils/geometry.js';

// ============================================
// THREE.JS EXTENSIONS
// ============================================
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// ============================================
// THREE.JS SCENE SETUP
// ============================================
let scene, camera, renderer, composer;
let treeParticles = [];
let ornaments = [];
let snowflakes = [];
let photos = [];
let topStar;
let clock = new THREE.Clock();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let particleSystem, ornamentGroup, photoGroup;

// Camera controls variables
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};
let cameraOriginalPosition = new THREE.Vector3(0, 2, 8);
let cameraOriginalLookAt = new THREE.Vector3(0, 2, 0);
let cameraTarget = new THREE.Vector3(0, 2, 0);

const PARTICLE_COUNT = 20000;
const ORNAMENT_COUNT = 50;
const SNOWFLAKE_COUNT = 500;
const PHOTO_COUNT = 24;

// HDR Environment Map
let hdrTexture;

// PBR Colors for ornaments
const ORNAMENT_COLORS = [
    0xD4AF37, // Vintage Gold
    0x722F37, // Wine Red
    0x6B7B8C, // Gray Blue
    0xE8B4B8, // Rose Pink
    0xF5DEB3, // Champagne
    0x00FF7F, // Spring Green
    0x9370DB, // Medium Purple
    0xFF69B4, // Hot Pink
    0x4682B4, // Steel Blue
    0xFFD700, // Gold
    0xDC143C, // Crimson
    0x483D8B  // Dark Slate Blue
];

async function loadHDRTexture() {
    try {
        const loader = new RGBELoader();
        const texture = await loader.loadAsync('/assets/hdr/environment.hdr');
        texture.mapping = THREE.EquirectangularReflectionMapping;
        
        // Optimize HDR texture for better performance and quality
        texture.encoding = THREE.LinearEncoding;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        
        return texture;
    } catch (error) {
        console.error('Error loading HDR texture:', error);
        return null;
    }
}

async function init() {
    const container = document.getElementById('canvas-container');
    
    // Load HDR environment map
    hdrTexture = await loadHDRTexture();
    
    // Scene
    scene = new THREE.Scene();
    
    if (hdrTexture) {
        // Set scene background to HDR texture
        scene.background = hdrTexture;
        // Set scene environment for reflections
        scene.environment = hdrTexture;
        // Remove fog since we're using HDR background
    } else {
        // Fallback to original background if HDR fails
        scene.background = new THREE.Color(0x000008);
        scene.fog = new THREE.FogExp2(0x000008, 0.015);
    }
    
    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 2, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    container.appendChild(renderer.domElement);
    
    // Lights
    setupLights();
    
    // Background stars
    createStars();
    
    // Christmas Tree
    createChristmasTree();
    
    // Ornaments
    createOrnaments();
    
    // Top Star
    createTopStar();
    
    // Snowflakes
    createSnowflakes();
    
    // Photos (hidden initially)
    createPhotos();
    
    // Post-processing (simplified bloom effect)
    setupPostProcessing();
    
    // Events
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onWheel);
    window.addEventListener('dblclick', onDoubleClick);
    
    animate();
}

function setupLights() {
    // Warm main light
    const warmLight = new THREE.PointLight(0xFFD700, 2, 20);
    warmLight.position.set(2, 4, 3);
    scene.add(warmLight);
    
    // Cool fill light
    const coolLight = new THREE.PointLight(0x4169E1, 1, 15);
    coolLight.position.set(-3, 2, -2);
    scene.add(coolLight);
    
    // Top spotlight
    const spotlight = new THREE.SpotLight(0xFFFFFF, 1.5, 20, Math.PI / 6, 0.5);
    spotlight.position.set(0, 10, 0);
    spotlight.target.position.set(0, 0, 0);
    scene.add(spotlight);
    scene.add(spotlight.target);
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.5);
    scene.add(ambientLight);
}

function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
        const radius = 50 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        const { x, y, z } = sphericalToCartesian(radius, theta, phi);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Randomized brightness for stars
        const brightness = Math.random() * 0.5 + 0.5;
        const colorVariation = Math.random() * 0.3;
        colors[i * 3] = brightness + colorVariation;
        colors[i * 3 + 1] = brightness + colorVariation * 0.5;
        colors[i * 3 + 2] = brightness + colorVariation * 1.2;
        
        sizes[i] = Math.random() * 2 + 0.5;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starsMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.userData.type = 'stars';
    scene.add(stars);
}

function createChristmasTree() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Cone distribution
        const { x, y, z } = coneDistribution(5, 2, 0.5);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;
        
        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = 0;
        
        // Green color with randomized brightness variations
        const baseGreen = 0.4 + Math.random() * 0.3;
        const brightness = Math.random() * 0.5 + 0.5;
        const colorVariation = Math.random() * 0.2;
        
        colors[i * 3] = 0.1 + Math.random() * 0.2 + colorVariation;
        colors[i * 3 + 1] = baseGreen * brightness;
        colors[i * 3 + 2] = 0.1 + Math.random() * 0.1 + colorVariation * 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.userData = { 
        originalPositions, 
        velocities,
        explodedPositions: new Float32Array(PARTICLE_COUNT * 3)
    };
    
    // Generate text particles
    const textParticleCount = 5000;
    const textParticles = generateTextParticles("Merry Christmas", textParticleCount, 3);
    
    // Generate exploded positions (nebula ring + text)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (i < textParticleCount) {
            // Use text particles for the first 5000 particles
            const pos = textParticles[i % textParticles.length];
            geometry.userData.explodedPositions[i * 3] = pos.x;
            geometry.userData.explodedPositions[i * 3 + 1] = pos.y + 2.5; // Center vertically
            geometry.userData.explodedPositions[i * 3 + 2] = pos.z;
        } else {
            // Use nebula ring for remaining particles
            const ringRadius = 8 + Math.random() * 6;
            const { x, y, z } = ringDistribution(ringRadius, 4);
            
            geometry.userData.explodedPositions[i * 3] = x;
            geometry.userData.explodedPositions[i * 3 + 1] = y;
            geometry.userData.explodedPositions[i * 3 + 2] = z;
        }
    }
    
    const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    particleSystem = new THREE.Points(geometry, material);
    particleSystem.userData.type = 'tree';
    scene.add(particleSystem);
}

function createOrnaments() {
    ornamentGroup = new THREE.Group();
    
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
        // Spiral distribution on cone
        const { x, y, z } = spiralDistribution(i, ORNAMENT_COUNT, 4.5, 1.8, 8);
        const color = ORNAMENT_COLORS[i % ORNAMENT_COLORS.length];
        
        // Size distribution based on Y position - smaller at top, larger at bottom
        // Y ranges roughly from 0 (bottom) to 5 (top)
        const yNormalized = (5 - y) / 5; // 0 at top, 1 at bottom
        const baseSize = 0.06 + yNormalized * 0.12; // 0.06 at top, 0.18 at bottom
        const size = baseSize + (Math.random() - 0.5) * 0.03; // Add some random variation
        
        // Randomly select geometry type for variation
        let geometry;
        const shapeType = Math.floor(Math.random() * 3);
        switch(shapeType) {
            case 0: // Sphere
                geometry = new THREE.SphereGeometry(size, 16, 16);
                break;
            case 1: // Cube with rounded edges
                geometry = new THREE.BoxGeometry(size, size, size, 6, 6, 6);
                break;
            case 2: // Icosahedron
                geometry = new THREE.IcosahedronGeometry(size, 0);
                break;
        }
        
        // Randomized brightness and material properties
        const emissiveIntensity = 0.2 + Math.random() * 0.6; // Range: 0.2 to 0.8
        const metalness = 0.6 + Math.random() * 0.4; // Range: 0.6 to 1.0
        const roughness = 0.1 + Math.random() * 0.3; // Range: 0.1 to 0.4
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: metalness,
            roughness: roughness,
            emissive: color,
            emissiveIntensity: emissiveIntensity * 1.5,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2
        });
        
        // Store base emissive intensity for flickering effect
        material.userData.baseEmissiveIntensity = emissiveIntensity * 1.5;
        
        const ornament = new THREE.Mesh(geometry, material);
        ornament.position.set(x, y, z);
        
        // Calculate angle for explosion position
        const t = i / ORNAMENT_COUNT;
        const angle = t * Math.PI * 8;
        
        ornament.userData = {
            originalPosition: new THREE.Vector3(x, y, z),
            explodedPosition: generateExplosionPosition(angle, 10, 15),
            velocity: new THREE.Vector3()
        };
        
        ornamentGroup.add(ornament);
        ornaments.push(ornament);
    }
    
    scene.add(ornamentGroup);
}

function createTopStar() {
    // Create a perfect hexagonal star shape with ideal proportions
    const starShape = createStarShape(0.45, 0.21, 6);
    
    // Add bevel for smoother edges
    const extrudeSettings = { 
        depth: 0.12, 
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.03,
        bevelOffset: 0,
        bevelSegments: 3
    };
    const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    
    const material = new THREE.MeshStandardMaterial({
        color: 0xFFFF88,
        emissive: 0xFFFF00,
        emissiveIntensity: 1.5,
        metalness: 0.9,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });
    
    topStar = new THREE.Mesh(geometry, material);
    topStar.position.set(0, 5.2, 0);
    topStar.rotation.y = Math.PI / 10;
    topStar.userData = {
        originalPosition: new THREE.Vector3(0, 5.2, 0),
        explodedPosition: new THREE.Vector3(0, 8, 0)
    };
    
    // Add multi-layered glow effect
    const glowLayers = [
        { size: 0.6, opacity: 0.4, color: 0xFFFF88 },
        { size: 0.8, opacity: 0.3, color: 0xFFFF44 },
        { size: 1.0, opacity: 0.2, color: 0xFFFF00 },
        { size: 1.3, opacity: 0.1, color: 0xFFD700 }
    ];
    
    glowLayers.forEach((layer, index) => {
        const glowGeometry = new THREE.SphereGeometry(layer.size, 24, 24);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: layer.color,
            transparent: true,
            opacity: layer.opacity,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.name = `glow-layer-${index}`;
        glow.userData = {
            originalOpacity: layer.opacity,
            originalSize: layer.size
        };
        topStar.add(glow);
    });
    
    // Add star sparkle particle system
    const sparkleCount = 100;
    const sparkleGeometry = new THREE.BufferGeometry();
    const sparklePositions = new Float32Array(sparkleCount * 3);
    const sparkleVelocities = new Float32Array(sparkleCount * 3);
    const sparkleSizes = new Float32Array(sparkleCount);
    const sparkleLifespans = new Float32Array(sparkleCount);
    
    for (let i = 0; i < sparkleCount; i++) {
        // Random position around star
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.8 + 0.2;
        const height = (Math.random() - 0.5) * 0.5;
        
        sparklePositions[i * 3] = Math.cos(angle) * radius;
        sparklePositions[i * 3 + 1] = height;
        sparklePositions[i * 3 + 2] = Math.sin(angle) * radius;
        
        // Random velocities
        sparkleVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
        sparkleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
        sparkleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        
        // Random sizes
        sparkleSizes[i] = Math.random() * 0.03 + 0.01;
        
        // Random lifespans
        sparkleLifespans[i] = Math.random();
    }
    
    sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    sparkleGeometry.setAttribute('size', new THREE.BufferAttribute(sparkleSizes, 1));
    sparkleGeometry.userData = {
        velocities: sparkleVelocities,
        lifespans: sparkleLifespans
    };
    
    const sparkleMaterial = new THREE.PointsMaterial({
        color: 0xFFFFCC,
        size: 0.02,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        vertexColors: false
    });
    
    const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
    sparkles.name = 'star-sparkles';
    topStar.add(sparkles);
    
    scene.add(topStar);
}

function createSnowflakes() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(SNOWFLAKE_COUNT * 3);
    const colors = new Float32Array(SNOWFLAKE_COUNT * 3);
    const originalPositions = new Float32Array(SNOWFLAKE_COUNT * 3);
    
    for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
        const { x, y, z } = randomDistribution(15);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;
        
        // Randomized brightness for snowflakes
        const brightness = Math.random() * 0.5 + 0.5;
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.userData = { originalPositions };
    
    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const snowflakeSystem = new THREE.Points(geometry, material);
    snowflakeSystem.userData.type = 'snowflakes';
    scene.add(snowflakeSystem);
}

function createPhotos() {
    photoGroup = new THREE.Group();
    
    for (let i = 0; i < PHOTO_COUNT; i++) {
        // Initial frame geometry
        const frameGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.05);
        // Create a realistic wooden texture for the frame
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Generate realistic wood grain texture
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                // Base wood colors - warm brown tones
                const baseColors = [
                    new THREE.Color(0x8B4513), // SaddleBrown
                    new THREE.Color(0xA0522D), // Sienna
                    new THREE.Color(0xCD853F), // Peru
                    new THREE.Color(0xDEB887)  // BurlyWood
                ];
                
                // Choose a base color based on vertical position (grain layers)
                const layer = Math.floor(y / (canvas.height / baseColors.length));
                let baseColor = baseColors[layer % baseColors.length];
                
                // Add horizontal wood grain patterns
                const grain = Math.sin(x * 0.1 + y * 0.05) * 0.1 + 
                             Math.sin(x * 0.03 + y * 0.1) * 0.08 +
                             Math.random() * 0.05 - 0.025;
                
                // Add darker growth rings
                const ring = Math.abs(Math.sin(y * 0.02 + x * 0.01)) * 0.3;
                
                // Combine effects
                const r = Math.max(0, Math.min(1, baseColor.r + grain - ring * 0.5));
                const g = Math.max(0, Math.min(1, baseColor.g + grain * 0.8 - ring * 0.4));
                const b = Math.max(0, Math.min(1, baseColor.b + grain * 0.5 - ring * 0.6));
                
                ctx.fillStyle = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        // Create texture from canvas
        const frameTexture = new THREE.CanvasTexture(canvas);
        frameTexture.wrapS = THREE.RepeatWrapping;
        frameTexture.wrapT = THREE.RepeatWrapping;
        frameTexture.repeat.set(3, 3);
        frameTexture.anisotropy = 16; // Enhance texture quality at angles
        
        const frameMaterial = new THREE.MeshStandardMaterial({
            map: frameTexture,
            color: 0x8B4513, // Base wood color
            roughness: 0.7, // Wood has moderate roughness
            metalness: 0.1, // Low metalness for natural wood
            clearcoat: 0.5, // Slight clearcoat for polished wood look
            clearcoatRoughness: 0.3 // Slightly rough clearcoat
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        
        // Photo inside - use actual image from assets/images
        const photoPath = `./assets/images/${i + 1}.jpeg`;
        
        // Load texture and wait for it to be ready to get dimensions
        const texture = new THREE.TextureLoader().load(
            photoPath, 
            (loadedTexture) => {
                // Get photo dimensions from texture
                let aspectRatio = loadedTexture.image.width / loadedTexture.image.height;
                
                // Limit aspect ratio to prevent extreme sizes (between 0.5 and 2.0)
                const maxAspectRatio = 2.0;
                const minAspectRatio = 0.5;
                aspectRatio = Math.max(minAspectRatio, Math.min(maxAspectRatio, aspectRatio));
                
                // Base photo size (height = 1, width adjusts based on aspect ratio)
                const photoHeight = 1;
                const photoWidth = photoHeight * aspectRatio;
                
                // Calculate frame dimensions (adding Polaroid border) - narrower width
                const frameBorder = 0.05; // Reduced from 0.1 to shorten frame width
                const frameBottomBorder = 0.2; // Adjusted to maintain proportional aesthetics
                const frameWidth = photoWidth + frameBorder * 2;
                const frameHeight = photoHeight + frameBorder + frameBottomBorder;
                
                // Update frame geometry
                frame.geometry.dispose();
                frame.geometry = new THREE.BoxGeometry(frameWidth, frameHeight, 0.05);
                
                // Update photo geometry and position
                const photo = frame.children[0];
                photo.geometry.dispose();
                photo.geometry = new THREE.PlaneGeometry(photoWidth, photoHeight);
                photo.position.y = (frameBottomBorder - frameBorder) / 2;
            },
            undefined, // onProgress callback (not used)
            (error) => {
                console.error(`Error loading texture ${photoPath}:`, error);
                // Fallback to default dimensions if texture fails to load
                const defaultAspectRatio = 1.0;
                const photoHeight = 1;
                const photoWidth = photoHeight * defaultAspectRatio;
                
                // Calculate frame dimensions with default aspect ratio - narrower width
                const frameBorder = 0.05; // Reduced from 0.1 to shorten frame width
                const frameBottomBorder = 0.2; // Adjusted to maintain proportional aesthetics
                const frameWidth = photoWidth + frameBorder * 2;
                const frameHeight = photoHeight + frameBorder + frameBottomBorder;
                
                // Update frame geometry with fallback dimensions
                frame.geometry.dispose();
                frame.geometry = new THREE.BoxGeometry(frameWidth, frameHeight, 0.05);
                
                // Update photo geometry with fallback dimensions
                const photo = frame.children[0];
                photo.geometry.dispose();
                photo.geometry = new THREE.PlaneGeometry(photoWidth, photoHeight);
                photo.position.y = (frameBottomBorder - frameBorder) / 2;
            }
        );
        
        // Initial photo geometry (will be updated once texture loads)
        const photoGeometry = new THREE.PlaneGeometry(1, 1);
        const photoMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const photo = new THREE.Mesh(photoGeometry, photoMaterial);
        photo.position.z = 0.03;
        
        frame.add(photo);
        
        // Position in ring
        const { position, angle } = photoRingPosition(i, PHOTO_COUNT, 12);
        frame.position.copy(position);
        frame.lookAt(0, 2.5, 0);
        frame.userData = {
            index: i,
            angle: angle,
            originalPosition: frame.position.clone(),
            treePosition: new THREE.Vector3(
                Math.cos(angle) * 0.5,
                2.5 + (i / PHOTO_COUNT) * 3,
                Math.sin(angle) * 0.5
            )
        };
        frame.scale.set(0, 0, 0);
        frame.visible = false;
        
        photoGroup.add(frame);
        photos.push(frame);
    }
    
    scene.add(photoGroup);
}

function setupPostProcessing() {
    // Simplified bloom using point material glow
    // Real post-processing would require additional libraries
}

// ============================================
// ANIMATION AND INTERACTIONS
// ============================================

function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    const state = store.getState();
    
    // Animate stars
    scene.children.forEach(child => {
        if (child.userData && child.userData.type === 'stars') {
            child.rotation.y = time * 0.02;
        }
    });
    
    // Snowflake falling animation
    scene.children.forEach(child => {
        if (child.userData && child.userData.type === 'snowflakes') {
            const positions = child.geometry.attributes.position.array;
            for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
                positions[i * 3 + 1] -= 0.01;
                positions[i * 3] += Math.sin(time + i) * 0.002;
                
                if (positions[i * 3 + 1] < -1) {
                    positions[i * 3 + 1] = 10;
                }
            }
            child.geometry.attributes.position.needsUpdate = true;
        }
    });
    
    // Top star rotation and pulsing animation
    if (topStar) {
        // Smooth rotation with multiple axes
        topStar.rotation.y += 0.015;
        topStar.rotation.z = Math.sin(time * 0.8) * 0.15;
        topStar.rotation.x = Math.cos(time * 0.6) * 0.1;
        
        // Pulsing effect for glow layers
        topStar.children.forEach((child, index) => {
            if (child.name && child.name.startsWith('glow-layer-')) {
                // Calculate pulsing factor with different phases for each layer
                const pulseFactor = 1 + Math.sin(time * 2 + index * 0.5) * 0.3;
                child.scale.setScalar(pulseFactor);
                
                // Add subtle opacity variation using original opacity as base
                const opacityVariation = 1 + Math.sin(time * 3 + index) * 0.2;
                child.material.opacity = child.userData.originalOpacity * opacityVariation;
            }
        });
        
        // Pulsing effect for star itself
        const starPulse = 1 + Math.sin(time * 1.5) * 0.05;
        topStar.scale.setScalar(starPulse);
        
        // Animate star sparkle particles
        const sparkles = topStar.getObjectByName('star-sparkles');
        if (sparkles) {
            const positions = sparkles.geometry.attributes.position.array;
            const velocities = sparkles.geometry.userData.velocities;
            const lifespans = sparkles.geometry.userData.lifespans;
            const sparkleCount = positions.length / 3;
            
            for (let i = 0; i < sparkleCount; i++) {
                // Update position based on velocity
                positions[i * 3] += velocities[i * 3];
                positions[i * 3 + 1] += velocities[i * 3 + 1];
                positions[i * 3 + 2] += velocities[i * 3 + 2];
                
                // Update lifespan
                lifespans[i] -= 0.01;
                
                // Reset particle if lifespan is over
                if (lifespans[i] <= 0) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 0.8 + 0.2;
                    const height = (Math.random() - 0.5) * 0.5;
                    
                    positions[i * 3] = Math.cos(angle) * radius;
                    positions[i * 3 + 1] = height;
                    positions[i * 3 + 2] = Math.sin(angle) * radius;
                    
                    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
                    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
                    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
                    
                    lifespans[i] = Math.random() * 0.5 + 0.5;
                }
            }
            
            sparkles.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    // Ripple effect in tree phase
    if (state.phase === 'tree') {
        applyRippleEffect();
    }
    
    // Ornament floating, rotation and flickering animation
    ornaments.forEach((ornament, i) => {
        if (state.phase === 'tree' || state.phase === 'nebula') {
            // Add flickering effect by adjusting emissive intensity
            const flickerFactor = 1 + Math.sin(time * 5 + i * 2) * 0.2 + (Math.random() - 0.5) * 0.1;
            ornament.material.emissiveIntensity = ornament.material.userData.baseEmissiveIntensity * flickerFactor;
        }
        
        if (state.phase === 'tree') {
            ornament.position.y = ornament.userData.originalPosition.y + Math.sin(time * 2 + i) * 0.05;
            // Add rotation animation
            ornament.rotation.x += 0.01 + Math.sin(time * 0.5 + i) * 0.005;
            ornament.rotation.y += 0.015 + Math.cos(time * 0.7 + i) * 0.008;
        } else if (state.phase === 'nebula') {
            // Continue rotation in nebula phase
            ornament.rotation.x += 0.01;
            ornament.rotation.y += 0.015;
        }
    });
    
    // Photo carousel rotation in nebula phase - rotation handled by GSAP in rotateCarousel()
    if (state.phase === 'nebula') {
        // Keep particle system and ornament group in sync with photo group rotation
        particleSystem.rotation.y = photoGroup.rotation.y;
        ornamentGroup.rotation.y = photoGroup.rotation.y;
    }
    
    renderer.render(scene, camera);
}

function applyRippleEffect() {
    const state = store.getState();
    
    // Use Raycaster to convert screen mouse position to 3D space
    // based on current camera perspective
    raycaster.setFromCamera(mouse, camera);
    
    // Create a plane perpendicular to the camera's forward direction
    // and passing through the tree center (0, 2, 0)
    const treeCenter = new THREE.Vector3(0, 2, 0);
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const plane = new THREE.Plane(cameraDirection, -cameraDirection.dot(treeCenter));
    
    // Calculate intersection point of ray with the plane
    const mousePos = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, mousePos);
    
    if (particleSystem) {
        const positions = particleSystem.geometry.attributes.position.array;
        const original = particleSystem.geometry.userData.originalPositions;
        const velocities = particleSystem.geometry.userData.velocities;
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ox = original[i * 3];
            const oy = original[i * 3 + 1];
            const oz = original[i * 3 + 2];
            
            const currentPos = new THREE.Vector3(ox, oy, oz);
            const force = calculateRippleForce(currentPos, mousePos, 1, 0.015);
            
            velocities[i * 3] += force.x;
            velocities[i * 3 + 1] += force.y;
            velocities[i * 3 + 2] += force.z;
            
            // Apply velocity with damping
            positions[i * 3] += velocities[i * 3];
            positions[i * 3 + 1] += velocities[i * 3 + 1];
            positions[i * 3 + 2] += velocities[i * 3 + 2];
            
            // Spring back to original
            positions[i * 3] += (ox - positions[i * 3]) * 0.05;
            positions[i * 3 + 1] += (oy - positions[i * 3 + 1]) * 0.05;
            positions[i * 3 + 2] += (oz - positions[i * 3 + 2]) * 0.05;
            
            // Damping
            velocities[i * 3] *= 0.95;
            velocities[i * 3 + 1] *= 0.95;
            velocities[i * 3 + 2] *= 0.95;
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    // Apply to ornaments
    ornaments.forEach((ornament) => {
        const op = ornament.userData.originalPosition;
        const currentPos = op.clone();
        const force = calculateRippleForce(currentPos, mousePos, 1, 0.05);
        
        ornament.userData.velocity.add(force);
        
        ornament.position.add(ornament.userData.velocity);
        ornament.position.lerp(op, 0.05);
        ornament.userData.velocity.multiplyScalar(0.9);
    });
}

// ============================================
// PHASE TRANSITIONS (GSAP Animations)
// ============================================

function triggerBlooming() {
    const state = store.getState();
    if (state.phase !== 'tree') return;
    
    store.setState({ phase: 'blooming' });
    updateUI('blooming');
    
    // Hide title
    gsap.to('#title', { opacity: 0, duration: 1 });
    
    // Explode particles
    const positions = particleSystem.geometry.attributes.position.array;
    const exploded = particleSystem.geometry.userData.explodedPositions;
    
    gsap.to({}, {
        duration: 2,
        onUpdate: function() {
            const progress = this.progress();
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const ox = particleSystem.geometry.userData.originalPositions[i * 3];
                const oy = particleSystem.geometry.userData.originalPositions[i * 3 + 1];
                const oz = particleSystem.geometry.userData.originalPositions[i * 3 + 2];
                
                positions[i * 3] = ox + (exploded[i * 3] - ox) * progress;
                positions[i * 3 + 1] = oy + (exploded[i * 3 + 1] - oy) * progress;
                positions[i * 3 + 2] = oz + (exploded[i * 3 + 2] - oz) * progress;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        },
        ease: "power2.out"
    });
    
    // Explode ornaments
    ornaments.forEach((ornament, i) => {
        gsap.to(ornament.position, {
            x: ornament.userData.explodedPosition.x,
            y: ornament.userData.explodedPosition.y,
            z: ornament.userData.explodedPosition.z,
            duration: 2,
            delay: i * 0.02,
            ease: "power2.out"
        });
    });
    
    // Move top star
    gsap.to(topStar.position, {
        y: 8,
        duration: 2,
        ease: "power2.out"
    });
    
    // Show photos
    photos.forEach((photo, i) => {
        photo.visible = true;
        gsap.to(photo.scale, {
            x: 1, y: 1, z: 1,
            duration: 1.5,
            delay: 0.5 + i * 0.05,
            ease: "back.out(1.7)"
        });
        gsap.to(photo.position, {
            x: photo.userData.originalPosition.x,
            y: photo.userData.originalPosition.y,
            z: photo.userData.originalPosition.z,
            duration: 2,
            delay: 0.3 + i * 0.03,
            ease: "power2.out"
        });
    });
    
    // Camera movement
    gsap.to(camera.position, {
        z: 20,
        y: 3,
        duration: 2.5,
        ease: "power2.inOut",
        onUpdate: () => {
            camera.lookAt(0, 2, 0);
        }
    });
    
    // Update camera target for drag/zoom functionality
    cameraTarget.set(0, 2, 0);
    
    // Transition to nebula phase
    setTimeout(() => {
        store.setState({ phase: 'nebula' });
        updateUI('nebula');
    }, 2500);
}

function triggerCollapsing() {
    const state = store.getState();
    if (state.phase !== 'nebula') return;
    
    store.setState({ phase: 'collapsing' });
    updateUI('collapsing');
    
    // Collapse particles back
    const positions = particleSystem.geometry.attributes.position.array;
    const original = particleSystem.geometry.userData.originalPositions;
    
    gsap.to({}, {
        duration: 2,
        onUpdate: function() {
            const progress = this.progress();
            const exploded = particleSystem.geometry.userData.explodedPositions;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                positions[i * 3] = exploded[i * 3] + (original[i * 3] - exploded[i * 3]) * progress;
                positions[i * 3 + 1] = exploded[i * 3 + 1] + (original[i * 3 + 1] - exploded[i * 3 + 1]) * progress;
                positions[i * 3 + 2] = exploded[i * 3 + 2] + (original[i * 3 + 2] - exploded[i * 3 + 2]) * progress;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        },
        ease: "power2.inOut"
    });
    
    // Collapse ornaments
    ornaments.forEach((ornament, i) => {
        gsap.to(ornament.position, {
            x: ornament.userData.originalPosition.x,
            y: ornament.userData.originalPosition.y,
            z: ornament.userData.originalPosition.z,
            duration: 2,
            delay: i * 0.02,
            ease: "power2.inOut"
        });
    });
    
    // Move top star back
    gsap.to(topStar.position, {
        y: 5.2,
        duration: 2,
        ease: "power2.inOut"
    });
    
    // Hide photos
    photos.forEach((photo, i) => {
        gsap.to(photo.scale, {
            x: 0, y: 0, z: 0,
            duration: 1,
            delay: i * 0.02,
            ease: "power2.in",
            onComplete: () => { photo.visible = false; }
        });
    });
    
    // Camera movement - restore to original position and look at tree
    gsap.to(camera.position, {
        x: 0,
        y: 2,
        z: 8,
        duration: 2.5,
        ease: "power2.inOut",
        // Update camera lookAt every frame during animation
        onUpdate: () => {
            camera.lookAt(0, 2, 0);
        }
    });
    
    // Update camera target for drag/zoom functionality
    cameraTarget.set(0, 2, 0);
    
    // Ensure camera looks at tree at the end of animation
    gsap.delayedCall(2.5, () => {
        camera.lookAt(0, 2, 0);
    });
    
    // Show title
    gsap.to('#title', { opacity: 1, duration: 1, delay: 2 });
    
    // Reset particle system and ornament group rotation
    gsap.to([particleSystem.rotation, ornamentGroup.rotation], {
        y: 0,
        duration: 2,
        ease: "power2.inOut"
    });
    
    // Transition to tree phase
    setTimeout(() => {
        store.setState({ phase: 'tree' });
        updateUI('tree');
    }, 2500);
}

function rotateCarousel(direction) {
    const state = store.getState();
    if (state.phase !== 'nebula') return;
    
    const newRotation = state.carouselRotation + direction * (Math.PI * 2 / PHOTO_COUNT);
    
    // Animate photo group with GSAP
    gsap.to(photoGroup.rotation, {
        y: newRotation,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: function() {
            // Update state during animation to keep it in sync
            store.setState({ carouselRotation: photoGroup.rotation.y });
        },
        onComplete: function() {
            // Ensure final state is accurate
            store.setState({ carouselRotation: newRotation });
        }
    });
}

// ============================================
// EVENT HANDLERS
// ============================================

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseUp() {
    isDragging = false;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    store.setState({ mousePosition: { x: mouse.x, y: mouse.y } });
    
    // Handle camera dragging
    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };
        
        // Calculate rotation speed based on screen size
        const rotationSpeed = 0.005;
        
        // Create a vector from camera to target
        const cameraToTarget = new THREE.Vector3().subVectors(camera.position, cameraTarget);
        
        // Calculate distance from camera to target
        const distance = cameraToTarget.length();
        
        // Rotate around target
        const quaternionX = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -deltaMove.x * rotationSpeed
        );
        
        const quaternionY = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            -deltaMove.y * rotationSpeed
        );
        
        cameraToTarget.applyQuaternion(quaternionX);
        cameraToTarget.applyQuaternion(quaternionY);
        
        // Set new camera position
        camera.position.copy(cameraTarget).add(cameraToTarget);
        
        // Update camera lookAt
        camera.lookAt(cameraTarget);
        
        // Update previous mouse position
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
}

function onClick(event) {
    const state = store.getState();
    if (state.phase !== 'nebula') return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(photoGroup.children, true);
    
    if (intersects.length > 0) {
        // Find the parent frame of the clicked photo
        let clickedObject = intersects[0].object;
        let frame = clickedObject;
        while (frame && !frame.userData.index) {
            frame = frame.parent;
        }
        if (frame) {
            focusOnPhoto(frame);
        }
    }
}

function onWheel(event) {
    event.preventDefault();
    
    // Calculate zoom speed
    const zoomSpeed = 0.1;
    
    // Create a vector from camera to target
    const cameraToTarget = new THREE.Vector3().subVectors(camera.position, cameraTarget);
    
    // Calculate distance from camera to target
    let distance = cameraToTarget.length();
    
    // Calculate new distance based on wheel delta
    const delta = event.deltaY > 0 ? zoomSpeed : -zoomSpeed;
    distance = Math.max(5, Math.min(30, distance + delta));
    
    // Normalize the vector and multiply by new distance
    cameraToTarget.normalize().multiplyScalar(distance);
    
    // Set new camera position
    camera.position.copy(cameraTarget).add(cameraToTarget);
    
    // Update camera lookAt
    camera.lookAt(cameraTarget);
}

function onDoubleClick() {
    // Reset camera to original position and lookAt
    gsap.to(camera.position, {
        x: cameraOriginalPosition.x,
        y: cameraOriginalPosition.y,
        z: cameraOriginalPosition.z,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
            camera.lookAt(cameraOriginalLookAt);
        }
    });
    
    // Reset camera target
    cameraTarget.copy(cameraOriginalLookAt);
}

function focusOnPhoto(photo) {
    // Calculate camera position relative to the photo
    const photoPosition = photo.position.clone();
    const photoDirection = photo.position.clone().normalize();
    
    // Set camera position to be in front of the photo, looking at it - closer distance
    const targetCameraPosition = photoPosition.clone();
    targetCameraPosition.add(photoDirection.multiplyScalar(-3)); // Move camera 2 units back from the photo (closer than before)
    
    // Set camera to look at the photo
    const targetLookAt = photoPosition.clone();
    
    // Update camera target for drag/zoom functionality
    cameraTarget.copy(targetLookAt);
    
    // Animate camera position
    gsap.to(camera.position, {
        x: targetCameraPosition.x,
        y: targetCameraPosition.y,
        z: targetCameraPosition.z,
        duration: 1.5,
        ease: "power2.inOut",
        // Update camera rotation every frame to look at the photo
        onUpdate: () => {
            camera.lookAt(targetLookAt);
        }
    });
    
    // Ensure camera looks at the photo at the end of the animation
    gsap.delayedCall(1.5, () => {
        camera.lookAt(targetLookAt);
    });
}

function updateUI(phase) {
    const phaseText = document.getElementById('phase-text');
    const instructionText = document.getElementById('instruction-text');
    const hintText = document.getElementById('interaction-hint');
    
    phaseText.textContent = `Phase: ${phase.charAt(0).toUpperCase() + phase.slice(1)}`;
    
    switch(phase) {
        case 'tree':
            instructionText.textContent = 'O: Explode | C: Reset';
            hintText.textContent = 'Move mouse over the tree for ripple effect';
            break;
        case 'blooming':
            instructionText.textContent = '⏳ Transforming...';
            hintText.textContent = '';
            break;
        case 'nebula':
            instructionText.textContent = 'O: Explode | C: Reset | ←→: Rotate';
            hintText.textContent = 'Click on photos to focus | Use arrow keys to rotate carousel';
            break;
        case 'collapsing':
            instructionText.textContent = '⏳ Returning...';
            hintText.textContent = '';
            break;
    }
}

















// ============================================
// UI EVENT LISTENERS
// ============================================



// Keyboard shortcuts for testing
document.addEventListener('keydown', (e) => {
    if (e.key === 'o' || e.key === 'O') {
        triggerBlooming();
    } else if (e.key === 'c' || e.key === 'C') {
        triggerCollapsing();
    } else if (e.key === 'ArrowLeft') {
        rotateCarousel(-1);
    } else if (e.key === 'ArrowRight') {
        rotateCarousel(1);
    } else if (e.key === 'r' || e.key === 'R') {
        onDoubleClick();
    }
});

// Music player with actual audio
const backgroundMusic = document.getElementById('background-music');
let isPlaying = false;
const musicIcon = document.getElementById('music-icon');
const musicTitle = document.getElementById('music-title');
const musicToggle = document.getElementById('music-toggle');
const playPauseIcon = document.getElementById('play-pause-icon');

document.getElementById('music-toggle').addEventListener('click', () => {
    toggleMusic();
});

function toggleMusic() {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        backgroundMusic.play().catch(error => {
            console.error('Failed to play music:', error);
            isPlaying = false;
        });
    } else {
        backgroundMusic.pause();
    }
    
    // Update UI
    updateMusicUI();
}

function updateMusicUI() {
    // Update icon rotation
    if (isPlaying) {
        musicIcon.classList.add('rotating');
    } else {
        musicIcon.classList.remove('rotating');
    }
    
    // Update title marquee
    if (isPlaying) {
        musicTitle.classList.add('marquee');
    } else {
        musicTitle.classList.remove('marquee');
    }
    
    // Update button style and breathing effect
    if (isPlaying) {
        musicToggle.classList.add('breathing');
        musicToggle.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,107,107,0.3))';
    } else {
        musicToggle.classList.remove('breathing');
        musicToggle.style.background = 'rgba(255,255,255,0.1)';
    }
    
    // Update play/pause icon
    if (isPlaying) {
        playPauseIcon.textContent = '⏸';
    } else {
        playPauseIcon.textContent = '▶';
    }
}

// ============================================
// INITIALIZE
// ============================================

// Use async IIFE to properly await async functions
(async () => {
    await init();
    
    // Initialize hand gesture detection
    await initHandGestureDetection();
    
    // Set up gesture event listener
    document.addEventListener('gesture', (event) => {
        const gesture = event.detail.gesture;
        handleGesture(gesture);
    });
    
    // Set up swipe event listener for carousel rotation
    document.addEventListener('swipe', (event) => {
        const direction = event.detail.direction;
        handleSwipe(direction);
    });
    
    // Set up camera toggle button
    const cameraToggleBtn = document.getElementById('camera-toggle');
    if (cameraToggleBtn) {
        cameraToggleBtn.addEventListener('click', async () => {
            await toggleCamera();
            
            // Update button style and icon based on camera status
            const isActive = cameraToggleBtn.textContent === '⏸';
            if (isActive) {
                cameraToggleBtn.textContent = '▶';
                cameraToggleBtn.style.backgroundColor = 'rgba(220, 38, 38, 0.7)'; // Red for off
            } else {
                cameraToggleBtn.textContent = '⏸';
                cameraToggleBtn.style.backgroundColor = 'rgba(22, 163, 74, 0.7)'; // Green for on
            }
        });
    }
    
    // Auto play music after initialization
    toggleMusic();
})();

// Handle swipe events for carousel rotation
function handleSwipe(direction) {
    const state = store.getState();
    if (state.phase === 'nebula') {
        // Determine rotation direction (1 for right, -1 for left)
        const rotationDirection = direction === 'right' ? 1 : -1;
        rotateCarousel(rotationDirection);
    }
}

// Handle detected gestures
function handleGesture(gesture) {
    switch(gesture) {
        case 'fist':
            // Fist gesture triggers collapsing
            triggerCollapsing();
            break;
        case 'open_palm':
            // Open palm gesture triggers blooming
            triggerBlooming();
            break;
        case 'thumbs_up':
            // Thumbs up increases tree interaction
            console.log('Thumbs up detected - tree interaction');
            break;
        case 'victory':
            // Victory gesture rotates carousel
            rotateCarousel(1);
            break;
        case 'point':
            // Point gesture focuses on object
            console.log('Point gesture detected - focus object');
            break;
    }
}

// Fade in effect
gsap.from('#title h1', {
    opacity: 0,
    y: 50,
    duration: 2,
    delay: 0.5,
    ease: "power2.out"
});

gsap.from('#status-panel, #music-player', {
    opacity: 0,
    y: -20,
    duration: 1,
    delay: 1,
    stagger: 0.2,
    ease: "power2.out"
});

// ============================================  
// HIDDEN ENVELOPE FEATURE (Keyboard Shortcut: X -> S -> H)  
// ============================================
let currentKeySequence = '';
const SECRET_SEQUENCE = 'xsh';
let isEnvelopeOpen = false;

// Keyboard sequence listener
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Close envelope when pressing 'c'
    if (key === 'c') {
        hideEnvelope();
        return;
    }
    
    // Update current sequence
    currentKeySequence += key;
    
    // Keep only the last 3 characters to match the secret sequence length
    if (currentKeySequence.length > SECRET_SEQUENCE.length) {
        currentKeySequence = currentKeySequence.slice(-SECRET_SEQUENCE.length);
    }
    
    // Check if sequence matches
    if (currentKeySequence === SECRET_SEQUENCE) {
        showEnvelope();
        // Reset sequence to prevent accidental re-triggering
        currentKeySequence = '';
    }
});

// Hide envelope with animation
function hideEnvelope() {
    const envelopeContainer = document.getElementById('envelope-container');
    
    // Animate envelope disappearing
    gsap.to(envelopeContainer, {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: "power2.in",
        onComplete: () => {
            envelopeContainer.style.pointerEvents = 'none';
            resetEnvelope();
        }
    });
}

// Show envelope with animation
function showEnvelope() {
    const envelopeContainer = document.getElementById('envelope-container');
    
    // Reset envelope state if already shown
    resetEnvelope();
    
    // Animate envelope appearing
    gsap.to(envelopeContainer, {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)",
        onStart: () => {
            envelopeContainer.style.pointerEvents = 'auto';
        }
    });
    
    // Add click event listener for opening the envelope
    const envelope = document.getElementById('envelope');
    envelope.addEventListener('click', toggleEnvelope);
}

// Toggle envelope open/close
function toggleEnvelope() {
    if (isEnvelopeOpen) {
        closeEnvelope();
    } else {
        openEnvelope();
    }
}

// Open envelope animation
function openEnvelope() {
    const flap = document.getElementById('envelope-flap');
    const letter = document.getElementById('letter');
    const letterContent = document.getElementById('letter-content');
    const envelopeText = document.getElementById('envelope-text');
    
    // Animate flap opening
    gsap.to(flap, {
        rotationX: -180,
        transformOrigin: 'bottom center',
        duration: 0.6,
        ease: "power2.out"
    });
    
    // Hide envelope text when opening
    gsap.to(envelopeText, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out"
    });
    
    // Animate letter appearing and coming out
    gsap.to(letter, {
        opacity: 1,
        duration: 0.8,
        delay: 0.3,
        ease: "power2.out"
    });
    
    // Animate letter content appearing
    gsap.to(letterContent, {
        opacity: 1,
        duration: 0.5,
        delay: 0.8,
        ease: "power2.out"
    });
    
    isEnvelopeOpen = true;
}

// Close envelope animation
function closeEnvelope() {
    const flap = document.getElementById('envelope-flap');
    const letter = document.getElementById('letter');
    const letterContent = document.getElementById('letter-content');
    const envelopeText = document.getElementById('envelope-text');
    
    // Animate letter content disappearing
    gsap.to(letterContent, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in"
    });
    
    // Animate letter going back in and disappearing
    gsap.to(letter, {
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: "power2.in"
    });
    
    // Animate flap closing
    gsap.to(flap, {
        rotationX: 0,
        transformOrigin: 'bottom center',
        duration: 0.6,
        delay: 0.5,
        ease: "power2.in"
    });
    
    // Show envelope text again when closing
    gsap.to(envelopeText, {
        opacity: 1,
        duration: 0.3,
        delay: 0.8,
        ease: "power2.out"
    });
    
    isEnvelopeOpen = false;
}

// Reset envelope to initial state
function resetEnvelope() {
    const envelopeContainer = document.getElementById('envelope-container');
    const flap = document.getElementById('envelope-flap');
    const letter = document.getElementById('letter');
    const letterContent = document.getElementById('letter-content');
    const envelopeText = document.getElementById('envelope-text');
    
    // Reset styles
    gsap.set(envelopeContainer, {
        opacity: 0,
        scale: 0.8
    });
    
    gsap.set(flap, {
        rotationX: 0,
        transformOrigin: 'bottom center'
    });
    
    gsap.set(letter, {
        y: 0,
        opacity: 0
    });
    
    gsap.set(letterContent, {
        opacity: 0
    });
    
    gsap.set(envelopeText, {
        opacity: 1
    });
    
    isEnvelopeOpen = false;
}