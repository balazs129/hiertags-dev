#!/usr/bin/env python
import os
import sys
import socket

STAGING_HOSTS = set(['piko1', 'hal'])

if __name__ == "__main__":
    current_host = socket.gethostname()
    if current_host in STAGING_HOSTS:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hiertags.settings")
    else:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hiertags.dev_settings")
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)