# Script PowerShell pour installer les dépendances
# Exécutez ce script depuis le répertoire racine (gestions/)

Write-Host "Installation des dépendances..." -ForegroundColor Green

# Vérifier que le venv existe
if (-not (Test-Path "venv")) {
    Write-Host "Création du venv..." -ForegroundColor Yellow
    python -m venv venv
}

# Activer le venv
Write-Host "Activation du venv..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Installer les dépendances
Write-Host "Installation des packages depuis requirements.txt..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "Installation terminée!" -ForegroundColor Green
Write-Host "Vous pouvez maintenant lancer: cd gestion_stock && python manage.py runserver" -ForegroundColor Cyan

