from django.conf.urls import url, patterns
from . import views

urlpatterns = patterns('',
    ### Eredetileg a cytoscape.js megjelenitot hasznaltam, de az akkor meg nem volt kesz arra,
    ### hogy nagyobb halozatokat problemamentesen megjelenitsen.
    #url(r'^$', views.visualize2, name='graphviz-visualize2'),
    #url(r'^(?P<node_id>[^/]+)/(?P<fn_name>[^/]+)/$', views.get_specified_nodes, name='graphviz-get-specified-nodes'),
    #url(r'^$', views.visualize, name='graphviz-visualize'),
    #url(r'^data/cytoscapejs/$', views.graph_data_cytoscapejs, name='graphviz-data-cytoscapejs'),

    url(r'^flash/$', views.cytoscapeweb, name='graphviz-visualize-flash'),
    url(r'^flash/data/$', views.cytoscapeweb_data, name='graphviz-visualize-flash-data'),
    url(r'^flash/expand/(?P<node_id>[^/]+)/(?P<tree_type>(parent|child|tree))/$',
            views.expand_subtree, name='graphviz-expand-subtree'),
)