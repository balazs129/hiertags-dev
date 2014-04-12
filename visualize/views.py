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
        description = FlatPage.objects.get(url='/graphviz/').content
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
        fh.graph = nx.weakly_connected_component_subgraphs(fh.graph)[0]
        data = fh.gen_flat()
    return data
