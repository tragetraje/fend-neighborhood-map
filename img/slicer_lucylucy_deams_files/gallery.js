var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Carbon;
(function (Carbon) {
    var pieceBuiltEvent = Carbon.Reactive.get('piece:built');
    if (pieceBuiltEvent) {
        pieceBuiltEvent.mode = 'queue';
        document.addEventListener('DOMContentLoaded', function () {
            pieceBuiltEvent.drain();
        });
    }
    var Gallery = (function () {
        function Gallery(element) {
            this.element = element;
            Object.keys(Gallery.instances).forEach(function (galleryKey) {
                var key = parseInt(galleryKey, 10);
                Gallery.get(key).unbindEvents();
            });
            this.viewportEl = this.element.querySelector('.viewport');
            this.leftFlipper = this.element.querySelector('carbon-flipper.prev');
            this.rightFlipper = this.element.querySelector('carbon-flipper.next');
            this.id = parseInt(element.id.replace("gallery_", ""), 10);
            Gallery.instances[this.id] = this;
            this.element.id = 'flipbook';
            this.contentEl = document.createElement('div');
            this.contentEl.classList.add('content');
            this.viewportEl.appendChild(this.contentEl);
            this.slides = this.loadData();
            var thumbnailEl = this.element.querySelector('.thumbnails');
            if (thumbnailEl) {
                this.thumbnails = new ThumbnailStrip(thumbnailEl, this);
            }
            this.spinnerEl = document.createElement('div');
            this.spinnerEl.classList.add('spinner');
            this.viewportEl.appendChild(this.spinnerEl);
            this.currentPosition = 0;
            this.currentSlide = this.slides[0];
            this.gotoIndex(this.currentPosition, { skipAnimation: true, skipPushState: true });
            this.bindEvents();
            this.onResize();
        }
        Gallery.get = function (id) {
            return Gallery.instances[id];
        };
        Gallery.prototype.bindEvents = function () {
            this.popStateListener = this.onPopState.bind(this);
            window.addEventListener('popstate', this.popStateListener, false);
            this.resizeListener = this.onResize.bind(this);
            window.addEventListener('resize', this.resizeListener, false);
            this.keyupListener = this.onKeyup.bind(this);
            document.addEventListener('keyup', this.keyupListener, false);
            if (this.leftFlipper) {
                this.leftFlipper.addEventListener('click', this.previous.bind(this), false);
            }
            if (this.rightFlipper) {
                this.rightFlipper.addEventListener('click', this.next.bind(this), false);
            }
        };
        Gallery.prototype.unbindEvents = function () {
            window.removeEventListener('popstate', this.popStateListener, false);
            window.removeEventListener('resize', this.resizeListener, false);
            document.removeEventListener('keyup', this.keyupListener, false);
            if (this.leftFlipper) {
                this.leftFlipper.removeEventListener('click', this.previous.bind(this), false);
            }
            if (this.rightFlipper) {
                this.rightFlipper.removeEventListener('click', this.next.bind(this), false);
            }
        };
        Gallery.prototype.onResize = function () {
            this.sizeFlippers();
        };
        Gallery.prototype.onKeyup = function (e) {
            switch (e.which) {
                case 39:
                    this.next();
                    break;
                case 37:
                    this.previous();
                    break;
            }
        };
        Gallery.prototype.onPopState = function (e) {
            if (e.state.triggeredBy === 'gallery') {
                if (e.state.projectId === this.id) {
                    this.gotoPiece(e.state.pieceId, { skipPushState: true });
                }
                else {
                    CM.site.load({ url: "/projects/" + e.state.projectId + "/" + e.state.pieceId });
                }
            }
        };
        Gallery.prototype.sizeFlippers = function () {
            var rect = this.element.getBoundingClientRect();
            this.element.queryAll('carbon-flipper').forEach(function (node) {
                node.style.height = rect.height + "px";
                node.style.width = rect.left + "px";
                node.style.top = rect.top + "px";
            });
        };
        Gallery.prototype.clear = function () {
            while (this.contentEl.lastChild) {
                this.contentEl.removeChild(this.contentEl.lastChild);
            }
        };
        Gallery.prototype.loadData = function () {
            var _this = this;
            var dataEl = this.element.querySelector('script');
            var slideData = JSON.parse(dataEl.textContent);
            return slideData.map(function (slideObject, index) {
                return new Slide(slideObject, index, _this);
            });
        };
        Gallery.prototype.hideSpinner = function (index) {
            if (index) {
                if (index !== this.currentPosition) {
                    return false;
                }
            }
            this.spinnerEl.classList.remove('visible');
        };
        Gallery.prototype.showSpinner = function () {
            this.spinnerEl.classList.add('visible');
        };
        Gallery.prototype.gotoPiece = function (pieceId, options) {
            options = options || {};
            for (var _i = 0, _a = this.slides; _i < _a.length; _i++) {
                var slide = _a[_i];
                if (slide.attributes.id == pieceId) {
                    return this.gotoIndex(slide.index, options);
                }
            }
            console.warn('no piece found with index', pieceId);
        };
        Gallery.prototype.gotoIndex = function (index, options) {
            options = options || {};
            this.currentPosition = index;
            this.currentSlide = this.slides[index];
            var newSlide = this.slides[this.currentPosition].build();
            var projectId = this.id;
            var pieceId = this.slides[this.currentPosition].attributes.id;
            if (!options.skipPushState) {
                history.pushState({
                    triggeredBy: 'gallery',
                    projectId: projectId,
                    pieceId: pieceId
                }, null, "/projects/" + projectId + "/" + pieceId);
            }
            new FadeSlideTransition({
                gallery: this,
                newSlide: newSlide,
                slideData: this.currentSlide,
                canvas: this.contentEl,
                options: options
            }).run();
        };
        Object.defineProperty(Gallery.prototype, "nextIndex", {
            get: function () {
                var nextIndex = this.currentPosition + 1;
                if (nextIndex >= this.slides.length) {
                    return 0;
                }
                else {
                    return nextIndex;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Gallery.prototype, "previousIndex", {
            get: function () {
                var nextIndex = this.currentPosition - 1;
                return (nextIndex < 0) ? this.slides.length - 1 : nextIndex;
            },
            enumerable: true,
            configurable: true
        });
        Gallery.prototype.next = function () {
            this.gotoIndex(this.nextIndex);
        };
        Gallery.prototype.previous = function () {
            this.gotoIndex(this.previousIndex);
        };
        Gallery.instances = {};
        return Gallery;
    })();
    Carbon.Gallery = Gallery;
    var Slide = (function () {
        function Slide(attributes, index, gallery) {
            this.attributes = attributes;
            this.gallery = gallery;
            this.index = index;
            this.loaded = this.attributes.type !== 'image';
        }
        Slide.prototype.getBuilder = function (type) {
            return {
                'image': ImageSlideBuilder,
                'text': TextSlideBuilder,
                'audio': AudioSlideBuilder,
                'swf': SwfSlideBuilder,
                'video': VideoSlideBuilder
            }[type];
        };
        Slide.prototype.getTemplate = function () {
            var templateEl = document.querySelector("#gallery-" + this.attributes.type);
            if (!templateEl) {
                throw new Error("no " + this.attributes.type + " template found");
            }
            return templateEl.content.cloneNode(true);
        };
        Object.defineProperty(Slide.prototype, "size", {
            get: function () {
                if (!this.attributes.size) {
                    return {};
                }
                else {
                    var _a = this.attributes.size.split('x'), width = _a[0], height = _a[1];
                    return {
                        width: parseInt(width, 10),
                        height: parseInt(height, 10)
                    };
                }
            },
            enumerable: true,
            configurable: true
        });
        Slide.prototype.build = function () {
            if (this.element) {
                return this.element;
            }
            this.element = document.createDocumentFragment();
            var builder = this.getBuilder(this.attributes.type);
            if (!builder) {
                throw new Error("slide type " + this.attributes.type + " not implemented");
            }
            this.element.appendChild(new builder(this).build());
            Carbon.Reactive.trigger('piece:built', {
                element: this.element.querySelector('carbon-piece'),
                data: this.attributes
            });
            return this.element;
        };
        return Slide;
    })();
    Carbon.Slide = Slide;
    var SlideBuilder = (function () {
        function SlideBuilder(slide) {
            this.slide = slide;
            this.template = this.buildTemplate();
        }
        SlideBuilder.prototype.buildTemplate = function () {
            var wrapperEl = document.createElement('div');
            wrapperEl.classList.add('slide');
            var pieceEl = document.createElement('carbon-piece');
            pieceEl.dataset['type'] = this.slide.attributes.type;
            if (this.slide.attributes.size) {
                pieceEl.dataset['dimensions'] = this.slide.attributes.size;
            }
            var contentTemplate = this.slide.getTemplate();
            pieceEl.appendChild(contentTemplate);
            wrapperEl.appendChild(pieceEl);
            return wrapperEl;
        };
        return SlideBuilder;
    })();
    var ImageSlideBuilder = (function (_super) {
        __extends(ImageSlideBuilder, _super);
        function ImageSlideBuilder() {
            _super.apply(this, arguments);
        }
        ImageSlideBuilder.prototype.build = function () {
            var _this = this;
            var artworkEl = this.template.querySelector('.artwork');
            var imageUrl = this.slide.attributes.srcset.split(' ')[0];
            var imagePreload = new Image();
            imagePreload.onload = function () {
                _this.slide.loaded = true;
                _this.slide.gallery.hideSpinner(_this.slide.index);
            };
            imagePreload.src = imageUrl;
            var captionText = this.slide.attributes.description;
            if (captionText) {
                this.template.querySelector('carbon-caption').innerHTML = captionText;
            }
            artworkEl.style.backgroundImage = "url('" + imageUrl + "')";
            return this.template;
        };
        return ImageSlideBuilder;
    })(SlideBuilder);
    var TextSlideBuilder = (function (_super) {
        __extends(TextSlideBuilder, _super);
        function TextSlideBuilder() {
            _super.apply(this, arguments);
        }
        TextSlideBuilder.prototype.build = function () {
            this.template.querySelector('carbon-text').innerHTML = this.slide.attributes.html;
            return this.template;
        };
        return TextSlideBuilder;
    })(SlideBuilder);
    var SwfSlideBuilder = (function (_super) {
        __extends(SwfSlideBuilder, _super);
        function SwfSlideBuilder() {
            _super.apply(this, arguments);
        }
        SwfSlideBuilder.prototype.build = function () {
            var objectEl = this.template.querySelector('object');
            objectEl.width = this.slide.size.width;
            objectEl.height = this.slide.size.height;
            var paramEl = objectEl.querySelector('param[name=movie]');
            paramEl.value = this.slide.attributes.src;
            var embedEl = objectEl.querySelector('embed');
            embedEl.src = this.slide.attributes.src;
            embedEl.width = this.slide.size.width;
            embedEl.height = this.slide.size.height;
            return this.template;
        };
        return SwfSlideBuilder;
    })(SlideBuilder);
    var VideoSlideBuilder = (function (_super) {
        __extends(VideoSlideBuilder, _super);
        function VideoSlideBuilder() {
            _super.apply(this, arguments);
        }
        VideoSlideBuilder.prototype.build = function () {
            var playerEl = this.template.querySelector('carbon-player');
            playerEl.style.width = this.slide.size.width + "px";
            playerEl.style.height = this.slide.size.height + "px";
            var playerOptions = {
                duration: this.slide.attributes.duration,
                sources: this.slide.attributes.sources
            };
            if (this.slide.attributes.poster) {
                playerOptions.poster = {
                    src: this.slide.attributes.poster.src
                };
            }
            Carbon.MediaPlayer.get(playerEl, playerOptions);
            var captionText = this.slide.attributes.description;
            if (captionText) {
                this.template.querySelector('carbon-caption').innerHTML = captionText;
            }
            return this.template;
        };
        return VideoSlideBuilder;
    })(SlideBuilder);
    var AudioSlideBuilder = (function (_super) {
        __extends(AudioSlideBuilder, _super);
        function AudioSlideBuilder() {
            _super.apply(this, arguments);
        }
        AudioSlideBuilder.prototype.build = function () {
            var containerEl = this.template.querySelector('carbon-container');
            var waveformEl = this.template.querySelector('carbon-waveform');
            waveformEl.dataset['sampleSrc'] = "/media/" + this.slide.attributes.mediaId + "/waveform";
            var captionParagraph = document.createElement('p');
            captionParagraph.innerHTML = this.slide.attributes.description;
            var captionEl = this.template.querySelector('carbon-caption');
            captionEl.appendChild(captionParagraph);
            if (this.slide.attributes.poster) {
                var artworkEl = this.template.querySelector('.artwork');
                artworkEl.style.backgroundImage = "url('" + this.slide.attributes.poster.src + "')";
            }
            else {
                containerEl.classList.add('collapsed');
                this.template.querySelector('.artwork').remove();
                this.template.querySelector('.overlay').remove();
            }
            var playerOptions = {
                duration: this.slide.attributes.duration,
                sources: this.slide.attributes.sources
            };
            if (this.slide.attributes.poster) {
                playerOptions.poster = {
                    src: this.slide.attributes.poster.src
                };
            }
            var playerEl = this.template.querySelector('carbon-player');
            Carbon.MediaPlayer.get(playerEl, playerOptions);
            return this.template;
        };
        return AudioSlideBuilder;
    })(SlideBuilder);
    var ThumbnailStrip = (function () {
        function ThumbnailStrip(element, gallery) {
            this.element = element;
            this.gallery = gallery;
            this.left = 0;
            this.contentEl = this.element.querySelector('ul');
            this.thumbnails = this.contentEl.children;
            this.contentEl.addEventListener('click', this.onClick.bind(this));
            this.contentWidth = parseInt(this.contentEl.dataset['width']);
            this.contentEl.style.width = this.contentWidth + 'px';
            this.layout();
        }
        ThumbnailStrip.prototype.layout = function () {
            var thumbstripBounds = this.element.getBoundingClientRect();
            if (thumbstripBounds.width > this.contentWidth) {
                this.element.classList.add('centered');
            }
            this.element.classList.add('loaded');
        };
        ThumbnailStrip.prototype.onClick = function (e) {
            var el = e.target.closest('li');
            if (!el)
                return;
            var index = Array.prototype.indexOf.call(this.contentEl.children, el);
            this.gotoIndex(index);
        };
        ThumbnailStrip.prototype.gotoIndex = function (index, options) {
            options = options || {};
            var thumbEl = this.thumbnails[index];
            this.element.queryAll('.selected').forEach(function (node) {
                node.classList.remove('selected');
            });
            thumbEl.classList.add('selected');
            if (this.gallery) {
                if (this.gallery.currentPosition !== index) {
                    this.gallery.gotoIndex(index);
                }
            }
            this.moveTo(thumbEl, options);
        };
        ThumbnailStrip.prototype.moveTo = function (element, options) {
            var _this = this;
            var viewportWidth = this.element.clientWidth;
            if (viewportWidth > this.contentWidth) {
                this.element.classList.add('centered');
                this.contentEl.style.width = viewportWidth + "px";
            }
            else {
                var viewportCenterline = viewportWidth / 2;
                var scrollTo_1 = element.offsetLeft - viewportCenterline + (element.clientWidth / 2);
                var computedScrollLimit = this.contentWidth - viewportWidth;
                if (scrollTo_1 > computedScrollLimit) {
                    scrollTo_1 = computedScrollLimit;
                }
                if (scrollTo_1 < 0) {
                    scrollTo_1 = 0;
                }
                ;
                if (this.player && this.player.playState !== 'finished') {
                    this.player.playbackRate = 2.0;
                    this.player.onfinish = function () {
                        console.log('chained');
                        _this._animate(scrollTo_1, options.skipAnimation ? 0 : 100);
                    };
                    return;
                }
                this._animate(scrollTo_1, options.skipAnimation ? 0 : 100);
            }
        };
        ThumbnailStrip.prototype._animate = function (scrollTo, duration) {
            this.player = this.contentEl.animate([
                { transform: "translateX(-" + this.left + "px)" },
                { transform: "translateX(-" + scrollTo + "px)" }
            ], {
                duration: duration,
                easing: 'ease-out',
                fill: 'forwards'
            });
            this.left = scrollTo;
        };
        return ThumbnailStrip;
    })();
    var SlideTransition = (function () {
        function SlideTransition(cxt) {
            this.cxt = cxt;
        }
        SlideTransition.prototype.run = function () {
            this.before().then(this.during).then(this.after);
        };
        SlideTransition.prototype.before = function () {
            throw new Error('# before not implimented on Transition subclass');
        };
        SlideTransition.prototype.during = function (context) {
            throw new Error('# during not implimented on Transition subclass');
        };
        SlideTransition.prototype.after = function (context) {
            throw new Error('# after not implimented on Transition subclass');
        };
        return SlideTransition;
    })();
    var FadeSlideTransition = (function (_super) {
        __extends(FadeSlideTransition, _super);
        function FadeSlideTransition() {
            _super.apply(this, arguments);
        }
        FadeSlideTransition.prototype.before = function () {
            var gallery = this.cxt.gallery;
            gallery.slides[gallery.previousIndex].build();
            gallery.slides[gallery.nextIndex].build();
            return Promise.resolve(this.cxt);
        };
        FadeSlideTransition.prototype.during = function (context) {
            return new Promise(function (resolve, reject) {
                var canvas = context.canvas, newSlide = context.newSlide, options = context.options, slideData = context.slideData;
                var gallery = context.gallery;
                var player = canvas.animate([
                    { opacity: 1 },
                    { opacity: 0 }
                ], {
                    duration: 50,
                    fill: 'forwards'
                });
                player.onfinish = function () {
                    gallery.clear();
                    canvas.appendChild(newSlide.cloneNode(true));
                    canvas.queryAll('[on-insert]').forEach(function (el) {
                        Carbon.ActionKit.dispatch({ type: 'insert', target: el });
                        el.removeAttribute('on-insert');
                    });
                    if (gallery.thumbnails) {
                        gallery.thumbnails.gotoIndex(gallery.currentPosition, options);
                    }
                    var slide = gallery.currentSlide;
                    var captionHeight = canvas.querySelector('carbon-caption').getBoundingClientRect().height;
                    if (slide.attributes.type === 'image') {
                        var height = slide.size.height;
                        var imageEl = canvas.querySelector('.artwork');
                        imageEl.style.height = height + 'px';
                        gallery.viewportEl.style.height = (captionHeight + height) + 'px';
                        if (!slideData.loaded) {
                            gallery.showSpinner();
                        }
                        else {
                            gallery.hideSpinner();
                        }
                    }
                    else if (slide.attributes.type === 'audio') {
                        if (gallery.currentSlide.attributes.poster) {
                            var totalHeight = canvas.getBoundingClientRect().height;
                            var containerEl = canvas.querySelector('carbon-container');
                            containerEl.style.height = (totalHeight - (captionHeight + 10)) + "px";
                        }
                    }
                    else if (slide.attributes.type === 'video') {
                        var playerEl = canvas.querySelector('carbon-player');
                        playerEl.style.height = "540px";
                        gallery.viewportEl.style.height = captionHeight ? (540 + captionHeight) + "px" : "540px";
                    }
                    canvas.animate([
                        { opacity: 0 },
                        { opacity: 1 }
                    ], {
                        duration: 250,
                        fill: 'forwards'
                    });
                    resolve();
                };
            });
        };
        FadeSlideTransition.prototype.after = function (context) {
            return Promise.resolve(true);
        };
        return FadeSlideTransition;
    })(SlideTransition);
})(Carbon || (Carbon = {}));
(function templatePolyfill(d) {
    if ('content' in d.createElement('template')) {
        return false;
    }
    var qPlates = d.getElementsByTagName('template'), plateLen = qPlates.length, elPlate, qContent, contentLen, docContent;
    for (var x = 0; x < plateLen; ++x) {
        elPlate = qPlates[x];
        qContent = elPlate.childNodes;
        contentLen = qContent.length;
        docContent = d.createDocumentFragment();
        while (qContent[0]) {
            docContent.appendChild(qContent[0]);
        }
        elPlate.content = docContent;
    }
})(document);
