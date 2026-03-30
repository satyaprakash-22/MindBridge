@echo off
REM MindBridge Development Helper Script for Windows

setlocal enabledelayedexpansion
set "ROOT_DIR=%~dp0"

REM Colors would require third-party tools, so we'll use simple text

echo.
echo MindBridge Development Helper
echo ==============================

if "%1"=="start" (
    echo.
    echo Starting MindBridge development environment...
    
    echo.
    echo Starting backend...
    pushd "%ROOT_DIR%backend"
    start "MindBridge Backend" cmd /k "npm run dev"
    popd
    
    timeout /t 3 /nobreak
    
    echo.
    echo Starting frontend...
    pushd "%ROOT_DIR%frontend"
    start "MindBridge Frontend" cmd /k "npm run dev"
    popd
    
    echo.
    echo Services started:
    echo   Frontend: http://localhost:8080
    echo   Backend: http://localhost:3001
    echo   pgAdmin: http://localhost:5050
    
) else if "%1"=="db-up" (
    echo.
    echo Starting database...
    pushd "%ROOT_DIR%backend"
    docker-compose up -d
    popd
    echo Database started
    echo   pgAdmin: http://localhost:5050
    
) else if "%1"=="db-down" (
    echo.
    echo Stopping database...
    pushd "%ROOT_DIR%backend"
    docker-compose down
    popd
    echo Database stopped
    
) else if "%1"=="studio" (
    echo.
    echo Opening Prisma Studio...
    pushd "%ROOT_DIR%backend"
    call npx prisma studio
    popd
    
) else if "%1"=="migrate" (
    echo.
    echo Running database migration: %2
    pushd "%ROOT_DIR%backend"
    call npx prisma migrate dev --name %2
    popd
    
) else if "%1"=="install" (
    echo.
    echo Installing dependencies...
    
    echo.
    echo Backend:
    pushd "%ROOT_DIR%backend"
    call npm install
    popd
    
    echo.
    echo Frontend:
    pushd "%ROOT_DIR%frontend"
    call npm install
    popd
    
    echo Dependencies installed
    
) else if "%1"=="status" (
    echo.
    echo System Status
    echo =============
    
    echo.
    echo Checking database...
    docker-compose -f "%ROOT_DIR%backend\docker-compose.yml" ps
    
) else if "%1"=="health" (
    echo.
    echo Health Check
    echo ============
    
    echo.
    echo Backend:
    curl -s http://localhost:3001/api/health
    
    echo.
    echo.
    
) else (
    echo.
    echo Usage:
    echo   dev.bat start              Start all services
    echo   dev.bat db-up              Start database
    echo   dev.bat db-down            Stop database
    echo   dev.bat studio             Open Prisma Studio
    echo   dev.bat migrate [name]     Run database migration
    echo   dev.bat install            Install all dependencies
    echo   dev.bat status             Check services status
    echo   dev.bat health             Check service health
    echo.
    echo Examples:
    echo   dev.bat start
    echo   dev.bat db-up
    echo   dev.bat migrate add_users_table
)

endlocal
