'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = exports.jsonLike = exports.interpolator = exports.Blueprint = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.src = src;
exports.dest = dest;
exports.glob = glob;
exports.read = read;

var _env = require('./env');

var env = _interopRequireWildcard(_env);

var _io = require('./io');

var _hazy = require('hazy');

var _hazy2 = _interopRequireDefault(_hazy);

var _protagonist = require('protagonist');

var _protagonist2 = _interopRequireDefault(_protagonist);

var _hercule = require('hercule');

var _hercule2 = _interopRequireDefault(_hercule);

var _glob2 = require('glob');

var _glob3 = _interopRequireDefault(_glob2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _log = require('./log');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Parses, transcludes and compiles API blueprint files
 * and their associated fixtures. Allows compiled
 * API blueprints to be exported to the filesystem
 */

var Blueprint = exports.Blueprint = function () {

  /**
   * @param {String} markdown Valid API blueprint markdown
   */

  function Blueprint(markdown) {
    var _this = this;

    _classCallCheck(this, Blueprint);

    this.markdown = markdown;

    var markdownFuncs = ['compile', 'fixtures', 'groups', 'interpolate', 'parse', 'transclude', 'validate'];

    markdownFuncs.forEach(function (method) {
      _this[method] = function () {
        return Blueprint[method](_this.markdown);
      };
    });
  }

  /**
   * Compiles API blueprint markdown data by translcuding it and then parsing it for fixtures
   *
   * @param {String} markdown
   * @returns {Promise}
   */


  _createClass(Blueprint, null, [{
    key: 'compile',
    value: function compile(markdown) {
      log().info('compiling');

      return Blueprint.transclude(markdown).then(function (embedMd) {
        return Blueprint.interpolate(embedMd);
      }).then(function (staticMd) {
        return Blueprint.validate(staticMd);
      }).then(function (finalMd) {
        return Blueprint.fixtures(finalMd).then(function (fixtures) {
          return Object.assign(new Blueprint(markdown), { compiled: { fixtures: fixtures, markdown: finalMd } });
        });
      });
    }

    /**
     * Extracts JSON fixtures from API blueprint markdown
     *
     * @param {String} markdown
     * @returns {Promise}
     */
    // TODO - add option that allows fixtures to be parsed from hazy pool

  }, {
    key: 'fixtures',
    value: function fixtures(markdown) {
      log().info('extracting fixtures');

      return new Promise(function (resolve, reject) {
        var fixtures = [];
        var jsonStrMatches = markdown.match instanceof Function ? markdown.match(jsonLike) : [];

        jsonStrMatches && jsonStrMatches.forEach(function (jsonStr) {
          try {
            var fixture = JSON.parse(jsonStr);

            fixtures.push(fixture);
          } catch (e) {}
        });

        resolve(fixtures);
      });
    }

    /**
     * Compiles API blueprint markdown data by translcuding it and then parsing it for fixtures
     *
     * @param {String} markdown
     * @returns {Promise}
     */

  }, {
    key: 'parse',
    value: function parse(markdown) {
      log().info('parsing');

      return new Promise(function (resolve, reject) {
        if (markdown) {
          _protagonist2.default.parse(markdown, function (err, blueprint) {
            if (!err) {
              resolve(blueprint);
            } else {
              log().error('invalid API blueprint', err);

              reject('failed to parse file as valid API blueprint: ' + err);
            }
          });
        } else {
          reject('markdown data required');
        }
      });
    }

    /**
     * Parses API blueprint markdown data and determines if it's valid
     *
     * @param {String} markdown
     * @returns {Promise}
     */

  }, {
    key: 'validate',
    value: function validate(markdown) {
      log().info('validating');

      return new Promise(function (resolve, reject) {
        Blueprint.parse(markdown).then(function (obj) {
          resolve(markdown);
        }).catch(function (err) {
          log().error('invalid', err);

          reject(markdown);
        });
      });
    }

    /**
     * Scans API blueprint markdown for Hercule references and transcludes them
     *
     * @param {String} markdown
     * @returns {Promise}
     */

  }, {
    key: 'transclude',
    value: function transclude(markdown) {
      return new Promise(function (resolve, reject) {
        log().info('transcluding');

        if (markdown) {
          _hercule2.default.transcludeString(markdown, function (transMd) {
            if (transMd) {
              resolve(transMd);
            } else {
              reject('failed to parse hercule transclusions');
            }
          });
        } else {
          reject('valid markdown required for transclusion');
        }
      });
    }

    /**
     * Interpolates markdown with relevant replacements. Uses hazy's random
     * fixture data interpolator by default
     *
     * @param {String} markdown
     * @returns {Promise}
     */

  }, {
    key: 'interpolate',
    value: function interpolate(markdown) {
      log().info('interpolating');

      var locals = { config: env.current() }; // FIXME - not accessible in hazy for some reason

      return new Promise(function (resolve, reject) {
        return resolve(interpolator(markdown, locals));
      });
    }

    /**
     * Attempts to marshall API blueprint content into a specific filetype
     *
     * @param {String} markdown
     * @param {String} filetype 'apib' or 'json'
     * @returns {Promise}
     */

  }, {
    key: 'marshall',
    value: function marshall(markdown, filetype) {
      return new Promise(function (resolve, reject) {
        log().info('marshalling to ' + filetype);

        var filetypes = {
          md: function md() {
            return resolve(markdown);
          },
          apib: function apib() {
            return resolve(markdown);
          },
          json: function json() {
            return Blueprint.fixtures(markdown).then(resolve);
          }
        };

        if (filetype in filetypes) {
          return filetypes[filetype || 'apib']();
        } else {
          reject('unsupported filetype: ' + filetype);
        }
      });
    }

    // TODO - juggle (obfiscates fixture data by randomizing it with hazy tokens)
    // TODO - struct (pretty prints your API blueprint by components (like `ps auxf`))

  }]);

  return Blueprint;
}();

/**
 * Parses and compiles an API blueprint from the file system
 *
 * @param {String} filepath
 * @returns {Promise}
 */


function src(filepath) {
  log().info('reading content from ' + filepath);

  return new Promise(function (resolve, reject) {
    if (filepath) {
      _io.util.fs.src(filepath, function (data) {
        return new Blueprint(data).compile();
      }).then(resolve).catch(reject);
    } else {
      reject('Failed to read file, filepath required');
    }
  });
}

/**
 * Reads in and then exports API blueprints as either a static html or apib file
 * to the provided file path
 *
 * @param {String} markdown
 * @param {String} filepath
 * @returns {Promise}
 */
function dest(blueprint, filepath) {
  return new Promise(function (resolve, reject) {
    log().info('writing content to ' + filepath);

    var ext = _path2.default.extname(filepath).substr(1);

    read(blueprint).then(function (consumed) {
      return Blueprint.marshall(consumed.compiled.markdown, ext);
    }).then(function (marshalled) {
      return _io.util.fs.dest(filepath, marshalled);
    }).then(resolve).catch(reject);
  });
}

/**
 * Globs and reads in valid API blueprint(s) from the filesystem and compiles them
 *
 * @param {Array|String} blueprints
 * @returns {Promise}
 */
function glob(pattern, options) {
  log().info('globbing against ' + pattern);

  return new Promise(function (resolve, reject) {
    (0, _glob3.default)(pattern, options, function (err, files) {
      if (!err) {
        Promise.all(files.map(function (filepath) {
          return src(filepath);
        })).then(resolve).catch(reject);
      } else {
        reject('failed to load globbed file: ' + err);
      }
    });
  });
}

/**
 * Reads in valid API blueprint(s) from Strings or 
 * Arrays of Strings and compiles them
 *
 * @param {Array|String} blueprints
 * @returns {Promise}
 */
function read(blueprints) {
  log().info('reading in content');

  return new Promise(function (resolve, reject) {
    if (blueprints instanceof Blueprint) {
      resolve(blueprints);
    } else if (blueprints.constructor === String) {
      resolve(new Blueprint(blueprints).compile());
    } else if (blueprints instanceof Array) {
      Promise.all(blueprints.map(function (bp) {
        return new Blueprint(bp).compile();
      })).then(resolve).catch(reject);
    } else {
      reject('documents must be represented as a String or Array, got ' + (typeof blueprints === 'undefined' ? 'undefined' : _typeof(blueprints)));
    }
  });
}

/**
 * Allows developers to configure and override the default interpolator (hazy.lang.process)
 */
var interpolator = exports.interpolator = _hazy2.default.lang.process;

/**
 * My janky regex for finding "JSON" objects in markdown. Need a more loveable solution, has obvious
 * issues with validating nested structures (regex isn't suited for this)
 */
var jsonLike = exports.jsonLike = /\{(.*?)\}/gm;

/**
 * Module-level bunyan logger
 */
var log = exports.log = function log() {
  return (0, _log.logger)().child({ module: 'blueprint' });
};