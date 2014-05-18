from lxml import etree


def parse_svg(svgtree):
    root = svgtree.getroot()

    ns = root.nsmap
    ns['svg'] = ns[None]
    ns.pop(None)
    trans = root.xpath('//svg:g', namespaces=ns)[0]

    nodes = root.xpath('//svg:g[@class="node"]', namespaces=ns)

    points = []
    padding = 200
    margin_left = 1000
    margin_right = 0
    margin_top = 1000
    margin_bottom = 0

    for elem in nodes:
        tmp = elem.attrib['transform'].split('translate')[1]
        x0 = float(tmp.split(',')[0][1:])

        if x0 < margin_left:
            margin_left = x0
        if x0 > margin_right:
            margin_right = x0

        y0 = float(tmp.split(',')[1][:-1])
        if y0 < margin_top:
            margin_top = y0
        if y0 > margin_bottom:
            margin_bottom = y0

        points.append((x0, y0))

    margins = (margin_left, margin_right, margin_top, margin_bottom)
    width = margins[1] - margins[0] + padding
    height = margins[3] - margins[2] + padding
    root.attrib['width'] = str(width)
    root.attrib['height'] = str(height)
    del root.attrib['style']
    trans.attrib['transform'] = 'translate(50,50) scale(1)'

    return etree.tostring(root, pretty_print=True)
