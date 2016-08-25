// TODO: Manage own styles
var Carbon;
(function (Carbon) {
    var Zoomable = (function () {
        function Zoomable() {
            var _this = this;
            this.zoomerEl = document.getElementById('zoomer');
            this.padding = 50;
            this.queuedOpen = false;
            this.visible = false;
            this.animating = false;
            this.zoomerEl = document.createElement('div');
            this.zoomerEl.id = 'zoomer';
            this.zoomerEl.style.position = 'fixed';
            this.zoomerEl.style.top = '0';
            this.zoomerEl.style.right = '0';
            this.zoomerEl.style.bottom = '0';
            this.zoomerEl.style.left = '0';
            this.zoomerEl.style.zIndex = '100';
            this.zoomerEl.style.visibility = 'hidden';
            document.body.appendChild(this.zoomerEl);
            window.addEventListener('resize', this.onResize.bind(this));
            window.addEventListener('scroll', this.onScroll.bind(this));
            document.addEventListener('keyup', function (e) {
                if (e.keyCode == 27) {
                    _this.zoomOut();
                }
            });
        }
        Zoomable.get = function () {
            return Zoomable.instance || (Zoomable.instance = new Zoomable());
        };
        Zoomable.prototype.open = function (element) {
            this.scrollTop = document.body.scrollTop;
            if (this.visible || this.queuedOpen)
                return;
            if (this.animating) {
                this.queuedOpen = true;
                setTimeout(function () {
                    this.queuedOpen = false;
                    this.open(element);
                }.bind(this), 50);
                return;
            }
            this.element = element;
            this.originBox = this.element.getBoundingClientRect();
            this.scale = 0;
            var data = element.dataset;
            this.url = data['zoomSrc'];
            if (data['zoomSize']) {
                var parts = data['zoomSize'].split('x');
                this.fullWidth = parseInt(parts[0], 10);
                this.fullHeight = parseInt(parts[1], 10);
            }
            else {
                this.fullWidth = parseInt(data['zoomWidth'], 10);
                this.fullHeight = parseInt(data['zoomHeight'], 10);
            }
            this.createClone();
            this.visible = true;
            this.zoomerEl.classList.add('open');
            this.zoomerEl.classList.remove('closed');
            this.zoomerEl.style.visibility = 'visible';
            this.zoomerEl.setAttribute('on-click', 'zoom:out');
            this.element.style.visibility = 'hidden';
            this.zoomIn();
        };
        Zoomable.prototype.createClone = function () {
            var a = this.zoomerEl.querySelector('.clone');
            if (a) {
                a.remove();
            }
            var cloneEl = this.element.cloneNode(true);
            cloneEl.style.display = 'block';
            cloneEl.style.position = 'absolute';
            cloneEl.style.top = '0';
            cloneEl.style.left = '0';
            cloneEl.style.width = this.originBox.width + 'px',
                cloneEl.style.height = this.originBox.height + 'px',
                cloneEl.style.transformOrigin = 'left top';
            cloneEl.style.transform = "translate(" + this.originBox.left + "px, " + this.originBox.top + "px) scale(1)";
            cloneEl.style.cursor = 'zoom-out';
            cloneEl.classList.add('clone');
            cloneEl.classList.remove('zoomable');
            cloneEl.removeAttribute('on-click');
            this.zoomerEl.appendChild(cloneEl);
            this.calculateTargetPosition();
            this.cloneEl = cloneEl;
        };
        Zoomable.prototype.calculateTargetPosition = function () {
            this.originBox = this.element.getBoundingClientRect();
            var winWidth = window.innerWidth;
            var winHeight = window.innerHeight;
            var size = this.calculateSize(this.fullWidth, this.fullHeight, winWidth - this.padding, winHeight - this.padding);
            this.fittedBox = {
                width: size.width,
                height: size.height,
                top: (winHeight - size.height) / 2,
                left: (winWidth - size.width) / 2
            };
            this.scale = this.fittedBox.width / this.originBox.width;
        };
        Zoomable.prototype.onScroll = function () {
            if (!this.element)
                return;
            if (Math.abs(this.scrollTop - window.scrollY) < 10) {
                return;
            }
            if (this.visible) {
                this.zoomOut();
                return;
            }
            this.calculateTargetPosition();
            if (!this.animating) {
                this.cloneEl.style.transform = "translate(" + this.originBox.left + "px," + this.originBox.top + "px)";
            }
        };
        Zoomable.prototype.onResize = function () {
            this.calculateTargetPosition();
            this.zoomIn('0s');
        };
        Zoomable.prototype.zoomIn = function (duration) {
            var _this = this;
            if (duration === void 0) { duration = '0.4s'; }
            var easing = 'cubic-bezier(.175,.885,.32,1)';
            this.cloneEl.style.transition = "transform " + duration + " " + easing;
            this.cloneEl.style.transform = "translate(" + this.fittedBox.left + "px," + this.fittedBox.top + "px) scale(" + this.scale + ")";
            var imgEl = document.createElement('img');
            imgEl.style.position = 'fixed';
            imgEl.style.zIndex = '101';
            imgEl.style.cursor = 'zoom-out';
            imgEl.style.opacity = '0';
            imgEl.style.top = this.fittedBox.top + 'px';
            imgEl.style.left = this.fittedBox.left + 'px';
            imgEl.style.width = this.fittedBox.width + 'px';
            imgEl.style.height = this.fittedBox.height + 'px';
            imgEl.style.webkitUserSelect = 'none';
            imgEl.style.msUserSelect = 'none';
            imgEl.style.transition = 'opacity 0.3s ease';
            imgEl.draggable = false;
            this.zoomerEl.appendChild(imgEl);
            var animated = new Deferred();
            imgEl.onload = function () {
                animated.promise.then(function () {
                    if (_this.visible) {
                        imgEl.style.opacity = '1';
                    }
                });
            };
            imgEl.src = this.url;
            setTimeout(function () {
                animated.resolve(true);
            }, 401);
            this.imgEl = imgEl;
        };
        Zoomable.prototype.step = function (p) {
            // MATH (change * percent) + start
            var left = ((this.originBox.left - this.fittedBox.left) * p) + this.fittedBox.left;
            var top = ((this.originBox.top - this.fittedBox.top) * p) + this.fittedBox.top;
            var scale = ((1 - this.scale) * p) + this.scale;
            this.cloneEl.style.transform = "translate3d(" + left + "px, " + top + "px, 0) scale(" + scale + ")";
        };
        Zoomable.prototype.calculateSize = function (width, height, maxWidth, maxHeight) {
            if (height <= maxHeight && width <= maxWidth) {
                return { width: width, height: height };
            }
            var mutiplier = (maxWidth / width);
            if (height * mutiplier <= maxHeight) {
                return {
                    width: maxWidth,
                    height: Math.round(height * mutiplier)
                };
            }
            else {
                mutiplier = (maxHeight / height);
                return {
                    width: Math.round(width * mutiplier),
                    height: maxHeight
                };
            }
        };
        Zoomable.prototype.next = function (timestamp) {
            if (!this.animating)
                return;
            var duration = 200;
            if (!this.timestamp) {
                this.timestamp = timestamp;
            }
            else {
                var elapsed = timestamp - this.timestamp;
                var p = Math.min(elapsed / duration, 1);
                this.step(p);
                if (elapsed >= duration) {
                    this.zoomerEl.classList.remove('open');
                    this.zoomerEl.classList.remove('closing');
                    this.zoomerEl.classList.add('closed');
                    this.zoomerEl.style.background = '';
                    this.element.style.visibility = 'visible';
                    this.animating = false;
                    this.cloneEl.remove();
                    return;
                }
            }
            requestAnimationFrame(this.next.bind(this));
        };
        Zoomable.prototype.zoomOut = function () {
            if (!this.visible)
                return;
            this.zoomerEl.classList.add('closing');
            this.imgEl.remove();
            this.imgEl = null;
            this.timestamp = null;
            this.visible = false;
            this.calculateTargetPosition();
            this.cloneEl.style.transition = 'none';
            this.animating = true;
            this.zoomerEl.style.background = 'transparent';
            requestAnimationFrame(this.next.bind(this));
        };
        return Zoomable;
    })();
    Carbon.Zoomable = Zoomable;
    var Deferred = (function () {
        function Deferred() {
            var _this = this;
            this.promise = new Promise(function (resolve, reject) {
                _this._resolve = resolve;
                _this._reject = reject;
            });
        }
        Deferred.prototype.resolve = function (value) {
            this._resolve(value);
        };
        Deferred.prototype.reject = function (value) {
            this._reject(value);
        };
        return Deferred;
    })();
})(Carbon || (Carbon = {}));
Carbon.controllers.set('zoomer', {
    show: function (e) {
        if (e.target.closest('carbon-indicator, .hovering'))
            return;
        Carbon.Zoomable.get().open(e.target);
    }
});
Carbon.controllers.set('zoom', {
    in: function (e) {
        if (e.target.closest('carbon-indicator, .hovering'))
            return;
        Carbon.Zoomable.get().open(e.target);
    },
    out: function (e) {
        Carbon.Zoomable.get().zoomOut();
    }
});
