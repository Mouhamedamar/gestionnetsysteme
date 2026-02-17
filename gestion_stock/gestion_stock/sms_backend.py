"""
Backend SMS centralisé : API Orange (Sénégal).
Utilise OAuth 2.0 v3 pour l'authentification.
Supporte NETSYSTEME et SSE avec des identifiants distincts.
"""
import logging
import time
import base64
from django.conf import settings
import requests

logger = logging.getLogger(__name__)

# Sénégal : country_sender_number selon documentation Orange
ORANGE_SENDER_NUMBER = '2210000'
ORANGE_TOKEN_URL = 'https://api.orange.com/oauth/v3/token'
ORANGE_SMS_BASE = 'https://api.orange.com/smsmessaging/v1'

# Cache des tokens par société (expire après 1h)
_token_cache = {}


def _get_credentials(company):
    """Retourne (client_id, client_secret, sender_name) pour la société."""
    company_upper = (company or 'NETSYSTEME').upper()
    if company_upper == 'SSE':
        return (
            getattr(settings, 'ORANGE_CLIENT_ID_SSE', '') or '',
            getattr(settings, 'ORANGE_CLIENT_SECRET_SSE', '') or '',
            getattr(settings, 'ORANGE_SENDER_NAME_SSE', '') or 'SSE',
        )
    # NETSYSTEME par défaut
    return (
        getattr(settings, 'ORANGE_CLIENT_ID', '') or '',
        getattr(settings, 'ORANGE_CLIENT_SECRET', '') or '',
        getattr(settings, 'ORANGE_SENDER_NAME', '') or 'NETSYSTEME',
    )


def _get_orange_token(company='NETSYSTEME'):
    """
    Récupère un token OAuth Orange pour la société (ou le cache si encore valide).
    Retourne le token ou None en cas d'erreur.
    """
    client_id, client_secret, _ = _get_credentials(company)
    if not (client_id and client_secret):
        return None

    key = company or 'NETSYSTEME'
    now = time.time()
    if key not in _token_cache:
        _token_cache[key] = {'token': None, 'expires_at': 0}
    cache = _token_cache[key]
    if cache['token'] and cache['expires_at'] > now + 60:
        return cache['token']

    auth_str = f"{client_id}:{client_secret}"
    auth_b64 = base64.b64encode(auth_str.encode()).decode()
    headers = {
        'Authorization': f'Basic {auth_b64}',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
    }
    data = {'grant_type': 'client_credentials'}

    try:
        r = requests.post(ORANGE_TOKEN_URL, headers=headers, data=data, timeout=15)
        r.raise_for_status()
        json_res = r.json()
        token = json_res.get('access_token')
        expires_in = int(json_res.get('expires_in', 3600))
        if token:
            cache['token'] = token
            cache['expires_at'] = now + expires_in
        return token
    except requests.RequestException as e:
        logger.exception("Erreur récupération token Orange (%s): %s", company, e)
        cache['token'] = None
        return None


def send_sms(to_phone, body, company='NETSYSTEME'):
    """
    Envoie un SMS via l'API Orange.

    Args:
        to_phone: numéro au format E.164 (ex: +221771234567)
        body: texte du SMS
        company: 'NETSYSTEME' ou 'SSE' pour choisir les identifiants Orange

    Returns:
        True si envoyé avec succès, False sinon.
    """
    client_id, client_secret, sender_name = _get_credentials(company)
    if not (client_id and client_secret):
        logger.info("SMS Orange non configuré (%s) – destinataire: %s", company, to_phone)
        return False

    token = _get_orange_token(company)
    if not token:
        return False

    # URL encodée : tel:+2210000 -> tel%3A%2B2210000
    sender_encoded = 'tel%3A%2B' + ORANGE_SENDER_NUMBER
    url = f"{ORANGE_SMS_BASE}/outbound/{sender_encoded}/requests"

    address = to_phone if to_phone.startswith('tel:') else f"tel:{to_phone}"
    payload = {
        "outboundSMSMessageRequest": {
            "address": address,
            "senderAddress": f"tel:+{ORANGE_SENDER_NUMBER}",
            "outboundSMSTextMessage": {"message": body},
        }
    }
    if sender_name:
        payload["outboundSMSMessageRequest"]["senderName"] = str(sender_name)[:11]

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }

    try:
        r = requests.post(url, json=payload, headers=headers, timeout=15)
        if r.status_code in (200, 201):
            logger.info("SMS Orange (%s) envoyé à %s", company, to_phone)
            return True
        logger.warning("SMS Orange échec %s: %s", r.status_code, r.text[:200])
        if r.status_code == 401 and 'Expired' in r.text:
            key = company or 'NETSYSTEME'
            if key in _token_cache:
                _token_cache[key]['token'] = None
            return send_sms(to_phone, body, company)
        return False
    except requests.RequestException as e:
        logger.exception("Erreur envoi SMS Orange à %s: %s", to_phone, e)
        return False


def normalize_phone(phone):
    """
    Normalise le numéro au format E.164 pour l'API Orange.
    Formats acceptés: 771234567, +221771234567 (Sénégal)
    """
    if not phone or not str(phone).strip():
        return None
    phone = str(phone).strip().replace(' ', '')
    if phone.startswith('+'):
        return phone
    if len(phone) == 9 and phone[0] in ('7', '8'):
        return '+221' + phone
    if len(phone) == 10 and phone.startswith('0'):
        return '+221' + phone[1:]
    return '+' + phone if phone else None
