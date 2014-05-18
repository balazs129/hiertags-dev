from lxml import etree
import networkx as nx
import HTMLParser
from utils.filter_DAG import parse_DAG


def read_xgmml(inputfile):
    htmlpar = HTMLParser.HTMLParser()
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
            realgraphs = []
            try:
                skey = '{' + ns['cy'] + '}' + 'registered'
                for elem in allgraphs:
                    if elem.attrib[skey] == '1':
                        realgraphs.append(elem)
                graph = realgraphs[0]
            except KeyError:
                graph = allgraphs[0]
    elif version == '1.1':
        graph = allgraphs[0]

    nodes = graph.xpath('XGMML:node', namespaces=ns)
    edges = graph.xpath('XGMML:edge', namespaces=ns)

    tmp_graph = nx.DiGraph()
    # for elem in nodes:
    #     tmp_graph.add_node(elem.attrib['id'], elem.attrib)
    # for elem in edges:
    #     tmp_graph.add_edge(elem.attrib['source'], elem.attrib['target'], elem.attrib)
    # return nodes, edges
    for node in nodes:
        tmp_graph.add_node(node.attrib['id'],
                                    {'id': node.attrib['id'], 'label': htmlpar.unescape(node.attrib['label'])})
    for edge in edges:
        tmp_graph.add_edge(edge.attrib['source'], edge.attrib['target'])

    tree_graph, interlinks = parse_DAG(tmp_graph)
    return tree_graph, interlinks
# TODO: Return graph name