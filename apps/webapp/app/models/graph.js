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

    // Properties for the view
    suggestions: [],
    islayoutVertical: true,
    depth: 0,
    width: 0,
    isLabelsVisible: true
  },
  initialize: function(){
    'use strict';
    var _this = this,
        tree = d3.layout.tree();

    this.attributes.dag.forEach(function(node){
      _this.attributes.suggestions.push(node.name);
    });

    this.attributes.dag = utils.convertData(this.attributes.dag);

    var root = this.attributes.dag[0],
        nodes = tree.nodes(root).reverse();

    this.attributes.depth = utils.getDepth(root);

  }
});

module.exports = Graph;