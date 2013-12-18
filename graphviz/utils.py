import networkx as nx


def build_subtree(G, root, out=None, edge_count=100):
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