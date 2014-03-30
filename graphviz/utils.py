import networkx as nx
from lxml import etree
from zipfile import ZipFile


def build_subtree(G, root, out=None, edge_count=500):
    out = nx.DiGraph()
    last_node = None
    for edge in nx.bfs_edges(G, root):
        if len(out.edges()) > edge_count:
            break
        last_node = edge[0]
        out.add_edge(edge[0], edge[1])
        out.node[edge[0]]['collapsed'] = False
    if len(G[last_node].keys()) > len(out[last_node].keys()):
        for to in out[last_node].keys():
            out.remove_edge(last_node, to)
            if len(out[to].keys()) == 0:
                out.remove_node(to)
        out.node[last_node]['collapsed'] = True
    for node in out.nodes():
        out.node[node].update(G.node[node])
        if out.node[node].setdefault('collapsed', True):
            if not G.edge[node].keys():
                out.node[node]['collapsed'] = False
    return out, edge_count

def get_childs(G, root):
    out = nx.DiGraph()
    out.add_node(root)
    # for elem in nx.bfs_edges(G, root):
    #      if elem[0] == root:
    #         out.add_node(elem[0])
    #         out.add_node(elem[1])
    #         out.add_edge(*elem)
    for node in out.nodes():
        out.node[node].update(G.node[node])
        out.node[node]['collapsed'] = False
    return out

def add_childs(G, root):
    tmp = nx.DiGraph()
    sub = get_childs(G, root)
    for elem in sub.edges_iter():
        # if sub.node[elem[0]]['collapsed'] and sub.node[elem[1]]['collapsed']:
        tmp.add_edge(elem[0], elem[1])
    for node in tmp.nodes():
        tmp.node[node].update(G.node[node])
        tmp.node[node]['collapsed'] = False
    return tmp

def read_xgmml(inputfile):
    """
    Reads the 'inputfile' as xgmll and returns nodes, edges of the first registered
    graph.

    returns:
        nodes: list of nodes in the graph as etree element list
        edges: list of edges in the graph as etree element list
    """
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

        nodes = graph.xpath('XGMML:node', namespaces = ns)
        edges = graph.xpath('XGMML:edge', namespaces = ns)
        return nodes, edges
    elif version == '1.1':
        graph = allgraphs[0]

        nodes = graph.xpath('XGMML:node', namespaces = ns)
        edges = graph.xpath('XGMML:edge', namespaces = ns)
        return nodes, edges


def select_cysnetwork(inputfile):
    #Open .cys as zipfile
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
