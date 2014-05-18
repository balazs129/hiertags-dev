var globalData = {
    treeWidth: 0,
    treeHorizontalRatio: 0,
    nodes: [],
    labelVisibility: true,
    verticalLayout: true,
    toggled: false,
    graphDepth: 0,
    graphData: [],
    numberOfComponents: 0,
    graphIndex: 0,
    graphDepths: [],
    extraEdges: [],
};

var initialize_uploader = function () {
    'use strict';

    var url = '/visualize/data/';
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
                case 'xml':
                    data.submit();
                    break;
                default :
                    var error = $('<p>').textContent = "Invalid file type!";
                    errordiv.append(error);
            }
        },

        url: url,
        crossDomain: false,
        paramName: 'graph',
        dataType: 'json',
        done: function () {
            $('#progress-circle').css('visibility', 'hidden');
        }
    }).on('fileuploadprogressall',function () {
        $('#progress-circle').css('visibility', 'visible');

    }).on('fileuploaddone', function (e, data) {
        $('#infobar').html("");
        $('#rightbar').html("");
        $('#rightbar2').html("");
        $('#progress-circle').css('visibility', 'hidden');
        globalData.numberOfComponents = data.result.data.length;
        globalData.extraEdges = data.result.edges;

        if (globalData.numberOfComponents > 1) {
            var error = $('<p>').textContent = "Uploaded file contained multiple graphs(" + globalData.numberOfComponents + "), using the first.";
            $('#infobar').append(error);
        }
        $('#visualization').css('border', '1px solid #e0e0e0');

        // Reset Global variables
        globalData.treeWidth = 0;
        globalData.treeHorizontalRatio = 0;

        globalData.graphData = [];
        globalData.graphDepths = [];
        globalData.nodes = [];
        globalData.graphIndex = 0;

        globalData.treeWidth = 0;
        globalData.treeHorizontalRatio = 0;
        globalData.labelVisibility = true;
        globalData.verticalLayout = true;
        globalData.toggled = false;
        globalData.graphDepth = 0;

        //Calculate data for graphs
        for (var elem = 0; elem < globalData.numberOfComponents; elem += 1) {
            globalData.graphData.push(convert_data(data.result.data[elem]));
            globalData.graphDepths.push(get_depth(globalData.graphData[elem]));
            globalData.nodes.push(data.result.data[elem].length);
        }
        generate_tree(globalData.graphData[0]);

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

        var width = 700;
        var height = 480;

        var i = 0,
            duration = 750,
            root;

        var tree = d3.layout.tree()
            .size([width, height])
            .separation(function (a, b) {
                return a.name.length + b.name.length + 5;
            });

        var diagonal = d3.svg.diagonal()
            .projection(function (d) {
                if (globalData.verticalLayout) {
                    return [d.x, d.y];
                } else {
                    return [d.y, d.x];
                }
            });

        var zoomListener = d3.behavior.zoom().scaleExtent([0.5, 2]).on("zoom", zoom);

        var svg = d3.select("svg#visualization")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "overlay")
            .call(zoomListener);


        var svg_group = svg.append("svg:g");

        function zoom() {
            svg_group.attr("transform",
                "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        }

        svg.append("defs").selectAll("marker")
            .data(["normal", "added"])
            .enter().append("marker")
            .attr("id", function (d) {
                return d;
            })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 17)
            .attr("refY", 0)
            .attr("markerWidth", 7)
            .attr("markerHeight", 7)
            .attr("fill", "#555")
            .attr("orient", "auto")
            .append("path")
                .attr("d", "M0,-5L10,0L0,5");

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

        function expand_all_children(d) {
            d3.event.preventDefault();

            if (globalData.nodes[globalData.graphIndex] < 100) {
                if (d._children) {
                    d.children = d._children;
                    d.children.forEach(expand);
                    d._children = null;
                    update(d);
                    centerNode(d);
                }
            } else {
                if (d._children) {
                    d.children = d._children;
                    d.children.forEach(expand_norec);
                    d._children = null;
                    update(d);
                    centerNode(d);
                }
            }
        }

        root.children.forEach(collapse);
        update(root);
        centerNode(root);

        var t_data = $('<p>').textContent = "    Number of nodes: " + globalData.nodes[globalData.graphIndex] +
            "   Depth of graph: " + globalData.graphDepths[globalData.graphIndex];

        var g_data = $("<p>").textContent = " Graph: " + (globalData.graphIndex + 1) +
            "/" + globalData.numberOfComponents;

        $('#rightbar')
            .tooltip()
            .append('<input id="expandtree" type="button" value="Expand tree" title="Increase the space between nodes">')
            .append('<input id="shrinktree" type="button" value="Shrink tree" title="Decrease the space between nodes">')
            .append('<input id="center" type="button" value="Center root" title="Reset view to the root element">')
            .append('<input id="toggleLabels" type="button" value="Toggle Labels" title="Show/hide node labels">')
            .append('<input id="toggleLayout" type="button" value="Flip Layout" title="Change between horizontal and vertical tree layout">')
            .append('<input id="exportPDF" type="button" value="Save as...">');
        if (globalData.numberOfComponents > 1) {
            $('#rightbar2')
                .append(t_data)
                .tooltip()
                .append('<input id="depthExp" type="spinner" value="1" title="Set how deep the graph should be expanded">')
                .append('<input id="expandSpin" type="button" value="Expand" title="Expand the graph to the selected depth">')
                .append('<input id="changeGraphDown" type="button" value="Previous" title="Select the previous graph">')
                .append('<input id="changeGraphUp" type="button" value="Next" title="Select the next graph">')
                .append(g_data);
        } else {
            $('#rightbar2')
                .append(t_data)
                .append('<input id="depthExp" type="spinner" value="1" title="Set how deep the graph should be expanded">')
                .append('<input id="expandSpin" type="button" value="Expand" title="Expand the graph to the selected depth">');
        }

        $("#rightbar").tooltip({show: {delay: 1000}});
        $("#rightbar2").tooltip({show: {delay: 1000}});


        $("#depthExp").spinner({ max: globalData.graphDepths[globalData.graphIndex],
            min: 1,
            step: 1 }).width(20);

        d3.select("#changeGraphUp").on("click", chgGraph);
        function chgGraph() {
            if (globalData.graphIndex < (globalData.numberOfComponents - 1)) {
                globalData.graphIndex += 1;
                $('#infobar').html("");
                $('#rightbar').html("");
                $('#rightbar2').html("");
                $("#visualization").empty();
                globalData.graphDepth = 0;
                globalData.treeWidth = 0;
                globalData.treeHorizontalRatio = 0;
                globalData.labelVisibility = true;

                var graph_copy = owl.deepCopy(globalData.graphData[globalData.graphIndex]);
                generate_tree(graph_copy);
            }
        }

        d3.select("#changeGraphDown").on("click", chdGraph);
        function chdGraph() {
            if (globalData.graphIndex > 0) {
                globalData.graphIndex -= 1;
                $('#infobar').html("");
                $('#rightbar').html("");
                $('#rightbar2').html("");
                $("#visualization").empty();
                globalData.graphDepth = 0;
                globalData.treeWidth = 0;
                globalData.treeHorizontalRatio = 0;
                globalData.labelVisibility = true;

                var graph_copy = owl.deepCopy(globalData.graphData[globalData.graphIndex]);
                generate_tree(graph_copy);
            }
        }

        d3.select("#expandSpin").on("click", exsClick);
        function exsClick() {
            function expandtree() {
                var level = $("#depthExp").spinner("value");
                root.children.forEach(collapse);
                update(root);
                function expand(d) {
                    if (d.depth < level) {
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
                expandtree();
            } else {
                root.children = root._children;
                root._children = null;
                expandtree();
            }
        }

        d3.select("#expandtree").on("click", exClick);
        function exClick() {
            if (globalData.verticalLayout) {
                globalData.treeWidth += 250;
            } else {
                globalData.treeHorizontalRatio += 50;
            }
            update(root);
        }

        d3.select("#shrinktree").on("click", shClick);
        function shClick() {
            if (globalData.verticalLayout) {
                if (globalData.treeWidth > 400) {
                    globalData.treeWidth -= 400;
                    update(root);
                } else {
                    globalData.treeWidth = 0;
                }
                update(root);
            } else {
                if (globalData.treeHorizontalRatio > 50) {
                    globalData.treeHorizontalRatio -= 50;
                    update(root);
                } else {
                    globalData.treeHorizontalRatio = 0;
                }
                update(root);
            }
        }

        d3.select("#center").on("click", crClick);
        function crClick() {
            zoomListener.scale(1).translate([0, 0]);
            centerNode(root);
        }

        d3.select("#toggleLabels").on("click", tlClick);
        function tlClick() {
            globalData.labelVisibility = !globalData.labelVisibility;
            var nodeSelection = d3.selectAll("g.node");
            nodeSelection.select("text").text(function (d) {
                if (globalData.labelVisibility) {
                    return d.name;
                } else {
                    return '';
                }
            });
            update(root);
            centerNode(root);
        }

        d3.select("#toggleLayout").on("click", toClick);
        function toClick() {
            globalData.verticalLayout = !globalData.verticalLayout;
            globalData.toggled = true;
            update(root);
            centerNode(root);
        }

        function submit_download_form(output_format, callback) {
            var svg_window = document.getElementById("visualization");
            var svg_xml = (new XMLSerializer()).serializeToString(svg_window);

            var form = document.getElementById("svgform");
            form['output_format'].value = output_format;
            form['data'].value = svg_xml;
            form.submit();
            callback();
        }

        d3.select("#exportPDF").on("click", epdfClick);
        function epdfClick() {
            var valid_ext = "PDF,PNG,JPG,SVG";
            var to_show = valid_ext.split(',');
            var select_format = $("<select id=\"extSelector\" name=\"extension\" />");
            for (var val in to_show) {
                $("<option />", {value: val, text: to_show[val]}).appendTo(select_format);
            }

            $("#rightbar").append(select_format);
            $("#exportPDF").attr("disabled", true);
            var save_button = $("<input id=\"saveAction\" type=\"button\" value=\"Save!\" title=\"Save in the selected format\">");
            $("#rightbar").append(save_button);
            d3.select("#saveAction").on("click", saveActionButton);
            function saveActionButton() {
                var selected_format = to_show[$("#extSelector").val()].toLowerCase();
                submit_download_form(selected_format, function () {
                    $("#saveAction").remove();
                    $("#extSelector").remove();
                    $("#exportPDF").attr("disabled", false);
                });

            }
        }


        function update(source) {

            var levelWidth = [1];
            var level_label_width = [1];
            var newHeight = height;

            var childCount = function (level, n) {
                function get_numbers(d) {
                    var tmp = 0;
                    var index;
                    for (index = 0; index < d.length; index += 1) {
                        tmp += d[index].name.length;
                    }
                    return tmp;
                }

                if (n.children && n.children.length > 0) {
                    if (levelWidth.length <= level + 1) {
                        levelWidth.push(0);
                    }
                    if (level_label_width.length <= level + 1) {
                        level_label_width.push(0);
                    }

                    levelWidth[level + 1] += n.children.length;
                    level_label_width[level + 1] += get_numbers(n.children);
                    n.children.forEach(function (d) {
                        childCount(level + 1, d);
                    });
                }
            };

            childCount(0, root);
            var child_sum = _.reduce(levelWidth, function (memo, num) {
                return memo + num;
            }, 0);

            if (globalData.verticalLayout) {
                newHeight = levelWidth.length * 100;
                var newWidth;
                if (globalData.labelVisibility) {
                    var tmp_width = [];
                    for (var counter = 0; counter < levelWidth.length; counter += 1) {
                        tmp_width[counter] = levelWidth[counter] * 4 + level_label_width[counter] * 7;
                    }


                    if (d3.max(tmp_width) < 500) {
                        newWidth = 500 + globalData.treeWidth;
                    } else {
                        newWidth = d3.max(tmp_width) + globalData.treeWidth;
                    }
                } else {
                    newWidth = child_sum * 20;
                }

                globalData.graphWidth = newWidth;
                globalData.graphHeight = newHeight;
                tree = tree.size([newWidth, newHeight])
                    .separation(function (a, b) {
                        if (globalData.labelVisibility) {
                            return a.name.length + b.name.length + 5;
                        } else {
                            return 10;
                        }
                    });
            } else {
                newWidth = levelWidth.length * (100 + child_sum + globalData.treeHorizontalRatio);
                newHeight = levelWidth.length * (child_sum * 3);

                globalData.graphWidth = newWidth;
                globalData.graphHeight = newHeight;
                tree = tree.size([newWidth, newHeight])
                    .separation(function () {
                        return 10;
                    });
            }

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(),
                links = tree.links(nodes);

            var nodeNames = [];
            nodes.forEach(function (d) {
                nodeNames.push(d.name);
            });

            globalData.extraEdges.forEach(function (d) {
                if (_.contains(nodeNames, d[0]) && _.contains(nodeNames, d[1])) {
                    var new_link = {source: _.findWhere(nodes, {name: d[0]}),
                        target: _.findWhere(nodes, {name: d[1]}),
                        added: true
                    };
                    links.push(new_link);
                }
            });

            // Normalize for fixed-depth.
            nodes.forEach(function (d) {
                if (globalData.verticalLayout) {
                    d.y = d.depth * 100;
                } else {
                    d.y = d.depth * (100 + globalData.treeHorizontalRatio);
                }
            });


            // Update the nodes…
            var node = svg_group.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id || (d.id = ++i);
                });

            var tmp_ids = []
            links.forEach(function (d) {
                if (d.hasOwnProperty('added')) {
                    var tmp_id = d.source.id + d.target.id;
                    if (_.contains(tmp_ids, tmp_id)) {
                        d['id'] = tmp_id + parseInt(globalData.nodes)
                    } else {
                        d['id'] = tmp_id
                    }
                    tmp_ids.push(d.id);
                } else {
                    d['id'] = d.target.id;
                    tmp_ids.push(d.id);
                }
            })

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", function (d) {
                    if (globalData.verticalLayout) {
                        return "translate(" + source.x0 + "," + source.y0 + ")";
                    } else {
                        return "translate(" + source.y0 + "," + source.x0 + ")";
                    }
                })
                .on("click", click)
                .on("mouseenter", magnify)
                .on("mouseleave", reset_orig)
                .on("contextmenu", expand_all_children);

            nodeEnter.append("circle")
                .attr("r", 1e-6)
                .style("fill", function (d) {
                    return d._children ? "lightsteelblue" : "#fff";
                })
                .style("stroke", "steelblue")
                .style("stroke-width", "1px");


            if (globalData.verticalLayout) {
                nodeEnter.append("svg:text")
                    .attr("y", function (d) {
                        if (d === treeData[0]) {
                            return -10;
                        } else {
                            return 10;
                        }
                    })
                    .attr("dy", ".35em")
                    .attr("text-anchor", "middle")
                    .text(function (d) {
                        if (globalData.labelVisibility) {
                            return d.name;
                        } else {
                            return '';
                        }
                    })
                    .style("font-size", "10px")
                    .style("font-family", "sans-serif")
                    .style("fill-opacity", 1e-6);
            } else {
                nodeEnter.append("svg:text")
                    .attr("x", function (d) {
                        return d.children || d._children ? -10 : 10;
                    })
                    .attr("dx", ".35em")
                    .attr("text-anchor", function (d) {
                        return d.children || d._children ? "end" : "start";
                    })
                    .text(function (d) {
                        if (globalData.labelVisibility) {
                            return d.name;
                        } else {
                            return '';
                        }
                    })
                    .style("font-size", "10px")
                    .style("font-family", "sans-serif")
                    .style("fill-opacity", 1e-6);
            }

            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function (d) {
                    if (globalData.verticalLayout) {
                        return "translate(" + d.x + "," + d.y + ")";
                    } else {
                        return "translate(" + d.y + "," + d.x + ")";
                    }
                });


            nodeUpdate.select("circle")
                .attr("r", 6)
                .style("fill", function (d) {
                    return d._children ? "lightsteelblue" : "#fff";
                });

            if (globalData.verticalLayout) {
                nodeUpdate.select("text")
                    .attr("x", function () {
                        if (globalData.toggled) {
                            return -5;
                        } else {
                            return 0;
                        }
                    })
                    .attr("y", function (d) {
                        if (d === treeData[0]) {
                            return -12;
                        } else {
                            return 12;
                        }
                    })
                    .attr("dy", ".35em")
                    .attr("text-anchor", "middle")
                    .style("fill-opacity", 1);
            } else {
                nodeUpdate.select("text")
                    .attr("y", 0)
                    .attr("x", function (d) {
                        return d.children || d._children ? -20 : 10;
                    })
                    .attr("dx", ".35em")
                    .attr("text-anchor", function (d) {
                        return d.children || d._children ? "end" : "start";
                    })
                    .style("fill-opacity", 1);
            }


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
                    return d.id;
                });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g")
                .style("fill", "none")
                .style("stroke-width", "1px")
                .attr("class", "link")
                .attr("stroke", function (d) {
                    if (d.hasOwnProperty('added')) {
                        return "#88F";
                    } else {
                        return "#222";
                    }
                })
                .attr("stroke-dasharray", function (d){
                    if (d.hasOwnProperty('added')){
                        return "0,5 1";
                    } else {
                        return "1 0";
                    }
                })
                .attr("d", function (d) {
                    var o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                })
                .attr("marker-end", function(d) {
                    return "url(#" + "normal" + ")";
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
                d._children.forEach(collapse);
            } else {
                d.children = d._children;
                d._children = null;
                d.children.forEach(collapse);
            }
            return d;
        }

