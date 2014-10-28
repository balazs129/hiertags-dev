var Backbone = require('backbone'),
    _ = require('underscore'),
    baseUploadOptions = require('util/file-upload'),
    treeView = require('views/tree'),
    Graph = require('models/graph');

//Link Backbone and jQuery
Backbone.$ = $;

$(function(){
  'use strict';

  var numberOfGraphs = 0,
      graphIndex = 1,
      $visualization = $('#visualization'),
      $tagSearch = $('#tag-search'),
      $depthField = $('#depth-input'),
      $depthText = $('#depth-number'),
      $errorBar = $('#error-bar'),
      $graphName = $('#graph-name'),
      $graphData = $('#graph-data').children();


  // Create the autocomplete instance
  $tagSearch.autocomplete({delimiter: /(,|;)\s*/,
      maxHeight: 400,
      width: 400,
      lookup: []
    });

  // Initialize tooltips

  $('.btn-tooltip').tooltip({
    'animation': true,
    'delay': {'show':1200, 'hide': 0},
    'container': 'body'
  });

  // Dont close save menu if checking the checkbox
  $('.dropdown-menu').on('click', function (e) {
      e.stopPropagation();
  });

  // Initialize the autocomplete instance
  var autoComplete = $tagSearch.autocomplete();

  var treeGraph = new Graph({});
  var eventBus = _({}).extend(Backbone.Events);

  function setNewGraph(graph) {
    treeGraph.set({
      dag: graph.dag,
      name: graph.name,
      interlinks: graph.interlinks,
      numNodes: graph.nodes,
      numEdges: graph.edges
    });
    treeGraph.update();
    eventBus.trigger('newfile');

    $graphData.first().text('Graph: ' + graphIndex + '/' + numberOfGraphs)
      .next().text('Nodes:  ' + treeGraph.get('numNodes'))
      .next().text('Edges:  ' + treeGraph.get('numEdges'));

    $depthText.text(treeGraph.get('depth'));
    $depthField.val('1');

    $graphName.text(graph.name);

  }
  //Handling the fileupload
  var fileUploadOptions = _.extend(baseUploadOptions, {
    done: function (e, data) {
      $errorBar.html('');

      numberOfGraphs = data.result.numGraph;
      $('.hidden').removeClass('hidden');
      $('#progress-circle').addClass('hidden');
      $('#left-bar').addClass('hidden');

      graphIndex = 1;
      setNewGraph(data.result.graph);

      $btnPrev.attr('disabled', true);
      if (numberOfGraphs > 1) {
        $btnNext.removeAttr('disabled');
      } else {
        $btnNext.attr('disabled', true);
      }

      $tagSearch.val('');

      // Scroll to the bottom of the page
      window.scrollTo(0, document.body.scrollHeight);
    }
  });

  $('#fileupload').fileupload(fileUploadOptions);

  _.extend(treeView, Backbone.Events);

  treeView.listenTo(eventBus, 'newfile', function(){
    // Clear the previous content
    $visualization.html('');
    // Generate a new view
    treeView.generateTree(treeGraph);
    // Set autocomplete
    autoComplete.setOptions({lookup: treeGraph.get('suggestions')});
    // Set the spinner
    $depthField.attr('min', 1)
      .attr('max', treeGraph.get('depth'));
  });

  var $btnNext = $('#btn-next-graph'),
      $btnPrev = $('#btn-prev-graph');

  $btnNext.on('click', function () {
    if (graphIndex < numberOfGraphs) {
      if (graphIndex === 1) {
        $btnPrev.removeAttr('disabled');
      }

      // Get new data
      graphIndex += 1;
      var url = '/visualize/graph/' + graphIndex;
      $.ajax({
        url: url
      }).done(function(data) {
        setNewGraph(data.graph);
      });

      if (graphIndex === numberOfGraphs) {
        $btnNext.attr('disabled', true);

      }
    }
  });

  $btnPrev.on('click', function () {
    if (graphIndex > 1) {
      if (graphIndex === numberOfGraphs) {
        $btnNext.removeAttr('disabled');
      }
      graphIndex -= 1;

      // Get new data
      var url = '/visualize/graph/' + graphIndex;
      $.ajax({
        url: url
      }).done(function (data) {
        setNewGraph(data.graph);
      });

      if (graphIndex === 1) {
        $btnPrev.attr('disabled', true);
      }
    }
  });
});
