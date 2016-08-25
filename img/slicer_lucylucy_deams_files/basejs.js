'use strict';

/* -- ES6 Polyfills -------------------------------------------------------------------------------- */

// Map, Set, WeakSet (https://github.com/WebReflection/es6-collections/blob/master/es6-collections.js)

if (window.Map === undefined || window.Set === undefined) {
  (function(e){function f(a,c){function b(a){if(!this||this.constructor!==b)return new b(a);this._keys=[];this._values=[];this._itp=[];this.objectOnly=c;a&&v.call(this,a)}c||w(a,"size",{get:x});a.constructor=b;b.prototype=a;return b}function v(a){this.add?a.forEach(this.add,this):a.forEach(function(a){this.set(a[0],a[1])},this)}function d(a){this.has(a)&&(this._keys.splice(b,1),this._values.splice(b,1),this._itp.forEach(function(a){b<a[0]&&a[0]--}));return-1<b}function m(a){return this.has(a)?this._values[b]:
  void 0}function n(a,c){if(this.objectOnly&&c!==Object(c))throw new TypeError("Invalid value used as weak collection key");if(c!=c||0===c)for(b=a.length;b--&&!y(a[b],c););else b=a.indexOf(c);return-1<b}function p(a){return n.call(this,this._values,a)}function q(a){return n.call(this,this._keys,a)}function r(a,c){this.has(a)?this._values[b]=c:this._values[this._keys.push(a)-1]=c;return this}function t(a){this.has(a)||this._values.push(a);return this}function h(){this._values.length=0}function z(){return k(this._itp,
  this._keys)}function l(){return k(this._itp,this._values)}function A(){return k(this._itp,this._keys,this._values)}function B(){return k(this._itp,this._values,this._values)}function k(a,c,b){var g=[0],e=!1;a.push(g);return{next:function(){var f,d=g[0];!e&&d<c.length?(f=b?[c[d],b[d]]:c[d],g[0]++):(e=!0,a.splice(a.indexOf(g),1));return{done:e,value:f}}}}function x(){return this._values.length}function u(a,c){for(var b=this.entries();;){var d=b.next();if(d.done)break;a.call(c,d.value[1],d.value[0],
  this)}}var b,w=Object.defineProperty,y=function(a,b){return isNaN(a)?isNaN(b):a===b};"undefined"==typeof WeakMap&&(e.WeakMap=f({"delete":d,clear:h,get:m,has:q,set:r},!0));"undefined"!=typeof Map&&(new Map).values().next||(e.Map=f({"delete":d,has:q,get:m,set:r,keys:z,values:l,entries:A,forEach:u,clear:h}));"undefined"!=typeof Set&&(new Set).values().next||(e.Set=f({has:p,add:t,"delete":d,clear:h,keys:l,values:l,entries:B,forEach:u}));"undefined"==typeof WeakSet&&(e.WeakSet=f({"delete":d,add:t,clear:h,
  has:p},!0))})("undefined"!=typeof exports&&"undefined"!=typeof global?global:window);
}

if (!String.prototype.includes) {
  String.prototype.includes = function() {
    return String.prototype.indexOf.apply(this, arguments) !== -1;
  };
}

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(text) {
    return this.indexOf(text) === 0;
  };
}

if (!String.prototype.empty) {
  String.prototype.empty = function() {
    return !(this && this.length > 0);
  };
}

if (!Array.prototype.remove) {
  Array.prototype.remove = function(item) {
    var index = this.indexOf(item);

    if (index != -1) {
      this.splice(index, 1);
    }
  };
}

if (!Array.from) {
  Array.from = function(arrayLike) {
    return [].slice.call(arrayLike);
  };
}

if (!Array.of) {
  Array.of = function() {
    return [].slice.call(arguments);
  };
}

// DOM 4 ------------------------------------------------
(function() {
  // .matches('selector');
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.webkitMatchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector;
  }

  // .closest('selector');
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
      var node = this;

      while (node) {
        if (node.matches(selector)) {
          return node;
        }
        else {
          node = node.parentElement;
        }
      }

      return null;
    };
  }

  function query(selector) {  
    return this.querySelector(selector);
  }
  
  function queryAll(selector) {    
    return Array.from(this.querySelectorAll(selector));
  };
  
  // .query('selector');
  if (!Element.prototype.query) {
    Element.prototype.query = query;
  }

  // .query('queryAll');
  if (!Element.prototype.queryAll) {  
    Element.prototype.queryAll = queryAll
  }

  if (!Document.prototype.queryAll) {
    Document.prototype.queryAll = queryAll
  }

  if (!Element.prototype.replaceWith) {  
    Element.prototype.replaceWith = function(element) {
      if (this.parentNode) {
        this.parentNode.replaceChild(element, this);
      }
    };
  }

  // .remove
  if (!Element.prototype.remove) {    
    Element.prototype.remove = function() {
      var parentNode = this.parentNode;
      
      if (parentNode) {
        parentNode.removeChild(this);
      }  
    };  
  }
})();

