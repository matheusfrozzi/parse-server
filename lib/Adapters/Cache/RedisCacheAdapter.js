"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.RedisCacheAdapter = void 0;

var _redis = _interopRequireDefault(require("redis"));

var _logger = _interopRequireDefault(require("../../logger"));

var _KeyPromiseQueue = require("../../KeyPromiseQueue");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DEFAULT_REDIS_TTL = 30 * 1000; // 30 seconds in milliseconds

const FLUSH_DB_KEY = '__flush_db__';

function debug(...args) {
  const message = ['RedisCacheAdapter: ' + arguments[0]].concat(args.slice(1, args.length));

  _logger.default.debug.apply(_logger.default, message);
}

const isValidTTL = ttl => typeof ttl === 'number' && ttl > 0;

class RedisCacheAdapter {
  constructor(redisCtx, ttl = DEFAULT_REDIS_TTL) {
    this.ttl = isValidTTL(ttl) ? ttl : DEFAULT_REDIS_TTL;
    this.client = _redis.default.createClient(redisCtx);
    this.queue = new _KeyPromiseQueue.KeyPromiseQueue();
  }

  handleShutdown() {
    if (!this.client) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.client.quit(err => {
        if (err) {
          _logger.default.error('RedisCacheAdapter error on shutdown', {
            error: err
          });
        }

        resolve();
      });
    });
  }

  get(key) {
    debug('get', {
      key
    });
    return this.queue.enqueue(key, () => new Promise(resolve => {
      this.client.get(key, function (err, res) {
        debug('-> get', {
          key,
          res
        });

        if (!res) {
          return resolve(null);
        }

        resolve(JSON.parse(res));
      });
    }));
  }

  put(key, value, ttl = this.ttl) {
    value = JSON.stringify(value);
    debug('put', {
      key,
      value,
      ttl
    });

    if (ttl === 0) {
      // ttl of zero is a logical no-op, but redis cannot set expire time of zero
      return this.queue.enqueue(key, () => Promise.resolve());
    }

    if (ttl === Infinity) {
      return this.queue.enqueue(key, () => new Promise(resolve => {
        this.client.set(key, value, function () {
          resolve();
        });
      }));
    }

    if (!isValidTTL(ttl)) {
      ttl = this.ttl;
    }

    return this.queue.enqueue(key, () => new Promise(resolve => {
      this.client.psetex(key, ttl, value, function () {
        resolve();
      });
    }));
  }

  del(key) {
    debug('del', {
      key
    });
    return this.queue.enqueue(key, () => new Promise(resolve => {
      this.client.del(key, function () {
        resolve();
      });
    }));
  }

  clear() {
    debug('clear');
    return this.queue.enqueue(FLUSH_DB_KEY, () => new Promise(resolve => {
      this.client.flushdb(function () {
        resolve();
      });
    }));
  } // Used for testing


  async getAllKeys() {
    return new Promise((resolve, reject) => {
      this.client.keys('*', (err, keys) => {
        if (err) {
          reject(err);
        } else {
          resolve(keys);
        }
      });
    });
  }

}

