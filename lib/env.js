'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.current = exports.configure = exports.Config = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.use = use;

var _config = require('config.json');

var fsConfig = _interopRequireWildcard(_config);

var _hazy = require('hazy');

var _hazy2 = _interopRequireDefault(_hazy);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _io = require('./io');

var _lodash = require('lodash.isplainobject');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var enviros = {};
var selected = null;

/**
 * Project environment configuration.
 * Binds certain data to fixture pool
 * so it can be accessed in documentation.
 */

var Config = exports.Config = function () {

  /**
   * @param {String} name key-friendly name of the environment
   * @param {String} source path of original configuration project file
   * @param {String} base base path for all other paths in blot
   * @param {String} host API host (for use in docs)
   * @param {String} docs I/O configuration for docs
   * @param {String} fixtures I/O configuration for fixtures
   * @param {String} logging whether or not to print standardized logs
   * @param {String} pretty whether ot not to print pretty logs
   */

  function Config(name, source, base, host, docs, fixtures, view) {
    var echo = arguments.length <= 7 || arguments[7] === undefined ? false : arguments[7];
    var logging = arguments.length <= 8 || arguments[8] === undefined ? false : arguments[8];
    var pretty = arguments.length <= 9 || arguments[9] === undefined ? false : arguments[9];

    _classCallCheck(this, Config);

    this.source = source;
    this.name = name || 'root';
    this.base = base || '.';
    this.host = host || '127.0.0.1';
    this.docs = docs || { src: '', dest: '', export: false };
    this.fixtures = fixtures || { src: '', dest: '', export: false };
    this.view = view || { dest: '', export: false, theme: {}, elements: {}, attrs: {} };

    this.echo = echo;
    this.logging = logging;
    this.pretty = pretty;

    enviros[source || name] = this;
  }

  /**
   * Adjusts provided filepath to be project/environment-specific
   *
   * @param {String} filepath
   * @returns {String} filepath adjusted to project base path
   */


  _createClass(Config, [{
    key: 'uri',
    value: function uri(filepath) {
      return _path2.default.resolve(this.base + '/' + filepath);
    }

    /**
     * Provides the expected root file URI for project config
     *
     * @param {String} filepath
     * @returns {String} filepath adjusted to project base path
     */

  }, {
    key: 'rootUri',
    get: function get() {
      return this.source || Config.rootUri(this.name);
    }

    /**
     * Determines whether a blot project file configuration exists
     * or a filepath source has been defined.
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isProject',
    get: function get() {
      return this.source || _io.util.fs.existsAt(this.rootUri);
    }

    /**
     * Determines the expected root file URI for project environment config
     *
     * @param {String} env environment name
     * @returns {String} filepath adjusted to project environment config
     */

  }], [{
    key: 'rootUri',
    value: function rootUri(env) {
      return env && env !== 'root' ? env : './blot.json';
    }

    /**
     * Determines if a blot project file configuration exists for enviro
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isProject',
    value: function isProject(env) {
      return _io.util.fs.existsAt(Config.rootUri(env));
    }

    /**
     * Loads a blot project configuration file and parses it
     *
     * @param {String} filepath
     * @returns {Promise}
     */

  }, {
    key: 'src',
    value: function src(filepath) {
      return new Promise(function (resolve, reject) {
        var envPath = _path2.default.resolve(filepath || Config.rootUri());

        return _fs2.default.readFile(envPath, 'utf-8', function (err, data) {
          if (!err) {
            resolve(configure(Object.assign(JSON.parse(data), { source: filepath })));
          } else {
            reject('Failed to read in blot environment configuration from ' + _path2.default);
          }
        });
      });
    }

    /**
     * Loads a blot project configuration file, parses it and then
     * establishes it as the selected environment
     *
     * @param {String} envPath environment filepath
     * @param {String} project configuration overrides (typically from CLI)
     * @returns {Promise}
     */

  }, {
    key: 'loadProject',
    value: function loadProject(envPath, options) {
      var chdir = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      return new Promise(function (resolve, reject) {
        Config.src(Config.rootUri(envPath)).then(function (project) {
          // override project config with options (typically CLI) when necessary
          if (options) {
            if (project) {
              Object.assign(project, options);
            } else {
              project = options;
            }
          }

          use(project, chdir);
          resolve(project);
        }).catch(reject);
      });
    }
  }]);

  return Config;
}();

/**
 * Bootstraps and establishes a project environment as the default
 *
 * @param {Config|Object} env
 * @returns {Promise}
 */


function use(project) {
  var chdir = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  if (project instanceof Config || (0, _lodash2.default)(config)) {
    selected = project.source || project.name;
    enviros[selected] = project;

    var usefuls = ['name', 'host', 'base', 'docs', 'fixtures'];

    // register certain useful config objects with hazy for easy access
    usefuls.forEach(function (prop) {
      return _hazy2.default.fixture.register('blot.config.' + prop, project[prop]);
    });

    if (project.source && chdir) {
      process.chdir(_path2.default.dirname(project.source));
    }
  }

  return project;
}

/**
 * Destructured alias for instantiating environment / project Configs
 *
 * @param {Object} arguments configuration object
 * @returns {Config}
 */
var configure = exports.configure = function configure(_ref) {
  var name = _ref.name;
  var source = _ref.source;
  var base = _ref.base;
  var host = _ref.host;
  var docs = _ref.docs;
  var fixtures = _ref.fixtures;
  var view = _ref.view;
  var echo = _ref.echo;
  var logging = _ref.logging;
  var pretty = _ref.pretty;
  return new Config(name, source, base, host, docs, fixtures, view, echo, logging, pretty);
};

/**
 * Provides the currently selected environment in blot
 *
 * @returns {Config|Object}
 */
var current = exports.current = function current() {
  return enviros[selected] || {};
};