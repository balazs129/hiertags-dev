/*
cy.on('mousemove', function (e) {
                                console.log(e.originalEvent.clientX)
                                $.each(cy.nodes(), function(index, value) {
                                    console.log(value.renderedPosition())
                                });
                                console.log('---------------------')
                            })
*/
var cy = undefined
visualize_graph = function(div_id, retval) {
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
        ready: function() {
            /* console.log(retval.nodes.length)
            console.log(retval.edges.length) */
            cy = this;
            $('#' + div_id).cytoscapePanzoom();
            $('#' + div_id).cytoscapeNavigator();
            $('#showall').attr("disabled", false);
            $('#showall').click(function () {
                cy.nodes(":hidden").show()
            });
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
            $('#' + div_id).cxtmenu({
                selector: 'node',
                commands: [
                    {
                        content: '<span class="icon-arrow-right"></span><label>descendants</label>',
                        select: function(){
                            $.ajax({
                                url: '/graphviz/' + this.id() + '/descendants/',
                                success: function(retval) {
                                    $.each(retval.nodes, function(index, value) {
                                        cy.nodes("[id=" + value + "]").hide()    
                                    });
                                }
                            });
                        }
                    },
                    {
                        content: '<span class="icon-remove destructive-light"></span><label class="">ancestors</label>',
                        select: function(){
                            $.ajax({
                                url: '/graphviz/' + this.id() + '/ancestors/',
                                success: function(retval) {
                                    $.each(retval.nodes, function(index, value) {
                                        cy.nodes("[id='" + value + "']").hide()    
                                    });
                                }
                            });
                        }
                    }
                ]
            });
        } // end of ready
    });
}