// Toggle children on click.
        function click(d) {
            if (d3.event.isDefaultPrevented) {
                return;
            }
            d = toggleChildren(d);
            update(d);
            centerNode(d);
        }

        function magnify() {
            var nodeSelection = d3.select(this);
            nodeSelection.select("circle")
                .attr("r", function () {
                    return 15;
                });
            nodeSelection.select("text")
                .style({'font-size': '20px'})
                .attr("dy", function () {
                    return "1em";
                })
                .text(function (d) {
                    return d.name;
                });
            d3.event.preventDefault();
        }

        function reset_orig() {
            var nodeSelection = d3.select(this);
            nodeSelection.select("circle").attr("r", function () {
                return 6;
            });
            nodeSelection.select("text")
                .style({'font-size': '10px'})
                .attr("dy", function () {
                    return ".35em";
                })
                .text(function (d) {
                    if (globalData.labelVisibility) {
                        return d.name;
                    } else {
                        return '';
                    }
                });
        }

        function centerNode(source) {
            var scale = zoomListener.scale();
            if (globalData.verticalLayout) {
                var x = -source.x0;
                var y = -source.y0;
                x = x * scale + width / 2;
                y = y * scale + height / 4;
            } else {
                var x = -source.y0;
                var y = -source.x0;
                x = x * scale + 100;
                y = y * scale + height / 2;
            }
            d3.select('g').transition()
                .duration(duration)
                .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
            zoomListener.scale(scale);
            zoomListener.translate([x, y]);
        }

    }
    ;

var get_depth = function (treeData) {
    root = treeData[0];
    var levels = {};
    var key;
    var size = 0;
    var tree = d3.layout.tree();
    var nodes = tree.nodes(root).reverse();

    function log(d) {
        if (d.children) {
            levels[d.depth] = true;
            d.children.forEach(log);
        }
        else {
            levels[d.depth] = true;
        }
    }

    root.children.forEach(log);

    for (key in levels) {
        if (levels.hasOwnProperty(key)) {
            size += 1;
        }
    }
    return size;
};

$(function () {

    $.ajaxSetup({
        error: function (x) {
            if (x.status === 500) {
                var error = $('<p>').textContent = 'Internal server error.';
                $('#infobar').append(error);
            }
        }
    });

    initialize_uploader();
});
