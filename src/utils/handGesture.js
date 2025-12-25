// ============================================// HAND GESTURE DETECTION// ============================================
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as handpose from '@tensorflow-models/handpose';

// Constants
const HAND_PIXEL_THRESHOLD = 0.1;
const GESTURE_DETECTION_INTERVAL = 100; // ms

// Global variables
let videoElement, canvasElement, ctx;
let handposeModel = null;
let isInitialized = false;
let lastGestureTime = 0;
let currentGesture = 'none';
let previousGesture = 'none';

// Gesture states
let isDetecting = true;

// Palm swipe detection variables
let lastPalmPosition = null;
let swipeThreshold = 50; // Minimum distance for swipe detection
let palmSwipeTimeout = 300; // Timeout for swipe detection
let lastSwipeTime = 0;

// Hand landmarks indices
const HAND_LANDMARKS = {
    WRIST: 0,
    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,
    INDEX_FINGER_MCP: 5,
    INDEX_FINGER_PIP: 6,
    INDEX_FINGER_DIP: 7,
    INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_MCP: 9,
    MIDDLE_FINGER_PIP: 10,
    MIDDLE_FINGER_DIP: 11,
    MIDDLE_FINGER_TIP: 12,
    RING_FINGER_MCP: 13,
    RING_FINGER_PIP: 14,
    RING_FINGER_DIP: 15,
    RING_FINGER_TIP: 16,
    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20
};

// Global variables for camera control
let mediaStream = null;
let isCameraActive = false;

// Initialize hand gesture detection without starting camera
async function initHandGestureDetection() {
    try {
        // Get DOM elements
        videoElement = document.getElementById('video');
        canvasElement = document.getElementById('hand-canvas');
        ctx = canvasElement.getContext('2d');

        // Check if media devices are supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            updateGestureInfo('Hand Gesture Detection: Camera not supported');
            return false;
        }

        // Set initial status
        updateGestureInfo('Hand Gesture Detection: Off');
        isInitialized = true;
        
        // Hide video element initially
        videoElement.style.display = 'none';

        return true;
    } catch (error) {
        console.error('Error initializing hand gesture detection:', error);
        updateGestureInfo('Hand Gesture Detection: Failed');
        return false;
    }
}

// Start camera and hand gesture detection
async function startCamera() {
    if (isCameraActive) return true;
    
    try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: 640,
                height: 480,
                frameRate: { ideal: 30, max: 60 }
            }
        });
        
        mediaStream = stream;

        // Set up video element
        videoElement.srcObject = stream;
        await videoElement.play();
        videoElement.style.display = 'block';

        // Load handpose model with progress indication
        updateGestureInfo('Hand Gesture Detection: Loading model...');
        handposeModel = await handpose.load({
            flipHorizontal: true
        });

        // Set canvas size
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        // Start detection loop
        detectHands();

        // Update status
        updateGestureInfo('Hand Gesture Detection: Active');
        isCameraActive = true;

        return true;
    } catch (error) {
        console.error('Error starting camera:', error);
        if (error.name === 'NotAllowedError') {
            updateGestureInfo('Hand Gesture Detection: Camera access denied');
        } else if (error.name === 'NotFoundError') {
            updateGestureInfo('Hand Gesture Detection: No camera found');
        } else {
            updateGestureInfo('Hand Gesture Detection: Failed to start');
        }
        return false;
    }
}

// Stop camera and hand gesture detection
function stopCamera() {
    if (!isCameraActive) return;
    
    // Stop detection loop
    isDetecting = false;
    
    // Stop video stream
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    // Stop video playback
    videoElement.pause();
    videoElement.srcObject = null;
    videoElement.style.display = 'none';
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Update status
    updateGestureInfo('Hand Gesture Detection: Off');
    isCameraActive = false;
    
    // Reset gesture state
    currentGesture = 'none';
    previousGesture = 'none';
    lastPalmPosition = null;
}

// Toggle camera on/off
async function toggleCamera() {
    if (isCameraActive) {
        stopCamera();
    } else {
        await startCamera();
    }
}

