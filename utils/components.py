import networkx as nx


def get_components(graph):
    numcomp = nx.weakly_connected.number_weakly_connected_components(graph)
    if numcomp > 1:
        graph = nx.nx.weakly_connected_component_subgraphs(graph)
    return numcomp, graph