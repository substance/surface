/*global module:false*/
module.exports = function(grunt) {

// ----------------------------------------------------------------------------
//  Project configuration
// ----------------------------------------------------------------------------
  grunt.initConfig({
    pkg: '<json:package.json>'
  , meta: {
      banner: '// v<%= pkg.version %> - <%= grunt.template.today("hh:mm dd/mm/yy") %>'
    , wrapperStart: ';(function (global) {'
    , wrapperEnd: '} (this));'
    }
  , concat: {
      dist: {
        src: [
          '<banner:meta.banner>'
        , '<banner:meta.wrapperStart>'
        , 'lib/utils.js'
        , 'lib/kbd.js'
        , 'lib/kbdinput.js'
        , 'lib/mouse.js'
        , 'lib/caret.js'
        , 'lib/pixel.js'
        , 'lib/dataset.js'
        , 'lib/history.js'
        , 'lib/commands.js'
        , 'lib/editor.js'
        , '<banner:meta.wrapperEnd>'
        ]
      , dest: '<%= pkg.name %>.js'
      }
    }
  , min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>']
      , dest: '<%= pkg.name %>.min.js'
      }
    }
  , watch: {
      files: ['lib/**/*.js']
    , tasks: 'concat:dist lint:dist'
    }
  , lint: {
      dist: ['<config:concat.dist.dest>']
    }
  , jshint: {
      options: {
        eqeqeq: true
      , immed: true
      , latedef: true
      , newcap: true
      , noarg: true
      , sub: true
      , undef: true
      , boss: true
      , eqnull: true
      , browser: true
      , laxcomma: true // comma first props
      , asi: true // ignore semicolons
      }
    , globals: {}
    }
  , uglify: {}
  });


// ----------------------------------------------------------------------------
//  Loading grunt plugins or tasks folders
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
//  Tasks and Helpers
// ----------------------------------------------------------------------------
  grunt.registerTask('default', 'concat lint:dist min');

};
