"use strict";
var Carbon;
(function (Carbon) {
    var authenticityTokenMetaEl = document.querySelector('meta[name="authenticityToken"]');
    Carbon.authenticityToken = null;
    if (authenticityTokenMetaEl) {
        Carbon.authenticityToken = authenticityTokenMetaEl.content;
    }
    Carbon.formatters = new Map();
    Carbon.formatters.set('standard', function (value) {
        if (this.form.fields.length === 0) {
            return Promise.resolve('');
        }
        var field = this.form.fields[0];
        return Promise.resolve(field.type === 'password' ? '••••••' : field.value);
    });
    var FieldBlock = (function () {
        function FieldBlock(element) {
            var _this = this;
            this.element = element;
            if (!this.element)
                throw new Error("[FieldBlock] element is required");
            if (this.element.dataset['setup'])
                throw new Error('[FieldBlock] already setup');
            this.form = new Form(this.element.querySelector('form'));
            this.form.selectFirstError = false;
            this.form.managed = true;
            this.form.on('submit', this.onSubmit.bind(this));
            this.field = this.form.fields[0];
            this.autosave = this.element.hasAttribute('autosave');
            this.element.addEventListener('field:focus', this.onFocus.bind(this), false);
            this.element.addEventListener('field:blur', this.onBlur.bind(this), false);
            this.element.addEventListener('field:change', function () {
                _this.element.classList.add('changed');
                if (_this.element.dataset['saveFrequency']) {
                    if (_this.saveTimeout) {
                        clearInterval(_this.saveTimeout);
                    }
                    _this.saveTimeout = setTimeout(function () {
                        _.trigger(_this.element, 'saving');
                        _this.form.validate().then(function () {
                            _this.form.send().then(function () {
                                _.trigger(_this.element, 'saved');
                            });
                        });
                    }, parseInt(_this.element.dataset['saveFrequency']));
                }
            }, false);
            this.element.dataset['setup'] = 'true';
            FieldBlock.instances.set(this.element, this);
        }
        FieldBlock.get = function (element) {
            return FieldBlock.instances.get(element) || new FieldBlock(element);
        };
        FieldBlock.prototype.onFocus = function () {
            this.element.classList.add('editing');
        };
        FieldBlock.prototype.onBlur = function () {
            if (this.changed && this.autosave) {
                this.save();
            }
            this.element.classList.remove('editing');
        };
        Object.defineProperty(FieldBlock.prototype, "changed", {
            get: function () {
                return this.element.matches('.changed');
            },
            enumerable: true,
            configurable: true
        });
        FieldBlock.prototype.onSubmit = function () {
            return this.save();
        };
        FieldBlock.prototype.save = function () {
            var _this = this;
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
            }
            if (this.form.status === 1)
                return;
            this.element.classList.remove('changed');
            this.element.classList.add('saving');
            var empty = this.field.type != 'tags'
                ? _.empty(this.field.value)
                : this.field.value.length === 0;
            _.toggleClass(this.element, 'empty', empty);
            this.form.validate().then(function () {
                _this.form.send().then(_this.onSaved.bind(_this), _this.onFail.bind(_this));
            });
            return false;
        };
        FieldBlock.prototype.onFail = function () {
            _.removeClass(this.element, 'valid', 'invalid', 'saving');
        };
        FieldBlock.prototype.onSaved = function () {
            _.removeClass(this.element, 'invalid', 'saving', 'changed', 'new');
            _.addClass(this.element, 'valid', 'saved');
        };
        FieldBlock.instances = new WeakMap();
        return FieldBlock;
    })();
    Carbon.FieldBlock = FieldBlock;
    var EditBlock = (function () {
        function EditBlock(el) {
            this.editing = false;
            this.element = typeof el === 'string' ? document.querySelector(el) : el;
            if (!this.element)
                throw new Error('[EditBlock] element missing');
            if (this.element.matches('.setup')) {
                throw new Error('[EditBlock] already setup');
            }
            var cancelEl = this.element.querySelector('.cancel');
            if (cancelEl) {
                cancelEl.addEventListener('click', this.cancel.bind(this));
            }
            var formEl = this.element.querySelector('form');
            this.form = new Form(formEl);
            this.form.managed = true;
            formEl.addEventListener('submit', this.onSubmit.bind(this));
            this.formatter = Carbon.formatters.get(this.element.dataset['formatter'] || 'standard');
            this.element.classList.add('setup');
            this.element.addEventListener('click', this.edit.bind(this));
            this.textEl = this.element.querySelector('.text');
            EditBlock.instances.set(this.element, this);
        }
        EditBlock.get = function (element) {
            return EditBlock.instances.get(element) || new EditBlock(element);
        };
        EditBlock.prototype.on = function (name, callback) {
            this.element.addEventListener(name, callback, false);
        };
        EditBlock.prototype.edit = function (e) {
            if (this.element.matches('.editing, .disabled'))
                return;
            this.element.addEventListener('field:change', this.onChange.bind(this));
            if (e && e.target && e.target.matches('.action, .destroy, .handle')) {
                return;
            }
            this.editing = true;
            document.queryAll('.editBlock.editing').forEach(function (el) {
                EditBlock.get(el).close();
            });
            this.element.classList.add('editing');
            var fieldSelected = false;
            this.takeSnapshot();
            for (var _i = 0, _a = this.form.fields; _i < _a.length; _i++) {
                var field = _a[_i];
                _.trigger(field.input.element, 'poke');
                if (!fieldSelected && field.autoselect) {
                    field.select();
                    fieldSelected = true;
                }
            }
            var detail = {
                instance: this
            };
            _.trigger(this.element, 'edit', detail);
            _.trigger(this.element, 'block:edit', detail);
        };
        EditBlock.prototype.cancel = function (e) {
            this.revertToSnapshot();
            this.close(e, true);
        };
        EditBlock.prototype.close = function (e, canceled) {
            this.editing = false;
            this.element.classList.remove('editing');
            e && e.preventDefault();
            e && e.stopPropagation();
            if (canceled) {
                this.element.classList.remove('changed');
            }
            var detail = {
                canceled: canceled,
                instance: this,
                changed: this.element.matches('.changed')
            };
            this.element.classList.remove('changed');
            _.trigger(this.element, 'close', detail);
            _.trigger(this.element, 'block:close', detail);
        };
        EditBlock.prototype.setValue = function (value) {
            var field = this.form.fields[0];
            field.value = value;
            this.setPreviewHtml(value);
        };
        EditBlock.prototype.setPreviewHtml = function (value) {
            if (_.empty(value)) {
                this.element.classList.remove('populated');
                this.element.classList.add('empty');
            }
            else {
                this.element.classList.remove('empty');
                this.element.classList.add('populated');
            }
            if (this.textEl) {
                this.textEl.innerHTML = value;
            }
        };
        EditBlock.prototype.onSubmit = function () {
            return this.save();
        };
        EditBlock.prototype.onChange = function (e) {
            this.element.classList.add('changed');
            _.toggleClass(this.element, 'empty', !e.detail.value);
        };
        EditBlock.prototype.save = function () {
            var _this = this;
            if (this.form.status === 1)
                return;
            if (!this.element.matches('.changed, .adding')) {
                this.close();
                return;
            }
            if (this.onSave) {
                var result = this.onSave();
                if (result === false)
                    return false;
                if (result === true)
                    return true;
            }
            if (this.form.element.hasAttribute('passthrough'))
                return;
            this.form.validate().then(function () {
                _this.element.classList.remove('changed');
                _this.element.classList.add('saving');
                _.trigger(_this.element, 'block:save', { instance: _this });
                _this.form.send().then(_this.onSaved.bind(_this), _this.onFail.bind(_this));
            });
        };
        EditBlock.prototype.onFail = function () {
            _.removeClass(this.element, 'valid', 'invalid', 'saving');
        };
        EditBlock.prototype.onSaved = function (data) {
            var _this = this;
            var response = this.form.response;
            var saveDelay = this.element.dataset['saveDelay'];
            if (saveDelay) {
                setTimeout(function () {
                    _this._onSaved(response, data);
                }, parseInt(saveDelay));
            }
            else {
                this._onSaved(response, data);
            }
        };
        EditBlock.prototype._onSaved = function (response, data) {
            var _this = this;
            _.removeClass(this.element, 'invalid', 'saving', 'changed', 'new');
            _.addClass(this.element, 'valid', 'saved');
            this.takeSnapshot();
            var created = response && response.status === 201;
            created && this.element.classList.remove('adding');
            _.trigger(this.element, 'block:saved', {
                instance: this,
                response: response,
                data: data,
                created: created
            });
            this.formatter.call(this, data).then(function (html) {
                _this.setPreviewHtml(html);
                _this.close();
            });
        };
        EditBlock.prototype.remove = function () {
            _.trigger(this.element, 'block:remove', { instance: this });
            this.dispose();
            this.element.remove();
        };
        EditBlock.prototype.takeSnapshot = function () {
            this.form.takeSnapshot();
        };
        EditBlock.prototype.revertToSnapshot = function () {
            this.form.revertToSnapshot();
        };
        EditBlock.prototype.dispose = function () {
        };
        EditBlock.instances = new WeakMap();
        return EditBlock;
    })();
    Carbon.EditBlock = EditBlock;
    var Form = (function () {
        function Form(element) {
            var _this = this;
            this.status = 0;
            this.fields = [];
            this.focusInvalidField = true;
            this.validity = 0;
            this.selectFirstError = true;
            this.managed = false;
            this.element = (typeof element === 'string')
                ? document.querySelector(element)
                : element;
            if (!this.element)
                throw new Error('[Carbon.Form] element not found');
            this.element.setAttribute('novalidate', 'true');
            this.fields = Array
                .from(this.element.querySelectorAll('.field'))
                .filter(function (el) { return !el.parentElement.closest('.field'); })
                .map(function (el) { return new Field(el, _this); });
            if (this.element.hasAttribute('passthrough'))
                return;
            this.element.addEventListener('submit', this.onSubmit.bind(this), true);
            if (this.element.dataset['validateMode'] === 'immediate') {
                this.fields.forEach(function (field) {
                    if (!field.validateMode) {
                        field.validateMode = 'immediate';
                    }
                });
                this.element.addEventListener('field:validated', function () {
                    var valid = _this.fields.filter(function (f) { return !f.valid; }).length === 0;
                    _this.setValidity(valid ? 1 : 2);
                });
            }
            Form.instances.set(this.element, this);
            this.element.classList.add('setup');
        }
        Form.get = function (el) {
            return Form.instances.get(el) || new Form(el);
        };
        Object.defineProperty(Form.prototype, "name", {
            get: function () {
                return this.element.name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Form.prototype, "valid", {
            get: function () {
                return this.validity = 1;
            },
            enumerable: true,
            configurable: true
        });
        Form.prototype.on = function (type, listener) {
            this.element.addEventListener(type, listener);
        };
        Form.prototype.onSubmit = function (e) {
            e.preventDefault();
            if (this.managed)
                return;
            if (this.status === 1)
                return;
            var validate = this.element.dataset['validate'];
            if (validate === 'remote') {
                this.send();
                return;
            }
            this.validate().then(this.send.bind(this), function (errors) {
                console.log('errors', errors);
            });
        };
        Form.prototype.fillIn = function (data) {
            for (var key in data) {
                var value = data[key];
                var field = this.getField(key);
                if (field) {
                    field.value = value;
                }
            }
        };
        Form.prototype.validate = function () {
            var _this = this;
            this.element.classList.add('validating');
            var unvalidatedFields = this.fields.filter(function (f) { return !f.validated; });
            return new Promise(function (resolve, reject) {
                Promise.all(unvalidatedFields.map(function (f) { return f.validate(); })).then(function (results) {
                    _this.invalidFields = _this.fields.filter(function (f) { return !f.valid; });
                    var valid = _this.invalidFields.length === 0;
                    _this.setValidity(valid ? 1 : 2);
                    if (!valid && _this.focusInvalidField) {
                        _this.invalidFields[0].select();
                    }
                    _.trigger(_this.element, 'form:validated', {
                        validity: _this.validity,
                        valid: valid,
                        instance: _this
                    });
                    if (valid) {
                        resolve(true);
                    }
                    else {
                        reject(_this.invalidFields);
                    }
                });
            });
        };
        Form.prototype.setValidity = function (validity) {
            this.validity = validity;
            _.removeClass(this.element, 'validated', 'validating', 'valid', 'invalid');
            switch (validity) {
                case 1:
                    _.addClass(this.element, 'validated', 'valid');
                    break;
                case 2:
                    _.addClass(this.element, 'validated', 'invalid');
                    break;
            }
        };
        Form.prototype.send = function () {
            var _this = this;
            if (this.status === 1) {
                return Promise.reject('Sending');
            }
            this.sent = new Date().getTime();
            this.status = 1;
            this.element.classList.add('sending');
            _.trigger(this.element, 'form:send', { instance: this });
            var formData = {};
            for (var _i = 0, _a = this.fields; _i < _a.length; _i++) {
                var field = _a[_i];
                formData[field.name] = field.value;
            }
            var hiddenInputEls = this.element.queryAll('input[type="hidden"]');
            for (var _b = 0; _b < hiddenInputEls.length; _b++) {
                var input = hiddenInputEls[_b];
                if (input.name === 'authenticityToken') {
                    Carbon.authenticityToken = input.value;
                }
                else {
                    formData[input.name] = input.value;
                }
            }
            var request = new Request(this.element.action, {
                method: this.element.getAttribute('method') || 'POST',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            if (Carbon.authenticityToken) {
                request.headers.append('X-Authenticity-Token', Carbon.authenticityToken);
            }
            return fetch(request).then(function (response) {
                _this.response = response;
                return response.json();
            }).then(function (data) {
                if (_this.response.ok) {
                    _this.onSent(data);
                    return Promise.resolve(data);
                }
                else {
                    _this.onFail(data);
                    return Promise.reject(data);
                }
            });
        };
        Form.prototype.onFail = function (data) {
            this.status = 5;
            this.element.classList.remove('sending');
            var errors = data.errors;
            if (!errors)
                return;
            for (var _i = 0; _i < errors.length; _i++) {
                var error = errors[_i];
                if (error.key) {
                    var field = this.getField(error.key);
                    if (field) {
                        field.errors = [];
                        field.addError(error);
                        field.setState(2);
                    }
                }
                else {
                    this.setError(error);
                }
            }
            this.invalidFields = this.fields.filter(function (f) { return !f.valid; });
            var valid = this.invalidFields.length === 0;
            this.setValidity(valid ? 1 : 2);
            if (!valid && this.selectFirstError) {
                this.invalidFields[0].select();
            }
        };
        Form.prototype.setError = function (error) {
            this.element.classList.add('error');
            var errorEl = this.element.querySelector('.error');
            if (errorEl) {
                var messageEl = errorEl.querySelector('.message');
                if (messageEl) {
                    messageEl.innerHTML = error.message;
                }
                if (error.description) {
                    errorEl.classList.add('hasDescription');
                    var descriptionEl = errorEl.querySelector('.description');
                    descriptionEl.innerHTML = error.description;
                }
            }
            var detail = {
                data: error,
                instance: this
            };
            _.trigger(this.element, 'error', detail);
            _.trigger(this.element, 'form:error', detail);
        };
        Form.prototype.getField = function (name) {
            var slug = name.toLowerCase();
            var matches = this.fields.filter(function (f) { return f.slug === slug; });
            return matches.length > 0 ? matches[0] : null;
        };
        Form.prototype.onSent = function (data) {
            this.status = 2;
            if (data.redirect) {
                window.location = data.redirect.url;
                return;
            }
            _.removeClass(this.element, 'sending', 'error');
            this.element.classList.add('sent');
            var detail = {
                created: this.response.status === 201,
                response: this.response,
                data: data
            };
            _.trigger(this.element, 'sent', detail);
            _.trigger(this.element, 'form:sent', detail);
        };
        Form.prototype.invalidate = function (clear) {
            this.setValidity(0);
            _.removeClass(this.element, 'error', 'sending', 'sent', 'saved');
            for (var _i = 0, _a = this.fields; _i < _a.length; _i++) {
                var field = _a[_i];
                if (clear) {
                    field.value = '';
                }
                field.setValidity(0);
            }
            ;
            this.invalidFields = [];
        };
        Form.prototype.takeSnapshot = function () {
            this.fields.forEach(function (field) {
                field.savedValue = field.value;
            });
        };
        Form.prototype.revertToSnapshot = function () {
            this.fields.forEach(function (field) {
                field.value = field.savedValue;
            });
        };
        Form.prototype.reset = function (clear) {
            this.invalidate(clear);
        };
        Form.prototype.dispose = function () {
            // todo: dispose event listeners
            this.element.classList.remove('setup');
        };
        Form.instances = new WeakMap();
        return Form;
    })();
    Carbon.Form = Form;
    var Field = (function () {
        function Field(element, form) {
            var _this = this;
            this.validators = [];
            this.restrictions = [];
            this.errors = [];
            this.validating = false;
            this.validity = 0;
            this.element = element;
            this.form = form;
            this.messageEl = this.element.querySelector('.message');
            if (this.element.dataset['type'] === 'tags') {
                this.type = 'tags';
                var list = TokenList.get(this.element);
                this.input = list;
                list.inputEl.addEventListener('focus', this.onFocus.bind(this));
                list.inputEl.addEventListener('blur', this.onBlur.bind(this));
                list.on('change', function (e) {
                    _.trigger(_this.element, 'field:change', e.detail);
                });
                return;
            }
            var inputEl = this.element.querySelector('input');
            if (inputEl) {
                this.input = (inputEl.type === 'checkbox')
                    ? new HtmlCheckbox(inputEl)
                    : new HtmlInput(inputEl);
            }
            else if ((inputEl = this.element.querySelector('textarea'))) {
                this.input = new HtmlInput(inputEl);
            }
            else if ((inputEl = this.element.querySelector('select'))) {
                this.input = new HtmlSelect(inputEl);
            }
            else {
                throw new Error('Input element not found');
            }
            this.type = this.input.type;
            this.required = this.input.required;
            this.validateMode = this.element.dataset['validateMode'];
            if (this.autofocus && this.input.active) {
                this.element.classList.add('focused');
            }
            this.input.element.addEventListener('blur', this.onBlur.bind(this));
            this.input.element.addEventListener('focus', this.onFocus.bind(this));
            this.input.element.addEventListener('input', this.onChange.bind(this));
            this.input.element.addEventListener('keypress', this.onKeyPress.bind(this));
            this.input.element.addEventListener('change', this.onChange.bind(this));
            if (this.value) {
                this.element.classList.remove('empty');
            }
            else {
                this.element.classList.add('empty');
            }
            this.validateFrequency = this.input.validateFrequency;
            if (this.input.restrict) {
                switch (this.input.restrict) {
                    case 'number':
                        this.restrictions.push(InputRestriction.Number);
                        break;
                    case 'tag':
                        this.restrictions.push(InputRestriction.Tag);
                        break;
                }
            }
            if (this.input.validateRemote) {
                this.validators.push(new RemoteValidator(this.input.validateRemote));
            }
            if (this.validateFrequency) {
                this.validateCallback = this.validate.bind(this).debounce(this.validateFrequency);
            }
            switch (this.type) {
                case 'email':
                    this.validators.push(new EmailAddressValidator());
                    break;
                case 'url':
                    this.validators.push(new UrlValidator(this.input.element.hasAttribute('autocorrect')));
                    break;
                case 'creditcardnumber':
                    this.validators.push(new CreditCardNumberValidator());
                    break;
            }
            if (this.minlength > 0) {
                this.validators.push(new StringLengthValidator(this.minlength, this.maxlength));
            }
            if (this.required) {
                this.element.classList.add('required');
            }
            if (this.element.querySelector('.suggestions')) {
                this.autoComplete = new AutoComplete(this.element);
            }
            if (!_.empty(this.value)) {
                this.validate();
            }
        }
        Object.defineProperty(Field.prototype, "name", {
            get: function () {
                return this.element.getAttribute('name') || this.element.dataset['name'] || this.input.name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Field.prototype, "slug", {
            get: function () {
                return (this.name) ? this.name.toLowerCase() : null;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Field.prototype, "autofocus", {
            get: function () {
                return this.input.autofocus || false;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Field.prototype, "autoselect", {
            get: function () {
                return this.input.autoselect;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Field.prototype, "minlength", {
            get: function () {
                return this.input.minlength || 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Field.prototype, "maxlength", {
            get: function () {
                return this.input.maxlength || 100000;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Field.prototype, "validated", {
            get: function () {
                return this.validity !== 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Field.prototype, "valid", {
            get: function () {
                return this.validity === 1;
            },
            enumerable: true,
            configurable: true
        });
        Field.prototype.onKeyPress = function (e) {
            for (var _i = 0, _a = this.restrictions; _i < _a.length; _i++) {
                var restriction = _a[_i];
                if (restriction(e)) {
                    e.preventDefault();
                    return;
                }
            }
        };
        Field.prototype.focus = function () {
            this.input.focus();
        };
        Field.prototype.select = function () {
            this.input.select();
        };
        Object.defineProperty(Field.prototype, "value", {
            get: function () {
                return this.input.value;
            },
            set: function (value) {
                this.input.value = value;
            },
            enumerable: true,
            configurable: true
        });
        Field.prototype.getSelection = function () {
            return this.input.getSelection();
        };
        Field.prototype.hasSelection = function () {
            var selection = this.getSelection();
            return selection[0] !== selection[1];
        };
        Field.prototype.onBlur = function () {
            var _this = this;
            if (this.validity === 0) {
                this.validate();
            }
            setTimeout(function () {
                _this.element.classList.remove('focused');
                _.trigger(_this.element, 'field:blur');
            }, 1);
        };
        Field.prototype.onFocus = function () {
            this.element.classList.add('focused');
            _.trigger(this.element, 'field:focus');
        };
        Field.prototype.invalidate = function () {
            this.setValidity(0);
        };
        Field.prototype.setValidity = function (validity) {
            this.validity = validity;
            this.element.classList.remove('validating');
            if (validity === 0) {
                _.removeClass(this.element, 'valid', 'invalid');
                return;
            }
            this.element.classList.remove(this.valid ? 'invalid' : 'valid');
            this.element.classList.add(this.valid ? 'valid' : 'invalid');
            _.trigger(this.element, 'field:validated', {
                field: this,
                valid: this.valid,
                validity: validity
            });
        };
        Field.prototype.onChange = function (e) {
            if (e.keyCode === 9)
                return;
            this.invalidate();
            var empty = !this.value || this.value.length === 0;
            _.toggleClass(this.element, 'empty', empty);
            if (this.type === 'checkbox') {
                _.toggleClass(this.element, 'checked', this.input.checked);
            }
            if (this.type === 'creditcardnumber') {
                this.detectCreditCardType(this.value);
            }
            if (this.validateFrequency) {
                this.validateCallback();
            }
            if (this.validateMode === 'immediate') {
                this.validate();
            }
            _.trigger(this.element, 'field:change', {
                name: this.name,
                value: this.value
            });
        };
        Field.prototype.detectCreditCardType = function (val) {
            var ccTypeMap = {
                '4': 'visa',
                '5': 'masterCard',
                '3': 'americanExpress',
                '6': 'discover'
            };
            var type = (val && val.length) ? ccTypeMap[val[0]] : null;
            if (!type || !this.element.classList.contains(type)) {
                _.removeClass(this.element, 'visa', 'masterCard', 'americanExpress', 'discover');
                this.element.classList.add(type);
                _.trigger(this.element, 'typeDetected', { type: type });
            }
        };
        Field.prototype.validate = function () {
            var _this = this;
            this.errors = [];
            if (_.empty(this.value)) {
                var state = this.required ? 2 : 1;
                if (this.required) {
                    this.addError({ message: 'Required' });
                }
                this.setState(state);
                return Promise.resolve(state);
            }
            this.validating = true;
            if (this.validateFrequency) {
                this.element.classList.add('validating');
            }
            if (this.type === 'tags') {
                this.setState(1);
                return Promise.resolve(1);
            }
            if (this.validators.length === 0) {
                this.setState(1);
                return Promise.resolve(this.validity);
            }
            return Promise.all(this.validators.map(function (v) { return v.validate(_this); })).then(function (results) {
                var failedValidations = _this.validators.filter(function (v) { return !v.valid; });
                var replaced = false;
                var ok = true;
                for (var _i = 0; _i < failedValidations.length; _i++) {
                    var validator = failedValidations[_i];
                    if (validator.replacement) {
                        replaced = true;
                        _this.value = validator.replacement;
                        return _this.validate();
                    }
                    if (validator.error) {
                        ok = false;
                        _this.addError(validator.error);
                    }
                }
                ;
                _this.setState(ok ? 1 : 2);
                return replaced ? _this.validate() : Promise.resolve(_this.validity);
            });
        };
        Field.prototype.addError = function (error) {
            this.errors.push(error);
        };
        Field.prototype.setState = function (state) {
            this.validating = false;
            if (state === 1) {
                this.setValidity(1);
            }
            else if (state === 2) {
                if (this.errors.length > 0 && this.messageEl) {
                    this.messageEl.innerHTML = this.errors[0].message;
                }
                this.setValidity(2);
            }
        };
        Field.prototype.remove = function () {
            this.element.remove();
            this.form && this.form.fields.remove(this);
        };
        return Field;
    })();
    Carbon.Field = Field;
    var HtmlSelect = (function () {
        function HtmlSelect(element) {
            this.type = 'select';
            this.element = element;
        }
        Object.defineProperty(HtmlSelect.prototype, "required", {
            get: function () {
                return this.element.hasAttribute('required');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlSelect.prototype, "name", {
            get: function () {
                return this.element.name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlSelect.prototype, "active", {
            get: function () { return false; },
            enumerable: true,
            configurable: true
        });
        HtmlSelect.prototype.getSelection = function () { return [0, 0]; };
        Object.defineProperty(HtmlSelect.prototype, "value", {
            get: function () {
                return this.element.options[this.element.selectedIndex].text;
            },
            enumerable: true,
            configurable: true
        });
        return HtmlSelect;
    })();
    Carbon.HtmlSelect = HtmlSelect;
    var HtmlCheckbox = (function () {
        function HtmlCheckbox(element) {
            this.type = 'checkbox';
            this.element = element;
        }
        Object.defineProperty(HtmlCheckbox.prototype, "name", {
            get: function () {
                return this.element.name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlCheckbox.prototype, "required", {
            get: function () {
                return this.element.hasAttribute('required');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlCheckbox.prototype, "checked", {
            get: function () {
                return this.element.checked;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlCheckbox.prototype, "value", {
            get: function () {
                return this.checked.toString();
            },
            enumerable: true,
            configurable: true
        });
        return HtmlCheckbox;
    })();
    Carbon.HtmlCheckbox = HtmlCheckbox;
    var HtmlInput = (function () {
        function HtmlInput(element) {
            this.element = element;
            this.restrict = element.dataset['restrict'];
            this.validateRemote = element.dataset['validateRemote'];
            if (element.dataset['validateFrequency']) {
                this.validateFrequency = parseInt(element.dataset['validateFrequency']);
            }
            if (element.hasAttribute('autoexpand')) {
                new AutoExpander(this.element);
            }
            if (element.hasAttribute('minlength')) {
                this.minlength = parseInt(element.getAttribute('minlength'), 10);
            }
            if (element.hasAttribute('maxlength')) {
                this.maxlength = parseInt(element.getAttribute('maxlength'), 10);
            }
        }
        Object.defineProperty(HtmlInput.prototype, "name", {
            get: function () {
                return this.element.name;
            },
            set: function (value) {
                this.element.name = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlInput.prototype, "type", {
            get: function () {
                return this.element.getAttribute('type') || 'text';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlInput.prototype, "required", {
            get: function () {
                return this.element.required;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlInput.prototype, "autofocus", {
            get: function () {
                return this.element.autofocus;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlInput.prototype, "autoselect", {
            get: function () {
                return this.element.hasAttribute('autoselect');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HtmlInput.prototype, "active", {
            get: function () {
                return document.activeElement == this.element;
            },
            enumerable: true,
            configurable: true
        });
        HtmlInput.prototype.getSelection = function () {
            var start = this.element.selectionStart;
            var end = this.element.selectionEnd;
            if (start === undefined || end === undefined) {
            }
            return [start, end];
        };
        HtmlInput.prototype.focus = function () {
            this.element.focus();
        };
        HtmlInput.prototype.select = function () {
            this.element.select();
        };
        Object.defineProperty(HtmlInput.prototype, "value", {
            get: function () {
                return this.element.value;
            },
            set: function (value) {
                if (this.element.value === value)
                    return;
                this.element.value = value;
                _.trigger(this.element, 'change');
            },
            enumerable: true,
            configurable: true
        });
        return HtmlInput;
    })();
    Carbon.HtmlInput = HtmlInput;
    var RequiredValidator = (function () {
        function RequiredValidator() {
        }
        RequiredValidator.prototype.validate = function (field) {
            this.valid = field.value.trim().length > 0;
            if (!this.valid) {
                this.error = { message: 'Required' };
            }
            return Promise.resolve(this.valid);
        };
        return RequiredValidator;
    })();
    var StringLengthValidator = (function () {
        function StringLengthValidator(minLength, maxLength) {
            this.minLength = minLength;
            this.maxLength = maxLength;
        }
        StringLengthValidator.prototype.validate = function (field) {
            var value = field.value;
            this.valid = value.length >= this.minLength && value.length <= this.maxLength;
            if (!this.valid) {
                if (value.length < this.minLength) {
                    this.error = { message: "Must be at least " + this.minLength + " characters" };
                }
                else {
                    this.error = { message: "Must be fewer than " + this.maxLength + " characters" };
                }
            }
            return Promise.resolve(this.valid);
        };
        return StringLengthValidator;
    })();
    var UrlValidator = (function () {
        function UrlValidator(autoCorrect) {
            this.autoCorrect = autoCorrect;
        }
        UrlValidator.prototype.validate = function (field) {
            var value = field.value;
            var autoCorrected = false;
            if (this.autoCorrect && value.indexOf('://') === -1) {
                value = 'http://' + value;
                autoCorrected = true;
            }
            var regex = /^(?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
            this.valid = regex.test(value);
            if (this.valid && this.autoCorrected) {
                field.value = value;
            }
            if (!this.valid) {
                this.error = { message: 'Not a valid url.' };
            }
            return Promise.resolve(this.valid);
        };
        return UrlValidator;
    })();
    var EmailAddressValidator = (function () {
        function EmailAddressValidator() {
        }
        EmailAddressValidator.prototype.validate = function (field) {
            this.valid = /^[a-zA-Z0-9_\.\-\+]+\@([a-zA-Z0-9\-]+\.)+[a-zA-Z0-9]{2,20}$/.test(field.value);
            if (!this.valid) {
                this.error = { message: 'Not a valid email address.' };
            }
            return Promise.resolve(this.valid);
        };
        return EmailAddressValidator;
    })();
    var CreditCardNumberValidator = (function () {
        function CreditCardNumberValidator() {
        }
        CreditCardNumberValidator.prototype.validate = function (field) {
            this.valid = Carbon.CreditCard.validate(field.value);
            if (!this.valid) {
                this.error = { message: "Not a valid credit card number." };
            }
            return Promise.resolve(this.valid);
        };
        return CreditCardNumberValidator;
    })();
    var RemoteValidator = (function () {
        function RemoteValidator(url) {
            this.url = url;
        }
        RemoteValidator.prototype.validate = function (field) {
            var _this = this;
            this.valid = true;
            var request = new Request(this.url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: _.serialize({ value: field.value })
            });
            return fetch(request)
                .then(function (response) { return response.json(); })
                .then(function (data) {
                _this.valid = data.valid;
                _this.error = data.error;
                _this.replacement = data.replacement;
                return Promise.resolve(_this.valid);
            });
        };
        return RemoteValidator;
    })();
    var AutoComplete = (function () {
        function AutoComplete(element, options) {
            var _this = this;
            this.items = [];
            this.hoveringList = false;
            this.ghostVal = '';
            this.element = element;
            if (options && options.listEl) {
                this.listEl = options.listEl;
            }
            else {
                this.listEl = this.element.querySelector('.suggestions');
            }
            if (!this.listEl)
                throw new Error('[AutoComplete] .suggestions element not found');
            if (!options) {
                options = this.listEl.dataset;
            }
            if (!options.template)
                throw new Error('[AutoComplete] missing data-template');
            if (!options.remote)
                throw new Error('[AutoComplete] missing data-remote');
            this.template = new Carbon.Template(options.template);
            this.remote = options.remote;
            this.limit = parseInt(options.limit || '5');
            this.minLength = parseInt(options.minLength || '1');
            this.inputEl = this.element.querySelector('input.input');
            this.ghostEl = this.element.querySelector('input.ghost');
            this.inputEl.autocomplete = 'off';
            if (this.ghostEl) {
                this.ghostEl.value = '';
            }
            this.inputEl.addEventListener('keydown', this.onKeyDown.bind(this), true);
            this.inputEl.addEventListener('keypress', this.onKeyPress.bind(this), true);
            this.inputEl.addEventListener('input', this.onInput.bind(this), false);
            this.inputEl.addEventListener('blur', this.onBlur.bind(this), false);
            this.listEl.addEventListener('click', this.onClick.bind(this), false);
            this.listEl.addEventListener('mouseenter', function () {
                _this.hoveringList = true;
            }, false);
            this.listEl.addEventListener('mouseleave', function () {
                _this.hoveringList = false;
            }, false);
        }
        AutoComplete.prototype.onClick = function (e) {
            var target = e.target;
            var liEl = target.closest('li');
            if (liEl) {
                this.select(liEl);
            }
        };
        AutoComplete.prototype.onBlur = function (e) {
            if (this.hoveringList)
                return;
            this.close();
        };
        AutoComplete.prototype.on = function (type, listener) {
            this.element.addEventListener(type, listener, false);
        };
        AutoComplete.prototype.onInput = function (e) {
            var code = e.which;
            if (code === 13 || code === 30 || code === 38 || code === 40)
                return;
            var val = this.inputEl.value;
            this.updateGhost();
            if (val.length < this.minLength) {
                this._showList([]);
            }
            else {
                this.fetchSuggestions();
            }
        };
        AutoComplete.prototype.onKeyPress = function (e) {
            if (this.inputEl.dataset['restrict'] === 'tag') {
                if (InputRestriction.Tag(e))
                    e.preventDefault();
            }
        };
        AutoComplete.prototype.onKeyDown = function (e) {
            switch (e.which) {
                case 27:
                    this.escape(e);
                    break;
                case 9:
                    this.close();
                    break;
                case 13:
                    this.onEnter(e);
                    break;
                case 38:
                    this.up();
                    break;
                case 40:
                    this.down();
                    break;
            }
        };
        AutoComplete.prototype.escape = function (e) {
            e.stopPropagation();
            e.preventDefault();
            this.close();
        };
        AutoComplete.prototype.cancel = function () {
            this.ghostVal = '';
            this.close();
        };
        AutoComplete.prototype.close = function () {
            this.element.classList.remove('suggesting');
            this.listEl.innerHTML = '';
        };
        AutoComplete.prototype.updateGhost = function () {
            if (!this.ghostEl)
                return;
            var val = this.inputEl.value.toLowerCase();
            if (val.length === 0) {
                this.ghostEl.value = '';
            }
            if (!this.ghostVal)
                return;
            if (!this.ghostVal.toLowerCase().startsWith(val)) {
                this.ghostEl.value = '';
                return;
            }
            if (this.ghostVal.length > 0) {
                val = this.inputEl.value + this.ghostVal.substring(val.length);
            }
            this.ghostEl.value = val;
        };
        AutoComplete.prototype.up = function () {
            var selectedEl = this.listEl.querySelector('.selected');
            var prevEl;
            if (selectedEl) {
                selectedEl.classList.remove('selected');
                prevEl = selectedEl.previousElementSibling;
            }
            if (!prevEl) {
                prevEl = this.listEl.children[this.listEl.children.length - 1];
            }
            this.highlight(prevEl);
        };
        AutoComplete.prototype.down = function () {
            var selectedEl = this.listEl.querySelector('.selected');
            var nextEl;
            if (selectedEl) {
                selectedEl.classList.remove('selected');
                nextEl = selectedEl.nextElementSibling;
            }
            if (!nextEl) {
                nextEl = this.listEl.children[0];
            }
            this.highlight(nextEl);
        };
        AutoComplete.prototype.highlight = function (el) {
            if (!el)
                return;
            el.classList.add('selected');
            el.focus();
            var value = el.dataset['value'];
            this.inputEl.value = value;
            if (this.ghostEl) {
                this.ghostEl.value = value;
            }
        };
        AutoComplete.prototype.onEnter = function (e) {
            var selectedEl = this.listEl.querySelector('.selected');
            if (selectedEl) {
                e.preventDefault();
                this.select(selectedEl);
            }
        };
        AutoComplete.prototype.select = function (el) {
            var value = el.dataset['value'];
            var index = parseInt(el.dataset['index']);
            this.inputEl.value = value;
            this.inputEl.focus();
            _.trigger(el, 'select', {
                value: value,
                data: this.items[index],
            });
            this.updateGhost();
            this._showList([]);
        };
        AutoComplete.prototype.fetchSuggestions = function () {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(this._fetchSuggestions.bind(this), 200);
        };
        AutoComplete.prototype._showList = function (items) {
            this.listEl.innerHTML = '';
            this.request = null;
            var val = this.inputEl.value.toLowerCase();
            this.items = items;
            this.ghostVal = '';
            var i = 0;
            for (var _i = 0; _i < items.length; _i++) {
                var item = items[_i];
                if (this.listEl.children.length >= this.limit)
                    break;
                var el = this.template.render(item);
                var value = el.dataset['value'];
                el.dataset['index'] = i.toString();
                if (this.ghostVal = '') {
                    this.ghostVal = value;
                }
                if (value.toLowerCase().includes(val)) {
                    this.listEl.appendChild(el);
                }
                i++;
            }
            var empty = this.listEl.children.length === 0;
            _.toggleClass(this.element, 'suggesting', !empty);
            this.updateGhost();
        };
        AutoComplete.prototype._fetchSuggestions = function () {
            var _this = this;
            this.timeout = null;
            var prefix = '?';
            if (this.remote.indexOf('?') > -1)
                prefix = '&';
            var val = this.inputEl.value;
            if (val.length < this.minLength) {
                return;
            }
            var url = "" + this.remote + prefix + "q=" + encodeURIComponent(val);
            fetch(url, { credentials: 'same-origin' })
                .then(function (response) { return response.json(); })
                .then(function (json) { return _this._showList(json); });
        };
        AutoComplete.prototype.dispose = function () {
        };
        return AutoComplete;
    })();
    Carbon.AutoComplete = AutoComplete;
    var AutoExpander = (function () {
        function AutoExpander(element, options) {
            this.maxHeight = 10000;
            this.height = 0;
            this.diff = 0;
            this.element = element;
            var populated = this.element.value.replace(/\s/g, '').length > 0;
            if (populated) {
                this.update();
            }
            this.element.addEventListener('keyup', this.onKeyUp.bind(this));
            this.element.addEventListener('scroll', this.update.bind(this));
            this.element.addEventListener('poke', this.update.bind(this));
            if (options && options.maxHeight) {
                this.maxHeight = options.maxHeight;
            }
            this.outerEl = this.element.closest('.outer');
        }
        AutoExpander.prototype.onKeyUp = function (e) {
            var val = this.element.value;
            if (e.keyCode === 13 && !e.shiftKey) {
                if (val.replace(/\s/g, '').length === 0) {
                    e.stopPropagation();
                }
            }
            this.update();
        };
        AutoExpander.prototype.update = function () {
            var oldHeight = this.height;
            if (this.outerEl) {
                this.outerEl.style.height = this.height + 'px';
            }
            this.element.style.height = '0px';
            var scrollHeight = this.element.scrollHeight;
            this.height = scrollHeight - this.diff;
            if (this.height > this.maxHeight) {
                this.height = this.maxHeight;
            }
            this.element.style.height = this.height + 'px';
            if (this.outerEl) {
                this.outerEl.style.height = this.height + 'px';
            }
            if (this.height != oldHeight) {
                _.trigger(this.element, 'expanded');
            }
        };
        return AutoExpander;
    })();
    Carbon.AutoExpander = AutoExpander;
    var InputRestriction = {
        Number: function (e) { return !KeyEvent.isNumber(e); },
        Tag: function (e) {
            return e.which === 33 ||
                e.which === 35 ||
                e.which === 38 ||
                e.which === 42 ||
                e.which === 47;
        }
    };
    var KeyEvent = {
        isCommand: function (e) {
            if (e.metaKey)
                return true;
            switch (e.which) {
                case 8: return true;
                case 48: return true;
            }
            return false;
        },
        isNumber: function (e) {
            if (KeyEvent.isCommand(e))
                return true;
            var char = String.fromCharCode(e.which);
            return !!/[\d\s]/.test(char);
        }
    };
    Carbon.CreditCard = {
        Types: {
            Visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            MasterCard: /^5[1-5][0-9]{14}$/,
            Amex: /^3[47][0-9]{13}$/,
            Discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
        },
        validate: function (num) {
            num = Carbon.CreditCard.strip(num);
            return !!Carbon.CreditCard.getType(num) && Carbon.CreditCard.verifyLuhn10(num);
        },
        getLuhn10: function (num) {
            var revArr = num.split('').reverse();
            var total = 0;
            var tmp = 0;
            for (var i = 0; i < revArr.length; i++) {
                if ((i % 2) > 0) {
                    tmp = revArr[i] * 2;
                    tmp = (tmp < 9 ? tmp : (tmp - 9));
                    total += tmp;
                }
                else {
                    total += Number(revArr[i]);
                }
            }
            return total;
        },
        verifyLuhn10: function (num) {
            return Carbon.CreditCard.getLuhn10(num) % 10 == 0;
        },
        strip: function (num) {
            return num.replace(/-/g, "").replace(/ /g, "");
        },
        getType: function (num) {
            for (var type in Carbon.CreditCard.Types) {
                var regex = Carbon.CreditCard.Types[type];
                if (regex.test(num))
                    return type;
            }
            return null;
        }
    };
    var TokenList = (function () {
        function TokenList(element) {
            this.limit = 100;
            this.selectedSuggestion = false;
            this.element = element;
            this.fieldEl = this.element.querySelector('.field');
            if (!this.fieldEl)
                throw new Error('[TokenList] Missing .field');
            if (this.fieldEl.querySelector('.suggestions')) {
                this.autoComplete = new AutoComplete(this.fieldEl);
                this.autoComplete.on('select', this.onSelect.bind(this));
            }
            this.inputEl = this.fieldEl.querySelector('input');
            this.listEl = this.element.matches('ul')
                ? this.element
                : this.element.querySelector('ul');
            if (!this.listEl)
                throw new Error('[TokenList] missing ul');
            this.inputEl.addEventListener('input', this.onInput.bind(this), false);
            this.inputEl.addEventListener('keydown', this.onKeyDown.bind(this), false);
            this.inputEl.addEventListener('blur', this.onBlur.bind(this), false);
            this.inputEl.addEventListener('paste', this.onPaste.bind(this), false);
            if (this.element.dataset['limit']) {
                this.limit = parseInt(this.element.dataset['limit']);
            }
            this.maxLength = this.inputEl.maxLength;
            if (this.maxLength <= 0) {
                this.maxLength = 100;
            }
            this.inputEl.style.width = this.measureText('a') + 'px';
            this.element.addEventListener('click', this.clicked.bind(this));
            var empty = this.count === 0;
            _.toggleClass(this.element, 'empty', empty);
        }
        TokenList.get = function (element) {
            var block = TokenList.map.get(element);
            if (!block) {
                block = new TokenList(element);
                TokenList.map.set(element, block);
            }
            return block;
        };
        TokenList.prototype.onClick = function (e) {
            var target = e.target;
            var liEl = target.closest('li:not(.field)');
            if (liEl) {
                this.clickedLi(liEl);
            }
        };
        TokenList.prototype.on = function (name, listener) {
            this.element.addEventListener(name, listener, false);
        };
        Object.defineProperty(TokenList.prototype, "value", {
            get: function () {
                return this.getValues();
            },
            enumerable: true,
            configurable: true
        });
        TokenList.prototype.getValues = function () {
            var _this = this;
            var els = this.listEl.querySelectorAll('li:not(.field)');
            return Array.from(els).map(function (el) {
                var textEl = el.querySelector('.text');
                return textEl ? _this.canonicalize(textEl.textContent) : '';
            })
                .filter(function (value) { return !!value; });
        };
        TokenList.prototype.canonicalize = function (value) {
            return value ? value.trim() : '';
        };
        TokenList.prototype.clickedLi = function (el) {
            this.remove(el);
        };
        TokenList.prototype.clicked = function (e) {
            var target = e.target;
            if (target.closest('li'))
                return;
            e.stopPropagation();
            this.inputEl.select();
        };
        TokenList.prototype.onSelect = function (e) {
            var _this = this;
            this.selectedSuggestion = true;
            setTimeout(function () {
                _this.selectedSuggestion = false;
            }, 100);
            this.inputEl.value = '';
            this.add(e.detail.value);
        };
        TokenList.prototype.onBlur = function (e) {
            var _this = this;
            setTimeout(function () {
                if (!_this.selectedSuggestion) {
                    _this.addCurrent();
                }
            }, 100);
        };
        TokenList.prototype.addCurrent = function () {
            var value = this.canonicalize(this.inputEl.value);
            if (value.length === 0 || value.length > this.maxLength)
                return false;
            var isDub = this.getValues().filter(function (text) { return text === value; }).length !== 0;
            _.toggleClass(this.inputEl, 'dub', isDub);
            if (isDub)
                return;
            this.inputEl.value = '';
            this.inputEl.style.width = this.measureText('a') + 'px';
            this.add(value);
        };
        TokenList.prototype.onKeyDown = function (e) {
            if (e.which === 13 || e.which === 188) {
                e.preventDefault();
                this.addCurrent();
                return false;
            }
            if (e.which === 8 && this.inputEl.value.length === 0) {
                var els = this.listEl.querySelectorAll('li:not(.field)');
                if (els.length === 0)
                    return;
                var lastEl = els[els.length - 1];
                lastEl && this.remove(lastEl);
            }
        };
        TokenList.prototype.onInput = function () {
            this.inputEl.classList.remove('dub');
            var width = this.measureText(this.inputEl.value);
            if (this.inputEl.value.length > 0) {
                this.element.classList.remove('empty');
            }
            else if (this.count === 0) {
                this.element.classList.add('empty');
            }
            this.inputEl.style.width = width + 'px';
        };
        TokenList.prototype.onPaste = function (e) {
            if (e.clipboardData && e.clipboardData.getData) {
                var text = e.clipboardData.getData('Text');
                if (text) {
                    this.addRange(text.split(','));
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
        };
        TokenList.prototype.measureText = function (text) {
            if (!this.tempEl) {
                var css = getComputedStyle(this.inputEl);
                var el = document.createElement('span');
                el.style.position = 'fixed';
                el.style.left = '-5000px';
                el.style.top = '-5000px';
                el.style.fontFamily = css.fontFamily;
                el.style.fontSize = css.fontSize;
                el.style.fontWeight = css.fontWeight;
                el.style.padding = css.padding;
                el.style.margin = css.margin;
                el.style.whiteSpace = 'pre';
                el.style.visibility = 'hidden';
                this.tempEl = el;
                document.body.appendChild(el);
            }
            this.tempEl.textContent = text;
            return _.width(this.tempEl) + 4;
        };
        TokenList.prototype.addRange = function (list) {
            for (var _i = 0; _i < list.length; _i++) {
                var item = list[_i];
                this.add(item.trim(), false);
            }
        };
        TokenList.prototype.add = function (value, trigger) {
            if (!value || value.trim().length === 0)
                return;
            var count = this.getValues().length;
            if (count >= this.limit) {
                return;
            }
            var liEl = document.createElement('li');
            var spanEl = document.createElement('span');
            spanEl.classList.add('text');
            spanEl.textContent = value;
            liEl.appendChild(spanEl);
            var fieldEl = this.listEl.querySelector('.field');
            if (fieldEl) {
                this.listEl.insertBefore(liEl, fieldEl);
            }
            else {
                this.listEl.appendChild(liEl);
            }
            if (this.autoComplete) {
                this.autoComplete.cancel();
            }
            this.element.classList.remove('empty');
            if (trigger === false)
                return;
            _.trigger(liEl, 'add', {
                text: value
            });
            _.trigger(liEl, 'change', {
                type: 'add',
                text: value
            });
        };
        TokenList.prototype.clear = function () {
            this.listEl.queryAll('li:not(.field)').forEach(function (el) {
                el.remove();
            });
            this.element.classList.add('empty');
        };
        Object.defineProperty(TokenList.prototype, "count", {
            get: function () {
                return this.listEl.querySelectorAll('li:not(.field)').length;
            },
            enumerable: true,
            configurable: true
        });
        TokenList.prototype.remove = function (el) {
            var textEl = el.querySelector('.text');
            var value = textEl.textContent;
            el.remove();
            if (this.count === 0) {
                this.element.classList.add('empty');
                this.inputEl.select();
            }
            _.trigger(this.element, 'remove', {
                text: value
            });
            _.trigger(this.element, 'change', {
                type: 'remove',
                text: value
            });
        };
        TokenList.prototype.dispose = function () {
            if (this.tempEl) {
                this.tempEl.remove();
            }
        };
        TokenList.map = new WeakMap();
        return TokenList;
    })();
    Carbon.TokenList = TokenList;
    var _;
    (function (_) {
        function serialize(obj) {
            return Object.keys(obj).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]); }).join('&');
        }
        _.serialize = serialize;
        function empty(text) {
            return !(text && text.length > 0);
        }
        _.empty = empty;
        function width(el) {
            return parseInt(getComputedStyle(el).width, 10);
        }
        _.width = width;
        function trigger(element, name, detail) {
            return element.dispatchEvent(new CustomEvent(name, {
                bubbles: true,
                detail: detail
            }));
        }
        _.trigger = trigger;
        function addClass(element) {
            var names = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                names[_i - 1] = arguments[_i];
            }
            for (var _a = 0; _a < names.length; _a++) {
                var name = names[_a];
                element.classList.add(name);
            }
        }
        _.addClass = addClass;
        function toggleClass(element, name, force) {
            if (force === false) {
                element.classList.remove(name);
            }
            else if (force === true) {
                element.classList.add(name);
            }
            else {
                element.classList.toggle(name);
            }
        }
        _.toggleClass = toggleClass;
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
        _.removeClass = removeClass;
    })(_ || (_ = {}));
})(Carbon || (Carbon = {}));
