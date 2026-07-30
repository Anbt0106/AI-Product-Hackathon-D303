param(
  [switch]$Mock
)

$ErrorActionPreference = 'Stop'

# Node dùng CA bundle riêng, còn Avast Web Shield ký lại TLS bằng CA trong
# Windows Certificate Store. Xuất CA công khai này vào TEMP để Node vẫn kiểm
# chứng TLS đầy đủ; tuyệt đối không dùng NODE_TLS_REJECT_UNAUTHORIZED=0.
$avastCa = Get-ChildItem Cert:\CurrentUser\Root, Cert:\LocalMachine\Root |
  Where-Object { $_.Subject -match '^CN=Avast Web/Mail Shield Root' } |
  Select-Object -First 1

if ($avastCa) {
  $pemPath = Join-Path $env:TEMP 'vlearn-avast-web-shield-root.pem'
  $base64 = [Convert]::ToBase64String(
    $avastCa.RawData,
    [Base64FormattingOptions]::InsertLineBreaks
  )
  [IO.File]::WriteAllText(
    $pemPath,
    "-----BEGIN CERTIFICATE-----`n$base64`n-----END CERTIFICATE-----`n",
    [Text.Encoding]::ASCII
  )
  $env:NODE_EXTRA_CA_CERTS = $pemPath
}

if ($Mock) {
  Remove-Item Env:AI_PROVIDER -ErrorAction SilentlyContinue
  Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
}

Push-Location $PSScriptRoot
try {
  node server.mjs
} finally {
  Pop-Location
}