(function ($) {

  /**
   * Serialize html form to JSON
   *
   * Example:
   *
   * <input name="name" value="dima"/>
   * <input name="email" value="dima@dima.com"/>
   * <input name="field" value="1"/>
   * <input name="field" value="2"/>
   * <input name="field" value="3"/>
   * <input name="map[key1][key2]" value="test1"/>
   * <input name="map[key1][key3]" value="test2"/>
   * <input name="map[newKey][test]" value="test3"/>
   *
   * result (CoffeeScript syntax):
   *
   *   name: "dima"
   *   email: "dima@dima.com"
   *   field: [1, 2, 3]
   *   map:
   *     key1:
   *       key2: "test1"
   *       key3: "test2"
   *     newKey:
   *       test: "test3"
   */
  jQuery.fn.serializeHash = function (options) {
    options = options || {};
    var _trim = function(s) {
      return s.replace(/^[\[\]]+|[\[\]]+$/, '');
    };

    var _merge = function(obj, n, v) {
      obj[n] = obj[n] === undefined ? v : ($.isArray(obj[n]) ? obj[n].concat(v) : [obj[n], v]);
    };

    var _expandKeys = function(hash, nlist, v) {
      var n = _trim(nlist[0]);
      if (nlist.length == 1) {
        _merge(hash, n, v);
      } else {
        hash[n] !== undefined || (hash[n] = {});
        _expandKeys(hash[n], nlist.slice(1), v);
      }
    };

    var _hash = {}, _array = this.serializeArray();
    $.each(_array.length ? _array : $(':input', this).serializeArray(), function (i, el) {
      if (options.skipEmpty && el.value === "") return; // skip
      _expandKeys(_hash, _trim(el.name).split("["), el.value);
    });

    return _hash;
  };

})(jQuery);
