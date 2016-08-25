"use strict";
var acceptHeader = '*/*';
var SiteActions = {
    updateBlock: function (data) {
        var block = this.blocks[data.name];
        if (block)
            block.update(data.data);
    },
    setFontScheme: function (name) {
        var ss = document.getElementById('fontSchemeStylesheet');
        var currentPath = ss.getAttribute('href');
        var basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        ss.setAttribute('href', basePath + name + '.css');
    },
    setColorScheme: function (name) {
        var ss = document.getElementById('colorSchemeStylesheet');
        var currentPath = ss.getAttribute('href');
        var basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        document.body.dataset['colorScheme'] = name;
        var url = basePath + name + '.css';
        ss.setAttribute('href', url);
    },
    loadPartial: function (data) {
        var el = document.querySelector(data.selector);
        fetch(data.url, {
            credentials: 'include',
            headers: { 'Accept': acceptHeader }
        }).then(function (response) { return response.text(); })
            .then(function (html) {
            el.outerHTML = html;
        });
    }
};
var Page = (function () {
    function Page(name, site) {
        this.name = name;
        this.site = site;
        this.headerEl = document.querySelector('header');
        this.mainEl = document.querySelector('main');
        this.navEl = document.querySelector('nav');
    }
    Page.prototype.load = function (cxt) {
        var _this = this;
        return this.site.load(cxt).then(function () {
            _this.updateHeader(cxt);
            _this.updateGallery(cxt);
            return Promise.resolve(true);
        });
    };
    Page.prototype.unload = function (cxt) {
        return Promise.resolve(true);
    };
    Page.prototype.updateHeader = function (cxt) {
        if (cxt.init)
            return;
        var currentEl = this.navEl.query('li a.current');
        currentEl && currentEl.classList.remove('current');
        var newSectionLink = this.navEl.querySelector('#' + this.name + 'Link a');
        newSectionLink && newSectionLink.classList.add('current');
        if (this.name === 'projectPage') {
            this.headerEl.classList.add('noShadow');
        }
        else {
            this.headerEl.classList.remove('noShadow');
        }
    };
    Page.prototype.updateGallery = function (cxt) {
        if (cxt.params.id && cxt.params.pieceId) {
            var gallery = Carbon.Gallery.get(cxt.params.id);
            if (gallery) {
                gallery.gotoPiece(cxt.params.pieceId, {
                    skipAnimation: true,
                    skipPushState: true
                });
            }
        }
    };
    return Page;
}());
var SiteBlocks = {
    nav: {
        update: function (data) {
            var navEl = document.querySelector('nav');
            _.getHTML('/?partial=nav').then(function (html) {
                navEl.innerHTML = Carbon.DOM.parse(html).innerHTML;
            });
        }
    },
    siteTitle: {
        update: function (text) {
            var el = document.querySelector('.siteTitle');
            el.textContent = text;
        }
    },
    footer: {
        update: function () {
            SiteActions.loadPartial({
                url: '/?partial=footer',
                selector: 'footer'
            });
        }
    },
    siteFooterContent: {
        update: function (text) {
            var el = document.querySelector('.footerBlurb span');
            el.innerHTML = text;
        }
    },
    brandingGlyph: {
        update: function (value) {
            var glyphEl = document.querySelector('carbon-branding carbon-glyph');
            glyphEl.innerHTML = '&#x' + value + ';';
        }
    }
};
var Site = (function () {
    function Site() {
        this.actions = SiteActions;
        this.blocks = SiteBlocks;
        this.router = new Carbon.Router({
            '/': new Page('home', this),
            '/about': new Page('about', this),
            '/contact': new Page('contact', this),
            '/projects/{id}/{pieceId}': new Page('projectPage', this),
            '/projects/{id}': new Page('projectPage', this),
            '/blog': new Page('blog', this),
            '/blog/{tag}': new Page('blog', this)
        });
        this.router.start();
    }
    Site.prototype.load = function (cxt) {
        this.path = cxt.url;
        if (cxt.init) {
            this.onLoaded({
                path: cxt.url,
                init: true,
                notify: true
            });
            return Promise.resolve(true);
        }
        return this._load(cxt.url, true);
    };
    Site.prototype._load = function (path, notify) {
        var _this = this;
        if (window.bridge) {
            window.bridge.path = path;
        }
        var mainEl = document.querySelector('main');
        this.path = path;
        var url = path + (path.includes('?') ? '&' : '?') + 'partial=true';
        return fetch(url, {
            credentials: 'include',
            headers: {
                'Accept': acceptHeader,
                'X-Partial': '1'
            }
        }).then(function (response) {
            document.title = decodeURI(response.headers.get('X-Page-Title') || '');
            return response.text();
        }).then(function (html) {
            mainEl.innerHTML = html;
            if (notify !== false) {
                window.scrollTo(0, 0);
            }
            _this.onLoaded({
                path: path.split('?')[0],
                init: false,
                notify: notify
            });
            return Promise.resolve(true);
        });
    };
    Site.prototype.onLoaded = function (cxt) {
        document.queryAll('[on-insert]').forEach(function (el) {
            Carbon.ActionKit.dispatch({
                type: 'insert',
                target: el
            });
            el.removeAttribute('on-insert');
        });
        Carbon.Reactive.trigger('routed', cxt);
        if (!this.lazyLoader) {
            this.lazyLoader = new Carbon.LazyLoader();
        }
        this.lazyLoader.setup();
    };
    return Site;
}());
;
Carbon.controllers.set('form', {
    setup: function (e) { Carbon.Form.get(e.target); }
});
Carbon.controllers.set('gallery', {
    setup: function (e) { new Carbon.Gallery(e.target); }
});
Carbon.controllers.set('caption', {
    show: function (e) {
        var itemEl = e.target.closest('carbon-item');
        itemEl.classList.add('hovering');
        _.one(itemEl, 'mouseleave', function () {
            itemEl.classList.remove('hovering');
        });
    }
});
Carbon.controllers.set('form', {
    setup: function (e) { Carbon.Form.get(e.target); }
});
Carbon.Reactive.on('player:played', function (e) {
    e.element.closest('carbon-piece').classList.add('played');
});
var CM;
(function (CM) {
    CM.site = new Site();
})(CM || (CM = {}));
document.queryAll('[on-insert]').forEach(function (el) {
    Carbon.ActionKit.dispatch({
        type: 'insert',
        target: el
    });
    el.removeAttribute('on-insert');
});
Carbon.ActionKit.observe('click', 'mouseover');
var webp = new Image();
webp.onload = function () {
    acceptHeader = '*/*,image/webp';
};
webp.src = 'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoBAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==';
