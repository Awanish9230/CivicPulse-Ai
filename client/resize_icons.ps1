Add-Type -AssemblyName System.Drawing
$src = "C:\Users\Awanish\.gemini\antigravity-ide\brain\a8251187-a35b-4d89-b101-75f9a067d61e\civicpulse_logo_1782922414736.png"
$img = [System.Drawing.Image]::FromFile($src)

$bmp192 = New-Object System.Drawing.Bitmap 192, 192
$graphics192 = [System.Drawing.Graphics]::FromImage($bmp192)
$graphics192.DrawImage($img, 0, 0, 192, 192)
$bmp192.Save("c:\Users\Awanish\Desktop\CivicPluseAi\client\public\pwa-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics192.Dispose()
$bmp192.Dispose()

$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$graphics512 = [System.Drawing.Graphics]::FromImage($bmp512)
$graphics512.DrawImage($img, 0, 0, 512, 512)
$bmp512.Save("c:\Users\Awanish\Desktop\CivicPluseAi\client\public\pwa-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics512.Dispose()
$bmp512.Dispose()

$img.Dispose()
