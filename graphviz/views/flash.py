import networkx as nx
from drenderer.decorators import render_to
from django.conf import settings
from django.shortcuts import render
from django.contrib.flatpages.models import FlatPage
from django.views.decorators.csrf import csrf_exempt

from graphviz.forms import GraphUploadForm
from graphviz.filehandler import FileHandler
import graphviz.utils as utils


def visualize_graph(graph, direction, layout=None, fname=None):
    nodes, edges, points = [], [], []
    positions = nx.graphviz_layout(graph, prog='dot', args="-Grankdir=%s" % direction)
    # updated = 0
    for node, pos in positions.items():
        points.append({'id': node, 'x': pos[0], 'y': pos[1]})
        n = {'id': str(node), 'label': graph.node[node].get('label', str(node)),
             'collapsed': graph.node[node].get('collapsed', False)}
        nodes.append(n)
    for from_to in graph.edges():
        e = {'source': from_to[0], 'target': from_to[1]}
        e['id'] = '%s__%s' % (e['source'], e['target'])
        edges.append(e)
    return nodes, edges, points


def cytoscapeweb(request, template_name='graphviz/visualize_flash.html'):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    try:
        description = FlatPage.objects.get(url='/graphviz/').content
    except FlatPage.DoesNotExist:
        description = ''
    return render(request, template_name, {'form': form, 'description': description})


@render_to(mimetype='json')
@csrf_exempt
def cytoscapeweb_data(request):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    nodes, edges = [], []
    if form.is_valid():
        input_file = form.cleaned_data['graph']
        fh = FileHandler(input_file=input_file)
        fh.build_graph()
        fh.graph = nx.weakly_connected_component_subgraphs(fh.graph)[0]
        root = nx.topological_sort(fh.graph)[0]
        utils.paint_nodes(fh.graph)
        if fh.graph.number_of_nodes() < 50:
            fh.vgraph = utils.build_subtree(fh.graph, root)
        else:
            fh.vgraph = utils.get_childs(fh.graph, root)
        nx.write_gpickle(fh.graph, "%s/%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
        nx.write_gpickle(fh.vgraph, "%s/v_%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
        nodes, edges, points = visualize_graph(fh.vgraph, fh.direction)
    return {'nodes': nodes, 'edges': edges, 'points': points}


@render_to(mimetype='json')
def expand_subtree(request, node_id, tree_type):
    fh = FileHandler(input_file="%s/%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key),
                     visualization="%s/v_%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key),
                     is_stored=True)
    if tree_type == 'tree':
        root = node_id
        fh.graph = utils.build_subtree(fh.graph, root)
    elif tree_type == 'child':
        root = node_id
        fh.vgraph = utils.add_childs(fh.graph, fh.vgraph, root)
        nx.write_gpickle(fh.vgraph, "%s/v_%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
    elif tree_type == 'parent':
        root = node_id
        fh.vgraph = utils.hide_childs(fh.graph, fh.vgraph, root)
        nx.write_gpickle(fh.vgraph, "%s/v_%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
    nodes, edges, points = visualize_graph(fh.vgraph, fh.direction)
    return {'nodes': nodes, 'edges': edges, 'points': points}