$ports = @(3000, 3001, 3002, 3003)
foreach ($p in $ports) {
    Write-Host "=== Port $p ==="
    try {
        $body = '{"input":"Green Fine Building, 33 Simgok-ro 9beon-gil, Sosa-gu, Bucheon-si, Gyeonggi-do"}'
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:$p/api/address" -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 60
        $resp | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)"
    }
    Write-Host ""
}
