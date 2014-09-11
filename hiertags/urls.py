from django.conf import settings
from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin

from django.views.generic import RedirectView


urlpatterns = patterns('',
                       url(r'^$', RedirectView.as_view(url='/home/'), name='root'),
                       url(r'^visualize/', include('visualize.urls')),
                       url(r'^$', include('django.contrib.flatpages.urls')),
)

if settings.ADMIN_ENABLED:
    admin.autodiscover()
    urlpatterns += patterns('',
                          url(r'^admin/', include(admin.site.urls))
    )

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
