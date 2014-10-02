import os

# ===========================
# = Directory Declaractions =
# ===========================

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# ===================
# = Server Settings =
# ===================

# A tuple that lists people who get code error notifications.
# When DEBUG=False and a view raises an exception, Django will email these people
# with the full exception information
ADMINS = (
    ('Server Admin', 'admin@example.com'),
)

SERVER_NAME = 'hiertags'
SERVER_EMAIL = 'hiertags@hal.hu'
SECRET_KEY = 'xfgfa7a*+n&v8d(nfv6s)@+*^7nqe0&fr18ursn_cm%-t1fk^i'

# ===================
# = Global Settings =
# ===================

# Never deploy a site into production with DEBUG turned on. I
DEBUG = False
# Detailed report for any exception raised during template rendering.
TEMPLATE_DEBUG = False

MANAGERS = ADMINS
TIME_ZONE = 'Europe/Budapest'
LANGUAGE_CODE = 'en-us'
#Use timezones
USE_TZ = True
SITE_ID = 1
# Translation system
USE_I18N = False
# URL to use when referring to static files located in STATIC_ROOT.
STATIC_URL = '/static/'
# The absolute path to the directory where collectstatic will collect static files for deployment.
#STATIC_ROOT = os.path.join(BASE_DIR, '../static')
ALLOWED_HOSTS = ['*']
# Additional locations the staticfiles app will traverse if the FileSystemFinder finder is enabled
#STATICFILES_DIRS = (
#    os.path.join(BASE_DIR, '../media'),
#)
# List of locations of the template source files searched by django in search order.
# =============
# = Databases =
# =============
# A dictionary containing the settings for all databases to be used with Django.
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
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

TEMPLATE_LOADERS = (
    ('django.template.loaders.cached.Loader', (
        'django.template.loaders.filesystem.Loader',
        'django.template.loaders.app_directories.Loader',
    )),
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
    'django.contrib.messages.context_processors.messages',
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
    'apps.base',
    'apps.visualize',
)

TEST_RUNNER = 'django.test.runner.DiscoverRunner'

# ==========================
# = Miscellaneous Settings =
# ==========================

ROOT_URLCONF = 'hiertags.urls'
WSGI_APPLICATION = 'hiertags.wsgi.application'

#Import setting for debug configuration and for the admin interface
from adminconf import ADMIN_ENABLED

try:
    from settings_dev import *
except ImportError, exp:
    pass