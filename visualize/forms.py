from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit


class GraphUploadForm(forms.Form):
    graph = forms.FileField(label='')

    def __init__(self, *args, **kwargs):
        self.helper = FormHelper()
        super(GraphUploadForm, self).__init__(*args, **kwargs)
        self.helper.form_method = 'post'
        self.helper.form_style = 'inline'
        self.helper.form_class = 'form-horizontal search_form'
        self.helper.add_input(Submit('submit', 'Submit'))