from lxml import etree
import networkx as nx
import HTMLParser


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
    #TODO unsupported version

    nodes = graph.xpath('XGMML:node', namespaces=ns)
    edges = graph.xpath('XGMML:edge', namespaces=ns)

    nested_label = False
    try:
        for elem in nodes[0].getchildren():
            if elem.attrib['name'] == 'label':
                nested_label = True
    except KeyError:
        pass

    tmp_graph = nx.DiGraph()
    if nested_label:
        for node in nodes:
            for elem in node.getchildren():
                if elem.attrib['name'] == 'label':
                    tmp_name = elem.attrib['value']
            tmp_graph.add_node(node.attrib['id'], {'id': node.attrib['id'], 'label': htmlpar.unescape(tmp_name)})
        for edge in edges:
            tmp_graph.add_edge(edge.attrib['source'], edge.attrib['target'])
    else:
        for node in nodes:
            tmp_graph.add_node(node.attrib['id'],
                                        {'id': node.attrib['id'], 'label': htmlpar.unescape(node.attrib['label'])})
        for edge in edges:
            tmp_graph.add_edge(edge.attrib['source'], edge.attrib['target'])


    return tmp_graph
#TODO: Return graph name