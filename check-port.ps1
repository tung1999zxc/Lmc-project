Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in @(3000,3001,3002,3003) } | Select-Object LocalPort, OwningProcess | Format-Table
