@echo off
echo ========================================
echo  DEMARRAGE DES SERVEURS
echo ========================================
echo.

REM Démarrer Django dans une nouvelle fenêtre
echo [1/2] Demarrage du serveur Django...
start "Django Backend" cmd /k "cd /d %~dp0gestion_stock && python manage.py runserver"

REM Attendre 2 secondes
timeout /t 2 /nobreak > nul

REM Démarrer Vite dans une nouvelle fenêtre
echo [2/2] Demarrage du serveur Frontend...
start "Frontend Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo  SERVEURS DEMARRES !
echo ========================================
echo.
echo Backend Django:  http://localhost:8000
echo Frontend React:  http://localhost:3000 (ou 5173)
echo.
echo Pour arreter les serveurs, fermez les fenetres
echo ou appuyez sur Ctrl+C dans chaque terminal.
echo.
pause
