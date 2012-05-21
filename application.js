// Generated by CoffeeScript 1.3.1
(function() {

  define(["jquery", "use!underscore", "use!backbone"], function($, _, Backbone) {
    var Application, Module, previousGet;
    Module = (function() {

      Module.name = 'Module';

      Module.prototype.name = null;

      Module.prototype.path = null;

      Module.prototype.app = null;

      Module.prototype.layout = null;

      Module.prototype.routerClass = null;

      function Module(options) {
        if (options == null) {
          options = {};
        }
        _.extend(this, {
          Views: {},
          Models: {},
          Collections: {}
        }, options);
      }

      Module.prototype.init = function() {};

      Module.prototype.routes = function(routeParams) {
        return this.routerClass = this.app.Backbone.Router.extend(routeParams);
      };

      return Module;

    })();
    _.extend(Module.prototype, Backbone.Events);
    previousGet = Backbone.Model.prototype.get;
    Backbone.Model.prototype.get = function(attr) {
      if (typeof this[attr] === 'function') {
        return this[attr]();
      }
      return previousGet.call(this, attr);
    };
    Backbone.Collection.prototype.lazyFetch = function(callback) {
      if (this.models.length) {
        if (callback) {
          return callback();
        }
      } else {
        return this.fetch({
          success: callback,
          silent: true
        });
      }
    };
    Application = (function() {

      Application.name = 'Application';

      Application.prototype.layoutClass = null;

      Application.prototype.templaterClass = null;

      Application.prototype.Backbone = Backbone;

      Application.prototype._templater = null;

      Application.prototype._modules = null;

      Application.prototype._configs = null;

      Application.prototype._currentModule = null;

      function Application(options) {
        if (options == null) {
          options = {};
        }
        this._configs = {};
        this._modules = {};
        _.extend(this, options);
      }

      Application.prototype.template = function(tmplPath, context, callback) {
        if (this._templater == null) {
          this._templater = new this.templaterClass(this);
        }
        return this._templater.render(tmplPath, context, callback);
      };

      Application.prototype.collection = function(collection, params) {
        var _ref;
        return (_ref = collection.__instance) != null ? _ref : collection.__instance = new collection(params);
      };

      Application.prototype.view = function(view, options) {
        if (view.__instance == null) {
          view.__instance = new view(options);
        }
        if (options) {
          view.__instance._configure(options);
        }
        return view.__instance;
      };

      Application.prototype.currentModule = function(module) {
        if (module) {
          this._currentModule = module;
        }
        return this._currentModule;
      };

      Application.prototype.config = function(config) {
        if (typeof config === 'string') {
          return this._configs[config];
        }
        if (_.isObject(config)) {
          return _.extend(this._configs, config);
        }
      };

      Application.prototype.initBaseRouter = function(routerParams) {
        var _app;
        new (this.Backbone.Router.extend(routerParams));
        _app = this;
        return $(document).on("click", "a:not([data-bypass])", function(evt) {
          var href, protocol;
          href = $(this).attr("href");
          protocol = this.protocol + "//";
          if (href && href.slice(0, protocol.length) !== protocol && href.indexOf("javascript:") !== 0) {
            evt.preventDefault();
            return _app.Backbone.history.navigate(href, true);
          }
        });
      };

      Application.prototype.initModules = function(modules) {
        return require(modules, function() {
          var i, module, _i, _len;
          for (i = _i = 0, _len = arguments.length; _i < _len; i = ++_i) {
            module = arguments[i];
            module.path = modules[i];
            module.init();
            if (module.routerClass) {
              new module.routerClass;
            }
          }
          return this.Backbone.history.start({
            pushState: true
          });
        });
      };

      Application.prototype.module = function(name, extraParams) {
        if (!this._modules[name]) {
          this._modules[name] = new Module({
            name: name,
            app: this
          });
          this._modules[name].layout = new this.layoutClass({
            app: this,
            module: this._modules[name]
          });
        }
        if (extraParams) {
          _.extend(this._modules[name], extraParams);
        }
        return this._modules[name];
      };

      return Application;

    })();
    return Application;
  });

}).call(this);