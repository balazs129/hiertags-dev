The application is consist of two parts: Django serving the web content via Apache and mod_wsgi,
and d3js is used for visualization of graph data. The database backend for django is Sqlite.

#Installation
This will describe the installation on Ubuntu/Ubuntu Server. The site is configured to work
with this steps. You can find detailed description of the config files [here](https://github.com/balazs129/hiertags-dev/wiki/Home)

###1. Install needed packages
First of all, update the repository.
```bash
    sudo apt-get update
```
Next, we install the packages needed to build other packages.
```bash
    sudo apt-get install build-essential python-dev
```
Now install apache and other needed software. We need the worker version from apache([reason](http://blog.dscpl.com.au/2012/10/why-are-you-using-embedded-mode-of.html)).
```bash
    sudo apt-get install git sqlite3 apache2-mpm-worker libapache2-mod-wsgi
    sudo apt-get install python-virtualenv libffi-dev python-cairo
```
And last, install the packages needed to build lxml.
```bash
    sudo apt-get install libxml2 libxml2-dev libxslt1.1 libxslt1-dev
```

###2. Create the environment
Because of security reasons we will run the site from a dedicated user home directory.
Create the user, and set password for the account. The name of the user have to be 'hiertags' to
the site function properly, however you can change to anything if you change the corresponding config
files too.
```bash
    sudo useradd -s /bin/bash -m hiertags
    sudo passwd hiertags
```
We need to add this user to the sudoers.
```bash
    sudo visudo
```
search the line '# User privilege specification', and add another line to look like this:
```bash
    # User privilege specification
    root    ALL=(ALL:ALL) ALL
    hiertags    ALL=(ALL:ALL) ALL
```
add the user to the www-group, so apache can serve from the user home directory.
```bash
    sudo usermod -G www-data -a hiertags
```
Finally login to the newly created user account.
```bash
    su - hiertags
```

###3. Set up the site
Virtualenv allow us to separate python applications. Django will use its own environment.
#####Create the virtual environment
```bash
    virtualenv --no-site-packages venv
```
Activate it.
```bash
    source venv/bin/activate
```

#####Clone the repository and install python requirements
Next, we clone the repository to our working machine, and install the required python packages
in the virtual environment. Pip can automatically install packages using the 'requirements.txt'
file in the project directory.
```bash
    git clone https://github.com/balazs129/hiertags-dev.git
    pip install -r hiertags-dev/requirements.txt
```

#####Create database and static files
We have to create now the database for the django app.
```bash
    python hiertags-dev/manage.py syncdb
```
Next, we load the saved data to the newly created database to have the pages.
```bash
   python hiertags-dev/manage.py loaddata hiertags-dev/config/hiertags_data.json
```
And finally, we copy the static files to the /static dir for Apache to serve.
```bash
    python hiertags-dev/manage.py collectstatic
```

#####Configure Apache
The final task is to configure Apache properly. First, we copy the included virtual host file
to the appropriate directory.
```bash
    sudo cp hiertags-dev/config/hiertags.elte.hu /etc/apache2/sites-available/
```
Next, we disable the default site, and enable hiertags.
```bash
    sudo a2dissite default
    sudo a2ensite hiertags.elte.hu
```
Enable mem-cache and headers mod, restart apache. We need mod-headers to force the example files
to download instead of open in browser and mod_cache for cacheing.
```bash
    sudo a2enmod headers
    sudo a2enmod mem_cache
    sudo service apache2 restart
```
The site now must be functional.