Function.prototype.throttle = function(delay) {
  var fn = this, timeout;

  return function() {
    var obj = this, args = arguments;

    if (!timeout) {
      timeout = setTimeout(function() {
        fn.apply(obj, args);

        timeout = null;
      }, delay);
    }
  };
};

Function.prototype.debounce = function(delay) {
  var fn = this, timeout;

  return function() {
    var args = arguments;

    clearTimeout(timeout);

    timeout = setTimeout(function () { return fn.apply(null, args) }, delay)
  };
};

(function () {  
  // Patch dataset support in IE10
  // only add support if the browser doesn't support data-* natively
  if (document.createElement('div').dataset != undefined) return;
  
  var forEach = [].forEach,
      regex = /^data-(.+)/,
      dashChar = /\-([a-z])/ig,
      mutationSupported = false,
      match;

  function detectMutation() {
    mutationSupported = true;
    this.removeEventListener('DOMAttrModified', detectMutation, false);
  }

  function toCamelCase(s) {
    return s.replace(dashChar, function (m,l) { return l.toUpperCase(); });
  }

  function updateDataset() {
    var dataset = {};
    forEach.call(this.attributes, function(attr) {
      if (match = attr.name.match(regex))
        dataset[toCamelCase(match[1])] = attr.value;
    });
    return dataset;
  }


  el.addEventListener('DOMAttrModified', detectMutation, false);
  el.setAttribute('foo', 'bar');

  function defineElementGetter (obj, prop, getter) {
    if (Object.defineProperty) {
        Object.defineProperty(obj, prop,{
            get : getter
        });
    } else {
        obj.__defineGetter__(prop, getter);
    }
  }

  defineElementGetter(Element.prototype, 'dataset', mutationSupported
    ? function () {
      if (!this._datasetCache) {
        this._datasetCache = updateDataset.call(this);
      }
      return this._datasetCache;
    }
    : updateDataset
  );

  document.addEventListener('DOMAttrModified', function (event) {
    delete event.target._datasetCache;
  }, false);
})();

