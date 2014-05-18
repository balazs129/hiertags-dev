import json
import cStringIO

from django.shortcuts import render
from django.contrib.flatpages.models import FlatPage
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from lxml import etree
from cairosvg import svg2pdf, svg2png
from PIL import Image

from forms import GraphUploadForm, SerializedSvgForm
from utils.filehandler import FileHandler
from utils.flatten_data import gen_flat
from utils.parsesvg import parse_svg


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
        excees_edges = fh.edges
        return_data = {'data': to_send, 'edges': excees_edges}
    return HttpResponse(json.dumps(return_data), content_type="application/json")


@csrf_exempt
def export_data(request):
    form = SerializedSvgForm(request.POST)
    if form.is_valid():
        tmp_svg = form.cleaned_data['data']
        svgxml = etree.parse(cStringIO.StringIO(tmp_svg))
        tmp_svg_cleaned = parse_svg(svgxml)

        choosen_type = 'svg'

        def export_pdf(cleaned_svg):
            output = svg2pdf(cleaned_svg)
            to_response = HttpResponse(output, content_type='application/pdf')
            to_response['Content-Disposition'] = 'attachment; filename="exported_graph.pdf"'

            return to_response

        def export_png(cleaned_svg):
            tmp_png = cStringIO.StringIO(svg2png(cleaned_svg))
            png = Image.open(tmp_png)
            png.load()  # required for png.split()

            background = Image.new("RGB", png.size, (255, 255, 255))
            background.paste(png, mask=png.split()[3])  # 3 is the alpha channel

            out_png = cStringIO.StringIO()
            background.save(out_png, 'PNG')

            to_response = HttpResponse(out_png.getvalue(), content_type='image/png')
            to_response['Content-Disposition'] = 'attachment; filename="exported_graph.png"'

            return to_response

        def export_jpg(cleaned_svg):
            tmp_png = cStringIO.StringIO(svg2png(cleaned_svg))
            png = Image.open(tmp_png)
            png.load()  # required for png.split()

            background = Image.new("RGB", png.size, (255, 255, 255))
            background.paste(png, mask=png.split()[3])  # 3 is the alpha channel

            out_png = cStringIO.StringIO()
            background.save(out_png, 'JPEG', quality=80)

            to_response = HttpResponse(out_png.getvalue(), content_type='image/jpg')
            to_response['Content-Disposition'] = 'attachment; filename="exported_graph.jpg"'

            return to_response

        def export_svg(cleaned_svg):
            to_response = HttpResponse(cleaned_svg, content_type='image/svg')
            to_response['Content-Disposition'] = 'attachment; filename="exported_graph.svg"'

            return to_response

        export_file = {'svg': export_svg,
                       'png': export_png,
                       'pdf': export_pdf,
                       'jpg': export_jpg}
        response = export_file[choosen_type](tmp_svg_cleaned)

    return response
