import json

from django.shortcuts import render
from django.contrib.flatpages.models import FlatPage
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

from forms import GraphUploadForm, SerializedSvgForm
from utils.filehandler import FileHandler
from utils.flatten_data import gen_flat
from cairosvg import svg2pdf


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
        fh = FileHandler(input_file=input_file)
        fh.build_graph()
        for elem in fh.graphs_to_send:
            if (elem.number_of_nodes() > 1):
                data = gen_flat(elem)
                to_send.append(data)
        return_data = {'data': to_send}
    return HttpResponse(json.dumps(return_data), content_type = "application/json")

@csrf_exempt
def export_data(request):
    form = SerializedSvgForm(request.POST)
    if form.is_valid():
        tmp_svg = form.cleaned_data['data']
        output = svg2pdf(tmp_svg)
    response = HttpResponse(output, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="exported_graph.pdf"'
    return response
