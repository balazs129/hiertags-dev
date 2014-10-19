var Backbone = require('backbone'),
    _ = require('underscore'),
    d3 = require('d3');



// Set up the initial canvas
var app = {

  generateTree : function (treeData) {
    'use strict';
    var margin = {top: 20, right: 120, bottom: 20, left: 120},
      visualizationArea = $('#visualization'),
      width = visualizationArea.width() - margin.right - margin.left,
      height = visualizationArea.height() - margin.top - margin.bottom;

    var i = 0,
      duration = 750,
      root;

    var tree = d3.layout.tree();
//      .size([width, height])
//      .separation(function (a, b) {
//        return a.name.length + b.name.length + 5;
//      });

    var diagonal = d3.svg.diagonal()
      .projection(function (d) {
        if (treeData.get('isLayoutVertical')) {
          return [d.x, d.y];
        } else {
          return [d.y, d.x];
        }
      });

    root = treeData.get('dag')[0];
    root.x0 = width / 2;
    root.y0 = height / 4;

    update(root);

    function update(source) {
      var levelWidth = [1],
        levelLabelWidth = [1],
        childSum,
        newHeight,
        newWidth;

      // Function to calculate the number of childrens/sum of the label widths per depth
      function childCount(level, n) {
        function get_numbers(d) {
          var tmp = 0,
            numChild = d.length,
            index;

          for (index = 0; index < numChild; index += 1) {
            tmp += d[index].name.length;
          }
          return tmp;
        }

        if (n.children && n.children.length > 0) {
          if (levelWidth.length <= level + 1) {
            levelWidth.push(0);
          }
          if (levelLabelWidth.length <= level + 1) {
            levelLabelWidth.push(0);
          }

          levelWidth[level + 1] += n.children.length;
          levelLabelWidth[level + 1] += get_numbers(n.children);
          n.children.forEach(function (d) {
            childCount(level + 1, d);
          });
        }
      }

      childCount(0, root);
      childSum = _.reduce(levelWidth, function (memo, num) {
        return memo + num;
      }, 0);

      // Set the new widths and heights
      // Vertical Layout
      if (treeData.get('isLayoutVertical')) {
        newHeight = treeData.get('depth') * 100;

        if (treeData.get('isLabelsVisible')) {
          var tmpWidth = _.map(levelWidth, function (num, index) {
            return num * 4 + levelLabelWidth[index];
          });

          newWidth = _.max(tmpWidth) + treeData.get('extraWidth');
        } else {
          newWidth = childSum * 25;
        }
        // Horizontal Layout
      } else {
        newWidth = treeData.get('depth') * (100 + childSum + treeData.get('horizontalRatio'));
        newHeight = treeData.get('depth') * (childSum * 3);
      }

      tree.size([newWidth, newHeight]).separation(function (a, b) {
        if (treeData.get('isLabelsVisible')) {
          return a.name.length + b.name.length + 5;
        } else {
          return 10;
        }
      });

      // Calculate the new layout
      var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

      // Add the extra edges if any
      var InterLink = function (source, target) {
        this.source = source;
        this.target = target;
        this.added = true;
      };

      treeData.get('interlinks').forEach(function (link) {
        var sourceNode,
            targetNode;
        sourceNode = _.find(nodes, function(n) { return n.name === link[0];});
        targetNode = _.find(nodes, function(n) { return n.name === link[1];});
        links.push(new InterLink(sourceNode, targetNode));
      });

      console.log(links);


    }
  }
};

module.exports = app;
