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



def cytoscapeweb(request, template_name='graphviz/visualize_flash.html'):
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
            #nx.write_gpickle(fh.graph, "%s/%s.gpickle" % (settings.MEDIA_ROOT, request.session.session_key))
            #fh.graph = build_subtree(fh.graph, nx.topological_sort(fh.graph)[0])
            nodes, edges = fh.get_graph()
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