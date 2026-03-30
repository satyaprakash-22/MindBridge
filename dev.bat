@echo off
REM MindBridge Development Helper Script for Windows

setlocal enabledelayedexpansion

REM Colors would require third-party tools, so we'll use simple text

echo.
echo MindBridge Development Helper
echo ==============================

if "%1"=="start" (
    echo.
    echo Starting MindBridge development environment...
    
    echo.
    echo Starting backend...
    cd backend
    start cmd /k "npm run dev"
    
    timeout /t 3 /nobreak
    
    echo.
    echo Starting frontend...
    cd ..\the-foundry-forge-main
    start cmd /k "npm run dev"
    
    echo.
    echo Services started:
    echo   Frontend: http://localhost:8080
    echo   Backend: http://localhost:3001
    echo   pgAdmin: http://localhost:5050
    
) else if "%1"=="db-up" (
    echo.
    echo Starting database...
    cd backend
    docker-compose up -d
    echo Database started
    echo   pgAdmin: http://localhost:5050
    
) else if "%1"=="db-down" (
    echo.
    echo Stopping database...
    cd backend
    docker-compose down
    echo Database stopped
    
) else if "%1"=="studio" (
    echo.
    echo Opening Prisma Studio...
    cd backend
    call npx prisma studio
    
) else if "%1"=="migrate" (
    echo.
    echo Running database migration: %2
    cd backend
    call npx prisma migrate dev --name %2
    
) else if "%1"=="install" (
    echo.
    echo Installing dependencies...
    
    echo.
    echo Backend:
    cd backend
    call npm install
    
    echo.
    echo Frontend:
    cd ..\the-foundry-forge-main
    call npm install
    
    echo Dependencies installed
    
) else if "%1"=="status" (
    echo.
    echo System Status
    echo =============
    
    echo.
    echo Checking database...
    docker-compose -f backend\docker-compose.yml ps
    
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
