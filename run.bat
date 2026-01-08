@echo off
setlocal
set PORT=5173
pushd "%~dp0"
start "" "http://localhost:%PORT%/public/"
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server %PORT%
) else (
  python -m http.server %PORT%
)
popd
