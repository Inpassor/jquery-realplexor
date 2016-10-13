/**
 * jquery-realplexor.js
 *
 * @author Inpassor <inpassor@yandex.com>
 * @link https://github.com/Inpassor/yii2-realplexor
 *
 * @version 0.1.5 (2016.10.13)
 */

;(function ($, window, document, undefined) {

    $.Realplexor = function (params) {
        if ($.isPlainObject(params)) {
            return new Realplexor(params);
        }
        if ($.Realplexor.instances[params]) {
            return $.Realplexor.instances[params];
        }
        throw 'Realplexor instance "' + params + '" not found.';
    };
    $.Realplexor.instances = {};

    var Realplexor = function (params) {
        $.extend(true, this, {
            url: '',
            namespace: '',
            JS_WAIT_RECONNECT_DELAY: 0.01,
            JS_WAIT_TIMEOUT: 300,
            JS_MAX_BOUNCES: 10,
            JS_WAIT_URI: '/'
        }, params || {}, {
            _map: {},
            _bounceCount: 0
        });
        if (!this.uid) {
            this.uid = $.getRandomString();
        }
        return $.Realplexor.instances[this.uid] = this;
    };

    Realplexor.prototype = {
        setCursor: function (id, cursor) {
            this._getMapItem(id).cursor = cursor;
            return this;
        },
        subscribe: function (id, callback) {
            var chain = this._getMapItem(id).callbacks;
            if (chain.indexOf(callback) !== -1) {
                return this;
            }
            if ($.isFunction(callback)) {
                chain.push(callback);
            }
            return this;
        },
        unsubscribe: function (id, callback) {
            var chain = this._getMapItem(id).callbacks;
            if ($.isUndefined(callback)) {
                chain = [];
                return this;
            }
            var i = chain.indexOf(callback);
            if (i !== -1) {
                chain.splice(i, 1);
            }
            return this;
        },
        execute: function () {
            this._loop();
            return this;
        },
        _getMapItem: function (id) {
            if (!this._map[id]) {
                this._map[id] = {
                    cursor: null,
                    callbacks: []
                };
            }
            return this._map[id];
        },
        _makeRequestId: function () {
            var parts = [];
            for (var id in this._map) {
                if (!this._map.hasOwnProperty(id)) {
                    continue;
                }
                var v = this._map[id];
                if (!v.callbacks.length) {
                    continue;
                }
                parts.push((v.cursor !== null ? v.cursor + ':' : '') + this.namespace + id);
            }
            return parts.join(',');
        },
        _processDataPart: function (part) {
            if (!part.ids || !part.data) {
                return;
            }
            for (var id in part.ids) {
                if (!part.ids.hasOwnProperty(id)) {
                    continue;
                }
                var cursor = part.ids[id];
                if (this.namespace) {
                    if (id.indexOf(this.namespace) === 0) {
                        id = id.substring(this.namespace.length);
                    }
                }
                var item = this._getMapItem(id);
                item.cursor = cursor;
                for (var i = 0, l = item.callbacks.length; i < l; i++) {
                    item.callbacks[i].call(this, part.data, id, cursor);
                }
            }
        },
        _processData: function (data) {
            if (!$.isArray(data)) {
                return;
            }
            for (var i = 0, l = data.length; i < l; i++) {
                this._processDataPart(data[i]);
            }
        },
        _loop: function () {
            var requestId = this._makeRequestId();
            if (!requestId.length) {
                return;
            }
            var self = this,
                idParam = 'identifier=' + requestId,
                url = this.url + this.JS_WAIT_URI,
                postData = null;
            this._prevReqTime = new Date().getTime();
            if (idParam.length < 1700) {
                url += '?' + idParam + '&ncrnd=' + this._prevReqTime;
            } else {
                postData = idParam + "\n";
            }
            $.ajax(url, {
                dataType: 'json',
                type: postData ? 'POST' : 'GET',
                data: postData
            }).always(function (data, textStatus) {
                var nextQueryDelay = Math.round(self.JS_WAIT_RECONNECT_DELAY * 1000);
                if (textStatus === 'success') {
                    self._processData(data);
                    self._bounceCount = 0;
                } else {
                    var t = new Date().getTime();
                    if (t - self._prevReqTime < self.JS_WAIT_TIMEOUT / 2 * 1000) {
                        self._bounceCount++;
                    }
                    self._prevReqTime = t;
                }
                if (self._bounceCount > self.JS_MAX_BOUNCES) {
                    var progressive = self._bounceCount - self.JS_MAX_BOUNCES + 2;
                    nextQueryDelay = 1000 + 500 * progressive * progressive;
                    if (nextQueryDelay > 60000) {
                        nextQueryDelay = 60000;
                    }
                }
                window.setTimeout(function () {
                    self._loop();
                }, nextQueryDelay);
            });
        }
    };

})(jQuery, window, document);
