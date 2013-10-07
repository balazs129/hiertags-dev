#encoding: utf8
from lxml import etree
from drenderer.decorators import render_to
from zipfile import ZipFile
from graphviz.load_data import bs_preprocess

@render_to(mimetype='json')
def graph_data_cytoscapejs(request):
    nodes, edges = [], []
    with ZipFile('/tmp/guardian_dag_plots.cys') as cys:
        for f in cys.namelist():
            if f.endswith('xgmml'):
                if len(nodes) > 0:
                    continue #csak egy hálózatot töltünk be
                xgmml = bs_preprocess(cys.open(f).read())
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