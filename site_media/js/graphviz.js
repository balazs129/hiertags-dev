initialize_uploader = function() {
    var url = '/graphviz/flash/data/';
    var csrftoken = $.cookie('csrftoken');
    $('#fileupload').fileupload({
        url: url,
        crossDomain: false,
        beforeSend: function(xhr, settings) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        },
        paramName: 'graph',
        dataType: 'json', /* $('input:file') */
        done: function (e, data) {
            /* visualize graph */
            visualize_graph('graph', data.result);
        }
    }).prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');    
}

initialize_viewer = function() {
    vis = new org.cytoscapeweb.Visualization('graphViewer', {
        swfPath: "/static/site_media/swf/CytoscapeWeb",
        flashInstallerPath: "/static/site_media/swf/playerProductInstall"
    });

    vis.addListener("mouseover", "nodes", function(evt) {
        var node = evt.target;
        var bypass = { nodes: { }, edges: { } };
        bypass['nodes'][node.data.id] = {'size': 150, 'labelFontSize': 30, 'labelFontWeight': 'bold'}
        vis.visualStyleBypass(bypass);
    });

    vis.addListener("mouseout", "nodes", function(evt) {
        var node = evt.target;
        var bypass = { nodes: { }, edges: { } };
        bypass['nodes'][node.data.id] = {}
        vis.visualStyleBypass(bypass);
    });
    vis.draw({network: network}); 
}

var vis = undefined
var network = {
    dataSchema: {
        nodes: [{name: "label", type: "string"}, {name: "collapsed", type: "boolean"}],
        edges: [{name: "directed", type: "boolean", defValue: true}]
    },
    data: { nodes: [], edges: [] }
};
$(function () {
    'use strict';
    initialize_uploader();
    initialize_viewer();
});

var options = {}
visualize_graph = function(div_id, retval, node_id) {
    network.data.nodes = retval.nodes
    network.data.edges = retval.edges
    /*for (var i=0; i<retval.nodes.length; i++) {
        console.log(retval.nodes[i]['collapsed'])
    }*/
    options = { fitToScreen: true, points: retval.points };
    vis.draw({ network: network, panZoomControlVisible: true });  
    vis.ready(function () {
        var colorMapper = {
            attrName: "collapsed",
            entries: [{ attrValue: true, value: "#204a87" },
                      { attrValue: false, value: "#fce94f" }]
        };
        /* Set visual style */
        var style = {
            global: {
                backgroundColor: "#ffffff"
            },
            nodes: {
                size: 20,
                labelFontSize: 10,
                labelVerticalAnchor: 'bottom',
                labelYOffset: 4,
                opacity: 1.0,
                color: { discreteMapper: colorMapper }
            }
        };     
        vis.visualStyle(style);
        /* Set context menus */
        vis.layout({name: 'Preset', options: options});
        vis.removeAllContextMenuItems();
        vis.addContextMenuItem("View node subtree", "nodes", 
            function (evt) {
                node = evt.target;
                if (node['data']['collapsed']) {
                    var url = '/graphviz/flash/expand/' + node['data']['id'] + '/child/'
                    $.ajax({
                        url: url,
                        async: false,
                        success: function(retval) {
                            visualize_graph('graph', retval, node['data']['id']);
                        }
                    });
                }
            }
        );

        vis.addContextMenuItem("Jump to parent", "nodes", 
            function (evt) {
                node = evt.target;
                var url = '/graphviz/flash/expand/' + node['data']['id'] + '/parent/'
                $.ajax({
                    url: url,
                    async: false,
                    success: function(retval) {
                        visualize_graph('graph', retval, node['data']['id']);
                    }
                });
            }
        );
    });
}