// Detect hands in video frames
async function detectHands() {
    if (!isDetecting || !handposeModel) {
        requestAnimationFrame(detectHands);
        return;
    }

    try {
        // Get hand predictions
        const predictions = await handposeModel.estimateHands(videoElement, {
            flipHorizontal: true
        });

        // Clear canvas
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Process predictions
        if (predictions.length > 0) {
            const hand = predictions[0];
            drawHand(hand);
            detectGesture(hand);
        } else {
            // No hand detected
            currentGesture = 'none';
        }
    } catch (error) {
        console.error('Error detecting hands:', error);
    }

    // Continue detection loop
    requestAnimationFrame(detectHands);
}

// Define hand landmarks connections manually
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
    [0, 17], [17, 18], [18, 19], [19, 20]  // Pinky finger
];

// Draw hand landmarks and connections on canvas
function drawHand(hand) {
    const landmarks = hand.landmarks;
    const connections = HAND_CONNECTIONS;

    // Draw connections
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    connections.forEach(connection => {
        const [startIdx, endIdx] = connection;
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();
    });

    // Draw landmarks
    ctx.fillStyle = '#FF6B6B';
    landmarks.forEach(landmark => {
        ctx.beginPath();
        ctx.arc(landmark[0], landmark[1], 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Detect gesture from hand landmarks
function detectGesture(hand) {
    const landmarks = hand.landmarks;
    const now = Date.now();

    // Check if enough time has passed since last gesture detection
    if (now - lastGestureTime < GESTURE_DETECTION_INTERVAL) {
        return;
    }

    // Calculate finger states
    const fingers = {
        thumb: isFingerOpen(landmarks, [HAND_LANDMARKS.THUMB_CMC, HAND_LANDMARKS.THUMB_MCP, HAND_LANDMARKS.THUMB_IP, HAND_LANDMARKS.THUMB_TIP]),
        index: isFingerOpen(landmarks, [HAND_LANDMARKS.INDEX_FINGER_MCP, HAND_LANDMARKS.INDEX_FINGER_PIP, HAND_LANDMARKS.INDEX_FINGER_DIP, HAND_LANDMARKS.INDEX_FINGER_TIP]),
        middle: isFingerOpen(landmarks, [HAND_LANDMARKS.MIDDLE_FINGER_MCP, HAND_LANDMARKS.MIDDLE_FINGER_PIP, HAND_LANDMARKS.MIDDLE_FINGER_DIP, HAND_LANDMARKS.MIDDLE_FINGER_TIP]),
        ring: isFingerOpen(landmarks, [HAND_LANDMARKS.RING_FINGER_MCP, HAND_LANDMARKS.RING_FINGER_PIP, HAND_LANDMARKS.RING_FINGER_DIP, HAND_LANDMARKS.RING_FINGER_TIP]),
        pinky: isFingerOpen(landmarks, [HAND_LANDMARKS.PINKY_MCP, HAND_LANDMARKS.PINKY_PIP, HAND_LANDMARKS.PINKY_DIP, HAND_LANDMARKS.PINKY_TIP])
    };

    // Determine gesture based on finger states
    let gesture = 'none';

    // Fist gesture
    if (!fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
        gesture = 'fist';
        // Reset swipe tracking when fist is detected
        lastPalmPosition = null;
    }
    // Open palm gesture
    else if (fingers.thumb && fingers.index && fingers.middle && fingers.ring && fingers.pinky) {
        gesture = 'open_palm';
        
        // Detect palm swipe direction
        detectPalmSwipe(landmarks, now);
    }
    // Thumbs up gesture
    else if (fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
        gesture = 'thumbs_up';
        lastPalmPosition = null;
    }
    // Victory gesture (index and middle fingers up)
    else if (!fingers.thumb && fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
        gesture = 'victory';
        lastPalmPosition = null;
    }
    // Point gesture (only index finger up)
    else if (!fingers.thumb && fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
        gesture = 'point';
        lastPalmPosition = null;
    }
    else {
        lastPalmPosition = null;
    }

    // Update current gesture
    currentGesture = gesture;

    // Trigger gesture event if gesture changed
    if (currentGesture !== previousGesture) {
        triggerGestureEvent(currentGesture);
        previousGesture = currentGesture;
        lastGestureTime = now;
    }
}

// Detect palm swipe direction
function detectPalmSwipe(landmarks, now) {
    // Calculate palm center as the average of palm landmarks
    const palmLandmarks = [
        HAND_LANDMARKS.WRIST,
        HAND_LANDMARKS.THUMB_CMC,
        HAND_LANDMARKS.INDEX_FINGER_MCP,
        HAND_LANDMARKS.MIDDLE_FINGER_MCP,
        HAND_LANDMARKS.RING_FINGER_MCP,
        HAND_LANDMARKS.PINKY_MCP
    ];
    
    let palmX = 0;
    let palmY = 0;
    
    palmLandmarks.forEach(idx => {
        palmX += landmarks[idx][0];
        palmY += landmarks[idx][1];
    });
    
    palmX /= palmLandmarks.length;
    palmY /= palmLandmarks.length;
    
    const currentPalmPosition = { x: palmX, y: palmY };
    
    // Check if we have a previous palm position
    if (lastPalmPosition && (now - lastSwipeTime) > palmSwipeTimeout) {
        // Calculate swipe distance
        const deltaX = currentPalmPosition.x - lastPalmPosition.x;
        
        // Check if swipe is significant
        if (Math.abs(deltaX) > swipeThreshold) {
            // Determine swipe direction
            const swipeDirection = deltaX > 0 ? 'right' : 'left';
            
            // Trigger swipe event
            triggerSwipeEvent(swipeDirection);
            
            // Update last swipe time
            lastSwipeTime = now;
            
            // Reset last palm position to prevent multiple swipes
            lastPalmPosition = null;
            return;
        }
    }
    
    // Update last palm position
    lastPalmPosition = currentPalmPosition;
}

// Trigger swipe event
function triggerSwipeEvent(direction) {
    // Update UI
    updateGestureInfo(`Hand Gesture Detection: Swipe ${direction}`);
    
    // Create and dispatch custom event
    const event = new CustomEvent('swipe', {
        detail: {
            direction: direction,
            timestamp: Date.now()
        }
    });
    document.dispatchEvent(event);
}

// Check if a finger is open
function isFingerOpen(landmarks, fingerIndices) {
    const [mcp, pip, dip, tip] = fingerIndices;
    const mcpY = landmarks[mcp][1];
    const tipY = landmarks[tip][1];

    // For thumb, use x-coordinate instead of y-coordinate
    if (fingerIndices[0] === HAND_LANDMARKS.THUMB_CMC) {
        const mcpX = landmarks[mcp][0];
        const tipX = landmarks[tip][0];
        return tipX > mcpX;
    }

    // For other fingers, check if tip is above mcp
    return tipY < mcpY;
}

// Trigger gesture event
function triggerGestureEvent(gesture) {
    // Update UI
    updateGestureInfo(`Hand Gesture Detection: ${gesture}`);

    // Create and dispatch custom event
    const event = new CustomEvent('gesture', {
        detail: {
            gesture: gesture,
            timestamp: Date.now()
        }
    });
    document.dispatchEvent(event);
}

// Update gesture info text
function updateGestureInfo(text) {
    const infoElement = document.getElementById('gesture-info');
    if (infoElement) {
        infoElement.textContent = text;
    }
}

// Toggle gesture detection
function toggleGestureDetection() {
    isDetecting = !isDetecting;
    updateGestureInfo(`Hand Gesture Detection: ${isDetecting ? 'Active' : 'Paused'}`);
}

// Get current gesture
function getCurrentGesture() {
    return currentGesture;
}

// Check if hand gesture detection is initialized
function isHandGestureInitialized() {
    return isInitialized;
}

// Export functions and variables
export {
    initHandGestureDetection,
    toggleGestureDetection,
    getCurrentGesture,
    isHandGestureInitialized,
    isDetecting,
    startCamera,
    stopCamera,
    toggleCamera,
    isCameraActive
};
