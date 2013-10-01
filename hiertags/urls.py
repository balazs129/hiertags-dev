from django.conf import settings
from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib.auth import views as auth_views
from .forms import CustomAuthenticationForm
from django.contrib import admin
admin.autodiscover()


urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^accounts/login/$', auth_views.login, {'authentication_form': CustomAuthenticationForm}, name='login'),
    url(r'^accounts/logout/$', auth_views.logout_then_login, name='logout'),
    url(r'^accounts/change_password/$', auth_views.password_change, {'post_change_redirect' : '/accounts/change_password/done/'}, name='change-password'),
    url(r'^accounts/change_password/done/$', auth_views.password_change_done),
    url(r'^accounts/reset_password/$', auth_views.password_reset, name='password-reset'),
    url(r'^accounts/reset_password/done/$', auth_views.password_reset_done),
    url(r'^accounts/reset_password/(?P<uidb36>[0-9A-Za-z]+)-(?P<token>.+)/$', auth_views.password_reset_confirm), 
    url(r'^accounts/reset_password/complete/$', auth_views.password_reset_complete),
)

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
