"""
Django settings for gestion_stock project
Compatible Django 6.x – DEV
"""

from pathlib import Path
from datetime import timedelta
import os

# =============================
# BASE
# =============================
BASE_DIR = Path(__file__).resolve().parent.parent

# Charger .env depuis le dossier gestion_stock/ (où se trouve manage.py)
_env_path = BASE_DIR / '.env'

def _load_dotenv_into_environ(path):
    """Charge les lignes KEY=VALUE du .env dans os.environ (pour fiabilité email, etc.)."""
    try:
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, _, v = line.partition('=')
                        k, v = k.strip(), v.strip()
                        if k and v and k not in os.environ:
                            os.environ[k] = v
    except Exception:
        pass

_load_dotenv_into_environ(_env_path)

try:
    from decouple import Config, RepositoryEnv
    _env_config = Config(RepositoryEnv(str(_env_path))) if _env_path.exists() else Config()
    def env_config(key, default=''):
        return _env_config.get(key, default=default)
except (ImportError, Exception):
    def env_config(key, default=''):
        return os.environ.get(key, default)

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-dev-key-change-in-prod')

# Mode développement local : activer DEBUG et autoriser localhost
# En Docker : DEBUG=0, ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,backend
_debug_env = os.environ.get('DEBUG', '')
DEBUG = _debug_env.lower() in ('1', 'true', 'yes') if _debug_env else True
_allowed = os.environ.get('ALLOWED_HOSTS', '').strip()
ALLOWED_HOSTS = [h.strip() for h in _allowed.split(',') if h.strip()] if _allowed else ['localhost', '127.0.0.1', '0.0.0.0']
DEFAULT_HOST = os.environ.get('DEFAULT_HOST', 'localhost:8000')

# =============================
# APPLICATIONS
# =============================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_yasg',

    # Local
    'accounts',
    'products',
    'stock',
    'invoices',
    'expenses',
    'interventions',
    'quotes',
    'installations',
    'zones',
    'pointage',
]

# =============================
# MIDDLEWARE
# =============================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # DOIT ÊTRE EN PREMIER
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =============================
# URLS / WSGI
# =============================
ROOT_URLCONF = 'gestion_stock.urls'
WSGI_APPLICATION = 'gestion_stock.wsgi.application'

# =============================
# TEMPLATES
# =============================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# =============================
# DATABASE
# =============================
# MySQL : DATABASE_URL=mysql://user:pass@host:3306/dbname (PyMySQL)
# PostgreSQL : DATABASE_URL=postgres://... (psycopg2-binary)
_database_url = os.environ.get('DATABASE_URL', '').strip()
if _database_url and _database_url.startswith('mysql'):
    import pymysql
    pymysql.install_as_MySQLdb()
if _database_url:
    try:
        import dj_database_url
        DATABASES = {'default': dj_database_url.parse(_database_url)}
        DATABASES['default']['CONN_MAX_AGE'] = 500
    except ImportError:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    _data_dir = os.environ.get('DATA_DIR', '').strip()
    _db_path = Path(_data_dir) / 'db.sqlite3' if _data_dir else BASE_DIR / 'db.sqlite3'
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': _db_path,
        }
    }

# =============================
# AUTH
# =============================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# =============================
# INTERNATIONALIZATION
# =============================
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# =============================
# STATIC / MEDIA
# =============================
STATIC_URL = 'static/'
MEDIA_URL = '/media/'
_data_dir_media = os.environ.get('DATA_DIR', '').strip()
MEDIA_ROOT = Path(_data_dir_media) / 'media' if _data_dir_media else BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================
# DRF
# =============================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',  # login sans auth
    ),
    'EXCEPTION_HANDLER': 'gestion_stock.drf_handlers.custom_exception_handler',
}

# =============================
# JWT
# =============================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# =============================
# CORS
# =============================
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Requis pour accepter les requêtes POST depuis le frontend (Vercel, etc.) — sinon 403 Forbidden
_csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', 'https://gestionnetsysteme.vercel.app').strip()
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(',') if o.strip()]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

# =============================
# SWAGGER
# =============================
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
        }
    },
    'USE_SESSION_AUTH': False,
}

# =============================
# EMAIL (notifications stock, assignation technicien, etc.)
# =============================
# Lecture .env + variables d'environnement (au cas où le .env n'est pas chargé par decouple)
def _email_config(key, default=''):
    v = env_config(key, default=default)
    if v == default or (default == '' and not v):
        v = os.environ.get(key, default)
    return v

EMAIL_HOST = _email_config('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(_email_config('EMAIL_PORT', '587') or '587')
EMAIL_USE_TLS = _email_config('EMAIL_USE_TLS', 'true').lower() == 'true'
EMAIL_USE_SSL = _email_config('EMAIL_USE_SSL', 'false').lower() == 'true'
EMAIL_HOST_USER = (_email_config('EMAIL_HOST_USER', '') or '').strip()
EMAIL_HOST_PASSWORD = (_email_config('EMAIL_HOST_PASSWORD', '') or '').strip()
DEFAULT_FROM_EMAIL = (_email_config('DEFAULT_FROM_EMAIL', '') or '').strip() or 'noreply@gestion-stock.local'
if not DEFAULT_FROM_EMAIL or DEFAULT_FROM_EMAIL == 'noreply@gestion-stock.local':
    DEFAULT_FROM_EMAIL = EMAIL_HOST_USER or 'noreply@gestion-stock.local'

# Utiliser SMTP si backend=smtp OU si identifiants fournis (pour que les emails partent vraiment)
_email_backend = _email_config('EMAIL_BACKEND', 'console').strip().lower()
_has_smtp_creds = bool(EMAIL_HOST_USER and EMAIL_HOST_PASSWORD)
if _email_backend == 'smtp' or _has_smtp_creds:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

EMAIL_TIMEOUT = int(_email_config('EMAIL_TIMEOUT', '10') or '10')

# =============================
# SMS – API Orange (Sénégal) – NETSYSTEME et SSE
# =============================
# Lecture depuis .env (découple) ou variables d'environnement
# NETSYSTEME (défaut)
ORANGE_CLIENT_ID = env_config('ORANGE_CLIENT_ID', default='') or env_config('ORANGE_SMS_CLIENT_ID', default='')
ORANGE_CLIENT_SECRET = env_config('ORANGE_CLIENT_SECRET', default='') or env_config('ORANGE_SMS_CLIENT_SECRET', default='')
ORANGE_SENDER_NAME = env_config('ORANGE_SENDER_NAME', default='') or env_config('ORANGE_SMS_SENDER_NAME', default='')

# SSE (société alternée)
ORANGE_CLIENT_ID_SSE = env_config('ORANGE_CLIENT_ID_SSE', default='')
ORANGE_CLIENT_SECRET_SSE = env_config('ORANGE_CLIENT_SECRET_SSE', default='')
ORANGE_SENDER_NAME_SSE = env_config('ORANGE_SENDER_NAME_SSE', default='SSE')

# Compatibilité ancienne config Twilio (non utilisée)
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_FROM_NUMBER = os.environ.get('TWILIO_FROM_NUMBER', '')

# Static files (collectstatic)
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
