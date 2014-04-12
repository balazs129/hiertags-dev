# -*- coding: utf-8 -*-
from zipfile import ZipFile
import HTMLParser

import networkx as nx

import utils


class BadExtensionException(Exception):
    def __str__(self):
        return u"Wrong file format! Please use xgmml or zip file."


class FileHandler(object):
    def __init__(self, input_file):
        self.input_file = input_file
        self.graph = nx.DiGraph()

    def build_graph(self):
        htmlpar = HTMLParser.HTMLParser()

        def open_edgelist():
            for line in self.input_file.readlines():
                line = line.strip().split(' ')
                self.graph.add_edge(line[0], line[1])

            #check if current directioning OK
            root = nx.topological_sort(self.graph)[0]
            rev_graph = self.graph.reverse()
            revroot = nx.topological_sort(rev_graph)[0]
            #sum 1 to get the number of elements from a generator function
            if sum(1 for _ in nx.bfs_edges(self.graph, root)) < sum(1 for _ in nx.bfs_edges(rev_graph, revroot)):
                self.graph.reverse(copy=False)

        def open_zipfile():
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

        def open_xgmml():
            self.direction = 'BT'
            nodes, edges = utils.read_xgmml(self.input_file)
            for node in nodes:
                self.graph.add_node(node.attrib['id'],
                                    {'id': node.attrib['id'], 'label': htmlpar.unescape(node.attrib['label'])})
            for edge in edges:
                self.graph.add_edge(edge.attrib['source'], edge.attrib['target'])

        def open_cys():
            self.direction = 'BT'
            nodes, edges = utils.read_xgmml(utils.select_cysnetwork(self.input_file))
            for node in nodes:
                self.graph.add_node(node.attrib['id'],
                                    {'id': node.attrib['id'], 'label': htmlpar.unescape(node.attrib['label'])})
            for edge in edges:
                self.graph.add_edge(edge.attrib['source'], edge.attrib['target'])

        fileext = {'txt': open_edgelist,
                   'zip': open_zipfile,
                   'xgmml': open_xgmml,
                   'cys': open_cys}
        try:
            fileext[self.input_file.name.split('.')[-1]]()
        except KeyError:
            raise BadExtensionException

    def gen_flat(self):
        data = []
        idmap = {}
        # data = graph.nodes(data=True)
        # If data dict empty label=id
        for elem in self.graph.nodes_iter(data=True):
            if len(elem[1]) == 0:
                elem[1]['id'] = elem[0]
                elem[1]['label'] = elem[0]
                idmap[elem[1]['id']] = elem[1]['label']
            else:
                idmap[elem[1]['id']] = elem[1]['label']
        for elem in self.graph.nodes():
            tmp = {'name': idmap[elem]}
            if len(self.graph.pred[elem].keys()) == 0:
                parent = "null"
            else:
                t_parent = self.graph.pred[elem].keys()[0]
                parent = idmap[t_parent]
            tmp['parent'] = parent
            data.append(tmp)
        return data