"""
Rapport quotidien de pointage (entrées) : construction du texte/HTML, envoi par email aux responsables.
Pas de pièce jointe PDF — rapport envoyé en corps d'email (HTML avec repli texte).
Destinataires : StockNotificationRecipient actifs avec email (même liste que les alertes stock).
"""
import html
import logging
from datetime import datetime, time, timedelta
from io import BytesIO

from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)

# Nom de l'entreprise pour l'en-tête du rapport (personnalisable)
REPORT_APP_NAME = getattr(settings, 'POINTAGE_REPORT_APP_NAME', 'Gestion de Stock')

JOURS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']


def _date_long_fr(d):
    """Ex: Vendredi 20 février 2026"""
    return f"{JOURS_FR[d.weekday()]} {d.day} {MOIS_FR[d.month - 1]} {d.year}"


def _format_heure(dt):
    """Retourne l'heure formatée HH:MM."""
    if dt is None:
        return "—"
    if hasattr(dt, 'strftime'):
        return dt.strftime('%H:%M')
    return str(dt)


def _zone_lieu(work_zone):
    """Nom ou adresse de la zone."""
    if not work_zone:
        return "Sans zone"
    return (work_zone.address or work_zone.name or "Sans zone").strip() or work_zone.name or "—"


# Heure limite : au-delà = Retard (justification obligatoire dans le rapport)
HEURE_LIMITE_RETARD = (9, 15)  # 9h15


def _user_display_name(user):
    """Nom affiché (prénom nom ou username)."""
    name = getattr(user, 'username', str(getattr(user, 'id', '')))
    if getattr(user, 'first_name', None) or getattr(user, 'last_name', None):
        name = f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip() or name
    return name


def _compute_status_rows(entries, present_ids, absent_users):
    """
    Retourne (nb_presents, nb_retards, nb_absents, rows).
    Chaque row = (nom, statut, heure_arrivee, heure_sortie, duree, justificatif).
    Retard = pointage d'entrée après HEURE_LIMITE_RETARD (9h15). Justificatif = note du pointage ou "Non justifié".
    """
    from datetime import time as dt_time
    limit = dt_time(*HEURE_LIMITE_RETARD)
    first_entry_by_user = {}  # user_id -> (timestamp time, CheckIn instance)
    for c in entries:
        uid = c.user_id
        if uid not in first_entry_by_user:
            t = c.timestamp.time() if hasattr(c.timestamp, 'time') else c.timestamp
            first_entry_by_user[uid] = (t, c)

    present_list = []
    retard_list = []
    for uid in present_ids:
        val = first_entry_by_user.get(uid)
        if val is None:
            continue
        t, entry = val
        name = _user_display_name(entry.user)
        if t is not None and t >= limit:
            justif = (entry.note or '').strip() or 'Non justifié'
            retard_list.append((name, t, justif))
        else:
            present_list.append((name, t))

    nb_presents = len(present_list)
    nb_retards = len(retard_list)
    nb_absents = len(absent_users)

    rows = []
    for name, t in present_list:
        rows.append((name, 'Présent', _format_heure(t) if t else '—', 'N/A', 'N/A', '—'))
    for name, t, justif in retard_list:
        rows.append((name, 'Retard', _format_heure(t) if t else '—', 'N/A', 'N/A', justif))
    for u in absent_users:
        rows.append((_user_display_name(u), 'Absent', 'N/A', 'N/A', 'N/A', 'Non justifié'))
    return nb_presents, nb_retards, nb_absents, rows


