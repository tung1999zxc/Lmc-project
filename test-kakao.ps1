$queries = @(
    "경기도 김포시 통진읍 율마로438번길 34-24",
    "경기 김포시 통진읍 율마로438번길 34-24",
    "경기도 김포시 통진읍 마송리 34-24",
    "김포시 통진읍 율마로438번길 34-24",
    "율마로438번길 34-24"
)
$key = "a9d4231e639d7f9bf805ffaa2cdf5d32"
foreach ($q in $queries) {
    Write-Host "=== Query: $q ==="
    $url = "https://dapi.kakao.com/v2/local/search/address.json?query=" + [uri]::EscapeDataString($q)
    try {
        $r = Invoke-RestMethod -Uri $url -Headers @{ Authorization = "KakaoAK $key" } -TimeoutSec 10
        $r.documents | ForEach-Object {
            Write-Host "  $($_.address_name) | $($_.road_address.building_name) | zone_no=$($_.road_address.zone_no)"
        }
        if (-not $r.documents) { Write-Host "  (no result)" }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)"
    }
    Write-Host ""
}
