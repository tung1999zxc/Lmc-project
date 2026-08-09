$body = '{"input":"Green Fine Building, 33 Simgok-ro 9beon-gil, Sosa-gu, Bucheon-si, Gyeonggi-do"}'
try {
    $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/address' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 60
    $resp | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "BODY: $($reader.ReadToEnd())"
    }
}
