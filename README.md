
#Installation
This will describe the installation on Ubuntu/Ubuntu Server. The site is configured to work
with this steps.

###Install needed packages
First of all, update the repository.
```bash
    sudo apt-get update
```
Next, we install the packages needed to build other packages.
```bash
    sudo apt-get install build-essential python-dev
```
Now install apache and other needed software. We need the worker version from apache.
```bash
    sudo apt-get install git sqlite3 apache2-mpm-worker libapache2-mod-wsgi python-virtualenv
```
And last, install the packages needed to build lxml.
```bash
    sudo apt-get install libxml2 libxml2-dev libxslt1.1 libxslt1-dev
```

###Create the environment
Because of security reasons we will run the site from a dedicated user home directory.
Create the user, and set password for the account.
```bash
    sudo useradd -s /bin/bash -m hiertags
    sudo passwd hiertags
```
We need to add this user to the sudoers.
```bash
    sudo visudo
````
search the line '# User privilege specification', and add another to look like this:
```bash
    # User privilege specification
    root    ALL=(ALL:ALL) ALL
    hiertags    ALL=(ALL:ALL) ALL
```

