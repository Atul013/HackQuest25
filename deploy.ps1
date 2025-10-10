# Quick Deployment Script for Google Cloud

Write-Host "🚀 HackQuest25 - Google Cloud Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud --version
    Write-Host "✅ Google Cloud SDK installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud SDK not found!" -ForegroundColor Red
    Write-Host "Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Pre-deployment Checklist:" -ForegroundColor Yellow
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker not found (needed for local testing)" -ForegroundColor Yellow
}

# Check if backend .env exists
if (Test-Path "backend\.env.production") {
    Write-Host "✅ Production environment file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  backend\.env.production not found" -ForegroundColor Yellow
    Write-Host "   Copy backend\.env.production.example and update values" -ForegroundColor Yellow
}

# Check if Dockerfile exists
if (Test-Path "backend\Dockerfile") {
    Write-Host "✅ Backend Dockerfile ready" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Dockerfile missing!" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 Deployment Options:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Test Docker build locally" -ForegroundColor White
Write-Host "2. Deploy backend to Cloud Run" -ForegroundColor White
Write-Host "3. Deploy ML service to Cloud Run" -ForegroundColor White
Write-Host "4. Deploy frontend to Firebase Hosting" -ForegroundColor White
Write-Host "5. Full deployment (all services)" -ForegroundColor White
Write-Host "0. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔨 Testing Docker build..." -ForegroundColor Yellow
        cd backend
        docker build -t hackquest-backend:test .
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker build successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Run locally:" -ForegroundColor Cyan
            Write-Host "docker run -p 3000:8080 --env-file .env hackquest-backend:test" -ForegroundColor White
        }
        cd ..
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Deploying backend to Cloud Run..." -ForegroundColor Yellow
        Write-Host ""
        
        $project = Read-Host "Enter your Google Cloud Project ID"
        $region = Read-Host "Enter region (default: asia-south1)"
        
        if ([string]::IsNullOrWhiteSpace($region)) {
            $region = "asia-south1"
        }
        
        Write-Host ""
        Write-Host "Deploying to project: $project, region: $region" -ForegroundColor Cyan
        
        gcloud run deploy hackquest-backend `
            --source ./backend `
            --project $project `
            --region $region `
            --platform managed `
            --allow-unauthenticated `
            --memory 1Gi `
            --cpu 1 `
            --min-instances 0 `
            --max-instances 10 `
            --timeout 300
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Get the URL:" -ForegroundColor Cyan
            Write-Host "gcloud run services describe hackquest-backend --region $region --format='value(status.url)'" -ForegroundColor White
        }
    }
    "3" {
        Write-Host ""
        Write-Host "🧠 Deploying ML service to Cloud Run..." -ForegroundColor Yellow
        Write-Host ""
        
        $project = Read-Host "Enter your Google Cloud Project ID"
        $region = Read-Host "Enter region (default: asia-south1)"
        
        if ([string]::IsNullOrWhiteSpace($region)) {
            $region = "asia-south1"
        }
        
        gcloud run deploy hackquest-ml `
            --source ./frontend `
            --project $project `
            --region $region `
            --platform managed `
            --allow-unauthenticated `
            --memory 2Gi `
            --cpu 2 `
            --min-instances 0 `
            --max-instances 5 `
            --timeout 600
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ ML service deployed successfully!" -ForegroundColor Green
        }
    }
    "4" {
        Write-Host ""
        Write-Host "🌐 Deploying frontend to Firebase..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Run these commands:" -ForegroundColor Cyan
        Write-Host "  cd qrfrontend" -ForegroundColor White
        Write-Host "  npm run build" -ForegroundColor White
        Write-Host "  firebase init hosting" -ForegroundColor White
        Write-Host "  firebase deploy" -ForegroundColor White
    }
    "0" {
        Write-Host "Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "Invalid option" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📖 For detailed instructions, see DEPLOYMENT-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
