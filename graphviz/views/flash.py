import networkx as nx
from drenderer.decorators import render_to
from django.http import Http404
from django.conf import settings
from django.contrib import messages
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from graphviz.forms import GraphUploadForm
from django.template.context import RequestContext
from django.views.decorators.csrf import csrf_exempt
from graphviz.filehandler import FileHandler, BadExtensionException
from django.utils import simplejson
from zipfile import BadZipfile
from django.contrib.flatpages.models import FlatPage
from graphviz.utils import build_subtree


def cytoscapeweb(request, template_name='graphviz/visualize_flash.html'):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    try:
        description = FlatPage.objects.get(url='/graphviz/').content
    except FlatPage.DoesNotExist:
        description = ''
    return render(request, template_name, {'form': form, 'description': description})


@render_to(mimetype='json')
def cytoscapeweb_data(request):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    nodes, edges = [], []
    if form.is_valid():
        input_file = form.cleaned_data['graph']
        fh = FileHandler(input_file=input_file)
        fh.build_graph()
        #print nx.topological_sort(fh.graph)
        fh.graph = nx.weakly_connected_component_subgraphs(fh.graph)[0]
        nx.write_gpickle(fh.graph, "%s/%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
        fh.graph, _ = build_subtree(G=fh.graph, root=nx.topological_sort(fh.graph)[0])
        #nodes, edges = fh.get_graph()
        nodes, edges, points = fh.get_graph_with_positions_flash()
    return {'nodes': nodes, 'edges': edges, 'points': points}


@render_to(mimetype='json')
def expand_subtree(request, node_id, tree_type):
    fh = FileHandler(input_file="%s/%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key), is_stored=True)
    try:
        root = node_id if tree_type == 'child' else fh.graph.reverse().edges(node_id)[0][1]
    except IndexError: ## no parent node to selected
        raise Http404()
    fh.graph, _ = build_subtree(G=fh.graph, root=root)
    nodes, edges, points = fh.get_graph_with_positions_flash()
    return {'nodes': nodes, 'edges': edges, 'points': points}