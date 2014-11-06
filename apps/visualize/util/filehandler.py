# -*- coding: utf-8 -*-
from zipfile import ZipFile
import itertools

import networkx as nx
from networkx.exception import NetworkXUnfeasible

from apps.visualize.util.xgmmlreader import read_xgmml
from apps.visualize.util.parsedag import parse_DAG
from apps.visualize.util.genflat import gen_flat


class FileHandler(object):
    """
    This Class handless the uploaded files
    """

    def __init__(self):
        self.components = []
        self.graphs = []
        self.number_of_graphs = 0

    def _generate_graphs(self, graph, name, check=False):
        """
        Helper function for the edgelist cases.

        :param graph: networkX graph
        :param check: boolean, set True for check in graph directioning
        :return: None, sets the Class attributes
        """
        # Number of components
        self.components = nx.weakly_connected_component_subgraphs(graph)

        # Sort nodes topologically and check if current directioning is OK, else reverse directions
        for elem in self.components:
            try:
                root = nx.topological_sort(elem)[0]

                if check:
                    rev_graph = elem.reverse()
                    revroot = nx.topological_sort(rev_graph)[0]

                    # sum 1 to get the number of elements from a generator function
                    if sum(1 for _ in nx.bfs_edges(elem, root)) < sum(1 for _ in nx.bfs_edges(rev_graph, revroot)):
                        elem.reverse(copy=False)

                dag_graph, interlinks = parse_DAG(elem)
                num_nodes = dag_graph.number_of_nodes()
                num_edges = dag_graph.number_of_edges() + len(interlinks)
                self.graphs.append({'dag': gen_flat(dag_graph), 'interlinks': interlinks, 'name': name,
                                    'nodes': num_nodes, 'edges': num_edges})
            except NetworkXUnfeasible:
                # If the graph can't be sorted topologically(not a DAG)
                self.graphs.append({'dag': None, 'nodes': 0})


    def build_graph(self, input_file):
        """
        This method builds the NetworkX graph from the uploaded data.
        :param input_file: The uploaded file
        :return: None, sets the Class attributes
        """

        def open_edgelist():
            graph = nx.DiGraph()
            with input_file as f:
                lines = itertools.ifilter(None, (line.rstrip() for line in f))

                for elem in lines:
                    elem = elem.lstrip(' ')
                    if elem[0] != '#':
                        tmp = elem.strip().split(' ')
                        if len(tmp) == 2:
                            graph.add_node(tmp[0], {'id': tmp[0], 'label': tmp[0]})
                            graph.add_node(tmp[1], {'id': tmp[1], 'label': tmp[1]})
                            graph.add_edge(tmp[0], tmp[1])

            self._generate_graphs(graph, input_file.name, check=True)

        def open_zipfile():
            # TODO: Rewrite
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

            self._generate_graphs(graph, input_file.name, check=True)

        def open_xgmml():
            # self._generate_graphs(read_xgmml(input_file))
            for elem in read_xgmml(input_file):
                self._generate_graphs(elem['graph'], elem['name'])

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
                for graphs in read_xgmml(graphfile):
                    self._generate_graphs(graphs['graph'], graphs['name'])
                cysfile.close()

        fileext = {'txt': open_edgelist,
                   'zip': open_zipfile,
                   'xgmml': open_xgmml,
                   'xml': open_xgmml,
                   'cys': open_cys}

        # TODO check for valid input
        fileext[input_file.name.split('.')[-1]]()