// Promise -------------------------------------------------------------------------
// https://github.com/Financial-Times/polyfill-service/tree/master/polyfills/Promise
if (!window.Promise) {
   (function (global, setImmediate, isArray) {
    var
      STATUS = '[[PromiseStatus]]',
      VALUE = '[[PromiseValue]]',
      ON_FUlFILLED = '[[OnFulfilled]]',
      ON_REJECTED = '[[OnRejected]]',
      ORIGINAL_ERROR = '[[OriginalError]]',
      PENDING = 'pending',
      INTERNAL_PENDING = 'internal pending',
      FULFILLED = 'fulfilled',
      REJECTED = 'rejected',
      NOT_ARRAY = 'not an array.',
      REQUIRES_NEW = 'constructor Promise requires "new".',
      CHAINING_CYCLE = 'then() cannot return same Promise that it resolves.';

    function InternalError(originalError) {
      this[ORIGINAL_ERROR] = originalError;
    }

    function isInternalError(anything) {
      return anything instanceof InternalError;
    }

    function isObject(anything) {
      return Object(anything) === anything;
    }

    function isCallable(anything) {
      return typeof anything === 'function';
    }

    function isPromise(anything) {
      return anything instanceof Promise;
    }

    function identity(value) {
      return value;
    }

    function thrower(reason) {
      throw reason;
    }

    function enqueue(promise, onFulfilled, onRejected) {
      if (!promise[ON_FUlFILLED]) {
        promise[ON_FUlFILLED] = [];
        promise[ON_REJECTED] = [];
      }

      promise[ON_FUlFILLED].push(onFulfilled);
      promise[ON_REJECTED].push(onRejected);
    }

    function clearAllQueues(promise) {
      delete promise[ON_FUlFILLED];
      delete promise[ON_REJECTED];
    }

    function callEach(queue) {
      var
      length = queue.length,
      index = -1;

      while (++index < length) {
        queue[index]();
      }
    }

    function call(resolve, reject, value) {
      var anything = toPromise(value);

      if (isPromise(anything)) {
        anything.then(resolve, reject);
      } else if (isInternalError(anything)) {
        reject(anything[ORIGINAL_ERROR]);
      } else {
        resolve(value);
      }
    }

    function toPromise(anything) {
      var then;

      if (isPromise(anything)) {
        return anything;
      }

      if(isObject(anything)) {
        try {
          then = anything.then;
        } catch (error) {
          return new InternalError(error);
        }

        if (isCallable(then)) {
          return new Promise(function (resolve, reject) {
            setImmediate(function () {
              try {
                then.call(anything, resolve, reject);
              } catch (error) {
                reject(error);
              }
            });
          });
        }
      }
      return null;
    }

    function resolvePromise(promise, resolver) {
      function resolve(value) {
        if (promise[STATUS] === PENDING) {
          fulfillPromise(promise, value);
        }
      }

      function reject(reason) {
        if (promise[STATUS] === PENDING) {
          rejectPromise(promise, reason);
        }
      }

      try {
        resolver(resolve, reject);
      } catch (error) {
        reject(error);
      }
    }

    function fulfillPromise(promise, value) {
      var
      anything = toPromise(value),
      queue;

      if (isPromise(anything)) {
        promise[STATUS] = INTERNAL_PENDING;

        anything.then(
          function (value) {
            fulfillPromise(promise, value);
          },
          function (reason) {
            rejectPromise(promise, reason);
          }
        );
      } else if (isInternalError(anything)) {
        rejectPromise(promise, anything[ORIGINAL_ERROR]);
      } else {
        promise[STATUS] = FULFILLED;
        promise[VALUE] = value;

        queue = promise[ON_FUlFILLED];

        if (queue && queue.length) {
          clearAllQueues(promise);

          callEach(queue);
        }
      }
    }

    function rejectPromise(promise, reason) {
      var queue = promise[ON_REJECTED];

      promise[STATUS] = REJECTED;
      promise[VALUE] = reason;

      if (queue && queue.length) {
        clearAllQueues(promise);

        callEach(queue);
      }
    }

    function Promise(resolver) {
      var promise = this;

      if (!isPromise(promise)) {
        throw new TypeError(REQUIRES_NEW);
      }

      promise[STATUS] = PENDING;
      promise[VALUE] = undefined;

      resolvePromise(promise, resolver);
    }

    Promise.prototype.then = function (onFulfilled, onRejected) {
      var
      promise = this,
      nextPromise;

      onFulfilled = isCallable(onFulfilled) ? onFulfilled : identity;
      onRejected = isCallable(onRejected) ? onRejected : thrower;

      nextPromise = new Promise(function (resolve, reject) {
        function tryCall(func) {
          var value;

          try {
            value = func(promise[VALUE]);
          } catch (error) {
            reject(error);
            return;
          }
          if (value === nextPromise) {
            reject(new TypeError(CHAINING_CYCLE));
          } else {
            call(resolve, reject, value);
          }
        }

        function asyncOnFulfilled() {
          setImmediate(tryCall, onFulfilled);
        }

        function asyncOnRejected() {
          setImmediate(tryCall, onRejected);
        }

        switch (promise[STATUS]) {
          case FULFILLED:
            asyncOnFulfilled();
            break;

          case REJECTED:
            asyncOnRejected();
            break;

          default:
            enqueue(promise, asyncOnFulfilled, asyncOnRejected);
        }
      });

      return nextPromise;
    };

    Promise.prototype['catch'] = function (onRejected) {
      return this.then(identity, onRejected);
    };

    Promise.resolve = function (value) {
      var anything = toPromise(value);

      if (isPromise(anything)) {
        return anything;
      }

      return new Promise(function (resolve, reject) {
        if (isInternalError(anything)) {
          reject(anything[ORIGINAL_ERROR]);
        } else {
          resolve(value);
        }
      });
    };

    Promise.reject = function (reason) {
      return new Promise(function (resolve, reject) {
        reject(reason);
      });
    };

    Promise.race = function (values) {
      return new Promise(function (resolve, reject) {
        var
        index = -1,
        length;

        if (isArray(values)) {
          length = values.length;

          while (++index < length) {
            call(resolve, reject, values[index]);
          }
        } else {
          reject(new TypeError(NOT_ARRAY));
        }
      });
    };

    Promise.all = function (values) {
      return new Promise(function (resolve, reject) {
        var
        fulfilledCount = 0,
        promiseCount = 0,
        index = -1,
        anything, length, value;

        if (isArray(values)) {
          values = values.slice(0);
          length = values.length;

          while (++index < length) {
            value = values[index];
            anything = toPromise(value);

            if (isPromise(anything)) {
              ++promiseCount;

              anything.then(function (index) {
                return function (value) {
                  values[index] = value;

                  ++fulfilledCount;

                  if (fulfilledCount === promiseCount) {
                    resolve(values);
                  }
                };
              }(index), reject);
            } else if (isInternalError(anything)) {
              reject(anything[ORIGINAL_ERROR]);
            } else {
              //[1, , 3] → [1, undefined, 3]
              values[index] = value;
            }
          }

          if (!promiseCount) {
            resolve(values);
          }
        } else {
          reject(new TypeError(NOT_ARRAY));
        }
      });
    };

    global.Promise = Promise;

    setImmediate = setImmediate || function (func) {
      var args = Array.prototype.slice.call(arguments, 1);

      return setTimeout(function () {
        func.apply(null, args);
      });
    };

    isArray = Array.isArray || function () {
      return toString.call(object) === '[object Array]';
    };
  })(window, window.setImmediate, Array.isArray);
}

// Fetch -------------------------------------------------------------------------
// https://github.com/github/fetch/blob/master/fetch.js
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

// Custom Events (IE)
(function () {
  // via MDN
  if (typeof window.CustomEvent === "function" ) return false;

  function CustomEvent (event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail );
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

// Object.assign
if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}