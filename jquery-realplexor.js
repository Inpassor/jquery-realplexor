/**
 * jquery-realplexor.js
 *
 * @author Inpassor <inpassor@yandex.com>
 * @link https://github.com/Inpassor/jquery-realplexor
 *
 * @license MIT
 * @version 0.3.0 (2017.02.07)
 */

;(function ($, window, document, undefined) {

    $.Realplexor = function (params) {
        var uid = null;
        if ($.isPlainObject(params)) {
            if (!params.uid) {
                return new Realplexor(params);
            }
            uid = params.uid;
        } else {
            uid = params;
            params = {
                uid
            }
        }
        return $.Realplexor.instances[uid] ? $.Realplexor.instances[uid] : new Realplexor(params);
    };
    $.Realplexor.instances = {};

    const Realplexor = function (params) {
        $.extend(true, this, {
            url: '',
            namespace: '',
            JS_WAIT_RECONNECT_DELAY: 0.01,
            JS_WAIT_TIMEOUT: 300,
            JS_WAIT_URI: '/'
        }, params || {}, {
            _map: {}
        });
        if (!this.uid) {
            this.uid = Math.random().toString(36).slice(2);
        }
        this.stdTimeout = this.JS_WAIT_TIMEOUT * 1000;
        this.reconnectTimeout = this.JS_WAIT_RECONNECT_DELAY * 1000;
        return $.Realplexor.instances[this.uid] = this;
    };

    Realplexor.prototype = {
        setCursor: function (id, cursor) {
            this._checkMapItem(id);
            this._map[id].cursor = cursor;
            return this;
        },
        subscribe: function (id, callback) {
            this._checkMapItem(id);
            if (this._map[id].callbacks.indexOf(callback) !== -1) {
                return this;
            }
            if ($.isFunction(callback)) {
                this._map[id].callbacks.push(callback);
            }
            return this;
        },
        unsubscribe: function (id, callback) {
            this._checkMapItem(id);
            if ($.isUndefined(callback)) {
                this._map[id].callbacks = [];
                return this;
            }
            var i = this._map[id].callbacks.indexOf(callback);
            if (i !== -1) {
                this._map[id].callbacks.splice(i, 1);
            }
            return this;
        },
        execute: function () {
            if (this._t) {
                window.clearTimeout(this._t);
            }
            if (this.jqXHR) {
                this.jqXHR.abort();
            }
            this._loop();
            return this;
        },
        _checkMapItem: function (id) {
            if (!this._map[id]) {
                this._map[id] = {
                    cursor: null,
                    callbacks: []
                };
            }
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
                this._checkMapItem(id);
                this._map[id].cursor = cursor;
                for (var i = 0; i < this._map[id].callbacks.length; i++) {
                    this._map[id].callbacks[i].call(this, part.data, id, cursor);
                }
            }
        },
        _processData: function (data) {
            if (!(data instanceof Array)) {
                return;
            }
            for (var i = 0, l = data.length; i < l; i++) {
                this._processDataPart(data[i]);
            }
        },
        _loop: function () {
            var self = this,
                requestId = this._makeRequestId();
            if (!requestId.length) {
                this._t = window.setTimeout(function () {
                    self._loop();
                }, this.reconnectTimeout);
                return;
            }
            var idParam = 'identifier=' + requestId,
                url = this.url + this.JS_WAIT_URI,
                postData = null;
            if (idParam.length < 1700) {
                url += '?' + idParam + '&ncrnd=' + new Date().getTime();
            } else {
                postData = idParam + "\n";
            }
            var timeout = this.stdTimeout;
            this.jqXHR = $.ajax({
                url,
                dataType: 'json',
                type: postData ? 'POST' : 'GET',
                data: postData,
                timeout: timeout
            }).always(function (data, textStatus) {
                if (textStatus === 'success') {
                    timeout = self.stdTimeout;
                    self._processData(data);
                } else {
                    timeout = self.reconnectTimeout;
                }
                self._loop();
            });
        }
    };

})(jQuery, window, document);
