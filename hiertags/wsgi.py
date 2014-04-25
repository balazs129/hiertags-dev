"""
WSGI config for hiertags project.

This module contains the WSGI application used by Django's development server
and any production WSGI deployments. It should expose a module-level variable
named ``application``. Django's ``runserver`` and ``runfcgi`` commands discover
this application via the ``WSGI_APPLICATION`` setting.

Usually you will have the standard Django WSGI application here, but it also
might make sense to replace the whole Django WSGI application with a custom one
that later delegates to the Django one. For example, you could introduce WSGI
middleware here, or combine a Django application with an application of another
framework.

"""
import os
import sys
from os.path import abspath, dirname

import site

# Add the site-packages of the chosen virtualenv to work with
site.addsitedir('/home/lovasb/.virtualenvs/hiertags/lib/python2.7/site-packages')

sys.path.append(dirname(dirname(abspath(__file__))).replace('\\', '/'))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hiertags.settings")

# Activate your virtual env
# activate_env = os.path.expanduser("~/.virtualenvs/myprojectenv/bin/activate_this.py")
# execfile(activate_env, dict(__file__=activate_env))

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()

