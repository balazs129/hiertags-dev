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
      graphIndex = 1,
    $tagSearch = $('#tag-search'),
    $depthField = $('#depth-input');

  // Create the autocomplete instance
  $tagSearch.autocomplete({delimiter: /(,|;)\s*/,
      maxHeight: 400,
      width: 400,
      lookup: []
    });

  // Initialize the autocomplete instance
  var autoComplete = $tagSearch.autocomplete();

  var treeGraph = new Graph({});
  var event_bus = _({}).extend(Backbone.Events);

  //Handling the fileupload
  var fileUploadOptions = _.extend(baseUploadOptions, {
    done: function (e, data) {
      numberOfGraphs = data.result.numGraph;
      $('.hidden').removeClass('hidden');
      $('#progress-circle').addClass('hidden');
      $('#left-bar').addClass('hidden');

      treeGraph.set({
        dag: data.result.graph.dag,
        name: data.result.graph.name,
        interlinks: data.result.graph.interlinks,
        numNodes: data.result.graph.nodes,
        numEdges: data.result.graph.edges
      });
      treeGraph.update();
      event_bus.trigger('newfile');

      var $data = $('#graph-data').children();
      $data.first().text('Graph: ' + graphIndex + '/' + numberOfGraphs)
        .next().text('Nodes:  ' + treeGraph.get('numNodes'))
        .next().text('Edges:  ' + treeGraph.get('numEdges'));

      $('#depth-number').text(treeGraph.get('depth'));
    }
  });

  $('#fileupload').fileupload(fileUploadOptions);

  _.extend(treeView, Backbone.Events);

  treeView.listenTo(event_bus, 'newfile', function(){
    // Clear the previous content
    $('#visualization').html('');
    // Generate a new view
    treeView.generateTree(treeGraph);
    // Set autocomplete
    autoComplete.setOptions({lookup: treeGraph.get('suggestions')});
    // Set the spinner
    $depthField.attr('min', 0)
      .attr('max', treeGraph.get('depth'));
  });

});
