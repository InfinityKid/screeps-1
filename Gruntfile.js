var fs   = require("fs");
var path = require("path");

module.exports = function(grunt) {
    function getPrivateSettings(grunt) {
        var location = "./screeps.js";
        if (!grunt.file.exists(location)) {
            console.log("Can't find ./screeps.js, setting up...");

            grunt.file.write(location, fs.readFileSync(location+'.dist'));
        } else {
            return require(location);
        }
    }

    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('grunt-screeps');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        watch: {
          scripts: {
            files: ['src/*.js'],
            tasks: ['babel', 'screeps']
          }
        },
        babel: {
            options: {
                stage: 0
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['*.js', '**/*.js'],
                        dest: 'dist/'
                    }
                ]
            }
        },
        screeps: {
            options: {},
            dist: {
                src: ['dist/*.js']
            }
        }
    });

    grunt.config.merge(getPrivateSettings(grunt));

    grunt.registerTask('default', ['babel', 'screeps', 'watch']);
};