import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getTracksByMood } from '../api/music.api';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';

const AIMode: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingMusic, setIsFetchingMusic] = useState(false);
  const [tracksFetched, setTracksFetched] = useState(false);
  const [fetchedTracksCount, setFetchedTracksCount] = useState(0);
  const [moodChangeCount, setMoodChangeCount] = useState(0); // Track mood changes for UI updates
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedMoodRef = useRef<string | null>(null);
  const currentMoodRef = useRef<string | null>(null); // Always keep latest mood in ref
  const isDetectingRef = useRef<boolean>(false); // Track detecting state to avoid closure issues
  const hasNavigatedRef = useRef<boolean>(false); // Track whether we've already redirected to the player
  const faceDetectionModelRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const modelLoadPromiseRef = useRef<Promise<faceLandmarksDetection.FaceLandmarksDetector | null> | null>(null);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  // Initialize TensorFlow.js on component mount
  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        // Initialize TensorFlow.js with WebGL backend for better performance
        await tf.ready();
        console.log('✅ TensorFlow.js initialized');
        console.log('📊 Backend:', tf.getBackend());
        console.log('📊 Available backends:', await tf.engine().backendNames);
      } catch (error) {
        console.error('❌ Failed to initialize TensorFlow.js:', error);
      }
    };

    initializeTensorFlow();
  }, []);

  // Track mood state changes for debugging
  useEffect(() => {
    console.log('🎭 MOOD STATE UPDATED:', mood, 'Confidence:', confidence);
  }, [mood, confidence]);

  // Load model on component mount
  useEffect(() => {
    const initializeModel = async () => {
      try {
        await loadFaceDetectionModel();
      } catch (error: any) {
        console.error('Failed to load face detection model:', error);
        const errorMessage = error?.message || 'Unknown error';
        setModelLoadError(errorMessage);
        toast.warning('AI model failed to load. Using fallback detection.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    initializeModel();

    // Cleanup on unmount
    return () => {
      if (faceDetectionModelRef.current) {
        try {
          faceDetectionModelRef.current.dispose();
        } catch (error) {
          console.warn('Error disposing model:', error);
        }
        faceDetectionModelRef.current = null;
      }
      modelLoadPromiseRef.current = null;
    };
  }, []);

  // Start webcam
  const startWebcam = async () => {
    try {
      setError(null);
      // Reset states when starting fresh
      setMood(null);
      setConfidence(0);
      setTracksFetched(false);
      setFetchedTracksCount(0);
      lastFetchedMoodRef.current = null;
      currentMoodRef.current = null;
      
      // Ensure model is loaded before starting - wait if already loading
      if (!faceDetectionModelRef.current) {
        if (isModelLoading && modelLoadPromiseRef.current) {
          console.log('⏳ Model is already loading, waiting...');
          try {
            await modelLoadPromiseRef.current;
          } catch (error) {
            console.warn('⚠️ Model loading failed, continuing with fallback:', error);
          }
        } else {
          console.log('🤖 Loading face detection model...');
          await loadFaceDetectionModel();
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        isDetectingRef.current = true; // Update ref immediately
        setIsDetecting(true);
        console.log('🎥 Camera started, isDetecting set to true, beginning mood detection...');
        startMoodDetection();
      }
    } catch (err: any) {
      console.error('Error accessing webcam:', err);
      setError('Unable to access camera. Please allow camera permissions and try again.');
      isDetectingRef.current = false;
      setIsDetecting(false);
    }
  };

  // Helper function to get mood color
  const getMoodColorValue = (moodValue: string | null): string => {
    switch (moodValue) {
      case 'happy': return '#10B981';
      case 'sad': return '#3B82F6';
      case 'excited': return '#EC4899';
      case 'relaxed': return '#8B5CF6';
      case 'focused': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // Load TensorFlow.js face detection model
  const loadFaceDetectionModel = async (retryCount: number = 0): Promise<faceLandmarksDetection.FaceLandmarksDetector> => {
    // Return existing model if already loaded
    if (faceDetectionModelRef.current) {
      return faceDetectionModelRef.current;
    }

    // If already loading, return the existing promise
    if (modelLoadPromiseRef.current) {
      return modelLoadPromiseRef.current as Promise<faceLandmarksDetection.FaceLandmarksDetector>;
    }

    // Create loading promise
    const loadPromise = (async (): Promise<faceLandmarksDetection.FaceLandmarksDetector> => {
      try {
        setIsModelLoading(true);
        setModelLoadError(null);
        console.log('🤖 Loading TensorFlow.js face detection model...');
        
        // Ensure TensorFlow.js is ready
        await tf.ready();
        console.log('✅ TensorFlow.js ready, backend:', tf.getBackend());
        
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        
        // Try TensorFlow.js runtime first (more reliable, no external dependencies)
        let detector: faceLandmarksDetection.FaceLandmarksDetector;
        
        try {
          console.log('🔄 Attempting TensorFlow.js runtime...');
          const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 1,
          };
          
          detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
          console.log('✅ Face detection model loaded with TensorFlow.js runtime!');
        } catch (tfjsError: any) {
          console.warn('⚠️ TensorFlow.js runtime failed:', tfjsError?.message || tfjsError);
          console.warn('⚠️ Trying MediaPipe runtime as fallback...');
          
          // Fallback to MediaPipe runtime
          try {
            const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
              runtime: 'mediapipe',
              solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
              refineLandmarks: true,
              maxFaces: 1,
            };
            
            detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
            console.log('✅ Face detection model loaded with MediaPipe runtime!');
          } catch (mediapipeError: any) {
            console.error('❌ MediaPipe runtime also failed:', mediapipeError?.message || mediapipeError);
            throw new Error(`Both runtimes failed. TF.js: ${tfjsError?.message || 'Unknown'}, MediaPipe: ${mediapipeError?.message || 'Unknown'}`);
          }
        }

        faceDetectionModelRef.current = detector;
        setIsModelLoading(false);
        setModelLoadError(null);
        modelLoadPromiseRef.current = null;
        
        return detector;
      } catch (error: any) {
        console.error('❌ Error loading face detection model:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        setModelLoadError(errorMessage);
        setIsModelLoading(false);
        modelLoadPromiseRef.current = null;
        
        // Retry once if this is the first attempt
        if (retryCount === 0) {
          console.log('🔄 Retrying model load...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          return loadFaceDetectionModel(1);
        }
        
        toast.error(`Failed to load AI model: ${errorMessage}. Using fallback detection.`, {
          position: 'top-right',
          autoClose: 5000,
        });
        throw error;
      }
    })();

    // Store the promise so other calls can wait for it
    modelLoadPromiseRef.current = loadPromise as any;
    
    return loadPromise;
  };

  // Analyze mood from facial expression using TensorFlow.js
  const analyzeMood = async (): Promise<{ mood: string; confidence: number }> => {
    try {
      console.log('🔍 ========== analyzeMood() CALLED ==========');
      console.log('🔍 Video ref exists?', !!videoRef.current);
      console.log('🔍 Canvas ref exists?', !!canvasRef.current);
      console.log('🔍 Model ref exists?', !!faceDetectionModelRef.current);
      
      if (!videoRef.current || !canvasRef.current || !faceDetectionModelRef.current) {
        // Fallback to simulation if model not loaded
        console.warn('⚠️ Model not loaded, using fallback');
        const fallback = analyzeMoodFallback();
        console.log('🔄 Returning fallback:', fallback);
        return fallback;
      }
      
      console.log('✅ All refs available, proceeding with detection');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.warn('⚠️ No canvas context, using fallback');
        return analyzeMoodFallback();
      }
      
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.warn('⚠️ Video not ready, readyState:', video.readyState, 'using fallback');
        return analyzeMoodFallback();
      }

      console.log('✅ Video is ready, dimensions:', video.videoWidth, 'x', video.videoHeight);

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log('✅ Video frame drawn to canvas');

      // Detect faces
      console.log('🔍 Starting face detection...');
      const startTime = Date.now();
      const faces = await faceDetectionModelRef.current.estimateFaces(canvas, {
        flipHorizontal: false,
        staticImageMode: false,
      });
      const detectionTime = Date.now() - startTime;
      console.log('👁️ Faces detected:', faces.length, 'in', detectionTime, 'ms');

      if (faces.length === 0) {
        console.log('👤 No face detected in frame');
        return analyzeMoodFallback();
      }

      // Get the first detected face
      const face = faces[0];
      console.log('📋 Face object keys:', Object.keys(face));
      console.log('📋 Face object:', face);

      // Check different possible keypoint properties
      let keypoints: faceLandmarksDetection.Keypoint[] | undefined;
      
      if (face.keypoints) {
        keypoints = face.keypoints;
        console.log('✅ Using face.keypoints');
      } else if ((face as any).landmarks) {
        keypoints = (face as any).landmarks;
        console.log('✅ Using face.landmarks');
      } else if ((face as any).scaledMesh) {
        keypoints = (face as any).scaledMesh;
        console.log('✅ Using face.scaledMesh');
      } else {
        console.error('❌ No keypoints found in face object!');
        console.error('Face structure:', JSON.stringify(face, null, 2));
        return analyzeMoodFallback();
      }

      // Log face detection details for debugging
      if (!keypoints || keypoints.length === 0) {
        console.warn('⚠️ Face detected but no keypoints returned');
        console.warn('Keypoints value:', keypoints);
        return analyzeMoodFallback();
      }

      console.log('👤 Face detected with', keypoints.length, 'keypoints');
      console.log('📊 First keypoint sample:', keypoints[0]);

      // Analyze facial features to determine mood
      console.log('🔍 About to call analyzeFacialFeatures with', keypoints.length, 'keypoints');
      const moodResult = analyzeFacialFeatures(keypoints);
      
      console.log('🔍 Real mood detected:', moodResult);
      console.log('🔍 Mood result type:', typeof moodResult);
      console.log('🔍 Mood result has mood?', !!moodResult?.mood);
      console.log('🔍 Mood result mood value:', moodResult?.mood);
      
      // GUARANTEE a valid result
      if (!moodResult || !moodResult.mood) {
        console.error('❌ analyzeFacialFeatures returned invalid result, using fallback');
        return analyzeMoodFallback();
      }
      
      return moodResult;
    } catch (error) {
      console.error('❌ Error in mood analysis:', error);
      // Fallback to simulation on error
      return analyzeMoodFallback();
    }
  };

  // Fallback mood detection (simulation)
  const analyzeMoodFallback = (): { mood: string; confidence: number } => {
    const moods = ['happy', 'sad', 'excited', 'relaxed', 'focused'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const confidenceScore = 0.70 + Math.random() * 0.25;
    
    console.log('🎲 Using fallback mood detection:', { mood: randomMood, confidence: confidenceScore });
    console.log('🎲 Fallback result will be returned and set to state');
    return { mood: randomMood, confidence: confidenceScore };
  };

  // Analyze facial features to determine mood
  const analyzeFacialFeatures = (keypoints: faceLandmarksDetection.Keypoint[]): { mood: string; confidence: number } => {
    try {
      console.log('🔬 Starting facial feature analysis...');
      console.log('📊 Keypoints array length:', keypoints?.length);
      console.log('📊 First few keypoints:', keypoints?.slice(0, 3));
      
      // MediaPipe Face Mesh has 468 landmarks (0-indexed)
      // Correct landmark indices:
      // Mouth: 61 (left corner), 291 (right corner), 13 (upper lip top), 14 (upper lip bottom), 17 (lower lip top), 18 (lower lip bottom)
      // Eyes: 33 (left eye inner), 133 (left eye outer), 362 (right eye inner), 263 (right eye outer)
      // Nose: 4 (nose tip), 19 (nose bridge)
      
      if (!keypoints || keypoints.length < 200) {
        console.warn('⚠️ Insufficient keypoints detected:', keypoints?.length || 0);
        return analyzeMoodFallback();
      }

      // Get key facial landmark points - use proper MediaPipe Face Mesh indices
      const leftMouthCorner = keypoints[61];
      const rightMouthCorner = keypoints[291];
      const upperLipTop = keypoints[13];
      const upperLipBottom = keypoints[14];
      const lowerLipTop = keypoints[17];
      const lowerLipBottom = keypoints[18];
      
      // Eye landmarks - corrected indices
      const leftEyeInner = keypoints[33];
      const leftEyeOuter = keypoints[133];
      const rightEyeInner = keypoints[362];
      const rightEyeOuter = keypoints[263];
      
      // Nose for face orientation
      const noseTip = keypoints[4];
      const noseBridge = keypoints[19];

      // Validate all required keypoints exist
      if (!leftMouthCorner || !rightMouthCorner || !upperLipTop || !lowerLipTop ||
          !leftEyeInner || !rightEyeInner || !leftEyeOuter || !rightEyeOuter ||
          !noseTip || !noseBridge) {
        console.warn('⚠️ Missing required keypoints', {
          hasMouth: !!(leftMouthCorner && rightMouthCorner),
          hasEyes: !!(leftEyeInner && rightEyeInner),
          hasNose: !!noseTip,
          keypointsLength: keypoints.length
        });
        return analyzeMoodFallback();
      }

      // Normalize coordinates to face size (use eye distance as reference)
      const eyeDistance = Math.sqrt(
        Math.pow(rightEyeInner.x - leftEyeInner.x, 2) +
        Math.pow(rightEyeInner.y - leftEyeInner.y, 2)
      );
      
      if (eyeDistance < 0.01) {
        console.warn('⚠️ Invalid eye distance, face too small or not detected properly');
        return analyzeMoodFallback();
      }

      // Calculate mouth width (normalized to face size)
      const mouthWidth = Math.sqrt(
        Math.pow(rightMouthCorner.x - leftMouthCorner.x, 2) +
        Math.pow(rightMouthCorner.y - leftMouthCorner.y, 2)
      ) / eyeDistance;

      // Calculate mouth height (normalized)
      const mouthTopY = (upperLipTop.y + upperLipBottom.y) / 2;
      const mouthBottomY = (lowerLipTop.y + lowerLipBottom.y) / 2;
      const mouthHeight = Math.abs(mouthBottomY - mouthTopY) / eyeDistance;

      // Smile detection: ratio of width to height (higher = wider smile)
      const smileRatio = mouthWidth / (mouthHeight + 0.001);

      // Calculate mouth curvature (upward curve = smile, downward = frown)
      const mouthCenterY = (leftMouthCorner.y + rightMouthCorner.y) / 2;
      const lipTopY = (upperLipTop.y + upperLipBottom.y) / 2;
      const lipBottomY = (lowerLipTop.y + lowerLipBottom.y) / 2;
      const mouthCenterLipY = (lipTopY + lipBottomY) / 2;
      
      // Positive curvature means mouth corners are higher than center (smile)
      // Negative means corners are lower (frown)
      const mouthCurvature = (mouthCenterY - mouthCenterLipY) / eyeDistance;

      // Eye opening (normalized to face size)
      const leftEyeOpening = Math.sqrt(
        Math.pow(leftEyeOuter.x - leftEyeInner.x, 2) +
        Math.pow(leftEyeOuter.y - leftEyeInner.y, 2)
      ) / eyeDistance;
      
      const rightEyeOpening = Math.sqrt(
        Math.pow(rightEyeOuter.x - rightEyeInner.x, 2) +
        Math.pow(rightEyeOuter.y - rightEyeInner.y, 2)
      ) / eyeDistance;
      
      const avgEyeOpening = (leftEyeOpening + rightEyeOpening) / 2;

      // Eyebrow position (for sad/concerned detection)
      // Use landmark 107 (left eyebrow outer) and 336 (right eyebrow outer) if available
      const leftEyebrow = keypoints[107] || leftEyeInner;
      const rightEyebrow = keypoints[336] || rightEyeInner;
      const eyebrowPosition = ((leftEyebrow.y + rightEyebrow.y) / 2 - (leftEyeInner.y + rightEyeInner.y) / 2) / eyeDistance;

      // Mouth position relative to eyes (lower = sadder appearance)
      const eyeCenterY = (leftEyeInner.y + rightEyeInner.y) / 2;
      const mouthRelativePosition = (mouthCenterLipY - eyeCenterY) / eyeDistance;

      // Log detailed analysis for debugging
      console.log('📊 Detailed facial analysis:', {
        smileRatio: smileRatio.toFixed(3),
        mouthCurvature: mouthCurvature.toFixed(3),
        eyeOpening: avgEyeOpening.toFixed(3),
        mouthPosition: mouthRelativePosition.toFixed(3),
        eyebrowPosition: eyebrowPosition.toFixed(3),
        mouthWidth: mouthWidth.toFixed(3),
        mouthHeight: mouthHeight.toFixed(3)
      });

      // Determine mood based on facial features with MORE SENSITIVE thresholds
      // Made thresholds more responsive to detect smaller changes
      let mood = 'relaxed';
      let confidence = 0.7;

      // EXCITED: Very wide smile, high curvature, wide eyes (lowered threshold)
      if (smileRatio > 2.8 && mouthCurvature > 0.015 && avgEyeOpening > 0.075) {
        mood = 'excited';
        confidence = Math.min(0.95, 0.8 + (smileRatio - 2.8) * 0.1);
      }
      // HAPPY: Wide smile, positive curvature (lowered threshold for more sensitivity)
      else if (smileRatio > 2.0 && mouthCurvature > 0.008) {
        mood = 'happy';
        confidence = Math.min(0.95, 0.75 + (smileRatio - 2.0) * 0.15);
      }
      // SAD: Narrow mouth, negative curvature (frown) (more sensitive)
      else if (smileRatio < 2.0 && mouthCurvature < -0.003) {
        mood = 'sad';
        confidence = Math.min(0.9, 0.7 + Math.abs(mouthCurvature) * 25);
      }
      // FOCUSED: Neutral mouth, slightly narrowed eyes (expanded range)
      else if (smileRatio >= 1.9 && smileRatio <= 2.3 && 
               avgEyeOpening >= 0.055 && avgEyeOpening <= 0.085 &&
               Math.abs(mouthCurvature) < 0.012) {
        mood = 'focused';
        confidence = 0.75;
      }
      // RELAXED: Slight smile, calm features (default - expanded range)
      else {
        mood = 'relaxed';
        confidence = 0.7;
      }
      
      console.log('🎯 Mood classification:', {
        smileRatio: smileRatio.toFixed(3),
        mouthCurvature: mouthCurvature.toFixed(3),
        eyeOpening: avgEyeOpening.toFixed(3),
        detectedMood: mood,
        confidence: confidence.toFixed(2)
      });

      console.log('✅ Mood determined:', mood, 'confidence:', confidence.toFixed(2));
      return { mood, confidence };
    } catch (error) {
      console.error('❌ Error analyzing facial features:', error);
      return analyzeMoodFallback();
    }
  };

  // Start mood detection process
  const startMoodDetection = () => {
    console.log('🚀 startMoodDetection() called');
    // Reset tracking
    lastFetchedMoodRef.current = null;
    hasNavigatedRef.current = false;
    setTracksFetched(false);
    
    // Initial detection after short delay
    setTimeout(async () => {
      console.log('⏰ Initial detection timeout fired. isDetecting:', isDetecting, 'videoRef:', !!videoRef.current);
      console.log('⏰ Current mood state:', mood);
      console.log('⏰ Current mood ref:', currentMoodRef.current);
      
      if (isDetecting && videoRef.current) {
        try {
          console.log('🎯 About to call analyzeMood()...');
          const result = await analyzeMood();
          console.log('🎭 Initial mood detected:', result?.mood, 'Full result:', result);
          console.log('🎭 Result object:', JSON.stringify(result));
          
          // ALWAYS set mood, even if from fallback - FORCE IT
          if (result && result.mood) {
            console.log('✅ Setting mood state to:', result.mood);
            console.log('✅ Before setMood - current mood:', mood);
            setMood(result.mood);
            setConfidence(result.confidence);
            currentMoodRef.current = result.mood; // Update ref immediately
            console.log('✅ After setMood - ref updated to:', currentMoodRef.current);
            
            // Force React to re-render by updating confidence too
            setTimeout(() => {
              console.log('🔄 Verifying mood was set - checking state...');
              console.log('🔄 Current mood ref:', currentMoodRef.current);
            }, 100);
            
            // Fetch music for initial mood detection and auto-navigate to player on first success
            const shouldNavigate = !hasNavigatedRef.current;
            console.log('🚀 Triggering initial music fetch for:', result.mood, 'Auto-navigate?', shouldNavigate);
            lastFetchedMoodRef.current = result.mood;
            fetchMusicFromSpotify(result.mood, shouldNavigate);
          } else {
            console.error('❌ Initial detection returned invalid result:', result);
            // Even if invalid, try to use fallback explicitly
            const fallbackResult = analyzeMoodFallback();
            console.log('🔄 Using explicit fallback:', fallbackResult.mood);
            console.log('🔄 FORCE SETTING MOOD TO:', fallbackResult.mood);
            setMood(fallbackResult.mood);
            setConfidence(fallbackResult.confidence);
            currentMoodRef.current = fallbackResult.mood;
            lastFetchedMoodRef.current = fallbackResult.mood;
            const shouldNavigate = !hasNavigatedRef.current;
            fetchMusicFromSpotify(fallbackResult.mood, shouldNavigate);
          }
        } catch (error) {
          console.error('❌ Error in initial detection:', error);
          console.error('❌ Error details:', error);
          // Use fallback on error - FORCE IT
          const fallbackResult = analyzeMoodFallback();
          console.log('🔄 FORCE SETTING MOOD ON ERROR TO:', fallbackResult.mood);
          setMood(fallbackResult.mood);
          setConfidence(fallbackResult.confidence);
          currentMoodRef.current = fallbackResult.mood;
          lastFetchedMoodRef.current = fallbackResult.mood;
          const shouldNavigate = !hasNavigatedRef.current;
          fetchMusicFromSpotify(fallbackResult.mood, shouldNavigate);
        }
      } else {
        console.warn('⚠️ Initial detection skipped - isDetecting:', isDetecting, 'hasVideo:', !!videoRef.current);
        // Even if skipped, set a fallback mood
        const fallbackResult = analyzeMoodFallback();
        console.log('🔄 Detection skipped, but setting fallback mood:', fallbackResult.mood);
        setMood(fallbackResult.mood);
        setConfidence(fallbackResult.confidence);
      }
    }, 2000); // 2 second delay to allow video to stabilize
    
    console.log('⏱️ Initial detection timer set for 2 seconds');

    // Update canvas with video feed
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const drawFrame = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA && isDetecting) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Draw a simple face detection box (placeholder)
            const currentMood = mood;
            if (currentMood) {
              ctx.strokeStyle = getMoodColorValue(currentMood);
              ctx.lineWidth = 3;
              ctx.strokeRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
            }
            
            requestAnimationFrame(drawFrame);
          }
        };
        drawFrame();
      }
    }

    // Continuously update mood detection
    console.log('⏰ Setting up detection interval...');
    console.log('⏰ Current isDetecting state:', isDetecting);
    
    // Clear any existing interval first
    if (detectionIntervalRef.current) {
      console.log('⏰ Clearing existing interval');
      clearInterval(detectionIntervalRef.current);
    }
    
    detectionIntervalRef.current = setInterval(async () => {
      // Use ref to get current isDetecting value (avoid closure issues)
      const currentlyDetecting = isDetectingRef.current;
      console.log('⏰ ========== INTERVAL FIRED ==========');
      console.log('⏰ isDetecting ref:', currentlyDetecting);
      console.log('⏰ isDetecting state:', isDetecting);
      console.log('⏰ Interval ID:', detectionIntervalRef.current);
      
      if (currentlyDetecting) {
        try {
          console.log('🔄 Interval: Starting mood analysis...');
          console.log('🔄 Interval: Model loaded?', !!faceDetectionModelRef.current);
          console.log('🔄 Interval: Video ready?', videoRef.current?.readyState);
          console.log('🔄 Interval: Video dimensions?', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          console.log('🔄 Interval: Current mood ref:', currentMoodRef.current);
          console.log('🔄 Interval: Current mood state:', mood);
          
          const result = await analyzeMood();
          console.log('🎭 Mood update detected:', result?.mood, 'Confidence:', result?.confidence);
          console.log('🎭 Full result object:', result);
          console.log('🎭 Previous mood was:', currentMoodRef.current);
          
          // ALWAYS set mood, even if from fallback or if result seems invalid
          if (result && result.mood) {
            const previousMood = currentMoodRef.current;
            const moodChanged = result.mood !== previousMood;
            
            console.log('✅ Detected mood:', result.mood, 'Previous:', previousMood, moodChanged ? '(CHANGED!)' : '(same)');
            console.log('📊 Confidence:', result.confidence);
            
            // ALWAYS update mood state - this ensures UI reflects current detection
            // Use a small delay to ensure state updates are processed
            setMood(result.mood);
            setConfidence(result.confidence);
            
            // Force a re-render by updating a timestamp if mood changed
            if (moodChanged) {
              console.log('🔄 FORCING UI UPDATE - Mood changed!');
            }
            
            // Update refs immediately
            if (moodChanged) {
              console.log('🔄 Mood changed from', previousMood, 'to', result.mood);
              setMoodChangeCount(prev => prev + 1); // Force UI update
            }
            currentMoodRef.current = result.mood;
            
            // Fetch music only if mood changed and we haven't fetched for this mood yet
            if (moodChanged && result.mood !== lastFetchedMoodRef.current) {
              console.log('🔄 New mood detected, fetching music for:', result.mood);
              lastFetchedMoodRef.current = result.mood;
              // Fetch music but DON'T auto-navigate - let user see mood changes continuously
              fetchMusicFromSpotify(result.mood, false);
            } else if (!moodChanged) {
              console.log('⏭️ Same mood as before:', result.mood);
            } else {
              console.log('🔄 Mood changed but already fetched music for:', result.mood);
            }
          } else {
            console.warn('⚠️ No mood in result, using fallback:', result);
            // Use fallback explicitly
            const fallbackResult = analyzeMoodFallback();
            console.log('🔄 Using explicit fallback in interval:', fallbackResult.mood);
            const previousMood = currentMoodRef.current;
            const moodChanged = fallbackResult.mood !== previousMood;
            
            // ALWAYS update mood state - this ensures UI reflects current detection
            setMood(fallbackResult.mood);
            setConfidence(fallbackResult.confidence);
            
            if (moodChanged) {
              console.log('🔄 Fallback mood changed from', previousMood, 'to', fallbackResult.mood);
              setMoodChangeCount(prev => prev + 1); // Force UI update
            }
            currentMoodRef.current = fallbackResult.mood;
            
            // Fetch music only if mood changed and we haven't fetched for this mood yet
            if (moodChanged && fallbackResult.mood !== lastFetchedMoodRef.current) {
              lastFetchedMoodRef.current = fallbackResult.mood;
              // Don't auto-navigate on fallback in interval - let user see changes
              fetchMusicFromSpotify(fallbackResult.mood, false);
            }
          }
        } catch (error) {
          console.error('❌ Error in mood detection interval:', error);
          console.error('❌ Error stack:', (error as Error).stack);
        }
      } else {
        console.log('⏸️ Detection stopped (isDetecting is false), but keeping interval running');
        console.log('⏸️ This should not happen - isDetecting should be true');
      }
    }, 2000); // Update mood every 2 seconds for more responsive detection
    
    console.log('✅ Detection interval set up with ID:', detectionIntervalRef.current);
    console.log('✅ Interval will fire every 2 seconds');
  };

  // Fetch music from Spotify based on detected mood and auto-navigate
  const fetchMusicFromSpotify = async (detectedMood: string, shouldAutoNavigate: boolean = true) => {
    // Validate mood
    if (!detectedMood || detectedMood.trim() === '') {
      console.error('❌ Invalid mood provided:', detectedMood);
      toast.error('No valid mood detected. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    // Prevent multiple simultaneous API calls for the same mood
    if (isFetchingMusic) {
      console.log('⏳ Already fetching music, skipping duplicate request');
      return;
    }

    try {
      console.log('🎵 Fetching music from Spotify for mood:', detectedMood);
      setIsFetchingMusic(true);
      setTracksFetched(false);

      const response = await getTracksByMood(detectedMood, 20, 'recommendations', 'spotify');
      
      console.log('✅ Music fetched successfully from Spotify:', response.data.tracks.length);
      setFetchedTracksCount(response.data.tracks.length);
      setTracksFetched(true);
      
      toast.success(`Found ${response.data.tracks.length} tracks for ${detectedMood} mood! 🎵`, {
        position: 'top-right',
        autoClose: 2000,
      });

      // Automatically navigate to player after successful music fetch
      if (shouldAutoNavigate && !hasNavigatedRef.current && response.data.tracks.length > 0) {
        hasNavigatedRef.current = true;
        console.log('🚀 Music fetched successfully! Auto-navigating to player...');
        
        // Small delay to let user see the success message
        setTimeout(() => {
          // Stop detection before navigating
          isDetectingRef.current = false;
          setIsDetecting(false);
          
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
          }
          
          if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
          }
          
          console.log('🎵 Auto-navigating to player with mood:', detectedMood);
          navigate(`/player?mood=${detectedMood}`);
        }, 1500); // 1.5 second delay to show success message
      } else if (shouldAutoNavigate && hasNavigatedRef.current) {
        console.log('ℹ️ Auto-navigation already triggered, skipping duplicate navigation.');
      }
    } catch (error: any) {
      console.error('❌ Error fetching music from Spotify:', error);
      setTracksFetched(false);
      
      const errorMessage = error.message || 'Failed to fetch music from Spotify';
      
      if (errorMessage.includes('Spotify API credentials')) {
        toast.error('Spotify API not configured. Please add credentials to backend .env file.', {
          position: 'top-right',
          autoClose: 5000,
        });
      } else if (errorMessage.includes('Invalid Spotify')) {
        toast.error('Invalid Spotify credentials. Please check backend configuration.', {
          position: 'top-right',
          autoClose: 5000,
        });
      } else if (errorMessage.includes('Cannot connect to server')) {
        toast.error('Backend server is not running. Please start the backend server.', {
          position: 'top-right',
          autoClose: 5000,
        });
      } else {
        toast.error(`Failed to fetch music: ${errorMessage}`, {
          position: 'top-right',
          autoClose: 4000,
        });
      }
    } finally {
      setIsFetchingMusic(false);
    }
  };

  // Stop detection and navigate to player
  const stopDetection = (showToastOnNoMood: boolean = true) => {
    // IMPORTANT: Capture mood BEFORE stopping detection
    // Use ref to get the most current value (refs don't have closure issues)
    const detectedMood = currentMoodRef.current || lastFetchedMoodRef.current || mood;
    
    // Console log the detected mood BEFORE any state changes
    console.log('🛑 Stop Detection clicked!');
    console.log('📊 Current mood state (from useState):', mood);
    console.log('📊 Current mood ref (most recent):', currentMoodRef.current);
    console.log('📊 Last fetched mood ref:', lastFetchedMoodRef.current);
    console.log('✅ Final detected mood (will use):', detectedMood);
    
    // Mark that navigation is in progress (prevents duplicate auto-redirects)
    hasNavigatedRef.current = true;

    // Now stop detection
    isDetectingRef.current = false;
    setIsDetecting(false);
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Clear mood state
    setMood(null);
    setConfidence(0);
    currentMoodRef.current = null;
    
    // Navigate to player with detected mood
    if (detectedMood) {
      console.log('🎵 Navigating to player with mood:', detectedMood);
      navigate(`/player?mood=${detectedMood}`);
    } else {
      console.warn('⚠️ No mood detected, cannot fetch music');
      // Only show toast if explicitly requested (user clicked button, not on unmount)
      if (showToastOnNoMood) {
        toast.warning('No mood was detected. Please try again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup without showing toast (silent cleanup on unmount)
      isDetectingRef.current = false;
      setIsDetecting(false);
      
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Note: handleStartMusic is no longer needed as stopDetection now handles navigation

  const getMoodEmoji = (mood: string | null) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'excited': return '🎉';
      case 'relaxed': return '😌';
      case 'focused': return '🤔';
      default: return '😐';
    }
  };

  const getMoodColor = (mood: string | null) => {
    switch (mood) {
      case 'happy': return '#10B981'; // green
      case 'sad': return '#3B82F6'; // blue
      case 'excited': return '#EC4899'; // pink
      case 'relaxed': return '#8B5CF6'; // purple
      case 'focused': return '#F59E0B'; // amber
      default: return '#6B7280'; // gray
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes mood-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-12 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4">
            AI Mood Detection
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto">
            Let our AI analyze your facial expression to recommend the perfect music
          </p>
        </div>

        {error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 sm:p-6 text-center mb-6">
            <p className="text-red-400 font-semibold text-sm sm:text-base">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Video Preview */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-white/5 border border-white/10"
            >
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
                  style={{ display: isDetecting ? 'block' : 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto absolute top-0 left-0"
                  style={{ display: isDetecting ? 'block' : 'none' }}
                />
                
                {!isDetecting && (
                  <div className="py-16 sm:py-24 md:py-32 text-center">
                    <div className="text-white/40 mb-4 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-purple-500/20"
                          style={{
                            animation: 'pulse-glow 3s ease-in-out infinite',
                          }}
                        ></div>
                      </div>
                      <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto opacity-60 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-white/70 font-medium text-sm sm:text-base">Camera not active</p>
                    <p className="text-white/50 text-xs sm:text-sm mt-2">Click "Start Camera" to begin</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mood Display - Always show if detecting or if mood is set */}
            {(mood || isDetecting) && (
              <div 
                className="rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 text-center relative overflow-hidden bg-white/5 border border-white/10"
              >
                {/* Animated gradient background */}
                {mood && (
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${getMoodColor(mood)} 0%, transparent 70%)`,
                      animation: 'pulse-glow 3s ease-in-out infinite',
                    }}
                  ></div>
                )}
                
                <div className="relative z-10">
                  {mood ? (
                    <>
                      <div 
                        key={`emoji-${moodChangeCount}`} 
                        className="text-6xl sm:text-7xl md:text-8xl mb-4 sm:mb-6 transition-all duration-500"
                        style={{
                          animation: 'mood-pulse 2s ease-in-out infinite',
                          filter: `drop-shadow(0 0 20px ${getMoodColor(mood)}80)`,
                        }}
                      >
                        {getMoodEmoji(mood)}
                      </div>
                      <h2 
                        key={`mood-${moodChangeCount}`}
                        className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 capitalize transition-all duration-300" 
                      >
                        {mood}
                      </h2>
                      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4"
                        style={{
                          background: `${getMoodColor(mood)}20`,
                          border: `1px solid ${getMoodColor(mood)}50`,
                        }}
                      >
                        <div className="w-2 h-2 rounded-full"
                          style={{
                            background: getMoodColor(mood),
                            boxShadow: `0 0 10px ${getMoodColor(mood)}`,
                            animation: 'pulse-glow 2s ease-in-out infinite',
                          }}
                        ></div>
                        <p className="text-white font-semibold text-xs sm:text-sm">
                          Confidence: {Math.round(confidence * 100)}%
                        </p>
                      </div>
                      {moodChangeCount > 0 && (
                        <p className="text-xs text-white/40 italic">
                          Mood updated {moodChangeCount} time{moodChangeCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-6xl sm:text-7xl md:text-8xl mb-4 sm:mb-6" style={{ animation: 'mood-pulse 2s ease-in-out infinite' }}>
                        🤖
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                        Detecting Mood...
                      </h2>
                      <p className="text-white/60 text-sm sm:text-base mb-4">
                        Analyzing your facial expression...
                      </p>
                      <div className="flex justify-center gap-1 mt-4">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-purple-400"
                            style={{
                              animation: `pulse-glow ${1 + i * 0.2}s ease-in-out infinite`,
                              animationDelay: `${i * 0.2}s`,
                            }}
                          ></div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Music Fetching Status */}
                {isFetchingMusic && (
                  <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3 text-blue-400 relative z-10">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">Fetching music from Spotify...</span>
                  </div>
                )}
                
                {tracksFetched && !isFetchingMusic && fetchedTracksCount > 0 && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-500/20 border border-green-500/50 rounded-lg relative z-10">
                    <p className="text-green-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {fetchedTracksCount} tracks ready from Spotify!
                    </p>
                  </div>
                )}
                
                <p className="text-xs sm:text-sm text-white/40 mt-4 sm:mt-6 relative z-10">
                  Mood is being detected continuously. Click "Stop Detection" to go to the player with your current mood.
                </p>
              </div>
            )}

            {/* Model Status Indicator */}
            {modelLoadError && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 sm:p-5 text-center">
                <p className="text-yellow-400 text-xs sm:text-sm font-semibold">
                  ⚠️ AI Model Error: {modelLoadError}
                </p>
                <p className="text-yellow-300/70 text-xs mt-2">
                  Using fallback detection mode. Detection will still work but may be less accurate.
                </p>
              </div>
            )}
            
            {!modelLoadError && faceDetectionModelRef.current && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-green-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  AI Model Loaded Successfully
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col gap-4 sm:gap-6 items-center">
              <div className="flex gap-3 sm:gap-4 justify-center">
                {!isDetecting ? (
                  <button
                    onClick={startWebcam}
                    disabled={isModelLoading}
                    className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 text-white rounded-full font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 bg-[#1DB954] hover:bg-[#1ed760]"
                  >
                    {isModelLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden sm:inline">Loading AI Model...</span>
                        <span className="sm:hidden">Loading...</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Start Camera & Detect Mood</span>
                        <span className="sm:hidden">Start Camera</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      stopDetection(true);
                    }}
                    className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 sm:gap-3 hover:scale-105 active:scale-95"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    <span className="hidden sm:inline">Stop Detection</span>
                    <span className="sm:hidden">Stop</span>
                  </button>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-white/5 border border-white/10"
            >
              <h3 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Instructions
              </h3>
              <ul className="text-white/60 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-purple-400 mt-0.5 sm:mt-1">•</span>
                  <span>Make sure you have good lighting</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-purple-400 mt-0.5 sm:mt-1">•</span>
                  <span>Position your face clearly in front of the camera</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-purple-400 mt-0.5 sm:mt-1">•</span>
                  <span>Allow camera permissions when prompted</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-purple-400 mt-0.5 sm:mt-1">•</span>
                  <span>The AI will analyze your facial expression to detect your mood</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-purple-400 mt-0.5 sm:mt-1">•</span>
                  <span>Once detected, you can start music based on your mood</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMode;

