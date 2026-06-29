# Free ports 3000–3002 if an old dev server is stuck
$ports = 3000, 3001, 3002
foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object {
      $procId = $_.OwningProcess
      if ($procId -and $procId -ne 0) {
        Write-Host "Stopping process $procId on port $port"
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      }
    }
}
Write-Host "Done. Now run: npm run dev"
