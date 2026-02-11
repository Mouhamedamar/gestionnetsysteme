@echo off
echo Installation des dependances...
echo.

REM Activer le venv
call venv\Scripts\activate.bat

REM Installer les dependances
pip install -r requirements.txt

echo.
echo Installation terminee!
echo Vous pouvez maintenant lancer: cd gestion_stock ^&^& python manage.py runserver
pause

