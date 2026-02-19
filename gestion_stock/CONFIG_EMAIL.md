# Configuration de l’email

L’application envoie des emails pour :
- **Alertes stock** (mouvements, ruptures) aux responsables configurés (Stock → Notifications)
- **Assignation technicien** (intervention) à l’email du technicien

Par défaut, les emails sont **affichés dans le terminal** (`python manage.py runserver`), ils ne partent pas en boîte mail.

---

## Activer l’envoi d’emails (SMTP)

1. Ouvrez le fichier **`.env`** à la racine du projet (dossier `gestion_stock`, à côté de `manage.py`).

2. Décommentez et remplissez les lignes suivantes :

```env
EMAIL_BACKEND=smtp
DEFAULT_FROM_EMAIL=noreply@votredomaine.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-application
```

3. Redémarrez le serveur Django (`python manage.py runserver`).

---

## Exemples selon le fournisseur

### Gmail
- `EMAIL_HOST=smtp.gmail.com`
- `EMAIL_PORT=587`
- `EMAIL_USE_TLS=true`
- Utilisez un **mot de passe d’application** (pas le mot de passe du compte) :  
  Compte Google → Sécurité → Validation en 2 étapes → Mots de passe d’application.

### Outlook / Office 365
- `EMAIL_HOST=smtp.office365.com`
- `EMAIL_PORT=587`
- `EMAIL_USE_TLS=true`
- Identifiants = email et mot de passe du compte.

### Orange (Sénégal)
- `EMAIL_HOST=smtp.orange.sn` (ou le serveur SMTP indiqué par Orange)
- `EMAIL_PORT=587` ou `465`
- Adresse et mot de passe de la boîte mail Orange.

### Autre serveur SMTP
Renseignez `EMAIL_HOST`, `EMAIL_PORT`, et si besoin `EMAIL_USE_SSL=true` (souvent pour le port 465).

---

## Vérifier la configuration

1. Allez dans **Stock → Notifications**.
2. Ajoutez un responsable avec une **adresse email**.
3. Cliquez sur **Envoyer un email de test** pour ce responsable.

Si la configuration est correcte, l’email de test est envoyé. Sinon, vérifiez le terminal Django pour le message d’erreur.

---

## Rester en mode console (développement)

Ne rien mettre ou laisser :

```env
# EMAIL_BACKEND=console  (défaut)
```

Les emails s’afficheront dans le terminal au lieu d’être envoyés.
