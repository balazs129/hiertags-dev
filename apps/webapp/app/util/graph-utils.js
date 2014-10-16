var _ = require('underscore');

var utils = utils || {};

//Function to convert the returned flat data to recursive tree structure
utils.convertData = function convert_data(data) {
  'use strict';
  var dataMap = data.reduce(function (map, node) {
    map[node.name] = node;
    return map;
  }, {});

  // create the tree array
  var treeData = [];
  data.forEach(function (node) {
    // add to parent
    var parent = dataMap[node.parent];
    if (parent) {
      // create child array if it doesn't exist
      (parent.children || (parent.children = []))
        // add node to child array
        .push(node);
    } else {
      // parent is null or missing
      treeData.push(node);
    }
  });
  return treeData;
};

// Compute the tree depth after it was processed with d3.layout.tree
utils.getDepth = function get_depth(root) {
  'use strict';
  var depths = [];

  function log(d) {
    if (d.children) {
      depths.push(d.depth);
      d.children.forEach(log);
    } else if (d._children) {
      depths.push(d.depth);
      d._children.forEach(log);
    } else {
      depths.push(d.depth);
    }
  }

  root.children.forEach(log);
  return _.max(depths);
};

module.exports = utils;