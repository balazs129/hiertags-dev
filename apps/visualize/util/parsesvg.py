#!/usr/bin/env python
# -*- coding: utf-8 -*-

import math

from lxml import etree


def style_circle(elem, text_padding_left, styles, ns):
    virtual = False;
    for c_elem in elem.getchildren():
        if c_elem.tag == ('{' + ns['svg'] + '}' + 'text'):
            if c_elem.text is not None:
                if len(c_elem.text) > text_padding_left:
                    text_padding_left = len(c_elem.text)
                    # Fix for export
                    if c_elem.attrib['class'].split(' ')[-1] == 'virtual':
                        c_elem.attrib['style'] = styles['virtual_text']
                    else:
                        c_elem.attrib['style'] = styles['node_text']

                    c_elem.attrib['dy'] = '2'
        elif c_elem.tag == ('{' + ns['svg'] + '}' + 'circle'):
            if c_elem.attrib['class'].split(' ')[-1] == 'virtual':
                c_elem.attrib['style'] += styles['virtual']
            else:
                c_elem.attrib['style'] += styles['node']

def parse_svg(svgtree, layout, full, size):
    styles = {'node': 'stroke:#4682b4;stroke-width:1px',
              'virtual': 'stroke: #aabbaa;stroke-width:1px',
              'node_text': 'font-size:10px;fill:#353524;fill-opacity:1;font-family:sans-serif',
              'virtual_text': 'font-size:10px;fill:#aabbaa;fill-opacity:1;font-family:sans-serif',
              'normal_link': 'fill:none;stroke:#cccccc;stroke-width:2px;',
              'added_link': 'fill:none;stroke:#cddaff;;stroke-width:2px;'}

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

    for elem in paths[:-4]:
        if elem.attrib['style'][-2] == '0':
            elem.attrib['style'] += styles['normal_link']
        else:
            elem.attrib['style'] += styles['added_link']

    for elem in nodes:
        style_circle(elem, text_padding_left, styles, ns)

    if full:
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

        text_padding = int(math.floor((text_padding_right + text_padding_left)))
        margins = (margin_left, margin_right, margin_top, margin_bottom)
        if layout == 'vertical':
            width = margins[1] - margins[0] + padding + text_padding * 2
        else:
            width = margins[1] - margins[0] + padding + text_padding * 8
        height = margins[3] - margins[2] + padding

        root.attrib['width'] = str(width)
        root.attrib['height'] = str(height)

        scale = '1'
        if layout == 'vertical':
            trans.attrib['transform'] = 'translate(50,50) ' + 'scale({})'.format(scale)
        else:
            transx = 100 + text_padding * 10
            trans.attrib['transform'] = 'translate(' + str(transx) + ',50) ' + 'scale({})'.format(scale)
    else:
        root.attrib['width'] = str(size[0])
        root.attrib['height'] = str(size[1])

    return etree.tostring(root)