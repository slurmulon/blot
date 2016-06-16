'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nothing = exports.logger = exports.core = undefined;

var _env = require('./env');

var env = _interopRequireWildcard(_env);

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

var _bunyanPrettystream = require('bunyan-prettystream');

var _bunyanPrettystream2 = _interopRequireDefault(_bunyanPrettystream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var prettyStdOut = new _bunyanPrettystream2.default();
prettyStdOut.pipe(process.stdout);

var core = exports.core = {
  raw: _bunyan2.default.createLogger({ name: 'blot' }),
  pretty: _bunyan2.default.createLogger({
    name: 'blot',
    streams: [{
      level: 'debug',
      type: 'raw',
      stream: prettyStdOut
    }]
  })
};

var logger = exports.logger = function logger() {
  var enviro = env.current();
  var enabled = enviro.logging || enviro.pretty;
  var pretty = enviro.pretty;

  if (enabled) {
    return pretty ? core.pretty : core.raw;
  }

  return nothing;
};

var nothing = exports.nothing = function () {
  var noop = function noop(_) {
    return _;
  };
  var notta = { info: noop, warn: noop, error: noop };

  return Object.assign(notta, { child: function child() {
      return notta;
    } });
}();