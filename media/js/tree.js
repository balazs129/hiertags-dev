/*global $:false, jQuery:false */
/*global d3:false */
/*global _:false */

$.noConflict();
jQuery(function ($) {
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

            get_graph: function () {
                return this.graphData[this.graphIndex];
            },

            get_depth: function () {
                return this.graphDepths[this.graphIndex];
            }

        };

        var initialize_uploader = function () {
            var url = '/visualize/data/';
            $('#fileupload').fileupload({
                add: function (e, data) {
                    var infobar = $('#infobar');
                    $("svg#visualization").empty();
                    var filetmp = data.originalFiles[0].name.split('.');
                    var fext = filetmp[filetmp.length - 1].toLowerCase();
                    infobar.html("");
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
                            infobar.append(error);
                    }
                },

                url: url,
                crossDomain: false,
                paramName: 'graph',
                dataType: 'json',
                done: function () {
                    $('#progress-circle').css('visibility', 'hidden');
                }
            }).on('fileuploadprogressall', function () {
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
            //Variables
            var visWindow = $("#visualization");
            var width = visWindow.width();
            var height = visWindow.height();
            var i = 0;
            var duration = 750;
            var root;

            // variables for dragging
            var selectedNode = null;
            var draggingNode = null;
            var dragStarted = false;
            var nodes;
            var nodePaths;
            var nodesExit;
            var domNode = null;


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

            // Zoom function
            function zoom() {
                svg_group.attr("transform",
                        "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
            }

            var zoomListener = d3.behavior.zoom().scaleExtent([0.2, 2]).on("zoom", zoom);

            var svg = d3.select("svg#visualization")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "overlay")
                .call(zoomListener);

            var svg_group = svg.append("svg:g");

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

            function initiateDrag(d, domNode) {
                draggingNode = d;
                d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
                d3.select(domNode).select('.node').attr('pointer-events', 'none');
                d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
                d3.select(domNode).attr('class', 'node activeDrag');

                svg_group.selectAll("g.node").sort(function (a, b) { // select the parent and sort the path's
                    if (a.id !== draggingNode.id) {
                        return 1;
                    } else {
                        return -1;
                    } // a is the hovered element, bring "a" to the front
                });
                // if nodes has children, remove the links and nodes
                if (nodes.length > 1) {
                    // remove link paths
                    var links = tree.links(nodes);
                    nodePaths = svg_group.selectAll("path.link")
                        .data(links, function (d) {
                            return d.target.id;
                        }).remove();
                    // remove child nodes
                    nodesExit = svg_group.selectAll("g.node")
                        .data(nodes, function (d) {
                            return d.id;
                        }).filter(function (d, i) {
                            if (d.id === draggingNode.id) {
                                return false;
                            }
                            return true;
                        }).remove();
                }
            }

            var dragListener = d3.behavior.drag()
                .on("dragstart", function (d) {
                    if (d == root) {
                        return;
                    }
                    dragStarted = true;
                    nodes = tree.nodes(d);
                    d3.event.sourceEvent.stopPropagation();
                })
                .on("drag", function (d) {
                    if (d === root) {
                        return;
                    }
                    if (dragStarted) {
                        domNode = this;
                        initiateDrag(d, domNode);
                    }

                    var node = d3.select(this)
                    if (globalData.verticalLayout) {
                        d.x0 += d3.event.dx;
                        d.y0 += d3.event.dy;
                        node.attr("transform", "translate(" + d.x0 + "," + d.y0 + ")");
                    } else {
                        d.x0 += d3.event.dy;
                        d.y0 += d3.event.dx;
                        node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
                    }
                    updateTempConnector();
                }).on("dragend", function (d) {
                    if (d === root) {
                        return;
                    }
                    domNode = this;
                    if (selectedNode) {
                        // now remove the element from the parent, and insert it into the new elements children
                        var index = draggingNode.parent.children.indexOf(draggingNode);
                        if (index > -1) {
                            draggingNode.parent.children.splice(index, 1);
                        }
                        if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                            if (selectedNode.children) {
                                selectedNode.children.push(draggingNode);
                            } else {
                                selectedNode._children.push(draggingNode);
                            }
                        } else {
                            selectedNode.children = [];
                            selectedNode.children.push(draggingNode);
                        }
                        // Make sure that the node being added to is expanded so user can see added node is correctly moved
                        endDrag();
                    } else {
                        endDrag();
                    }
                });

            function endDrag() {
                selectedNode = null;
                d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
                d3.select(domNode).attr('class', 'node');
                // now restore the mouseover event or we won't be able to drag a 2nd time
                d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
                updateTempConnector();
                if (draggingNode !== null) {
                    update(root);
                    centerNode(draggingNode);
                    draggingNode = null;
                }
                dragStarted = false;
            }

            var updateTempConnector = function () {
                var data = [];
                if (draggingNode !== null && selectedNode !== null) {
                    // have to flip the source coordinates since we did this for the existing connectors on the original tree
                    if (globalData.verticalLayout) {
                        data = [
                            {
                                source: {
                                    x: selectedNode.x0,
                                    y: selectedNode.y0
                                },
                                target: {
                                    x: draggingNode.x0,
                                    y: draggingNode.y0
                                }
                            }
                        ];
                    } else {
                        data = [
                            {
                                source: {
                                    x: selectedNode.y0,
                                    y: selectedNode.x0
                                },
                                target: {
                                    x: draggingNode.y0,
                                    y: draggingNode.x0
                                }
                            }
                        ];
                    }
                }
                var link = svg_group.selectAll(".templink").data(data);

                link.enter().append("path")
                    .attr("class", "templink")
                    .attr("d", d3.svg.diagonal())
                    .attr('pointer-events', 'none');

                link.attr("d", d3.svg.diagonal());

                link.exit().remove();
            };

            function overCircle(d) {
                selectedNode = d;
                updateTempConnector();
            }

            function outCircle() {
                selectedNode = null;
                updateTempConnector();
            }

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

            /* Functions for tree handling */
            function chgGraph() {
                if (globalData.graphIndex < (globalData.numberOfComponents - 1)) {

                    globalData.graphDepth = 0;
                    globalData.treeWidth = 0;
                    globalData.treeHorizontalRatio = 0;
                    globalData.labelVisibility = true;
                    globalData.graphIndex += 1;

                    globalData.toggled = false;
                    globalData.graphDepth = 0;

                    root = globalData.get_graph()[0];
                    root.x0 = width / 2;
                    root.y0 = height / 4;
                    root.children.forEach(collapse);
                    update(root);
                    centerNode(root);

                    var spinner_widget = $("#depthExp");
                    spinner_widget.spinner("value", 1);
                    spinner_widget.spinner({ max: globalData.graphDepths[globalData.graphIndex], min: 1, step: 1 });

                    var rb2 = $("#rightbar2").contents().filter(function () {
                        return this.nodeType !== 1;
                    });
                    var old_text = rb2.text();
                    var new_text = "Depth of graph: " + globalData.get_depth() + "/";

                    rb2.each(function () {
                        this.textContent = this.textContent.replace(old_text, new_text);
                    });

                    var rb = $("#rightbar").contents().filter(function () {
                        return this.nodeType !== 1;
                    });
                    var new_g_text = "Graph: " + (globalData.graphIndex + 1) +
                        "/" + globalData.numberOfComponents;
                    var new_n_text = "Nodes: " + globalData.nodes[globalData.graphIndex];

                    rb.each(function () {
                        if (this.textContent === rb[0].textContent) {
                            this.textContent = this.textContent.replace(rb[0].textContent, new_g_text);
                        } else {
                            this.textContent = this.textContent.replace(rb[1].textContent, new_n_text);
                        }
                    });
                }
            }

            function chdGraph() {
                if (globalData.graphIndex > 0) {

                    globalData.graphDepth = 0;
                    globalData.treeWidth = 0;
                    globalData.treeHorizontalRatio = 0;
                    globalData.labelVisibility = true;
                    globalData.graphIndex -= 1;

                    globalData.toggled = false;
                    globalData.graphDepth = 0;

                    root = globalData.get_graph()[0];
                    root.x0 = width / 2;
                    root.y0 = height / 4;
                    root.children.forEach(collapse);
                    update(root);
                    centerNode(root);

                    var spinner_widget = $("#depthExp");
                    spinner_widget.spinner("value", 1);
                    spinner_widget.spinner({ max: globalData.graphDepths[globalData.graphIndex], min: 1, step: 1 });

                    var rb2 = $("#rightbar2").contents().filter(function () {
                        return this.nodeType !== 1;
                    });
                    var old_text = rb2.text();
                    var new_text = "Depth of graph: " + globalData.get_depth() + "/";

                    rb2.each(function () {
                        this.textContent = this.textContent.replace(old_text, new_text);
                    });

                    var rb = $("#rightbar").contents().filter(function () {
                        return this.nodeType !== 1;
                    });
                    var new_g_text = "Graph: " + (globalData.graphIndex + 1) +
                        "/" + globalData.numberOfComponents;
                    var new_n_text = "Nodes: " + globalData.nodes[globalData.graphIndex];

                    rb.each(function () {
                        if (this.textContent === rb[0].textContent) {
                            this.textContent = this.textContent.replace(rb[0].textContent, new_g_text);
                        } else {
                            this.textContent = this.textContent.replace(rb[1].textContent, new_n_text);
                        }
                    });
                }
            }

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

            function exClick() {
                if (globalData.verticalLayout) {
                    globalData.treeWidth += 250;
                } else {
                    globalData.treeHorizontalRatio += 50;
                }
                update(root);
            }

            function shClick() {
                if (globalData.verticalLayout) {
                    if (globalData.treeWidth > 400) {
                        globalData.treeWidth -= 400;
                    } else {
                        globalData.treeWidth = 0;
                    }
                } else {
                    if (globalData.treeHorizontalRatio > 50) {
                        globalData.treeHorizontalRatio -= 50;
                    } else {
                        globalData.treeHorizontalRatio = 0;
                    }
                }
                update(root);
            }

            function crClick() {
                zoomListener.scale(1).translate([0, 0]);
                centerNode(root);
            }

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

            function toClick() {
                globalData.verticalLayout = !globalData.verticalLayout;
                globalData.toggled = true;
                update(root);
                centerNode(root);
            }

            function edgelist(root) {
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
//                var ret_val = {}
//                for (var elem = 0; elem < result.length; elem++) {
//                    ret_val[elem] = result[elem];
//                }

                return JSON.stringify(result);
            }

            function submit_download_form(output_format, callback) {
                var form = document.getElementById("svgform");
                form.output_format.value = output_format;
                if (globalData.verticalLayout) {
                    form.layout.value = "vertical";
                } else {
                    form.layout.value = "horizontal";
                }
                if (output_format === 'txt') {
                    form.data.value = edgelist(root);
                } else {
                    var svg_window = document.getElementById("visualization");

                    form.data.value = (new XMLSerializer()).serializeToString(svg_window);
                }
                form.submit();
                callback();
            }

            function epdfClick() {
                var valid_ext = "PDF,PNG,JPG,SVG,TXT";
                var to_show = valid_ext.split(',');
                var select_format = $("<select id=\"extSelector\" name=\"extension\" />");
                for (var val in to_show) {
                    if (to_show.hasOwnProperty(val)) {
                        $("<option />", {value: val, text: to_show[val]}).appendTo(select_format);
                    }
                }
                function saveActionButton() {
                    var selected_format = to_show[$("#extSelector").val()].toLowerCase();
                    submit_download_form(selected_format, function () {
                        $("#saveAction").remove();
                        $("#extSelector").remove();
                        $("#exportGraph").attr("disabled", false);
                    });
                }


                var rb2 = $("#rightbar2");
                rb2.append(select_format);
                $("#exportGraph").attr("disabled", true);
                var save_button = $("<input id=\"saveAction\" type=\"button\" value=\"Save!\" title=\"Save in the selected format\">");
                rb2.append(save_button);

                d3.select("#saveAction").on("click", saveActionButton);
            }

            function reordClick() {

            }

            /* Functions for the update function */
            function toggleChildren(d) {
                if (typeof d.children !== 'undefined' || typeof d._children !== 'undefined') {
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                        d._children.forEach(collapse);
                    } else {
                        d.children = d._children;
                        d._children = null;
                        d.children.forEach(collapse);
                    }
                }
                return d;
            }

            function click(d) {
                d = toggleChildren(d);
                update(d);
                centerNode(d);
            }

            function magnify(d) {
                if (!dragStarted) {
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

                    nodeSelection.select(".ghostCircle")
                        .attr("r", function () {
                            return 20;
                        });
                }
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

                nodeSelection.select(".ghostCircle")
                    .attr("r", function () {
                        return 6;
                    });
            }

            function centerNode(source) {
                var scale = zoomListener.scale();
                var x, y = 0;
                if (globalData.verticalLayout) {
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


            var node_data = $("<p>").textContent = "Nodes: " + globalData.nodes[globalData.graphIndex];
            var depth_data = $("<p id='spintext'>").textContent = "Depth of graph: " + globalData.get_depth() + "/";
            var g_data = $("<p>").textContent = "Graph: " + (globalData.graphIndex + 1) +
                "/" + globalData.numberOfComponents;

            $('#rightbar')
                .tooltip()
                .append('<input id="expandTree" type="button" value="Expand tree" title="Increase the space between nodes">')
                .append('<input id="shrinkTree" type="button" value="Shrink tree" title="Decrease the space between nodes">')
                .append('<input id="centerRoot" type="button" value="Center root" title="Reset view to the root element">')
                .append('<input id="toggleLabels" type="button" value="Toggle Labels" title="Show/hide node labels">')
                .append('<input id="flipLayout" type="button" value="Flip Layout" title="Change between horizontal and vertical tree layout">');
            if (globalData.extraEdges.length > 0) {
                $('#rightbar').append('<input id="reorderNodes" type="button" value="Reorder Nodes" title="Select the previous graph">');
            }
            $('#rightbar').append('<input id="changeGraphUp" type="button" value="Next" title="Select the next graph">')
                .append('<input id="changeGraphDown" type="button" value="Previous" title="Select the previous graph">')
                .append(g_data)
                .append("<br>")
                .append(node_data);

            if (globalData.numberOfComponents > 1) {
                $('#rightbar2')
                    .append(depth_data)
                    .tooltip()
                    .append('<input id="depthExp" type="spinner" value="1" title="Set how deep the graph should be expanded">')
                    .append('<input id="expandSpin" type="button" value="Expand" title="Expand the graph to the selected depth">')
                    .append('<input id="exportGraph" type="button" value="Save as...">');

            } else {
                $('#rightbar2')
                    .append(depth_data)
                    .append('<input id="depthExp" type="spinner" value="1" title="Set how deep the graph should be expanded">')
                    .append('<input id="expandSpin" type="button" value="Expand" title="Expand the graph to the selected depth">')
                    .append('<input id="exportGraph" type="button" value="Save as...">');
            }

            $("#rightbar").tooltip({show: {delay: 1000}});
            $("#rightbar2").tooltip({show: {delay: 1000}});


            $("#depthExp").spinner({ max: globalData.graphDepths[globalData.graphIndex],
                min: 1,
                step: 1 }).width(20);

            d3.select("#changeGraphUp").on("click", chgGraph);
            d3.select("#changeGraphDown").on("click", chdGraph);
            d3.select("#expandSpin").on("click", exsClick);
            d3.select("#expandTree").on("click", exClick);
            d3.select("#shrinkTree").on("click", shClick);
            d3.select("#centerRoot").on("click", crClick);
            d3.select("#toggleLabels").on("click", tlClick);
            d3.select("#flipLayout").on("click", toClick);
            d3.select("#exportGraph").on("click", epdfClick);
            d3.select("#reorderNodes").on("click", reordClick);

            function update(source) {

                var levelWidth = [1];
                var level_label_width = [1];
                var newHeight = height;
                var newWidth;

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

                // Id the links
                links.forEach(function (d) {
                    if (d.hasOwnProperty("added")) {
                        var tmp_id = d.source.id + d.target.id;
                        d.id = tmp_id + parseInt(globalData.nodes);
                    } else {
                        d.id = d.target.id;
                    }
                });

                // Enter any new nodes at the parent's previous position.
                var nodeEnter = node.enter().append("g")
                    .call(dragListener)
                    .attr("class", "node")
                    .attr("transform", function () {
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
                    .attr("class", "nodeCircle")
                    .attr("r", 1e-6)
                    .style("fill", function (d) {
                        return d._children ? "lightsteelblue" : "#fff";
                    })
                    .style("stroke", "steelblue")
                    .style("stroke-width", "1px");

                // Phantom node
                nodeEnter.append("circle")
                    .attr("class", "ghostCircle")
                    .attr("r", 30)
                    .attr("opacity", 0)
                    .style("fill", "red")
                    .attr("pointer-events", "mouseover")
                    .on("mouseover", function (node) {
                        overCircle(node);
                    })
                    .on("mouseout", function (node) {
                        outCircle(node);
                    });

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
                        .style("font-size", "12px")
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
                        return d._children ? "#09f" : "#fff";
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
                                return -14;
                            } else {
                                return 14;
                            }
                        })
                        .attr("dy", ".35em")
                        .attr("text-anchor", "middle")
                        .style("fill", "#353524")
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
                    .attr("transform", function () {
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
                            return "#666";
                        }
                    })
                    .attr("stroke-dasharray", function (d) {
                        if (d.hasOwnProperty('added')) {
                            return "0,5 1";
                        } else {
                            return "1 0";
                        }
                    })
                    .attr("d", function () {
                        var o = {x: source.x0, y: source.y0};
                        return diagonal({source: o, target: o});
                    })
                    .attr("marker-end", function () {
                        return "url(#" + "normal" + ")";
                    });

                // Transition links to their new position.
                link.transition()
                    .duration(duration)
                    .attr("d", diagonal);

                // Transition exiting nodes to the parent's new position.
                link.exit().transition()
                    .duration(duration)
                    .attr("d", function () {
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

            root.children.forEach(collapse);
            update(root);
            centerNode(root);
        };

        var get_depth = function (treeData) {
            var root = treeData[0];
            var levels = {};
            var key;
            var size = 0;
            var tree = d3.layout.tree();
            tree.nodes(root).reverse();

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

        $.ajaxSetup({
            error: function (x) {
                if (x.status === 500) {
                    var error = $('<p>').textContent = 'Internal server error.';
                    $('#infobar').append(error);
                }
            }
        });

        var docWidth = String(parseInt($(window).width() * 0.7));
        var freeHeight = $(window).height() - 370;
        if (freeHeight < 480) {
            $("#visualization").height("480").width(docWidth);
            $("#rightbar").height("480");
        } else {
            $("#visualization").height(String(freeHeight)).width(docWidth);
            $("#rightbar").height(String(freeHeight));
        }

        initialize_uploader();
    }
)
;
