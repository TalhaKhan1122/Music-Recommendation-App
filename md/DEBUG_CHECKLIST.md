# Debugging Checklist - What's Not Working?

Please check the following and share what you see:

## 1. Browser Console Errors
Open browser console (F12 → Console tab) and check for:
- [ ] Red error messages
- [ ] TensorFlow.js loading errors
- [ ] Camera permission errors
- [ ] API call errors

## 2. Model Loading
When you open the AI Mode page, do you see:
- [ ] `🤖 Loading TensorFlow.js face detection model...` in console?
- [ ] `✅ Face detection model loaded...` success message?
- [ ] OR `⚠️ TensorFlow.js runtime failed...` fallback message?

## 3. Camera Access
When clicking "Start Camera & Detect Mood":
- [ ] Does browser ask for camera permission?
- [ ] Does camera video show up on screen?
- [ ] Any error message about camera?

## 4. Mood Detection
After camera starts:
- [ ] Do you see `🎭 Mood update detected:` messages in console?
- [ ] Does a mood appear on screen (happy/sad/excited/etc)?
- [ ] Is it always the same mood or does it change?

## 5. Music Fetching
- [ ] Do you see `🎵 Fetching music from Spotify for mood:` in console?
- [ ] Do you get a success toast message?
- [ ] Does it automatically navigate to `/player` page?

## 6. Player Page
- [ ] Does player page load?
- [ ] Are tracks displayed?
- [ ] Can you play music?

## Common Issues & Solutions

### Issue: Model Not Loading
**Symptoms**: Console shows errors when loading model
**Solutions**:
- Check internet connection (model downloads from CDN)
- Try hard refresh (Ctrl+F5)
- Check browser console for specific error

### Issue: Camera Not Working
**Symptoms**: No video appears, permission denied
**Solutions**:
- Allow camera permission in browser settings
- Try different browser (Chrome works best)
- Check if another app is using camera
- Make sure you're using HTTPS or localhost (required for camera)

### Issue: Always Detects Same Mood
**Symptoms**: Mood never changes, always shows same value
**Solutions**:
- This might be fallback mode (model didn't load)
- Check console for "🎲 Using fallback mood detection"
- If model loaded, try moving face closer/farther from camera
- Try different expressions (smile, frown, neutral)

### Issue: No Music Fetched
**Symptoms**: No tracks on player page
**Solutions**:
- Check if backend server is running (http://localhost:5000)
- Check backend console for Spotify API errors
- Verify Spotify credentials in backend/.env file
- Check browser console for API errors

### Issue: Page Not Navigating
**Symptoms**: Stays on AI Mode page after detection
**Solutions**:
- Check console for navigation errors
- Check if music fetch completed successfully
- Verify route `/player` exists in App.tsx

## Quick Test Steps

1. **Open Browser Console** (F12)
2. **Navigate to AI Mode page**
3. **Check console for model loading** - should see success message
4. **Click "Start Camera & Detect Mood"**
5. **Allow camera permission** if prompted
6. **Wait 2-3 seconds** - should see mood detected
7. **Wait for music fetch** - should see success message
8. **Should auto-navigate to player** after ~1.5 seconds

## Share This Info

If still not working, please share:
1. Screenshot of browser console (F12)
2. Screenshot of AI Mode page
3. What happens when you click "Start Camera"
4. Any error messages you see

