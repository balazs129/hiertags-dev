var Backbone = require('backbone');

var TreeView = Backbone.View.extend({
  el: '#visualization',

  initialize: function () {
    console.log(this.model);
    this.listenTo(this.model, "change", this.render);
  },

  render: function (){
    console.log(this);
    return this;
  }
});

module.exports = TreeView;
