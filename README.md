
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
add user to the www-group
```bash
    sudo usermod -G www-data -a hiertags
```
activate user
```bash
    su - hiertags
```

###Set up the site

#####Create the virtual environment
```bash
    virtualenv --no-site-packages venv
```
activate it
```bash
    source venv/bin/activate
```

#####Clone the repository and install python requirements
```bash
    git clone https://github.com/balazs129/hiertags-dev.git
    pip install -r hiertags-dev/requirements.txt
```

#####Create database and static files
```bash
    python manage.py syncdb
```
```bash
    python manage.py config/hiertags-data.json
```
```bash
    python manage.py collectstatic
```

#####Configure Apache
```bash
    sudo cp config/hiertags.elte.hu /etc/apache2/sites-available/
```
Disable default site, and enable hiertags
```bash
    sudo a2dissite default
    sudo a2ensite hiertags.elte.hu
```
Enable mem-cache and restart apache
```bash
    sudo a2enmod mem-cache
    sudo service apache2 restart
```