# ================================================
# HackQuest25 WiFi Frontend Deployment Script
# Deploy to Google App Engine
# ================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WiFi FRONTEND DEPLOYMENT" -ForegroundColor Green
Write-Host "  Google App Engine" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to wififrontend directory
Set-Location "$PSScriptRoot"

# Check if gcloud is installed
Write-Host "🔍 Checking gcloud installation..." -ForegroundColor Yellow
try {
    $gcloudVersion = gcloud version 2>&1 | Select-String "Google Cloud SDK"
    Write-Host "✅ gcloud CLI found: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: gcloud CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Google Cloud SDK first:" -ForegroundColor Yellow
    Write-Host "  https://cloud.google.com/sdk/docs/install" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check current project
Write-Host ""
Write-Host "🔍 Checking Google Cloud project..." -ForegroundColor Yellow
$currentProject = gcloud config get-value project 2>$null
if ($currentProject) {
    Write-Host "✅ Active project: $currentProject" -ForegroundColor Green
} else {
    Write-Host "❌ No active project set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Setting project to hackquest25..." -ForegroundColor Yellow
    gcloud config set project hackquest25
    $currentProject = "hackquest25"
}

# Pre-deployment checks
Write-Host ""
Write-Host "📋 Pre-deployment checks..." -ForegroundColor Yellow

# Check if required files exist
$requiredFiles = @(
    "login-mypublicwifi.html",
    "success.html",
    "style.css",
    "app.yaml",
    "jquery-1.4.3.min.js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (MISSING!)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ ERROR: Some required files are missing!" -ForegroundColor Red
    Write-Host "Please ensure all files are present before deploying." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ All required files present!" -ForegroundColor Green

# Display file sizes
Write-Host ""
Write-Host "📦 Deployment package:" -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    $size = (Get-Item $file).Length
    $sizeKB = [math]::Round($size/1024, 2)
    Write-Host "  $file : $sizeKB KB" -ForegroundColor White
}

# Confirmation prompt
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to deploy to Google App Engine" -ForegroundColor Yellow
Write-Host "Project: $currentProject" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Continue with deployment? (y/N)"

if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host ""
    Write-Host "❌ Deployment cancelled by user" -ForegroundColor Yellow
    exit 0
}

# Deploy to Google App Engine
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING TO GOOGLE APP ENGINE..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will take 2-5 minutes..." -ForegroundColor Yellow
Write-Host ""

# Run deployment
try {
    gcloud app deploy app.yaml --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        # Get the deployed URL
        Write-Host "🌐 Getting deployment URL..." -ForegroundColor Yellow
        $appUrl = gcloud app browse --no-launch-browser 2>&1 | Select-String -Pattern "https://"
        
        if ($appUrl) {
            Write-Host ""
            Write-Host "Your WiFi portal is now live at:" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "  $appUrl" -ForegroundColor Green -BackgroundColor Black
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "📱 Next steps:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  1. Test the portal: Open $appUrl in a browser" -ForegroundColor White
            Write-Host "  2. Verify registration works" -ForegroundColor White
            Write-Host "  3. Test on mobile device" -ForegroundColor White
            Write-Host "  4. Update MyPublicWiFi redirect URL to this address" -ForegroundColor White
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            
            # Save URL to file
            $appUrl | Out-File -FilePath "DEPLOYED-URL.txt" -Encoding UTF8
            Write-Host "✅ URL saved to DEPLOYED-URL.txt" -ForegroundColor Green
            
        } else {
            Write-Host "⚠️ Could not retrieve URL automatically" -ForegroundColor Yellow
            Write-Host "   Run this command to get your URL:" -ForegroundColor White
            Write-Host "   gcloud app browse" -ForegroundColor Cyan
        }
        
    } else {
        throw "Deployment failed with exit code: $LASTEXITCODE"
    }
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. App Engine not enabled - Run: gcloud app create --region=asia-south1" -ForegroundColor White
    Write-Host "  2. Billing not enabled - Enable billing in Google Cloud Console" -ForegroundColor White
    Write-Host "  3. Incorrect project - Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
