define [
  "use!underscore",
  "use!backbone"
], (_, Backbone) ->

  # Лейаут
  class Layout

    id: null
    app: null
    module: null

    _configs: null
    _layoutView: null


    constructor: (options = {}) ->
      @_configs = {}
      @id = _.uniqueId("layout_")
      _.extend @, options


    config: (config) ->
      if typeof config == 'string'
        return @_configs[config]

      if _.isObject config
        @_configs = _.extend @_configs || {}, config


    show: (context, callback) ->
      callback = callback || context

      if (!_.isFunction(callback))
        callback = null

      @app.currentModule @module

      if not @_layoutView
        @_layoutView = new LayoutView
          el: @config "el"
          template: @config "template"
          app: @app
          context: context

      # чтобы не рендерить лишний раз
      if @_layoutView.$el.data('layout-id') == @id
        callback? @_layoutView
        return

      @_layoutView.$el.data 'layout-id', @id

      require @config("deps") || [], =>
        @_layoutView.render callback



  # Вьюшка для лейаута
  class LayoutView extends Backbone.View
    render: (action) ->
      @options.app.template (@template || @options.template), @options.context, (text) =>
        @$el.html text
        action(@) if action


  Layout
