/**
 * jquery-realplexor.js
 *
 * @author DmitryKoterov <dmitry.koterov@gmail.com>
 * @link https://github.com/DmitryKoterov/dklab_realplexor/blob/master/dklab_realplexor.js
 *
 * @author Inpassor <inpassor@yandex.com>
 * @link https://github.com/Inpassor/yii2-realplexor
 *
 * @version 0.1.1 (2016.10.11)
 */

;(function ($, window, document, undefined) {

    var RealplexorRegistry = {};

    $.Realplexor = function (params) {
        if ($.isPlainObject(params)) {
            return new Realplexor(params);
        }
        if (RealplexorRegistry[params]) {
            return RealplexorRegistry[params];
        }
        throw 'Invalid parameters.';
    };

    $.Realplexor._iframeLoaded = function (id) {
        var th = RealplexorRegistry[id];
        setTimeout(function () {
            var iframe = document.getElementById(id);
            th._realplexor = iframe.contentWindow.Dklab_Realplexor_Loader;
            if (th.needExecute) {
                th.execute();
            }
        }, 50);
    };

    $.Realplexor._callAndReturnException = function (func, args) {
        try {
            func.apply(null, args);
            return null;
        } catch (e) {
            return '' + e;
        }
    };

    var Realplexor = function (params) {
        $.extend(true, this, params || {});
        this.host = document.location.host;
        this.uid = params.uid || "mpl" + (new Date().getTime());
        RealplexorRegistry[this.uid] = this;
        if (!this.url.match(/^\/\/([^/]+)/)) {
            throw 'Dklab_Realplexor constructor argument must be fully-qualified URL, ' + this.url + ' given.';
        }
        var mHost = RegExp.$1;
        if (mHost != this.host && mHost.lastIndexOf('.' + this.host) != mHost.length - this.host.length - 1) {
            throw 'Due to the standard XMLHttpRequest security policy, hostname in URL passed to Dklab_Realplexor (' + mHost + ') must be equals to the current host (' + this.host + ') or be its direct sub-domain.';
        }
        if (this.createIframe) {
            this._createIframe();
        }
        document.domain = this.host;
        return this;
    };

    Realplexor.prototype = {
        version: '1.32',
        uid: null,
        url: '',
        host: '',
        namespace: '',
        _map: {},
        _realplexor: null,
        _login: null,
        _iframeCreated: false,
        _needExecute: false,
        _executeTimer: null,
        _createIframe: function () {
            $('<iframe/>', {
                id: this.uid,
                onload: '$.Realplexor._iframeLoaded("' + this.uid + '")',
                src: this.url + '?identifier=IFRAME&HOST=' + this.host + '&version=' + this.version
            }).css({
                position: 'absolute',
                visibility: 'hidden',
                width: '200px',
                height: '200px',
                left: '-1000px',
                top: '-1000px'
            }).appendTo('body');
            this._iframeCreated = true;
        },
        logon: function (login) {
            this._login = login;
            return this;
        },
        setCursor: function (id, cursor) {
            if (!this._map[id]) {
                this._map[id] = {cursor: null, callbacks: []};
            }
            this._map[id].cursor = cursor;
            return this;
        },
        subscribe: function (id, callback) {
            if (!this._map[id]) {
                this._map[id] = {cursor: null, callbacks: []};
            }
            var chain = this._map[id].callbacks;
            for (var i = 0; i < chain.length; i++) {
                if (chain[i] === callback) {
                    return this;
                }
            }
            chain.push(callback);
            return this;
        },
        unsubscribe: function (id, callback) {
            if (!this._map[id]) return this;
            if (callback == null) {
                this._map[id].callbacks = [];
                return this;
            }
            var chain = this._map[id].callbacks;
            for (var i = 0; i < chain.length; i++) {
                if (chain[i] === callback) {
                    chain.splice(i, 1);
                    return this;
                }
            }
            return this;
        },
        execute: function () {
            if (!this._iframeCreated) {
                this._createIframe();
            }
            if (this._executeTimer) {
                clearTimeout(this._executeTimer);
                this._executeTimer = null;
            }
            var th = this;
            if (!this._realplexor) {
                this._executeTimer = setTimeout(function () {
                    th.execute()
                }, 30);
                return this;
            }
            this._realplexor.execute(
                this._map,
                this._callAndReturnException,
                (this._login != null ? this._login + '_' : '') + this.namespace
            );
            return this;
        }
    };

})(jQuery, window, document);
