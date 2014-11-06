#!/usr/bin/env python
# -*- coding: utf-8 -*-
import cStringIO
import subprocess
import tempfile
import uuid

import os
from lxml import etree
from PIL import Image

from parsesvg import parse_svg


class ExportGraph(object):
    def __init__(self, export_type, data, layout):
        self._type = export_type
        self._data = data
        self._layout = layout
        if export_type != 'edgelist':
            self._parser = etree.XMLParser(encoding='UTF-8')
            self._generate_xml()

    def _generate_xml(self):
        xml_data = etree.parse(cStringIO.StringIO(self._data), parser=self._parser)
        self._svg_data = parse_svg(xml_data, self._layout)

    def export_graphics(self):
        tmp_infile = tempfile.NamedTemporaryFile()
        tmp_infile.write(self._svg_data)
        tmp_infile.seek(0)

        file_name = str(uuid.uuid4()) + '.' + self._type
        tmp_outfile = '/tmp/' + file_name

        type_formatter = {"pdf": "-A", "png": "-e", "jpg": "-e", "svg": "-l"}

        _ = subprocess.Popen(
            ['inkscape', "-b white", "-f", tmp_infile.name, "{0}".format(type_formatter[self._type]), tmp_outfile],
            shell=False,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()[0]

        if self._type == 'jpg':
            png = Image.open(tmp_outfile)
            tmp_jpeg_name = '/tmp/' + str(uuid.uuid4()) + '.jpg'
            tmp_jpeg = open(tmp_jpeg_name, 'wb')
            png.save(tmp_jpeg, 'JPEG', quality=90)

            tmp_infile.close()
            os.remove(tmp_outfile)
            file_name = tmp_jpeg_name
            tmp_jpeg.close()
        else:
            tmp_infile.close()

        return file_name

    def export_edgelist(self):
        file_name = str(uuid.uuid4()) + '.txt'
        out_file_name = '/tmp/' + file_name
        out_file = open(out_file_name, 'w')

        for elem in self._data.split("],["):
            if elem[0:2] == "[[":
                tmp = elem[2:]
            elif elem[-2:] == "]]":
                tmp = elem[:-2]
            else:
                tmp = elem

            cleaned = tmp.split(",")
            token_1 = cleaned[0][1:-1].replace(" ", "_")
            token_2 = cleaned[1][1:-1].replace(" ", "_")
            to_write = token_1 + ' ' + token_2 + '\n'
            out_file.write(to_write)

        return file_name

