var Backbone = require('backbone'),
    $ = require('jquery');

Backbone.$ = $;

var Todo = Backbone.Model.extend({
  initialize: function () {
    console.log('This model has been initialized.');
  }
});

var myTodo = new Todo({
  title: "Arbitrary Title",
  completed: true
});

var TodoView = Backbone.View.extend({
  tagName: 'ul',
  className: 'container',
  id: 'todos'
});

var todosView = new TodoView();

console.log(todosView.el);
