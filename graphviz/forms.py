from django import forms
from crispy_forms.helper import FormHelper


class GraphUploadForm(forms.Form):
    graph = forms.FileField()

    def __init__(self, *args, **kwargs):
        self.helper = FormHelper()
        super(GraphUploadForm, self).__init__(*args, **kwargs)