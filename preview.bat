@echo off
setlocal
title halo - local preview
cd /d "%~dp0"

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo.
echo   halo wellness - local preview
echo   ----------------------------------------
echo   url:    http://127.0.0.1:5500
echo   root:   %ROOT%
echo.

REM kill any stale process listening on 5500 - powershell is more reliable than findstr
echo   checking port 5500...
powershell -NoProfile -Command "$pids = (Get-NetTCPConnection -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique; if ($pids) { Write-Host ('   killing stale pid(s): ' + ($pids -join ', ')); $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } ; Start-Sleep -Milliseconds 400 }"

echo   browser will open shortly. close this window or press Ctrl+C to stop.
echo.

REM open browser after the server has time to bind - use 127.0.0.1 explicitly to avoid ipv6 resolution
start "" /min cmd /c "timeout /t 1 /nobreak >nul & start "" http://127.0.0.1:5500"

REM serve THIS folder via --directory so cwd can never drift, bound to ipv4 loopback
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 5500 --bind 127.0.0.1 --directory "%ROOT%"
  goto done
)

where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 5500 --bind 127.0.0.1 --directory "%ROOT%"
  goto done
)

echo   [error] neither 'python' nor 'py' is on PATH.
echo   install python from https://www.python.org/downloads/
echo   ^(check "add python to PATH" during install^)
echo.
pause
exit /b 1

:done
echo.
echo   server stopped.
pause
