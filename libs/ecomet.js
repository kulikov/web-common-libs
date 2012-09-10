// Generated by CoffeeScript 1.3.3
(function() {

  define(["use!underscore", "use!sockjs", "use!backbone"], function(_, SockJS, Backbone) {
    var Ecomet, SockJSAdapter;
    Ecomet = (function() {

      Ecomet.prototype._options = {
        host: 'http://' + window.location.host,
        port: '',
        authUrl: '/auth',
        bufferTime: 1000,
        maxErrorReconnect: 4
      };

      Ecomet.prototype._subsBuffer = [];

      Ecomet.prototype._bufferTimeout = null;

      Ecomet.prototype._allSubscriptions = [];

      Ecomet.prototype._alreadyAuth = null;

      Ecomet.prototype._socket = null;

      Ecomet.connect = function(options) {
        if (options == null) {
          options = {};
        }
        return new Ecomet(options);
      };

      function Ecomet(options) {
        this._socket = new SockJSAdapter(this);
        _.extend(this._options, options);
      }

      Ecomet.prototype.subscribe = function(routeKey, callback) {
        var _subs;
        _subs = {
          'routeKey': routeKey,
          'callback': callback
        };
        this._allSubscriptions.push(_subs);
        this._subsBuffer.push(_subs);
        this.on('ecomet.message.' + routeKey, callback);
        this._checkSubsBuffer();
        return this;
      };

      Ecomet.prototype._checkSubsBuffer = function() {
        var _this = this;
        if (this._bufferTimeout || !this._subsBuffer) {
          return;
        }
        return this._bufferTimeout = setTimeout((function() {
          var subs, _authUrl, _subsData;
          _this._socket.checkConnect();
          _subsData = {
            type: 'subscribe',
            routes: (function() {
              var _i, _len, _ref, _results;
              _ref = this._subsBuffer;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                subs = _ref[_i];
                _results.push(subs.routeKey);
              }
              return _results;
            }).call(_this)
          };
          if (!_this._alreadyAuth) {
            _authUrl = _this._opt('authUrl');
            if (_authUrl.substring(0, 1) === '/') {
              _authUrl = window.location.protocol + '//' + window.location.host + _authUrl;
            }
            _subsData.auth = {
              authUrl: _authUrl,
              cookie: document.cookie
            };
          }
          _this._subsBuffer = [];
          _this._bufferTimeout = null;
          _this._alreadyAuth = true;
          return _this._socket.send(_subsData);
        }), this._opt('bufferTime'));
      };

      Ecomet.prototype._opt = function(name) {
        return this._options[name];
      };

      return Ecomet;

    })();
    _.extend(Ecomet.prototype, Backbone.Events);
    SockJSAdapter = (function() {

      SockJSAdapter.prototype._client = null;

      SockJSAdapter.prototype._sendBuffer = [];

      SockJSAdapter.prototype._isError = false;

      SockJSAdapter.prototype._disconnectCnt = 0;

      SockJSAdapter.prototype._disconnectTimeout = null;

      function SockJSAdapter(ecomet) {
        this.ecomet = ecomet;
      }

      SockJSAdapter.prototype.checkConnect = function() {
        var _host,
          _this = this;
        if (this._client) {
          return;
        }
        _host = this.ecomet._opt('host');
        this._client = new SockJS((_host.match(/https?:\/\//) ? '' : window.location.protocol + '//') + _host + '/ecomet', null, {
          devel: true,
          debug: true
        });
        this._client.onopen = function() {
          _this._checkSendBuffer();
          _this.ecomet.trigger('ecomet.connect');
          return _this._disconnectTimeout = setTimeout((function() {
            return _this._disconnectCnt = 0;
          }), 10000);
        };
        this._client.onmessage = function(event) {
          var _data;
          _data = JSON.parse(event.data);
          return _this.ecomet.trigger('ecomet.message.' + _data.event, _data.message);
        };
        return this._client.onclose = function() {
          _this.ecomet.trigger('ecomet.disconnect');
          _this._client = null;
          return _this._reconnect();
        };
      };

      SockJSAdapter.prototype.send = function(message) {
        this._sendBuffer.push(message);
        return this._checkSendBuffer();
      };

      SockJSAdapter.prototype._reconnect = function() {
        if (!this._isError && this.ecomet._allSubscriptions) {
          clearTimeout(this._disconnectTimeout);
          this._disconnectCnt += 1;
          this.ecomet._alreadyAuth = false;
          if (this._disconnectCnt >= this.ecomet._opt('maxErrorReconnect')) {
            this.ecomet.trigger('ecomet.connection.error');
            this._isError = true;
            return;
          }
          this.ecomet._subsBuffer = this.ecomet._allSubscriptions;
          return this.ecomet._checkSubsBuffer();
        }
      };

      SockJSAdapter.prototype._checkSendBuffer = function() {
        var msg, _i, _len, _messages, _results;
        if (!this._client || this._client.readyState !== SockJS.OPEN || !this._sendBuffer.length) {
          return;
        }
        _messages = this._sendBuffer;
        this._sendBuffer = [];
        _results = [];
        for (_i = 0, _len = _messages.length; _i < _len; _i++) {
          msg = _messages[_i];
          _results.push(this._client.send(JSON.stringify(msg)));
        }
        return _results;
      };

      return SockJSAdapter;

    })();
    return Ecomet;
  });

}).call(this);
