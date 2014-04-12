from django.conf.urls import url, patterns
import views

urlpatterns = patterns('',
    url(r'^$', views.visualize, name='visualize'),
    url(r'^data/$', views.visualize_data, name='visualize-data'),
)