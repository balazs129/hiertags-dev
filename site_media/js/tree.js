var initialize_uploader = function () {
    'use strict';

    var url = '/visualize/data/';
    var csrftoken = $.cookie('csrftoken');
    $('#fileupload').fileupload({
        add: function (e, data) {
            var errordiv = $('#infobar');
            $("svg#visualization").empty();
            var filetmp = data.originalFiles[0].name.split('.');
            var fext = filetmp[filetmp.length - 1].toLowerCase();
            errordiv.html("");
            switch (fext) {
                case 'txt':
                case 'zip':
                case 'cys':
                case 'xgmml':
                    data.submit();
                    break;
                default :
                    var error = $('<p>').textContent = "Invalid file type!";
                    errordiv.append(error);
            }
        },

        url: url,
        crossDomain: false,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        },
        paramName: 'graph',
        dataType: 'json',
        done: function () {
            $('#progress-circle').css('visibility', 'hidden');
        }
    }).on('fileuploadprogressall',function () {
        $('#progress-circle').css('visibility', 'visible');

    }).on('fileuploaddone', function (e, data) {
        $('#infobar').html("");
        $('#progress-circle').css('visibility', 'hidden');
        var number_of_components = data.result.components;
        if (number_of_components > 1){
            var error = $('<p>').textContent = "Uploaded file contained multiple graphs(" + number_of_components + "), using the first.";
            $('#infobar').append(error);
        }
        generate_tree(convert_data(data.result.data));
    })
        .prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');
};

var convert_data = function (data) {
    "use strict";
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

var generate_tree = function (treeData) {
    "use strict";
//    var margin = {top: 20, right: 10, bottom: 20, left: 0},
//        width = 700 - margin.right - margin.left,
//        height = 480 - margin.top - margin.bottom;

    var width = 700;
    var height = 480;
    var totalNodes = 0;
    var maxLabelLength = 0;

    var i = 0,
        duration = 750,
        root;

    var tree = d3.layout.tree()
        .size([width, height])
        .separation(function (a, b) {
            var width = a.name.length + b.name.length;
            var distance = width + 10; // horizontal distance between nodes = 16
            return distance;
        });

    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.x, d.y];
        });

//    function visit(parent, visitFn, childrenFn) {
//        if (!parent) return;
//
//        visitFn(parent);
//
//        var children = childrenFn(parent);
//        if (children) {
//            var count = children.length;
//            for (var i = 0; i < count; i++) {
//                visit(children[i], visitFn, childrenFn);
//            }
//        }
//    }
//
//    // Call visit function to establish maxLabelLength
//    visit(treeData, function(d) {
//        totalNodes++;
//        maxLabelLength = Math.max(d.name.length, maxLabelLength);
//
//    }, function(d) {
//        return d.children && d.children.length > 0 ? d.children : null;
//    });

   var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

   var svg = d3.select("svg#visualization")
//        .attr("width", width + margin.right + margin.left)
        .attr("width", width)
//        .attr("height", height + margin.top + margin.bottom)
        .attr("height", height)
        .attr("class", "overlay")
        .call(zoomListener);
//        .append("svg:g")
//            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

   function redraw() {
      svg_group.attr("transform",
          "translate(" + d3.event.translate + ")"
          + " scale(" + d3.event.scale + ")");
      node.attr("font-size", (nodeFontSize / d3.event.scale) + "px");
   }

   var svg_group = svg.append("svg:g");

   function zoom() {
       svg_group.attr("transform",
           "translate(" + d3.event.translate + ")"
           + " scale(" + d3.event.scale + ")");
   }

    root = treeData[0];
    root.x0 = width / 2;
    root.y0 = height / 4;
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    root.children.forEach(collapse);
    update(root);
    centerNode(root);
    //});

//    d3.select(self.frameElement).style("height", "800px");

// UPDATE FUNCTION
    function update(source) {

        var levelWidth = [1];
        var level_label_width = [1];
        var newHeight = height;

        var childCount = function(level, n) {
            function get_numbers(d){
                var tmp = 0;
                var index;
                for (index = 0; index < d.length; ++index) {
                     tmp += d[index].name.length;
                }
                return tmp;
            }
            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);
                if (level_label_width.length <= level + 1) level_label_width.push(0);

                levelWidth[level + 1] += n.children.length;
              level_label_width[level + 1] += get_numbers(n.children)
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };

        childCount(0, root);
        newHeight = levelWidth.length * 25;
        var newWidth = d3.max(levelWidth) * 100; // 25 pixels per line
//        console.log('Height:' + newHeight + ' Width:' + newWidth);
        console.log(level_label_width);
        tree = tree.size([newWidth, newHeight])
            .separation(function (a, b) {
            var width = a.name.length + b.name.length;
            var distance = width + 5; // horizontal distance between nodes = 16
            return distance;
        });


        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            d.y = d.depth * 140;
        });


        // Update the nodes…
        var node = svg_group.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.x0 + "," + source.y0 + ")";
            })
            .on("click", click)
            .on("mouseenter", magnify)
            .on("mouseleave", reset_orig)
            .on("contextmenu", delete_node);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
//            .attr("y", function(d) { return d.children || d._children ? -10 : 10; })
            .attr("y", function (d) {
                if (d === treeData[0]) {
                    return -10;
                }
                else {
                    return 10;
                }
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            //        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            .text(function (d) {
                return d.name;
            })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        nodeUpdate.select("circle")
            .attr("r", 5)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.x + "," + source.y + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg_group.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
            d.children.forEach(collapse);
        }
        return d;
    }

    // Toggle children on click.
    function click(d) {
        if (d3.event.defaltPrevented) return;
        d = toggleChildren(d);
//        if (d.children) {
//            d._children = d.children;
//            d.children = null;
//        } else {
//            d.children = d._children;
//            d._children = null;
//            d.children.forEach(collapse);
//        }
        update(d);
        centerNode(d);
    }

    function delete_node(d) {
        if (d.parent && d.parent.children){
        console.log('removing ' + d.name);
        var nodeToDelete = _.where(d.parent.children, {name: d.name});
        if (nodeToDelete){
            d.parent.children = _.without(d.parent.children, nodeToDelete[0]);
        }
        d3.event.preventDefault();
        update(d);
        }
    }

    function magnify(d) {
        var nodeSelection = d3.select(this);
        nodeSelection.select("circle")
            .attr("r", function (d) {
                return 15;
            });
        nodeSelection.select("text")
            .style({'font-size': '20px'})
            .attr("dy", function (d) {
                return "1em";
            });
//        nodeSelection.select("text").style({opacity:'1.0'});
        d3.event.preventDefault();
    };

    function reset_orig(d) {
        var nodeSelection = d3.select(this);
        nodeSelection.select("circle").attr("r", function (d) {
            return 5;
        });
        nodeSelection.select("text")
            .style({'font-size': '10px'})
            .attr("dy", function (d) {
                return ".35em";
            });
//        nodeSelection.select("text").style({opacity:'0.6'});
    };

    function centerNode(source) {
        var scale = zoomListener.scale();
        var x = -source.x0;
        var y = -source.y0;
        x = x * scale + width / 2;
//        y = y * scale + height / 2;
        y = y * scale + height / 4;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

};

$(function () {
    $.ajaxSetup({
        error: function (x) {
            if (x.status === 500) {
                var error = $('<p>').textContent = 'Error! Graph Contains a Cycle.';
                $('#infobar').append(error);
            }
        }
    });
    initialize_uploader();
});

