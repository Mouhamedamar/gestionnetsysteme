@echo off
echo ========================================
echo  DEMARRAGE ET TEST COMPLET
echo ========================================
echo.

REM Tester les configurations
echo [1/4] Test des configurations...
py fix_upload_permissions.py
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Probleme de configuration detecte
    pause
    exit /b 1
)

echo.
echo [2/4] Test upload Django...
py test_upload_simple.py
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Probleme upload Django detecte
    pause
    exit /b 1
)

echo.
echo [3/4] Demarrage du serveur Django...
start "Django Backend" cmd /k "cd /d %~dp0gestion_stock && py manage.py runserver"

REM Attendre que Django démarre
timeout /t 3 /nobreak > nul

echo [4/4] Demarrage du serveur Frontend...
start "Frontend React" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo  SERVEURS DEMARRES !
echo ========================================
echo.
echo Backend Django:  http://localhost:8000
echo Frontend React:  http://localhost:3000
echo.
echo CONNEXION:
echo Username: admin
echo Password: admin123
echo.
echo GUIDE DE DEPANNAGE: DEBUG_FRONTEND_UPLOAD.md
echo.
echo Pour tester l'upload:
echo 1. Ouvrez http://localhost:3000
echo 2. Connectez-vous avec admin/admin123
echo 3. Allez dans Produits ^> Ajouter
echo 4. Selectionnez une image et creez le produit
echo 5. Ouvrez F12 pour voir les logs de debug
echo.
pause