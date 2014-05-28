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
Now install Apache and other packages. We need the worker version from Apache([reason]
(http://blog.dscpl.com.au/2012/10/why-are-you-using-embedded-mode-of.html)).
```bash
    sudo apt-get install git sqlite3 apache2-mpm-worker libapache2-mod-wsgi
```
Next, we need some packages to the image processing. We will use [Inkscape](http://www.inkscape.org/en/)
to convert the generated SVG to other formats.
```bash
    sudo apt-get install python-virtualenv libjpeg-dev git inkscape
```
And last, install the packages needed to build lxml.
```bash
    sudo apt-get install libxml2 libxml2-dev libxslt1-dev
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
`CTRL+o` to write out the changes and finally `CTRL+x` to exit.
Finally login to the newly created user account.
```bash
    su - hiertags
```

###3. Set up the site
Virtualenv allows us to separate python applications. This site will use its own environment.

#####Clone the repository and install the virtual environment
Firts, we clone the repository to our working machine.
```bash
    git clone https://github.com/balazs129/hiertags-dev.git
```
Now, we install the virtualenv in the project dir.
```bash
    cd hiertags-dev
    virtualenv .
```
Then, we activate the virtual environment and install the required python packages
in it. Pip can automatically install packages using the 'requirements.txt'
file in the project directory.
```bash
    source bin/activate
    pip install -r requirements.txt
```

#####Create database and static files
We have to create now the database for the django app. There will be some questions regarding
the superuser, just fill in the appropriate information.
```bash
    python manage.py syncdb
```
With the provided information you can log in to the app admin interface once the site is running by
writing 'admin' after the domain name(for example: `http://hiertags-dev.elte.hu/admin`). There you can
set user privileges and can edit or add/remove flatpages of the site(flatpages storing the html content
of static pages). With the database creation the shipped data(conf/initial_data.json) is automatically
added to the database(these are the flatpage contents).
Next, copy the static files(css, js) to the /static dir for Apache to serve.
```bash
    python manage.py collectstatic
```
Type 'yes' to copy the files.
Now, we need to set the whole project dir owner to Apache or we can not use the admin site(apache will not
be able to read/write the database):
```bash
    cd ..
    sudo chown -R www-data:www-data hiertags-dev/
```
And finally, change back to the project dir.
```
    cd hiertags-dev
```

#####Configure Apache
The final task is to configure Apache properly. First, we copy the included virtual host file
to the appropriate directory.
```bash
    sudo cp conf/hiertags.elte.hu /etc/apache2/sites-available/
```
You should check now the file content(see [Configuration Files](https://github.com/balazs129/hiertags-dev/wiki/Config))
and edit the paths if you are not following the default installation.
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
The site has to be functional now. If you have problems logging in to the admin site it usually means Apache
can not read/write the database file which means permission problems are present.