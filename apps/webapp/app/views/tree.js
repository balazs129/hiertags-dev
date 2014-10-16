var Backbone = require('backbone'),
    d3 = require('d3');


var TreeView = Backbone.View.extend({
  el: '#visualization',
  events: {},

  treeData: {
    width: 0,
    height: 0,
    tree: null,
    diagonal: null,
    svg: null
    },

  initialize: function () {
    'use strict';
    // Generate the tree diagram
    var svgArea = $(this.el),
        root;

    this.treeData.height = svgArea.height();
    this.treeData.width = svgArea.width();

    this.treeData.tree = d3.layout.tree()
          .size([this.treeData.height, this.treeData.width]);

    this.treeData.diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

    this.treeData.svg = d3.select("#visualization")
      .attr("width", this.treeData.width)
      .attr("height", this.treeData.height)
      .attr("class", "overlay");

    root = this.model.get('dag');
    this.update(root);

    this.listenTo(this.model, "change", this.render);
  },

  render: function (){
    'use strict';
    return this;
  },
  update: function (root){
  'use strict';
  // Compute the new tree layout.
  var nodes = this.treeData.tree.nodes(root).reverse(),
      links = this.treeData.tree.links(nodes),
      i = 0;

  // Normalize for fixed-depth.
  nodes.forEach(function (d) {
    d.y = d.depth * 180;
  });

  // Declare the nodesâ€¦
  var node = this.treeData.svg.selectAll("g.node")
    .data(nodes, function (d) {
      return d.id || (d.id = ++i);
    });

  // Enter the nodes.
  var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function (d) {
      return "translate(" + d.y + "," + d.x + ")";
    });

  nodeEnter.append("circle")
    .attr("r", 10)
    .style("fill", "#fff");

  nodeEnter.append("text")
    .attr("x", function (d) {
      return d.children || d._children ? -13 : 13;
    })
    .attr("dy", ".35em")
    .attr("text-anchor", function (d) {
      return d.children || d._children ? "end" : "start";
    })
    .text(function (d) {
      return d.name;
    })
    .style("fill-opacity", 1);

  // Declare the linksâ€¦
  var link = this.treeData.svg.selectAll("path.link")
    .data(links, function (d) {
      return d.target.id;
    });

  // Enter the links.
  link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", this.treeData.diagonal);
}
});

module.exports = TreeView;
