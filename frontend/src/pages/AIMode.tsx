import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getTracksByMood } from '../api/music.api';
import * as faceapi from 'face-api.js';

const AIMode: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showCamera, setShowCamera] = useState(false); // Separate state to control camera visibility
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
  const modelsLoadedRef = useRef<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const modelLoadPromiseRef = useRef<Promise<void> | null>(null);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'camera' | 'manual'>('camera'); // Track selection mode

  // Track mood state changes for debugging
  useEffect(() => {
    console.log('🎭 MOOD STATE UPDATED:', mood, 'Confidence:', confidence);
  }, [mood, confidence]);

  // Load face-api.js models on component mount
  useEffect(() => {
    const initializeModel = async () => {
      try {
        await loadFaceApiModels();
      } catch (error: any) {
        console.error('Failed to load face-api.js models:', error);
        const errorMessage = error?.message || 'Unknown error';
        setModelLoadError(errorMessage);
        toast.error('AI model failed to load. Please refresh the page and try again.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    };

    initializeModel();

    // Cleanup on unmount
    return () => {
      modelsLoadedRef.current = false;
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
      setShowCamera(false); // Reset camera visibility
      lastFetchedMoodRef.current = null;
      currentMoodRef.current = null;
      
      // Ensure models are loaded before starting - wait if already loading
      if (!modelsLoadedRef.current) {
        if (isModelLoading && modelLoadPromiseRef.current) {
          console.log('⏳ Models are already loading, waiting...');
          try {
            await modelLoadPromiseRef.current;
          } catch (error) {
            console.error('⚠️ Model loading failed:', error);
            throw new Error('Face detection models failed to load. Please refresh the page.');
          }
        } else {
          console.log('🤖 Loading face-api.js models...');
          await loadFaceApiModels();
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
        setShowCamera(true); // Show camera
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
      case 'surprised': return '#F59E0B';
      case 'relaxed': return '#8B5CF6';
      case 'neutral': return '#6B7280';
      case 'focused': return '#F59E0B';
      case 'angry': return '#EF4444';
      case 'fearful': return '#8B5CF6';
      case 'disgusted': return '#84CC16';
      default: return '#6B7280';
    }
  };

  // Load face-api.js models (tinyFaceDetector + faceExpressionNet)
  const loadFaceApiModels = async (): Promise<void> => {
    // Return if already loaded
    if (modelsLoadedRef.current) {
      return;
    }

    // If already loading, return the existing promise
    if (modelLoadPromiseRef.current) {
      return modelLoadPromiseRef.current;
    }

    // Create loading promise
    const loadPromise = (async (): Promise<void> => {
      try {
        setIsModelLoading(true);
        setModelLoadError(null);
        console.log('🤖 Loading face-api.js models...');
        
        // Try multiple CDN sources as fallback
        const CDN_SOURCES = [
          'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
          'https://unpkg.com/face-api.js@0.22.2/weights',
          'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'
        ];
        
        let lastError: Error | null = null;
        let loaded = false;
        
        for (const MODEL_URL of CDN_SOURCES) {
          try {
            console.log(`🔄 Trying to load models from: ${MODEL_URL}`);
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);
            console.log(`✅ Models loaded successfully from: ${MODEL_URL}`);
            loaded = true;
            break; // Success, exit loop
          } catch (error: any) {
            console.warn(`⚠️ Failed to load from ${MODEL_URL}:`, error.message);
            lastError = error;
            // Continue to next CDN source
          }
        }
        
        // If all CDN sources failed, throw the last error
        if (!loaded) {
          throw lastError || new Error('All CDN sources failed to load models');
        }
        
        modelsLoadedRef.current = true;
        setIsModelLoading(false);
        setModelLoadError(null);
        modelLoadPromiseRef.current = null;
        
        console.log('✅ face-api.js models loaded successfully!');
      } catch (error: any) {
        console.error('❌ Error loading face-api.js models:', error);
        const errorMessage = error?.message || 'Unknown error occurred';
        setModelLoadError(errorMessage);
        setIsModelLoading(false);
        modelsLoadedRef.current = false;
        modelLoadPromiseRef.current = null;
        throw error;
      }
    })();

    // Store the promise so other calls can wait for it
    modelLoadPromiseRef.current = loadPromise;
    
    return loadPromise;
  };

  // Map face-api.js emotions to app moods
  const mapEmotionToMood = (emotion: string, confidence: number): { mood: string; confidence: number } => {
    // face-api.js emotions: neutral, happy, sad, angry, fearful, disgusted, surprised
    // App moods: happy, sad, excited, relaxed, focused
    
    switch (emotion) {
      case 'happy':
        return { mood: 'happy', confidence };
      case 'sad':
        return { mood: 'sad', confidence };
      case 'surprised':
        return { mood: 'excited', confidence };
      case 'neutral':
        return { mood: 'relaxed', confidence };
      case 'angry':
      case 'fearful':
      case 'disgusted':
        return { mood: 'focused', confidence };
      default:
        // Default to relaxed for unknown emotions
        return { mood: 'relaxed', confidence: Math.max(0.5, confidence * 0.8) };
    }
  };

  // Analyze mood from facial expression using face-api.js
  const analyzeMood = async (): Promise<{ mood: string; confidence: number; originalEmotion?: string }> => {
    try {
      console.log('🔍 ========== analyzeMood() CALLED ==========');
      console.log('🔍 Video ref exists?', !!videoRef.current);
      console.log('🔍 Models loaded?', modelsLoadedRef.current);
      
      if (!videoRef.current) {
        throw new Error('Video element not available');
      }
      
      if (!modelsLoadedRef.current) {
        throw new Error('Face detection models not loaded');
      }
      
      const video = videoRef.current;
      
      // Wait for video to be ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        throw new Error('Video stream not ready. Please ensure your camera is working properly.');
      }

      console.log('✅ Video is ready, dimensions:', video.videoWidth, 'x', video.videoHeight);

      // Detect face with expressions using face-api.js
      // Try multiple frames for better accuracy (average results)
      console.log('🔍 Starting face detection with emotion recognition...');
      const startTime = Date.now();
      
      const frameCount = 3; // Analyze 3 frames
      const frameDelay = 200; // 200ms between frames
      const detections: any[] = [];
      
      // Use more sensitive face detector options
      const faceDetectorOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 512, // Higher resolution for better detection
        scoreThreshold: 0.5 // Lower threshold to detect faces more easily
      });
      
      for (let i = 0; i < frameCount; i++) {
        try {
          const detection = await faceapi
            .detectSingleFace(video, faceDetectorOptions)
            .withFaceExpressions();
          
          if (detection && detection.expressions) {
            detections.push(detection);
            console.log(`📸 Frame ${i + 1}/${frameCount} detected`);
          }
          
          // Wait before next frame (except for last frame)
          if (i < frameCount - 1) {
            await new Promise(resolve => setTimeout(resolve, frameDelay));
          }
        } catch (error) {
          console.warn(`⚠️ Frame ${i + 1} detection failed:`, error);
        }
      }
      
      const detectionTime = Date.now() - startTime;
      console.log('👁️ Detection completed in', detectionTime, 'ms, got', detections.length, 'valid detections');

      if (detections.length === 0) {
        throw new Error('No face detected. Please ensure your face is clearly visible in the camera with good lighting.');
      }

      // Average expressions across all frames for more accurate results
      const emotionSums: { [key: string]: number } = {};
      detections.forEach(detection => {
        Object.entries(detection.expressions).forEach(([emotion, probability]) => {
          emotionSums[emotion] = (emotionSums[emotion] || 0) + (probability as number);
        });
      });
      
      const expressions: { [key: string]: number } = {};
      Object.keys(emotionSums).forEach(emotion => {
        expressions[emotion] = emotionSums[emotion] / detections.length;
      });
      
      // Log all emotions with their probabilities for debugging
      console.log('😊 All detected expressions (averaged across', detections.length, 'frames):');
      Object.entries(expressions)
        .sort((a, b) => b[1] - a[1])
        .forEach(([emotion, prob]) => {
          console.log(`   ${emotion}: ${(prob * 100).toFixed(1)}%`);
        });

      // Improved emotion detection logic
      // Sort emotions by probability
      const sortedEmotions = Object.entries(expressions)
        .map(([emotion, probability]) => ({ emotion, probability }))
        .sort((a, b) => b.probability - a.probability);
      
      const topEmotion = sortedEmotions[0];
      const secondEmotion = sortedEmotions[1];
      
      console.log('📊 Top emotions:', {
        first: `${topEmotion.emotion} (${topEmotion.probability.toFixed(3)})`,
        second: secondEmotion ? `${secondEmotion.emotion} (${secondEmotion.probability.toFixed(3)})` : 'N/A'
      });

      // Aggressive positive emotion detection - prioritize happy, excited, etc. over neutral
      const happyProb = expressions.happy || 0;
      const neutralProb = expressions.neutral || 0;
      const surprisedProb = expressions.surprised || 0;
      const sadProb = expressions.sad || 0;
      const angryProb = expressions.angry || 0;
      const fearfulProb = expressions.fearful || 0;
      const disgustedProb = expressions.disgusted || 0;
      
      // Priority order: happy > surprised > neutral > sad > others
      // If happy is above 0.15 (even if not highest), prefer it over neutral
      let selectedEmotion = topEmotion.emotion;
      let selectedConfidence = topEmotion.probability;
      
      // Combine happy and surprised probabilities (smiling can register as both)
      const combinedPositiveProb = happyProb + surprisedProb * 0.7; // Weight surprised slightly less
      
      // Rule 1: If combined positive (happy + surprised) is significant, prefer happy
      if (combinedPositiveProb >= 0.2 || happyProb >= 0.15) {
        // Only override if a negative emotion is significantly higher
        const maxNegative = Math.max(sadProb, angryProb, fearfulProb, disgustedProb);
        if (happyProb >= maxNegative * 0.5 || combinedPositiveProb >= maxNegative * 0.7) {
          selectedEmotion = 'happy';
          selectedConfidence = Math.max(happyProb, combinedPositiveProb);
          console.log('✅ Happy/positive detected (happy:', happyProb.toFixed(3), 'surprised:', surprisedProb.toFixed(3), 'combined:', combinedPositiveProb.toFixed(3), '), preferring over', topEmotion.emotion);
        }
      }
      // Rule 2: If surprised is above 0.2, prefer it (excited mood)
      else if (surprisedProb >= 0.2 && surprisedProb > neutralProb * 0.6) {
        selectedEmotion = 'surprised';
        selectedConfidence = surprisedProb;
        console.log('✅ Surprised (excited) detected, preferring over', topEmotion.emotion);
      }
      // Rule 3: If neutral is top but happy is present at all, prefer happy (very aggressive)
      else if (topEmotion.emotion === 'neutral' && happyProb > 0.08) {
        // If happy is even slightly present, prefer it over neutral
        selectedEmotion = 'happy';
        selectedConfidence = Math.max(happyProb, 0.3); // Boost confidence for happy
        console.log('✅ Neutral detected but happy present, preferring happy (happy:', happyProb.toFixed(3), 'neutral:', neutralProb.toFixed(3), ')');
      }
      // Rule 4: If neutral confidence is low (< 0.6) and any positive emotion exists, use it
      else if (topEmotion.emotion === 'neutral' && topEmotion.probability < 0.6) {
        if (happyProb > 0.08) {
          selectedEmotion = 'happy';
          selectedConfidence = Math.max(happyProb, 0.3);
          console.log('✅ Low neutral confidence, using happy instead');
        } else if (surprisedProb > 0.12) {
          selectedEmotion = 'surprised';
          selectedConfidence = surprisedProb;
          console.log('✅ Low neutral confidence, using surprised instead');
        }
      }
      // Rule 5: If happy is the second highest and close to top, prefer it
      else if (secondEmotion && secondEmotion.emotion === 'happy' && (topEmotion.probability - secondEmotion.probability) < 0.15) {
        selectedEmotion = 'happy';
        selectedConfidence = secondEmotion.probability;
        console.log('✅ Happy is close second, preferring it over', topEmotion.emotion);
      }

      console.log('🎯 Selected emotion:', selectedEmotion, 'confidence:', selectedConfidence.toFixed(3));

      // Map emotion to app mood
      const moodResult = mapEmotionToMood(selectedEmotion, selectedConfidence);
      console.log('✅ Mapped to mood:', moodResult.mood, 'confidence:', moodResult.confidence.toFixed(3));
      
      // Return both the backend mood and the original emotion for display
      return {
        ...moodResult,
        originalEmotion: selectedEmotion, // Store original emotion for display on Player page
      };
    } catch (error: any) {
      console.error('❌ Error in mood analysis:', error);
      const errorMessage = error?.message || 'Failed to detect mood from facial expression';
      throw new Error(errorMessage);
    }
  };

  // Start mood detection process
  const startMoodDetection = () => {
    console.log('🚀 startMoodDetection() called');
    // Reset tracking
    lastFetchedMoodRef.current = null;
    hasNavigatedRef.current = false;
    setTracksFetched(false);
    
    // Initial detection after 4 seconds delay
    setTimeout(async () => {
      // Use ref to get current detecting state (avoids closure issues)
      const currentlyDetecting = isDetectingRef.current;
      console.log('⏰ Initial detection timeout fired (4 seconds). isDetecting:', currentlyDetecting, 'videoRef:', !!videoRef.current);
      console.log('⏰ Current mood state:', mood);
      console.log('⏰ Current mood ref:', currentMoodRef.current);
      
      if (currentlyDetecting && videoRef.current) {
        try {
          console.log('🎯 About to call analyzeMood()...');
          const result = await analyzeMood();
          console.log('🎭 Initial mood detected:', result?.mood, 'Full result:', result);
          console.log('🎭 Result object:', JSON.stringify(result));
          
          // ALWAYS set mood, even if from fallback - FORCE IT
          if (result && result.mood) {
            console.log('✅ Mood detected:', result.mood);
            
            // IMMEDIATELY stop camera as soon as mood is detected
            console.log('📹 Stopping camera immediately after mood detection');
            
            // Hide camera immediately with direct DOM manipulation (faster than state update)
            if (videoRef.current) {
              videoRef.current.style.display = 'none';
            }
            if (canvasRef.current) {
              canvasRef.current.style.display = 'none';
            }
            
            // Hide camera immediately by updating state
            setShowCamera(false);
            isDetectingRef.current = false;
            setIsDetecting(false);
            
            // Stop video stream immediately
            if (videoRef.current) {
              // Pause the video first
              videoRef.current.pause();
              
              // Stop all tracks
              if (videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => {
                  track.stop();
                  console.log('🛑 Video track stopped:', track.kind);
                });
                videoRef.current.srcObject = null;
              }
              
              // Clear the video source to ensure it's completely stopped
              videoRef.current.src = '';
              videoRef.current.load();
            }
            
            // Stop the detection interval to prevent fluctuation
            if (detectionIntervalRef.current) {
              console.log('🛑 Stopping detection interval');
              clearInterval(detectionIntervalRef.current);
              detectionIntervalRef.current = null;
            }
            
            // Now set mood state after camera is stopped
            // Use original emotion for display if available, otherwise use mapped mood
            const displayMood = result.originalEmotion || result.mood;
            setMood(displayMood); // Store original emotion for display
            setConfidence(result.confidence);
            currentMoodRef.current = displayMood; // Store original emotion in ref for stopDetection
            setMoodChangeCount(prev => prev + 1); // Track mood detection
            console.log('✅ Mood state set to:', displayMood, '(original emotion)');
            console.log('✅ Backend mood for API:', result.mood);
            
            // Fetch music for initial mood detection and auto-navigate to player on first success
            const shouldNavigate = !hasNavigatedRef.current;
            console.log('🚀 Triggering initial music fetch for:', result.mood, 'Auto-navigate?', shouldNavigate);
            lastFetchedMoodRef.current = displayMood;
            fetchMusicFromSpotify(result.mood, shouldNavigate, displayMood);
          } else {
            console.error('❌ Initial detection returned invalid result:', result);
            
            // Stop camera with direct DOM manipulation
            if (videoRef.current) {
              videoRef.current.style.display = 'none';
            }
            if (canvasRef.current) {
              canvasRef.current.style.display = 'none';
            }
            
            // Stop camera
            setShowCamera(false);
            isDetectingRef.current = false;
            setIsDetecting(false);
            
            if (videoRef.current) {
              videoRef.current.pause();
              if (videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
              }
              videoRef.current.src = '';
              videoRef.current.load();
            }
            
            if (detectionIntervalRef.current) {
              clearInterval(detectionIntervalRef.current);
              detectionIntervalRef.current = null;
            }
            
            // Show error instead of using fallback
            const errorMsg = 'Mood detection returned invalid result. Please try again.';
            setError(errorMsg);
            toast.error(errorMsg, {
              position: 'top-right',
              autoClose: 5000,
            });
          }
        } catch (error: any) {
          console.error('❌ Error in initial detection:', error);
          const errorMessage = error?.message || 'Failed to detect mood from facial expression';
          
          // Stop camera on error with direct DOM manipulation
          if (videoRef.current) {
            videoRef.current.style.display = 'none';
          }
          if (canvasRef.current) {
            canvasRef.current.style.display = 'none';
          }
          
          // Stop camera
          setShowCamera(false);
          isDetectingRef.current = false;
          setIsDetecting(false);
          
          if (videoRef.current) {
            videoRef.current.pause();
            if (videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
              videoRef.current.srcObject = null;
            }
            videoRef.current.src = '';
            videoRef.current.load();
          }
          
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
          }
          
          // Show error instead of using fallback
          setError(errorMessage);
          toast.error(errorMessage + ' Please try again.', {
            position: 'top-right',
            autoClose: 5000,
          });
        }
      } else {
        console.warn('⚠️ Initial detection skipped - isDetecting:', currentlyDetecting, 'hasVideo:', !!videoRef.current);
        // Show warning instead of using fallback
        const errorMsg = 'Detection was skipped. Please ensure the camera is active and try again.';
        setError(errorMsg);
        toast.warning(errorMsg, {
          position: 'top-right',
          autoClose: 4000,
        });
      }
    }, 4000); // 4 second delay to allow video to stabilize and detect mood
    
    console.log('⏱️ Initial detection timer set for 4 seconds');

    // Update canvas with video feed (only while detecting)
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        let animationFrameId: number | null = null;
        const drawFrame = () => {
          // Use ref to check current detecting state - stop if not detecting
          if (video.readyState === video.HAVE_ENOUGH_DATA && isDetectingRef.current) {
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
            
            animationFrameId = requestAnimationFrame(drawFrame);
          } else {
            // Stop drawing if detection stopped
            if (animationFrameId !== null) {
              cancelAnimationFrame(animationFrameId);
            }
          }
        };
        drawFrame();
      }
    }

  };

  // Fetch music from Spotify based on detected mood and auto-navigate
  const fetchMusicFromSpotify = async (detectedMood: string, shouldAutoNavigate: boolean = true, displayMood?: string) => {
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
      return;
    }

    // Use displayMood for navigation if provided, otherwise use detectedMood
    const moodForDisplay = displayMood || detectedMood;

    try {
      setIsFetchingMusic(true);
      setTracksFetched(false);

      const response = await getTracksByMood(detectedMood, 20, 'recommendations', 'spotify');
      
      setFetchedTracksCount(response.data.tracks.length);
      setTracksFetched(true);
      
      toast.success(`Found ${response.data.tracks.length} tracks for ${moodForDisplay} mood! 🎵`, {
        position: 'top-right',
        autoClose: 2000,
      });

      // Automatically navigate to player after successful music fetch
      if (shouldAutoNavigate && !hasNavigatedRef.current && response.data.tracks.length > 0) {
        hasNavigatedRef.current = true;
        
        // Small delay to let user see the success message
        setTimeout(() => {
          // Stop detection before navigating
          setShowCamera(false);
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
          
          navigate(`/player?mood=${moodForDisplay}`);
        }, 1500); // 1.5 second delay to show success message
      } else if (shouldAutoNavigate && hasNavigatedRef.current) {
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

  // Handle manual mood selection
  const handleManualMoodSelection = async (selectedMood: string) => {
    // Stop any ongoing camera detection
    if (isDetecting) {
      setShowCamera(false);
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
    }
    
    // Set the selected mood (keep original emotion for display)
    setMood(selectedMood);
    setConfidence(1.0); // Manual selection has 100% confidence
    currentMoodRef.current = selectedMood;
    setMoodChangeCount(prev => prev + 1);
    
    // Map to backend-supported mood for API call
    const backendMood = mapEmotionToBackendMood(selectedMood);
    
    // Fetch music and navigate to player
    // Pass selectedMood as displayMood so the original emotion mood appears on Player page
    hasNavigatedRef.current = false;
    lastFetchedMoodRef.current = selectedMood;
    await fetchMusicFromSpotify(backendMood, true, selectedMood);
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
    setShowCamera(false); // Hide camera immediately
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
      setShowCamera(false);
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
      case 'surprised': return '😲';
      case 'relaxed': return '😌';
      case 'neutral': return '😐';
      case 'focused': return '🤔';
      case 'angry': return '😠';
      case 'fearful': return '😨';
      case 'disgusted': return '🤢';
      default: return '😐';
    }
  };

  const getMoodColor = (mood: string | null) => {
    switch (mood) {
      case 'happy': return '#10B981'; // green
      case 'sad': return '#3B82F6'; // blue
      case 'excited': return '#EC4899'; // pink
      case 'surprised': return '#F59E0B'; // amber/orange
      case 'relaxed': return '#8B5CF6'; // purple
      case 'neutral': return '#6B7280'; // gray
      case 'focused': return '#F59E0B'; // amber
      case 'angry': return '#EF4444'; // red
      case 'fearful': return '#8B5CF6'; // purple (similar to relaxed)
      case 'disgusted': return '#84CC16'; // lime green
      default: return '#6B7280'; // gray
    }
  };

  // Map emotion moods to backend-supported moods for API calls
  const mapEmotionToBackendMood = (emotionMood: string): string => {
    // Backend supports: happy, sad, excited, relaxed, focused
    switch (emotionMood) {
      case 'happy':
        return 'happy';
      case 'sad':
        return 'sad';
      case 'excited':
      case 'surprised':
        return 'excited';
      case 'relaxed':
      case 'neutral':
        return 'relaxed';
      case 'focused':
      case 'angry':
      case 'fearful':
      case 'disgusted':
        return 'focused';
      default:
        return 'relaxed';
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
            Let our AI analyze your facial expression to recommend the perfect music, or select your mood manually
          </p>
        </div>

        {/* Mode Selection Toggle */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="inline-flex rounded-full bg-white/5 border border-white/10 p-1">
            <button
              onClick={() => {
                setSelectionMode('camera');
                setError(null);
                // Stop camera if switching away
                if (isDetecting) {
                  setShowCamera(false);
                  isDetectingRef.current = false;
                  setIsDetecting(false);
                  if (videoRef.current?.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                  }
                }
              }}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 ${
                selectionMode === 'camera'
                  ? 'bg-[#1DB954] text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Camera Detection
              </span>
            </button>
            <button
              onClick={() => {
                setSelectionMode('manual');
                setError(null);
                // Stop camera if switching away
                if (isDetecting) {
                  setShowCamera(false);
                  isDetectingRef.current = false;
                  setIsDetecting(false);
                  if (videoRef.current?.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                  }
                }
              }}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 ${
                selectionMode === 'manual'
                  ? 'bg-[#1DB954] text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Manual Selection
              </span>
            </button>
          </div>
        </div>

        {/* Manual Mood Selection */}
        {selectionMode === 'manual' && (
          <div className="mb-6 sm:mb-8">
            <div className="rounded-xl sm:rounded-2xl p-6 sm:p-8 bg-white/5 border border-white/10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
                Select Your Mood
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {[
                  { mood: 'happy', emoji: '😊', color: '#10B981', label: 'Happy' },
                  { mood: 'sad', emoji: '😢', color: '#3B82F6', label: 'Sad' },
                  { mood: 'excited', emoji: '🎉', color: '#EC4899', label: 'Excited' },
                  { mood: 'surprised', emoji: '😲', color: '#F59E0B', label: 'Surprised' },
                  { mood: 'relaxed', emoji: '😌', color: '#8B5CF6', label: 'Relaxed' },
                  { mood: 'neutral', emoji: '😐', color: '#6B7280', label: 'Neutral' },
                  { mood: 'focused', emoji: '🤔', color: '#F59E0B', label: 'Focused' },
                  { mood: 'angry', emoji: '😠', color: '#EF4444', label: 'Angry' },
                  { mood: 'fearful', emoji: '😨', color: '#8B5CF6', label: 'Fearful' },
                  { mood: 'disgusted', emoji: '🤢', color: '#84CC16', label: 'Disgusted' },
                ].map(({ mood: moodValue, emoji, color, label }) => (
                  <button
                    key={moodValue}
                    onClick={() => handleManualMoodSelection(moodValue)}
                    disabled={isFetchingMusic}
                    className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    style={{
                      borderColor: mood === moodValue ? color : undefined,
                      boxShadow: mood === moodValue ? `0 0 20px ${color}40` : undefined,
                    }}
                  >
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-3">{emoji}</div>
                    <div className="text-white font-semibold text-xs sm:text-sm">{label}</div>
                    {isFetchingMusic && mood === moodValue && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl sm:rounded-2xl">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {mood && selectionMode === 'manual' && (
                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-white/60 text-xs sm:text-sm">
                    Selected: <span className="font-semibold text-white capitalize">{mood}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 sm:p-6 text-center mb-6">
            <p className="text-red-400 font-semibold text-sm sm:text-base">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Video Preview - Only show in camera mode */}
            {selectionMode === 'camera' && (
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-white/5 border border-white/10"
            >
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
                  style={{ display: showCamera ? 'block' : 'none' }}
                />
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto absolute top-0 left-0"
                  style={{ display: showCamera ? 'block' : 'none' }}
                />
                
                {!showCamera && (
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
            )}

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
                
                {selectionMode === 'camera' && (
                  <p className="text-xs sm:text-sm text-white/40 mt-4 sm:mt-6 relative z-10">
                    Mood is being detected continuously. Click "Stop Detection" to go to the player with your current mood.
                  </p>
                )}
                {selectionMode === 'manual' && mood && (
                  <p className="text-xs sm:text-sm text-white/40 mt-4 sm:mt-6 relative z-10">
                    Music is being fetched for your selected mood. You'll be redirected to the player shortly.
                  </p>
                )}
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
            
            {/* {!modelLoadError && faceDetectionModelRef.current && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-green-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  AI Model Loaded Successfully
                </p>
              </div>
            )} */}

            {/* Controls - Only show in camera mode */}
            {selectionMode === 'camera' && (
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
            )}

            {/* Instructions */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-white/5 border border-white/10"
            >
              <h3 className="text-white font-bold mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Instructions
              </h3>
              {selectionMode === 'camera' ? (
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
              ) : (
                <ul className="text-white/60 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="text-purple-400 mt-0.5 sm:mt-1">•</span>
                    <span>Select the mood that best matches how you're feeling</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="text-purple-400 mt-0.5 sm:mt-1">•</span>
                    <span>Click on any mood card to start fetching music</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="text-purple-400 mt-0.5 sm:mt-1">•</span>
                    <span>You'll be automatically redirected to the player page</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <span className="text-purple-400 mt-0.5 sm:mt-1">•</span>
                    <span>You can switch back to camera detection mode anytime</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMode;


