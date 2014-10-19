var Backbone = require('backbone'),
    _ = require('underscore'),
    d3 = require('d3'),
    baseUploadOptions = require('util/file-upload'),
    treeView = require('views/tree'),
    Graph = require('models/graph');

//Link Backbone and jQuery
Backbone.$ = $;

$(function(){
  'use strict';

  var numberOfGraphs = 0,
    tagSearch = $('#tag-search'),
    depthField = $('#depth-input');

  // Create the autocomplete instance
  tagSearch.autocomplete({delimiter: /(,|;)\s*/,
      maxHeight: 400,
      width: 400,
      lookup: []
    });

  // Initialize the autocomplete instance
  var autoComplete = tagSearch.autocomplete();

  var treeGraph = new Graph({});
  var event_bus = _({}).extend(Backbone.Events);

  //Handling the fileupload
  var fileUploadOptions = _.extend(baseUploadOptions, {
    done: function (e, data) {
      numberOfGraphs = data.result.numGraph;
      $('.hidden').removeClass('hidden');
      $('#progress-circle').addClass('hidden');

      treeGraph.set({
        dag: data.result.graph.dag,
        name: data.result.graph.name,
        interlinks: data.result.graph.interlinks
      });
      treeGraph.update();
      event_bus.trigger('newfile');
    }
  });

  $('#fileupload').fileupload(fileUploadOptions);

  _.extend(treeView, Backbone.Events);

  treeView.listenTo(event_bus, 'newfile', function(){
    // Generate a new view
    treeView.generateTree(treeGraph);
    // Set autocomplete
    autoComplete.setOptions({lookup: treeGraph.get('suggestions')});
    // Set the spinner
    depthField.attr('min', 0)
      .attr('max', treeGraph.get('depth'));
  });

});
