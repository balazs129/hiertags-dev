import re
import networkx as nx
from lxml import etree
from zipfile import ZipFile


class BadExtensionException(Exception):
    def __str__(self):
        return u"Wrong file format! Please use xgmml or zip file."


class FileHandler(object):

    def __init__(self, input_file):
        self.input_file = input_file
        self.graph = nx.DiGraph()
        self.direction = 'TB'

    def __bs_preprocess(self, html):
        """remove distracting whitespaces and newline characters"""
        pat = re.compile('(^[\s]+)|([\s]+$)', re.MULTILINE)
        html = re.sub(pat, '', html)       # remove leading and trailing whitespaces
        html = re.sub('\n', ' ', html)     # convert newlines to spaces
        html = re.sub('[\s]+<', '<', html) # remove whitespaces before opening tags
        html = re.sub('>[\s]+', '>', html) # remove whitespaces after closing tags
        return html

    def build_graph(self):
        print self.input_file.name
        if self.input_file.name.endswith('.zip'):
            with ZipFile(self.input_file) as zf:
                for line in zf.open('nodes.txt').readlines():
                    if line.startswith('#'):
                        continue
                    line = line.strip().split('\t')
                    if len(line) < 2:
                        line = line[0].split(' ')
                    if len(line) > 2:
                        line = [line[0], ' '.join(p for p in line[1:])]
                    self.graph.add_node(line[0], {'label': line[1], 'weight': 1})
                for line in zf.open('edges.txt').readlines():
                    if line.startswith('#') or not len(line.strip()):
                        continue
                    line = line.strip().split(' ')
                    self.graph.add_edge(line[0], line[1])
        elif self.input_file.name.endswith('.xgmml'):
            self.direction = 'BT'
            xgmml = self.__bs_preprocess(self.input_file.read())
            xgmml = xgmml.replace('xmlns="http://www.cs.rpi.edu/XGMML"', '') ### why?????
            root = etree.fromstring(xgmml)
            for node in root.xpath('.//node'):
                self.graph.add_node(node.attrib['id'], {'label': node.attrib['label'], 'weight': 1})
            for edge in root.xpath('.//edge'):
                self.graph.add_edge(edge.attrib['source'], edge.attrib['target'])
        elif self.input_file.name.endswith('.txt'):
            print "itt vagyok"
            for line in self.input_file.readlines():
                line = line.strip().split(' ')
                self.graph.add_edge(line[0], line[1])
        else:
            raise BadExtensionException()

    def get_graph_with_positions(self):
        nodes, edges = [], []
        positions=nx.graphviz_layout(self.graph, prog='dot', args="-Grankdir=%s" % self.direction)
        for node, pos in positions.items():
            n = {'data' : {'weight': 1, 'id': str(node), 'label': self.graph.node[node].get('label', str(node))}}
            n['position'] = {'x': pos[0], 'y': pos[1]}
            nodes.append(n)
        for from_to in self.graph.edges():
            e = {'source': from_to[0], 'target': from_to[1]}
            e = {'data': e}
            e['data']['id'] = '%s__%s' % (e['data']['source'], e['data']['target'])
            edges.append(e)
        return nodes, edges