from zipfile import ZipFile

import networkx as nx
from lxml import etree


def paint_nodes(graph):
    for node in graph.nodes():
        try:
            nx.bfs_successors(graph, node)[node]
            graph.node[node]['collapsed'] = False
        except KeyError:
            graph.node[node]['collapsed'] = True
    return None


def build_subtree(graph, root):
    out = nx.DiGraph()
    out.add_node(root)
    for elem in nx.bfs_edges(graph, root):
        out.add_edge(*elem)
    for node in out.nodes():
        out.node[node].update(graph.node[node])
    return out


def get_childs(G, root):
    out = nx.DiGraph()
    out.add_node(root)
    for elem in nx.bfs_successors(G, root)[root]:
        out.add_edge(root, elem)
    for node in out.nodes():
        out.node[node].update(G.node[node])
    return out


def add_childs(base, tmp, root):
    sub = get_childs(base, root)
    for elem in sub.edges_iter():
        tmp.add_edge(*elem)
    for node in tmp.nodes():
        tmp.node[node].update(base.node[node])
    return tmp


def hide_childs(base, graph, root):
    to_remove = []
    for elem in nx.bfs_edges(base, root):
        if graph.has_edge(*elem):
            graph.remove_edge(*elem)
            if elem[0] != root:
                to_remove.extend(elem)
            else:
                to_remove.append(elem[1])
    graph.remove_nodes_from(to_remove)
    return graph


def read_xgmml(inputfile):
    xgmml = etree.parse(inputfile)
    root = xgmml.getroot()
    #getting namespaces
    ns = root.nsmap
    #changing default 'None' to 'XGMML' because XPath doesn't like None
    ns['XGMML'] = ns[None]
    ns.pop(None)
    #get the first registered graph
    allgraphs = root.xpath('//XGMML:graph', namespaces=ns)
    dkey = '{' + ns['cy'] + '}' + 'documentVersion'
    try:
        version = allgraphs[0].attrib[dkey]
    except KeyError:
        version = allgraphs[0][0].attrib['value']

    if version == '3.0':
        if len(allgraphs) == 1:
            graph = allgraphs[0]
        else:
            realgraphs = []
            skey = '{' + ns['cy'] + '}' + 'registered'
            for elem in allgraphs:
                if elem.attrib[skey] == '1':
                    realgraphs.append(elem)
            graph = realgraphs[0]

        nodes = graph.xpath('XGMML:node', namespaces=ns)
        edges = graph.xpath('XGMML:edge', namespaces=ns)
    elif version == '1.1':
        graph = allgraphs[0]

        nodes = graph.xpath('XGMML:node', namespaces=ns)
        edges = graph.xpath('XGMML:edge', namespaces=ns)

    G = nx.DiGraph()
    for elem in nodes:
        G.add_node(elem.attrib['id'], elem.attrib)
    for elem in edges:
        G.add_edge(elem.attrib['source'], elem.attrib['target'], elem.attrib)

    cycles = list(nx.cycles.simple_cycles(G))
    if len(cycles) > 0:
        for elem in cycles:
            if len(elem) == 1:
                to_remove = (elem[0], elem[0])
                for edge in edges:
                    if edge.get('source') == to_remove[0] and edge.get('target') == to_remove[1]:
                        edges.remove(edge)
            else:
                for tmp_in in elem:
                    if len(G.in_edges(tmp_in)) > 1:
                        end = tmp_in
                        starts = []
                        for tmp_out in G.in_edges(tmp_in):
                            starts.append(tmp_out[0])
                starts_set = set(starts)
                cycles_set = set(elem)
                start = starts_set & cycles_set
                to_remove = (start.pop(), end)
                for edge in edges:
                    if edge.attrib['source'] == to_remove[0] and edge.attrib['target'] == to_remove[1]:
                        edges.remove(edge)
    return nodes, edges


def select_cysnetwork(inputfile):
    sessionfile = ZipFile(inputfile, 'r')
    contents = sessionfile.namelist()
    networks = []
    for elem in contents:
        tmp = elem.split('/')
        if tmp[1] == 'networks':
            networks.append((tmp[2], elem))
        elif tmp[1][-6:] == '.xgmml':
            networks.append((tmp[1], elem))
    return sessionfile.open(networks[0][1], 'r')
