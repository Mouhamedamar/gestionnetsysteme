# Modifications — Application Gestion de Stock (20 février 2026)

## Accès et rôles

- **Lien Administration** : le lien « Administration » ouvre l’interface d’administration Django (backend), plus une page du frontend.
- **Rôle « Administration (pointage seul) »** : accès uniquement au Tableau de bord et à la page Pointage ; pas d’accès aux Installations, Interventions, Clients, etc. ; accès direct par URL à une page non autorisée → redirection vers l’accueil.

## Tableau de bord — Rôle pointage seul

- Tableau de bord limité au **pointage** : cartes (Pointages aujourd’hui, Dernier pointage, Accéder au pointage, Présence du mois) et rapport au format **DATE | AGENT | TYPE | ENTRÉE | SORTIE | DURÉE | LIEU | STATUT**.
- **Présence du mois** : affichage du nombre de jours (présences complètes) et du total d’heures (carte, texte au-dessus du tableau, ligne de total en bas du tableau).
- Blocs « Prochaines Interventions » et « Prochaines Installations » masqués pour ce rôle.

## Calendrier Google

- Calendrier Google affiché sur les tableaux de bord **Technicien**, **Commercial** et **Pointage seul** (pas sur Admin).
- URL configurable via `VITE_GOOGLE_CALENDAR_EMBED_URL` dans le `.env` du frontend ; encadré « Comment configurer » si calendrier par défaut.
- Si aucune URL n’est configurée : affichage d’un calendrier public par défaut.

## Rapports de pointage par email

- **Rapport quotidien (10h)** : envoi par **email uniquement** aux responsables ; **plus de pièce jointe PDF**.
- **Rapport hebdomadaire** : nouveau rapport (lundi–dimanche), envoyé par email uniquement (pas de PDF), avec tableau DATE | AGENT | TYPE | ENTRÉE | SORTIE | DURÉE | LIEU | STATUT et synthèse (nombre de jours, total heures). Commande : `python manage.py send_pointage_weekly_report` (option `--week=2026-W08`, `--dry-run` pour test sans envoi).

## Tâche planifiée (rapport quotidien 10h)

- Script `.bat` : suppression de `pause`, ajout de `exit` en fin de script ; suppression de l’installation reportlab (rapport sans PDF).

## Rapport du jour dans l’application

- Sur la page **Pointage**, les **administrateurs** ont un bouton **« Rapport du jour »** qui ouvre une modale (synthèse Présents / Retards / Absents + tableau détaillé).
- API réservée aux admins : `GET /api/pointages/rapport-quotidien/` (paramètre optionnel `?date=YYYY-MM-DD`).
