#encoding: utf8
from drenderer.decorators import render_to
from graphviz.forms import GraphUploadForm
from graphviz.filehandler import FileHandler


@render_to(mimetype='json')
def graph_data_cytoscapejs(request):
    form = GraphUploadForm(request.POST, request.FILES or None)
    nodes, edges = [], []
    if form.is_valid():
        input_file = form.cleaned_data['graph']
        fh = FileHandler(input_file=input_file)
        fh.build_graph()
        nodes, edges = fh.get_graph_with_positions()
    return {'nodes': nodes, 'edges': edges}