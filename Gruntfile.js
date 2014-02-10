var atomifyJs = require('atomify-js')
  , atomifyCss = require('atomify-css')
  , path = require('path')
  , fs = require('fs')
  , mochaCode = fs.readFileSync(require.resolve('mocha/mocha.js'))
  , mochaStyle = fs.readFileSync(require.resolve('mocha/mocha.css'));

module.exports = function(grunt) {
    var browsers = [{
          browserName: 'firefox'
        , version: '26'
        , platform: 'Windows 8.1'
        }
      , {
          browserName: 'chrome'
        , platform: 'Windows 8.1'
        }
      , {
          browserName: 'chrome'
        , platform: 'Windows 8.1'
        }
      , {
          browserName: 'internet explorer'
        , platform: 'Windows 8.1'
        , version: '10'
        }
      , {
          browserName: 'internet explorer'
        , platform: 'WIN7'
        , version: '9'
        }
      , {
          browserName: 'iphone'
        , platform: 'OS X 10.9'
        , version: '7'
        , 'device-orientation': 'portrait'
        }
      , {
          browserName: 'ipad'
        , platform: 'OS X 10.9'
        , version: '6'
        , 'device-orientation': 'portrait'
        }
      , {
          browserName: 'android'
        , platform: 'Linux'
        , version: '4.0'
        , 'device-orientation': 'portrait'
        }
      , {
          browserName: 'android'
        , platform: 'Linux'
        , version: '4.0'
        , 'device-type': 'tablet'
        , 'device-orientation': 'portrait'
        }];

    grunt.initConfig({
        connect: {
            server: {
                options: {
                    base: 'test',
                    port: 9999
                }
            }
        },
        'saucelabs-mocha': {
            all: {
                options: {
                    urls: ['http://127.0.0.1:9999'],
                    tunnelTimeout: 5,
                    build: process.env.TRAVIS_JOB_ID,
                    concurrency: 3,
                    browsers: browsers,
                    testname: 'ribcage-view',
                    tags: ['master']
                }
            }
        },
        watch: {
          scripts: {
            files: ['extend.js', 'Gruntfile.js', 'test/entry.js', 'test/fixtures/*.js']
          , tasks: ['atomifyJs', 'atomifyCss']
          , options: {
              interrupt: true
            }
          }
        }
    });

    // Loading dependencies
    for (var key in grunt.file.readJSON('package.json').devDependencies) {
        if (key !== 'grunt' && key.indexOf('grunt') === 0) grunt.loadNpmTasks(key);
    }

    grunt.registerTask('atomifyJs', 'Atomify the js', function () {
      var done = this.async()
        , outputFile = path.join(__dirname, 'test', 'bundle.js');

      atomifyJs({
        entry: path.join(__dirname, 'test', 'entry.js')
      , debug: false
      }, function (err, src) {
        if(err) {
          console.trace(err);
          return done(false);
        }

        // Prepend mocha's browser distributable
        src = mochaCode + ';' + src.toString();

        fs.writeFile(outputFile, src, function (err) {
          if(err) {
            console.trace(err);
            return done(false);
          }

          done();
        });
      });
    });

    grunt.registerTask('atomifyCss', 'Atomify the css', function () {
      var done = this.async()
        , outputFile = path.join(__dirname, 'test', 'bundle.css');

      atomifyCss({
        entry: path.join(__dirname, 'test', 'entry.css')
      }, function (err, src) {
        if(err) {
          console.trace(err);
          return done(false);
        }

        src = mochaStyle + '\n\n' + src.toString();

        fs.writeFile(outputFile, src, function (err) {
          if(err) {
            console.trace(err);
            return done(false);
          }

          done();
        });
      });
    });

    grunt.registerTask('dev', ['connect', 'atomifyJs', 'atomifyCss', 'watch']);
    grunt.registerTask('test', ['connect', 'saucelabs-mocha']);
};
