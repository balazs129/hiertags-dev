#!/usr/bin/env python
# -*- coding: utf-8 -*-
import cStringIO
import math
import subprocess
import tempfile
import uuid
import os

from lxml import etree
from PIL import Image


class ExportGraph(object):
    def __init__(self, type, data, layout):
        self._type = type
        self._data = data
        self._layout = layout
        if type != 'txt':
            self._parser = etree.XMLParser(encoding='UTF-8')
            self._generate_xml()

    def _generate_xml(self):
        xml_data = etree.parse(cStringIO.StringIO(self._data), parser=self._parser)
        self._svg_data = self._parse_svg(xml_data, self._layout)

    def export_graphics(self):
        tmp_infile = tempfile.NamedTemporaryFile()
        tmp_infile.write(self._svg_data)
        tmp_infile.seek(0)

        tmp_outfile = '/tmp/' + str(uuid.uuid4())

        type_formatter = {"pdf": "-A", "png": "-e", "jpg": "-e", "svg": "-l"}

        _ = subprocess.Popen(
            ['inkscape', "-b white", "-f", tmp_infile.name, "{0}".format(type_formatter[self._type]), tmp_outfile],
            shell=False,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()[0]

        if self._type == 'jpg':
            png = Image.open(tmp_outfile)
            tmp_jpeg = tempfile.NamedTemporaryFile()
            png.save(tmp_jpeg, 'JPEG', quality=90)
            tmp_jpeg.seek(0)
            output = tmp_jpeg.read()

            tmp_infile.close()
            tmp_jpeg.close()
            os.remove(tmp_outfile)
        else:
            ret_file = open(tmp_outfile, 'rb')
            output = ret_file.read()
            tmp_infile.close()
            os.remove(tmp_outfile)

        return output

    def export_edgelist(self):
        out_file = cStringIO.StringIO()
        for elem in self._data.split("],["):
            if elem[0:2] == "[[":
                tmp = elem[2:]
            elif elem[-2:] == "]]":
                tmp = elem[:-2]
            else:
                tmp = elem

            cleaned = tmp.split(",")
            to_write = cleaned[0][1:-1] + ' ' + cleaned[1][1:-1] + '\n'
            out_file.write(to_write)

        out_file.seek(0)
        output = out_file.read()

        return output

    @staticmethod
    def _parse_svg(svgtree, layout):
        root = svgtree.getroot()

        # Get and fix namespaces
        ns = root.nsmap
        ns['svg'] = ns[None]
        ns.pop(None)

        trans = root.xpath('//svg:g', namespaces=ns)[0]
        nodes = root.xpath('//svg:g[@class="node"]', namespaces=ns)

        # Formatting options
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
        if layout == 'vertical':
            width = margins[1] - margins[0] + padding + text_padding * 2
        else:
            width = margins[1] - margins[0] + padding + text_padding * 8
        height = margins[3] - margins[2] + padding
        root.attrib['width'] = str(width)
        root.attrib['height'] = str(height)
        del root.attrib['style']
        if layout == 'vertical':
            trans.attrib['transform'] = 'translate(50,50) scale(1)'
        else:
            transx = 50 + text_padding * 5
            trans.attrib['transform'] = 'translate(' + str(transx) + ',50) scale(1)'

        return etree.tostring(root)