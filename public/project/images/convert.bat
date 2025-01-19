for %%i in (*.jpg) do (
    ffmpeg -i "%%i" -q:v 70 "%%~ni.webp"
)