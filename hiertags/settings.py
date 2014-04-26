import os

# ===========================
# = Directory Declaractions =
# ===========================

BASE_DIR = os.path.dirname(__file__)

# ===================
# = Server Settings =
# ===================

ADMINS = (
    ('Server Admin', 'admin@example.com'),
)

SERVER_NAME = 'hiertags'
SERVER_EMAIL = 'hiertags@hal.hu'
SECRET_KEY = 'xfgfa7a*+n&v8d(nfv6s)@+*^7nqe0&fr18ursn_cm%-t1fk^i'

# ===================
# = Global Settings =
# ===================

DEBUG = False
TEMPLATE_DEBUG = False

MANAGERS = ADMINS
TIME_ZONE = 'Europe/Budapest'
LANGUAGE_CODE = 'en-us'
USE_TZ = True
SITE_ID = 1
USE_I18N = False
MEDIA_URL = '/media/'
STATIC_URL = '/static/'
STATIC_ROOT = 'static'
ALLOWED_HOSTS = ['*']
STATICFILES_DIRS = (
    'media',
    os.path.join(BASE_DIR, '../media')
)
TEMPLATE_DIRS = (
    'templates',
    os.path.join(BASE_DIR, '../templates')
)

# =============
# = Databases =
# =============

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, '../database.sqlite3')
    }
}


# ===========================
# = Django-specific Modules =
# ===========================

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.contrib.flatpages.middleware.FlatpageFallbackMiddleware',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.request',
    'django.core.context_processors.static',
    'django.core.context_processors.media',
    'hiertags.context_processors.act_menu',
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sites',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'django.contrib.flatpages',
    'visualize',
)

# ==========================
# = Miscellaneous Settings =
# ==========================

ROOT_URLCONF = 'hiertags.urls'
WSGI_APPLICATION = 'hiertags.wsgi.application'