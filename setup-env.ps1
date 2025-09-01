# Environment Setup Script for Windows
# This script creates the .env.local file with the required environment variables

Write-Host "Setting up environment variables..." -ForegroundColor Green

# Define the environment variables
$envVars = @"
# Supabase Configuration
VITE_SUPABASE_URL=https://tpdhcesneddslwauqyzu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZGhjZXNuZWRkc2x3YXVxeXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTgzMjksImV4cCI6MjA2NjQzNDMyOX0.CHXeYevKb-2IxU3APMF2EF6UNAadmp8X7cxGBsvK91A

# Service Role Key (for admin operations - KEEP SECURE!)
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZGhjZXNuZWRkc2x3YXVxeXp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg1ODMyOSwiZXhwIjoyMDY2NDM0MzI5fQ.CHXeYevKb-2IxU3APMF2EF6UNAadmp8X7cxGBsvK91A

# Development Settings
VITE_APP_ENV=development
"@

# Create the .env.local file
try {
    $envVars | Out-File -FilePath ".env.local" -Encoding UTF8 -Force
    Write-Host "✅ Environment file created successfully!" -ForegroundColor Green
    Write-Host "📁 File location: $(Get-Location)\.env.local" -ForegroundColor Cyan
    
    # Verify the file was created
    if (Test-Path ".env.local") {
        Write-Host "✅ File verification successful" -ForegroundColor Green
        Write-Host "📄 File contents:" -ForegroundColor Yellow
        Get-Content ".env.local" | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "❌ File creation failed" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error creating environment file: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your development server" -ForegroundColor White
Write-Host "2. Try creating a user in the application" -ForegroundColor White
Write-Host "3. Check the browser console for any errors" -ForegroundColor White
Write-Host ""
Write-Host "WARNING: Security reminder: This service role key is for development only!" -ForegroundColor Red
Write-Host "   Never use it in production or commit it to version control." -ForegroundColor Red 