import json

from django.shortcuts import render
from django.contrib.flatpages.models import FlatPage
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

from forms import GraphUploadForm, SerializedSvgForm
from utils.filehandler import FileHandler
from utils.flatten_data import gen_flat
from utils.exportgraph import ExportGraph

#TODO: rewrite whole file
def visualize(request, template_name='visualize.html'):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    try:
        description = FlatPage.objects.get(url='/visdesc/').content
    except FlatPage.DoesNotExist:
        description = ''
    return render(request, template_name, {'form': form, 'description': description})


@csrf_exempt
def visualize_data(request):
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    to_send = []
    if form.is_valid():
        input_file = form.cleaned_data['graph']
        fh = FileHandler()
        fh.build_graph(input_file)
        for elem in fh.graphs_to_send:
            if elem.number_of_nodes() > 1:
                data = gen_flat(elem)
                to_send.append(data)
        excees_edges = fh.edges
        return_data = {'data': to_send, 'edges': excees_edges}
        return HttpResponse(json.dumps(return_data), content_type="application/json")


@csrf_exempt
def export_data(request):
    form = SerializedSvgForm(request.POST)
    if form.is_valid():
        choosen_type = form.cleaned_data['output_format']
        cleaned_data = form.cleaned_data['data'].encode('utf-8')
        layout = form.cleaned_data['layout']

        exporter = ExportGraph(choosen_type, cleaned_data, layout)

        if choosen_type == 'txt':
            ret_data = exporter.export_edgelist()
        else:
            ret_data = exporter.export_graphics()

        content = {"pdf": "application/pdf",
                   "png": "image/png",
                   "jpg": "image/jpg",
                   "svg": "image/svg",
                   "txt": "text/plain"}

        response = HttpResponse(ret_data, content_type="{}".format(content[choosen_type]))
        response['Content-Disposition'] = 'attachment; filename="exported_graph.{}"'.format(choosen_type)

        return response
