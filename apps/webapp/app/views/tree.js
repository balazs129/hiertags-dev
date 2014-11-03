var _ = require('underscore'),
  utils = require('util/graph-utils'),
  d3 = require('d3');


var app = {
  generateTree: function (treeData) {
    'use strict';

    // Set up the canvas
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
      $visualizationArea = $('#visualization'),
      width = $visualizationArea.width() - margin.right - margin.left,
      height = $visualizationArea.height() - margin.top - margin.bottom;

    var tree = d3.layout.tree().size([width, height]);


    // Diagonal projection for the node paths
    var diagonal = d3.svg.diagonal()
      // At default, edges start/end at the nodes center, we need to move endpoints to the circle
      // edges
      .source(function (d) {
        return {'x': d.source.x, 'y': d.source.y + 6};
      })
      .target(function (d) {
        return {'x': d.target.x, 'y': d.target.y - 10};
      })
      .projection(function (d) {
        if (treeData.get('isLayoutVertical')) {
          return [d.x, d.y];
        } else {
          return [d.y, d.x];
        }
      });

    // Listen for zoom/pan events on the svg canvas
    var zoomListener = d3.behavior.zoom()
      .scaleExtent([0.2, 2])
      .on('zoom', function zoom() {
        svgGroup.attr('transform',
            'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');
      });

    var div = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    var svg = d3.select('#visualization')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overlay')
      .call(zoomListener);

    var svgGroup = svg.append('g');

    var duration = 750,
      root = treeData.get('dag')[0],
      i = 0,
      $depthField = $('#depth-input'),
      $depthText = $('#depth-number'),
      isRMB = false,
      dragData = {
        runInitializer: false,
        selectedNode: null,
        draggingNode: null,
        dragStarted: false
      };

    // Set initial edgelist
    treeData.set({'edgeList': app.getEdgeList(root)});

    // Global listener for the right-click. We need to suppress drag while right clicking.
    $(document).bind('contextmenu', function () {
      isRMB = true;
    });

    // Build the arrow
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 2)
      .attr('refY', 0)
      .attr('markerWidth', 4)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#333')
      .attr('d', 'M0,-5L10,0L0,5');
    // Enering nodes require these attributes to present
    root.x0 = width / 2;
    root.y0 = height / 4;


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
        .attr('transform', 'translate(' + x + ',' + y + ')scale(' + scale + ')');
      zoomListener.scale(scale);
      zoomListener.translate([x, y]);
    }

    function nodeClick(d) {
      if (d3.event.defaultPrevented) {
        return;
      } // click suppressed

      isRMB = false;
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if (d._children) {
        d.children = d._children;
        d._children = null;
      }

      update(d);
      centerNode(d);
    }

    function expandAllChildren(d) {
      d3.event.preventDefault();

      function expand(d) {
        if (d._children) {
          d.children = d._children;
          d.children.forEach(expand);
          d._children = null;
        }
      }

      function expand_norec(d) {
        if (d._children) {
          d.children = d._children;
          d._children = null;
        }
      }

      if (treeData.get('numNodes') < 100) {
        if (d._children) {
          d.children = d._children;
          d.children.forEach(expand);
          d._children = null;
        }
      } else {
        if (d._children) {
          d.children = d._children;
          d.children.forEach(expand_norec);
          d._children = null;
        }
      }

      update(d);
      centerNode(d);

      isRMB = false;
      return false;
    }


    function initiateDrag(d, domNode) {
      var draggedId = d.id,
        draggedNode = d3.select(domNode);

      draggedNode.attr('pointer-events', 'none');

      // If node has children, remove the links and nodes
      if (dragData.nodes.length > 1) {
        // Remove link paths
        var links = tree.links(dragData.nodes);
        svgGroup.selectAll('path.link')
          .data(links, function (d) {
            return d.target.id;
          })
          .remove();
        // Remve child nodes
        svgGroup.selectAll('g.node')
          .data(dragData.nodes, function (d) {
            return d.id;
          })
          .filter(function (d) {
            return d.id !== draggedId;
          })
          .remove();
      }
    }

    var dragListener = d3.behavior.drag()
      .origin(function (d) {
        return d;
      })
      .on('dragstart', function (d) {
        if (d !== root) {

          d3.event.sourceEvent.stopPropagation();

          dragData.nodes = tree.nodes(d);
          dragData.runInitializer = true;
        }
      })
      .on('drag', function (d) {
        if (d !== root && !isRMB) {
          console.log('dragging');
          var draggedNode = d3.select(this),
            _this = this;

          // Execute this block only once
          if (dragData.runInitializer) {
            dragData.dragStarted = true;
            initiateDrag(d, _this);
            if (d.children) {
              app.util.collapse(d);
            }
            dragData.runInitializer = false;
          }

          if (treeData.get('isLayoutVertical')) {
            d.x0 += d3.event.dx;
            d.y0 += d3.event.dy;
            draggedNode.attr('transform', 'translate(' + d.x0 + ',' + d.y0 + ')');
          } else {
            d.x0 += d3.event.dy;
            d.y0 += d3.event.dx;
            draggedNode.attr('transform', 'translate(' + d.y0 + ',' + d.x0 + ')');
          }
        }
      })
      .on('dragend', function (d) {
        if (d !== root && dragData.dragStarted) {
          var draggingNode = d3.select(this).datum(),
            isOwnChildren = _.contains(draggingNode.children, dragData.selectedNode),
            isSame = draggingNode.selectedNode === draggingNode;


          if (dragData.selectedNode && !isOwnChildren && !isSame) {
            console.log(draggingNode, dragData.selectedNode);
            var selectedNodeChildren = dragData.selectedNode.children,
              selectedNode_Children = dragData.selectedNode._children;

            // We have a valid drag, remove element from the parent and insert it
            // into the new elements children

            // Remove
            draggingNode.parent.children = _.without(draggingNode.parent.children, draggingNode);

            // Insert
            if (selectedNodeChildren) {
              // Target has children
              selectedNodeChildren.push(draggingNode);
            } else if (selectedNode_Children) {
              // Target has children, but collapsed
              selectedNode_Children.push(draggingNode);
            } else {
              // Leaf node
              dragData.selectedNode._children = [draggingNode];
            }

            // Update depth for dragged nodes
            var newDepth = dragData.selectedNode.depth + 1,
              updatedDepth;

            if (draggingNode._children) {
              draggingNode.depth = newDepth;

              var visitor = function (node) {
                if (node._children) {
                  node.depth = node.parent.depth + 1;
                  node._children.forEach(visitor);
                } else {
                  node.depth = node.parent.depth + 1;
                }
              };
              draggingNode._children.forEach(visitor);
            } else {
              draggingNode.depth = newDepth;
            }

            // Update depth
            updatedDepth = utils.getDepth(root);
            treeData.set({depth: updatedDepth});
            $depthText.text(updatedDepth);
            // Set new max for the depth field
            if (parseInt($depthField.val()) > updatedDepth) {
              $depthField.val(updatedDepth);
            }
            $depthField.attr('max', updatedDepth);

            // Update edgelist
            treeData.set({'edgeList': app.getEdgeList(root)});
          }
          d3.select(this).attr('pointer-events', 'all');

          update(root);
        }
        dragData.dragStarted = false;
      });

    function update(source) {
      var levelWidth = [1],
        levelLabelWidth = [1],
        childSum,
        newHeight,
        tmpWidth,
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

      childCount(0, root);
      childSum = _.reduce(levelWidth, function (memo, num) {
        return memo + num;
      }, 0);

      // Set the new widths and heights
      // Vertical Layout
      if (treeData.get('isLayoutVertical')) {
        newHeight = (levelWidth.length - 1) * 90;

        if (treeData.get('isLabelsVisible')) {
          tmpWidth = _.map(levelWidth, function (num, index) {
            return num * 24 + levelLabelWidth[index] * 10;
          });

          newWidth = _.max(tmpWidth) + treeData.get('extraWidth');
        } else {
          newWidth = childSum * 25;
        }
        // Horizontal Layout
      } else {
        newHeight = (levelWidth.length - 1) * (90 * treeData.get('horizontalRatio'));
        if (treeData.get('isLabelsVisible')) {
          tmpWidth = _.map(levelWidth, function (num, index) {
            return num * 24 + levelLabelWidth[index] * 10;
          });
          newWidth = _.max(tmpWidth) * treeData.get('horizontalRatio');
        } else {
          newWidth = _.max(levelWidth) * (17 * treeData.get('horizontalRatio'));
        }
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
        .call(dragListener)
        .attr('class', 'node')
        .attr('transform', function () {
          if (treeData.get('isLayoutVertical')) {
            return 'translate(' + source.x0 + ',' + source.y0 + ')';
          } else {
            return 'translate(' + source.y0 + ',' + source.x0 + ')';
          }
        })
        .on('click', nodeClick)
        .on('mouseover', function (d) {
          var nodeSelection = d3.select(this);
          dragData.selectedNode = d;
          if (dragData.dragStarted) {
            nodeSelection.select('circle').classed('dragCircle', true);
          }
          app.util.magnifyNode(d, nodeSelection);
        })
        .on('mouseout', function (d) {
          var nodeSelection = d3.select(this);
          dragData.selectedNode = null;
          nodeSelection.select('circle').classed('dragCircle', false);
          app.util.resetMagnifiedNode(d, nodeSelection);
        })
        .on('contextmenu', expandAllChildren);

      // Add node circles
      nodeEnter.append('circle')
        .attr('class', 'nodeCircle')
        .attr('r', 0)
        .style('fill', function (d) {
          return d._children ? 'lightsteelblue' : '#fff';
        });

      // Add node text
      if (treeData.get('isLayoutVertical')) {
        nodeEnter.append('text')
          .attr('class', 'nodeText')
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
            if (treeData.get('isLabelsVisible')) {
              return d.name;
            } else {
              return '';
            }
          });
      } else {
        nodeEnter.append('text')
          .attr('class', 'nodeText')
          .attr('x', function (d) {
            return d.children || d._children ? -10 : 10;
          })
          .attr('dx', '.35em')
          .attr('text-anchor', function (d) {
            return d.children || d._children ? 'end' : 'start';
          })
          .text(function (d) {
            if (treeData.get('isLabelsVisible')) {
              return d.name;
            } else {
              return '';
            }
          });
      }

      // Enter any new links at the parent's previous position
      link.enter().insert('path', 'g')
        .attr('class', 'link')
        .classed('addedLink', function (d) {
          return d.hasOwnProperty('added');
        })
        .attr('d', function () {
          var o = {x: source.x0, y: source.y0 };
          return diagonal({source: o, target: o});
        })
        .attr('marker-end', 'url(#arrow)')
        .style('stroke-dasharray', function (d) {
          if (d.hasOwnProperty('added')) {
            return '5, 2';
          } else {
            return '1, 0';
          }
        })
        .on('mouseover', function (d) {
          d3.select(this).classed('selectedLink', true);
          var divWidth = _.max([d.source.name.length, d.target.name.length]);
          div.transition()
            .duration(200)
            .style('opacity', 0.9);
          div.html('<div><strong>Source: </strong><span style="color:white">' + d.source.name + '</span></div>' +
            '<div><strong>Destination: </strong><span style = "color:white" > ' + d.target.name + '</span></div>')
            .style('width', divWidth)
            .style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY - 40) + 'px');
        })
        .on('mouseout', function () {
          d3.select(this).classed('selectedLink', false);
          div.transition()
            .duration(500)
            .style('opacity', 0);
        });

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

      node.select('circle.nodeCircle')
        .attr('r', 6)
        .style('fill', function (d) {
          return d._children ? 'lightsteelblue' : '#fff';
        });

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
          .attr('text-anchor', function (d) {
            return d.children || d._children ? 'end' : 'start';
          });
      }

      // Transition links to their new position
      link.transition()
        .duration(duration)
        .attr('d', diagonal);

      // EXIT
      // Exit nodes
      var nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', function () {
          return 'translate(' + source.x + ',' + source.y + ')';
        })
        .remove();

      nodeExit.select('circle')
        .attr('r', 0);

      nodeExit.select('text')
        .style('fill-opacity', 0);

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

    root.children.forEach(app.util.collapse);
    update(root);
    centerNode(root);

    // Button Functions
    d3.select('#btn-expand-tree').on('click', function () {
      var oldWidth,
        newWidth;

      if (treeData.get('isLayoutVertical')) {
        oldWidth = treeData.get('extraWidth');
        newWidth = oldWidth + 50;
        treeData.set({extraWidth: newWidth});
      } else {
        oldWidth = treeData.get('horizontalRatio');
        newWidth = oldWidth + 0.2;
        treeData.set({horizontalRatio: newWidth});
      }
      update(root);
    });

    d3.select('#btn-shrink-tree').on('click', function () {
      var oldWidth,
        newWidth;

      if (treeData.get('isLayoutVertical')) {
        oldWidth = treeData.get('extraWidth');
        newWidth = oldWidth > 50 ? oldWidth - 50 : 0;
        treeData.set({extraWidth: newWidth});
      } else {
        oldWidth = treeData.get('horizontalRatio');
        newWidth = oldWidth > 0.2 ? oldWidth - 0.2 : 0.2;
        treeData.set({horizontalRatio: newWidth});
      }
      update(root);
    });

    d3.select('#btn-center-root').on('click', function () {
      zoomListener.scale(1).translate([0, 0]);
      centerNode(root);
    });

    d3.select('#btn-toggle-label').on('click', function () {
      var labels = !treeData.get('isLabelsVisible');
      treeData.set({isLabelsVisible: labels});

      var nodeSelection = d3.selectAll('g.node');
      nodeSelection.select('text')
        .text(function (d) {
          if (labels) {
            return d.name;
          } else {
            return '';
          }
        });
      update(root);
    });

    d3.select('#btn-flip-layout').on('click', function () {
      var layout = !treeData.get('isLayoutVertical');
      treeData.set({isLayoutVertical: layout});
      update(root);
      centerNode(root);
    });

    d3.select('#btn-tag-search').on('click', function () {
      var $tag = $('#tag-search'),
        tag = $tag.val(),
        path = [],
        parents = [],
        nodes,
        links,
        found = null;

      // Search among the opened nodes(check if root is fully collapsed)
      if (tag === root.name) {
        centerNode(root);
      } else if (root.children) {
        var visitor = function (node) {
          if (node.children) {
            node.children.forEach(visitor);
          }
          if (node.name === tag) {
            found = node;
          }
        };
        root.children.forEach(visitor);
      } else {
        app.util.toggleNode(root);
        update(root);
      }


      // If not found among the opened nodes, search in the collapsed nodes
      if (!found) {
        var hiddenVisitor = function (node) {
          if (node.children) {
            node.children.forEach(hiddenVisitor);
          }
          else if (node._children) {
            node._children.forEach(hiddenVisitor);
          }
          if (node.name === tag) {
            found = node;
            var unpack = function (h_node) {
              if (h_node.parent !== 'null' && h_node._children) {
                path.push(h_node);
                unpack(h_node.parent);
              }
            };
            unpack(node.parent);
          }
        };
        root.children.forEach(hiddenVisitor);
      }

      if (found) {
        if (path.length > 0) {
          path.reverse();
          path.forEach(app.util.toggleNode);
          update(root);
        }
        centerNode(found);
        treeData.set({lastSearched: tag});

        // Get the parents of the found node
        var getParent = function (node) {
          if (node.parent !== 'null') {
            parents.push(node.name);
            getParent(node.parent);
          } else {
            parents.push(node.name);
          }
        };
        getParent(found);

        nodes = svgGroup.selectAll('g.node');
        links = svgGroup.selectAll('path.link');

        // Clear old result
        svgGroup.select('.foundCircle')
          .classed('foundCircle', false);

        svgGroup.selectAll('.foundLink')
          .classed('foundLink', false);

        // Set new result
        nodes.filter(function (d) {
          return d.name === found.name;
        })
          .select('circle')
          .classed('foundCircle', true);

        links.filter(function (d) {
          return _.contains(parents, d.source.name) && _.contains(parents, d.target.name);
        })
          .classed('foundLink', true);
      }

      $tag.val('');
    });

    d3.select('#btn-expand-graph').on('click', function () {
      var $depth = $('#depth-input'),
        graphDepth = treeData.get('depth'),
        depth = $depth.val();

      // Validate input
      if (depth < 1) {
        $depth.val('1');
        depth = 1;
      } else if (depth > graphDepth) {
        $depth.val(graphDepth);
        depth = graphDepth;
      }

      function expandTree() {
        root.children.forEach(app.util.collapse);

        function expand(d) {
          if (d.depth < depth) {
            if (d._children) {
              d.children = d._children;
              d.children.forEach(expand);
              d._children = null;
            } else {
              if (d._children) {
                d.children = d._children;
                d.children.forEach(expand);
                d._children = null;
              }
            }
          }
        }

        root.children.forEach(expand);
        update(root);
        centerNode(root);
      }

      if (root.children) {
        expandTree();
      } else {
        root.children = root._children;
        root._children = null;
        expandTree();
      }
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

    toggleNode: function (d) {
      if (typeof d.children !== 'undefined' || typeof d._children !== 'undefined') {
        if (d.children) {
          d._children = d.children;
          d.children = null;
          d._children.forEach(app.util.collapse);
        } else {
          d.children = d._children;
          d._children = null;
          d.children.forEach(app.util.collapse);
        }
      }
      return d;
    },

    magnifyNode: function (d, nodeSelection) {
      var duration = 600;

      nodeSelection.select('circle')
        .transition(duration)
        .attr('r', function () {
          return 15;
        });

      nodeSelection.select('text')
        .transition(duration)
        .style('font-size', '14px')
        .attr('dy', function () {
          return '1em';
        })
        .text(function (d) {
          return d.name;
        });
    },

    resetMagnifiedNode: function (d, nodeSelection) {
      var duration = 600;

      nodeSelection.select('circle')
        .transition(duration)
        .attr('r', function () {
          return 6;
        });

      nodeSelection.select('text')
        .transition(duration)
        .style({'font-size': '10px'})
        .attr('dy', function () {
          return '.35em';
        })
        .text(function (d) {
          return d.name;
        });
    }
  },

  getEdgeList: function (root) {
    var result = [];

    function log(d) {
      if (d.children) {
        result.push([d.parent.name, d.name]);
        d.children.forEach(log);
      } else if (d._children) {
        result.push([d.parent.name, d.name]);
        d._children.forEach(log);
      } else {
        result.push([d.parent.name, d.name]);
      }

    }

    root.children.forEach(log);
    return JSON.stringify(result);
  }
};

module.exports = app;
