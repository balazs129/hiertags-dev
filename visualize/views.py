import json

from django.shortcuts import render
from django.contrib.flatpages.models import FlatPage
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

from forms import GraphUploadForm
from utils.filehandler import FileHandler


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
    if form.is_valid():
        input_file = form.cleaned_data['graph']
        fh = FileHandler(input_file=input_file)
        fh.build_graph()
        data = fh.gen_flat()
        numcomp = fh.number_of_graphs
        num_nodes = fh.graph.number_of_nodes()
        return_data = {'components': numcomp, 'data': data, 'nodes': num_nodes}
    return HttpResponse(json.dumps(return_data), mimetype = "application/json")