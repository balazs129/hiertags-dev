from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from graphviz.forms import GraphUploadForm
from django.template.context import RequestContext
from django.views.decorators.csrf import csrf_exempt
from graphviz.filehandler import FileHandler
from django.utils import simplejson


def visualize(request, template_name='graphviz/visualize.html'):
    form = GraphUploadForm(request.POST or None)
    return render_to_response(template_name,
                              {'form': form},
                              context_instance=RequestContext(request))


def visualize2(request, template_name='graphviz/visualize2.html'):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    nodes, edges = [], []
    if form.is_valid():
        input_file = form.cleaned_data['graph']
        fh = FileHandler(input_file=input_file)
        fh.build_graph()
        nodes, edges = fh.get_graph_with_positions()
    return render_to_response(template_name,
                              {'form': form, 'nodes': simplejson.dumps(nodes), 'edges': simplejson.dumps(edges)},
                              context_instance=RequestContext(request))