from lxml import etree
from zipfile import ZipFile


import re
def bs_preprocess(html):
    """remove distracting whitespaces and newline characters"""
    pat = re.compile('(^[\s]+)|([\s]+$)', re.MULTILINE)
    html = re.sub(pat, '', html)       # remove leading and trailing whitespaces
    html = re.sub('\n', ' ', html)     # convert newlines to spaces
    html = re.sub('[\s]+<', '<', html) # remove whitespaces before opening tags
    html = re.sub('>[\s]+', '>', html) # remove whitespaces after closing tags
    return html

"""
nodes, edges = [], []
with ZipFile('/home/lovasb/WORK/ELTE/hiertags/guardian_dag_plots.cys') as cys:
    for f in cys.namelist():
        if f.endswith('xgmml'):
            xgmml = bs_preprocess(cys.open(f).read())
            xgmml = xgmml.replace('xmlns="http://www.cs.rpi.edu/XGMML"', '') ### why?????
            root = etree.fromstring(xgmml)
            for node in root.xpath('.//node'):
                n = {'data': {'label': node.attrib['label'], 'id': abs(int(node.attrib['id']))}}
                graphics = node.find('.//graphics')
                if graphics is not None:
                    n['position'] = {'x': float(graphics.attrib['x']), 'y': float(graphics.attrib['y'])}
                nodes.append(n)
            for edge in root(xpath('.//edge')):
                e = {'source': abs(int(edge.attrib['source'])), 'target': abs(int(edge.attrib['target']))}
                e['id'] = '%d_%d' % (e['source'], e['target'])
                edges.append(e)


#print nodes"""