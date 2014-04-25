from django import forms


class GraphUploadForm(forms.Form):
    graph = forms.FileField(label='')