# -*- coding: utf-8 -*-
import re
import networkx as nx
from lxml import etree
from zipfile import ZipFile
import HTMLParser

class BadExtensionException(Exception):
    def __str__(self):
        return u"Wrong file format! Please use xgmml or zip file."

class FileHandler(object):

    def __init__(self, input_file, is_stored=False):
        if is_stored:
            self.graph = nx.read_gpickle(input_file)
            self.direction = 'BT'
        else:
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
        htmlpar = HTMLParser.HTMLParser()
        if self.input_file.name.endswith('.zip'):
            self.direction = 'BT'
            with ZipFile(self.input_file) as zf:
                for line in zf.open('nodes.txt').readlines():
                    line = line.decode('utf8')
                    line = line.strip()
                    if line.startswith('#') or not len(line):
                        continue
                    line = line.split('\t')
                    if len(line) < 2:
                        line = line[0].split(' ')
                    if len(line) > 2:
                        line = [line[0], ' '.join(p for p in line[1:])]
                    try:
                        self.graph.add_node(line[0], {'label': line[1], 'weight': 1})
                    except IndexError:
                        pass
                for line in zf.open('edges.txt').readlines():
                    if line.startswith('#') or not len(line.strip()):
                        continue
                    line = line.strip().split(' ')
                    self.graph.add_edge(line[1], line[0])
        elif self.input_file.name.endswith('.xgmml'):
            self.direction = 'BT'
            xgmml = self.__bs_preprocess(self.input_file.read())
            xgmml = xgmml.replace('xmlns="http://www.cs.rpi.edu/XGMML"', '') ### why?????
            root = etree.fromstring(xgmml)
            for node in root.xpath('.//node'):
                self.graph.add_node(node.attrib['id'], {'label': htmlpar.unescape(node.attrib['label']), 'weight': 1})
            for edge in root.xpath('.//edge'):
                self.graph.add_edge(edge.attrib['source'], edge.attrib['target'])
        elif self.input_file.name.endswith('.txt'):
            for line in self.input_file.readlines():
                line = line.strip().split(' ')
                self.graph.add_edge(line[0], line[1])
        elif self.input_file.name.endswith('.cys'):
            sessionfile = ZipFile(self.input_file, 'r')
            contents = sessionfile.namelist()
            networks = []
            for elem in contents:
                if elem.split('/')[1] == 'networks':
                    networks.append((elem.split('/')[2], elem))
            self.direction = 'BT'
            xgmml = self.__bs_preprocess(sessionfile.read(networks[0][1]))
            xgmml = xgmml.replace('xmlns="http://www.cs.rpi.edu/XGMML"', '') ### why?????
            root = etree.fromstring(xgmml)
            for node in root.xpath('.//node'):
                self.graph.add_node(node.attrib['id'], {'label': htmlpar.unescape(node.attrib['label']), 'weight': 1})
            for edge in root.xpath('.//edge'):
                self.graph.add_edge(edge.attrib['source'], edge.attrib['target'])
        else:
            raise BadExtensionException()

    def get_graph(self):
        nodes, edges = [], []
        for node in self.graph.nodes():
            n = {'id': str(node), 'label': str(node), #self.graph.node[node].get('label',
                 'collapsed': self.graph.node[node].get('collapsed', True)}
            nodes.append(n)
        for from_to in self.graph.edges():
            e = {'source': from_to[0], 'target': from_to[1]}
            e['id'] = '%s__%s' % (e['source'], e['target'])
            edges.append(e)
        return nodes, edges

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

    def get_graph_with_positions_flash(self):
        nodes, edges, points = [], [], []
        positions=nx.graphviz_layout(self.graph, prog='dot', args="-Grankdir=%s" % self.direction)
        for node, pos in positions.items():
            points.append({'id': node, 'x': pos[0], 'y': pos[1]})
            n = {'id': str(node), 'label':  self.graph.node[node].get('label', str(node)),
                 'collapsed': self.graph.node[node].get('collapsed', True)}
            nodes.append(n)
        for from_to in self.graph.edges():
            e = {'source': from_to[0], 'target': from_to[1]}
            e['id'] = '%s__%s' % (e['source'], e['target'])
            edges.append(e)
        return nodes, edges, points