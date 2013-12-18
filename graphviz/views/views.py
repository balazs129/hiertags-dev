#encoding: utf8
import networkx as nx
from drenderer.decorators import render_to
from django.conf import settings
from django.contrib import messages
from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from graphviz.forms import GraphUploadForm
from django.template.context import RequestContext
from django.views.decorators.csrf import csrf_exempt
from graphviz.filehandler import FileHandler, BadExtensionException
from django.utils import simplejson
from zipfile import BadZipfile
from django.contrib.flatpages.models import FlatPage

def visualize(request, template_name='graphviz/visualize.html'):
    form = GraphUploadForm(request.POST or None)
    return render_to_response(template_name,
                                {'form': form},
                                context_instance=RequestContext(request))

"""
def build_subtree(G, root, out=None, edge_count=400):
    root_children_count = len(G[root].keys())
    ### ha van elég hely, hozzáadom a gyerekeket
    if root_children_count <= edge_count:
        ### add childrens
        edge_count -= root_children_count
    ### ha a gyerekek hozzáadása után még mindig van elég hely
    if edge_count > 0:
        ### balról jobbra haladva hozzáadom a következő szintet
        for child in G[root].keys():
            out, edge_count = build_subtree(G, key, out, edge_count)



def visualize2(request, template_name='graphviz/visualize2.html'):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    nodes, edges = [], []
    if form.is_valid():
        input_file = form.cleaned_data['graph']
        try:
            fh = FileHandler(input_file=input_file)
            fh.build_graph()
            #if len(fh.graph.nodes()) > 1000 or len(fh.graph.edges()) > 1000:
            #    messages.add_message(request, messages.ERROR, "Too large graph. Maximum number of nodes / edges are 1000!")
            #else:
            nx.write_gpickle(fh.graph, "%s/%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
            fh.graph = build_subtree(fh.graph, nx.topological_sort(fh.graph)[0])
            nodes, edges = fh.get_graph_with_positions()
        except (BadZipfile, KeyError) as e: ##KeyError: there isn't nodes.txt and edges.txt in the zip file
            messages.add_message(request, messages.ERROR, str(e))
        except BadExtensionException as e:
            messages.add_message(request, messages.ERROR, e)
        #except Exception as e:
        #    messages.add_message(request, messages.ERROR, "Wrong format: Could not read the graph!")
    try:
        description = FlatPage.objects.get(url='/graphviz/').content
    except FlatPage.DoesNotExist:
        description = ''
    return render_to_response(template_name,
                                {'form': form, 'nodes': simplejson.dumps(nodes), 
                                'edges': simplejson.dumps(edges), 'description': description},
                                context_instance=RequestContext(request))
"""

@render_to(mimetype='json')
def get_specified_nodes(request, node_id, fn_name):
    G = nx.read_gpickle("%s/%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
    nodes = nx.ancestors(G, node_id)
    if fn_name == 'ancestors':
        nodes = set(G.nodes()) - nodes - set(node_id)
    return {'nodes': list(nodes)}