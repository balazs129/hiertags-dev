import os

# ===========================
# = Directory Declaractions =
# ===========================

BASE_DIR = os.path.dirname(__file__)

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

# Never deploy a site into production with DEBUG turned on. If your app raises an exception when
# DEBUG is True, Django will display a detailed traceback,
# including a lot of metadata about your environment, such as all the currently
# defined Django settings
DEBUG = True
# A boolean that turns on/off template debug mode. If this is True, the fancy error page will display
# a detailed report for any exception raised during template rendering.
# This report contains the relevant snippet of the template, with the appropriate line highlighted.
TEMPLATE_DEBUG = False

MANAGERS = ADMINS
TIME_ZONE = 'Europe/Budapest'
LANGUAGE_CODE = 'en-us'
# A boolean that specifies if datetimes will be timezone-aware by default or not.
# If this is set to True, Django will use timezone-aware datetimes internally.
# Otherwise, Django will use naive datetimes in local time.
USE_TZ = True
SITE_ID = 1
# A boolean that specifies whether Djangos translation system should be enabled.
# This provides an easy way to turn it off, for performance. If this is set to False,
# Django will make some optimizations so as not to load the translation machinery.
USE_I18N = False
# URL to use when referring to static files located in STATIC_ROOT.
STATIC_URL = '/static/'
# The absolute path to the directory where collectstatic will collect static files for deployment.
STATIC_ROOT = os.path.join(BASE_DIR, '../static')
# A list of strings representing the host/domain names that this Django site can serve.
# This is a security measure to prevent an attacker from poisoning caches and password
# reset emails with links to malicious hosts by submitting requests with a fake HTTP Host header,
# which is possible even under many seemingly-safe web server configurations.
ALLOWED_HOSTS = ['*']
# This setting defines the additional locations the staticfiles app will traverse if the
# FileSystemFinder finder is enabled
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, '../media'),
)
# List of locations of the template source files searched by django in search order.
TEMPLATE_DIRS = (
    os.path.join(BASE_DIR, '../templates'),
)

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
# A tuple of strings designating all applications that are enabled in this Django installation.
# Each string should be a full Python path to a Python package that contains a Django application
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