define [
  "use!underscore"
  "use!sockjs"
  "use!backbone"
], (_, SockJS, Backbone) ->

  # Клиент для Ecomet-сервера
  class Ecomet

    _options:
      host:                'http://' + window.location.host
      port:                ''
      authUrl:             '/auth'
      bufferTime:          1000
      maxErrorReconnect:   4
      tryReconnectTimeout: 10000

    _subsBuffer:       []
    _bufferTimeout:    null
    _allSubscriptions: []
    _alreadyAuth:      null
    _socket:           null

    @connect: (options = {}) ->
      new Ecomet(options)

    constructor: (options) ->
      @_socket = new SockJSAdapter(@)
      _.extend @_options, options

    subscribe: (routeKey, callback) ->
      _subs = 'routeKey': routeKey, 'callback': callback
      @_allSubscriptions.push _subs
      @_subsBuffer.push _subs

      @.on 'ecomet.message.' + routeKey, callback
      @_checkSubsBuffer()
      @


    # PRIVATE #

    _checkSubsBuffer: ->
      return if @_bufferTimeout or not @_subsBuffer

      @_bufferTimeout = setTimeout(( =>
        @_socket.checkConnect()

        _subsData =
          type:   'subscribe'
          routes: subs.routeKey for subs in @_subsBuffer

        if not @_alreadyAuth
          _authUrl = @_opt 'authUrl'

          if _authUrl.substring(0, 1) == '/'
            _authUrl = window.location.protocol + '//' + window.location.host + _authUrl

          _subsData.auth =
            authUrl: _authUrl
            cookie:  document.cookie

        @_subsBuffer = []
        @_bufferTimeout = null
        @_alreadyAuth = true

        @_socket.send _subsData
      ), @_opt 'bufferTime')

    _opt: (name) ->
      @_options[name]


  _.extend Ecomet.prototype, Backbone.Events


  class SockJSAdapter

    _client:            null
    _sendBuffer:        []
    _isError:           false
    _disconnectCnt:     0
    _disconnectTimeout: null

    constructor: (@ecomet) ->

    checkConnect: ->
      return if @_client

      _host    = @ecomet._opt 'host'
      @_client = new SockJS (if _host.match(/https?:\/\//) then '' else window.location.protocol + '//') + _host + '/ecomet', null, { devel: true, debug: true }


      # подключение
      @_client.onopen = =>
        @_checkSendBuffer()
        @ecomet.trigger 'ecomet.connect'

        # при успешном длительном коннекте сбрасываем счетчик ошибок
        @_disconnectTimeout = setTimeout ( => @_disconnectCnt = 0), 10000


      # получение сообщения
      @_client.onmessage = (event) =>
        _data = JSON.parse event.data

        @ecomet.trigger 'ecomet.message.' + _data.event, _data.message


      # отключение
      @_client.onclose = =>
        @ecomet.trigger 'ecomet.disconnect'
        @_client = null
        @_reconnect()


    send: (message) ->
      @_sendBuffer.push message
      @_checkSendBuffer()


    _reconnect: ->
      # если это не перманентная ошибка — переподключаемся и сново подписываемся на все эвенты
      if not @_isError and @ecomet._allSubscriptions
        clearTimeout @_disconnectTimeout

        # увеличиваем счетчик дисконнектов
        @_disconnectCnt += 1
        @ecomet._alreadyAuth = false

        if @_disconnectCnt >= @ecomet._opt 'maxErrorReconnect'
          @ecomet.trigger 'ecomet.connection.error'
          @_isError = true
          setTimeout (=> @_isError = false; @_reconnect()), @ecomet._opt('tryReconnectTimeout') # попробуем переподключится еще раз через несколько секунд
          return

        @ecomet._subsBuffer = @ecomet._allSubscriptions
        @ecomet._checkSubsBuffer() # реконектимся и подписываемся опять на все подписки


    _checkSendBuffer: ->
      return if not @_client || @_client.readyState != SockJS.OPEN || not @_sendBuffer.length

      _messages = @_sendBuffer
      @_sendBuffer = []

      for msg in _messages
        @_client.send JSON.stringify msg


  Ecomet