def build_report_text(date_report, entries, present_ids, absent_users):
    """
    Construit le corps texte du rapport (format demandé avec emojis et sections).
    """
    effectif_total = len(present_ids) + len(absent_users)
    now = timezone.now()
    heure_gen = now.strftime('%H') + 'h' + now.strftime('%M')

    lines = [
        "",
        "=" * 70,
        "                 RAPPORT QUOTIDIEN DE POINTAGE — ENTRÉES",
        f"                         {REPORT_APP_NAME}",
        "=" * 70,
        "",
        f"📅 Date du rapport : {_date_long_fr(date_report)}",
        "⏰ Période analysée : 00h00 — 10h00 (GMT)",
        f"🕒 Heure de génération : {heure_gen}",
        "",
        "-" * 70,
        "                     ÉTAT DES POINTAGES D'ENTRÉE",
        "-" * 70,
        "",
    ]
    if entries:
        lines.append(f"  {'Utilisateur':<25} {'Heure':<10} {'Zone / Lieu':<30} Note")
        lines.append("  " + "-" * 75)
        for c in entries:
            user_label = _user_display_name(c.user)
            zone_lieu = _zone_lieu(getattr(c, 'work_zone', None))
            if len(zone_lieu) > 28:
                zone_lieu = zone_lieu[:25] + "..."
            note = (c.note or "")[:25]
            lines.append(f"  {user_label:<25} {_format_heure(c.timestamp):<10} {zone_lieu:<30} {note}")
    else:
        lines.append("Aucun pointage d'entrée n'a été enregistré sur la période analysée.")
    lines.extend([
        "",
        "-" * 70,
        "                         SYNTHÈSE GÉNÉRALE",
        "-" * 70,
        "",
        f"👥 Effectif total attendu : {effectif_total} employés",
        f"✅ Présents : {len(present_ids)}",
        f"❌ Absents : {len(absent_users)}",
        "",
        "Liste des employés absents :",
    ])
    for u in absent_users:
        lines.append(f"  • {_user_display_name(u)}")
    if not absent_users:
        lines.append("  (Aucun)")
    lines.extend([
        "",
        "-" * 70,
        "                        RECOMMANDATION",
        "-" * 70,
        "",
    ])
    if not entries:
        lines.append(
            "⚠️ Aucun employé n'a effectué de pointage ce jour avant 10h00.\n"
            "Il est recommandé de vérifier la situation et de contacter les\n"
            "employés concernés si nécessaire."
        )
    else:
        lines.append("Rapport établi conformément aux pointages enregistrés.")
    lines.extend([
        "",
        "=" * 70,
        "          Rapport généré automatiquement par le système",
        "=" * 70,
        "",
    ])
    return "\n".join(lines)


