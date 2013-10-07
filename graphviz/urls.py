from django.conf.urls import url, patterns
from . import views

urlpatterns = patterns('',
    url(r'^$', views.visualize, name='graphviz-visualize'),
    url(r'^data/cytoscapejs/$', views.graph_data_cytoscapejs, name='graphviz-data-cytoscapejs'),
)