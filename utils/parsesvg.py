from lxml import etree
import math


def parse_svg(svgtree):
    root = svgtree.getroot()

    ns = root.nsmap
    ns['svg'] = ns[None]
    ns.pop(None)
    trans = root.xpath('//svg:g', namespaces=ns)[0]

    nodes = root.xpath('//svg:g[@class="node"]', namespaces=ns)

    padding = 200
    margin_left = 1000
    margin_right = 0
    margin_top = 1000
    margin_bottom = 0
    text_padding_left = 0
    text_padding_right = 0

    for elem in nodes:
        tmp = elem.attrib['transform'].split('translate')[1]
        x0 = float(tmp.split(',')[0][1:])

        if x0 < margin_left:
            margin_left = x0
            for c_elem in elem.getchildren():
                if c_elem.tag == ('{' + ns['svg'] + '}' + 'text'):
                    if len(c_elem.text) > text_padding_left:
                        text_padding_left = len(c_elem.text)

        if x0 > margin_right:
            margin_right = x0
            for c_elem in elem.getchildren():
                if c_elem.tag == ('{' + ns['svg'] + '}' + 'text'):
                    if len(c_elem.text) > text_padding_right:
                        text_padding_right = len(c_elem.text)

        y0 = float(tmp.split(',')[1][:-1])
        if y0 < margin_top:
            margin_top = y0
        if y0 > margin_bottom:
            margin_bottom = y0

    text_padding = int(math.floor((text_padding_right / 2 + text_padding_left / 2)))
    margins = (margin_left, margin_right, margin_top, margin_bottom)
    width = margins[1] - margins[0] + padding + text_padding
    height = margins[3] - margins[2] + padding
    root.attrib['width'] = str(width)
    root.attrib['height'] = str(height)
    del root.attrib['style']
    trans.attrib['transform'] = 'translate(0,50) scale(1)'

    return etree.tostring(root, pretty_print=True)
