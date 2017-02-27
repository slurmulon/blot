'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = exports.Document = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _apib = require('./apib');

var _env = require('./env');

var env = _interopRequireWildcard(_env);

var _io = require('./io');

var io = _interopRequireWildcard(_io);

var _hazy = require('hazy');

var _hazy2 = _interopRequireDefault(_hazy);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _aglio = require('aglio');

var _aglio2 = _interopRequireDefault(_aglio);

var _log = require('./log');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Represents a collection of HTML DOM elements.
 * Contains functionality for working with API Blueprints
 * and their view representations.
 */
var Document = exports.Document = function () {

  /**
   * @param {String} html encoded HTML string
   */
  function Document(html) {
    _classCallCheck(this, Document);

    this.html = html;
  }

  /**
   * Provides project configuration options for HTML views
   *
   * @returns {Object}
   */


  _createClass(Document, [{
    key: 'dest',


    /**
     * Writes out compiled HTML to a filepath (UTF-8)
     *
     * @param {?String} filepath
     * @param {?String} html
     * @returns {Promise}
     */
    value: function dest(filepath, html) {
      return Document.dest(filepath || this.config.dest, html || this.html);
    }

    /**
     * Provides environment configuration options for HTML views
     *
     * @returns {Object}
     */

  }, {
    key: 'config',
    get: function get() {
      return Document.config();
    }

    /**
     * Returns a jQuery-like version of internal HTML
     *
     * @returns {$}
     */

  }, {
    key: 'query',
    get: function get() {
      return Document.query(this.html);
    }

    /**
     * Returns the container object of a template
     * if one is configured in environment/project
     *
     * @returns {$}
     */

  }, {
    key: 'container',
    get: function get() {
      return Document.container(this.html);
    }

    /**
     * Strips out elements from HTML based on
     * environment/project configuration
     *
     * @returns {$}
     */

  }, {
    key: 'stripped',
    get: function get() {
      return Document.stripped(this.html);
    }

    /**
     * Processes all element configuration filters against HTML
     * and returns the resulting document
     *
     * @returns {$}
     */

  }, {
    key: 'processed',
    get: function get() {
      return Document.process(this.html);
    }
  }], [{
    key: 'config',
    value: function config() {
      return env.current().view;
    }

    /**
     * Determines element selector from environment/project configuration key
     *
     * @param {?String} configKey top-level key of "views.element" in config file
     * @returns {Object}
     */

  }, {
    key: 'elementConfig',
    value: function elementConfig(configKey) {
      var config = Document.config().elements[configKey];

      if (config instanceof Array && config.length) {
        return config.length > 1 ? config.join(', ').trim() : config[0];
      }

      return config;
    }

    /**
     * Returns a jQuery-like version of internal HTML
     *
     * @param {String} html
     * @returns {$}
     */

  }, {
    key: 'query',
    value: function query(html) {
      return _cheerio2.default.load(html);
    }

    /**
     * Returns the container object of a template
     * if one is configured in environment/project
     *
     * @param {String} html
     * @returns {$}
     */

  }, {
    key: 'container',
    value: function container(html) {
      log('$').info('extracting main container element');

      var selector = Document.elementConfig('container');

      if (html && selector) {
        return Document.query(html)(selector);
      }

      return Document.query(html);
    }

    /**
     * Plucks out and reduces elements from HTML based on
     * environment/project configuration
     *
     * @param {String} html
     * @returns {$}
     */

  }, {
    key: 'pluck',
    value: function pluck(html) {
      log('$').info('plucking configured elements');

      var selector = Document.elementConfig('pluck');
      var query = Document.query;

      if (html && selector) {
        return query(selector.split(',').map(function ($) {
          return query(html)($).map(function (i, elem) {
            return query(elem).html();
          }).get();
        }).reduce(function (a, b) {
          return a + b;
        }));
      } else {
        return query(html);
      }
    }

    /**
     * Strips out (removes) elements from HTML based on
     * environment/project configuration
     *
     * @param {String} html
     * @returns {$}
     */

  }, {
    key: 'strip',
    value: function strip(html) {
      log('$').info('stripping configured elements');

      if (html) {
        var selector = Document.elementConfig('strip');
        var query = Document.query(html);

        if (selector) query(selector).remove();

        return query;
      } else {
        return Document.query(html);
      }
    }

    /**
     * Performs templated regex replacements on HTML based on
     * environment/project configuration.
     *
     * Matches may be dynamically referenced in templates
     * by referencing the interpolation token |=$match|
     *
     * @param {String} html
     * @returns {String} resulting HTML
     */

  }, {
    key: 'replace',
    value: function replace(html) {
      log('$').info('replacing configured elements');

      if (html) {
        var replace = Document.config().replace;
        var result = html;

        if (replace instanceof Array) {
          replace.forEach(function (conf) {
            var pattern = new RegExp(conf.match, 'gi');
            var template = conf.template;

            if (pattern && template) {
              result = result.replace(pattern, function ($match) {
                for (var _len = arguments.length, $sub = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                  $sub[_key - 1] = arguments[_key];
                }

                return _hazy2.default.lang.evaluate(template, { $match: $match, $sub: $sub });
              });
            } else {
              log('$').warn('malformed element replacement configuration', conf);
            }
          });
        }

        return result; //Document.query(result) // FIXME - cheerio is escaping only replacements, wut?
      }

      return html; // Document.query(html)
    }

    /**
     * Processes all element configuration filters against HTML
     * and returns the resulting HTML string
     *
     * @param {String} html
     * @returns {String}
     */

  }, {
    key: 'process',
    value: function process(html) {
      log('$').info('processing HTML elements');

      if (Document.config().elements) {
        var containerDom = Document.container(html);
        var pluckedDom = Document.pluck(containerDom.html());
        var strippedDom = Document.strip(pluckedDom.html());
        var bakedHtml = Document.replace(strippedDom.html());

        return bakedHtml;
      }

      return html;
    }

    /**
     * Writes out compiled HTML to a filepath (UTF-8)
     *
     * @param {String} filepath
     * @param {String} html
     * @returns {Promise}
     */

  }, {
    key: 'dest',
    value: function dest(filepath, html) {
      log('$').info('writing out HTML');

      return new Promise(function (resolve, reject) {
        if (filepath) {
          io.util.fs.dest(filepath, html).then(resolve).catch(reject);
        } else {
          reject('HTML filepath required');
        }
      });
    }

    /**
     * Converts a collection of compiled Blueprints
     * into HTML via Aglio
     *
     * @param {Array<Blueprint>} blueprints
     * @returns {Promise}
     */

  }, {
    key: 'fromBlueprints',
    value: function fromBlueprints(blueprints) {
      return Promise.all(blueprints.map(Document.fromBlueprint));
    }

    /**
     * Converts a compiled Blueprint into HTML via Aglio
     *
     * @param {Blueprint} blueprint
     * @returns {Promise}
     */

  }, {
    key: 'fromBlueprint',
    value: function fromBlueprint(blueprint) {
      return new Promise(function (resolve, reject) {
        if (blueprint instanceof _apib.Blueprint && blueprint.compiled) {
          log('aglio').info('creating HTML from API blueprint');

          var locals = { blot: env.current().name, fixtures: blueprint.compiled.fixtures };
          var options = Object.assign({ locals: locals }, Document.config().options);

          _aglio2.default.render(blueprint.compiled.markdown, options, function (err, html, warnings) {
            if (warnings && warnings.length) {
              log('aglio').warn('aglio warned: ' + warnings);
            }

            if (!err) {
              log('aglio').info('parsed HTML');

              resolve(new Document(html));
            } else {
              log('aglio').error('aglio errored: ' + err);

              reject(err);
            }
          });
        } else {
          reject('compiled API blueprint required');
        }
      });
    }
  }]);

  return Document;
}();

/**
 * Module-level bunyan logger
 */


var log = exports.log = function log(sub) {
  return (0, _log.logger)().child({ module: sub ? 'html.' + sub : 'html' });
};