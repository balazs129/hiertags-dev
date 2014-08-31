from django import forms


class GraphUploadForm(forms.Form):
    graph = forms.FileField()


class SerializedSvgForm(forms.Form):
    output_format = forms.CharField(label="output_format")
    data = forms.CharField(label="data")
    layout = forms.CharField(label="layout")
