"use strict";
var Carbon;
(function (Carbon) {
    if (!Element.prototype.requestFullscreen) {
        Element.prototype.requestFullscreen = Element.prototype.webkitRequestFullscreen
            || Element.prototype.webkitRequestFullScreen
            || Element.prototype.mozRequestFullScreen;
    }
    if (!Document.prototype.exitFullscreen) {
        Document.prototype.exitFullscreen = Document.prototype.webkitExitFullscreen || Document.prototype.mozCancelFullScreen;
    }
    var UserSelect = {
        blockSelect: function (e) {
            e.preventDefault();
            e.stopPropagation();
        },
        block: function () {
            document.body.focus();
            document.addEventListener('selectstart', UserSelect.blockSelect, true);
        },
        unblock: function () {
            document.removeEventListener('selectstart', UserSelect.blockSelect, true);
        }
    };
    var Util = {
        getRelativePosition: function (x, relativeElement) {
            var leftOffset = relativeElement.getBoundingClientRect().left;
            return Math.max(0, Math.min(1, (x - leftOffset) / relativeElement.offsetWidth));
        },
        padLeft: function (num, width, char) {
            return Array(width - String(num).length + 1).join(char || '0') + num;
        }
    };
    var MediaSource = (function () {
        function MediaSource(attributes) {
            this.src = attributes.src;
            this.type = attributes.type;
        }
        MediaSource.prototype.toElement = function () {
            var el = document.createElement('source');
            el.src = this.src;
            el.type = this.type;
            return el;
        };
        return MediaSource;
    })();
    Carbon.MediaPlayerFactory = {
        pauseAll: function () {
            for (var _i = 0, _a = Array.from(document.querySelectorAll('.playing')); _i < _a.length; _i++) {
                var el = _a[_i];
                MediaPlayer.get(el).pause();
            }
        }
    };
    var MediaPlayer = (function () {
        function MediaPlayer(element, options) {
            var _this = this;
            this.sources = [];
            this.status = 0;
            this.bufferedTime = 0;
            this.isFullscreen = false;
            this.index = 0;
            this.ready = new Deferred();
            if (!element)
                throw new Error('[MediaPlayer] not found');
            this.element = element;
            this.width = element.clientWidth;
            this.height = element.clientHeight;
            this.head = this.element.querySelector('video,audio');
            this.head.controls = false;
            this.type = this.head.tagName.toLowerCase();
            if (options) {
                if (options.sources) {
                    for (var _i = 0, _a = options.sources; _i < _a.length; _i++) {
                        var source = _a[_i];
                        this.head.appendChild(new MediaSource(source).toElement());
                    }
                }
                if (options.poster) {
                    this.setPoster(options.poster);
                }
            }
            for (var _b = 0, _c = Array.from(this.head.querySelectorAll('source')); _b < _c.length; _b++) {
                var el = _c[_b];
                if (el.type == 'application/dash+xml' && window.shaka && !this.head.canPlayType(el.type)) {
                    var p = new shaka.player.Player(this.head);
                    p.addEventListener('error', function (err) {
                        console.error(err);
                    });
                    if (!MediaPlayer.estimator) {
                        MediaPlayer.estimator = new shaka.util.EWMABandwidthEstimator();
                    }
                    var source_1 = new shaka.player.DashVideoSource(el.src, null, MediaPlayer.estimator);
                    p.load(source_1);
                    window.debugPlayer = p;
                }
                this.sources.push(new MediaSource(el));
            }
            this.element.classList.add('supportsFullscreen');
            ['fullscreenchange', 'mozfullscreenchange', 'webkitfullscreenchange'].forEach(function (name) {
                document.addEventListener(name, _this.onFullscreenChange.bind(_this), false);
            });
            this.controls = new MediaPlayerControls(this);
            if (options && options.duration) {
                this.controls.setDuration(options.duration);
            }
            this.head.addEventListener('durationchange', this.onLoad.bind(this));
            this.head.addEventListener('ended', this.onEnded.bind(this));
            this.head.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
            this.head.addEventListener('progress', this.onProgress.bind(this));
            this.head.addEventListener('seeking', this.onSeeking.bind(this));
            this.head.addEventListener('seeked', this.onSeeked.bind(this));
            this.head.addEventListener('waiting', this.onWaiting.bind(this));
            this.head.addEventListener('error', this.onError.bind(this));
            if (this.autoplay)
                this.play();
            MediaPlayer.instances.set(this.element, this);
        }
        MediaPlayer.get = function (el, options) {
            if (!el)
                throw new Error('[MediaPlayer] element is undefined');
            return MediaPlayer.instances.get(el) || new MediaPlayer(el, options);
        };
        MediaPlayer.prototype.on = function (type, callback) {
            this.element.addEventListener(type, callback, false);
        };
        MediaPlayer.prototype.setSize = function (width, height) {
            this.width = width;
            this.height = height;
            this.element.style.width = width + 'px';
            this.element.style.height = height + 'px';
        };
        MediaPlayer.prototype.setPoster = function (poster) {
            var posterEl = this.element.querySelector('.poster');
            if (posterEl) {
                posterEl.style.backgroundImage = "url('" + (poster.src || poster.url) + "')";
            }
        };
        Object.defineProperty(MediaPlayer.prototype, "autoplay", {
            get: function () {
                return this.head.hasAttribute('autoplay');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaPlayer.prototype, "played", {
            get: function () {
                return this.element.matches('.played');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaPlayer.prototype, "playing", {
            get: function () {
                return this.element.matches('.playing');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaPlayer.prototype, "paused", {
            get: function () {
                return this.head.paused;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaPlayer.prototype, "ended", {
            get: function () {
                return this.head.ended;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaPlayer.prototype, "seeking", {
            get: function () {
                return this.element.matches('.seeking');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaPlayer.prototype, "duration", {
            get: function () {
                return this.head.duration;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaPlayer.prototype, "volume", {
            get: function () {
                return this.head.volume;
            },
            set: function (value) {
                this.head.volume = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaPlayer.prototype, "currentTime", {
            get: function () {
                return this.head.currentTime;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaPlayer.prototype, "muted", {
            get: function () {
                return this.head.muted;
            },
            enumerable: true,
            configurable: true
        });
        MediaPlayer.prototype.reset = function () {
            this.bufferedTime = 0;
            removeClass(this.element, 'played', 'playing', 'paused');
            this.element.classList.add('waiting');
            this.controls.reset();
        };
        MediaPlayer.prototype.onPlay = function () {
            removeClass(this.element, 'paused', 'ended');
            this.element.classList.add('played');
            this.element.classList.add('playing');
            if (navigator.userAgent.indexOf('iPad') > -1) {
                this.head.webkitEnterFullscreen();
            }
            trigger(this.element, 'player:play', {
                instance: this
            });
        };
        MediaPlayer.prototype.onPause = function () {
            if (this.seeking)
                return;
            this.element.classList.remove('playing');
            this.element.classList.add('paused');
            trigger(this.element, 'player:pause', {
                instance: this
            });
        };
        MediaPlayer.prototype.onEnded = function () {
            this.element.classList.remove('playing');
            this.element.classList.add('ended');
            trigger(this.element, 'player:ended', {
                instance: this
            });
        };
        MediaPlayer.prototype.onLoad = function () {
            this.element.classList.remove('loading');
            if (this.status != 1) {
                this.ready.resolve();
                trigger(this.element, 'player:loaded', {
                    instance: this,
                    duration: this.duration
                });
            }
            this.status = 1;
        };
        MediaPlayer.prototype.onTimeUpdate = function (e) {
            if (this.status != 1) {
                this.onLoad();
            }
            this.element.classList.remove('waiting');
            trigger(this.element, 'player:timeupdate', {
                instance: this,
                duration: this.duration,
                currentTime: this.head.currentTime,
                position: this.head.currentTime / this.head.duration
            });
        };
        MediaPlayer.prototype.onBufferedTimeChange = function (bufferedTime) {
            this.bufferedTime = bufferedTime;
            trigger(this.element, 'player:bufferupdate', {
                instance: this,
                bufferedTime: bufferedTime
            });
        };
        MediaPlayer.prototype.mute = function () {
            this.head.muted = true;
            var volumeEl = this.element.querySelector('.volume');
            if (volumeEl) {
                volumeEl.classList.add('muted');
            }
            trigger(this.element, 'player:muted', {
                instance: this
            });
        };
        MediaPlayer.prototype.unmute = function () {
            this.head.muted = false;
            this.element.classList.remove('muted');
            var volumeEl = this.element.querySelector('.volume');
            if (volumeEl) {
                volumeEl.classList.remove('muted');
            }
        };
        MediaPlayer.prototype.onError = function (error) {
            console.log('media error', error);
        };
        MediaPlayer.prototype.onSeeking = function () {
            this.element.classList.add('waiting');
            trigger(this.element, 'player:seeking', {
                instance: this
            });
        };
        MediaPlayer.prototype.onSeeked = function () {
            removeClass(this.element, 'seeking', 'waiting');
            trigger(this.element, 'player:seeked', {
                instance: this
            });
        };
        MediaPlayer.prototype.onWaiting = function () {
            trigger(this.element, 'player:waiting', {
                instance: this
            });
        };
        MediaPlayer.prototype.enterFullscreen = function () {
            this.element.requestFullscreen();
            this.isFullscreen = true;
            document.body.classList.add('playerIsFullscreen');
            this.element.classList.add('fullscreen');
        };
        MediaPlayer.prototype.exitFullscreen = function () {
            this.isFullscreen = false;
            document.body.classList.remove('playerIsFullscreen');
            this.element.classList.remove('fullscreen');
            document.exitFullscreen();
        };
        MediaPlayer.prototype.onFullscreenChange = function (e) {
            console.log('fullscreen change', e, document.fullscreenElement);
            this.isFullscreen = document.mozFullScreen || document.webkitIsFullScreen;
            if (this.isFullscreen) {
                this.element.classList.add('fullscreen');
            }
            else {
                this.element.classList.remove('fullscreen');
            }
            this.head.controls = false;
        };
        MediaPlayer.prototype.play = function () {
            Carbon.MediaPlayerFactory.pauseAll();
            this.head.play();
            this.onPlay();
            if (this.status != 1) {
                this.element.classList.add('loading');
            }
            return this.ready.promise;
        };
        MediaPlayer.prototype.pause = function () {
            this.head.pause();
            this.onPause();
        };
        MediaPlayer.prototype.seek = function (time) {
            this.element.classList.add('seeking');
            if (this.status) {
                this.head.currentTime = time;
            }
            trigger(this.element, 'player:seek', {
                instance: this,
                seekTime: time
            });
        };
        MediaPlayer.prototype.setSources = function (sources) {
            this.sources = sources;
            this.head.innerHTML = '';
            for (var _i = 0; _i < sources.length; _i++) {
                var source = sources[_i];
                this.element.appendChild(new MediaSource(source).toElement());
            }
            this.load();
        };
        MediaPlayer.prototype.load = function () {
            if (!this.paused)
                this.pause();
            this.reset();
            this.head.load();
        };
        MediaPlayer.prototype.onProgress = function (e) {
            var buffered = this.head.buffered;
            if (!(buffered && buffered.length >= 1))
                return;
            var bufferedTime = buffered.end(0);
            this.onBufferedTimeChange(bufferedTime);
        };
        MediaPlayer.instances = new WeakMap();
        return MediaPlayer;
    })();
    Carbon.MediaPlayer = MediaPlayer;
    var MediaPlayerControls = (function () {
        function MediaPlayerControls(player) {
            this.hidden = false;
            this.player = player;
            this.element = this.player.element.querySelector('carbon-controls');
            var scrubberEl = this.element.querySelector('carbon-scrubber');
            this.scrubber = new Scrubber(scrubberEl, this);
            var muteToggleEl = this.element.querySelector('.muteToggle');
            var fullscreenToggleEl = this.element.querySelector('.fullscreenToggle');
            if (muteToggleEl)
                muteToggleEl.addEventListener('click', this.toggleMute.bind(this), true);
            if (fullscreenToggleEl)
                fullscreenToggleEl.addEventListener('click', this.toggleFullscreen.bind(this), true);
            this.bufferedBar = new Bar(this.element.querySelector('.bufferedBar'));
            this.playedBar = new Bar(this.element.querySelector('.playedBar'));
            this.currentTimeEl = this.element.querySelector('time.current');
            this.totalTimeEl = this.element.querySelector('time.total');
            this.player.on('player:seek', this.onTimeUpdate.bind(this));
            this.player.on('player:timeupdate', this.onTimeUpdate.bind(this));
            this.player.on('player:bufferupdate', this.onBufferUpdate.bind(this));
            this.player.on('mousemove', this.mouseMove.bind(this));
            this.player.on('mouseenter', this.mouseMove.bind(this));
            this.player.on('mouseleave', this.mouseOut.bind(this));
            if (!this.player.element.matches('.audio')) {
                this.player.element.addEventListener('click', this.togglePlay.bind(this));
            }
            var isTouch = ('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0);
            if (isTouch) {
                this.element.classList.add('touchSupported');
            }
            this.element.querySelector('.playToggle').addEventListener('click', this.togglePlay.bind(this));
        }
        MediaPlayerControls.prototype.onBufferUpdate = function (e) {
            var bufferedValue = e.detail.bufferedTime / this.player.duration;
            this.bufferedBar.setValue(bufferedValue);
        };
        MediaPlayerControls.prototype.setDuration = function (duration) {
            var minutes = Math.floor(duration / 60);
            var seconds = Math.floor(duration % 60);
            this.totalTimeEl.innerText = Util.padLeft(minutes, 1, '0') + ":" + Util.padLeft(seconds, 2, '0');
        };
        MediaPlayerControls.prototype.onTimeUpdate = function (e) {
            var time = this.player.currentTime;
            var playedValue = time / this.player.duration;
            var minutes = Math.floor(time / 60);
            var seconds = Math.floor(time % 60);
            this.playedBar.setValue(playedValue);
            this.currentTimeEl.innerText = Util.padLeft(minutes, 1, '0') + ":" + Util.padLeft(seconds, 2, '0');
            var left = this.playedBar.width();
            var currentTimeWidth = outerWidth(this.currentTimeEl);
            if (left > currentTimeWidth) {
                this.currentTimeEl.style.left = (left - currentTimeWidth) + 'px';
            }
        };
        MediaPlayerControls.prototype.toggleMute = function (e) {
            e.stopPropagation();
            if (this.player.muted) {
                this.player.element.classList.remove('muted');
                this.player.unmute();
            }
            else {
                this.player.element.classList.add('muted');
                this.player.mute();
            }
        };
        MediaPlayerControls.prototype.togglePlay = function (e) {
            if (this.player.paused) {
                this.player.play();
            }
            else {
                this.player.pause();
            }
            e.stopPropagation();
            e.preventDefault();
        };
        MediaPlayerControls.prototype.toggleFullscreen = function (e) {
            this.player[(this.player.isFullscreen ? 'exit' : 'enter') + 'Fullscreen']();
            e.stopPropagation();
        };
        MediaPlayerControls.prototype.reset = function () {
            this.playedBar.setValue(0);
            this.bufferedBar.setValue(0);
        };
        MediaPlayerControls.prototype.hoverIdle = function (e) {
            this.player.element.classList.add('hoverIdle');
            this.one = true;
        };
        MediaPlayerControls.prototype.mouseOut = function (e) {
            removeClass(this.player.element, 'hovering', 'hoverIdle');
        };
        MediaPlayerControls.prototype.mouseMove = function (e) {
            if (this.one) {
                this.one = false;
                return;
            }
            this.player.element.classList.remove('hoverIdle');
            this.player.element.classList.add('hovering');
            if (this.mouseMoveTimeout)
                clearInterval(this.mouseMoveTimeout);
            this.mouseMoveTimeout = setTimeout(this.hoverIdle.bind(this), 3000);
        };
        return MediaPlayerControls;
    })();
    Carbon.MediaPlayerControls = MediaPlayerControls;
    var Scrubber = (function () {
        function Scrubber(element, controls) {
            this.dragging = false;
            this.wasPlaying = false;
            this.isTouch = ('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0);
            this.listeners = [];
            this.element = element;
            this.controls = controls;
            this.player = this.controls.player;
            this.trackEl = this.element.querySelector('.track');
            if (!this.trackEl)
                this.trackEl = this.element;
            if (this.isTouch) {
                this.trackEl.addEventListener('touchstart', this.startScrub.bind(this), false);
            }
            else {
                this.trackEl.addEventListener('mousedown', this.startScrub.bind(this), false);
                this.trackEl.addEventListener('mouseover', this.onMouseOver.bind(this), false);
                this.trackEl.addEventListener('mouseout', this.onMouseOut.bind(this), false);
            }
            this.element.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
            }, true);
        }
        Scrubber.prototype.onMouseOver = function (e) {
            this.player.element.classList.add('hoveringTrack');
        };
        Scrubber.prototype.onMouseOut = function (e) {
            this.player.element.classList.remove('hoveringTrack');
        };
        Scrubber.prototype.startScrub = function (e) {
            if (!this.player.played) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            UserSelect.block();
            this.wasPlaying = !this.player.paused;
            this.dragging = true;
            this.scrubTo(e);
            if (this.wasPlaying)
                this.player.pause();
            if (this.wasPlaying) {
                this.player.element.classList.remove('paused');
                this.player.element.classList.add('playing');
            }
            if (this.isTouch) {
                this.listeners.push(new EventHandler(this.trackEl, 'touchend', this.stopScrub.bind(this)), new EventHandler(this.trackEl, 'touchmove', this.scrubTo.bind(this)));
            }
            else {
                this.listeners.push(new EventHandler(document, 'mousemove', this.scrubTo.bind(this)), new EventHandler(document, 'mouseup', this.stopScrub.bind(this)));
            }
        };
        Scrubber.prototype.stopScrub = function (e) {
            UserSelect.unblock();
            this.dragging = false;
            this.scrubTo(e);
            if (this.wasPlaying)
                this.player.play();
            this.player.element.classList.remove('scrubbing');
            while (this.listeners.length > 0) {
                this.listeners.pop().stop();
            }
        };
        Scrubber.prototype.scrubTo = function (e) {
            var x = e.pageX;
            var position = Util.getRelativePosition(x, this.element);
            if (e.type == 'mousemove') {
                this.player.element.classList.add('scrubbing');
            }
            this.setPosition(position);
        };
        Scrubber.prototype.setPosition = function (position) {
            this.controls.playedBar.setValue(position);
            var seekTime = this.player.duration * position;
            this.player.seek(seekTime);
        };
        return Scrubber;
    })();
    var Bar = (function () {
        function Bar(element) {
            this.element = element;
        }
        Bar.prototype.setValue = function (value) {
            if (!this.element)
                return;
            if (value == 1) {
                this.element.classList.add('end');
            }
            else {
                this.element.classList.remove('end');
            }
            this.element.style.width = (value * 100) + '%';
        };
        Bar.prototype.width = function () {
            if (!this.element)
                return 0;
            return this.element.clientWidth;
        };
        return Bar;
    })();
    var Waveform = (function () {
        function Waveform(element, options) {
            this.fetching = false;
            this.element = element;
            this.options = options;
            this.samples = this.options.data;
            if (this.element.dataset['samples']) {
                this.samples = JSON.parse(element.dataset['samples']);
            }
            if (!this.samples) {
                this._fetchData();
            }
            else {
                this.render();
            }
            var playerEl = this.element.closest('carbon-player');
            playerEl.addEventListener('player:timeupdate', this.fill.bind(this));
            window.addEventListener('resize', this.render.bind(this), false);
        }
        Waveform.prototype.fill = function (e) {
            var barCount = this.element.childNodes.length;
            var barsToFill = Math.ceil(barCount * e.detail.position);
            for (var i = 0; i < barCount; i++) {
                var el = this.element.childNodes[i];
                if (i < barsToFill) {
                    el.classList.add('fill');
                }
                else {
                    el.classList.remove('fill');
                }
            }
        };
        Waveform.prototype._fetchData = function () {
            // data-sample-src="/media/15/waveform"
            var _this = this;
            var sampleSrc = this.element.dataset['sampleSrc'];
            if (!sampleSrc)
                throw new Error('[Waveform] missing sample-src found');
            fetch(sampleSrc, {
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' }
            }).then(function (response) { return response.json(); })
                .then(function (json) {
                _this.samples = json.samples;
                _this.render();
            });
        };
        Waveform.prototype.render = function () {
            if (!this.samples)
                return;
            if (this.width == this.element.offsetWidth)
                return;
            this.width = this.element.offsetWidth;
            this.height = this.element.offsetHeight;
            if (this.options.onRender) {
                this.options.onRender.call(this);
            }
            var left = 0;
            this.element.innerHTML = '';
            var barCount = 0;
            for (var i = 0; i < 1000; i++) {
                left += this.options.barWidth;
                if (left > this.width)
                    break;
                barCount++;
                if (left == this.width)
                    break;
                left += this.options.gap;
            }
            left = 0;
            var pointsPerBar = this.samples.length / barCount;
            var barEl, sample, start, sum, avg, samples;
            for (var i = 0; i < barCount; i++) {
                if (pointsPerBar <= 1) {
                    start = Math.max(Math.floor(i * pointsPerBar), 1);
                    sample = this.samples[start];
                }
                else {
                    start = Math.max(Math.floor(i * pointsPerBar), 1);
                    samples = this.samples.slice(start, start + Math.floor(pointsPerBar));
                    sum = samples.reduce(function (a, b) { return a + b; });
                    avg = sum / samples.length;
                    sample = avg;
                }
                barEl = document.createElement('span');
                barEl.className = 'bar';
                barEl.style.width = this.options.barWidth + 'px';
                barEl.style.height = (this.height * sample) + 'px';
                barEl.style.left = left + 'px';
                this.element.appendChild(barEl);
                left += this.options.barWidth + this.options.gap;
            }
        };
        return Waveform;
    })();
    Carbon.Waveform = Waveform;
    function outerWidth(el) {
        var css = getComputedStyle(el);
        return parseInt(css.marginLeft, 10) + parseInt(css.marginRight, 10) + parseInt(css.width, 10);
    }
    ;
    function removeClass(element) {
        var names = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            names[_i - 1] = arguments[_i];
        }
        for (var _a = 0; _a < names.length; _a++) {
            var name = names[_a];
            element.classList.remove(name);
        }
    }
    function trigger(element, name, detail) {
        return element.dispatchEvent(new CustomEvent(name, {
            bubbles: true,
            detail: detail
        }));
    }
    Carbon.trigger = trigger;
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
    var EventHandler = (function () {
        function EventHandler(element, type, handler, useCapture) {
            if (useCapture === void 0) { useCapture = false; }
            this.element = element;
            this.type = type;
            this.handler = handler;
            this.useCapture = useCapture;
            this.element.addEventListener(type, handler, useCapture);
        }
        EventHandler.prototype.stop = function () {
            this.element.removeEventListener(this.type, this.handler, this.useCapture);
        };
        return EventHandler;
    })();
})(Carbon || (Carbon = {}));
Carbon.controllers.set('waveform', {
    setup: function (e) {
        if (e.target.matches('.setup')) {
            throw new Error('already setup');
        }
        e.target.classList.add('setup');
        var options = {
            barWidth: 3,
            gap: 2,
            onRender: function () {
                this.options.barWidth = this.width < 600 ? 2 : 3;
                this.options.gap = this.width < 600 ? 1 : 2;
            }
        };
        new Carbon.Waveform(e.target, options);
    }
});
Carbon.controllers.set('player', {
    setup: function (e) {
        Carbon.MediaPlayer.get(e.target.closest('carbon-player'));
    },
    play: function (e) {
        var playerEl = e.target.closest('carbon-player');
        var mediaEl = playerEl.querySelector('video,audio');
        mediaEl.autoplay = true;
        Carbon.MediaPlayer.get(playerEl).play();
    },
    togglePlay: function (e) {
        var target = e.target;
        var player = Carbon.MediaPlayer.get(target.closest('carbon-player'));
        if (player.paused)
            player.play();
        else
            player.pause();
    },
    pause: function (e) {
        Carbon.MediaPlayer.get(e.target.closest('carbon-player')).pause();
    }
});
