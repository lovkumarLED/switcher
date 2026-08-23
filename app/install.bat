@echo off
title Switcher - One-click Installer
cd /d "%~dp0"

echo.
echo ============================================
echo    Switcher - one-time installer
echo ============================================
echo.
echo This creates the app's own Python environment, installs
echo its packages, and puts an "Switcher" shortcut on your
echo desktop. You only need to run this once.
echo.

set "VENV_PY=env\Scripts\python.exe"

where python >nul 2>nul
if errorlevel 1 (
    echo Python was not found on this computer.
    echo Install it from https://www.python.org/downloads/
    echo ^(tick "Add python.exe to PATH" during installation^), then try again.
    echo.
    pause
    exit /b 1
)

echo [1/2] Setting up the app environment...
if not exist "%VENV_PY%" (
    echo       Creating the app's own Python environment ^(one-time^)...
    python -m venv env
    if errorlevel 1 (
        echo.
        echo Could not create the Python environment.
        echo Reinstall Python from https://www.python.org/downloads/ and try again.
        echo.
        pause
        exit /b 1
    )
) else (
    echo       Python environment already exists - skipping.
)

set "HASH_FILE=env\.requirements.hash"
set "CUR_HASH="
for /f %%h in ('powershell -NoProfile -Command "(Get-FileHash -Algorithm SHA256 'requirements.txt').Hash"') do set "CUR_HASH=%%h"
set "OLD_HASH="
if exist "%HASH_FILE%" set /p OLD_HASH=<"%HASH_FILE%"
if not "%CUR_HASH%"=="%OLD_HASH%" (
    echo       Installing app packages ^(first run or requirements changed^)...
    "%VENV_PY%" -m pip install --upgrade pip >nul 2>nul
    "%VENV_PY%" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo Package install failed. Check your internet connection and try again.
        echo.
        pause
        exit /b 1
    )
    echo %CUR_HASH%> "%HASH_FILE%"
) else (
    echo       Packages already installed - skipping.
)

echo [2/2] Creating a desktop shortcut...
set "SHORTCUT_DIR="
for /f "delims=" %%d in ('powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"') do set "SHORTCUT_DIR=%%d"
if "%SHORTCUT_DIR%"=="" set "SHORTCUT_DIR=%USERPROFILE%\Desktop"
if not "%~1"=="" set "SHORTCUT_DIR=%~1"
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut((Join-Path '%SHORTCUT_DIR%' 'Switcher.lnk')); $sc.TargetPath = '%~dp0start.bat'; $sc.WorkingDirectory = '%~dp0'; $sc.IconLocation = '%~dp0assets\switcher.ico'; $sc.Description = 'Switcher - manage your AI agents, providers and configs'; $sc.Save()" >nul 2>nul
if errorlevel 1 (
    echo       Could not create the shortcut - you can still run start.bat manually.
) else (
    echo       Shortcut created: "Switcher" on your desktop.
)

echo.
echo Done! Double-click "Switcher" on your desktop to run the app.
echo.
pause
