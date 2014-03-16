# Django settings for hiertags project.
from os.path import abspath, dirname, join

DEBUG = False
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    ('Bence Lovas', 'lovasb@hal.elte.hu'),
)

MANAGERS = ADMINS

PROJECT_ROOT = dirname(dirname(dirname(abspath(__file__)))).replace('\\','/')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': PROJECT_ROOT + '/database.sq3',
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
    }
}

TIME_ZONE = 'Europe/Budapest'
LANGUAGE_CODE = 'en-en'
SITE_ID = 1
#USE_I18N = True
#USE_L10N = True
USE_TZ = True

# Directories
MEDIA_ROOT = PROJECT_ROOT + '/uploads/'
MEDIA_URL = '/media/'
STATIC_ROOT = PROJECT_ROOT + '/static/'
STATIC_URL = '/static/'


STATICFILES_DIRS = (
    ("site_media", join(dirname(dirname(__file__)),'site_media').replace('\\','/')),
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

SECRET_KEY = 'xfgfa7a*+n&v8d(nfv6s)@+*^7nqe0&fr18ursn_cm%-t1fk^i'

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
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'hiertags.urls'

WSGI_APPLICATION = 'hiertags.wsgi.application'

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.request',
    'django.core.context_processors.static',
    'django.core.context_processors.media',
    'hiertags.context_processors.act_menu',
    'django.contrib.messages.context_processors.messages',
)

TEMPLATE_DIRS = (
    join(dirname(dirname(__file__)),'templates').replace('\\','/'),
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
    #'django.contrib.admindocs',
    'crispy_forms',
    'graphviz',
)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'DEBUG',
            'propagate': True
        },
    }
}

CRISPY_TEMPLATE_PACK = 'bootstrap3'
ALLOWED_HOSTS = ['*']
LOGIN_REDIRECT_URL = '/home/'