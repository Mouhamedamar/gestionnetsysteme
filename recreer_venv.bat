@echo off
chcp 65001 >nul
echo ============================================
echo   Recréation du venv et installation
echo ============================================
cd /d "%~dp0"

REM Utiliser le Python du système (py) pour créer le venv, pas celui du venv cassé
where py >nul 2>&1
if %errorlevel% neq 0 (
  echo Py non trouvé, tentative avec python...
  set "PY=python"
) else (
  set "PY=py -3"
)

echo.
echo 1. Désactivation du venv actuel (si activé)...
call venv\Scripts\deactivate.bat 2>nul

echo.
echo 2. Renommage de l'ancien venv en venv_old...
if exist venv (
  if exist venv_old rmdir /s /q venv_old
  ren venv venv_old
  echo    venv renommé en venv_old.
) else (
  echo    Pas d'ancien venv.
)

echo.
echo 3. Création du nouveau venv...
%PY% -m venv venv
if %errorlevel% neq 0 (
  echo ERREUR: impossible de créer le venv. Vérifiez que Python est installé.
  pause
  exit /b 1
)
echo    venv créé.

echo.
echo 4. Mise à jour de pip...
venv\Scripts\python.exe -m pip install --upgrade pip

echo.
echo 5. Installation des dépendances (gestion_stock)...
venv\Scripts\python.exe -m pip install -r gestion_stock\requirements.txt
if %errorlevel% neq 0 (
  echo ERREUR lors de l'installation.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Terminé. Pour activer le venv :
echo   venv\Scripts\activate
echo ============================================
pause
