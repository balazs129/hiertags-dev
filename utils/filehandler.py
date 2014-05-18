# -*- coding: utf-8 -*-
from zipfile import ZipFile
import HTMLParser
import itertools

import networkx as nx
from networkx.exception import NetworkXUnfeasible

from xgmmlreader import read_xgmml
from filter_DAG import parse_DAG

class BadExtensionException(Exception):
    def __str__(self):
        return u"Wrong file format! Please use xgmml or zip file."


class FileHandler(object):
    def __init__(self, input_file):
        self.input_file = input_file
        self.graph = nx.DiGraph()
        self.graphs = []
        self.edges = []
        self.graphs_to_send = []
        self.number_of_graphs = 0

    def build_graph(self):
        htmlpar = HTMLParser.HTMLParser()

        def open_edgelist():
            with self.input_file as f:
                lines = itertools.ifilter(None, (line.rstrip() for line in f))
                for elem in lines:
                    elem = elem.lstrip(' ')
                    if elem[0] != '#':
                        tmp = elem.strip().split(' ')
                        self.graph.add_node(tmp[0], {'id': tmp[0], 'label': tmp[0]})
                        self.graph.add_node(tmp[1], {'id': tmp[1], 'label': tmp[1]})
                        self.graph.add_edge(tmp[0], tmp[1])

            #Number of components
            self.graphs = nx.weakly_connected_component_subgraphs(self.graph)

            #check if current directioning OK
            for elem in self.graphs:
                try:
                    root = nx.topological_sort(elem)[0]
                    rev_graph = elem.reverse()
                    revroot = nx.topological_sort(rev_graph)[0]
                    #sum 1 to get the number of elements from a generator function
                    if sum(1 for _ in nx.bfs_edges(elem, root)) < sum(1 for _ in nx.bfs_edges(rev_graph, revroot)):
                        elem.reverse(copy=False)

                    tree_graph, interlinks = parse_DAG(elem)
                    self.graphs_to_send.append(tree_graph)
                    self.edges.extend(interlinks)
                except NetworkXUnfeasible:
                    pass


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
                        self.graph.add_node(line[0], {'label': line[1], 'id': line[0]})
                    except IndexError:
                        pass
                for line in zf.open('edges.txt').readlines():
                    if line.startswith('#') or not len(line.strip()):
                        continue
                    line = line.strip().split(' ')
                    self.graph.add_edge(line[1], line[0])

            self.graphs = nx.weakly_connected_component_subgraphs(self.graph)

            for elem in self.graphs:
                try:
                    root = nx.topological_sort(elem)[0]
                    rev_graph = elem.reverse()
                    revroot = nx.topological_sort(rev_graph)[0]
                    #sum 1 to get the number of elements from a generator function
                    if sum(1 for _ in nx.bfs_edges(elem, root)) < sum(1 for _ in nx.bfs_edges(rev_graph, revroot)):
                        elem.reverse(copy=False)

                    tree_graph, interlinks = parse_DAG(elem)
                    self.graphs_to_send.append(tree_graph)
                    self.edges.extend(interlinks)
                except NetworkXUnfeasible:
                    pass

        def open_xgmml():
            self.graph = read_xgmml(self.input_file)

            self.graphs = nx.weakly_connected_component_subgraphs(self.graph)

            for elem in self.graphs:
                try:
                    root = nx.topological_sort(elem)[0]
                    tree_graph, interlinks = parse_DAG(elem)
                    self.graphs_to_send.append(tree_graph)
                    self.edges.extend(interlinks)
                except NetworkXUnfeasible:
                    pass

        def open_cys():
            sessionfile = ZipFile(self.input_file, 'r')
            contents = sessionfile.namelist()
            networks = []
            for elem in contents:
                tmp = elem.split('/')
                if tmp[1] == 'networks':
                    # networks.append((tmp[2], elem))
                    networks.append(elem)
                elif tmp[1][-6:] == '.xgmml':
                    # networks.append((tmp[1], elem))
                    networks.append(elem)
            sessionfile.close()

            for elem in networks:
                cysfile = ZipFile(self.input_file, 'r')
                graphfile = cysfile.open(elem)
                self.graph = read_xgmml(graphfile)
                cysfile.close()

                self.graphs = nx.weakly_connected_component_subgraphs(self.graph)

                for g_elem in self.graphs:
                    try:
                        root = nx.topological_sort(g_elem)[0]
                        tree_graph, interlinks = parse_DAG(g_elem)
                        self.graphs_to_send.append(tree_graph)
                        self.edges.extend(interlinks)
                    except NetworkXUnfeasible:
                        pass

        fileext = {'txt': open_edgelist,
                   'zip': open_zipfile,
                   'xgmml': open_xgmml,
                   'xml': open_xgmml,
                   'cys': open_cys}
        # try:
        fileext[self.input_file.name.split('.')[-1]]()
        # except KeyError:
        #     raise BadExtensionException
