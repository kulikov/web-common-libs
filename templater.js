// Generated by CoffeeScript 1.3.3
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(["use!underscore", "use!dust", "use!md5"], function(_, dust, md5) {
    var Templater, _round;
    _round = function(n) {
      if (n < 10) {
        return "0" + n;
      } else {
        return n;
      }
    };
    _.extend(dust.filters, {
      "upper": function(text) {
        return text.toUpperCase();
      },
      "lower": function(text) {
        return text.toLowerCase();
      },
      "md5": md5,
      "date": function(time) {
        var d;
        d = new Date(time);
        return _round(d.getDate()) + "." + _round(d.getMonth()) + "." + d.getFullYear() + " " + _round(d.getHours()) + ":" + _round(d.getMinutes());
      },
      "time": function(time) {
        var d;
        d = new Date(time);
        return _round(d.getHours()) + ":" + _round(d.getMinutes());
      }
    });
    dust.onLoad = function(tmplPath, callback) {
      return require(["text!" + tmplPath], function(tplString) {
        return callback(null, tplString);
      });
    };
    Templater = (function() {

      Templater.prototype.baseContext = null;

      function Templater(app) {
        this.app = app;
        this._parseClassPath = __bind(this._parseClassPath, this);

        this._buildBaseContext = __bind(this._buildBaseContext, this);

        this.render = __bind(this.render, this);

        this.baseContext = this._buildBaseContext();
      }

      Templater.prototype.render = function(tmplPath, context, callback) {
        var _ref;
        if (_.isFunction(context) && !callback) {
          _ref = [context, {}], callback = _ref[0], context = _ref[1];
        }
        return dust.render(tmplPath, this.baseContext.push(context), function(err, output) {
          if (err) {
            console.log(err);
          }
          return callback(output, err);
        });
      };

      Templater.prototype._buildBaseContext = function() {
        var _this = this;
        return dust.makeBase({
          block: function(chunk, context, bodies, params) {
            var _callback, _module, _uniqId, _viewParams;
            _uniqId = _.uniqueId('wblock_');
            chunk.write("<div id='" + _uniqId + "'></div>");
            if (!params.view) {
              throw new TypeError("Undefined widget name!");
            }
            _viewParams = _this._parseClassPath(params.view);
            _module = _viewParams.module;
            _callback = function(triggerContext) {
              var _v;
              params.el = $('#' + _uniqId);
              params.context = triggerContext;
              if ((_v = params.el.data("view"))) {
                _v._configure(params);
                _v.setElement('#' + _uniqId);
                _v.render({
                  silent: true
                });
                return;
              }
              return require(_viewParams.deps, function() {
                var view;
                view = new _module.Views[_viewParams.name](params);
                view.name = _uniqId;
                view.setElement('#' + _uniqId);
                view.render();
                return params.el.data("view", view);
              });
            };
            if (params.on) {
              _module.off(params.on);
              return _module.on(params.on, _callback);
            } else {
              return _.defer(_callback);
            }
          },
          chosen: function(chunk, context, bodies, params) {
            var _callback, _collectParams, _ref, _uniqId;
            _uniqId = _.uniqueId('wchosen_');
            chunk.write("<select id='" + _uniqId + "' name='" + params.name + "' data-placeholder='" + ((_ref = params.placeholder) != null ? _ref : '') + "'></select>");
            _collectParams = _this._parseClassPath(params.collection);
            _callback = function() {
              _collectParams.deps.push("use!chosen");
              return require(_collectParams.deps, function() {
                var collection, _render;
                collection = _this.app.collection(_collectParams.module.Collections[_collectParams.name]);
                _render = function() {
                  var _options, _select;
                  _options = ['<option/>'];
                  collection.each(function(item) {
                    return _options.push("<option value='" + (item.get('id')) + "'>" + (item.get('fullName') || item.get('name')) + "</option>");
                  });
                  _select = $('#' + _uniqId).html(_options.join(""));
                  if (params.value) {
                    _select.find("option[value=" + params.value + "]").attr("selected", true);
                    $('#' + _uniqId).trigger('change');
                  }
                  return _select.chosen();
                };
                return collection.lazyFetch(_render);
              });
            };
            if (params.on) {
              _collectParams.module.off(params.on);
              return _collectParams.module.on(params.on, _callback);
            } else {
              return _.defer(_callback);
            }
          }
        });
      };

      Templater.prototype._parseClassPath = function(path, callback) {
        var _deps, _matches, _module, _pathes;
        _module = null;
        _matches = path.match(/(\S+)\s*:\s*(\S+)/);
        if (_matches != null) {
          _module = this.app.module(_matches[1]);
          path = _matches[2];
        } else {
          _module = this.app.currentModule();
        }
        _deps = [];
        _pathes = path.match(/^(.+)\/([^\/]+)$/);
        if (_pathes != null) {
          _deps.push(_module.path.replace(/[^\/]+$/, '') + _pathes[1]);
          path = _pathes[2];
        }
        return {
          name: path,
          module: _module,
          deps: _deps
        };
      };

      return Templater;

    })();
    return Templater;
  });

}).call(this);
