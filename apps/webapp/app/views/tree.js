var Backbone = require('backbone'),
    _ = require('underscore'),
    d3 = require('d3');



// Set up the initial canvas
var app = {
  generateTree: function (treeData) {
    'use strict';

    // Set up the canvas
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
      $visualizationArea = $('#visualization'),
      width = $visualizationArea.width() - margin.right - margin.left,
      height = $visualizationArea.height() - margin.top - margin.bottom;

    // Listen for zoom/pan events on the svg canvas
    var zoomListener = d3.behavior.zoom()
      .scaleExtent([0.2, 2])
      .on("zoom", function zoom() {
        svgGroup.attr("transform",
            "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
      });

    var svg = d3.select('#visualization')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overlay')
      .call(zoomListener);

    var svgGroup = svg.append('g');

    var duration = 750,
        root,
        i = 0;

    // Helper functions for the update function
    function centerNode(source) {
      var scale = zoomListener.scale();
      var x, y = 0;
      if (treeData.get('isLayoutVertical')) {
        x = -source.x0 * scale + width / 2;
        y = -source.y0 * scale + height / 4;
      } else {
        x = -source.y0 * scale + 100;
        y = -source.x0 * scale + height / 2;
      }
      d3.select('g').transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
      zoomListener.scale(scale);
      zoomListener.translate([x, y]);
    }

    function nodeClick (d) {

      if (d.children) {
        d._children = d.children;
        d.children = null;
        d._children.forEach(app.util.collapse);
      } else {
        d.children = d._children;
        d._children = null;
        d.children.forEach(app.util.collapse);
      }
      update(d);
      centerNode(d);
    }

    var tree = d3.layout.tree();

    var diagonal = d3.svg.diagonal()
      .projection(function (d) {
        if (treeData.get('isLayoutVertical')) {
          return [d.x, d.y];
        } else {
          return [d.y, d.x];
        }
      });

    root = treeData.get('dag')[0];
    // Entering nodes requires these attributes to present
    root.x0 = width / 2;
    root.y0 = height / 4;

    update(root);
    centerNode(root);

    function update(source) {
      var levelWidth = [1],
        levelLabelWidth = [1],
        childSum,
        newHeight,
        newWidth;

      // Function to calculate the number of childrens/sum of the label widths per depth
      function childCount(level, n) {
        if (n.children && n.children.length > 0) {
          if (levelWidth.length <= level + 1) {
            levelWidth.push(0);
          }
          if (levelLabelWidth.length <= level + 1) {
            levelLabelWidth.push(0);
          }

          levelWidth[level + 1] += n.children.length;
          levelLabelWidth[level + 1] = _.reduce(_.pluck(n.children, 'name'),
            function (memo, num) { return memo + num.length;}, 0);

          n.children.forEach(function (d) {
            childCount(level + 1, d);
          });
        }
      }

      childCount(0, source);
      childSum = _.reduce(levelWidth, function (memo, num) {
        return memo + num;
      }, 0);

      // Set the new widths and heights
      // Vertical Layout
      if (treeData.get('isLayoutVertical')) {
        newHeight = treeData.get('depth') * 100;

        if (treeData.get('isLabelsVisible')) {
          var tmpWidth = _.map(levelWidth, function (num, index) {
            return num * 24 + levelLabelWidth[index] * 10;
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
          return a.name.length + b.name.length + 10;
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

      var sourceNode,
          targetNode;
      treeData.get('interlinks').forEach(function (link) {
        sourceNode = _.find(nodes, function(n) { return n.name === link[0];});
        targetNode = _.find(nodes, function(n) { return n.name === link[1];});
        links.push(new InterLink(sourceNode, targetNode));
      });

      // Join data with nodes and edges
      // Simply assign the index number as data

      // Update the nodes
      var node = svgGroup.selectAll('g.node')
        .data(nodes, function (d) {
          return d.id || (d.id = ++i);
        });

      // Update the edges
      var link = svgGroup.selectAll('path.link')
        .data(links, function (d) {
          var linkId;
          if (d.hasOwnProperty('added')) {
            linkId = d.source.id + d.target.id + parseInt(treeData.get('numNodes'));
          } else {
            linkId = d.target.id;
          }
          return d.id || (d.id = linkId);
        });

      // NODES
      // Enter any new nodes at the parent's previous position
      var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', function () {
          if (treeData.get('isLayoutVertical')) {
            return 'translate(' + source.x0 +',' + source.y0 + ')';
          } else {
            return 'translate(' + source.y0 +',' + source.x0 + ')';
          }
        });
        // Add listeners to node

      // Add node circles
      nodeEnter.append('circle')
        .attr('class', 'nodeCircle')
        .attr('r', 5)
        .on('click', nodeClick)
        .style('fill', function (d) {
          return d._children ? 'lightsteelblue' : '#fff';
        })
          .append('text')
        .text(function (d) {
          return d.name;
        });

      // Add node text
      if (treeData.get('isLabelsVisible')){
        if (treeData.get('isLayoutVertical')) {
          nodeEnter.append("text")
            .attr('class', 'nodeVerticalText')
            .attr("y", function (d) {
              if (d === root) {
                return -10;
              } else {
                return 10;
              }
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function (d) {
                return d.name;
            });
        } else {
          nodeEnter.append("text")
            .attr('class', 'nodeHorizontalText')
            .attr("x", function (d) {
              return d.children || d._children ? -10 : 10;
            })
            .attr("dx", ".35em")
            .attr("text-anchor", function (d) {
              return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.name;
            });
        }
    }

      // Transition nodes to their new position
      var nodeUpdate =  node.transition()
        .duration(duration)
        .attr('transform', function (d) {
          if (treeData.get('isLayoutVertical')) {
            return 'translate(' + d.x + ',' + d.y + ')';
          } else {
            return 'translate(' + d.y + ',' + d.x + ')';
          }
        });

      // Exit nodes
      var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function () {
          return "translate(" + source.x + "," + source.y + ")";
        })
        .remove();

      nodeExit.select("circle")
        .attr("r", 1e-6);

      nodeExit.select("text")
        .style("fill-opacity", 1e-6);

      // LINKS
      // Enter any new links at the parent's previous position
      link.enter().append('path', 'g')
        .attr('class', 'link')
        .attr('d', function () {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

      // Transition links to their new position
      link.transition()
        .duration(duration)
        .attr('d', diagonal);

      // Transition exiting nodes to the parent's new position
      link.exit().transition()
        .duration(duration)
        .attr('d', function () {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

      // Stash the old positions for transition
      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }
  },

  util: {
    collapse: function (d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
        d._children.forEach(app.util.collapse);
      }
    }
  }
};

module.exports = app;
