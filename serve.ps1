# ScoutingManager - servidor estatico local (no requiere Node ni Python)
# Uso: clic derecho > Ejecutar con PowerShell, o desde una terminal: .\serve.ps1 -Port 5173
param(
    [int]$Port = 5173
)

$root = $PSScriptRoot
$prefix = "http://localhost:$Port/"

Add-Type -AssemblyName System.Web

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
    $listener.Start()
} catch {
    Write-Host "No se pudo iniciar el servidor en el puerto $Port. Prueba con otro puerto: .\serve.ps1 -Port 5174" -ForegroundColor Red
    exit 1
}

Write-Host "ScoutingManager sirviendo en $prefix (Ctrl+C para detener)" -ForegroundColor Green

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".webmanifest" = "application/manifest+json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
    } catch {
        break
    }
    $request = $context.Request
    $response = $context.Response

    $localPath = [System.Web.HttpUtility]::UrlDecode($request.Url.LocalPath)
    if ($localPath -eq "/") { $localPath = "/index.html" }
    $filePath = Join-Path $root ($localPath.TrimStart("/"))

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = $mime[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentType = $contentType
        $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
        $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 - No encontrado: $localPath")
        $response.OutputStream.Write($notFound, 0, $notFound.Length)
    }
    $response.OutputStream.Close()
}

$listener.Stop()
