from django.shortcuts import render
from forms import GraphUploadForm
from django.contrib.flatpages.models import FlatPage
from django.views.decorators.csrf import csrf_exempt
from filehandler import FileHandler
import networkx as nx
from drenderer.decorators import render_to

def visualize(request, template_name='visualize.html'):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    try:
        description = FlatPage.objects.get(url='/visdesc/').content
    except FlatPage.DoesNotExist:
        description = ''
    return render(request, template_name, {'form': form, 'description': description})


@render_to(mimetype='json')
@csrf_exempt
def visualize_data(request):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    if form.is_valid():
        input_file = form.cleaned_data['graph']
        fh = FileHandler(input_file=input_file)
        fh.build_graph()
        data = fh.gen_flat()
        numcomp = fh.number_of_graphs
        num_nodes = fh.graph.number_of_nodes()
    return {'components': numcomp, 'data': data, 'nodes': num_nodes}
