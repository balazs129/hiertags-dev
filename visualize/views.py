import json
import cStringIO
import subprocess
import tempfile
import uuid
import os

from django.shortcuts import render
from django.contrib.flatpages.models import FlatPage
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from lxml import etree
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

        if choosen_type == 'txt':
            tmp_svg_cleaned = form.cleaned_data['data'].encode('utf-8')
        else:
            tmp_svg = form.cleaned_data['data'].encode('utf-8')
            uniparser = etree.XMLParser(encoding='UTF-8')
            svgxml = etree.parse(cStringIO.StringIO(tmp_svg), parser=uniparser)
            tmp_svg_cleaned = parse_svg(svgxml, form.cleaned_data['layout'])


        def export_pdf(cleaned_svg):
            tmp_infile = tempfile.NamedTemporaryFile()
            tmp_infile.write(cleaned_svg)
            tmp_infile.seek(0)

            tmp_outfile = '/tmp/' + str(uuid.uuid4())

            _ = subprocess.Popen(['inkscape', "-f", tmp_infile.name, "-A", tmp_outfile], shell=False,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()[0]

            ret_file = open(tmp_outfile, 'rb')
            output = ret_file.read()
            tmp_infile.close()
            os.remove(tmp_outfile)

            to_response = HttpResponse(output, content_type='application/pdf')
            to_response['Content-Disposition'] = 'attachment; filename="exported_graph.pdf"'

            return to_response

        def export_png(cleaned_svg):
            tmp_infile = tempfile.NamedTemporaryFile()
            tmp_infile.write(cleaned_svg)
            tmp_infile.seek(0)

            tmp_outfile = '/tmp/' + str(uuid.uuid4())

            _ = subprocess.Popen(['inkscape', "-b white", "-f", tmp_infile.name, "-e", tmp_outfile], shell=False,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()[0]

            ret_file = open(tmp_outfile, 'rb')
            output = ret_file.read()
            tmp_infile.close()
            os.remove(tmp_outfile)

            to_response = HttpResponse(output, content_type='image/png')
            to_response['Content-Disposition'] = 'attachment; filename="exported_graph.png"'

            return to_response

        def export_jpg(cleaned_svg):
            tmp_infile = tempfile.NamedTemporaryFile()
            tmp_infile.write(cleaned_svg)
            tmp_infile.seek(0)

            tmp_outfile = '/tmp/' + str(uuid.uuid4())

            _ = subprocess.Popen(['inkscape', "-b white", "-f", tmp_infile.name, "-e", tmp_outfile], shell=False,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()[0]

            png = Image.open(tmp_outfile)
            tmp_jpeg = tempfile.NamedTemporaryFile()
            png.save(tmp_jpeg, 'JPEG', quality=90)
            tmp_jpeg.seek(0)
            output = tmp_jpeg.read()

            tmp_infile.close()
            tmp_jpeg.close()
            os.remove(tmp_outfile)

            to_response = HttpResponse(output, content_type='image/jpg')
            to_response['Content-Disposition'] = 'attachment; filename="exported_graph.jpg"'

            return to_response

        def export_svg(cleaned_svg):
            tmp_infile = tempfile.NamedTemporaryFile()
            tmp_infile.write(cleaned_svg)
            tmp_infile.seek(0)

            tmp_outfile = '/tmp/' + str(uuid.uuid4())

            _ = subprocess.Popen(['inkscape', "-f", tmp_infile.name, "-l", tmp_outfile], shell=False,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()[0]

            ret_file = open(tmp_outfile, 'rb')
            output = ret_file.read()
            tmp_infile.close()
            os.remove(tmp_outfile)

            to_response = HttpResponse(output, content_type='image/svg')
            to_response['Content-Disposition'] = 'attachment; filename="exported_graph.svg"'

            return to_response

        def export_edgelist(data):
            out_file = cStringIO.StringIO()
            for elem in data.replace("\\", "")[2:-2].split("],[")[1:-1]:
                tmp_str = elem.split(",")
                to_write = tmp_str[0][1:-1] + ' ' + tmp_str[1][1:-1] + '\n'
                out_file.write(to_write)
            out_file.seek(0)
            output = out_file.read()
            to_response = HttpResponse(output, content_type='text/plain')
            to_response['Content-Disposition'] = 'attachment; filename="exported_graph.txt"'

            return to_response


        export_file = {'svg': export_svg,
                       'png': export_png,
                       'pdf': export_pdf,
                       'jpg': export_jpg,
                       'txt': export_edgelist}
        response = export_file[choosen_type](tmp_svg_cleaned)

    return response
