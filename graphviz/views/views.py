from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from graphviz.forms import GraphUploadForm
from django.template.context import RequestContext
from django.views.decorators.csrf import csrf_exempt


@login_required
@csrf_exempt
def visualize(request, template_name='graphviz/visualize.html'):
    if request.method == 'POST':
        print dir(request.POST)
    form = GraphUploadForm(request.POST or None)
    return render_to_response(template_name,
                              {'form': form},
                              context_instance=RequestContext(request))