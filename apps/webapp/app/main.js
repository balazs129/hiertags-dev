var Backbone = require('backbone'),
    _ = require('underscore');

//Link Backbone and jQuery
Backbone.$ = $;

$(function(){
  'use strict';

  //Handling the fileupload
  $('#fileupload').fileupload({
    url: '/visualize/data/',
    crossDomain: false,
    paramName: 'graph',
    dataType: 'json',
    add: function (e, data) {
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
    },
    done: function (e, data) {
      console.log(data);
    }
  });
});
