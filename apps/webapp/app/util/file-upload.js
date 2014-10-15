var _ = require('underscore'),
    url = '/visualize/data/';


var fileUploadOptions = {

  url: url,
  dropZone: null,
  crossDomain: false,
  paramName: 'graph',
  dataType: 'json',

  add: function (e, data) {
    'use strict';
    var uploadedFile = data.originalFiles[0].name.split('.'),
      fileExt = _.last(uploadedFile).toLowerCase(),
      infoBar = $('#infobar');

    switch (fileExt) {
      case 'txt':
      case 'zip':
      case 'cys':
      case 'xgmml':
      case 'xml':
        data.submit();
        break;
      default :
        infoBar.text('Invalid file type!');
    }
  },

  progress: function () {
    'use strict';
    $('#progress-circle').removeClass('hidden');
  }
};

module.exports = fileUploadOptions;
