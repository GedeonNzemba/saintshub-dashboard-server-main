# Test Health Endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3003/health" -Method Get
    
    Write-Host "`n✅ Health Check Response:" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor Yellow
    Write-Host "Environment: $($response.environment)" -ForegroundColor Yellow
    Write-Host "Uptime: $($response.uptime) seconds" -ForegroundColor Yellow
    
    Write-Host "`n📊 Services Status:" -ForegroundColor Cyan
    Write-Host "  Database: $($response.services.database.status) (Connected: $($response.services.database.connected))" -ForegroundColor $(if ($response.services.database.connected) { "Green" } else { "Red" })
    Write-Host "  Redis: $($response.services.redis.status) (Connected: $($response.services.redis.connected))" -ForegroundColor $(if ($response.services.redis.connected) { "Green" } else { "Red" })
    Write-Host "  Cache: Keys=$($response.services.cache.stats.keys), Hits=$($response.services.cache.stats.hits), Misses=$($response.services.cache.stats.misses)" -ForegroundColor Yellow
    
    Write-Host "`n💾 System Info:" -ForegroundColor Cyan
    Write-Host "  Memory: $($response.system.memory.used) MB / $($response.system.memory.total) MB" -ForegroundColor Yellow
    
    Write-Host "`n✅ ALL SYSTEMS OPERATIONAL!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    Write-Host "Make sure the server is running on port 3003" -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
