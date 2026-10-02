Get-ChildItem -Path "tests\api" -Filter "*.test.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace 'createTestServer\(\)', 'createTestServer({ skipRateLimiting: true })'
    Set-Content -Path $_.FullName -Value $content
    Write-Host "Patched: $($_.Name)"
}
