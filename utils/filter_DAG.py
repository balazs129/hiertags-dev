import networkx as nx


def parse_DAG(graph):
    nodes = []
    for node, ins in graph.in_degree().items():
        if ins > 1:
            nodes.append(node)
    sorted_nodes = nx.topological_sort(graph)
    root = sorted_nodes[0]

    snodes = []
    edges_to_remove = []
    for elem in sorted_nodes:
        if elem in nodes:
            snodes.append(elem)

    for elem in snodes:
        paths = list(nx.all_simple_paths(graph, root, elem))
        paths.sort(key=lambda x: len(x))
        to_remove = paths[:-1]
        for rem in to_remove:
            if graph.in_degree(rem[-1]) > 1:
                graph.remove_edge(rem[-2], rem[-1])
                edges_to_remove.append([graph.node[rem[-2]]['label'], graph.node[rem[-1]]['label']])

    return graph, edges_to_remove