@echo off
setlocal enabledelayedexpansion
title mei skin - cms env var setup
cd /d "%~dp0"

echo.
echo   mei skin studio - cms env var setup
echo   ----------------------------------------
echo   this script adds the two github oauth credentials to vercel
echo   and triggers a production redeploy so they take effect.
echo.
echo   you should have these two values from
echo   https://github.com/settings/developers ^> your OAuth App:
echo     - Client ID    (public, ~20 chars)
echo     - Client Secret  (sensitive, ~40 chars, only shown once)
echo.
echo   the values stay on this machine - they're piped directly to
echo   the vercel cli, nothing goes to the chat or any log file.
echo.
pause
echo.

REM ----- prompt for values -----
set /p CLIENT_ID="GitHub Client ID: "
if "%CLIENT_ID%"=="" (
  echo   no Client ID entered. exiting.
  pause
  exit /b 1
)

set "CLIENT_SECRET="
set /p CLIENT_SECRET="GitHub Client Secret: "
if "%CLIENT_SECRET%"=="" (
  echo   no Client Secret entered. exiting.
  pause
  exit /b 1
)

echo.
echo   adding GITHUB_CLIENT_ID to vercel (production, preview, development)...

REM ----- remove any stale values first (safe to ignore errors) -----
call npx --yes vercel env rm GITHUB_CLIENT_ID production -y >nul 2>&1
call npx --yes vercel env rm GITHUB_CLIENT_ID preview -y >nul 2>&1
call npx --yes vercel env rm GITHUB_CLIENT_ID development -y >nul 2>&1
call npx --yes vercel env rm GITHUB_CLIENT_SECRET production -y >nul 2>&1
call npx --yes vercel env rm GITHUB_CLIENT_SECRET preview -y >nul 2>&1
call npx --yes vercel env rm GITHUB_CLIENT_SECRET development -y >nul 2>&1

REM ----- add fresh -----
echo %CLIENT_ID%| call npx --yes vercel env add GITHUB_CLIENT_ID production
echo %CLIENT_ID%| call npx --yes vercel env add GITHUB_CLIENT_ID preview
echo %CLIENT_ID%| call npx --yes vercel env add GITHUB_CLIENT_ID development

echo.
echo   adding GITHUB_CLIENT_SECRET to vercel (production, preview, development)...
echo %CLIENT_SECRET%| call npx --yes vercel env add GITHUB_CLIENT_SECRET production
echo %CLIENT_SECRET%| call npx --yes vercel env add GITHUB_CLIENT_SECRET preview
echo %CLIENT_SECRET%| call npx --yes vercel env add GITHUB_CLIENT_SECRET development

REM ----- scrub local vars so they don't linger in the cmd session -----
set "CLIENT_ID="
set "CLIENT_SECRET="

echo.
echo   verifying env vars are set...
call npx --yes vercel env ls

echo.
echo   triggering production redeploy so the new env vars get baked in...
echo   (this takes ~30 seconds)
echo.
call npx --yes vercel deploy --prod --yes

echo.
echo   ----------------------------------------
echo   done.
echo.
echo   now test by visiting:
echo     https://brianna.philipngo.ca/api/auth
echo.
echo   it should redirect you to github's authorize screen.
echo   if it shows the 'env var missing' error, the env vars didn't
echo   stick - run this script again.
echo.
pause
