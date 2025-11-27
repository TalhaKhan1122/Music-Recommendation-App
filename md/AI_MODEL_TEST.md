# AI Mood Detection Model - Testing Guide

## Current Implementation

The mood detection now uses **TensorFlow.js with MediaPipe Face Mesh** for real facial expression analysis.

## How to Test

1. **Open Browser Console** (F12 → Console tab)
2. **Start the Application** and navigate to AI Mode page
3. **Check Model Loading**:
   - Look for: `🤖 Loading TensorFlow.js face detection model...`
   - Success: `✅ Face detection model loaded with TensorFlow.js runtime!`
   - OR: `✅ Face detection model loaded with MediaPipe runtime!`
   - If error: `❌ Error loading face detection model` - will use fallback

4. **Start Camera Detection**:
   - Click "Start Camera & Detect Mood"
   - Wait for camera to activate
   - Look for logs every 3 seconds:
     - `🎭 Mood update detected: happy Confidence: 0.85`
     - `📊 Facial analysis: { smileRatio: 4.2, eyeWidth: 0.065, ... }`
     - `✅ Mood determined: happy confidence: 0.85`

## Expected Behavior

### If Model Loads Successfully:
- Real-time facial analysis using 468 facial landmarks
- Mood detection based on:
  - **Happy**: Wide smile (ratio > 3.5), open eyes
  - **Excited**: Very wide smile (ratio > 4.5), wide eyes  
  - **Sad**: Narrow mouth (ratio < 2.8), downward position
  - **Focused**: Neutral expression, normal eye width
  - **Relaxed**: Slight smile, calm features

### If Model Fails to Load:
- Falls back to simulated detection (random moods)
- Still works, but not using real AI
- You'll see: `⚠️ Model not loaded, using fallback`
- You'll see: `🎲 Using fallback mood detection`

## Common Issues

### Issue 1: Model Not Loading
**Symptoms**: Console shows error when loading model
**Solution**: 
- Check internet connection (model downloads from CDN)
- Try refreshing the page
- Check browser console for specific error

### Issue 2: No Face Detected
**Symptoms**: Console shows "👤 No face detected in frame"
**Causes**:
- Poor lighting
- Face too far from camera
- Face not visible
- Camera permissions not granted

**Solution**:
- Improve lighting
- Move closer to camera
- Ensure face is clearly visible
- Grant camera permissions

### Issue 3: Mood Detection Inaccurate
**Symptoms**: Wrong moods detected
**Possible Causes**:
- Facial landmark indices might need adjustment
- Threshold values might need tuning
- Camera angle/lighting affecting detection

**Solution**:
- Check console logs for facial analysis values
- Adjust threshold values in `analyzeFacialFeatures` function
- Ensure good lighting and clear face view

## Debugging Tips

1. **Check Console Logs**:
   ```
   📊 Facial analysis: {
     smileRatio: 4.2,      // Higher = more smile
     eyeWidth: 0.065,      // Eye opening width
     eyeDistance: 0.12,    // Distance between eyes
     mouthPosition: 0.15   // Mouth position (positive = below eyes)
   }
   ```

2. **Verify Model Status**:
   - Check if `faceDetectionModelRef.current` is not null
   - Look for model loading success messages

3. **Test with Different Expressions**:
   - Try smiling → Should detect "happy" or "excited"
   - Try neutral → Should detect "relaxed" or "focused"
   - Try frowning → Should detect "sad"

4. **Check Keypoint Data**:
   - If needed, log `keypoints.length` - should be 468 for MediaPipe Face Mesh
   - Verify keypoint indices are valid (0-467)

## Troubleshooting

### Model Configuration Issues
If TensorFlow.js runtime fails, it automatically tries MediaPipe runtime. Both should work, but MediaPipe requires external files from CDN.

### Keypoint Index Issues
The current implementation uses these MediaPipe Face Mesh indices:
- Mouth: 61 (left), 291 (right), 13 (upper), 14 (lower)
- Eyes: 33 (left inner), 263 (right inner), 159 (left outer), 386 (right outer)

If detection is inaccurate, these indices might need adjustment.

## Next Steps for Improvement

1. **Calibrate Thresholds**: Adjust smile ratio and eye width thresholds based on real-world testing
2. **Add More Features**: Use eyebrow position, nose position for better accuracy
3. **Train Custom Model**: For production, consider training a custom emotion detection model
4. **Add Smoothing**: Average mood over multiple frames to reduce fluctuations

