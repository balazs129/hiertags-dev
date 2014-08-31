# -*- coding: utf-8 -*-
from zipfile import ZipFile
import itertools

import networkx as nx
from networkx.exception import NetworkXUnfeasible

from xgmmlreader import read_xgmml
from filter_DAG import parse_DAG


class FileHandler(object):
    """ Class to handle graph files."""
    def __init__(self):
        self.graphs = []
        self.edges = []
        self.graphs_to_send = []
        self.number_of_graphs = 0

    def _generate_graphs(self, graph, check=False):
        # Number of components
        self.graphs = nx.weakly_connected_component_subgraphs(graph)

        # check if current directioning is OK, else reverse directions
        for elem in self.graphs:
            try:
                root = nx.topological_sort(elem)[0]

                if check:
                    rev_graph = elem.reverse()
                    revroot = nx.topological_sort(rev_graph)[0]

                    # sum 1 to get the number of elements from a generator function
                    if sum(1 for _ in nx.bfs_edges(elem, root)) < sum(1 for _ in nx.bfs_edges(rev_graph, revroot)):
                        elem.reverse(copy=False)

                tree_graph, interlinks = parse_DAG(elem)
                self.graphs_to_send.append(tree_graph)
                self.edges.extend(interlinks)
            except NetworkXUnfeasible:
                #If the graph can't be sorted topologically, we simply skip it.
                pass

    def build_graph(self, input_file):
        def open_edgelist():
            graph = nx.DiGraph()
            with input_file as f:
                lines = itertools.ifilter(None, (line.rstrip() for line in f))
            for elem in lines:
                elem = elem.lstrip(' ')
                if elem[0] != '#':
                    tmp = elem.strip().split(' ')
                    graph.add_node(tmp[0], {'id': tmp[0], 'label': tmp[0]})
                    graph.add_node(tmp[1], {'id': tmp[1], 'label': tmp[1]})
                    graph.add_edge(tmp[0], tmp[1])

            self._generate_graphs(graph, check=True)

        def open_zipfile():
            with ZipFile(input_file) as zf:
                graph = nx.DiGraph()
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
                        graph.add_node(line[0], {'label': line[1], 'id': line[0]})
                    except IndexError:
                        pass
                for line in zf.open('edges.txt').readlines():
                    if line.startswith('#') or not len(line.strip()):
                        continue
                    line = line.strip().split(' ')
                    graph.add_edge(line[1], line[0])

            self._generate_graphs(graph, check=True)

        def open_xgmml():
            self._generate_graphs(read_xgmml(input_file))

        def open_cys():
            sessionfile = ZipFile(input_file, 'r')
            contents = sessionfile.namelist()
            networks = []
            for elem in contents:
                tmp = elem.split('/')
                if tmp[1] == 'networks':
                    networks.append(elem)
                elif tmp[1][-6:] == '.xgmml':
                    networks.append(elem)
            sessionfile.close()

            for elem in networks:
                cysfile = ZipFile(input_file, 'r')
                graphfile = cysfile.open(elem)
                graph = read_xgmml(graphfile)
                cysfile.close()

                self._generate_graphs(graph)

        fileext = {'txt': open_edgelist,
                   'zip': open_zipfile,
                   'xgmml': open_xgmml,
                   'xml': open_xgmml,
                   'cys': open_cys}

        #TODO check for valid input
        fileext[input_file.name.split('.')[-1]]()
