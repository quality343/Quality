Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
  $c = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
  if ($c -match 'next') { Stop-Process -Id $_.Id -Force; Write-Output "stopped $($_.Id)" }
}
