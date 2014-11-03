#!/usr/bin/env python
# -*- coding: utf-8 -*-

import math
from lxml import etree


def style_circle(elem, text_padding_left, styles, ns):
    for c_elem in elem.getchildren():
        if c_elem.tag == ('{' + ns['svg'] + '}' + 'text'):
            if len(c_elem.text) > text_padding_left:
                text_padding_left = len(c_elem.text)
            c_elem.attrib['style'] = styles['node_text']
            # Fix for export
            c_elem.attrib['dy'] = '2'
        elif c_elem.tag == ('{' + ns['svg'] + '}' + 'circle'):
            if c_elem.attrib['style'].split(' ')[-1] == 'lightsteelblue;':
                c_elem.attrib['style'] = styles['collapsed_node']
            else:
                c_elem.attrib['style'] = styles['expanded_node']


def parse_svg(svgtree, layout):
    styles = {'expanded_node': 'fill:#ffffff;stroke:#4682b4;stroke-width:1px',
              'collapsed_node': 'fill:#0099ff;stroke:#4682b4;stroke-width:1px',
              'node_text': 'font-size:10px;text-anchor:middle;fill:#353524;fill-opacity:1;font-family:sans-serif',
              'normal_link': 'fill:none;stroke:#666666;stroke-width:1px;',
              'added_link': 'fill:none;stroke:#8888ff;stroke-width:1px;'}

    root = svgtree.getroot()

    # Get and fix namespaces
    ns = root.nsmap
    ns['svg'] = ns[None]
    ns.pop(None)

    trans = root.xpath('//svg:g', namespaces=ns)[0]
    nodes = root.xpath('//svg:g[@class="node"]', namespaces=ns)
    paths = root.xpath('//svg:path', namespaces=ns)

    # Formatting options
    padding = 200
    margin_left = 1000
    margin_right = 0
    margin_top = 1000
    margin_bottom = 0
    text_padding_left = 0
    text_padding_right = 0

    for elem in paths[:-1]:
        if elem.attrib['style'][-2] == '0':
            elem.attrib['style'] += styles['normal_link']
        else:
            elem.attrib['style'] += styles['added_link']

    for elem in nodes:
        tmp = elem.attrib['transform'].split('translate')[1]
        x0 = float(tmp.split(',')[0][1:])

        style_circle(elem, text_padding_left, styles, ns)

        if x0 < margin_left:
            margin_left = x0

        if x0 > margin_right:
            margin_right = x0

        y0 = float(tmp.split(',')[1][:-1])
        if y0 < margin_top:
            margin_top = y0
        if y0 > margin_bottom:
            margin_bottom = y0

    text_padding = int(math.floor((text_padding_right / 2 + text_padding_left / 2)))
    margins = (margin_left, margin_right, margin_top, margin_bottom)
    if layout == 'vertical':
        width = margins[1] - margins[0] + padding + text_padding * 2
    else:
        width = margins[1] - margins[0] + padding + text_padding * 8
    height = margins[3] - margins[2] + padding
    root.attrib['width'] = str(width)
    root.attrib['height'] = str(height)
    if layout == 'vertical':
        trans.attrib['transform'] = 'translate(50,50) scale(1)'
    else:
        transx = 50 + text_padding * 5
        trans.attrib['transform'] = 'translate(' + str(transx) + ',50) scale(1)'

    return etree.tostring(root)