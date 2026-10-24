# Generates the suite icon for the front page: four tilted tiles - a number, a die,
# a letter and a star - in the same colors as the bubbles in the page header.
# Run with Windows PowerShell (System.Drawing):  powershell -File tools\make-icon.ps1
param([string]$OutDir = (Join-Path $PSScriptRoot "..\billeder"))

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $OutDir | Out-Null

function New-RoundedRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

function Color([string]$hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
function Brush([string]$hex) { New-Object System.Drawing.SolidBrush (Color $hex) }

function Draw-Text($g, [string]$text, [float]$size, [string]$color) {
    $font = New-Object System.Drawing.Font 'Arial Rounded MT Bold', $size, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = 'Center'
    $fmt.LineAlignment = 'Center'
    # The font's line box sits a little high, so nudge the glyph down to look centered.
    $rect = New-Object System.Drawing.RectangleF (-$size), (-$size * 0.92), ($size * 2), ($size * 2)
    $g.DrawString($text, $font, (Brush $color), $rect, $fmt)
}

function Draw-Pips($g, [float]$t, [string]$color) {
    $r = $t * 0.085
    $o = $t * 0.24
    foreach ($p in @(@(-1, -1), @(1, -1), @(0, 0), @(-1, 1), @(1, 1))) {
        $g.FillEllipse((Brush $color), $p[0] * $o - $r, $p[1] * $o - $r, 2 * $r, 2 * $r)
    }
}

function Draw-Star($g, [float]$t, [string]$color) {
    $outer = $t * 0.36
    $inner = $outer * 0.45
    $points = for ($i = 0; $i -lt 10; $i++) {
        $rad = if ($i % 2) { $inner } else { $outer }
        $a = [Math]::PI * (-0.5 + $i / 5)
        New-Object System.Drawing.PointF ([float]($rad * [Math]::Cos($a))), ([float]($rad * [Math]::Sin($a) + $t * 0.02))
    }
    $g.FillPolygon((Brush $color), [System.Drawing.PointF[]]$points)
}

# content: 1.0 = normal, 0.8 = keep inside the maskable safe zone
function Draw-Icon([int]$size, [string]$file, [float]$content = 1.0, [bool]$dots = $true) {
    $S = [float]$size
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.TextRenderingHint = 'AntiAliasGridFit'

    # Cream background with the page's dot pattern (full square; iOS rounds the corners itself)
    $g.Clear((Color '#fff8ee'))
    if ($dots) {
        $step = $S / 11
        $dot = Brush '#f3e3c9'
        for ($y = $step / 2; $y -lt $S; $y += $step) {
            for ($x = $step / 2; $x -lt $S; $x += $step) {
                $g.FillEllipse($dot, $x - $S * 0.008, $y - $S * 0.008, $S * 0.016, $S * 0.016)
            }
        }
    }

    $t = $S * 0.37 * $content         # tile size
    $gap = $S * 0.05 * $content
    $depth = $t * 0.09                # darker edge under each tile, like the game buttons
    $half = ($t + $gap) / 2
    $cx = $S / 2
    $cy = $S / 2 - $depth / 2

    $tiles = @(
        @{ dx = -1; dy = -1; rot = -8; c = '#ff6b6b'; d = '#e03131'; kind = 'text'; text = '1'; ink = '#ffffff' },
        @{ dx = 1;  dy = -1; rot = 6;  c = '#4dabf7'; d = '#1c7ed6'; kind = 'pips'; ink = '#ffffff' },
        @{ dx = -1; dy = 1;  rot = 4;  c = '#fcc419'; d = '#e67700'; kind = 'text'; text = 'A'; ink = '#5c4400' },
        @{ dx = 1;  dy = 1;  rot = -5; c = '#b197fc'; d = '#7950f2'; kind = 'star'; ink = '#ffffff' }
    )

    foreach ($tile in $tiles) {
        $state = $g.Save()
        $g.TranslateTransform($cx + $tile.dx * $half, $cy + $tile.dy * $half)
        $g.RotateTransform($tile.rot)
        $r = $t * 0.24
        $g.FillPath((Brush $tile.d), (New-RoundedRect (-$t / 2) (-$t / 2 + $depth) $t $t $r))
        $g.FillPath((Brush $tile.c), (New-RoundedRect (-$t / 2) (-$t / 2) $t $t $r))
        switch ($tile.kind) {
            'text' { Draw-Text $g $tile.text ($t * 0.62) $tile.ink }
            'pips' { Draw-Pips $g $t $tile.ink }
            'star' { Draw-Star $g $t $tile.ink }
        }
        $g.Restore($state)
    }

    $g.Dispose()
    $bmp.Save((Join-Path $OutDir $file), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "  $file"
}

Write-Host "Writing icons to $OutDir"
Draw-Icon 180 'apple-touch-icon.png'
Draw-Icon 512 'icon-512.png'
Draw-Icon 32  'favicon.png' 1.12 $false
