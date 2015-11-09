/*
 * Project: vValid
 * Description: A jQuery form validation plugin with customisation features
 * Author: Vaughan Webber - www.vaughanderful.co.za
 * License: MIT
 * Version: 0.0.1
 * Dependancies: jquery-1.*
 * Date: 05/10/2015
 */

//#TODO: allow validation override + "addition"
//#TODO: each field validated can have custom message via data-message attribute
//#TODO: slideUp (animate) errors when less than previously generated, also animate more errors (slideDown)
//#TODO: dont animate if no error
//#TODO: check element type AKA select, input[text], textarea and read value
;
(function ($, window, document, undefined) {
	'use strict';

	var defaults = {
		messages: {
			required: 'This field cannot be empty',
			alphaNumeric: 'This field requires an alphanumeric value',
			alphaNumericSpecial: 'This field must include at least 1 number, 1 letter and 1 special character',
			numeric: 'This field requires a numeric value',
			decimal: 'This field requires a numeric decimal value',
			min: 'This field has a minimum length of ',
			max: 'This field has a maximum length of ',
			exact: 'This field must be the exact length of ',
			email: 'A valid email address is required',
			phoneNumber: 'A valid phone number is required',
			idNumber: 'A valid ID number is required',
			match: 'This field value must match the value of ',
			date: 'A valid date format is expected (YYYY-MM-DD)',
			datetime: 'A valid date format is expected (YYYY-MM-DD HH:MM:SS)'
		},
		customMethods: {},
		regex: {
			date: /^\d{4}-(1[0-2]|0[1-9])-(3[01]|[1,2][0-9]|0\d)$/,
			datetime: /^\d{4}-(1[0-2]|0[1-9])-(3[01]|[1,2][0-9]|0\d)\s[0-2]?[0-9]:[0-5][0-9]:[0-5][0-9]$/
		},
		displayStyling: true,
		displayText: true
	};

	function vValid(options) {
		this.settings = defaults;

		if (options !== undefined) {
			//update existing properties
			for (var a in defaults) {
				//root property else an object property
				if (typeof defaults[a] !== 'object') {
					if (options[a] !== undefined) {
						this.settings[a] = options[a];
					}
				} else {
					if (defaults[a] !== undefined) {
						for (var b in defaults[a]) {
							if (options[a] !== undefined && options[a][b] !== undefined) {
								this.settings[a][b] = options[a][b];
							}
						}
					}
				}
			}

			//insert additional properties (objects)
			for (var a in options) {
				if (typeof options[a] === 'object') {
					for (var b in options[a]) {
						if (this.settings[a][b] === undefined) {
							this.settings[a][b] = options[a][b];
						}
					}
				}
			}
		}

		this.events();
	}

	$.extend(vValid.prototype, {
		events: function () {
			var scope = this;
			//retrieve first element with data-vvalid attribute and get its 
			//closest form otherwise when there are multiple forms the other 
			//forms are prevented from submitting
			var form = $('*[data-vvalid]').eq(0).closest('form');

			$.each(form.find('*[data-vvalid]'), function (i, element) {
				$(element).on('blur', function () {
					/*
					 * #TODO: see if theres a better way to handle this?
					 * #TODO: maybe its possible to prevent on blur event if the submit is going to fire?
					 * the on blur event is firing before the form submit so
					 * the submit button release event gets missed if the
					 * HTML changes (adding/removing errors) causes the
					 * submit button to move outside of the mouse release
					 * area
					 */
					setTimeout(function () {
						scope.validate(element);
					}, 200);
				});

				$(element).on('keyup, change', function () {
					setTimeout(function () {
						scope.validate(element);
					}, 200);
				});

				//if page loads and element is not empty then validate
				if ($(element).val() !== '') {
					scope.validate(element);
				}

				//static text change event
				if (typeof MutationObserver === 'function') {
					var observer = new MutationObserver(function (mutations) {
						scope.validate(element);
					}.bind(this));
					observer.observe($(element).get(0), {characterData: true, childList: true});
				}
			});

			form.on('submit', function (e) {
				var valid = true;

				//validate each form element with data atrr
				$.each(form.find('*[data-vvalid]'), function (i, element) {
					//if any element validation fails
					if (!scope.validate(element)) {
						valid = false;
					}
				});

				//custom event for plugin integration
				form.trigger('submitting');

				//custom event for plugin integration
				if (valid) {
					this.submit();
					form.trigger('submitted');
				} else {
					e.preventDefault();
					form.trigger('invalid');
				}
			});
		},
		validate: function (element) {
			if ($(element).attr('data-vvalid') && $(element).attr('disabled') !== 'disabled') {
				var errors = Array();
				var rules = $(element).attr('data-vvalid').split('|');
				var methods = Array();

				for (var i in rules) {
					var methodAndParams = rules[i].split(':');
					var method = methodAndParams[0];
					var param = '';

					methods.push(method);

					//if method parameters exist extract them
					if (methodAndParams.length > 1) {
						param = methodAndParams[1];
					}

					//method exists
					if (this[method] !== undefined || this.settings.customMethods[method] !== undefined) {
						var value = $(element)[0].value !== undefined ? $(element).clone().children().remove().end().val() : $(element).clone().children().remove().end().text();

						//call specified method and store response
						if (this[method] !== undefined) {
							var error = this[method](value, param);
						} else if (this.settings.customMethods[method] !== undefined) {
							var error = this.settings.customMethods[method](value, param);
						}

						if (error !== '' && error !== undefined) {
							errors.push({type: method, text: error});
						}
					}
				}

				this.errorsGenerate(element, errors);

				if (errors.length > 0) {
					return false;
				}
			}

			return true;
		},
		errorsGenerate: function (element, errors) {
			var previousErrorCount = $(element).siblings('.errors').find('div').length;

			$(element).removeClass('error').siblings('.errors').remove();

			if (errors.length > 0) {
				if (this.settings.displayStyling) {
					$(element).addClass('vValid error');
				}

				if (this.settings.displayText || $(element).attr('data-vvalid-error-text') === 'true') {
					$(element).parent().append('<div class="errors">');

					for (var i in errors) {
						$(element).siblings('.errors').append('<div class="text-error">' + errors[i].text + '</div>');
					}
				}
			}

			if (previousErrorCount === 0) {
				$(element).siblings('.errors').hide();
			}

			if (previousErrorCount < errors.length) {
				$(element).siblings('.errors').slideDown(100);
			}
		},
		required: function (value) {
			if (value.length === 0) {
				return this.settings.messages.required;
			}
		},
		alphaNumeric: function (value) {
			if (!/(?=.*\d)(?=.*[a-zA-Z]).*$/.test(value)) {
				return this.settings.messages.alphaNumeric;
			}
		},
		alphaNumericSpecial: function (value) {
			if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]<>\\/|{}\-\?\=,])[A-Za-z\d!@#$%^&*()_+]/.test(value)) {
				return this.settings.messages.alphaNumericSpecial;
			}
		},
		numeric: function (value) {
			if (!/^[0-9]*$/.test(value) || value === '') {
				return this.settings.messages.numeric;
			}
		},
		decimal: function (value) {
			if (!/^\d*\.?\d*$/.test(value) || value === '') {
				return this.settings.messages.decimal;
			}
		},
		min: function (value, limit) {
			if (value.length < parseInt(limit)) {
				return this.settings.messages.min + limit;
			}
		},
		max: function (value, limit) {
			if (value.length > parseInt(limit)) {
				return this.settings.messages.max + limit;
			}
		},
		exact: function (value, limit) {
			if (value.length !== parseInt(limit)) {
				return this.settings.messages.exact + limit;
			}
		},
		idNumber: function (value) {
			if (value.length < 13 || value.length > 13) {
				return this.settings.messages.idNumber;
			}
		},
		match: function (value, matchedElement) {
			if (value !== $('input[name="' + matchedElement + '"]').val()) {
				return this.settings.messages.match + matchedElement;
			}
		},
		date: function (value) {
			if (!this.settings.regex.date.test(value)) {
				return this.settings.messages.date;
			}
		},
		datetime: function (value) {
			var date = new Date(value);

			if (!this.settings.regex.datetime.test(value) || !date instanceof Date) {
				return this.settings.messages.datetime;
			}
		},
		email: function (value) {
			if (!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value)) {
				return this.settings.messages.email;
			}
		},
		phoneNumber: function (value) {
			/*
			 * error conditions:
			 * 
			 * more than 1 + is found
			 * the + is found anywhere else in the string but the start
			 * total digits is less than 10
			 * total digits is more than 14
			 * all characters are allowed
			 */
			if ((value.match(/\+/g) || []).length > 1 || value.indexOf('+') > 0 || value.length < 10 || value.length > 14 || !allowedStringCharacters(value, '+0123456789')) {
				return this.settings.messages.phoneNumber;
			}
		}
	});

	$.vValid = function (options) {
		if (this.validate === undefined) {
			this.validate = new vValid(options);
		}
	};

	$.extend($.vValid, {
		destroy: function () {
			//#TODO: figure out why cant access below properties
//			console.log(validate);
//			console.log(this.validate);
			delete this.validate;
		}
	});

	function allowedStringCharacters(string, allowedChars) {
		var valid = true;

		for (var i = 0; i < string.length; i++) {
			if (allowedChars.indexOf(string.charAt(i)) === -1) {
				valid = false;
				break;
			}
		}

		return valid;
	}
})(jQuery, window, document);