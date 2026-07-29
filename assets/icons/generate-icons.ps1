Add-Type -AssemblyName System.Drawing

function New-Icon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $bg = [System.Drawing.ColorTranslator]::FromHtml("#0b3d2e")
    $gold = [System.Drawing.ColorTranslator]::FromHtml("#c9a227")

    $rect = New-Object System.Drawing.Rectangle(0,0,$size,$size)
    $brush = New-Object System.Drawing.SolidBrush($bg)
    $g.FillRectangle($brush, $rect)

    $borderPen = New-Object System.Drawing.Pen($gold, [Math]::Max(2, [int]($size * 0.035)))
    $inset = [int]($size * 0.05)
    $g.DrawEllipse($borderPen, $inset, $inset, $size - 2*$inset, $size - 2*$inset)

    $fontSize = [int]($size * 0.36)
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $goldBrush = New-Object System.Drawing.SolidBrush($gold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("SM", $font, $goldBrush, [System.Drawing.RectangleF]::new(0,0,$size,$size), $sf)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$dir = $PSScriptRoot
New-Icon 180 (Join-Path $dir "icon-180.png")
New-Icon 192 (Join-Path $dir "icon-192.png")
New-Icon 512 (Join-Path $dir "icon-512.png")
Write-Host "Iconos generados en $dir"
