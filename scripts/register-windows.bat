@echo off
REM register-windows.bat — Register .prod file association on Windows
REM Run as Administrator after installing the app.
REM
REM Usage: register-windows.bat "C:\Program Files\Products Editor\Products.exe"

setlocal

set APP_PATH=%~1
if "%APP_PATH%"=="" (
    echo Usage: %~nx0 "C:\path\to\Products-Editor.exe"
    exit /b 1
)

if not exist "%APP_PATH%" (
    echo ❌ App not found at: %APP_PATH%
    exit /b 1
)

REM Register file type
ftype ProductsEditor.prod="%APP_PATH%" "%%1"
assoc .prod=ProductsEditor.prod

REM Set icon (optional — points to the exe itself, which has icon resources)
reg add "HKEY_CLASSES_ROOT\ProductsEditor.prod\DefaultIcon" /ve /t REG_SZ /d "%APP_PATH%,0" /f

REM Add to Open With list
reg add "HKEY_CLASSES_ROOT\.prod\OpenWithProgids" /v "ProductsEditor.prod" /t REG_SZ /d "" /f

echo ✅ .prod file association registered
echo    Double-click a .prod file to open with Products Editor

endlocal
