from lxml import etree
import networkx as nx


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

    tmp_graph = nx.DiGraph()
    for elem in nodes:
        tmp_graph.add_node(elem.attrib['id'], elem.attrib)
    for elem in edges:
        tmp_graph.add_edge(elem.attrib['source'], elem.attrib['target'], elem.attrib)
    return nodes, edges