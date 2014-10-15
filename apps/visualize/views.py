import json

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

        ret_val = {'numGraph': len(fh.graphs), 'graph': fh.graphs[0]}
        return HttpResponse(json.dumps(ret_val), content_type="application/json")


@csrf_exempt
def export_data(request):
    """
    This view process the graph export request.
    :param request: request object
    :return: the appropriate file, forced to download.
    """
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
