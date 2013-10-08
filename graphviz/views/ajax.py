#encoding: utf8
from lxml import etree
from drenderer.decorators import render_to
from zipfile import ZipFile
from graphviz.load_data import bs_preprocess
from graphviz.forms import GraphUploadForm

@render_to(mimetype='json')
def graph_data_cytoscapejs(request):
    form = GraphUploadForm(request.POST, request.FILES or None)
    if form.is_valid():
        nodes, edges = [], []
        graph = form.cleaned_data['graph']
        if unicode(graph).endswith('.xgmml'):
            xgmml = bs_preprocess(graph.read())
            xgmml = xgmml.replace('xmlns="http://www.cs.rpi.edu/XGMML"', '') ### why?????
            root = etree.fromstring(xgmml)
            for node in root.xpath('.//node'):
                #label': node.attrib['label']
                n = {'data': {'weight': 1, 'id': node.attrib['id'], 'label': node.attrib['label']}}
                graphics = node.find('.//graphics')
                if graphics is not None:
                    n['position'] = {'x': float(graphics.attrib['x']), 'y': float(graphics.attrib['y'])}
                #n['position'] = {'x': 10, 'y': 20}
                nodes.append(n)
            for edge in root.xpath('.//edge'):
                e = {'source': edge.attrib['source'], 'target': edge.attrib['target']}
                e = {'data': e}
                e['data']['id'] = '%s_%s' % (e['data']['source'], e['data']['target'])
                edges.append(e)
        return {'nodes': nodes, 'edges': edges}