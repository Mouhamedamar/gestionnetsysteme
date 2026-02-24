@echo off
REM Rapport pointage quotidien 10h — Planificateur de tâches
cd /d "C:\Users\Mouha\Downloads\Gestion stage\gestion_stock"

if not exist "logs" mkdir "logs"

echo ----- %date% %time% ----- >> logs\rapport_auto_log.txt
"C:\Users\Mouha\Downloads\Gestion stage\venv\Scripts\python.exe" manage.py send_pointage_daily_report >> logs\rapport_auto_log.txt 2>&1

exit /b 0