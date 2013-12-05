from django.conf.urls import url, patterns
from . import views

urlpatterns = patterns('',
    url(r'^$', views.visualize2, name='graphviz-visualize2'),
    url(r'^(?P<node_id>[^/]+)/(?P<fn_name>[^/]+)/$', views.get_specified_nodes, name='graphviz-get-specified-nodes'),
    #url(r'^$', views.visualize, name='graphviz-visualize'),
    url(r'^data/cytoscapejs/$', views.graph_data_cytoscapejs, name='graphviz-data-cytoscapejs'),

    url(r'^flash/$', views.cytoscapeweb, name='graphviz-visualize-flash'),
)