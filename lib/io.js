'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = exports.util = undefined;

var _apib = require('./apib');

var _env = require('./env');

var env = _interopRequireWildcard(_env);

var _hazy = require('hazy');

var _hazy2 = _interopRequireDefault(_hazy);

var _protagonist = require('protagonist');

var _protagonist2 = _interopRequireDefault(_protagonist);

var _hercule = require('hercule');

var _hercule2 = _interopRequireDefault(_hercule);

var _glob2 = require('glob');

var _glob3 = _interopRequireDefault(_glob2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkpath = require('mkpath');

var _mkpath2 = _interopRequireDefault(_mkpath);

var _log = require('./log');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Writes UTF-8 data to the provided path
 *
 * @param {String} filepath
 * @param {Object} data
 * @returns {Boolean}
 */
var util = exports.util = {
  fs: {
    /**
     * Reads in UTF-8 data from the provided path
     *
     * @param {String} filepath
     * @param {Object} data
     * @returns {Boolean}
     */
    src: function src(filepath, andThen) {
      return new Promise(function (resolve, reject) {
        _fs2.default.readFile(filepath, 'utf-8', function (err, data) {
          if (!err) {
            if (andThen instanceof Function) {
              andThen(data).then(resolve).catch(reject);
            } else {
              resolve(data);
            }
          } else {
            reject('failed to read file: ' + err);
          }
        });
      });
    },

    /**
     * Writes UTF-8 data to the provided path
     *
     * @param {String} filepath
     * @param {Object} data
     * @returns {Boolean}
     */
    dest: function dest(filepath, data) {
      return new Promise(function (resolve, reject) {
        var relDir = _path2.default.dirname(filepath);

        (0, _mkpath2.default)(relDir, function (err) {
          if (!err) {
            _fs2.default.writeFile(filepath, data, 'utf-8', function (err) {
              if (!err) {
                log().info('exported content to ' + filepath);

                resolve(data);
              } else {
                reject('error occured while writing file: ' + err);
              }
            });
          } else {
            reject('error occured while scaffolding destination folders: ${err}');
          }
        });
      });
    },

    /**
     * Determines if a file exists at the provided path
     *
     * @param {String} filepath
     * @returns {Boolean}
     */
    existsAt: function existsAt(filepath) {
      try {
        _fs2.default.accessSync(_path2.default.resolve(filepath), _fs2.default.R_OK);

        return true;
      } catch (e) {
        return false;
      }
    }
  }

  // TODO uri
};

/**
 * Module-level bunyan logger
 */
var log = exports.log = function log() {
  return (0, _log.logger)().child({ module: 'io' });
};