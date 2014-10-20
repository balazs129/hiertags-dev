var Backbone = require('backbone'),
    _ = require('underscore'),
    d3 = require('d3'),
    utils = require('util/graph-utils');

// The Graph model
var Graph = Backbone.Model.extend({
  defaults: {
    dag: {},
    name: '',
    interlinks: [],
    numNodes: 0,
    numEdges: 0,

    // Properties for the view
    suggestions: [],
    isLayoutVertical: true,
    horizontalRatio: 0,
    depth: 0,
    extraWidth: 0,
    isLabelsVisible: true
  },

  initialize: function () {
    'use strict';
//    this.on('change', function () { console.log('Model changed: ', this); });
  },

  update: function () {
    'use strict';
    var _this = this,
        tree = d3.layout.tree();

    // Get the node names for suggestions
    this.attributes.suggestions = [];
    this.attributes.dag.forEach(function(node){
      _this.attributes.suggestions.push(node.name);
    });

    // Convert the returned flat structure to a recursive one needed by d3
    this.attributes.dag = utils.convertData(this.attributes.dag);

    //Compute the tree depth
    tree.nodes(this.attributes.dag[0]).reverse();
    this.attributes.depth = utils.getDepth(this.attributes.dag[0]);
  }
});

module.exports = Graph;