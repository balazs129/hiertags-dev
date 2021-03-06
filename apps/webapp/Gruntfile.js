module.exports = function (grunt) {


  // Initialize the configuration object
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      build: ['./build']
    },

    concat: {
      options: {
        separator: ';'
      },
      release: {
        src: ['./bower_components/jquery/dist/jquery.js',
          './bower_components/bootstrap/js/button.js',
          './bower_components/bootstrap/js/dropdown.js',
          './bower_components/bootstrap/js/tooltip.js',
          './bower_components/bootstrap/js/transition.js',
          './bower_components/blueimp-file-upload/js/vendor/jquery.ui.widget.js',
          './bower_components/blueimp-file-upload/js/jquery.fileupload.js',
          './bower_components/devbridge-autocomplete/dist/jquery.autocomplete.js',
          './build/vis.js'],
        dest: './build/visualization.js'
      },
      dev: {
        src: ['./bower_components/jquery/dist/jquery.js',
          './bower_components/bootstrap/js/button.js',
          './bower_components/bootstrap/js/dropdown.js',
          './bower_components/bootstrap/js/tooltip.js',
          './bower_components/bootstrap/js/transition.js',
          './bower_components/blueimp-file-upload/js/vendor/jquery.ui.widget.js',
          './bower_components/blueimp-file-upload/js/jquery.fileupload.js',
          './bower_components/devbridge-autocomplete/dist/jquery.autocomplete.js',
          './build/vis.js'],
        dest: '../visualize/static/js/visualization.min.js'
      }
    },

    cssmin: {
      combine: {
        files: {
          '../base/static/css/hiertags.min.css': ['./bower_components/bootstrap/dist/css/bootstrap.css', './assets/hiertags.css']
        }
      }
    },

    browserify: {
      main: {
        src: ['./app/main.js'],
        dest: './build/vis.js'
      }
    },

    uglify: {
      all: {
        files: {
          '../visualize/static/js/visualization.min.js': ['./build/visualization.js']
        }
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Task definitions
  grunt.registerTask('default', ['clean', 'browserify', 'cssmin:combine', 'concat:release', 'uglify', 'clean']);
  grunt.registerTask('dev', ['clean', 'browserify', 'concat:dev', 'clean']);
};
