$(function() {
    $.ajax({
        url: $('#graph').data('url'),
        async: false,
        success: function(retval) {
            $('#graph').cytoscape({
                showOverlay: false,
                //minZoom: 0.5,
                maxZoom: 2,
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
                    var cy = this;
                    $("#graph").cytoscapePanzoom();
                    $("#graph").cytoscapeNavigator();
                    cy.nodes().on('mouseover', function () {
                        factor = (1 / cy.zoom()) * 1.2
                        if (this.data('origWidth') == undefined) {
                            this.data('origWidth', this.width())
                        }
                        if (this.data('origHeight') == undefined) {
                            this.data('origHeight', this.height())
                        }
                        this.animate({
                            css: { width: this.width() * factor, height: this.height() * factor, 'font-size': 15 * factor, 'font-weight': '900' },
                            duration: 100
                        });
                    });
                    cy.nodes().on('mouseout', function () {
                        if (this.data('origWidth') == undefined) {
                            return
                        }
                        this.animate({
                            css: { width: this.data('origWidth'), height: this.data('origHeight'), 'font-size': 10, 'font-weight': '100' },
                            duration: 100 
                        });
                    });
                }
            });
        }
    });
});