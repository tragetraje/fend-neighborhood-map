var Carbon;
(function (Carbon) {
    var LazyLoader = (function () {
        function LazyLoader() {
            window.addEventListener('scroll', this.check.bind(this), {
                capture: false,
                passive: true
            });
        }
        LazyLoader.prototype.setup = function () {
            this.lazyEls = document.querySelectorAll('.lazy');
            this.check();
        };
        LazyLoader.prototype.check = function () {
            if (!this.lazyEls)
                return;
            this.fold = window.innerHeight;
            for (var i = 0; i < this.lazyEls.length; i++) {
                var el = this.lazyEls[i];
                if (!el.classList.contains('lazy'))
                    continue;
                var box = el.getBoundingClientRect();
                if (box.top <= this.fold + 500) {
                    this.load(el);
                    if ((i + 2) < this.lazyEls.length) {
                        var nextEl = this.lazyEls[i + 1];
                        this.load(nextEl);
                    }
                }
            }
        };
        LazyLoader.prototype.load = function (el) {
            if (el instanceof HTMLImageElement) {
                var _a = el.dataset, src = _a.src, srcset = _a.srcset;
                if (!src)
                    throw new Error('[Lazy] Missing data-src');
                var img;
                if (src.indexOf('.gif') > -1) {
                    img = new Image();
                }
                else {
                    img = el;
                }
                img.onload = function () {
                    el.classList.add('loaded');
                };
                img.src = src;
                if (el.dataset['srcset']) {
                    el.srcset = srcset;
                }
                el.src = src;
            }
            else {
                console.log('unexpected element type', el);
            }
            el.classList.remove('lazy');
        };
        return LazyLoader;
    })();
    Carbon.LazyLoader = LazyLoader;
})(Carbon || (Carbon = {}));
