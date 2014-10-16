var Backbone = require('backbone'),
    _ = require('underscore'),
    d3 = require('d3'),
    baseUploadOptions = require('util/file-upload'),
    TreeView = require('views/tree'),
    Graph = require('models/graph');

//Link Backbone and jQuery
Backbone.$ = $;

$(function(){
  'use strict';

  var numberOfGraphs = 0;

  var treeGraph = new Graph({});
  var treeView = new TreeView({model: treeGraph});

  //Handling the fileupload
  var fileUploadOptions = _.extend(baseUploadOptions, {
    done: function (e, data) {
      numberOfGraphs = data.result.numGraph;
      $('#visualization-area').removeClass('hidden');
      $('#progress-circle').addClass('hidden');

      treeGraph.set({
        dag: data.result.graph.dag,
        name: data.result.graph.name,
        interlinks: data.result.graph.interlinks
      }, {silent: true});
      console.log(treeGraph);
      treeGraph.update();
    }
  });

  $('#fileupload').fileupload(fileUploadOptions);
});
