var Backbone = require('backbone'),
    _ = require('underscore'),
    d3 = require('d3'),
    baseUploadOptions = require('util/file-upload'),
    TreeView = require('views/tree');
    Graph = require('models/graph');

//Link Backbone and jQuery
Backbone.$ = $;

$(function(){
  'use strict';

  var numberOfGraphs = 0;
  var graph = {};
  //Handling the fileupload
  var fileUploadOptions = _.extend(baseUploadOptions, {
    done: function (e, data) {
      numberOfGraphs = data.result.numGraph;
      graph = data.result.graph;
      $('#visualization-area').removeClass('hidden');
      $('#progress-circle').addClass('hidden');

      var treeGraph = new Graph({
        dag: graph.dag,
        name: graph.name,
        interlinks: graph.interlinks
      });

      var treeView = new TreeView({model: treeGraph});

    }
  });

  $('#fileupload').fileupload(fileUploadOptions);
});