def build_report_html(date_report, entries, present_ids, absent_users):
    """
    Construit le corps HTML du rapport (style email avec blocs colorés et tableau).
    Sujet type : Rapport de présence du JJ/MM/AAAA.
    """
    nb_presents, nb_retards, nb_absents, rows = _compute_status_rows(entries, present_ids, absent_users)
    date_str = date_report.strftime('%d/%m/%Y')
    now = timezone.now()
    heure_gen = now.strftime('%d/%m/%Y à %H:%M')

    table_rows = ''.join(
        f'<tr><td>{html.escape(nom)}</td><td>{html.escape(statut)}</td><td>{html.escape(heure_arr)}</td><td>{html.escape(heure_sort)}</td><td>{html.escape(duree)}</td><td>{html.escape(justif)}</td></tr>'
        for (nom, statut, heure_arr, heure_sort, duree, justif) in rows
    )
    if not table_rows:
        table_rows = '<tr><td colspan="6">Aucun employé</td></tr>'

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rapport de présence du {date_str}</title>
<style>
  body {{ font-family: Arial, sans-serif; margin: 16px; color: #333; }}
  h1 {{ font-size: 1.25rem; margin-bottom: 1rem; }}
  .summary {{ display: flex; flex-wrap: wrap; gap: 12px; margin: 1rem 0; }}
  .box {{ padding: 12px 20px; border-radius: 8px; font-weight: bold; text-align: center; min-width: 80px; }}
  .box.presents {{ background: #22c55e; color: #fff; }}
  .box.absents {{ background: #ef4444; color: #fff; }}
  .box.retards {{ background: #eab308; color: #000; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; }}
  th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
  th {{ background: #f1f5f9; font-weight: bold; }}
  .footer {{ margin-top: 1.5rem; font-size: 0.85rem; color: #64748b; }}
</style>
</head>
<body>
  <h1>Rapport de présence du {date_str}</h1>

  <div class="summary">
    <div class="box presents">Présents<br><span style="font-size:1.5rem">{nb_presents}</span></div>
    <div class="box absents">Absents<br><span style="font-size:1.5rem">{nb_absents}</span></div>
    <div class="box retards">Retards<br><span style="font-size:1.5rem">{nb_retards}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Status</th>
        <th>Heure d'arrivée</th>
        <th>Heure de sortie</th>
        <th>Durée totale</th>
        <th>Justificatif</th>
      </tr>
    </thead>
    <tbody>
      {table_rows}
    </tbody>
  </table>

  <p class="footer">Rapport généré automatiquement le {heure_gen}</p>
</body>
</html>
"""
    return html_content.strip()


def build_report_pdf(date_report, entries, present_ids, absent_users):
    """
    Génère le PDF du rapport (même contenu que le texte).
    Retourne bytes du PDF.
    """
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    except ImportError:
        logger.warning("reportlab non installé : pièce jointe PDF non générée.")
        return None

    effectif_total = len(present_ids) + len(absent_users)
    now = timezone.now()
    heure_gen = now.strftime('%H') + 'h' + now.strftime('%M')

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(name='ReportTitle', parent=styles['Heading1'], fontSize=14, spaceAfter=12, alignment=1)
    heading_style = ParagraphStyle(name='ReportHeading', parent=styles['Heading2'], fontSize=11, spaceAfter=8, alignment=1)
    normal_style = styles['Normal']

    story = []
    story.append(Paragraph("RAPPORT QUOTIDIEN DE POINTAGE — ENTRÉES", title_style))
    story.append(Paragraph(REPORT_APP_NAME, normal_style))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(f"Date du rapport : {_date_long_fr(date_report)}", normal_style))
    story.append(Paragraph("Période analysée : 00h00 — 10h00 (GMT)", normal_style))
    story.append(Paragraph(f"Heure de génération : {heure_gen}", normal_style))
    story.append(Spacer(1, 0.8*cm))

    story.append(Paragraph("ÉTAT DES POINTAGES D'ENTRÉE", heading_style))
    if entries:
        table_data = [["Utilisateur", "Heure", "Zone / Lieu", "Note"]]
        for c in entries:
            user_label = _user_display_name(c.user)
            zone_lieu = _zone_lieu(getattr(c, 'work_zone', None))
            note = (c.note or "")[:40]
            table_data.append([user_label, _format_heure(c.timestamp), zone_lieu[:35], note])
        t = Table(table_data, colWidths=[5*cm, 2.2*cm, 6*cm, 3*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4472C4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t)
    else:
        story.append(Paragraph("Aucun pointage d'entrée n'a été enregistré sur la période analysée.", normal_style))
    story.append(Spacer(1, 0.8*cm))

    story.append(Paragraph("SYNTHÈSE GÉNÉRALE", heading_style))
    story.append(Paragraph(f"Effectif total attendu : {effectif_total} employés", normal_style))
    story.append(Paragraph(f"Présents : {len(present_ids)}", normal_style))
    story.append(Paragraph(f"Absents : {len(absent_users)}", normal_style))
    story.append(Paragraph("Liste des employés absents :", normal_style))
    for u in absent_users:
        story.append(Paragraph(f"• {_user_display_name(u)}", normal_style))
    if not absent_users:
        story.append(Paragraph("(Aucun)", normal_style))
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("RECOMMANDATION", heading_style))
    if not entries:
        story.append(Paragraph(
            "Aucun employé n'a effectué de pointage ce jour avant 10h00. "
            "Il est recommandé de vérifier la situation et de contacter les employés concernés si nécessaire.",
            normal_style
        ))
    else:
        story.append(Paragraph("Rapport établi conformément aux pointages enregistrés.", normal_style))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("Rapport généré automatiquement par le système", normal_style))

    doc.build(story)
    return buffer.getvalue()


def get_report_recipients():
    """Liste des emails des responsables à notifier (StockNotificationRecipient actifs avec email)."""
    from stock.models import StockNotificationRecipient
    recipients = StockNotificationRecipient.objects.filter(
        is_active=True
    ).exclude(email__isnull=True).exclude(email='')
    return [r.email.strip() for r in recipients if (r.email or '').strip()]


def get_personnel_queryset():
    """Utilisateurs actifs non-admin (ceux qui sont censés pointer)."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    return User.objects.filter(is_active=True).exclude(is_staff=True).exclude(profile__role='admin')


def get_entries_for_day(date_obj):
    """Pointages d'entrée entre 00h00 et 10h00 (exclu) du jour donné, en UTC/GMT."""
    from datetime import timezone as dt_timezone
    start = timezone.make_aware(datetime.combine(date_obj, time.min), dt_timezone.utc)
    end = timezone.make_aware(datetime.combine(date_obj, time(10, 0, 0)), dt_timezone.utc)
    from .models import CheckIn
    return (
        CheckIn.objects.filter(check_type='entree', timestamp__gte=start, timestamp__lt=end)
        .select_related('user', 'work_zone')
        .order_by('timestamp')
    )


def get_daily_report_data(date_report):
    """
    Retourne les données du rapport quotidien pour une date donnée.
    (entries, present_ids, absent_users, personnel) pour réutilisation (API, commande).
    """
    entries = list(get_entries_for_day(date_report))
    personnel = list(get_personnel_queryset())
    present_ids = {c.user_id for c in entries}
    absent_users = [u for u in personnel if u.id not in present_ids]
    return entries, present_ids, absent_users, personnel


# --- Rapport hebdomadaire ---

def _week_start_end(a_date):
    """Retourne (lundi, dimanche) de la semaine contenant a_date (objet date)."""
    start = a_date - timedelta(days=a_date.weekday())
    end = start + timedelta(days=6)
    return start, end


def _format_date_short(d):
    """JJ/MM/AAAA."""
    return d.strftime('%d/%m/%Y')


def _compute_weekly_rows(checkins, tz=None):
    """
    À partir des pointages de la semaine, construit les lignes quotidiennes (une par jour/agent).
    Chaque ligne : (date_fmt, agent, type_zone, entree, sortie, duree, lieu, statut).
    """
    from collections import defaultdict
    if tz is None:
        tz = timezone.get_current_timezone() if timezone.get_current_timezone() else timezone.utc

    by_key = defaultdict(lambda: {
        'entree': None, 'entree_ts': None, 'sortie': None, 'sortie_ts': None,
        'lieu': '—', 'type_zone': 'Bureau', 'user': None,
    })
    for c in checkins:
        local_dt = timezone.localtime(c.timestamp, timezone=tz)
        date_str = local_dt.strftime('%Y-%m-%d')
        key = (date_str, c.user_id)
        row = by_key[key]
        row['user'] = c.user
        zone = getattr(c, 'work_zone', None)
        if zone:
            row['type_zone'] = 'Chantier' if getattr(zone, 'zone_type', None) == 'chantier' else 'Bureau'
            row['lieu'] = (zone.address or zone.name or '—').strip() or '—'
        if c.check_type == 'entree':
            if row['entree_ts'] is None or c.timestamp < row['entree_ts']:
                row['entree'] = _format_heure(c.timestamp)
                row['entree_ts'] = c.timestamp
                if zone:
                    row['lieu'] = (zone.address or zone.name or '—').strip() or '—'
        else:
            if row['sortie_ts'] is None or c.timestamp > row['sortie_ts']:
                row['sortie'] = _format_heure(c.timestamp)
                row['sortie_ts'] = c.timestamp

    rows = []
    for (date_str, _), data in by_key.items():
        d = datetime.strptime(date_str, '%Y-%m-%d').date()
        date_fmt = _format_date_short(d)
        entree = data['entree'] or '—'
        sortie = data['sortie'] or '—'
        duree = '—'
        statut = 'En cours'
        if data['entree_ts'] and data['sortie_ts']:
            delta = data['sortie_ts'] - data['entree_ts']
            h = round(delta.total_seconds() / 3600 * 10) / 10
            duree = f'{h}h'
            statut = 'Present'
        agent = _user_display_name(data['user']) if data['user'] else '—'
        # (date_str pour tri, date_fmt pour affichage, agent, type, entree, sortie, duree, lieu, statut)
        rows.append((date_str, date_fmt, agent, data['type_zone'], entree, sortie, duree, data['lieu'], statut))

    rows.sort(key=lambda r: (r[0], r[2]))  # date puis agent
    return rows


def build_weekly_report_text(week_start, week_end, weekly_rows):
    """Corps texte du rapport hebdomadaire. weekly_rows: (date_str, date_fmt, agent, type, entree, sortie, duree, lieu, statut)."""
    period_str = f"Semaine du {_format_date_short(week_start)} au {_format_date_short(week_end)}"
    now = timezone.now()
    heure_gen = now.strftime('%d/%m/%Y à %H:%M')
    jours_presents = sum(1 for r in weekly_rows if r[8] == 'Present')
    total_heures = 0
    for r in weekly_rows:
        if r[6] != '—' and r[6].endswith('h'):
            try:
                total_heures += float(r[6].replace('h', '').strip())
            except ValueError:
                pass
    total_heures = round(total_heures * 10) / 10

    lines = [
        "",
        "=" * 70,
        "              RAPPORT HEBDOMADAIRE DE POINTAGE",
        f"                         {REPORT_APP_NAME}",
        "=" * 70,
        "",
        f"📅 Période : {period_str}",
        f"🕒 Heure de génération : {heure_gen}",
        "",
        "-" * 70,
        "              DÉTAIL PAR JOUR ET PAR AGENT",
        "-" * 70,
        "",
        f"  {'DATE':<12} {'AGENT':<20} {'TYPE':<10} {'ENTRÉE':<8} {'SORTIE':<8} {'DURÉE':<8} {'LIEU':<20} {'STATUT'}",
        "  " + "-" * 95,
    ]
    for r in weekly_rows:
        lines.append(f"  {r[1]:<12} {r[2]:<20} {r[3]:<10} {r[4]:<8} {r[5]:<8} {r[6]:<8} {r[7]:<20} {r[8]}")
    if not weekly_rows:
        lines.append("  Aucun pointage enregistré sur la période.")
    lines.extend([
        "",
        "-" * 70,
        "                         SYNTHÈSE",
        "-" * 70,
        "",
        f"Nombre de jours (présences complètes) : {jours_presents}",
        f"Total heures : {total_heures}h",
        "",
        "=" * 70,
        "          Rapport généré automatiquement par le système",
        "=" * 70,
        "",
    ])
    return "\n".join(lines)


def build_weekly_report_html(week_start, week_end, weekly_rows):
    """Corps HTML du rapport hebdomadaire. weekly_rows: (date_str, date_fmt, agent, type, entree, sortie, duree, lieu, statut)."""
    period_str = f"Semaine du {_format_date_short(week_start)} au {_format_date_short(week_end)}"
    now = timezone.now()
    heure_gen = now.strftime('%d/%m/%Y à %H:%M')
    jours_presents = sum(1 for r in weekly_rows if r[8] == 'Present')
    total_heures = 0
    for r in weekly_rows:
        if r[6] != '—' and r[6].endswith('h'):
            try:
                total_heures += float(r[6].replace('h', '').strip())
            except ValueError:
                pass
    total_heures = round(total_heures * 10) / 10

    table_rows = ''.join(
        f'<tr><td>{html.escape(r[1])}</td><td>{html.escape(r[2])}</td><td>{html.escape(r[3])}</td>'
        f'<td>{html.escape(r[4])}</td><td>{html.escape(r[5])}</td><td>{html.escape(r[6])}</td>'
        f'<td>{html.escape(r[7])}</td><td>{html.escape(r[8])}</td></tr>'
        for r in weekly_rows
    )
    if not table_rows:
        table_rows = '<tr><td colspan="8">Aucun pointage sur la période</td></tr>'

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rapport hebdomadaire — {period_str}</title>
<style>
  body {{ font-family: Arial, sans-serif; margin: 16px; color: #333; }}
  h1 {{ font-size: 1.25rem; margin-bottom: 1rem; }}
  .summary {{ display: flex; flex-wrap: wrap; gap: 12px; margin: 1rem 0; }}
  .box {{ padding: 12px 20px; border-radius: 8px; font-weight: bold; text-align: center; min-width: 80px; }}
  .box.days {{ background: #3b82f6; color: #fff; }}
  .box.hours {{ background: #22c55e; color: #fff; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }}
  th, td {{ border: 1px solid #ddd; padding: 6px 8px; text-align: left; }}
  th {{ background: #f1f5f9; font-weight: bold; }}
  .footer {{ margin-top: 1.5rem; font-size: 0.85rem; color: #64748b; }}
</style>
</head>
<body>
  <h1>Rapport hebdomadaire de pointage — {period_str}</h1>

  <div class="summary">
    <div class="box days">Jours (présences)<br><span style="font-size:1.5rem">{jours_presents}</span></div>
    <div class="box hours">Total heures<br><span style="font-size:1.5rem">{total_heures}h</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>DATE</th>
        <th>AGENT</th>
        <th>TYPE</th>
        <th>ENTRÉE</th>
        <th>SORTIE</th>
        <th>DURÉE</th>
        <th>LIEU</th>
        <th>STATUT</th>
      </tr>
    </thead>
    <tbody>
      {table_rows}
    </tbody>
  </table>

  <p class="footer">Rapport généré automatiquement le {heure_gen}</p>
</body>
</html>
"""
    return html_content.strip()


def send_pointage_weekly_report(week_start, week_end, weekly_rows):
    """
    Envoie le rapport hebdomadaire par email aux responsables (email uniquement, pas de PDF).
    """
    recipient_list = get_report_recipients()
    if not recipient_list:
        logger.warning("Rapport pointage hebdo : aucun responsable avec email configuré.")
        return

    period_str = f"Semaine du {_format_date_short(week_start)} au {_format_date_short(week_end)}"
    subject = f"Rapport hebdomadaire de pointage — {period_str}"
    body_html = build_weekly_report_html(week_start, week_end, weekly_rows)
    body_text = build_weekly_report_text(week_start, week_end, weekly_rows)
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gestion-stock.local')

    try:
        email = EmailMessage(
            subject=subject,
            body=body_html,
            from_email=from_email,
            to=recipient_list,
        )
        email.content_subtype = 'html'
        email.send(fail_silently=False)
        logger.info(
            "Rapport pointage hebdomadaire envoyé à %d destinataire(s) — %s (email uniquement).",
            len(recipient_list),
            period_str,
        )
        return
    except Exception as e:
        logger.warning("Rapport pointage hebdo : envoi HTML échoué (%s), envoi texte seul.", e)

    try:
        send_mail(
            subject=subject,
            message=body_text,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        logger.info("Rapport pointage hebdo (texte seul) envoyé à %d destinataire(s).", len(recipient_list))
    except Exception as e:
        logger.exception("Erreur envoi rapport pointage hebdo : %s", e)


def send_pointage_report(date_report, entries, present_ids, absent_users):
    """
    Envoie le rapport quotidien par email aux responsables (StockNotificationRecipient avec email).
    Email au format HTML : titre "Rapport de présence du JJ/MM/AAAA", blocs Présents/Absents/Retards, tableau détaillé.
    Pas de pièce jointe PDF — rapport uniquement dans le corps de l'email.
    """
    recipient_list = get_report_recipients()
    if not recipient_list:
        logger.warning("Rapport pointage : aucun responsable avec email configuré (Responsables à notifier).")
        return

    date_str = date_report.strftime('%d/%m/%Y')
    subject = f"Rapport de présence du {date_str}"
    body_html = build_report_html(date_report, entries, present_ids, absent_users)
    body_text = build_report_text(date_report, entries, present_ids, absent_users)
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gestion-stock.local')

    # Envoi HTML (sans PDF)
    try:
        email = EmailMessage(
            subject=subject,
            body=body_html,
            from_email=from_email,
            to=recipient_list,
        )
        email.content_subtype = 'html'
        email.send(fail_silently=False)
        logger.info(
            "Rapport pointage quotidien envoyé à %d destinataire(s) pour le %s (email uniquement, pas de PDF).",
            len(recipient_list),
            date_report.strftime('%Y-%m-%d'),
        )
        return
    except Exception as e:
        logger.warning("Rapport pointage : envoi HTML échoué (%s), envoi texte seul.", e)

    # Repli : envoi texte seul
    try:
        send_mail(
            subject=subject,
            message=body_text,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        logger.info("Rapport pointage (texte seul) envoyé à %d destinataire(s).", len(recipient_list))
    except Exception as e:
        logger.exception("Erreur envoi rapport pointage : %s", e)
