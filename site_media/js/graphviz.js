function initialize_uploader () {
    'use strict';

    var url = '/graphviz/flash/data/';
    var csrftoken = $.cookie('csrftoken');
    $('#fileupload').fileupload({
        add: function (e, data) {
            var errordiv = $('#errorp');
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
        $('#errorp').html("");
        initialize_viewer();
        visualize_graph('graph', data.result);
        $('#progress-circle').css('visibility', 'hidden');
    })
        .prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');
}

function initialize_viewer() {
    vis = new org.cytoscapeweb.Visualization('graphViewer', {
        swfPath: "/static/site_media/swf/CytoscapeWeb",
        flashInstallerPath: "/static/site_media/swf/playerProductInstall"
    });

    vis.addListener("mouseover", "nodes", function (evt) {
        var node = evt.target;
        var bypass = { nodes: { }, edges: { } };
        bypass.nodes[node.data.id] = {'size': 150, 'labelFontSize': 30, 'labelFontWeight': 'bold'};
        vis.visualStyleBypass(bypass);
    });

    vis.addListener("mouseout", "nodes", function (evt) {
        var node = evt.target;
        var bypass = { nodes: { }, edges: { } };
        bypass.nodes[node.data.id] = {};
        vis.visualStyleBypass(bypass);
    });

    vis.draw({network: network});
}

var vis;
var network = {
    dataSchema: {
        nodes: [
            {name: "label", type: "string"},
            {name: "collapsed", type: "boolean"}
        ],
        edges: [
            {name: "directed", type: "boolean", defValue: true}
        ]
    },
    data: { nodes: [], edges: [] }
};

function visualize_graph(div_id, retval) {
    'use strict';
    network.data.nodes = retval.nodes;
    network.data.edges = retval.edges;

    var options = { fitToScreen: true,
                points: retval.points};
    vis.draw({ network: network, panZoomControlVisible: true });
    vis.ready(function () {
        var colorMapper = {
            attrName: "collapsed",
            entries: [
                { attrValue: true, value: "#204a87" },
                { attrValue: false, value: "#fce94f" }
            ]
        };
        /* Set visual style */
        var style = {
            global: {
                backgroundColor: "#ffffff"
            },
            nodes: {
                size: 25,
                labelFontSize: 12,
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

//        vis.addContextMenuItem("View node subtree", "nodes",
//            function (evt) {
//                node = evt.target;
//                  node['data']['hasChild'] = True
//                if (node['data']['collapsed']) {
//                    var url = '/graphviz/flash/expand/' + node['data']['id'] + '/tree/'
//                    $.ajax({
//                        url: url,
//                        async: false,
//                        success: function(retval) {
//                            visualize_graph('graph', retval, node['data']['id']);
//                        }
//                    });
//                }
//            }
//        );

        vis.addContextMenuItem("Hide childrens", "nodes",
            function (evt) {
                var node = evt.target;
                var url = '/graphviz/flash/expand/' + node.data.id + '/parent/';
                if (node.data.collapsed === false) {
                    $.ajax({
                        url: url,
                        async: true,
                        success: function (retval) {
                            visualize_graph('graph', retval, node.data.id);
                        }
                    });
                }
            });

        vis.addContextMenuItem("Show childrens", "nodes",
            function (evt) {

                var node = evt.target;
                var url = '/graphviz/flash/expand/' + node.data.id + '/child/';
                if (node.data.collapsed === false) {
                    $.ajax({
                        url: url,
                        async: true,
                        success: function (retval) {
                            visualize_graph('graph', retval, node.data.id);
                        }
                    });
                }
            });
    });
}

$(function () {
    'use strict';
    $.ajaxSetup({
        error: function (x) {
            if (x.status === 500) {
                var error = $('<p>').textContent = 'Error! Graph Contains a Cycle.';
                $('#errorp').append(error);
            }
        }
    });
    initialize_uploader();

    $('#graphViewer').mousewheel(function(event, delta, deltaX, deltaY) {
        vis.zoom(vis.zoom() + (deltaY / 10));
        return false;
    });


});