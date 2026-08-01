@echo off
setlocal enabledelayedexpansion

REM ------------------------------------------------------------
REM  JSON REGISTRY GENERATOR
REM  Builds: "DSP Settings\dsp.json"
REM  Scans:  "DSP Settings\Settings" for all preset .json files
REM ------------------------------------------------------------

REM ------------------------------------------------------------
REM  BASE DIRECTORY (LOCATION OF THIS SCRIPT)
REM ------------------------------------------------------------
set "BASE_DIR=%~dp0"
set "DSP_ROOT=%BASE_DIR%"
set "DSP_SETTINGS_DIR=%DSP_ROOT%Settings"
set "DSP_OUTPUT_FILE=%DSP_ROOT%dsp.json"

echo Script folder: "%BASE_DIR%"
echo Settings dir:  "%DSP_SETTINGS_DIR%"
echo Output file:   "%DSP_OUTPUT_FILE%"
echo.

REM ------------------------------------------------------------
REM  VALIDATE SETTINGS FOLDER
REM ------------------------------------------------------------
if not exist "%DSP_SETTINGS_DIR%" (
    echo ERROR: Settings directory not found:
    echo   "%DSP_SETTINGS_DIR%"
    echo.
    pause
    goto :eof
)

dir /b "%DSP_SETTINGS_DIR%\*.json" >nul 2>&1
if errorlevel 1 (
    echo ERROR: No .json files found in "%DSP_SETTINGS_DIR%"
    echo.
    pause
    goto :eof
)

REM ------------------------------------------------------------
REM  BEGIN JSON ARRAY
REM ------------------------------------------------------------
> "%DSP_OUTPUT_FILE%" echo [

set first=1

REM ------------------------------------------------------------
REM  LOOP THROUGH ALL PRESET JSON FILES
REM ------------------------------------------------------------
for %%F in ("%DSP_SETTINGS_DIR%\*.json") do (
    set "FILENAME=%%~nF"

    if !first! equ 1 (
        set first=0
    ) else (
        >> "%DSP_OUTPUT_FILE%" echo ,
    )

    >> "%DSP_OUTPUT_FILE%" echo   {
    >> "%DSP_OUTPUT_FILE%" echo     "name": "!FILENAME!",
    >> "%DSP_OUTPUT_FILE%" echo     "file": "DSP Settings/Settings/%%~nF.json"
    >> "%DSP_OUTPUT_FILE%" echo   }
)

REM ------------------------------------------------------------
REM  CLOSE JSON ARRAY
REM ------------------------------------------------------------
>> "%DSP_OUTPUT_FILE%" echo ]

echo.
echo DONE: "%DSP_OUTPUT_FILE%" created.
echo.
pause

endlocal
