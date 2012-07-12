define [
  "jquery"
  "use!underscore"
  "use!backbone"
], ($, _, Backbone) ->


  # Модуль
  class Module

    name: null
    path: null
    app: null
    layout: null
    routerClass: null

    constructor: (options = {}) ->
      _.extend @, { Views: {}, Models: {}, Collections: {} }, options

    init: ->

    # Определяем роуты для модуля
    routes: (routeParams) ->
      @routerClass = @app.Backbone.Router.extend routeParams


  # подмешиваем в модуль движок событий
  _.extend Module::, Backbone.Events



  # Расширяем модель бекбона
  # Позволяет переопределять проперти модели одноименным методом
  previousGet = Backbone.Model.prototype.get
  Backbone.Model.prototype.get = (attr) ->
    if typeof @[attr] == 'function'
      return @[attr]()
    previousGet.call this, attr


  # Ленивая загрузка коллекции
  Backbone.Collection.prototype.lazyFetch = (callback) ->
    if @models.length
      callback() if callback
    else
      @fetch { success: callback, silent: true }
    @


  # Приложение
  class Application

    layoutClass: null
    templaterClass: null

    # Враппер для бекбона, на случае если понадобится переопределить какой-либо его класс
    Backbone: Backbone

    _templater: null
    _modules: null
    _configs: null
    _currentModule: null

    constructor: (options = {}) ->
      @_configs = {}
      @_modules = {}
      _.extend @, options


    # Загружаем, рендерим и кешируем шаблон
    template: (tmplPath, context, callback) ->
      @_templater ?= new @templaterClass @
      @_templater.render tmplPath, context, callback

    # кеш для коллекций
    collection: (collection, params) ->
      collection.__instance ?= new collection params

    # кеш для вьюшек
    view: (view, options) ->
      view.__instance ?= new view(options)
      view.__instance._configure(options) if options
      view.__instance

    # текущий активный модуль
    currentModule: (module) ->
      @_currentModule = module if module
      @_currentModule

    config: (config) ->
      if typeof config == 'string'
        return @_configs[config]

      if _.isObject config
        _.extend @_configs, config


    # начальная инициализация приложения — вешаем обработчик переходов по ссылкам
    initBaseRouter: (routerParams) ->
      new (@Backbone.Router.extend routerParams)

      _app = @
      $(document).on "click", "a:not([data-bypass])", (evt) ->
        href = $(@).prop "href"
        root = location.protocol + "//" + location.host

        # проверяем что ссылка ведет на наш сайт (домен и протокол)
        if href and href.indexOf(root) == 0
          evt.preventDefault()

          href = href.slice root.length
          href = href.replace /[/# ]*$/g, '' # rtrim / # and spaces
          _app.Backbone.history.navigate href, false
          _app.Backbone.history.loadUrl href


    # алиас для перехода на новый урл
    navigate: (href, options) ->
      @Backbone.history.navigate(href, options)


    # подгружаем и инициализируем все модули
    initModules: (modules) ->
      require modules, ->
        for module, i in arguments
          module.path = modules[i]
          module.init()
          new module.routerClass if module.routerClass

        @Backbone.history.start pushState: true


    # создает новый или возвращает уже существующий модуль по его имени
    module: (name, extraParams) ->

      if not @_modules[name]
        @_modules[name] = new Module
          name: name
          app: @

        @_modules[name].layout = new @layoutClass
          app: @
          module: @_modules[name]

      _.extend(@_modules[name], extraParams) if extraParams

      @_modules[name]


  Application
