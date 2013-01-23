define [
  "use!underscore"
  "use!dust"
  "use!md5"
], (_, dust, md5) ->

  _round = (n) ->
    if n < 10 then "0" + n else n

  # Кастомные фильтры
  _.extend dust.filters,
    "upper": (text) -> text.toUpperCase()
    "lower": (text) -> text.toLowerCase()
    "md5": md5

    "date": (time) ->
      d = new Date(time)
      _round(d.getDate()) + "." + _round(d.getMonth() + 1) + "." + d.getFullYear() + " " + _round(d.getHours()) + ":" + _round(d.getMinutes())

    "time": (time) ->
      d = new Date(time)
      _round(d.getHours()) + ":" + _round(d.getMinutes())

    "dump": (obj) -> JSON.stringify(obj)


  # подгружаем шаблоны из файлов
  dust.onLoad = (tmplPath, callback) ->
    require ["text!" + tmplPath], (tplString) ->
      callback null, tplString


  class Templater

    baseContext: null

    constructor: (@app) ->
      @baseContext = @_buildBaseContext()

    render: (tmplPath, context, callback) =>
      if _.isFunction(context) && !callback
        [callback, context] = [context, {}]

      dust.render tmplPath, @baseContext.push(context), (err, output) ->
        console.log err if err
        callback output, err


    _buildBaseContext: =>
      dust.makeBase

        #
        # Блок-виджет
        #
        block: (chunk, context, bodies, params) =>
          _uniqId = _.uniqueId 'wblock_'
          chunk.write "<div id='#{ _uniqId }'></div>"

          if not params.view
            throw new TypeError "Undefined widget name!"

          _viewParams = @_parseClassPath params.view
          _module = _viewParams.module

          _callback = (triggerContext) =>
            params.el = $('#' + _uniqId)

            if params.class
              $('#' + _uniqId).addClass(params.class)

            params.context = triggerContext

            if (_v = params.el.data("view"))
              _v._configure(params)
              _v.setElement('#' + _uniqId)
              _v.render silent: true
              return

            require _viewParams.deps, =>
              view = new _module.Views[_viewParams.name](params)
              view.name = _uniqId
              view.setElement('#' + _uniqId)
              view.render()
              params.el.data("view", view)

          if params.on
            _module.off params.on
            _module.on params.on, _callback
          else
            _.defer _callback


        #
        # Выпадайка chosen
        #
        chosen: (chunk, context, bodies, params) =>
          _uniqId = _.uniqueId 'wchosen_'
          chunk.write "<select id='#{_uniqId}' name='#{params.name ? ''}' style='#{params.style ? ''}'  data-placeholder='#{params.placeholder ? ''}' #{params.attr ? ''}><option value='#{params.selected || ''}' selected='true'/></select>"

          _collectParams = @_parseClassPath params.collection

          _collectionFiltered = (collection) =>
            if params?.filter
              _(collection.filter(params?.filter))
            else
              collection

          _callback = =>
            _collectParams.deps.push "use!chosen"
            require _collectParams.deps, =>
              collection = @app.collection _collectParams.module.Collections[_collectParams.name]

              _render = ->
                _options = ['<option/>']
                _collectionFiltered(collection).each (item) ->
                  _options.push "<option value='#{ item.get('id') }'>#{ item.get('fullName') || item.get('name') }</option>"
                _select = $('#' + _uniqId).html(_options.join "")

                if params.selected
                  _select.find("option[value=" + (if params.selected.push then params.selected else [params.selected]).join("], option[value=") + "]").attr("selected", true)

                _select.chosen()

              collection.lazyFetch _render

          if params.on
            _collectParams.module.off params.on
            _collectParams.module.on params.on, _callback
          else
            _.defer _callback


    _parseClassPath: (path, callback) =>

      # if module name isset in path (like "module.name : ClassName") load this module
      _module = null
      _matches = path.match /(\S+)\s*:\s*(\S+)/
      if _matches?
        _module = @app.module _matches[1]
        path = _matches[2]
      else
        _module = @app.currentModule()

      # if in className exists relative folder path - extract it
      _deps = []
      _pathes = path.match /^(.+)\/([^\/]+)$/
      if _pathes?
        _deps.push(_module.path.replace(/[^\/]+$/, '') + _pathes[1])
        path = _pathes[2]

      { name: path, module: _module, deps: _deps }


  Templater
