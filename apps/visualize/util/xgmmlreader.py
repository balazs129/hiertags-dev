from lxml import etree
import networkx as nx
import HTMLParser


def read_xgmml(inputfile):
    # Non-ascii chars saved with html escaping
    htmlpar = HTMLParser.HTMLParser()
    xgmml = etree.parse(inputfile)
    root = xgmml.getroot()

    # getting namespaces
    ns = root.nsmap

    # changing default 'None' to 'XGMML' because XPath doesn't like None
    ns['XGMML'] = ns[None]
    ns.pop(None)

    graphs = root.xpath('//XGMML:graph', namespaces=ns)

    # Get the document-version
    dkey = '{' + ns['cy'] + '}' + 'documentVersion'
    try:
        version = graphs[0].attrib[dkey]
    except KeyError:
        version = graphs[0][0].attrib['value']

    registered = []
    # Only use the registered graphs if we got version 3.0. With version 1.1 we have only
    # one graph per file.
    if version == '3.0':
        skey = '{' + ns['cy'] + '}' + 'registered'
        for elem in graphs:
            if elem.attrib[skey] == '1':
                graph_name = elem.attrib['label']
                registered.append({'name': graph_name, 'graph': elem})
    elif version == '1.1':
        for elem in graphs:
            graph_name = elem.attrib['label']
            registered.append({'name': graph_name, 'graph': elem})

    # We need to create a map for the links(xlinks)
    node_map = {}
    edge_map = {}
    nx_graphs = []
    for elem in registered:
        nodes = elem['graph'].xpath('XGMML:node', namespaces=ns)
        edges = elem['graph'].xpath('XGMML:edge', namespaces=ns)

        for node in nodes:
            if 'id' in node.attrib:
                node_map[node.attrib['id']] = node

        for edge in edges:
            if 'id' in edge.attrib:
                edge_map[edge.attrib['id']] = edge

        # Check if nodes have label attribute
        nested_label = False
        try:
            for _ in nodes[0].getchildren():
                if _.attrib['name'] == 'label':
                    nested_label = True
        except KeyError:
            pass

        tmp_graph = nx.DiGraph()

        xlink = '{' + ns['xlink'] + '}' + 'href'
        if nested_label:
            for node in nodes:
                for children in node.getchildren():
                    if children.attrib['name'] == 'label':
                        tmp_name = children.attrib['value']
                tmp_graph.add_node(node.attrib['id'], {'id': node.attrib['id'], 'label': htmlpar.unescape(tmp_name)})
            for edge in edges:
                tmp_graph.add_edge(edge.attrib['source'], edge.attrib['target'])
        else:
            for node in nodes:
                if 'id' in node.attrib:
                    tmp_graph.add_node(node.attrib['id'],
                                       {'id': node.attrib['id'], 'label': htmlpar.unescape(node.attrib['label'])})
                elif xlink in node.attrib:
                    link = node_map[node.attrib[xlink][1:]]
                    tmp_graph.add_node(link.attrib['id'],
                                       {'id': link.attrib['id'], 'label': htmlpar.unescape(link.attrib['label'])})
            for edge in edges:
                if version == '1.1' or 'id' in edge.attrib:
                    tmp_graph.add_edge(edge.attrib['source'], edge.attrib['target'])
                else:
                    link = edge_map[edge.attrib[xlink][1:]]
                    tmp_graph.add_edge(link.attrib['source'], link.attrib['target'])
        nx_graphs.append({'name': elem['name'], 'graph': tmp_graph})
    return nx_graphs

