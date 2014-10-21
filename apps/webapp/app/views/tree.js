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

    function nodeClick(d) {
      if (typeof d.children !== "undefined" || typeof d._children !== "undefined") {
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

    // Build the arrow
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 0)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5");

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
            function (memo, num) {
              return memo + num.length;
            }, 0);

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
      treeData.get('interlinks').forEach(function (interLink) {
        sourceNode = _.find(nodes, function (n) {
          return n.name === interLink[0];
        });
        targetNode = _.find(nodes, function (n) {
          return n.name === interLink[1];
        });
        if (sourceNode && targetNode) {
          links.push(new InterLink(sourceNode, targetNode));
        }
      });

      // Join data with nodes and edges
      // Update the nodes
      var node = svgGroup.selectAll('g.node')
        .data(nodes, function (d) {
          return d.id || (d.id = ++i);
        });

      // Id the links
      links.forEach(function (d) {
        if (d.hasOwnProperty('added')) {
          d.id = d.source.id + d.target.id + parseInt(treeData.get('numNodes'));
        } else {
          d.id = d.target.id;
        }
      });

      // Update the edges
      var link = svgGroup.selectAll('path.link')
        .data(links, function (d) {
          return d.id;
        });

      // ENTER
      // Enter any new nodes at the parent's previous position
      var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', function () {
          if (treeData.get('isLayoutVertical')) {
            return 'translate(' + source.x0 + ',' + source.y0 + ')';
          } else {
            return 'translate(' + source.y0 + ',' + source.x0 + ')';
          }
        })
        .on('click', nodeClick)
        .on('mouseover', app.util.magnifyNode)
        .on('mouseout', app.util.resetMagnifiedNode);

      // Add node circles
      nodeEnter.append('circle')
        .attr('class', 'nodeCircle')
        .attr('r', 6)
        .style('fill', function (d) {
          return d._children ? 'lightsteelblue' : '#fff';
        });



      // Add node text
      if (treeData.get('isLabelsVisible')) {
        if (treeData.get('isLayoutVertical')) {
          nodeEnter.append('text')
//            .attr('class', 'nodeVerticalText')
            .attr('y', function (d) {
              if (d === root) {
                return -10;
              } else {
                return 10;
              }
            })
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .text(function (d) {
              return d.name;
            });
        } else {
          nodeEnter.append('text')
//            .attr('class', 'nodeHorizontalText')
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

      // Enter any new links at the parent's previous position
      link.enter().append('path', 'g')
        .attr('class', 'link')
        .attr('d', function () {
          var o = {x: source.x0, y: source.y0 };
          return diagonal({source: o, target: o});
        })
        .attr("marker-end", "url(#end)");

      // UPDATE
      // Transition nodes to their new position
      var nodeUpdate = node.transition()
        .duration(duration)
        .attr('transform', function (d) {
          if (treeData.get('isLayoutVertical')) {
            return 'translate(' + d.x + ',' + d.y + ')';
          } else {
            return 'translate(' + d.y + ',' + d.x + ')';
          }
        });

      nodeUpdate.select('circle')
        .attr('r', 6)
        .style('fill', function (d) {
          return d._children ? "lightsteelblue" : "#fff";
        });

      if (treeData.get('isLabelsVisible')) {
        if (treeData.get('isLayoutVertical')) {
          nodeUpdate.select('text')
            .attr('x', 0)
            .attr('y', function (d) {
              if (d === root) {
                return -14;
              } else {
                return 14;
              }
            })
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle');
        } else {
          nodeUpdate.select('text')
            .attr('y', 0)
            .attr('x', function (d) {
              return d.children || d._children ? -20 : 10;
            })
            .attr('dx', '.35em')
            .attr("text-anchor", function (d) {
              return d.children || d._children ? 'end' : 'start';
            });
        }
      }

      // Transition links to their new position
      link.transition()
        .duration(duration)
        .attr('d', diagonal);

      // EXIT
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

    //Button Functions
    d3.select('#btn-expand-tree').on('click', function () {
      var oldWidth = treeData.get('extraWidth');
      console.log(oldWidth);
      var newWidth = oldWidth + 50;
      treeData.set({extraWidth: newWidth});
      update(root);
    });

    d3.select('#btn-shrink-tree').on('click', function () {
      var oldWidth = treeData.get('extraWidth');
      console.log(oldWidth);
      var newWidth = oldWidth > 50 ? oldWidth - 50 : 0;
      treeData.set({extraWidth: newWidth});
      update(root);
    });

    d3.select('#btn-center-root').on('click', function () {
      zoomListener.scale(1).translate([0, 0]);
      centerNode(root);
    });
  },

  util: {
    collapse: function (d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
        d._children.forEach(app.util.collapse);
      }
    },

    magnifyNode: function (d) {
      var nodeSelection = d3.select(this),
          duration = 600;

      nodeSelection.select('circle')
        .transition(duration)
        .attr("r", function () {
          return 15;
        });

      nodeSelection.select('text')
        .transition(duration)
        .style('font-size', '20px')
        .attr("dy", function () {
          return "1em";
        })
        .text(function (d) {
            return d.name;
        });

//      nodeSelection.select(".ghostCircle")
//        .attr("r", function () {
//          return 20;
//        });
    },

    resetMagnifiedNode: function (d) {
      var nodeSelection = d3.select(this),
        duration = 600;
      nodeSelection.select("circle")
        .transition(duration)
        .attr("r", function () {
        return 6;
      });

      nodeSelection.select("text")
        .transition(duration)
        .style({'font-size': "10px"})
        .attr("dy", function () {
          return ".35em";
        })
        .text(function (d) {
            return d.name;
        });

//      nodeSelection.select(".ghostCircle")
//        .attr("r", function () {
//          return 6;
//        });
    }
  }
};

module.exports = app;
