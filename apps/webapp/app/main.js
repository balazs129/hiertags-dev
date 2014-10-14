var Backbone = require('backbone'),
    _ = require('underscore'),
    baseUploadOptions = require('util/fileupload');

//Link Backbone and jQuery
Backbone.$ = $;

$(function(){
  'use strict';

  //Handling the fileupload
  var fileUploadOptions = _.extend(baseUploadOptions, {
    done: function (e, data) {
      console.log(data.result);
    }
  });

  $('#fileupload').fileupload(fileUploadOptions);
});
