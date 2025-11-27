# Test Google OAuth Flow
Write-Host "🧪 Testing Google OAuth Flow..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend server is running
Write-Host "1. Checking if backend server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Backend server is running" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend server is NOT running!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Fix: Start backend with: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Google OAuth endpoint exists
Write-Host "2. Testing Google OAuth endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/google" -Method GET -MaximumRedirection 0 -ErrorAction Stop
    Write-Host "   ⚠️  Got status $($response.StatusCode) - expected redirect (302)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 302) {
        $location = $_.Exception.Response.Headers.Location
        Write-Host "   ✅ Endpoint redirects correctly!" -ForegroundColor Green
        Write-Host "   Location: $location" -ForegroundColor Cyan
        if ($location -like "*accounts.google.com*") {
            Write-Host "   ✅ Redirects to Google OAuth page!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Redirects to unexpected location" -ForegroundColor Yellow
        }
    } elseif ($statusCode -eq 503) {
        Write-Host "   ❌ Service Unavailable - Google OAuth not configured" -ForegroundColor Red
        Write-Host "   Check .env file for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET" -ForegroundColor Yellow
    } elseif ($statusCode -eq 500) {
        Write-Host "   ❌ Server Error - Check backend console for details" -ForegroundColor Red
    } else {
        Write-Host "   ❌ Unexpected status: $statusCode" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. Testing frontend API URL..." -ForegroundColor Yellow
Write-Host "   Expected: http://localhost:5000/api/auth/google" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 If backend is running and endpoint returns 302 redirect to Google," -ForegroundColor Cyan
Write-Host "   then Google login should work in the browser!" -ForegroundColor Cyan
Write-Host ""

