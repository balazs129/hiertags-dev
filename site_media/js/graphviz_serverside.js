/*
cy.on('mousemove', function (e) {
                                console.log(e.originalEvent.clientX)
                                $.each(cy.nodes(), function(index, value) {
                                    console.log(value.renderedPosition())
                                });
                                console.log('---------------------')
                            })
*/

visualize_graph = function(div_id, retval) {
    console.log(retval)
    $('#' + div_id).cytoscape({
        showOverlay: false,
        maxZoom: 2,
        renderer: { name: 'canvas'},
        layout: {
            name: 'preset'
        },
        elements: { 
            nodes: retval.nodes,
            edges: retval.edges
        },
        style: cytoscape.stylesheet()
            .selector('node')
            .css({
                'content': 'data(label)',
                'font-size': 10,
                'text-outline-color': '#000',
                'text-outline-opacity': '0.5'
        }),
        ready: function(){
            /* console.log(retval.nodes.length)
            console.log(retval.edges.length) */
            var cy = this;
            $('#' + div_id).cytoscapePanzoom();
            $('#' + div_id).cytoscapeNavigator();
            cy.nodes().on('mouseover', function () {
                //console.log(cy.zoom())
                if (cy.zoom() > 1.0) {
                    factor = cy.zoom() * 1.1
                } else {
                    factor = (1 / cy.zoom()) * 1.2
                }
                if (this.data('origWidth') == undefined) {
                    this.data('origWidth', this.width())
                }
                if (this.data('origHeight') == undefined) {
                    this.data('origHeight', this.height())
                }
                this.animate({
                    css: { 'width':  this.width() * factor, 'height': this.height() * factor, 
                           'font-size': 15 * factor, 'font-weight': '900' 
                    }, duration: 100
                });
            });
            cy.nodes().on('mouseout', function () {
                if (this.data('origWidth') == undefined) {
                    return
                }
                this.animate({
                    css: { 'width': this.data('origWidth'), 'height': this.data('origHeight'), 
                           'font-size': 10, 'font-weight': '100' 
                    }, duration: 100 
                });
            });
        }
    });
}