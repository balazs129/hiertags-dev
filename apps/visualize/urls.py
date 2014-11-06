from django.conf.urls import url, patterns

from apps.visualize import views


urlpatterns = patterns('',
                       url(r'^$', views.visualize, name='visualize'),
                       url(r'^data/$', views.visualize_data, name='visualize-data'),
                       url(r'^download/$', views.export_data, name='export-data'),
                       url(r'^download/', views.download_file, name='file-download'),
                       url(r'^graph/(\d+)', views.send_graph, name='send-graph'),
)