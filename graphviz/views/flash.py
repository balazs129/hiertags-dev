import networkx as nx
from drenderer.decorators import render_to
import json
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
import graphviz.utils as utils
from django.views.decorators.csrf import csrf_exempt
import operator

# def visualize_graph(layout, graph):
#    nodes = [elem for elem in layout['nodes'] if elem['id'] in graph.nodes()]
#    edgeset = []
#    for elem in graph.edges_iter():
#        tmp = str(elem[0]) + '__' + str(elem[1])
#        edgeset.append(tmp)
#    edges = [elem for elem in layout['edges'] if elem['id'] in edgeset]
#    points = [elem for elem in layout['points'] if elem['id'] in graph.nodes()]
#    return nodes, edges, points

def visualize_graph(graph, direction):
        nodes, edges, points = [], [], []
        positions = nx.graphviz_layout(graph, prog='dot', args="-Grankdir=%s" % direction)
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

def order_nodes(nodes, layout, to_order):
    kupac = set([elem['id'] for elem in nodes])
    layout_points = [elem for elem in layout['points'] if elem['id'] in kupac]

    sorted_points = sorted(layout_points, key=operator.itemgetter('x'))
    snodes = [elem['id'] for elem in sorted_points]

    sorted_places = sorted(to_order, key=operator.itemgetter('x'))
    sorted_x = [elem['x'] for elem in sorted_places]

    # index = 0
    # for elem in sorted_points:
    #     elem['x'] = sorted_x[index]
    #     index += 1
    index = 0
    for elem in snodes:
        if sorted_places[index]['id'] != elem:
            tmp = sorted_places[index]['x']
            tindex = index + 1
            for telem in range(tindex, len(sorted_places)):
                if sorted_places[telem]['id'] == elem:
                    sorted_places[index]['x'] = sorted_places[telem]['x']
                    sorted_places[telem]['x'] = tmp
        index += 1
    # level = []
    # index = 0
    # for elem in sorted_places:
    #     if elem['y'] not in level:
    #         level.append((index, elem['y']))
    # levels = {key: value for (key, value) in level}


    return sorted_places

def levels(layout, graph):
    pass

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
        # fh.layout = fh.get_graph_with_positions()
        # posdump = "{}/pos_{}.json".format(settings.MEDIA_ROOT, request.session.session_key)
        # with open(posdump, 'w') as outfile:
        #     json.dump(fh.layout, outfile)
        root = nx.topological_sort(fh.graph)[0]
        utils.paint_nodes(fh.graph)
        if fh.graph.number_of_nodes() < 50:
            fh.vgraph = utils.build_subtree(fh.graph, root)
        else:
            fh.vgraph = utils.get_childs(fh.graph, root)
        nx.write_gpickle(fh.graph, "%s/%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
        nx.write_gpickle(fh.vgraph, "%s/v_%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
        # levels(fh.layout, fh.vgraph)
        nodes, edges, points = visualize_graph(fh.vgraph, fh.direction)
    return {'nodes': nodes, 'edges': edges, 'points': points}


@render_to(mimetype='json')
def expand_subtree(request, node_id, tree_type):
    fh = FileHandler(input_file="%s/%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key),
                     visualization="%s/v_%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key),
                     #positions="%s/pos_%s.json" % (settings.MEDIA_ROOT, request.session.session_key),
                     is_stored=True)
    if tree_type == 'tree':
        root = node_id
        fh.graph = utils.build_subtree(fh.graph, root)
    elif tree_type == 'child':
        root = node_id
        fh.vgraph = utils.add_childs(fh.graph, fh.vgraph, root)
        nx.write_gpickle(fh.vgraph, "%s/v_%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
    elif tree_type =='parent':
        root = node_id
        fh.vgraph = utils.hide_childs(fh.graph, fh.vgraph, root)
        nx.write_gpickle(fh.vgraph, "%s/v_%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
    nodes, edges, points = visualize_graph(fh.vgraph, fh.direction)
    return {'nodes': nodes, 'edges': edges, 'points': points}