exports.RedisCacheAdapter = RedisCacheAdapter;
var _default = RedisCacheAdapter;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BZGFwdGVycy9DYWNoZS9SZWRpc0NhY2hlQWRhcHRlci5qcyJdLCJuYW1lcyI6WyJERUZBVUxUX1JFRElTX1RUTCIsIkZMVVNIX0RCX0tFWSIsImRlYnVnIiwiYXJncyIsIm1lc3NhZ2UiLCJhcmd1bWVudHMiLCJjb25jYXQiLCJzbGljZSIsImxlbmd0aCIsImxvZ2dlciIsImFwcGx5IiwiaXNWYWxpZFRUTCIsInR0bCIsIlJlZGlzQ2FjaGVBZGFwdGVyIiwiY29uc3RydWN0b3IiLCJyZWRpc0N0eCIsImNsaWVudCIsInJlZGlzIiwiY3JlYXRlQ2xpZW50IiwicXVldWUiLCJLZXlQcm9taXNlUXVldWUiLCJoYW5kbGVTaHV0ZG93biIsIlByb21pc2UiLCJyZXNvbHZlIiwicXVpdCIsImVyciIsImVycm9yIiwiZ2V0Iiwia2V5IiwiZW5xdWV1ZSIsInJlcyIsIkpTT04iLCJwYXJzZSIsInB1dCIsInZhbHVlIiwic3RyaW5naWZ5IiwiSW5maW5pdHkiLCJzZXQiLCJwc2V0ZXgiLCJkZWwiLCJjbGVhciIsImZsdXNoZGIiLCJnZXRBbGxLZXlzIiwicmVqZWN0Iiwia2V5cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0FBRUEsTUFBTUEsaUJBQWlCLEdBQUcsS0FBSyxJQUEvQixDLENBQXFDOztBQUNyQyxNQUFNQyxZQUFZLEdBQUcsY0FBckI7O0FBRUEsU0FBU0MsS0FBVCxDQUFlLEdBQUdDLElBQWxCLEVBQTZCO0FBQzNCLFFBQU1DLE9BQU8sR0FBRyxDQUFDLHdCQUF3QkMsU0FBUyxDQUFDLENBQUQsQ0FBbEMsRUFBdUNDLE1BQXZDLENBQThDSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWNKLElBQUksQ0FBQ0ssTUFBbkIsQ0FBOUMsQ0FBaEI7O0FBQ0FDLGtCQUFPUCxLQUFQLENBQWFRLEtBQWIsQ0FBbUJELGVBQW5CLEVBQTJCTCxPQUEzQjtBQUNEOztBQUVELE1BQU1PLFVBQVUsR0FBR0Ms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SW5CLEdBQUosRUFBUztBQUNQa0IsVUFBQUEsTUFBTSxDQUFDbEIsR0FBRCxDQUFOO0FBQ0QsU0FGRCxNQUVPO0FBQ0xGLFVBQUFBLE9BQU8sQ0FBQ3FCLElBQUQsQ0FBUDtBQUNEO0FBQ0YsT0FORDtBQU9ELEtBUk0sQ0FBUDtBQVNEOztBQS9HNEI7OztlQWtIaEIvQixpQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCByZWRpcyBmcm9tICdyZWRpcyc7XG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4uLy4uL2xvZ2dlcic7XG5pbXBvcnQgeyBLZXlQcm9taXNlUXVldWUgfSBmcm9tICcuLi8uLi9LZXlQcm9taXNlUXVldWUnO1xuXG5jb25zdCBERUZBVUxUX1JFRElTX1RUTCA9IDMwICogMTAwMDsgLy8gMzAgc2Vjb25kcyBpbiBtaWxsaXNlY29uZHNcbmNvbnN0IEZMVVNIX0RCX0tFWSA9ICdfX2ZsdXNoX2RiX18nO1xuXG5mdW5jdGlvbiBkZWJ1ZyguLi5hcmdzOiBhbnkpIHtcbiAgY29uc3QgbWVzc2FnZSA9IFsnUmVkaXNDYWNoZUFkYXB0ZXI6ICcgKyBhcmd1bWVudHNbMF1dLmNvbmNhdChhcmdzLnNsaWNlKDEsIGFyZ3MubGVuZ3RoKSk7XG4gIGxvZ2dlci5kZWJ1Zy5hcHBseShsb2dnZXIsIG1lc3NhZ2UpO1xufVxuXG5jb25zdCBpc1ZhbGlkVFRMID0gdHRsID0+IHR5cGVvZiB0dGwgPT09ICdudW1iZXInICYmIHR0bCA+IDA7XG5cbmV4cG9ydCBjbGFzcyBSZWRpc0NhY2hlQWRhcHRlciB7XG4gIGNvbnN0cnVjdG9yKHJlZGlzQ3R4LCB0dGwgPSBERUZBVUxUX1JFRElTX1RUTCkge1xuICAgIHRoaXMudHRsID0gaXNWYWxpZFRUTCh0dGwpID8gdHRsIDogREVGQVVMVF9SRURJU19UVEw7XG4gICAgdGhpcy5jbGllbnQgPSByZWRpcy5jcmVhdGVDbGllbnQocmVkaXNDdHgpO1xuICAgIHRoaXMucXVldWUgPSBuZXcgS2V5UHJvbWlzZVF1ZXVlKCk7XG4gIH1cblxuICBoYW5kbGVTaHV0ZG93bigpIHtcbiAgICBpZiAoIXRoaXMuY2xpZW50KSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIHRoaXMuY2xpZW50LnF1aXQoZXJyID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGxvZ2dlci5lcnJvcignUmVkaXNDYWNoZUFkYXB0ZXIgZXJyb3Igb24gc2h1dGRvd24nLCB7IGVycm9yOiBlcnIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBnZXQoa2V5KSB7XG4gICAgZGVidWcoJ2dldCcsIHsga2V5IH0pO1xuICAgIHJldHVybiB0aGlzLnF1ZXVlLmVucXVldWUoXG4gICAgICBrZXksXG4gICAgICAoKSA9PlxuICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICB0aGlzLmNsaWVudC5nZXQoa2V5LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgICAgIGRlYnVnKCctPiBnZXQnLCB7IGtleSwgcmVzIH0pO1xuICAgICAgICAgICAgaWYgKCFyZXMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKEpTT04ucGFyc2UocmVzKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIHB1dChrZXksIHZhbHVlLCB0dGwgPSB0aGlzLnR0bCkge1xuICAgIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIGRlYnVnKCdwdXQnLCB7IGtleSwgdmFsdWUsIHR0bCB9KTtcblxuICAgIGlmICh0dGwgPT09IDApIHtcbiAgICAgIC8vIHR0bCBvZiB6ZXJvIGlzIGEgbG9naWNhbCBuby1vcCwgYnV0IHJlZGlzIGNhbm5vdCBzZXQgZXhwaXJlIHRpbWUgb2YgemVyb1xuICAgICAgcmV0dXJuIHRoaXMucXVldWUuZW5xdWV1ZShrZXksICgpID0+IFByb21pc2UucmVzb2x2ZSgpKTtcbiAgICB9XG5cbiAgICBpZiAodHRsID09PSBJbmZpbml0eSkge1xuICAgICAgcmV0dXJuIHRoaXMucXVldWUuZW5xdWV1ZShcbiAgICAgICAga2V5LFxuICAgICAgICAoKSA9PlxuICAgICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgdGhpcy5jbGllbnQuc2V0KGtleSwgdmFsdWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCFpc1ZhbGlkVFRMKHR0bCkpIHtcbiAgICAgIHR0bCA9IHRoaXMudHRsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnF1ZXVlLmVucXVldWUoXG4gICAgICBrZXksXG4gICAgICAoKSA9PlxuICAgICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICB0aGlzLmNsaWVudC5wc2V0ZXgoa2V5LCB0dGwsIHZhbHVlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGRlbChrZXkpIHtcbiAgICBkZWJ1ZygnZGVsJywgeyBrZXkgfSk7XG4gICAgcmV0dXJuIHRoaXMucXVldWUuZW5xdWV1ZShcbiAgICAgIGtleSxcbiAgICAgICgpID0+XG4gICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIHRoaXMuY2xpZW50LmRlbChrZXksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgZGVidWcoJ2NsZWFyJyk7XG4gICAgcmV0dXJuIHRoaXMucXVldWUuZW5xdWV1ZShcbiAgICAgIEZMVVNIX0RCX0tFWSxcbiAgICAgICgpID0+XG4gICAgICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgIHRoaXMuY2xpZW50LmZsdXNoZGIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICk7XG4gIH1cblxuICAvLyBVc2VkIGZvciB0ZXN0aW5nXG4gIGFzeW5jIGdldEFsbEtleXMoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuY2xpZW50LmtleXMoJyonLCAoZXJyLCBrZXlzKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKGtleXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSZWRpc0NhY2hlQWRhcHRlcjtcbiJdfQ==