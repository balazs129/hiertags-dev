import json
import os

from django.shortcuts import render
from django.contrib.flatpages.models import FlatPage
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

from forms import GraphUploadForm, SerializedSvgForm
from apps.visualize.util.filehandler import FileHandler
from apps.visualize.util.exportgraph import ExportGraph


def visualize(request, template_name='visualize/visualize.html'):
    """
    Basic view for the 'visualize' menu item.

    :param request: the request object
    :param template_name: template to use
    :return: response
    """
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    try:
        description = FlatPage.objects.get(url='/visdesc/').content
    except FlatPage.DoesNotExist:
        description = ''
    return render(request, template_name, {'form': form, 'description': description})


@csrf_exempt
def visualize_data(request):
    """
    This view process the uploaded data and sends back the appropriate data for the JS.

    :param request: request object(with uploaded file)
    :return: json object in response to the js script
    """
    form = GraphUploadForm(request.POST or None, request.FILES or None)
    if form.is_valid():
        input_file = form.cleaned_data['graph']
        fh = FileHandler()
        fh.build_graph(input_file)

        valid_graphs = [graph for graph in fh.graphs if graph['nodes'] > 1]

        request.session.set_expiry(0)
        request.session.modified = True
        request.session['graphs'] = valid_graphs

        # Only return valid graphs
        ret_val = {'numGraph': len(valid_graphs), 'graph': valid_graphs[0]}
        response = HttpResponse(json.dumps(ret_val), content_type="application/json")

        return response


@csrf_exempt
def export_data(request):
    """
    This view process the graph export request.
    :param request: request object
    :return: the appropriate file, forced to download.
    """
    choosen_type = request.POST['output_format']
    svg_data = request.POST['svg'].encode('utf-8')
    layout = request.POST['layout']

    exporter = ExportGraph(choosen_type, svg_data, layout)

    if choosen_type == 'Edgelist':
        ret_data = exporter.export_edgelist()
    else:
        ret_data = exporter.export_graphics()

    response = HttpResponse(ret_data)
    return response

def download_file(request):
    file_name = request.get_full_path().split('/')[-1]
    file_type = file_name.split('.')[-1]

    content = {"pdf": "application/pdf",
               "png": "image/png",
               "jpg": "image/jpg",
               "svg": "image/svg",
               "txt": "text/plain"}

    tmp_file = '/tmp/' + file_name
    ret_file = open(tmp_file, 'rb')
    ret_file.seek(0)
    os.remove(tmp_file)

    response = HttpResponse(ret_file, content_type="{}".format(content[file_type]))
    response['Content-Disposition'] = 'attachment; filename="exported_graph.{}"'.format(file_type)

    return response

def send_graph(request, graph_num):
    graphs = request.session['graphs']
    index = int(graph_num) - 1

    try:
        ret_val = {'graph': graphs[index]}
    except IndexError:
        ret_val = None

    return HttpResponse(json.dumps(ret_val), content_type="application/json")
