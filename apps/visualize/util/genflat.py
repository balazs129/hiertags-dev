#!/usr/bin/env python
# -*- coding: utf-8 -*-


def gen_flat(graph):
    """
    Generate Flat edgelist from the generated graph for the JS script.

    :param graph: NetworkX graph
    :return: flattened data
    """
    data = []
    idmap = {}

    # If data dict empty then label=id
    for elem in graph.nodes_iter(data=True):
        if len(elem[1]) == 0:
            elem[1]['id'] = elem[0]
            elem[1]['label'] = elem[0]
            idmap[elem[1]['id']] = elem[1]['label']
        else:
            idmap[elem[1]['id']] = elem[1]['label']

    for elem in graph.nodes():
        tmp = {'name': idmap[elem]}
        if len(graph.pred[elem].keys()) == 0:
            parent = "null"
        else:
            t_parent = graph.pred[elem].keys()[0]
            parent = idmap[t_parent]
        tmp['parent'] = parent
        data.append(tmp)
    return data