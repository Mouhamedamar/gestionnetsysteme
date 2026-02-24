# Rapport de pointage à 10h — Exécution automatique (Windows)

Si le rapport **ne part pas automatiquement à 10h**, vérifier les points ci‑dessous dans le **Planificateur de tâches** Windows.

---

## 1. Créer ou modifier la tâche

1. Ouvrir le **Planificateur de tâches** (recherche Windows : « Planificateur de tâches »).
2. **Créer une tâche** (pas « Créer une tâche de base » pour avoir toutes les options).
3. Renseigner comme suit.

### Onglet **Général**

- **Nom** : `Rapport pointage quotidien 10h`
- Cocher **Exécuter même si l'utilisateur n'est pas connecté** (sinon la tâche ne tourne pas à 10h si personne n’est connecté).
- Cocher **Exécuter avec les privilèges les plus élevés** si besoin (sinon laisser décoché).
- Choisir **Configuré pour** : Windows 10/11.

### Onglet **Déclencheurs**

- **Nouveau** :
  - **Répéter** : Quotidien
  - **Heure** : **10:00:00**
  - **Récurrence** : 1 jour
  - **Activé** : coché
- Valider par **OK**.

### Onglet **Actions**

- **Nouveau** → **Démarrer un programme** :
  - **Programme/script** : mettre le chemin **complet** du fichier `.bat`, **avec guillemets** (à cause des espaces), par exemple :
    ```text
    "C:\Users\Mouha\Downloads\Gestion stage\gestion_stock\envoi_rapport_pointage_10h.bat"
    ```
  - **Démarrer dans** : dossier contenant `manage.py`, par exemple :
    ```text
    C:\Users\Mouha\Downloads\Gestion stage\gestion_stock
    ```
  - Ne pas remplir « Arguments ».
- **OK**.

### Onglet **Conditions**

- Décocher **Démarrer la tâche uniquement si l’ordinateur est branché sur secteur** si vous voulez que ça tourne aussi sur batterie.
- Décocher **Réveiller l’ordinateur pour exécuter cette tâche** (sauf si vous voulez réveiller le PC à 10h).

### Onglet **Paramètres**

- Cocher **Autoriser l’exécution de la tâche à la demande**.
- Cocher **Exécuter la tâche dès que possible après un démarrage manqué** (si le PC était éteint à 10h, la tâche se lancera au prochain allumage).
- **Si la tâche échoue, redémarrer après** : 1 minute (optionnel).

4. **OK** pour enregistrer : si vous avez coché « Exécuter même si l'utilisateur n'est pas connecté », Windows demandera le **mot de passe** du compte utilisateur.

---

## 2. Vérifications rapides

- **Tâche activée** : dans la liste des tâches, la colonne **État** doit être **Prêt** (pas « Désactivé »).
- **Test manuel** : clic droit sur la tâche → **Exécuter**. Vérifier ensuite :
  - le fichier `gestion_stock\logs\rapport_auto_log.txt` (sortie de la commande),
  - la réception de l’email par les responsables (si SMTP et destinataires sont configurés).
- **Commande à tester en PowerShell** (si la tâche reste « En cours ») :
  `cd "C:\Users\Mouha\Downloads\Gestion stage\gestion_stock"` puis
  `..\venv\Scripts\python.exe manage.py send_pointage_daily_report` — si ça bloque, le blocage vient du SMTP (timeout 10 s dans settings).
- **Dernière exécution** : dans le Planificateur, colonne **Dernière exécution**. Si à 10h vous voyez une heure, la tâche a bien été lancée à ce moment‑là.

---

## 3. Si ça ne part toujours pas à 10h

- **PC éteint ou en veille à 10h** : la tâche ne peut pas s’exécuter. Soit laisser le PC allumé à 10h, soit utiliser un serveur ou un PC qui reste allumé.
- **« Exécuter uniquement si l’utilisateur est connecté »** : à 10h, si personne n’est connecté, la tâche ne tourne pas. Utiliser **Exécuter même si l’utilisateur n’est pas connecté** et entrer le mot de passe.
- **Antivirus / pare-feu** : ils peuvent bloquer l’exécution de tâches planifiées ; ajouter une exception si besoin.
- **Chemins** : vérifier que les chemins du script et « Démarrer dans » sont corrects (pas de faute, espaces gérés par les guillemets).

---

## 4. Fichiers utiles

- Script : `gestion_stock\envoi_rapport_pointage_10h.bat`
- Log : `gestion_stock\logs\rapport_auto_log.txt` (sortie de la commande Python)
- Configuration email : `gestion_stock\.env` (EMAIL_HOST, EMAIL_HOST_USER, etc.)
- Destinataires : dans l’application, menu **Notifications Stock** (Responsables à notifier avec une adresse email).
