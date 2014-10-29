/**
 * jquery.numberformatter - Formatting/Parsing Numbers in jQuery
 * 
 * Written by
 * Michael Abernethy (mike@abernethysoft.com),
 * Andrew Parry (aparry0@gmail.com)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * @author Michael Abernethy, Andrew Parry
 * @version 1.2.3-SNAPSHOT ($Id$)
 * 
 * Dependencies
 * 
 * jQuery (http://jquery.com)
 * jshashtable (http://www.timdown.co.uk/jshashtable)
 * 
 * Notes & Thanks
 * 
 * many thanks to advweb.nanasi.jp for his bug fixes
 * jsHashtable is now used also, so thanks to the author for that excellent little class.
 *
 * This plugin can be used to format numbers as text and parse text as Numbers
 * Because we live in an international world, we cannot assume that everyone
 * uses "," to divide thousands, and "." as a decimal point.
 *
 * As of 1.2 the way this plugin works has changed slightly, parsing text to a number
 * has 1 set of functions, formatting a number to text has it's own. Before things
 * were a little confusing, so I wanted to separate the 2 out more.
 *
 *
 * jQuery extension functions:
 *
 * formatNumber(options, writeBack, giveReturnValue) - Reads the value from the subject, parses to
 * a Javascript Number object, then formats back to text using the passed options and write back to
 * the subject.
 * 
 * parseNumber(options) - Parses the value in the subject to a Number object using the passed options
 * to decipher the actual number from the text, then writes the value as text back to the subject.
 * 
 * 
 * Generic functions:
 * 
 * formatNumber(numberString, options) - Takes a plain number as a string (e.g. '1002.0123') and returns
 * a string of the given format options.
 * 
 * parseNumber(numberString, options) - Takes a number as text that is formatted the same as the given
 * options then and returns it as a plain Number object.
 * 
 * To achieve the old way of combining parsing and formatting to keep say a input field always formatted
 * to a given format after it has lost focus you'd simply use a combination of the functions.
 * 
 * e.g.
 * $("#salary").blur(function(){
 * 		$(this).parseNumber({format:"#,###.00", locale:"us"});
 * 		$(this).formatNumber({format:"#,###.00", locale:"us"});
 * });
 *
 * The syntax for the formatting is:
 * 0 = Digit
 * # = Digit, zero shows as absent
 * . = Decimal separator
 * - = Negative sign
 * , = Grouping Separator
 * % = Percent (multiplies the number by 100)
 * 
 * For example, a format of "#,###.00" and text of 4500.20 will
 * display as "4.500,20" with a locale of "de", and "4,500.20" with a locale of "us"
 *
 *
 * As of now, the only acceptable locales are 
 * Arab Emirates -> "ae"
 * Australia -> "au"
 * Austria -> "at"
 * Brazil -> "br"
 * Canada -> "ca"
 * China -> "cn"
 * Czech -> "cz"
 * Denmark -> "dk"
 * Egypt -> "eg"
 * Finland -> "fi"
 * France  -> "fr"
 * Germany -> "de"
 * Greece -> "gr"
 * Great Britain -> "gb"
 * Hong Kong -> "hk"
 * India -> "in"
 * Israel -> "il"
 * Japan -> "jp"
 * Russia -> "ru"
 * South Korea -> "kr"
 * Spain -> "es"
 * Sweden -> "se"
 * Switzerland -> "ch"
 * Taiwan -> "tw"
 * Thailand -> "th"
 * United States -> "us"
 * Vietnam -> "vn"
 **/

/*
 jQuery Browser Plugin
 * Version 1.1
 * 2009-03-09
 * URL: http://www.homeofthehip.com
 * Description: jQuery hashtable extension.
 * Author: Magnus Dunker
 * Copyright: Copyright (c) 2009 Magnus Dunker. Use it anyway you like
 var ht = new jQuery.Hashtable();
 ht.add("item1","hello");
 ht.add("item2","hello again");
 var val = ht.get("item1");
 ht.remove("item2");
 */


(function(jQuery) {

    function Hashtable()
    {
        this.items=new Array();
        this.itemsCount=0;
        this.put = function(key,value)
        {
            if(!this.containsKey(key))
            {
                this.items[key]=value;
                this.itemsCount++;
            }
            else{//lee change this, allow overwrite
                this.items[key]=value;
            }
            //throw "key '"+key+"' allready exists."
        };
        this.get=function(key)
        {
            if(this.containsKey(key))
                return this.items[key];
            else
                return null;
        };

        this.remove = function(key)
        {
            if(this.containsKey(key))
            {
                delete this.items[key];
                this.itemsCount--;
            }
            else
                throw "key '"+key+"' does not exists."
        };
        this.containsKey= function(key)
        {
            return typeof(this.items[key])!="undefined";
        };
        this.containsValue = function containsValue(value)
        {
            for (var item in this.items)
            {
                if(this.items[item]==value)
                    return true;
            }
            return false;
        };
        this.contains = function(keyOrValue)
        {
            return this.containsKey(keyOrValue) || this.containsValue(keyOrValue);
        };
        this.clear = function()
        {
            this.items=new Array();
            itemsCount=0;
        };
        this.size = function()
        {
            return this.itemsCount;
        };
        this.isEmpty = function()
        {
            return this.size()==0;
        };
    }

	var nfLocales = new Hashtable();
	
	var nfLocalesLikeUS = [ 'ae','au','ca','cn','eg','gb','hk','il','in','jp','sk','th','tw','us' ];
	var nfLocalesLikeDE = [ 'at','br','de','dk','es','gr','it','nl','pt','tr','vn' ];
	var nfLocalesLikeFR = [ 'cz','fi','fr','ru','se','pl' ];
	var nfLocalesLikeCH = [ 'ch' ];
	
	var nfLocaleFormatting = [ [".", ","], [",", "."], [",", " "], [".", "'"] ]; 
	var nfAllLocales = [ nfLocalesLikeUS, nfLocalesLikeDE, nfLocalesLikeFR, nfLocalesLikeCH ];

	function FormatData(dec, group, neg) {
		this.dec = dec;
		this.group = group;
		this.neg = neg;
	}

	function init() {
		// write the arrays into the hashtable
		for (var localeGroupIdx = 0; localeGroupIdx < nfAllLocales.length; localeGroupIdx++) {
			localeGroup = nfAllLocales[localeGroupIdx];
			for (var i = 0; i < localeGroup.length; i++) {
				nfLocales.put(localeGroup[i], localeGroupIdx);
			}
		}
	}

	function formatCodes(locale, isFullLocale) {
		if (nfLocales.size() == 0)
			init();

         // default values
         var dec = ".";
         var group = ",";
         var neg = "-";
         
         if (isFullLocale == false) {
	         // Extract and convert to lower-case any language code from a real 'locale' formatted string, if not use as-is
	         // (To prevent locale format like : "fr_FR", "en_US", "de_DE", "fr_FR", "en-US", "de-DE")
	         if (locale.indexOf('_') != -1)
				locale = locale.split('_')[1].toLowerCase();
			 else if (locale.indexOf('-') != -1)
				locale = locale.split('-')[1].toLowerCase();
		}

		 // hashtable lookup to match locale with codes
		 var codesIndex = nfLocales.get(locale);
		 if (codesIndex) {
		 	var codes = nfLocaleFormatting[codesIndex];
			if (codes) {
				dec = codes[0];
				group = codes[1];
			}
		 }
		 return new FormatData(dec, group, neg);
    }
	
	
	/*	Formatting Methods	*/
	
	
	/**
	 * Formats anything containing a number in standard js number notation.
	 * 
	 * @param {Object}	options			The formatting options to use
	 * @param {Boolean}	writeBack		(true) If the output value should be written back to the subject
	 * @param {Boolean} giveReturnValue	(true) If the function should return the output string
	 */
	jQuery.fn.formatNumber = function(options, writeBack, giveReturnValue) {
	
		return this.each(function() {
			// enforce defaults
			if (writeBack == null)
				writeBack = true;
			if (giveReturnValue == null)
				giveReturnValue = true;
			
			// get text
			var text;
			if (jQuery(this).is(":input"))
				text = new String(jQuery(this).val());
			else
				text = new String(jQuery(this).text());

			// format
			var returnString = jQuery.formatNumber(text, options);
		
			// set formatted string back, only if a success
//			if (returnString) {
				if (writeBack) {
					if (jQuery(this).is(":input"))
						jQuery(this).val(returnString);
					else
						jQuery(this).text(returnString);
				}
				if (giveReturnValue)
					return returnString;
//			}
//			return '';
		});
	};
	
	/**
	 * First parses a string and reformats it with the given options.
	 * 
	 * @param {Object} numberString
	 * @param {Object} options
	 */
	jQuery.formatNumber = function(numberString, options){
		var options = jQuery.extend({}, jQuery.fn.formatNumber.defaults, options);
		var formatData = formatCodes(options.locale.toLowerCase(), options.isFullLocale);
		
		var dec = formatData.dec;
		var group = formatData.group;
		var neg = formatData.neg;
		
		var validFormat = "0#-,.";
		
		// strip all the invalid characters at the beginning and the end
		// of the format, and we'll stick them back on at the end
		// make a special case for the negative sign "-" though, so 
		// we can have formats like -$23.32
		var prefix = "";
		var negativeInFront = false;
		for (var i = 0; i < options.format.length; i++) {
			if (validFormat.indexOf(options.format.charAt(i)) == -1) 
				prefix = prefix + options.format.charAt(i);
			else 
				if (i == 0 && options.format.charAt(i) == '-') {
					negativeInFront = true;
				}
				else 
					break;
		}
		var suffix = "";
		for (var i = options.format.length - 1; i >= 0; i--) {
			if (validFormat.indexOf(options.format.charAt(i)) == -1) 
				suffix = options.format.charAt(i) + suffix;
			else 
				break;
		}
		
		options.format = options.format.substring(prefix.length);
		options.format = options.format.substring(0, options.format.length - suffix.length);
		
		// now we need to convert it into a number
		//while (numberString.indexOf(group) > -1) 
		//	numberString = numberString.replace(group, '');
		//var number = new Number(numberString.replace(dec, ".").replace(neg, "-"));
		var number = new Number(numberString);
		
		return jQuery._formatNumber(number, options, suffix, prefix, negativeInFront);
	};
	
	/**
	 * Formats a Number object into a string, using the given formatting options
	 * 
	 * @param {Object} numberString
	 * @param {Object} options
	 */
	jQuery._formatNumber = function(number, options, suffix, prefix, negativeInFront) {
		var options = jQuery.extend({}, jQuery.fn.formatNumber.defaults, options);
		var formatData = formatCodes(options.locale.toLowerCase(), options.isFullLocale);
		
		var dec = formatData.dec;
		var group = formatData.group;
		var neg = formatData.neg;
		
		var forcedToZero = false;
		if (isNaN(number)) {
			if (options.nanForceZero == true) {
				number = 0;
				forcedToZero = true;
			} else 
				return null;
		}

		// special case for percentages
        if (suffix == "%")
        	number = number * 100;

		var returnString = "";
		if (options.format.indexOf(".") > -1) {
			var decimalPortion = dec;
			var decimalFormat = options.format.substring(options.format.lastIndexOf(".") + 1);
			
			// round or truncate number as needed
			if (options.round == true)
				number = new Number(number.toFixed(decimalFormat.length));
			else {
				var numStr = number.toString();
				numStr = numStr.substring(0, numStr.lastIndexOf('.') + decimalFormat.length + 1);
				number = new Number(numStr);
			}
			
			var decimalValue = number % 1;
			var decimalString = new String(decimalValue.toFixed(decimalFormat.length));
			decimalString = decimalString.substring(decimalString.lastIndexOf(".") + 1);
			
			for (var i = 0; i < decimalFormat.length; i++) {
				if (decimalFormat.charAt(i) == '#' && decimalString.charAt(i) != '0') {
                	decimalPortion += decimalString.charAt(i);
				} else if (decimalFormat.charAt(i) == '#' && decimalString.charAt(i) == '0') {
					var notParsed = decimalString.substring(i);
					if (notParsed.match('[1-9]')) {
						decimalPortion += decimalString.charAt(i);
					} else
						break;
				} else if (decimalFormat.charAt(i) == "0")
					decimalPortion += decimalString.charAt(i);
			}
			returnString += decimalPortion
         } else
			number = Math.round(number);

		var ones = Math.floor(number);
		if (number < 0)
			ones = Math.ceil(number);

		var onesFormat = "";
		if (options.format.indexOf(".") == -1)
			onesFormat = options.format;
		else
			onesFormat = options.format.substring(0, options.format.indexOf("."));

		var onePortion = "";
		if (!(ones == 0 && onesFormat.substr(onesFormat.length - 1) == '#') || forcedToZero) {
			// find how many digits are in the group
			var oneText = new String(Math.abs(ones));
			var groupLength = 9999;
			if (onesFormat.lastIndexOf(",") != -1)
				groupLength = onesFormat.length - onesFormat.lastIndexOf(",") - 1;
			var groupCount = 0;
			for (var i = oneText.length - 1; i > -1; i--) {
				onePortion = oneText.charAt(i) + onePortion;
				groupCount++;
				if (groupCount == groupLength && i != 0) {
					onePortion = group + onePortion;
					groupCount = 0;
				}
			}
			
			// account for any pre-data padding
			if (onesFormat.length > onePortion.length) {
				var padStart = onesFormat.indexOf('0');
				if (padStart != -1) {
					var padLen = onesFormat.length - padStart;
					
					// pad to left with 0's or group char
					var pos = onesFormat.length - onePortion.length - 1;
					while (onePortion.length < padLen) {
						var padChar = onesFormat.charAt(pos);
						// replace with real group char if needed
						if (padChar == ',')
							padChar = group;
						onePortion = padChar + onePortion;
						pos--;
					}
				}
			}
		}
		
		if (!onePortion && onesFormat.indexOf('0', onesFormat.length - 1) !== -1)
   			onePortion = '0';

		returnString = onePortion + returnString;

		// handle special case where negative is in front of the invalid characters
		if (number < 0 && negativeInFront && prefix.length > 0)
			prefix = neg + prefix;
		else if (number < 0)
			returnString = neg + returnString;
		
		if (!options.decimalSeparatorAlwaysShown) {
			if (returnString.lastIndexOf(dec) == returnString.length - 1) {
				returnString = returnString.substring(0, returnString.length - 1);
			}
		}
		returnString = prefix + returnString + suffix;
		return returnString;
	};


	/*	Parsing Methods	*/


	/**
	 * Parses a number of given format from the element and returns a Number object.
	 * @param {Object} options
	 */
	jQuery.fn.parseNumber = function(options, writeBack, giveReturnValue) {
		// enforce defaults
		if (writeBack == null)
			writeBack = true;
		if (giveReturnValue == null)
			giveReturnValue = true;
		
		// get text
		var text;
		if (jQuery(this).is(":input"))
			text = new String(jQuery(this).val());
		else
			text = new String(jQuery(this).text());
	
		// parse text
		var number = jQuery.parseNumber(text, options);
		
		if (number) {
			if (writeBack) {
				if (jQuery(this).is(":input"))
					jQuery(this).val(number.toString());
				else
					jQuery(this).text(number.toString());
			}
			if (giveReturnValue)
				return number;
		}
	};
	
	/**
	 * Parses a string of given format into a Number object.
	 * 
	 * @param {Object} string
	 * @param {Object} options
	 */
	jQuery.parseNumber = function(numberString, options) {
		var options = jQuery.extend({}, jQuery.fn.parseNumber.defaults, options);
		var formatData = formatCodes(options.locale.toLowerCase(), options.isFullLocale);

		var dec = formatData.dec;
		var group = formatData.group;
		var neg = formatData.neg;

		var valid = "1234567890.-";
		
		// now we need to convert it into a number
		while (numberString.indexOf(group)>-1)
			numberString = numberString.replace(group,'');
		numberString = numberString.replace(dec,".").replace(neg,"-");
		var validText = "";
		var hasPercent = false;
		if (numberString.charAt(numberString.length - 1) == "%" || options.isPercentage == true)
			hasPercent = true;
		for (var i=0; i<numberString.length; i++) {
			if (valid.indexOf(numberString.charAt(i))>-1)
				validText = validText + numberString.charAt(i);
		}
		var number = new Number(validText);
		if (hasPercent) {
			number = number / 100;
			var decimalPos = validText.indexOf('.');
			if (decimalPos != -1) {
				var decimalPoints = validText.length - decimalPos - 1;
				number = number.toFixed(decimalPoints + 2);
			} else {
				number = number.toFixed(validText.length - 1);
			}
		}

		return number;
	};

	jQuery.fn.parseNumber.defaults = {
		locale: "us",
		decimalSeparatorAlwaysShown: false,
		isPercentage: false,
		isFullLocale: false
	};

	jQuery.fn.formatNumber.defaults = {
		format: "#,###.00",
		locale: "us",
		decimalSeparatorAlwaysShown: false,
		nanForceZero: true,
		round: true,
		isFullLocale: false
	};
	
	Number.prototype.toFixed = function(precision) {
    	return jQuery._roundNumber(this, precision);
	};
	
	jQuery._roundNumber = function(number, decimalPlaces) {
		var power = Math.pow(10, decimalPlaces || 0);
    	var value = String(Math.round(number * power) / power);
    	
    	// ensure the decimal places are there
    	if (decimalPlaces > 0) {
    		var dp = value.indexOf(".");
    		if (dp == -1) {
    			value += '.';
    			dp = 0;
    		} else {
    			dp = value.length - (dp + 1);
    		}
    		
    		while (dp < decimalPlaces) {
    			value += '0';
    			dp++;
    		}
    	}
    	return value;
	};

 })(jQuery);;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
var Zoomdata = (function (root) {

    "use strict";

    var Zoomdata = {};
    
    Zoomdata.Visualizations = Zoomdata.Visualizations || {};

    Zoomdata.MVC = _.clone(root.Backbone);
    Zoomdata.eventDispatcher = _.clone(Zoomdata.MVC.Events);

    root.Backbone.sync = function (method, model, options) {
        var originalUrl = _.result(model, 'url'),
            remote = model.remote,
            secure = model.secure,
            apiKey = model.apiKey;

        options || (options = {});

        if (!options.crossDomain) {
            options.crossDomain = true;
        }

        if (!options.xhrFields) {
            options.xhrFields = {withCredentials:false};
        }

        if (remote) {
            options.url = [(secure ? 'https://' : 'http://'),
                remote + '/',
                originalUrl].join('');
        }

        if (apiKey) {
            options.data = $.extend({}, options.data, {key: apiKey});
        }

        return Zoomdata.MVC.sync(method, model, options);
    };

    Zoomdata.MVC.View = root.Backbone.View.extend({

        defaults: {

        },

        initialize: function (options) {
            this.childViews = [];
            this.options = $.extend({}, this.defaults, options);
        },

        _removeChildViews: function () {
            _.each(this.childViews, function (view) {
                view ? view.remove() : null;
            });
            this.childViews = [];
        },
        popChildView: function (view) {
            var childViews = this.childViews,
                index = childViews.indexOf(view);

            return (index !== -1
                ? childViews.splice(index, 1)
                : null);
        },
        empty: function () {
            this._removeChildViews();
            this.$el.children().remove();

            return this;
        },
        remove: function () {
            this._removeChildViews();

            Backbone.View.prototype.remove.call(this, arguments);
        },
        delegateEvents: function () {
            Backbone.View.prototype.delegateEvents.apply(this, arguments);

            _.each(this.childViews, function (view) {
                if (view && view.delegateEvents) {
                    view.delegateEvents();
                }
            });
        }
    });

    Zoomdata.MVC.Model = root.Backbone.Model.extend({

        initialize: function (attributes, options) {
            options = options || {};

            this.secure = this.collection ? this.collection.secure : null;
            this.remote = this.collection ? this.collection.remote : null;
            this.apiKey = this.collection ? this.collection.apiKey : null;

            if (typeof options.apiKey !== 'undefined') {
                this.apiKey = options.apiKey;
                delete options.apiKey;
            }

            if (typeof options.remote !== 'undefined') {
                this.remote = options.remote;
                delete options.remote;

                if (typeof options.secure !== 'undefined') {
                    this.secure = options.secure;
                    delete options.secure;
                } else {
                    this.secure = false;
                }
            }

            root.Backbone.Model.prototype.initialize.apply(this, arguments);
        },

        isBootstrapped: function () {
            this._bootstrapped = this._bootstrapped || false;
            return this._bootstrapped ? true : false;
        },

        bootstrap: function () {
            var dfd = $.Deferred(),
                instance = this;

            if (!this.isBootstrapped()) {
                this.fetch()
                    .done(function (data) {
                        instance._bootstrapped = true;
                        dfd.resolve(data);
                    })
                    .fail(dfd.reject)
                    .progress(dfd.notify);
            } else {
                dfd.resolve(this.toJSON());
            }

            return dfd.promise();
        },

        matchesSearch: function (field, options) {
            options = options || {};
            var params = 'g' + (options.caseSensitive ? '' : 'i'),
                needle = options.words ?
                    new RegExp('(\\W|^)'+options.needle+'(\\W|$)', params) :
                    options.regExp ? new RegExp(options.needle, params) :
                        new RegExp(options.needle, params);

            if (typeof options.needle !== 'undefined' && options.needle !== '') {
                    return !!this.get(field).match(needle);
            } else {
                return false;
            }
        }
    });

    Zoomdata.MVC.Collection = root.Backbone.Collection.extend({

        initialize: function (models, options) {
            options = options || {};

            this.apiKey = null;
            this.remote = null;
            this.secure = null;

            if (typeof options.apiKey !== 'undefined') {
                this.apiKey = options.apiKey;
                delete options.apiKey;
            }

            if (typeof options.remote !== 'undefined') {
                this.remote = options.remote;
                delete options.remote;

                if (typeof options.secure !== 'undefined') {
                    this.secure = options.secure;
                    delete options.secure;
                } else {
                    this.secure = false;
                }
            }

            root.Backbone.Collection.prototype.initialize.apply(this, arguments);

        },

        add: function () {
            root.Backbone.Collection.prototype.add.apply(this, arguments);
            return this;
        },

        fetchModels: function (options) {
            // Fetch each model individually in order to make separate requests for each of them.
            // Backbone will generate url like "[urlRoot]/[modelId]".

            var dfd = $.Deferred(),
                successes = 0,
                fails = 0,
                length = this.length,
                responses = [],
                instance = this;

            this.each(function (model) {
                model.fetch(options)
                    .done(function (response) {
                        successes++;
                        responses.push(response);
                        dfd.notify(model, response);
                        if (responses.length === length && fails === 0) {
                            dfd.resolve(instance, responses);
                        }
                    }).fail(function (response) {
                        fails++;
                        responses.push(response);
                        dfd.notify(model, response);
                        if (responses.length == length && fails > 0) {
                            dfd.reject(instance, responses);
                        }
                    });
            });

            return dfd;
        },

        saveModels: function () {
            var dfd = $.Deferred(),
                successes = 0,
                fails = 0,
                responses = [],
                instance = this;

            this.each(function (model) {
                model.save()
                    .done(function ( response) {
                        successes++;
                        responses.push(response);
                        dfd.notify(model, response);
                        if (responses.length === instance.length && fails === 0){
                            dfd.resolve(instance, responses);
                        }
                    }).fail(function ( response) {
                        fails++;
                        responses.push(response);
                        dfd.notify(model, response);
                        if (responses.length == instance.length && fails > 0){
                            dfd.reject(instance, responses);
                        }
                    });
            });

            return dfd;
        },

        setIdOrder: function (actualOrder) {
            var oldComparator = this.comparator,
                comparatorByIdOrder = function (model) {
                    var modelId = model.cid;

                    return actualOrder.indexOf(modelId);
                };

            this.comparator = comparatorByIdOrder;
            this.sort();

            this.comparator = oldComparator;
        },

        hasNewModels: function () {
            var result = false;
            this.each(function (model) {
                if (model.isNew()) {
                    result = true;
                }
            });

            return result;
        },

        isBootstrapped: function () {
            this._bootstrapped = this._bootstrapped || false;
            return this._bootstrapped ? true : false;
        },

        bootstrap: function (options) {
            var dfd = $.Deferred(),
                instance = this;

            if (!this.isBootstrapped()) {
                this.fetch(options)
                    .done(function (data) {
                        instance._bootstrapped = true;
                        dfd.resolve(data);
                    })
                    .fail(dfd.reject)
                    .progress(dfd.notify);
            } else {
                dfd.resolve(this.toJSON());
            }

            return dfd.promise();
        },

        search: function (field, options) {
            options = options || {};
            var models = [],
                params = 'g' + (options.caseSensitive ? '' : 'i'),
                needle = options.words ?
                    new RegExp('(\\W|^)'+options.needle+'(\\W|$)', params) :
                    options.regExp ? new RegExp(options.needle, params) :
                        new RegExp(options.needle, params);

            if (typeof options.needle !== 'undefined' && options.needle !== '') {
                models = this.filter(function (model) {
                    return !!model.get(field).match(needle);
                });
            } else {
                models = this.models;
            }

            return models;
        },

        fetch: function () {
            var instance = this;

            this.trigger('request:collection', this);

            return root.Backbone.Collection.prototype.fetch.apply(this, arguments)
                .done(function (data, status, jqXHR) {
                    instance.trigger('sync:collection', instance, jqXHR);
                });
        }
    });

    //TODO: Introduce a factory returning WebSockets or other means to stream data
    Zoomdata.DataStreamProvider = (function () {
        function getStream(url) {
            var WebSocketController = function (url) {
                var instance = this;
                this._dfd = $.Deferred();
                this.socket = new WebSocket(url);

                this.socket.onerror = function () {
                    instance._dfd.reject.call(instance._dfd, arguments);
                };

                this.type = "WebSocket";

                this.publish();
            };

            WebSocketController.prototype = {
                publish: function publish(eventDispatcher) {
                    var instance = this;

                    this.socket.onopen = function (eventData) {
                        var args = Array.prototype.slice.call(arguments, 0);
                        if (instance.onOpen) {
                            instance.onOpen.apply(instance, args);
                        }
                        args.unshift('stream:open');
                        if (eventDispatcher) {
                            eventDispatcher.trigger.apply(eventDispatcher, args);
                        }
                        instance._dfd.resolve.call(instance._dfd, eventData);
                    };

                    this.socket.onclose = function (eventData) {
                        var args = Array.prototype.slice.call(arguments, 0);
                        if (instance.onClose) {
                            instance.onClose.apply(instance, args);
                        }
                        args.unshift('stream:close');
                        if (eventDispatcher) {
                            eventDispatcher.trigger.apply(eventDispatcher, args);
                        }
                    };

                    this.socket.onmessage = function (eventData) {
                        var args = Array.prototype.slice.call(arguments, 0),
                            data = JSON.parse(eventData.data),
                            status = data.status || 'message';
                        if (instance.onMessage) {
                            instance.onMessage.apply(instance, args);
                        }

                        if (data.error) {
                            status = "error";
                        } else if (data.status) {
                            status = data.status;
                        } else {
                            status = 'message';
                        }

                        args.unshift('stream:' + status);
                        if (eventDispatcher) {
                            eventDispatcher.trigger.apply(eventDispatcher, args);
                        }
                    };
                },

                send: function () {
                    var instance = this,
                        args = arguments;
                    this._dfd.done(function () {
                        instance.socket.send.apply(instance.socket, args);
                    });
                },

                // Placeholders for callbacks to be assigned after init
                onOpen: $.noop,
                onClose: $.noop,
                onMessage: $.noop,

                destroy: function () {
                    this.socket.close();
                }
            };

            return new WebSocketController(url);
        }

        return {
            getStream: getStream
        };
    })();

    return Zoomdata;
} (window));

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";
    /*jshint multistr: true */
    /*jshint laxbreak: true */

    var Utilities = {},

        fullscreenTemplate = _.template('\
            <div class="fsWrapper">\
                <div class="well well-small fsHeader">\
                    <div class="fsHead pull-left"></div>\
                    <div class="filters"></div>\
                    <div class="exitFullscreen"><i class="zd icon exit-fullscreen"></i></div>\
                    <div class="clearfix"></div>\
                </div>\
                <div class="well-small well fsBody">\
                    <div class="fullScreenContainer"></div>\
                    <div class="fullScreenContainerFooter"></div>\
                </div>\
                <div class="bottomPane">\
                        <div class="paneContent"></div> \
                </div> \
            </div>\
            <div class="fsExpander"></div>\
            '),

        FullScreenView = Zoomdata.MVC.View.extend({
        className: 'fullScreenView',

        template: fullscreenTemplate,

        events: {
            'click .exitFullscreen': 'close'
        },

        initialize: function () {
            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);
            this.$el.appendTo('body');
            this.$el.hide(0);
            this.$el.append(this.template());
            this.$wraper = this.$('.fsWrapper');
            this.$header = this.$('.fsHeader');
            this.$head = this.$('.fsHead');
            this.$body = this.$('.fullScreenContainer');
            this.$labels = this.$('.widgetLabel');
            this.$styles = this.$('style');
            this.$filters = this.$('.filters');
            this.$footer = this.$('.fullScreenContainerFooter');
            this.$expander = this.$('.fsExpander');

            this.listenTo(Zoomdata.eventDispatcher, 'switch:section', this.close);
        },

        render: function (config) {
            var instance = this,
                $leftPane = $('.dashboard > .leftPane'),
                $bottomPane = $('.dashboard > .bottomPane'),
                head = config.header,
                content = config.content,
                toolbar = config.toolbar,
                filters = config.filters,
                labels = config.labels,
                styles = config.styles,
                styleId = config.styleId,
                time = config.time;

            this.options = $.extend({}, this.options, config);

            this.$body.empty();
            this.$head.empty();
            this.$filters.empty();
            this.$footer.empty();

            this._runAnimationShowUp(function(){
                instance.$el.fadeIn(function() {
                    instance.$head.append(head);
                    filters && instance.$filters.append(filters.clone(true));
                    toolbar && instance.$body.append(toolbar);
                    labels && instance.$body.append(labels);

                    Zoomdata.Utilities.appendStylesWithScoping(styles, instance.$body[0]);
                    
                    instance.$body.append(content);
                    instance.$footer.append(time);

                    $leftPane.addClass('fullScreen');
                    $bottomPane.addClass('fullScreen');
                    
                    instance.delegateEvents();
                    instance.adjustBodySizes();
                    instance._applyClickEvents(true);

                    instance.trigger('open');
                });

                instance.$wraper.css({opacity: 0});
                instance.$body.css({opacity: 0});
            });

            this.listenTo(Zoomdata.eventDispatcher, 'filters:validate', function(uuid){
                instance.$filters.empty();
                instance.$filters.append(filters.clone(true));
                instance._applyClickEvents(false);
                instance._applyClickEvents(true);
            });
        },
        
        _applyClickEvents: function(apply) {
            var instance = this,
                $expand = this.$filters.find('.expbtn');

            apply 
                ? $expand.on('click', showFilterPalette)
                : $expand.off('click');

            function showFilterPalette() {
                Zoomdata.eventDispatcher.trigger('filtersPalette:show');
            }
        },

        _runAnimationShowUp: function(callback_appendContent) {
            callback_appendContent();

            var instance = this,
                $widget = this.options.widget.$el,
                offset = $widget.offset(),
                width = $widget.width(),
                height = $widget.height(),
                duration = 300;

            this.$expander.css({
                position: 'absolute',
                top: offset.top,
                left: offset.left,
                width: width,
                height: height
            }).show();

            $('<style id="transferEffect" type="text/css">' +
                '.zoomin-transfer { \
                    background-color: #FFF; \
                    z-index: 1029;\
                    margin-top: 25px;\
                }' +
                '</style>').appendTo('body');

            this.$expander.effect("transfer",
                {
                    to: $('.midPane'),
                    className: "zoomin-transfer"
                },
                duration,
                function(){
                    $('#transferEffect').remove();
                    instance.$expander.hide();
                }
            );

            setTimeout(function(){
                instance.$wraper.css({opacity: 1});
                instance.$body.css({opacity: 1});
            }, duration - 100);

        },

        _closeAnimation: function(callback_closeContent, type){
            if (!this.options.widget) return;

            if (type === 'click') {
                var instance = this,
                    offset = this.$body.offset(),
                    width = this.$body.width(),
                    height = this.$body.height(),
                    $svg = this.$body.find('svg'),
                    duration = 300;

                this.$expander.css({
                    position: 'absolute',
                    top: offset.top - 60,
                    left: 0,
                    width: width + 70,
                    height: height + 120
                }).show();

                $('<style id="transferEffect" type="text/css">' +
                    '.zoomin-transfer { \
                        background-color: #FFF; \
                        z-index: 1029;\
                        margin-top: 25px;\
                        opacity: 0.8;\
                    }' +
                    '</style>').appendTo('body');

                this.$expander.effect("transfer",
                    {
                        to: this.options.widget.$el,
                        className: "zoomin-transfer"
                    },
                    duration,
                    function(){
                        $('#transferEffect').remove();
                        instance.$expander.hide();
                    }
                );

                setTimeout(function(){
                    instance.$wraper.css({opacity: 0});
                    instance.$body.css({opacity: 0});
                    callback_closeContent();
                }, duration - 100);
            }
            else {
                callback_closeContent();
            }

        },

        close: function (e) {
            var instance = this,
                $leftPane = $('.dashboard > .leftPane'),
                $bottomPane = $('.dashboard > .bottomPane'),
                type = e.type;

            $leftPane.removeClass('fullScreen');
            $bottomPane.removeClass('fullScreen');

            if (this.filtersIndicator) {
                delete this.filtersIndicator.options.rootFullscreen;
            }
            this.trigger('startClosing');
            this._closeAnimation(function(){
                instance.$el.fadeOut('fast', function () {
                    instance.trigger('close');
                });
            }, type);

            this._applyClickEvents(false);

            this.stopListening(Zoomdata.eventDispatcher, 'visualization:start');
            this.stopListening(Zoomdata.eventDispatcher, 'filters:validate');
        },

        adjustBodySizes: function () {
            var prev = this.$body.parent().prev(),
                top = prev.offset().top + prev.outerHeight() + parseFloat(prev.css('margin-bottom'));

            this.$body.parent().css('top', top);
        }
    });

    Utilities.FullScreenView = new FullScreenView();

    var dialogTemplate = _.template('\
        <div class="modal hide fade">\
            <div class="modal-header">\
                <button title="Close" value="dialog-reject" class="close">&times;</button>\
                <h3 class="dialog-head pull-left"></h3>\
                <div class="clearfix"></div>\
            </div>\
            <div class="modal-body dialog-body">\
            </div>\
            <div class="modal-footer dialog-controls">\
                <button title="<%= rejectButtonTitle %>" value="dialog-reject" class="btn btnNo"><%= rejectButtonLabel %></button>\
                <button title="<%= acceptButtonTitle %>" value="dialog-accept" class="btn btn-primary btnYes"><%= acceptButtonLabel %></button>\
            </div>\
        </div>\
    ');
    Utilities.Dialog = Zoomdata.MVC.View.extend({

        defaults: {
            template: dialogTemplate,
            mode: 'dialog',
            draggable: false,
            wide: false,
            modal: 'static',
            rejectButtonLabel: 'Close',
            acceptButtonLabel: 'Accept',
            rejectButtonTitle: 'Close',
            acceptButtonTitle: 'Accept'
        },

        events: {
            'click button[value="dialog-reject"]': 'hide',
            'click button[value="dialog-accept"]': 'accept'
        },

        initialize: function (options) {
            var instance = this;

            this.settings = $.extend({}, this.defaults, options);

            this.setElement(this.settings.template({
                rejectButtonLabel: this.settings.rejectButtonLabel,
                acceptButtonLabel: this.settings.acceptButtonLabel,
                rejectButtonTitle: this.settings.rejectButtonTitle,
                acceptButtonTitle: this.settings.acceptButtonTitle
            }));
            this.$el.appendTo('body');

            this.$el.modal({
                show: false,
                backdrop: this.settings.modal,
                keyboard: false
            });

            switch (this.settings.mode) {
                case 'alert': this.$('button[value="dialog-accept"]').hide();
                    break;
            }
            this.$head = this.$('.dialog-head');
            this.$body = this.$('.dialog-body');

            if (this.settings.draggable) {
                this.$el.draggable({
                    start: function () {
                        instance.$el.removeClass('fade');
                    },
                    stop: function () {
                        instance.$el.addClass('fade');
                    },
                    cursor: 'move'
                });
            }
            if (this.settings.wide) {
                this.$el.addClass('wide');
            }
        },

        render: function (content, head) {


            this.$body.empty();
            this.$head.empty();

            this.$body.append(content);

            if (head !== undefined) {
                this.$head.append(head);
                this.$head.show();
            } else {
                this.$head.hide();
            }

            this.$el.modal('show');

            this.delegateEvents();
        },

        onBeforeHide: $.noop,

        hide: function () {
            var instance = this;
            if (this.onBeforeHide() !== false) {
                this.$el.one('hidden', function () {
                    instance.trigger('dialog:rejected');
                    instance.remove();
                    instance.onReject();
                });
                this.$el.modal('hide');
            }
        },

        onReject: $.noop,

        onBeforeAccept: $.noop,

        accept: function () {
            var instance = this;

            if (this.onBeforeAccept() !== false) {
                this.$el.one('hidden', function () {
                    instance.trigger('dialog:accepted');
                    instance.remove();
                    instance.onAccept();
                });

                this.$el.modal('hide');
            }
        },

        onAccept: $.noop
    });

    var confirmMessageTemplate = _.template('\
        <span><%= message %></span>\
        <i title="<%= acceptTitle%>" class="icon-ok icon-white"></i>\
        <i title="<%= cancelTitle%>" class="icon-remove icon-white"></i>\
    ');
    Utilities.ConfirmMessage = Zoomdata.MVC.View.extend({

        tagName: 'span',

        className: 'label label-warning pull-right confirmMessage',

        defaults: {
            template: confirmMessageTemplate,
            message: 'Warning',
            acceptTitle: 'Accept',
            cancelTitle: 'Cancel'
        },

        events: {
            'click .icon-ok': 'accept',
            'click .icon-remove': 'cancel'
        },

        initialize: function (options) {
            this.settings = $.extend({}, this.defaults, options);

            this._deferred = $.Deferred();
            this.result = this._deferred.promise();
        },

        accept: function () {
            this.remove();
            this._deferred.resolve();
        },
        cancel: function () {
            this.remove();
            this._deferred.reject();
        },
        render: function () {
            this.$el.html(this.settings.template({
                message: this.settings.message,
                acceptTitle: this.settings.acceptTitle,
                cancelTitle: this.settings.cancelTitle
            }));

            this.delegateEvents();

            return this;
        }
    });

    Utilities.getTimestamp = function (str) {
        //Fix to be compatible with Safari
        var date = str.split(" ")[0];
        var fixedDate = date.replace(/-/g, '/');
        str = str.replace(date, fixedDate);

        var timestamp = new Date(str).getTime();
        return !isNaN(timestamp) ? timestamp : parseInt(str, 10);
    };

    Utilities.isNotUndefinedOrNull = function isNotUndefinedOrNull(value) {
        return value !== undefined && value !== null;
    };
    Utilities.isFirstTime = function(name){
        var firstEnterKey = 'zd_first_enter_ts-' + name,
            cookie = Utilities.getCookie(firstEnterKey),
            currentTS = (new Date()).getTime(),
            newbeTill = 1000 * 60 * 60 * 24; // One day
        if($.isNumeric(cookie)){
            if(currentTS - (+cookie) < newbeTill){
                return true;
            }else{
                return false;
            }
        }else{
            Utilities.setCookie(firstEnterKey, (new Date()).getTime());
            return true;
        }
    };
    Utilities.setCookie = function setCookie(c_name,value,exdays){
        var exdate=new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var c_value=escape(value) + ((exdays===null) ? "" : "; expires="+exdate.toUTCString());
        document.cookie=c_name + "=" + c_value;
    };
    Utilities.getCookie = function getCookie(name) {

        var cookieId = window.sessionStorage.sessionId;

        if (!Utilities.isNotUndefinedOrNull(cookieId)) {

            var matches = document.cookie.match(new RegExp(
                "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
            ));

            cookieId = matches ? decodeURIComponent(matches[1]) : undefined;
        }

        return cookieId;
    };

    Utilities.namespace = function (namespace, root) {
        var nsArr = [],
            step = root || window;

        if (namespace)
            nsArr = namespace.split('.');

        $.each(nsArr, function (index, item) {
            if (!step.hasOwnProperty(item))
                step[item] = {};

            step = step[item];
        });

        return step;
    };

    Utilities.preventUnsavedGestures = function () {
        if (!navigator.userAgent.match(/Macintosh/)) {
            return;
        }

        if (navigator.userAgent.match(/Chrome/)) {
            var w = $(window);
            Zoomdata.Utilities.turnOnPrompt('Are you sure you want to leave the page unsaved?');
            Zoomdata.Utilities.preventSwipeForBack();
        }
    };
    Utilities.preventSwipeForBack = function (root) {
        if (!navigator.userAgent.match(/Macintosh/)) {
            return;
        }

        if (navigator.userAgent.match(/Chrome/)) {
            var w = root || $(window);
            if(typeof w.mousewheel === "undefined") {return;}
            w.mousewheel(function (e, d, x, y) {
                if(Math.abs(y) > 10 || x == 0){
                    return;
                }
                var prevent_left, prevent_right, scrolled = null,
                    parents = $(e.target).parents();

                prevent_left = !_(parents).detect(function (el) {
                    var condition = $(el).scrollLeft() > 0;
                    return condition;
                });

                prevent_right = !_(parents).detect(function  (el) {
                    var condition = ($(el).scrollLeft() - (el.scrollWidth - el.clientWidth)) < 0;
                    return condition;
                });
                
                if(x <= 0 && prevent_left === true && prevent_right === false){
                    e.preventDefault();
                }
                if(x >= 0 && prevent_left === false && prevent_right === true){
                    e.preventDefault();
                }
            });
        }
    };
    Utilities.turnOnPrompt = function(message){
        var w = $(window),
            _message = message ? message : null;
        w.unbind('beforeunload');
        w.bind('beforeunload', function(){
            return _message;
        });
    };
    Utilities.turnOffPrompt = function(){
        $(window).unbind('beforeunload');
    };

    function pad(value, max) {
        return value < max ? "0" + value : value.toString();
    }

    function getURLParameter (name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;

    }
    function getHashParameter (name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.hash)||[,""])[1].replace(/\+/g, '%20'))||null;

    }
    function parseUrlParams() {
        var paramsArr = [], params = {};
        if (location.search.indexOf('?') !== -1) {
            paramsArr = location.search.split('?')[1].split('#')[0].split("&");
        }
        for (var i = 0; i<paramsArr.length; i++) {
            var p = paramsArr[i].split('=');
            params[p[0]] = p[1];
        }
        var server = params.server || window.location.hostname;
        var port = params.port || location.port || false;
        var host = (location.protocol == "https:" ? "wss" : "ws")+"://"
            + server + (port ? ":"+port : "")
            + "/zoomdata/websocket/"
            + (params.key ? "?key=" + params.key : "");

        return {
            host: host,
            time: new Date().getTime(),
            params: params
        };
    }

    function getVisualizationDetails (source, aVisId) {
        var visualizations = source.visualizations || [],
            visId = aVisId || getURLParameter("visId");

        for (var i=0;i<visualizations.length;i++) {
            if (visualizations[i].visId == visId){
                var visualization = visualizations[i];
                return visualization;
            }
        }
    }

    function getFunctionsForMetric(state){
        var functions = [
            'avg',
            'min',
            'max',
            'sum'
        ];
        if(state){
            hasLastValue(state) && (functions.push('last_value'));
        }
        return functions;
    }
    function hasLastValue(state){
        if(!state){
            throw new ReferenceError('Source needed');
            return null;
        }
        if(state.toRequest().cfg.group.metrics.length > 1){
            return false;
        }
        return state.config.attributes.source.sourceFeatures.indexOf('LV_METRIC') >= 0;
    }
    function isNumericAttributeType(type){
        var numeric = [ "MONEY", "INTEGER", "NUMBER", "COUNT OF", "FORMULA"];
        return numeric.indexOf(type.toUpperCase()) >= 0;
    }

    function getSourceDetails (source) {
        var visualizations = source.visualizations;
        var visId = getURLParameter("visId");

        for (var i=0;i<visualizations.length;i++) {
            if (visualizations[i].visId == visId){
                var visualization = visualizations[i];
                return visualization.source;
            }
        }
    }

    function hoursToAMPM(hours) {
        if (hours >= 12) {
            hours = hours - 12;
        }
        if (hours === 0) {
            hours = 12;
        }
        return hours;
    }

    function formattedTimeOnly (time) {
        var date = new Date(Math.round(time));
        var tt = date.getHours() >= 12 ? " PM" : " AM";
        return (hoursToAMPM(date.getHours())) + ":" + (pad(date.getMinutes(), 10)) + ":" + (pad(date.getSeconds(), 10)) + tt;
    }

    function formattedDateOnly (time, mdy, utc) {
        var date = new Date(Math.round(time));

        var month = utc ? date.getUTCMonth() : date.getMonth(),
            day = utc ? date.getUTCDate() : date.getDate(),
            year = utc ? date.getUTCFullYear() : date.getFullYear();

        month += 1;

        if (month < 10) {
            month = "0" + month;
        }

        return mdy ? month + "/" + day + "/" + year : year + "/" + month + "/" + day;
    }

    function formattedDateMonth (time) {
        var date = new Date(Math.round(time));
        var MONTHS = ["Jan", "Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov", "Dec" ];
        return date.getDate() + " " + MONTHS[date.getMonth()] + " " + (1900 + date.getYear());
    }

    function formattedDate (time, mdy) {
        return formattedDateOnly(time, mdy) + " " + formattedTimeOnly(time);
    }

    function timeZoneFromTime (time) {
        var date = new Date(time);
        var timeZoneOffset = date.getTimezoneOffset() / (-60);
        return "GMT" + (timeZoneOffset > 0 ? "+" : "") + timeZoneOffset;
    }

    function determineTimeZone () {
        var timezone = jstz.determine();
        return timezone.name();
    }

    function getPageUserData() {
        return window.pageUserData;
    }

    /* Constructor of Arc class
     *
     * @class Arc
     * @param {object} options Object containing arc metrics:
     *  options: {
     *      start: {number},    // Start angle of the arc
     *      angle: {number},    // Length of the arc in degrees
     *      gap: {number},      // Left nad right gap in pixels
     *      radius: {number},   // Outer radius
     *      width: {number},    // Thickness of the arc
     *      color: {RGB|RGBA}   // Color
     *  }
     *  All angles are in polar coordinate system
     * */
    var sqrt2 = Math.sqrt(2);
    function Arc(options) {
        this.options = $.extend({}, this.defaults, options);

        this.$el = $('<div class="zd-radial-item-filter"></div>');
        this.$donut = $('<div class="zd-radial-item-donut"></div>').appendTo(this.$el);
        this.$filler = $('<div class="zd-radial-item-filler"></div>').appendTo(this.$el);
        this.$center = $('<div class="zd-radial-item-center"></div>').appendTo(this.$donut);

        this.positionElements();
    }

    Arc.prototype = {

        defaults: {
            start: -30,
            angle: 120,
            gap: 8,
            radius: 200,
            width: 60,
            color: 'rgba(0, 0, 0, 0.7)'
        },

        maxAngle: 160,

        positionElements: function () {
            var instance = this,
                gap = this.options.gap,
                radius = this.options.radius,
                angle = Math.max(this.options.angle, 1),
                startAngle = 90 - (this.options.start),
                endAngle = 90 - angle,
                maskSize = radius * (1 + (endAngle < 0 ? Math.sin(-endAngle/180*Math.PI) : 0)),
                donutRadius = this.options.radius,
                donutWidth = this.options.width,
                centerWidth = parseInt(this.$center.width()) || 20,
                centerHeight = parseInt(this.$center.height()) || 20,
                fillerRadius = donutRadius - donutWidth;

            var iPad = /(iPhone|iPod|iPad)/i.test(navigator.userAgent);
            var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

            instance.$el.css({
                width: maskSize,
                height: maskSize,
                borderWidth: gap/2 + 'px',
                transform: iPad || isSafari
                                ? startAngle === 1
                                    ? 'rotate('+startAngle+'deg)'
                                    : 'rotate('+startAngle+'deg) '+'skew(0deg, '+endAngle+'deg)'
                                : 'rotate('+startAngle+'deg) '+'skew(0deg, '+endAngle+'deg)',
                transformOrigin: '100% 100%'
            });

            instance.$donut.css({
                left: maskSize - donutRadius,
                top: maskSize - donutRadius,
                width: 2*donutRadius,
                height: 2*donutRadius,
                borderWidth: donutWidth,
                transform: iPad || isSafari
                                ? startAngle === 1
                                    ? 'rotate('+ -(angle - 90)/2 +'deg)'
                                    : 'skew(0deg, ' + (-endAngle) + 'deg) rotate('+ -(angle - 90)/2 +'deg)'
                                : 'skew(0deg, ' + (-endAngle) + 'deg) rotate('+ -(angle - 90)/2 +'deg)'                
            });

            if (iPad || isSafari) {
                instance.$el.css({
                    'transition': '0.1s ease-in',
                    '-ms-transition': '0.1s ease-in',
                    '-moz-transition': '0.1s ease-in',
                    '-webkit-transition': '0.1s ease-in'
                });

                instance.$donut.css({
                    'transition': '0.1s ease-in',
                    '-ms-transition': '0.1s ease-in',
                    '-moz-transition': '0.1s ease-in',
                    '-webkit-transition': '0.1s ease-in'
                });
            }

            instance.$filler.css({
                left: maskSize - fillerRadius,
                top: maskSize - fillerRadius,
                width: 2*fillerRadius,
                height: 2*fillerRadius,
                transform: 'skew(0deg, ' + (-endAngle) + 'deg)'
            });

            instance.$center.css({
                left: - (fillerRadius*(sqrt2/2 - 1) + donutWidth*(sqrt2/4) + centerWidth/2),
                top: - (fillerRadius*(sqrt2/2 - 1) + donutWidth*(sqrt2/4) + centerHeight/2),
//                left: donutRadius - donutWidth - centerWidth/2
//                    - Math.sqrt(donutRadius*donutRadius + (donutRadius - donutWidth)*(donutRadius - donutWidth))/2,
//                top: donutRadius - donutWidth - centerHeight/2
//                    - Math.sqrt(donutRadius*donutRadius + (donutRadius - donutWidth)*(donutRadius - donutWidth))/2,
                transform: 'rotate('+ ((angle - 90)/2 - startAngle) +'deg)'
            });
        },

        get: function () {
            var values = [];

            if (arguments.length == 0) {
                values = this.options
            } else if (arguments.length == 1) {
                values = this.options[arguments[0]] || null
            } else {
                for (var i = 0; i < arguments.length; i++) {
                    values[arguments[i]] = this.options[arguments[i]] || null;
                }
            }

            return values;
        },

        set: function (options) {
            typeof options.start == 'number' && (this.options.start = options.start);
            typeof options.angle == 'number' && (this.options.angle = Math.min(options.angle, this.maxAngle));
            typeof options.gap == 'number' && (this.options.gap = options.gap);
            typeof options.radius == 'number' && (this.options.radius = options.radius);
            typeof options.width == 'number' && (this.options.width = options.width);
            typeof options.color == 'number' && (this.options.color = options.color);

            this.positionElements();
        },

        close: function () {
            var options = this.options;

            this.set({
                start: options.start + options.angle/2,
                angle: 0
            });
        },

        remove: function () {
            this.$el.remove();
        }
    };

    Utilities.Arc = Arc;
    Utilities.getURLParameter = getURLParameter;
    Utilities.getHashParameter = getHashParameter;
    Utilities.parseUrlParams = parseUrlParams;
    Utilities.getVisualizationDetails = getVisualizationDetails;
    Utilities.getSourceDetails = getSourceDetails;
    Utilities.pad = pad;
    Utilities.hoursToAMPM = hoursToAMPM;
    Utilities.formattedTimeOnly = formattedTimeOnly;
    Utilities.formattedDateOnly = formattedDateOnly;
    Utilities.formattedDate = formattedDate;
    Utilities.timeZoneFromTime = timeZoneFromTime;
    Utilities.determineTimeZone = determineTimeZone;
    Utilities.formattedDateMonth = formattedDateMonth;
    Utilities.getPageUserData = getPageUserData;
    Utilities.getFunctionsForMetric = getFunctionsForMetric;
    Utilities.hasLastValue = hasLastValue;
    Utilities.isNumericAttributeType = isNumericAttributeType;

    Utilities.time = {};

    Utilities.time.getPreviousHour = function (ms) {
        return ms - Utilities.time.millisecondsIn.hour;
    };
    Utilities.time.getMaxStepLimit = function () {
        return 62;
    },
    Utilities.time.getLowerStep = function (step, utc) {
        var lowerStep = '',
            ascendicSteps = [
                'MINUTE',
                'HOUR',
                'DAY',
                'WEEK',
                'MONTH',
                'YEAR'
            ],
            stepIndex = ascendicSteps.indexOf(step),
            newIndex = stepIndex - 1;
            if(newIndex < 0){
                lowerStep = 'MINUTE';
            }else{
                lowerStep = ascendicSteps[newIndex];
            }
        return lowerStep;
    };
    Utilities.time.getMaxStep = function (step1, step2, utc) {
        var maxStep = null,
            ascendicSteps = [
                'MINUTE',
                'HOUR',
                'DAY',
                'WEEK',
                'MONTH',
                'YEAR'
            ],
            index1 = ascendicSteps.indexOf(step1),
            index2 = ascendicSteps.indexOf(step2);
        if(index1 === -1){
            throw 'Step 1 is wrong';
        }
        if(index2 === -1){
            throw 'Step 2 is wrong';
        }
        if(index1 > index2){
            maxStep = step1;
        }else{
            maxStep = step2;
        }
        return maxStep;
    };
    /* Returns number of days in the month of the year.
     * 
     * @param {Date|number} date Date object or timestamp.
     * @returns {number} number of days.
     */
    Utilities.time.getDaysInMonth = function (date, utc) {
        var daysInMonth = new Date(date);
        if(utc){
            daysInMonth.setUTCDate(15);
            daysInMonth.setUTCMonth(daysInMonth.getUTCMonth() + 1);
            daysInMonth.setUTCDate(0);
            return daysInMonth.getUTCDate();
        }else{
            daysInMonth.setDate(15);
            daysInMonth.setMonth(daysInMonth.getMonth() + 1);
            daysInMonth.setDate(0);
            return daysInMonth.getDate();
        }
    };
    
    Utilities.time.formatAMPM = function(date, utc) {
        var hours, minutes;
        if(utc){
            hours = date.getUTCHours();
            minutes = date.getUTCMinutes();
        }else{
            hours = date.getHours();
            minutes = date.getMinutes();
        }
        var ampm = hours >= 12 ? 'pm' : 'am';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    };
    
    Utilities.time.formatAMPMForHours = function(date, utc) {
        var hours;
        if(utc){
            hours = date.getUTCHours();
        }else{
            hours = date.getHours();
        }
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        var strTime = hours + ' ' + ampm;
        return strTime;
    };
    
    /* For a given date, get the ISO week number
     *
     * Based on information at:
     *
     *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
     *
     * Algorithm is to find nearest thursday, it's year
     * is the year of the week number. Then get weeks
     * between that date and the first day of that year.
     *
     * Note that dates in one year can be weeks of previous
     * or next year, overlap is up to 3 days.
     *
     * e.g. 2014/12/29 is Monday in week  1 of 2015
     *      2012/1/1   is Sunday in week 52 of 2011
     */
    /*
     * @param {Date|number} d Date object or timestamp.
     * @return {number}
     */
    Utilities.time.getWeekNumber = function (d, utc) {
        d = new Date(d);
        if(utc){
            d.setUTCHours(0,0,0);
            // Set to nearest Thursday: current date + 4 - current day number
            // Make Sunday's day number 7
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
            // Get first day of year
            var yearStart = new Date(d.getUTCFullYear(),0,1);
            // Calculate full weeks to nearest Thursday
            var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
            // Return array of year and week number
            return [d.getUTCFullYear(), weekNo];
        }else{
            d.setHours(0,0,0);
            // Set to nearest Thursday: current date + 4 - current day number
            // Make Sunday's day number 7
            d.setDate(d.getDate() + 4 - (d.getDay()||7));
            // Get first day of year
            var yearStart = new Date(d.getFullYear(),0,1);
            // Calculate full weeks to nearest Thursday
            var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
            // Return array of year and week number
            return [d.getFullYear(), weekNo];
        }
    };
    
    Utilities.time.getRangeForStep = function(start, end, step, utc){
        var min = new Date(start),
            max = new Date(end),
            corrected = false;
        
        if(max.getTime()%10000 === 9999 && step === 'DAY' && utc){
            max.setTime(max.getTime() + 1);
            corrected = true;
        }

        if((end.getTime() - start.getTime() + 1) < Zoomdata.Utilities.time.millisecondsIn[step.toLowerCase()]){
            switch(step){
                case 'MINUTE':
                    break;
                case 'HOUR':
                    // UTC
                    zeroMinutes(min, utc);
                    zeroMinutes(max, utc);
                    if(utc){
                        max.setUTCHours(max.getUTCHours()+1);
                    }else{
                        max.setHours(max.getHours()+1);
                    }
                    break;
                case 'DAY':
                    zeroMinutes(min, utc);
                    zeroMinutes(max, utc);

                    if(utc){
                        min.setUTCHours(0);
                        max.setUTCHours(0);
                        max.setUTCDate(max.getUTCDate() + 1);
                    }else{
                        min.setHours(0);
                        max.setHours(0);
                        max.setDate(max.getDate()+1);
                    }
//                    max.setTime(max.getTime() - 1);
                    break;
                case 'WEEK':
                    zeroMinutes(min, utc);
                    zeroMinutes(max, utc);
                    zeroWeek(min, utc);
                    zeroWeek(max, utc);

                    if(utc){
                        min.setUTCHours(0);
                        max.setUTCHours(0);
                        max.setUTCDate(max.getUTCDate() + 7);
                    }else{
                        min.setHours(0);
                        max.setHours(0);
                        max.setDate(max.getDate() + 7);
                    }
                    break;
                case 'MONTH':
                    zeroMinutes(min, utc);
                    zeroMinutes(max, utc);
                    if(utc){
                        min.setUTCHours(0);
                        min.setUTCDate(1);
                        max.setUTCHours(0);
                        max.setUTCDate(1);
                        max.setUTCMonth(max.getUTCMonth()+1);
                    }else{
                        min.setHours(0);
                        min.setDate(1);
                        max.setHours(0);
                        max.setDate(1);
                        max.setMonth(max.getMonth()+1);
                    }
                    break;
                case 'YEAR':
                    zeroMinutes(min, utc);
                    zeroMinutes(max, utc);
                    if(utc){
                        min.setUTCHours(0);
                        min.setUTCDate(0);
                        min.setUTCMonth(0);
                        max.setUTCHours(0);
                        max.setUTCDate(0);
                        max.setUTCMonth(0);
                        max.setUTCFullYear(max.getUTCFullYear()+1);
                    }else{
                        min.setHours(0);
                        min.setDate(0);
                        min.setMonth(0);
                        max.setHours(0);
                        max.setDate(0);
                        max.setMonth(0);
                        max.setFullYear(max.getFullYear()+1);
                    }
                    break;
            }
            return {
                min: min,
                max: max
            };
        }
        
        switch(step){
            case 'MINUTE':
                break;
            case 'HOUR':
                // UTC
                zeroMinutes(min, utc);
                zeroMinutes(max, utc);
                if(utc){
                    max.setUTCHours(max.getUTCHours());
                }else{
                    max.setHours(max.getHours());
                }
                break;
            case 'DAY':
                zeroMinutes(min, utc);
                zeroMinutes(max, utc);
                
                if(utc){
                    var correction = max.getHours(0) > 0 ? 1 : 0;
                    min.setUTCHours(0);
                    max.setUTCHours(0);
                    max.setUTCDate(max.getUTCDate() + correction);
                }else{
                    var correction = max.getHours(0) > 0 ? 1 : 0;
                    min.setHours(0);
                    max.setHours(0);
                    max.setDate(max.getDate() + correction);
                }
//                max.setTime(max.getTime() - 1);
                break;
            case 'WEEK':
                zeroMinutes(min, utc);
                zeroMinutes(max, utc);
                zeroWeek(min, utc);
                zeroWeek(max, utc);
                
                if(utc){
                    min.setUTCHours(0);
                    max.setUTCHours(0);
                    max.setUTCDate(max.getUTCDate() + 7);
                }else{
                    min.setHours(0);
                    max.setHours(0);
                    max.setDate(max.getDate() + 7);
                }
                break;
            case 'MONTH':
                zeroMinutes(min, utc);
                zeroMinutes(max, utc);
                if(utc){
                    min.setUTCHours(0);
                    min.setUTCDate(1);
                    max.setUTCHours(0);
                    max.setUTCDate(1);
                    max.setUTCMonth(max.getUTCMonth() + 1);
                }else{
                    min.setHours(0);
                    min.setDate(1);
                    max.setHours(0);
                    max.setDate(1);
                    max.setMonth(max.getMonth() + 1);
                }
                break;
            case 'YEAR':
                zeroMinutes(min, utc);
                zeroMinutes(max, utc);
                if(utc){
                    min.setUTCHours(0);
                    min.setUTCDate(0);
                    min.setUTCMonth(0);
                    max.setUTCHours(0);
                    max.setUTCDate(0);
                    max.setUTCMonth(0);
                    if (min.getUTCFullYear() === max.getUTCFullYear()) {
                        max.setUTCFullYear(max.getUTCFullYear() + 1);
                    }
                }else{
                    min.setHours(0);
                    min.setDate(0);
                    min.setMonth(0);
                    max.setHours(0);
                    max.setDate(0);
                    max.setMonth(0);
                    if (min.getFullYear() === max.getFullYear()) {
                        max.setFullYear(max.getFullYear() + 1);
                    }
                }
                break;
        }
        return {
            min: min,
            max: max
        };
        function zeroMinutes(date, utc){
            if(utc){
                date.setUTCMilliseconds(0);
                date.setUTCSeconds(0);
                date.setUTCMinutes(0);
            }else{
                date.setMilliseconds(0);
                date.setSeconds(0);
                date.setMinutes(0);
            }
            return date;
        }
        function zeroWeek(date, utc){
            if(utc){
                date.setDate(date.getUTCDate() - date.getUTCDay());
            }else{
                date.setDate(date.getDate() - date.getDay());
            }
            return date;
        }
    };
    Utilities.time.recalculateLimit = function(oldStep, limit, newStep){
        var newLimit = 1,
            newLimitInMinutes = 1,
            maxLimit = Utilities.time.getMaxStepLimit();

        switch(oldStep){
            case 'MINUTE':
                newLimitInMinutes = limit;
                break;
            case 'HOUR':
                newLimitInMinutes = limit*60;
                break;
            case 'DAY':
                newLimitInMinutes = limit*60*24;
                break;
            case 'WEEK':
                newLimitInMinutes = limit*60*24*7;
                break;
            case 'MONTH':
                newLimitInMinutes = limit*60*24*31;
                break;
            case 'YEAR':
                newLimitInMinutes = limit*60*24*365;
                break;
        }

        newLimit = newLimitInMinutes;

        switch(newStep){
            case 'MINUTE':
                newLimit = newLimitInMinutes;
                break;
            case 'HOUR':
                if (oldStep !== 'MINUTE') {
                    newLimit = newLimitInMinutes/60;
                }
                break;
            case 'DAY':
                if (oldStep !== 'HOUR') {
                    newLimit = newLimitInMinutes/60/24;
                }
                break;
            case 'WEEK':
                if (oldStep !== 'DAY') {
                    newLimit = newLimitInMinutes/60/24/7;
                }
                break;
            case 'MONTH':
                if (oldStep !== 'WEEK') {
                    newLimit = newLimitInMinutes/60/24/31;
                }
                break;
            case 'YEAR':
                if (oldStep !== 'MONTH') {
                    newLimit = newLimitInMinutes/60/24/365;
                }
                break;
        }

        newLimit = Math.ceil(newLimit);

        return newLimit > maxLimit ? maxLimit : newLimit;
    };

    /* Returns the range of time.
     * 
     * @param {Date} minDate 
     * @param {Date} maxDate
     * 
     * @return {Object} Step and amount of steps (limit) 
     */
    Utilities.time.getRoundedDateRange = function (minDate, maxDate, step, withInclude, utc) {
        var timeTrendStep = 'MINUTE',
            timeInterval = 0,
            limit = 60;
        if(maxDate.getTime()%10000 === 9999 && step === 'DAY'){
            maxDate.setTime(maxDate.getTime() + 1);
        }
        
        if(utc){
            var correction = (step === 'DAY' && minDate.getUTCHours() > 0) ? 1 : 0;
        }else{
            var correction = (step === 'DAY' && minDate.getHours() > 0) ? 1 : 0;
        }

        var _min = new Date(minDate.getTime());
        var _max = new Date(maxDate.getTime());
        if(step === 'DAY'){
            if(utc){
                _min.setUTCHours(0);
                _max.setUTCHours(23);
            }else{
                _min.setHours(0);
                _max.setHours(23);
            }
        }

        var interval = _max.getTime() - _min.getTime() + correction;
        if(interval <= Zoomdata.Utilities.time.millisecondsIn.hour && !step){
            timeTrendStep = 'MINUTE';
            // UTC
            if(utc){
                timeInterval = maxDate.getUTCMinutes() - minDate.getUTCMinutes();
            }else{
                timeInterval = maxDate.getMinutes() - minDate.getMinutes();
            }
            
            limit = timeInterval <= 0 ? timeInterval + 61 : timeInterval + 1;
        }else if(interval <= Zoomdata.Utilities.time.millisecondsIn.day && !step){
            timeTrendStep = 'HOUR';
            if(utc){
                timeInterval = maxDate.getUTCHours() - minDate.getUTCHours();
            }else{
                timeInterval = maxDate.getHours() - minDate.getHours();
            }
            
            limit = timeInterval <= 0 ? timeInterval + 25 : timeInterval + 1;
        }else if(interval <= Zoomdata.Utilities.time.millisecondsIn.day * 29 && !step){
            timeTrendStep = 'DAY';
            if(utc){
                timeInterval = maxDate.getUTCDate() - minDate.getUTCDate() + (maxDate.getUTCMonth() - minDate.getUTCMonth()) * Zoomdata.Utilities.time.getDaysInMonth(minDate, utc);
                limit = timeInterval <= 0 ? timeInterval + Zoomdata.Utilities.time.getDaysInMonth(minDate, utc) : timeInterval + 1;
            }else{
                timeInterval = maxDate.getDate() - minDate.getDate() + (maxDate.getMonth() - minDate.getMonth()) * Zoomdata.Utilities.time.getDaysInMonth(minDate);
                limit = timeInterval <= 0 ? timeInterval + Zoomdata.Utilities.time.getDaysInMonth(minDate) : timeInterval + 1;
            }
        }else if(interval <= Zoomdata.Utilities.time.millisecondsIn.day * 60 && !step){
            timeTrendStep = 'WEEK';
            if(utc){
                timeInterval = Zoomdata.Utilities.time.getWeekNumber(maxDate, utc)[1] - Zoomdata.Utilities.time.getWeekNumber(minDate, utc)[1];
                var lastDayOfMinYear = new Date(minDate.getUTCFullYear(), 11, 31);
                limit = timeInterval <= 0 ? timeInterval + Zoomdata.Utilities.time.getWeekNumber(lastDayOfMinYear, utc)[1] : timeInterval + 1;
            }else{
                timeInterval = Zoomdata.Utilities.time.getWeekNumber(maxDate)[1] - Zoomdata.Utilities.time.getWeekNumber(minDate)[1];
                var lastDayOfMinYear = new Date(minDate.getFullYear(), 11, 31);
                limit = timeInterval <= 0 ? timeInterval + Zoomdata.Utilities.time.getWeekNumber(lastDayOfMinYear)[1] : timeInterval + 1;
            }
        }else if(interval <= Zoomdata.Utilities.time.millisecondsIn.day * 365 && !step){
            timeTrendStep = 'MONTH';
            if(utc){
                timeInterval = maxDate.getUTCMonth() - minDate.getUTCMonth();
            }else{
                timeInterval = maxDate.getMonth() - minDate.getMonth();
            }
            limit = timeInterval <= 0 ? timeInterval + 13 : timeInterval + 1;
        }else if(interval > Zoomdata.Utilities.time.millisecondsIn.day * 365 && !step){
            timeTrendStep = 'YEAR';
            if(utc){
                timeInterval = maxDate.getUTCFullYear() - minDate.getUTCFullYear();
            }else{
                timeInterval = maxDate.getFullYear() - minDate.getFullYear();
            }
            limit = timeInterval + 1;
        }
        limit = limit - 1;
        if(step){
            switch(step){
                case 'MINUTE':
                    limit = interval/1000/60;
                    break;
                case 'HOUR':
                    limit = interval/1000/60/60;
                    break;
                case 'DAY':
                    limit = interval/1000/60/60/24;
                    break;
                case 'WEEK':
                    limit = interval/1000/60/60/24/7;
                    break;
                case 'MONTH':
                    if(utc){
                        limit = (maxDate.getUTCFullYear() * 12 + maxDate.getUTCMonth())
                              - (minDate.getUTCFullYear() * 12 + minDate.getUTCMonth());
                    }else{
                        limit = (maxDate.getFullYear() * 12 + maxDate.getMonth())
                              - (minDate.getFullYear() * 12 + minDate.getMonth());
                    }
//                    limit = interval/1000/60/60/24/30;
                    break;
                case 'YEAR':
                    limit = interval/1000/60/60/24/365;
                    break;
            }
            timeTrendStep = step;
            limit = step === 'MONTH' ? limit : Math.ceil(limit) + (withInclude ? 1 : 0);
        }
        limit = limit <= 0 ? 1 : limit;
        return {
            step: timeTrendStep,
            amount: limit
        };
    };
    Utilities.time.days = [
        {acr: 'Sun', full: 'Sunday'},
        {acr: 'Mon', full: 'Monday'},
        {acr: 'Tue', full: 'Tuesday'},
        {acr: 'Wed', full: 'Wednesday'},
        {acr: 'Thu', full: 'Thursday'},
        {acr: 'Fri', full: 'Friday'},
        {acr: 'Sat', full: 'Saturday'}
    ];

    Utilities.time.months = [
        {acr: 'Jan', full: 'January', days: 31},
        {acr: 'Feb', full: 'February', days: 28},
        {acr: 'Mar', full: 'March', days: 31},
        {acr: 'Apr', full: 'April', days: 30},
        {acr: 'May', full: 'May', days: 31},
        {acr: 'Jun', full: 'June', days: 30},
        {acr: 'Jul', full: 'July', days: 31},
        {acr: 'Aug', full: 'August', days: 31},
        {acr: 'Sep', full: 'September', days: 30},
        {acr: 'Oct', full: 'October', days: 31},
        {acr: 'Nov', full: 'November', days: 30},
        {acr: 'Dec', full: 'December', days: 31}
    ];

    Utilities.time.millisecondsIn = {};

    Utilities.time.millisecondsIn.sec = 1000;
    Utilities.time.millisecondsIn.min = Utilities.time.millisecondsIn.sec*60;
    Utilities.time.millisecondsIn.hour = Utilities.time.millisecondsIn.min*60;
    Utilities.time.millisecondsIn.day = Utilities.time.millisecondsIn.hour*24;
    Utilities.time.millisecondsIn.week = Utilities.time.millisecondsIn.day*7;
    Utilities.time.millisecondsIn.month = Utilities.time.millisecondsIn.day*31;

    Utilities.time.getEndTimeWithinStep = function(milliseconds, timeTrendStep, utc){
        var newDate = new Date(milliseconds);
        switch(timeTrendStep){
            case 'MINUTE':
                if(utc){
                    newDate.setUTCMilliseconds(0);
                    newDate.setUTCSeconds(0);
                    newDate.setUTCMinutes(newDate.getUTCMinutes()+1);
                }else{
                    newDate.setMilliseconds(0);
                    newDate.setSeconds(0);
                    newDate.setMinutes(newDate.getMinutes()+1);
                }
                break;
            case 'HOUR':
                if(utc){
                    newDate.setUTCMilliseconds(0);
                    newDate.setUTCSeconds(0);
                    newDate.setUTCMinutes(0);
                    newDate.setUTCHours(newDate.getUTCHours() + 1);
                }else{
                    newDate.setMilliseconds(0);
                    newDate.setSeconds(0);
                    newDate.setMinutes(0);
                    newDate.setHours(newDate.getHours() + 1);
                }
                break;
            case 'DAY':
                if(utc){
                    newDate.setUTCMilliseconds(0);
                    newDate.setUTCSeconds(0);
                    newDate.setUTCMinutes(0);
                    newDate.setUTCHours(0);
                    newDate.setUTCDate(newDate.getUTCDate() + 1);
                }else{
                    newDate.setMilliseconds(0);
                    newDate.setSeconds(0);
                    newDate.setMinutes(0);
                    newDate.setHours(0);
                    newDate.setDate(newDate.getDate() + 1);
                }
                break;
            case 'WEEK':
                if(utc){
                    newDate.setUTCMilliseconds(0);
                    newDate.setUTCSeconds(0);
                    newDate.setUTCMinutes(0);
                    newDate.setUTCHours(0);
                    newDate.setUTCDate(newDate.getUTCDate() + 7);
                }else{
                    newDate.setMilliseconds(0);
                    newDate.setSeconds(0);
                    newDate.setMinutes(0);
                    newDate.setHours(0);
                    newDate.setDate(newDate.getDate() + 7);
                }
                break;
            case 'MONTH':
                if(utc){
                    newDate.setUTCMilliseconds(0);
                    newDate.setUTCSeconds(0);
                    newDate.setUTCMinutes(0);
                    newDate.setUTCHours(0);
                    newDate.setUTCDate(1);
                    newDate.setUTCMonth(newDate.getUTCMonth() + 1);
                }else{
                    newDate.setMilliseconds(0);
                    newDate.setSeconds(0);
                    newDate.setMinutes(0);
                    newDate.setHours(0);
                    newDate.setDate(1);
                    newDate.setMonth(newDate.getMonth() + 1);
                }
                break;
            case 'YEAR':
                if(utc){
                    newDate.setUTCMilliseconds(0);
                    newDate.setUTCSeconds(0);
                    newDate.setUTCMinutes(0);
                    newDate.setUTCHours(0);
                    newDate.setUTCDate(1);
                    newDate.setUTCMonth(0);
                    newDate.setUTCFullYear(newDate.getUTCFullYear() + 1);
                }else{
                    newDate.setMilliseconds(0);
                    newDate.setSeconds(0);
                    newDate.setMinutes(0);
                    newDate.setHours(0);
                    newDate.setDate(1);
                    newDate.setMonth(0);
                    newDate.setFullYear(newDate.getFullYear() + 1);
                }
                break;
        }
        return newDate.getTime();
    }

    Utilities.log10 = function (n) {
        return (Math.log(n)) / (Math.log(10));
    };

    Utilities.isRetina = function(){
        return window.devicePixelRatio > 1;
    };

    Utilities.toTitleCase = function(str){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };

    Utilities.MODE = {
        NORMAL: 0,      // Default, web application
        WIDGET: 1,      // Readonly web widget mode, no controls
        //fully interactive we should distinguish between embedded in device vs embedded in iframe, ex. header should not be visible when embedded in iframe
        EMBEDDED: 2,    // Embedded, no main menu
        NATIVE: 3       // Native app
    };

    var mode = -1;

    Utilities.mode = function() {
        if (mode !== -1) {
            return mode;
        }

        mode = Utilities.MODE.NORMAL;
        var target = getURLParameter("__target");

        if (target === "widget") {
            mode = Utilities.MODE.WIDGET;
        }
        else if (target === "embedded") {
            mode = Utilities.MODE.EMBEDDED;
        }
        else {
            var iOS = /(iPhone|iPod|iPad)/i.test(navigator.userAgent);
            var safari = /(Safari)/i.test(navigator.userAgent);

            if (iOS && !safari) {
                mode = Utilities.MODE.NATIVE;
            }
        }

        return mode;
    };

    Utilities.getHiddenControls = function(){
        var hiddenControls = getURLParameter("hidecontrol");
        if(hiddenControls){
            hiddenControls = hiddenControls.split(',');
        }else{
            hiddenControls = [];
        }
        console.log('hiddenControls',hiddenControls);
        return hiddenControls;
    };
    
    Utilities.visualizationStartedUnique = {
        _counter: 0
    };
    Utilities.visualizationStarted = function(controller){
        var delaysMap = {
                'WORD_CLOUD' : 1000,
                'ZOOMABLE_MAP' : 2000,
                'VERTICAL_BARS' : 100,
                'HEAT_MAP' : 1000,
                'MULTI_METRIC_TREND' : 100,
                'SIDE_BY_SIDE_BARS' : 900,
                'STACKED_BARS' : 900,
                'TRENDS' : 100,
                'PIE' : 600,
                'PIVOT_TABLE' : 1000,
                'DEFAULT' : 100
            },
            delay = delaysMap.DEFAULT,
            allVisLength = Zoomdata.main ? Zoomdata.main.currentSection.widgetGrid.collection.length : null;
        if(controller){
            if(Utilities.visualizationStartedUnique[controller.UUID]){
                return false;
            }else{
                Utilities.visualizationStartedUnique[controller.UUID] = true;
            }
            
            delay = (controller.customReadyStatusDelay
                ? controller.customReadyStatusDelay
                : delaysMap[controller.config.type] || delaysMap.DEFAULT);
            delay += 1002; // To be sure that load indicator animation stopped
        }
        
        //initiates function to prevent horizontal swipe on visualizations
        Zoomdata.Utilities.preventSwipeForBack();

        var message = 'screenshot_status_ready',
            media = $('body');
        setTimeout(function(){
            Utilities.visualizationStartedUnique._counter++;

            if(allVisLength === Utilities.visualizationStartedUnique._counter){
                media.addClass(message);
                console.log(controller.UUID + ' started with delay ' + delay + 'ms.');
            }
        },delay);
        return true;
    };
    
    Utilities.isSingleVizualization = function(){
        return Zoomdata.main.currentSection.widgetGrid.childViews.length < 2;
    };
    
    Utilities.isSmallWidget = function(width, height){
        var minWidth = 500,
            minHeight = 380;
        return width <= minWidth || height <= minHeight;
    };
    Utilities.getWidgetSizeClass = function(width, height){
        var smallWidth = 500,
            smallHeight = 380,
            mediumWidth = 1000,
            mediumHeight = 700,
            sizes = ['small','medium','large'],
            size = sizes[1];
        if(width > mediumWidth || height > mediumHeight){
            size = sizes[2];
        }
        if((width <= mediumWidth || height <= mediumHeight)
         &&(width >= smallWidth  || height >= smallHeight)){
            size = sizes[1];
        }
        if(width < smallWidth || height < smallHeight){
            size = sizes[0];
        }
        return size;
    };

    Utilities.generateUUID = function() {
        return 'xxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

    if (typeof Hammer !== 'undefined') {
//        Hammer.plugins.showTouches();
        Hammer.plugins.fakeMultitouch();
        $(function () {
            $('body').hammer();
        });
    }

    Utilities.getVersion = function(){
        var dfd = $.Deferred();

        $.ajax({
            url: 'service/version/',
            success: function(data){
                dfd.resolve(data);
            },
            fail: function(){
                dfd.reject();   
            }
        });

        return dfd.promise();
    };

    Utilities.detectTouchDevice = function(){
        return (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    };

    Utilities.sourceExists = function(sources, sourceName, sourceId) {
        var sourceExists = false;
        admin.sources.each(function (source) {
            if (sourceName.toLowerCase() === source.get("name").toLowerCase() && source.get("id") !== sourceId) {
                sourceExists = true;
            }
        });
        return sourceExists;
    };

    Utilities.isIOS = function() {
        return /(iPhone|iPod|iPad)/i.test(navigator.userAgent);
    };

    Utilities.rTrim = function(str){
        return str.replace(/\s+$/, '');
    };

    Utilities.lTrim = function(str){
        return str.replace(/^\s+/, "");
    };
    
    Utilities.appendStylesWithScoping = function(styles, container){
        // Such "manual" implementation due to IE specific
        styles && styles.each(function(i, sel){
            var visStyleSheet = document.createElement('STYLE'),
                scoped = false;

            $(sel.attributes).each(function(i, att){
                var name  =  att.name  || att.nodeName;
                var value = (att.value || att.value === '')
                    ? att.value 
                    : att.nodeValue;
                scoped = scoped || name === 'scoped';
                visStyleSheet.setAttribute(name, value);
            });

            visStyleSheet.innerHTML = sel.innerText || sel.textContent || $(sel).text();
            container.appendChild(visStyleSheet);
            scoped && $(visStyleSheet).scopedPolyFill();
        });
    };
    
    Utilities.scopedPolyFill = ( function ( doc, undefined ) {
        var compat = (function ()
        {
            var check           = doc.createElement( 'style' ),
                DOMStyle        = 'undefined' !== typeof check.sheet ? 'sheet' : 'undefined' !== typeof check.getSheet ? 'getSheet' : 'styleSheet',
                scopeSupported  = 'undefined' !== typeof check.scoped,
                testSheet,
                DOMRules,
                testStyle;

            doc.body.appendChild( check );
            testSheet           = check[ DOMStyle ];
            testSheet.addRule ? testSheet.addRule( 'c', 'blink' ) : testSheet.insertRule( 'c{}', 0 );
            DOMRules            = testSheet.rules ? 'rules' : 'cssRules';
            testStyle           = testSheet[ DOMRules ][ 0 ];
            try{
                testStyle.selectorText = 'd';
            }catch( e ){}
            var changeSelectorTextAllowed = 'd' === testStyle.selectorText.toLowerCase();
            check.parentNode.removeChild( check );
            return {
                scopeSupported: scopeSupported,
                rules: DOMRules,
                sheet: DOMStyle,
                changeSelectorTextAllowed: changeSelectorTextAllowed
            };
        } ) ();

        var scopedSheets,
            i,
            idCounter = 0;

        if ( doc.querySelectorAll ) {
            scopedSheets = doc.querySelectorAll( 'style[scoped]' );
        } else {
            var tempSheets = [], scopedAttr;
            scopedSheets = doc.getElementsByTagName( 'style' );
            i = scopedSheets.length;
            while ( i-- ) {
                scopedAttr = scopedSheets[ i ].getAttribute( 'scoped' );
                if ( "scoped" === scopedAttr || "" === scopedAttr )
                    tempSheets.push( scopedSheets[ i ] );
            }
            scopedSheets = tempSheets;
        }
        i = scopedSheets.length;
        while ( i-- )
            scopeIt( scopedSheets[ i ] );

        function scopeIt( styleNode, jQueryItem ) {
            if ( jQueryItem )
                styleNode = jQueryItem;
            if ( !styleNode.nodeName ) {
                if ( !styleNode.jquery )
                    return;
                else
                    return styleNode.each( scopeIt );
            }
            if ( 'STYLE' !== styleNode.nodeName )
                return;
            if (compat.scopeSupported) return;
            var sheet       = styleNode[ compat.sheet ],
                allRules    = sheet[     compat.rules ],
                par         = styleNode.parentNode,
                id          = par.id || ( par.id = 'scopedByScopedPolyfill_' + ++idCounter ),
                glue        = '',
                index       = allRules.length || 0,
                rule,
                selector,
                styleRule;
            while ( par ) {
                if ( par.id )
                    glue = '#' + par.id + ' ' + glue;
                par = par.parentNode;
            }
            while ( index-- ) {
                rule = allRules[ index ];
                selector = glue + ' ' + rule.selectorText.split( ',' ).join( ', ' + glue );
                selector = selector.replace( /[\ ]+:root/gi, '' );
                if ( compat.changeSelectorTextAllowed ) {
                    rule.selectorText = selector;
                } else {
                    /*
                     * IE only adds the normal rules to the array (no @imports, @page etc)
                     * and also does not have a type attribute so we check if that exists and execute the old IE part if it doesn't
                     * all other browsers have the type attribute to show the type
                     *  1 : normal style rules  <---- use these ones
                     *  2 : @charset
                     *  3 : @import
                     *  4 : @media
                     *  5 : @font-face
                     *  6 : @page rules
                     *
                     */
                    if ( !rule.type || 1 === rule.type ) {
                        styleRule = rule.style.cssText;
                        sheet.removeRule    ? sheet.removeRule( index )             : sheet.deleteRule( index );
                        sheet.addRule && styleRule.length>0    ? sheet.addRule( selector, styleRule )  : sheet.insertRule( selector + '{' + styleRule + '}', index );
                    }
                }
            }
        }

        if (typeof jQuery === "function" && typeof jQuery.fn === "object") {
            jQuery.fn.scopedPolyFill = function(){
                return this.each(scopeIt);
            };
        }
        
        return scopeIt;
    } ) ( document );

    Zoomdata.Utilities = Utilities;
} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata){

    "use strict";

    Zoomdata.Models = Zoomdata.Models || {};

    Zoomdata.Models.Visualization = Zoomdata.MVC.Model.extend({
        urlRoot: 'service/visualizations',
        initialize: function () {
            Zoomdata.MVC.Model.prototype.initialize.apply(this, arguments);
            this.on('change sync', this.setIconUrl);
            this.setIconUrl();
        },
        setIconUrl: function () {
            var thumbnailId = this.get('thumbnailId'),
                type = this.get('type'),
                url = '';

            if (thumbnailId) {
                url = this.urlRoot + '/' + this.get('visId') + '/thumbnail/' + thumbnailId + '.svg?v=${timestamp}';
            } else {
                switch (type){
                    case 'VERTICAL_BARS': url = 'images/Template_Bars_Button_sm.png?v=${timestamp}';
                        break;
                    case 'BUBBLES': url = 'images/Template_Bubbles_Button_sm.png?v=${timestamp}';
                        break;
                    case 'SCATTERPLOT': url = 'images/Template_Scatterplot_Button_sm.png?v=${timestamp}';
                        break;
                    case 'PIE': url = 'images/Template_Pie_Button_sm.png?v=${timestamp}';
                        break;
                    case 'WORD_CLOUD': url = 'images/Template_WordCloud_Button_sm.png?v=${timestamp}';
                        break;
                    case 'MAP': url = 'images/Template_ZoomableMap_Button_sm.png?v=${timestamp}';
                        break;
                    case 'TRENDS': url = 'images/Template_TimeTrend_Button_alt_sm.png?v=${timestamp}';
                        break;
                    case 'ZOOMABLE_MAP' : url = 'images/Template_ZoomableMap_Button_sm.png?v=${timestamp}';
                        break;
                    case 'PIVOT_TABLE' : url = 'images/Template_GridView_Button_sm.png?v=${timestamp}';
                        break;
                    case 'HEAT_MAP': url = "images/Template_HeatMap_Button_sm.png?v=${timestamp}";
                        break;
                    case 'HORIZONTAL_BARS': url = "images/Template_HorizBar_Button_sm.png?v=${timestamp}";
                        break;
                    case 'SIDE_BY_SIDE_BARS': url = "images/Template_MultiBar_Button_sm.png?v=${timestamp}";
                        break;
                    case 'MULTI_METRIC_BARS': url = "images/Template_MultiBar_Button_sm.png?v=${timestamp}";
                        break;
                    case 'VERTICAL_STACKED_BARS': url = "images/Template_MultiGroup_Bar_Button_sm.png?v=${timestamp}";
                        break;
                    case 'VERTICAL_100PCT_STACKED_BARS': url = "images/Template_Vertical_100pct_Stacked_sm.png?v=${timestamp}";
                        break;
                    case 'HORIZONTAL_SIDE_BY_SIDE_BARS': url = "images/Template_SideBySide_Horiz_Button_sm.png?v=${timestamp}";
                        break;
                    case 'MULTI_LINE': url = "images/Template_MultiLine_Button_sm.png?v=${timestamp}";
                        break;
                    case 'MULTI_METRIC_TREND': url = "images/Template_LineAndBar_Button_sm.png?v=${timestamp}";
                        break;
                    case 'FINGERPAINT': url = "images/Template_Fingerpaint_Button_sm.png?v=${timestamp}";
                        break;
                    default: url = 'images/Template_Custom_Button_sm.png?v=${timestamp}';
                }
            }

            this.set('thumbnailUrl', url, {silent: true});
        },
        saveEnabled:function (isEnabled) {
            this.save({ enabled:isEnabled });
        }
    });


}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata){

    "use strict";
    
    var Visualization = Zoomdata.Models.Visualization;

    Zoomdata.Models = Zoomdata.Models || {};

    Zoomdata.Models.SourceVisualization = Visualization.extend({
        idAttribute: 'visId',
        initialize: function (attributes, options) {
            Zoomdata.Models.Visualization.prototype.initialize.apply(this, arguments);

            options = options || {};
            if (options.sourceId) {
                this.setSource(options.sourceId);
                delete options.sourceId;
            } else if (this.attributes.source && this.attributes.source.sourceId) {
                this.setSource(this.attributes.source.sourceId);
            }

            return this;
        },
        setSource: function (id) {
            this.sourceId = id;
            return this;
        },
        getSourceId: function () {
            return this.sourceId || this.collection.sourceId;
        },
        url: function () {
            if (this.getSourceId()) {
                return 'service/sources/'+this.getSourceId()+'/visualizations/'+this.get('visId');
            } else {
                throw new Error('sourceId must be defined');
            }
        }
    });


}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {
    var SourceVisualization = Zoomdata.Models.SourceVisualization;

    "use strict";

    Zoomdata.Models = Zoomdata.Models || {};

    Zoomdata.Models.VisualizationConfig = SourceVisualization.extend({
        idAttribute: 'id',

        // Overriding fetch implementation to only get missing attributes
        // from server model. Specific to bookmarks
        fetch: function () {
            var instance = this,
                attributes = _.clone(this.attributes),
                dfd = $.Deferred();

            Zoomdata.Models.SourceVisualization.prototype.fetch.apply(this, arguments)
                .done(function () {
                    $.extend(true, instance.attributes, attributes);

                    dfd.resolve(arguments);
                })
                .fail(function () {
                    dfd.reject(arguments);
                });

            return dfd.promise();
        }
    });
} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function(root, Zoomdata) {

	"use strict";
    /*jshint laxbreak: true */

    Zoomdata.Models = Zoomdata.Models || {};

    Zoomdata.Models.Filter = Zoomdata.MVC.Model.extend({
		defaults: {
			"path" : null,
			"operation" : "IN",
			"value" : [],
			"editable": false
		},

        idAttribute: 'path',

		initialize: function() {
			_.bindAll(this, "hasAttribute", "addAttribute", "removeAttribute", "hasValue", "isEqualToFilter");
		},

		hasAttribute: function(attribute) {
            if (typeof this.attributes.value === 'number') {
                return this.attributes.value === attribute;
            }
			return this.attributes.value && this.attributes.value.indexOf(attribute.toString()) >= 0;
		},

		hasValue: function() {
			var val = this.attributes.value;
			return null !== val && (typeof val === "number" || val.length > 0);
		},

		addAttribute: function(attribute, options) {
            var values = _.clone(this.get('value')) || [];

            if (values.indexOf(attribute) == -1) {
                values.push(attribute);
                this.set('value', values, options);
            }

            return this;
		},

		removeAttribute: function(attribute, options) {
            var values = _.clone(this.get('value')),
                idx = values && values.indexOf(attribute);

            if (values && idx !== -1) {
                values.splice(idx, 1);

                this.set('value', values, options);
                if (values.length) {
                    return this;
                } else {
                    this.collection && this.collection.remove(this, options);
                    return null;
                }
			}

            return this;
		},

		isEqualToFilter: function(filter) {
			if (!filter) {
				return false;
			}

			var equal = filter.get("operation") === this.get("operation")
				&& filter.get("path") === this.get("path");

			if (equal) {
				var value1 = this.get("value");
				var value2 = filter.get("value");

				equal = value1 === value2
					|| (2 === value1.length && 2 === value2.length && value1[0] === value2[0] && value1[1] === value2[1]);
			}

			return equal;
		},

        toRequest: function () {
            return { path: this.get("path"), value: this.get("value"), operation: this.get("operation") };
        }
    });

}(window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function(root, Zoomdata) {

	"use strict";

    Zoomdata.Models = Zoomdata.Models || {};

    Zoomdata.Models.ObjectField = Zoomdata.MVC.Model.extend({
        initialize: function() {
            Zoomdata.MVC.Model.prototype.initialize.apply(this, arguments);

            this.on('change:name change:type', this._setComposedId);
            this._setComposedId();
        },

        _setComposedId: function () {
            this.id = this._composedId();
        },

        _composedId: function () {
            return this.get('name') + this.get('type');
        },

        updateFacetValues: function (query, restrictions, from, to) {
            var instance = this,
                name = this.get('name'),
                url = 'service/stream/' + this.collection.sourceId + '/facet/' + name + "?from=" + from + "&to=" + to
                    + (query ? '&query=' + query : '') ,
                request = $.ajax({
                    type: 'POST',
                    url: url,
                    data: JSON.stringify(restrictions),
                    contentType: "application/json"
                })
                    .done(function (message) {
                    })
                    .fail(function () {
                        console.warn("Couldn't get values for ObjectField ", instance.get('name'));
                    });

            return request.promise();
        },

        updateValues: function (query) {
            var instance = this,
                name = this.get('name'),
                url = this.collection.url() + name+'/values' + (query ? '?query='+query : '/'),
                request = $.ajax({
                    type: 'GET',
                    url: url,
                    contentType: "application/json"
                })
                    .done(function (message) {
                        instance.values = message;
                    })
                    .fail(function () {
                        console.warn("Couldn't get values for ObjectField ", instance.get('name'));
                    });

            return request.promise();
        }

    });
}(window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {
	
	"use strict";

    Zoomdata.Collections = Zoomdata.Collections || {};

    Zoomdata.Collections.Filters = Zoomdata.MVC.Collection.extend({
        model: Zoomdata.Models.Filter,
        toRequest: function () {
            return this.map(function(filter) {
                return { path: filter.get("path"), value: filter.get("value"), operation: filter.get("operation") };
            });
        }
    });

}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata){

    "use strict";

    var Formula = Zoomdata.MVC.Model.extend({
            idAttribute: 'name'
        });

    Zoomdata.Collections = Zoomdata.Collections || {};

    Zoomdata.Collections.Formulas = Zoomdata.MVC.Collection.extend({
        model: Formula,

        initialize: function (models, options) {

            options = options || {};

            if (options.sourceId) {
                this.sourceId = options.sourceId;
                delete options.sourceId;
            }

            Zoomdata.MVC.Collection.prototype.initialize.apply(this,arguments);
            return this;
        },

        setSource: function (id) {
            this.sourceId = id;
            return this;
        },

        url: function () {
            if (this.sourceId) {
                return 'service/sources/'+this.sourceId+'/formulas/';
            } else {
                throw new Error('sourceId must be defined');
            }
        }
    });

} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata){

    "use strict";

    var ObjectField = Zoomdata.Models.ObjectField,
        Formulas = Zoomdata.Collections.Formulas,
        objectFieldTypes =["ATTRIBUTE", "TEXT", "NUMBER", "MONEY", "INTEGER", "COUNT OF", "FORMULA"];

    Zoomdata.Collections = Zoomdata.Collections || {};

    Zoomdata.Collections.ObjectFields = Zoomdata.MVC.Collection.extend({

        model: ObjectField,

        volumeField: new ObjectField({
            label: 'Volume',
            name: 'count',
            type: 'NUMBER',
            visible: true
        }),

        noneField: new ObjectField({
            label: 'None',
            name: 'none',
            type: 'NONE',
            visible: true
        }),

        defaults: {

        },

        initialize: function (models, options) {
            var formulas;

            options = options || {};

            if (options.sourceId) {
                this.sourceId = options.sourceId;
                delete options.sourceId;
            }

            Zoomdata.MVC.Collection.prototype.initialize.apply(this, arguments);

            formulas = this.where({type: 'FORMULA'});

            this.formulas = new Formulas(formulas, {
                secure: this.secure,
                remote: this.remote,
                apiKey: this.apiKey,
                sourceId: this.sourceId
            });

            this.listenTo(this.formulas, 'add', this._onFormulaAdd);
            this.listenTo(this.formulas, 'remove', this._onFormulaRemove);
            this.listenTo(this.formulas, 'change', this._onFormulaChange);
            this.listenTo(this.formulas, 'reset', this._onFormulasReset);
            this.listenTo(this.formulas, 'sync', this._syncFormulas);
        },

        constructor: function (models, options) {
            Zoomdata.MVC.Collection.prototype.constructor.apply(this, arguments);

            this._ensureVolumeField();
            this._ensureNoneField();
            this.on('all', this._ensureVolumeField);
            this.on('all', this._ensureNoneField);
        },

        _syncFormulas: function () {
            var formulas = this.formulas,
                formulaFields = formulas.map(formulaToObjectField),
                existingFormulas = this.where({type: 'FORMULA'}),
                missingFormulas = _.filter(existingFormulas, function (existingFormula) {
                    var missing = _.find(formulaFields, function (formulaField) {
                        return formulaField.id !== existingFormula.id;
                    });

                    return typeof missing == 'undefined';
                });


            this.set(formulaFields, {remove: false});

            this.remove(missingFormulas);
        },

        _onFormulaAdd: function (formula) {
            var formulaField = formulaToObjectField(formula);

            this.add(formulaField, {merge: true});
        },

        _onFormulaRemove: function (formula) {
            var formulaField = formulaToObjectField(formula);

            this.remove(formulaField, {merge: true});
        },

        _onFormulaChange: function (formula) {
            var formulaField = formulaToObjectField(formula),
                existingFormula = this.get(formulaField.id);

            existingFormula && existingFormula.set(formulaField.toJSON());
        },

        _onFormulasReset: function (formulas) {
            var formulaFields = formulas.map(formulaToObjectField);

            this.add(formulaFields);
        },

        _ensureVolumeField: function (options) {
            var field = this.volumeField,
                exists = this.get(field.id);

            !exists
                ? this.add(field, options)
                : null;
        },

        _ensureNoneField: function (options) {
            var field = this.noneField,
                exists = this.get(field.id);

            !exists
                ? this.add(field, options)
                : null;
        },

        setSource: function (id) {
            this.sourceId = id;
            this.formulas.setSource(id);
            return this;
        },

        url: function () {
            if (this.sourceId) {
                return 'service/sources/'+this.sourceId+'/attributes/';
            } else {
                throw new Error('sourceId must be defined');
            }
        },

        fetch: function (options) {
            options = options || {};
            options.reset = true;
            var instance = this,
                successes = 0,
                dfd = $.Deferred(),
                fetchFormulas = this.formulas.fetch(),
                fetchFields = Zoomdata.MVC.Collection.prototype.fetch.call(this, options);

            fetchFields
                .done(function (objectFields) {
                    addDistinctCounts(objectFields);
                    countSuccesses();
                })
                .fail(dfd.reject);

            fetchFormulas
                .done(countSuccesses)
                .fail(dfd.reject);


            return dfd.promise();

            function countSuccesses() {
                successes++;
                if (successes == 2) {
                    instance._ensureVolumeField();
                    instance._syncFormulas();
                    dfd.resolve(instance.toJSON());
                }
            }

            function addDistinctCounts(objectFields) {
                _.each(objectFields, function (objectField) {
                    if (objectField.distinctCount) {
                        var field = {
                            name: (objectField.name),
                            label: objectField.label,
                            type: "COUNT OF",
                            func: "distinct_count",
                            visible: true
                        };

                        instance.add(field);
                    }
                });
            }
        },

        filterByTypes: function (typesList) {
            this.remove(this.filter(function (objectField) {
                return typesList.indexOf(objectField.get('type')) == -1 && objectField.get('type') != 'COUNT OF';
            }));
            return this;
        },

        removeBlueAttributes: function () {
            this.remove(this.filter(function (objectField) {
                return objectField.get('type') != 'ATTRIBUTE';
            }));
            return this;
        },

        filterHidden: function () {
            this.remove(this.filter(function (objectField) {
                return !objectField.get('visible');
            }));
            return this;
        },

        comparator: function (objectField) {
            return objectFieldTypes.indexOf(objectField.get('type'));
        }
    });

    function formulaToObjectField(formula) {
        var visible = typeof formula.get('visible') == 'boolean'
                ? formula.visible : true;
            return new ObjectField({
                name: formula.get('name'),
                label: formula.get('label'),
                type: 'FORMULA',
                func: 'mvel',
                visible: visible
            });
    }

} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata){

    "use strict";

    var Visualization = Zoomdata.Models.SourceVisualization;

    Zoomdata.Collections = Zoomdata.Collections || {};

    Zoomdata.Collections.SourceVisualizations = Zoomdata.MVC.Collection.extend({
        defaults: {

        },
        initialize: function (models, options) {
            options = options || {};
            if (options.sourceId) {
                this.sourceId = options.sourceId;
                delete options.sourceId;
            }
            Zoomdata.MVC.Collection.prototype.initialize.apply(this, arguments);
            return this;
        },
        setSource: function (id) {
            this.sourceId = id;
            return this;
        },
        model: Visualization,
        url: function () {
            if (this.sourceId) {
                return 'service/sources/'+this.sourceId+'/visualizations';
            } else {
                throw new Error('sourceId must be defined');
            }
        }
    });

} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";

    Zoomdata.Models = Zoomdata.Models || {};
    Zoomdata.Models.GroupBy = Zoomdata.MVC.Model.extend({
        defaults: {
            "name":"",
            "limit": 30,
            "sort":{
                "name":"count",
                "dir":"Descending Value"
            }
        },
        setAttribute: function(name, options){
            this.set({
                'name' : name
            },options);
            return this;
        },
        getAttribute: function(){
            return this.get('name');
        },
        getLabel: function(){
            return this.label;
        },
        setLimit: function(limit, options){
            this.set({
                'limit' : +limit
            },options);
            return this;
        },
        getLimit: function(){
            return +this.get('limit');
        },
        setSort: function(newSort, options){
            var sort = _.clone(this.get('sort'));
            sort.name = newSort.name;
            sort.dir  = newSort.dir;
            this.set({
                'sort' : sort
            },options);
            return this;
        },
        setSortMetric: function(metric, options){
            var sort = _.clone(this.get('sort'));
            sort.name = metric;
            this.set({
                'sort' : sort
            },options);
            return this;
        },
        setSortDirection: function(direction, options){
            var sort = _.clone(this.get('sort'));
            sort.dir = direction;
            this.set({
                'sort' : sort
            },options);
            return this;
        },
        toJSON: function(){
            var json = Zoomdata.MVC.Model.prototype.toJSON.call(this, arguments);
            var sort = json.sort.dir;
            var converted = sort;
            if(sort === 'Ascending Value'){
                converted = 'asc';
            }
            if(sort === 'Descending Value'){
                converted = 'desc';
            }
            json.sort.dir = converted;
            
            json.limit = +json.limit;
            
            return json;
        }
    });
} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {
    "use strict";

    Zoomdata.Collections = Zoomdata.Collections || {};
    Zoomdata.Collections.GroupBy = Zoomdata.MVC.Collection.extend({

        model: Zoomdata.Models.GroupBy,

        initialize: function (models, options) {
            options = options || {};
            Zoomdata.MVC.Collection.prototype.initialize.apply(this, arguments);
            this.options = $.extend({}, this.defaults, options);
            if(this.options.definition){
                this.definition = _.extend({},this.options.definition);
                this.definition.config = this.definition.config
                    ? JSON.parse(this.definition.config)
                    : {};
                delete this.options.definition;
            } else {
                this.definition = {};
            }
            options.silent = false;
            this.on('add', this.initGroupByLabel, this);

            return this;
        },
        getName: function(){
            var groupConfig = this.definition.config,
                groupName = groupConfig && groupConfig.groupNames ? groupConfig.groupNames[0] : this.definition.name;
            return groupName;
        },
        initGroupByLabel: function(model) {
            var groupConfig = this.definition.config,
                groupNames = groupConfig && groupConfig.groupNames ? groupConfig.groupNames.slice(0) : [],
                index = this.models.indexOf(model);

            if (groupNames && typeof groupNames[index] === 'string') {
                model.label = groupNames[index];
            }
        },
        getAttribute: function(){
            var firstGroup = this.at(0),
                attributeName = '';
            if(firstGroup){
                attributeName = firstGroup.getAttribute();
            }
            return attributeName;
        },
        getAttributes: function(){
            return this.pluck('name');
        },
        setAttribute: function(name, options){
            var firstGroup = this.at(0);
            if(firstGroup){
                firstGroup.setAttribute(name, options);
            }
            return this;
        },
        setAttributes: function(names, options){
            var self = this;
            if(Array.isArray(names)){
                names.forEach(function(name, i){
                    self.at(i) && self.at(i).setAttribute(name, {silent: true});
                });
                if(!(options && options.silent)){
                    this.trigger('change', this);
                }
            }else{
                this.setAttribute(names, options);
            }
            return this;
        },
        getLimit: function(){
            var firstGroup = this.at(0);
            return firstGroup.getLimit();
        },
        setLimit: function(limit, options){
            var firstGroup = this.at(0);
            if(firstGroup){
                firstGroup.setLimit(limit, options);
            }
            return this;
        }
        
    });
}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata){
    "use strict";
    var SourceVisualizations = Zoomdata.Collections.SourceVisualizations,
        ObjectFields = Zoomdata.Collections.ObjectFields,
        Formulas = Zoomdata.Collections.Formulas,
        Attributes = Zoomdata.Collections.Attributes;

    Zoomdata.Models = Zoomdata.Models || {};

    Zoomdata.Models.Source = Zoomdata.MVC.Model.extend({
        urlRoot: 'service/sources',

        initialize: function () {
            Zoomdata.MVC.Model.prototype.initialize.apply(this, arguments);

            this.visualizations = new SourceVisualizations(this.attributes.visualizations, {
                secure: this.secure,
                remote: this.remote,
                apiKey: this.apiKey
            });
            this.objectFields = new ObjectFields(this.attributes.objectFields, {
                secure: this.secure,
                remote: this.remote,
                apiKey: this.apiKey
            });
            this.formulaList = this.objectFields.formulas;

            this.on('sync', this._onSync);
            this._onSync();
        },

        _onSync: function () {
            this.updateVisualizations();
            this.updateObjectFields();
        },

        _detectTypeViaJdbc: function(jdbcUrl, type){
            if (jdbcUrl.indexOf('redshift.amazonaws.com') != -1) {
                type = "REDSHIFT";
            }
            else if (jdbcUrl.indexOf('jdbc:oracle') != -1) {
                type = "ORACLE";
            } else if (jdbcUrl.indexOf('jdbc:mysql') != -1) {
                type = "MYSQL";
            } else if (jdbcUrl.indexOf('jdbc:sqlserver') != -1) {
                type = "SQLSERVER";
            } else if (jdbcUrl.indexOf('jdbc:postgresql') != -1) {
                type = "POSTGRESQL";
            }
            else if (jdbcUrl && jdbcUrl.indexOf('jdbc:presto') != -1) {
                type = "PRESTO";
            }

            return type;
        },

        _detectTypeViaPathFile: function(pathToFile, type){
            if (pathToFile && pathToFile.indexOf('s3') === 0) {
                type = 'S3';
            } else {
                type = 'HDFS';
            }
            return type;
        },

        updateVisualizations: function () {
            var sourceId = this.get('id');
            this.visualizations.setSource(sourceId);
            this.visualizations.set(this.attributes.visualizations);
        },

        updateObjectFields: function () {
            var sourceId = this.get('id'),
                // Initializing collections, since they have special models with composed ids
                objectFields = new ObjectFields(this.attributes.objectFields),
                formulas = new Formulas(this.attributes.formulas);

            this.objectFields.setSource(sourceId);
            this.objectFields.set(objectFields.toArray());
            this.formulaList.set(formulas.toArray());
        },

        // Since validate is called on save by default we can use it to move data from
        // visualizations collection to the property of the model;
        validate: function () {
            this.attributes.visualizations = this.visualizations.toJSON();
        },

        saveViewCount: $.noop()
    });
}(window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata){

    "use strict";
    
    var Source = Zoomdata.Models.Source,
        lightweightFields = [
            'name',
            'description',
            'type',
            'streamType',
            'lastModified',
            'viewsCount',
            'storageConfiguration',
            'enabled'
        ].join(',');

    Zoomdata.Collections = Zoomdata.Collections || {};

    Zoomdata.Collections.Sources = Zoomdata.MVC.Collection.extend({
        url: 'service/sources',
        model: Source,

        initialize: function(array, options) {
            options = options || {};
            if (typeof options.lightweight == 'boolean') {
                this.lightweight = options.lightweight;
                delete options.lightweight;
            }

            return Zoomdata.MVC.Collection.prototype.initialize.apply(this, arguments);
        },

        filterByVisualizations: function (filter) {
            var filtered = [];

            this.each(function (source) {
                if (source.visualizations.where(filter).length) {
                    filtered.push(source);
                }
            });

            return filtered;
        },

        filterDisabled: function() {
            this.remove(this.filter(function(source) {
                return !source.get("enabled");
            }));
            return this;
        },

        fetch: function(options) {
            var opts = _.clone(options) || {};

            if ((typeof opts.lightweight == 'boolean' ? opts.lightweight : this.lightweight)) {
                opts.data = $.extend({}, opts.data, {fields: lightweightFields});
            }

            return Zoomdata.MVC.Collection.prototype.fetch.call(this, opts);
        }
    });

}(window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {
    "use strict";

    Zoomdata.Models = Zoomdata.Models || {};
    Zoomdata.Models.Metric = Zoomdata.MVC.Model.extend({

//        idAttribute: 'label',

        defaults: {
            label: '',
            name: '',
            func: ''
        },

        initialize: function (attributes, options) {
            Zoomdata.MVC.Model.prototype.initialize.apply(this, arguments);
            options = options || {};
            this.options = $.extend({}, this.defaults, options);

            this._setModelId();

            return this;
        },

        _setModelId: function () {
            var labels, 
            label = this.get('label');

            if (!this.get('id')) {
                labels = this.collection 
                                ? this.collection.where({label: label})
                                : [];
                this.set('id', label + '-' + labels.length, {silent: true});
            }

        },

        isCount: function () {
            return this.get('name') == 'count';
        },
        isNone: function () {
            var name = this.get('name');
            return name == 'none';
        }
    });
}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {
    "use strict";

    var Metric = Zoomdata.Models.Metric;

    Zoomdata.Collections = Zoomdata.Collections || {};
    Zoomdata.Collections.Metrics = Zoomdata.MVC.Collection.extend({

        model: Metric,

        initialize: function (options) {
            options = options || {};
            Zoomdata.MVC.Collection.prototype.initialize.apply(this, arguments);
            this.options = $.extend({}, this.defaults, options);

            return this;
        }
    });
}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata){

    "use strict";

    Zoomdata.Models = Zoomdata.Models || {};

    Zoomdata.Models.ComponentSource = Zoomdata.MVC.Model.extend({
        defaults: {
        },

        getConstructorName: function () {
            return funcFromString(this.get('name'));
        },

        url: function() {
            var host = (typeof this.remote == 'string'
                    ? this.remote + '/'
                    : ''),
                secure = (typeof this.remote == 'string' && typeof this.secure == 'boolean'
                    ? this.secure ? 'https://' : 'http://'
                    : ''),
                url = Zoomdata.MVC.Model.prototype.url.apply(this, arguments);
            url += '/' + this.get('uploadDate');

            return secure + host + url;
        },

        load: function (namespace) {
            var instance = this,
                type = this.get('type'),
                dfd = $.Deferred(),
                url = this.url(),
                $head = $('head'),
                ns = namespace,
                key = this.apiKey || Zoomdata.Utilities.getURLParameter("key");

            switch (type) {
                case "text/template": {
                    if (key) {
                        url += "?unwrapped=true&key=" + key;
                    }
                    else {
                        url += '?unwrapped=true';
                    }

                    $.ajax({
                        cache: true,
                        dataType: "text",
                        url: url
                    }).done(function(data) {
                        $("<script type='text/template'>" + data + "</script>").appendTo($("head"));
                        dfd.resolve();
                    })
                    .fail(function(jqxhr, settings, exception) {
                        console.error("Failed to load: " + instance.get('name') + " with exception: " + exception);
                        dfd.reject(jqxhr);
                    });
                } break;
                case "text/css": {
                    if (key) {
                        url += "?key=" + key;
                    }

                    $.ajax({
                        cache: true,
                        dataType: "text",
                        url: url
                    }).done(function(data) {
                        var visId = instance.get('visualizationId') || instance.collection.visId,
                            componentId = instance.get('id');
                    
                        $(".widgetContent[data-visid=" + visId + "]").each(function(i, widget){
                            var $widget = $(widget).parent();
                            if($widget.children('[data-componentid="' + componentId + '"]').length > 0){
                            }else{
                                var scopedStyle = $('<style data-visid="' + visId + '" data-componentid="' + componentId + '" scoped>' + data + '</style>')
                                    .appendTo($widget);
                                    
                                scopedStyle.scopedPolyFill && scopedStyle.scopedPolyFill();
                            }
                        });
                        var externalStyleSheetsNumber = $('body style').length + $('body link').length;
                        dfd.resolve();
                    })
                    .fail(function(jqxhr, settings, exception) {
                        console.error("Failed to load: " + instance.get('name') + " with exception: " + exception);
                        dfd.reject(jqxhr);
                    });
                } break;
                //case "text/javascript":
                default: {
                    url += '?namespace='+ns+'&function='+this.getConstructorName();

                    $.ajax({
                        cache: true,
                        dataType: "script",
                        url: url
                    }).done(function() {
                        dfd.resolve();
                    })
                    .fail(function(jqxhr, settings, exception) {
                        console.error("Failed to load: " + instance.get('name') + " with exception: " + exception);
                        dfd.reject(jqxhr);
                    });
                } break;
            }
            return dfd.promise();
        }
    });

    function funcFromString(string) {
        return string.substring(0, string.lastIndexOf("."));
    }

}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";

    var ComponentSource = Zoomdata.Models.ComponentSource;

    Zoomdata.Collections = Zoomdata.Collections || {};

    Zoomdata.Collections.ComponentSources = Zoomdata.MVC.Collection.extend({
        model: ComponentSource,

        initialize: function (models, options) {
            options = options || {};
            if (options.visId) {
                this.setVisId(options.visId);
                delete options.visId;
            }
            if (options.name) {
                this.setVisName(options.name);
                delete options.name;
            }

            Zoomdata.MVC.Collection.prototype.initialize.apply(this, arguments);
            return this;
        },

        getComponentsNamespace: function () {
            return this.getVisName().replace(/[^\w]/g, '_');
        },
        load: function (namespace) {
            var dfd = $.Deferred(),
                securityKey = this.apiKey || Zoomdata.Utilities.getURLParameter('key'),
                host = (typeof this.remote == 'string'
                    ? this.remote + '/'
                    : ''),
                secure = (typeof this.remote == 'string' && typeof this.secure == 'boolean'
                    ? this.secure ? 'https://' : 'http://'
                    : '');

            namespace = namespace || this.getComponentsNamespace();

            requirejs.config({
                urlArgs: securityKey ? 'key='+securityKey : null,
                paths: {
                    noext: secure + host + "js/libs/require/noext"
                }
            });

            var required = [],  // Url for requirejs
                names = [],     // Corresponding constructor names in namespace
                resources = []; // Resources to be loaded not using requirejs

            if (namespace) {
                this.forEach(function(component) {
                    var url = component.url();

                    if ("text/javascript" === component.get("type")) {
                        required.push("noext!" + url);
                        names.push(component.getConstructorName());
                    }
                    else {
                        resources.push(component);
                    }
                });

            } else {
                console.error('Namespace is not defined');
                dfd.reject({
                    message: 'Namespace is not defined'
                });
            }

            var loadScripts = function(required) {
                var loaded = 0;
                console.log("Loading scripts:");
                console.log(required);

                names.forEach(function (name) {
                    typeof Zoomdata.Visualizations[namespace][name] == 'function'
                        ? loaded ++
                        : null;
                });
                require.config({
                   waitSeconds: 100 
                });
                loaded == required.length
                    ? (console.log('Already Loaded: ', namespace), dfd.resolve())
                    : require(required, function() {
                        for (var i = 0; i < arguments.length; i++) {
                            var func = arguments[i],
                                name = names[i];
                            Zoomdata.Visualizations[namespace][name] = func;
                        }

                        dfd.resolve();
                    }, function (err) {
                        dfd.reject(err);
                    });

            }

            var count = resources.length;
            var scripts = required.slice(0);

            if (count > 0) {
                var index = 0;
                console.log("Loading resources:");
                console.log(resources);

                resources.forEach(function(component) {
                    component
                        .load(namespace)
                        .done(function () {
                            index++;
                            if (index == count) {
                                loadScripts(scripts);
                            }
                        })
                        .fail(function (response) {
                            dfd.reject(response);
                        });
                });
            }
            else {
                loadScripts(scripts);
            }

            return dfd.promise();
        },

        execute: function (args) {
            this.each(function (component) {
            });
        },

        url:function () {
            if (this.visId) {
                return 'service/visualizations/' + this.visId + '/source/';
            } else {
                throw new Error('Visualization id for the component is not defined');
            }
        },
        setVisName: function (name) {
            this.name = name;
        },
        getVisName: function () {
            return this.name;
        },
        setVisId: function (id) {
            this.visId = id;
        }
    });

    function namespaceFromString(string) {
        return string.replace(/(\.| )/g, '_');
    }

} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata){

    "use strict";

    Zoomdata.Models = Zoomdata.Models || {};

    Zoomdata.Models.LibrarySource = Zoomdata.Models.ComponentSource.extend({
        defaults: {
        },

        initialize: function (attributes) {
            Zoomdata.Models.ComponentSource.prototype.initialize.apply(this, arguments);

            if (typeof attributes == 'string') {
                this.set('name', attributes);
            }
        },

        idAttribute: 'id',

        url: function() {
            var host = (typeof this.remote == 'string'
                    ? this.remote + '/'
                    : ''),
                secure = (typeof this.remote == 'string' && typeof this.secure == 'boolean'
                    ? this.secure ? 'https://' : 'http://'
                    : '');

            // When changing this url, do not forget to change template url in Zoomdata.Views.LibraryItem.js
            return secure + host + 'service/visualizations/libs/' + this.id + '/' + (this.get('uploadDate') || '');
        },

        load: function () {
            var instance = this,
                type = this.get('type'),
                dfd = $.Deferred(),
                url = this.url(),
                $head = $('head'),
                key = this.apiKey || Zoomdata.Utilities.getURLParameter("key");

            switch (type) {
                case "text/template": {
                    if (key) {
                        url += "?unwrapped=true&key=" + key;
                    }
                    else {
                        url += '?unwrapped=true';
                    }

                    $.ajax({
                        cache: true,
                        dataType: "text",
                        url: url
                    }).done(function(data) {
                        $("<script type='text/template'>" + data + "</script>").appendTo($("head"));
                        dfd.resolve();
                    })
                    .fail(function(jqxhr, settings, exception) {
                        console.error("Failed to load: " + instance.get('name') + " with exception: " + exception);
                        dfd.reject(jqxhr);
                    });
                } break;
                case "text/css": {
                    if (key) {
                        url += "?key=" + key;
                    }

                    $.ajax({
                        cache: true,
                        dataType: "text",
                        url: url
                    }).done(function(data) {
                        $("<style>" + data + "</style>").appendTo($("head"));
                        dfd.resolve();
                    })
                    .fail(function(jqxhr, settings, exception) {
                        console.error("Failed to load: " + instance.get('name') + " with exception: " + exception);
                        dfd.reject(jqxhr);
                    });
                } break;
                //case "text/javascript":
                default: {
                    $.ajax({
                        cache: true,
                        dataType: "script",
                        url: url + "/"
                    }).done(function() {
                        dfd.resolve();
                    })
                    .fail(function(jqxhr, settings, exception) {
                        console.error("Failed to load: " + instance.get('name') + " with exception: " + exception);
                        dfd.reject(jqxhr);
                    });
                } break;
            }
            return dfd.promise();
        }
    });

    function funcFromString(string) {
        return string.substring(0, string.lastIndexOf("."));
    }

}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";

    var LibrarySource = Zoomdata.Models.LibrarySource;

    Zoomdata.Collections = Zoomdata.Collections || {};

    Zoomdata.Collections.LibrariesSources= Zoomdata.Collections.ComponentSources.extend({
        model: LibrarySource,

        load: function () {
            var dfd = $.Deferred(),
                securityKey = Zoomdata.Utilities.getURLParameter('key') || this.apiKey,
                requiredD3 = [],
                hasD3 = false;

            var required = [];
            this.forEach(function(component) {
                var url = component.url();
                if(url.indexOf('d3.v3.min.js') !== -1){
                    hasD3 = true;
                    requiredD3.push(url);
                }
                required.push(url);
            });
            requirejs.config({
                urlArgs: securityKey ? 'key='+securityKey : null
            });

            console.log("Loading libraries:");
            console.log(required);

            if(hasD3){
                requirejs(requiredD3,function(d3){
                    window.d3 = d3;
                    requirejs(required,function(){
                        dfd.resolve();
                    },function(err){
                        console.error(required, ' failed to load.');
                        dfd.reject(err);
                    });
                },function(err){
                    console.error(requiredD3, ' failed to load.');
                    dfd.reject(err);
                });
                
            }else{
                requirejs(required, function() {
                    dfd.resolve();
                }, function (err) {
                    console.error(err.message);
                    dfd.reject(err);
                });
            }

            return dfd.promise();
        },
        url:function () {
            return 'service/visualizations/libs/';
        }
    });
} (window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";
    /*jshint multistr: true */

    Zoomdata.Components = Zoomdata.Components || {};

    Zoomdata.Components.MetricFormatter = function(type, dataResolution) {
        dataResolution = dataResolution === 'NONE' ? false : dataResolution;
        var _type = type;
        var _dateCache = false;
        var _dataResolution = dataResolution;
        var getDateObj = function(timeshtamp){
            if(!_dateCache) _dateCache = new Date(timeshtamp*1);
            return _dateCache;
        };
        this.format = function(value) {
            var string = null;
            _dateCache = false;
            switch(_type) {
                case "MONEY": {
                    string = $.formatNumber(value, {format:"$#,##0.00", locale:"us"});
                } break;
                case "TIME": {
                    string = new Date(value).toLocaleString();
                } break;
                case "DATE": {
                    string = getDateObj(value).getDay();
                } break;
                case "MINUTE": {
                    if(isNaN(value*1))return "";
                    var hours = getDateObj(value).getHours();
                    var minutes = getDateObj(value).getMinutes();
                    var h = hours > 12 ? hours - 12 : (hours||12);
                    string = (h < 10 ? "0":"") + h + ":"+(minutes<10 ? "0"+minutes : minutes)+(hours >= 12 ? ' pm' : ' am');
                } break;
                case "HOUR": {
                    if(isNaN(value*1))return "";
                    var hours = getDateObj(value).getHours();
                    var h = hours > 12 ? hours - 12 : (hours||12);
                    string = (h <10 ? "0":"") + h +(hours >= 12 ? ' pm' : ' am');
                } break;
                case "DAY": {
                    if(isNaN(value*1))return "";
                    var day = "DAY" == _dataResolution ? getDateObj(value).getUTCDate() : getDateObj(value).getDate();
                    var month = "DAY" == _dataResolution ? getDateObj(value).getUTCMonth() + 1 : getDateObj(value).getMonth() + 1;
                    string = (month<10 ? "0"+month : month) + " / " + (day<10 ? "0"+day : day);
                } break;
                case "WEEK": {
                    if(isNaN(value*1))return "";
                    var day = "DAY" == _dataResolution ? getDateObj(value).getUTCDate() : getDateObj(value).getDate();
                    var month = "DAY" == _dataResolution ? getDateObj(value).getUTCMonth() + 1 : getDateObj(value).getMonth() + 1;
                    string = (month<10 ? "0"+month : month) + " / " + (day<10 ? "0"+day : day);
                } break;
                case "MONTH": {
                    if(isNaN(value*1))return "";
                    var month = "DAY" == _dataResolution ? getDateObj(value).getUTCMonth() + 1 : getDateObj(value).getMonth() + 1;
                    var year = "DAY" == _dataResolution ? getDateObj(value).getUTCFullYear() : getDateObj(value).getFullYear();
                    string = year + " / " + (month<10 ? "0"+month : month);
                } break;
                case "YEAR": {
                    if(isNaN(value*1))return "";
                    string = "DAY" == _dataResolution ? getDateObj(value).getUTCFullYear() : getDateObj(value).getFullYear();
                } break;
                default: {
                    if (Math.abs(value) >= 0.0001 && Math.abs(value) <= 1) {
                        string = $.formatNumber(value, {format:"0.####", locale:"us"});
                    } 
                    else if (Math.abs(value) > 1) {
                        string = $.formatNumber(value, {format:"#,##0.##", locale:"us"});
                    }
                    else {
                        if (value === null) { value = 0; }
                        string = value ? value.toExponential(4).toString() : value.toString();
                    }
                } break;
            }

            return string;
        };
    };

} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";

    var MetricFormatter = Zoomdata.Components.MetricFormatter;

    Zoomdata.Components = Zoomdata.Components || {};
    Zoomdata.Components.MetricAccessor = MetricAccessor;

    function MetricAccessor(metric, objectField) {
        this.setAccessTo(metric, objectField);
        this.setColorRangeType('gradient');
    }

    MetricAccessor.prototype.setAccessTo = function setAccessTo(metric, field) {
        this.metric = metric;
        this.metric.colors = this.metric.colors || this.metric.savedColors;
        this.objectField = field;
        this._updateFormatter();

        return this;
    };

    MetricAccessor.prototype._updateDomain = function _updateDomain(data, colorNumb) {
        var self = this,
            minMax,
            currentValue,
            step,
            leftRange,
            rightRange,
            sliceNumb = colorNumb;
        if (this.objectFields) { //if multiMetric
            this.domainValue = this.objectFields.map(function (item) {
                return item.get('label');
            });
        } else {
            minMax = d3.extent(data, function(d, i) {
                return self.raw(d);
            });
            step = (minMax[1] - minMax[0]) / sliceNumb;
            if (this.colorRangeType !== 'gradient') {
                sliceNumb += 1;
            }
            if(step === 0){
                this.domainValue = minMax.slice(0);
                return;
            }
            this.domainValue = this.domainValue || [];
            if (this.domainValue.length === 4 && this.colorRangeType !== 'gradient') {
                leftRange = this.domainValue[1];
                rightRange = this.domainValue[2];
                if (leftRange < minMax[0]) {
                    leftRange = minMax[0];
                }
                if (rightRange > minMax[1]) {
                    rightRange = minMax[1];
                }
                if (leftRange > rightRange) {
                    leftRange = rightRange;
                }
                this.domainValue[0] = minMax[0];
                this.domainValue[1] = leftRange;
                this.domainValue[2] = rightRange;
                this.domainValue[3] = minMax[1];
            } else {
                currentValue = minMax[0];
                this.domainValue = [];
                do {
                    this.domainValue.push(currentValue);
                    currentValue += step;
                } while (this.domainValue.length < sliceNumb);
                this.domainValue[ this.domainValue.length - 1 ] = minMax[1];
            }
        }
    };

    MetricAccessor.prototype._recountDomain = function _recountDomain() {
        this._formatter = new MetricFormatter(this.objectField.type);
    };

    MetricAccessor.prototype._updateFormatter = function _updateFormatter() {
        this._formatter = new MetricFormatter(this.objectField.type);
    };

    MetricAccessor.prototype.isCount = function isCount() {
        return this.metric.name === 'count';
    };

    MetricAccessor.prototype.isNone = function isNone() {
        return this.metric.name == 'none';
    };

    MetricAccessor.prototype.raw = function raw(data) {
        var isCount = this.isCount(),
            isNone = this.isNone(),
            field, func;

        if (isNone) return 0;
        field = this.metric.name;
        func = !isCount ? this.metric.func: null;

        if (isCount &&
            data.hasOwnProperty('current') &&
            data.current.hasOwnProperty('count')) {

            return data.current.count;

        } else if (

            data.hasOwnProperty('current') &&
            data.current.hasOwnProperty('metrics') &&
            data.current.metrics.hasOwnProperty(field) &&
            data.current.metrics[field].hasOwnProperty(func)) {

            return data.current.metrics ? data.current.metrics[field][func] : null;

        } else {
            return null;
        }
    };

    MetricAccessor.prototype.formatted = function formatted(data, dataResolution) {
        var value = isNaN(data) ? this.raw(data) : data,
            type = this.objectField.type;

        return type === 'count' ? value : this._formatter.format(value, dataResolution);
    };

    MetricAccessor.prototype.get = function get(field) {
        return this.objectField[field];
    };

    MetricAccessor.prototype._updateFormatter = function _updateFormatter() {
        this._formatter = new MetricFormatter(this.objectField.type);
    };

    MetricAccessor.prototype.get = function get(attr) {
        return this.objectField[attr];
    };

    MetricAccessor.prototype.colorRange = function colorRange() {
        var self = this,
            colors = [];
        if (this.metric.name === 'none') {
            _.each(this.metric.colors, function () {
                colors.push(self.metric.colors[0]);
            });
        } else {
            colors = this.metric.colors;
        }
        return _.clone(colors);
    };

    MetricAccessor.prototype.minimum = function minimum() {
        if (this.domainValue) {
            return this.domainValue[0];
        }
        return 0;
    };

    MetricAccessor.prototype.maximum = function maximum() {
        if (this.domainValue) {
            return this.domainValue[this.domainValue.length - 1];
        }
        return 0;
    };

    MetricAccessor.prototype.domain = function domain() {
        return _.clone(this.domainValue);
    };

    MetricAccessor.prototype.setColorRangeType = function setColorRangeType(type) {
        this.colorRangeType = type;
    };
} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function(root, Zoomdata) {

    "use strict";

    Zoomdata.Models = Zoomdata.Models || {};

	Zoomdata.TIME_WINDOW_SCALE = {
		HOUR: "HOUR",
        ROLLING_HOUR: "ROLLING_HOUR",
        DAY: "DAY",
        WEEK: "WEEK",
        MONTH: "MONTH",
        QUARTER: "QUARTER",
        YEAR: "YEAR",
        CUSTOM: "CUSTOM",
        ALL: "ALL"
	};

    Zoomdata.Models.TimeWindowScale = Zoomdata.MVC.Model.extend({
		idAttribute: "value"
    });
}(window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";
    /* jshint -W099 */
    /*jshint laxbreak: true */

    var Utilities = Zoomdata.Utilities,
        millisecondsIn = Utilities.time.millisecondsIn,
        Metrics = Zoomdata.Collections.Metrics,
        Components = Zoomdata.Components,
        Group = Zoomdata.Models.GroupBy,
        GroupBy = Zoomdata.Collections.GroupBy;

    Zoomdata.Models = Zoomdata.Models || {};

    Zoomdata.Models.Time = Zoomdata.MVC.Model.extend({
        defaults: {
            "paused": false,
            "speed": 1,
            "minSpeed": 1,
            "timeWindow": "ROLLING_HOUR",
            "time": null,
            "tz": Utilities.determineTimeZone(),
            "min": 0,
            "max": new Date().getTime(),
            "speedValues": [1, 10, 60, 3600, 86400, 864000, 5184000],
            "speedNames": ["1x", "10x", "60x", "1h/sec", "1d/sec", "10d/sec", "60d/sec"],
            "live": false
        },
        startTimeFunctions: {},
        initialize: function(attributes, options) {
            _.bindAll(this, 'firstMinuteTime', 'firstHourTime', 'rollingTime', 'getStartTime', 'getEndTime');
            // timeModel accepts 'LIVE' 'yyyy-mm-dd hh:mm:ss' or timestamp
            if (attributes.time == 'LIVE') {
                this.set({
                    time: (new Date()).getTime(),
                    live: true
                });
            } else if (typeof attributes.time !== 'number') {
                this.set({
                    time: Utilities.getTimestamp(attributes.time),
                    paused: true
                });
            } else {
                this.set({
                    time: attributes.time,
                    paused: true
                });
            }
            this.on('change:timeWindow', this._updateLimits);
        },
        firstMinuteTime: function(time) {
            var d = new Date(time);
            d.setMinutes(0, 0, 0);
            return d.getTime();
        },
        firstHourTime: function(time) {
            var d = new Date(time);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        },
        rollingTime: function(time) {
            return time - millisecondsIn.hour;
        },
        getStartTimeStamp: function() {
            return this.get("fromTime");
        },
        getEndTimeStamp: function() {
            var time = this.get("time");
            return time;
        },
        getStartTime: function(includeTimeZone, mdy, dataResolution) {
            var time = this.get('timeWindow') == 'ALL' ? this.get("min") : this.get('fromTime');

            if (includeTimeZone) {
                return Utilities.formattedDate(time, mdy) + " " + Utilities.timeZoneFromTime(time);
            }

            if ("DAY" === dataResolution) {
                return Utilities.formattedDateOnly(time, mdy, true);
            }

            return Utilities.formattedDate(time, mdy);
        },
        getEndTime: function(includeTimeZone, mdy, dataResolution) {
            var time = this.get("time");
            return includeTimeZone
                ? Utilities.formattedDate(time, mdy) + " " + Utilities.timeZoneFromTime(time)
                : "DAY" === dataResolution ? Utilities.formattedDateOnly(time, mdy) : Utilities.formattedDate(time, mdy);
        },
        formattedCustomDate: function(includeTimeZone, time, mdy) {
            time = time * 1;
            return includeTimeZone ? Utilities.formattedDate(time, mdy) + " " + Utilities.timeZoneFromTime(time) : Utilities.formattedDate(time, mdy);
        },
        getStartTimeForComparisonPeriod: function(period) {
            var time = this.get("fromTime");
            var date = new Date(time);

            if ("YESTERDAY" === period) {
                date.setDate(date.getDate() - 1);
            }
            else if ("WEEK_AGO" === period) {
                date.setDate(date.getDate() - 7);
            }
            else {
                var arr = period.split("-");
                var periodDate = new Date(arr[0] * 1, arr[1] * 1 - 1, arr[2] * 1);
                periodDate.setHours(date.getHours());
                periodDate.setMinutes(date.getMinutes());
                periodDate.setSeconds(date.getSeconds());
                date = periodDate;
            }

            time = date && date.getTime() || time;
            return Utilities.formattedDate(time, true) + " " + Utilities.timeZoneFromTime(time);
        },
        getEndTimeForComparisonPeriod: function(period) {
            var time = this.get("time");
            var date = new Date(time);

            if ("YESTERDAY" === period) {
                date.setDate(date.getDate() - 1);
            }
            else if ("WEEK_AGO" === period) {
                date.setDate(date.getDate() - 7);
            }
            else {
                var arr = period.split("-");
                var periodDate = new Date(arr[0] * 1, arr[1] * 1 - 1, arr[2] * 1);
                periodDate.setHours(date.getHours());
                periodDate.setMinutes(date.getMinutes());
                periodDate.setSeconds(date.getSeconds());
                date = periodDate;
            }

            time = date && date.getTime() || time;
            return Utilities.formattedDate(time, true) + " " + Utilities.timeZoneFromTime(time);
        },
        getStartTimeForTimeWindowScaleAndComparisonPeriod: function(scale, period) {
            var time = this.get("fromTime");
            var date = new Date(time);

            if ("YESTERDAY" === period) {
                date.setDate(date.getDate() - 1);
            }
            else if ("WEEK_AGO" === period) {
                date.setDate(date.getDate() - 7);
            }
            else {
                var arr = period.split("-");
                var periodDate = new Date(arr[0] * 1, arr[1] * 1 - 1, arr[2] * 1);
                periodDate.setHours(date.getHours());
                periodDate.setMinutes(date.getMinutes());
                periodDate.setSeconds(date.getSeconds());
                date = periodDate;
            }

            if ("HOUR" === scale) {
                date.setMinutes(0);
                date.setSeconds(0);
            }
            else if ("DAY" === scale) {
                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);
            }

            time = date && date.getTime() || time;
            return Utilities.formattedDate(time, true) + " " + Utilities.timeZoneFromTime(time);
        },
        getEndTimeForTimeWindowScaleAndComparisonPeriod: function(scale, period) {
            var time = this.get("time");
            var date = new Date(time);

            if ("YESTERDAY" === period) {
                date.setDate(date.getDate() - 1);
            }
            else if ("WEEK_AGO" === period) {
                date.setDate(date.getDate() - 7);
            }
            else {
                var arr = period.split("-");
                var periodDate = new Date(arr[0] * 1, arr[1] * 1 - 1, arr[2] * 1);
                periodDate.setHours(date.getHours());
                periodDate.setMinutes(date.getMinutes());
                periodDate.setSeconds(date.getSeconds());
                date = periodDate;
            }

            if ("HOUR" === scale) {
                date.setMinutes(59);
                date.setSeconds(59);
            }
            else if ("DAY" === scale) {
                date.setDate(date.getDate() + 1);
                date.setHours(0);
                date.setMinutes(59);
                date.setSeconds(59);
                date.setHours(-1);
            }

            time = date && date.getTime() || time;
            return Utilities.formattedDate(time, true) + " " + Utilities.timeZoneFromTime(time);
        }
    });

    Zoomdata.Models.Datum = Zoomdata.MVC.Model.extend({idAttribute: "group"});

    var CLIENT_SORT = {
        "Descending Value": "valueDescending",
        "Ascending Value": "valueAscending",
        "Alphabetical": "alphabetical",
        "Reverse Alphabetical": "reverseAlphabetical"
    };

    var CLIENT_SORT_REVERSE = {
        "valueDescending": "Descending Value",
        "valueAscending": "Ascending Value",
        "alphabetical": "Alphabetical",
        "reverseAlphabetical": "Reverse Alphabetical"
    };

    var Filter = Zoomdata.Models.Filter;
    var Filters = Zoomdata.Collections.Filters;

    var fields = [];

    /** State of the data stream in a custom visualization.
     * @name state
     * @namespace
     * @memberof controller
     */
    Zoomdata.Models.State = Zoomdata.MVC.Model.extend({
        defaults: {
            groupBy: null,
            timeWindowScale: "ROLLING_HOUR",
            comparison: false,
            comparisonPeriod: "YESTERDAY",
            sort: {dir: "DESC", name: "count"},
            limit: 1000,
            clientSort: "valueDescending"
        },
        initialize: function(attributes, options) {

            options || (options = {});
            var instance = this,
                defaults = this.defaults,
                attrs = {},
                config = options.config,
                visInfo = options.config && options.config.get("source"),
                variables = visInfo.variables,
                filters = visInfo.filters || [],
                minSpeed = visInfo.minSpeed ? visInfo.minSpeed : 1,
                speed = minSpeed > 1 ? minSpeed : 1,
                timeField,
                startFrom = visInfo.startFrom;

            this.options = this.options || {};
            
            if (options.config) {
                this.config = options.config;
                delete options.config;
            }
            if (options.objectFields) {
                this.options.fields = options.objectFields.toJSON();
                delete options.objectFields;
            }
            if (startFrom === 'BEGINNING') {
                timeField = this.options.fields.filter(function (item) {
                    return item.name === visInfo.date;
                })[0];
                if (timeField) {
                    startFrom = timeField.min;
                    if(visInfo.timeWindowScale === "ROLLING_HOUR"){
                        startFrom += 60 * 60 * 1000;
                    }
                }
            }
            this.metrics = new Metrics(this._retrieveMetrics());

            switch (minSpeed) {
                case 86400:
                    defaults.timeWindowScale = "WEEK";
                    break;
                case 3600:
                    defaults.timeWindowScale = "DAY";
                    break;
                default:
                    defaults.timeWindowScale = "ROLLING_HOUR";
            }

            this.time = new Zoomdata.Models.Time({
                time: startFrom,
                speed: speed,
                minSpeed: minSpeed,
                timeWindow: visInfo.timeWindowScale
            });
            this.on('change:timeWindowScale', function(model, value) {
                instance.time.set('timeWindow', value);
            });

            attrs.limit = variables["Limit"];

            if (this.metrics.size() > 0) {
                if (variables["Limit Results by Rank"] == "Bottom") {
                    attrs.sort = {name: this.metrics.at(0).get('name') || 'count', dir: "asc"};
                } else {
                    attrs.sort = {name: this.metrics.at(0).get('name') || 'count', dir: "desc"};
                }
            } else {
                attrs.sort = {name: 'count', dir: "desc"};
            }

            this.queryBuilderSource = visInfo.variables["queryBuilderSource"];

            /** A collection of filters applied to the data stream.
             * @name filters
             * @type {Backbone.Collection}
             * @namespace
             * @memberof controller.state
             * @example
             * controller.state.filters.reset(); //Clear filters.
             */
            this.filters = new Filters(filters);

            /** Collection of Attributes which are using to group data.
             * @name groupBy
             * @type {Zoomdata.Collections.GroupBy}
             * @namespace
             * @memberof controller.state
             * @example
             * controller.state.groupBy.setAttribute('usercity'); // Groups data by 'usercity' attribute
             * controller.state.groupBy.setAttributes(['usercity', 'productcategory']); // Groups data by 'usercity' attribute and perform subgrouping data by 'productcategory' attribute
             * controller.state.groupBy.at(0).setLimit(20); // Set limit so the server will return not more than 20 records
             * controller.state.groupBy.at(0).setSortDirection('Ascending Value'); // Set ascending direction of sorting ('Ascending Value' / 'Descending Value')
             * controller.state.groupBy.at(0).setSortMetric('plannedsales'); // Server will sort records according to 'plannedsales' metric values
             */
            this.groupBy = new GroupBy(this._retrieveGroupBy(), this._retrieveGroupByDefinition());

            if (config.get("type") === "TRENDS" || config.get("type") === "MULTI_METRIC_TREND") {
                visInfo.timeTrendStep = visInfo.timeTrendStep || 'DAY';
            }
            attrs.timeTrendStep = visInfo.timeTrendStep;
            attrs.timeWindowScale = visInfo.timeWindowScale || defaults.timeWindowScale;
            attrs.comparison = variables["Comparison"] === "On";
            attrs.comparisonPeriod = variables["_comparisonPeriod"] || visInfo.comparisonPeriod || "YESTERDAY";

            attrs.sort = attrs.sort || defaults.sort;

            attrs.clientSort = CLIENT_SORT[variables["Sort"]] || defaults.clientSort;

            attrs.delay = visInfo.delay;
            attrs.delayUnit = visInfo.delayUnit;
            attrs.timestampField = visInfo.date;

            this.set(attrs);

        },
        
        _retrieveGroupByDefinition: function(){
            var groupDefinitionData  = this._retrieveGroup();  // Single Group By
            var groupsDefinitionData = this._retrieveGroups(); // Multi Group By
            return {
                definition: groupsDefinitionData || groupDefinitionData
            };
        },
        
        _retrieveGroupBy: function(){
            var instance     = this;
            var config       = this.config;
            var savedGroupBy = [];
            var defaultValue = '';
            var visInfo      = config && config.get("source");
            var variables    = visInfo.variables;

            var groupDefinitionData  = instance._retrieveGroup();  // Single Group By
            var groupsDefinitionData = instance._retrieveGroups(); // Multi Group By

            // Multi-group has higher priority
            if (groupsDefinitionData) {

                // Check if it has saved values for multi-group
                if (variables && variables[groupsDefinitionData.name]) {
                    savedGroupBy = JSON.parse(variables[groupsDefinitionData.name]);

                } else { // Take groups from defaultValue or generate defaults
                    defaultValue = groupsDefinitionData.defaultValue;
                    if (!defaultValue || defaultValue === '') {
                        var amount = JSON.parse(groupsDefinitionData.config).groupLevel || 2;
                        savedGroupBy = instance._getDefaultGroups(amount);
                    } else {
                        savedGroupBy = [JSON.parse(groupsDefinitionData.defaultValue)];
                    }
                }

                // If it's single groupBy
            } else if (groupDefinitionData) {

                // Check if it has saved values for single-group
                if (variables && variables[groupDefinitionData.name]) {
                    savedGroupBy = [JSON.parse(variables[groupDefinitionData.name])];

                } else { // Take groups from defaultValue or generate defaults
                    defaultValue = groupDefinitionData.defaultValue;
                    if (!defaultValue || defaultValue === '') {
                        savedGroupBy = instance._getDefaultGroup();
                    } else {
                        savedGroupBy = [JSON.parse(groupDefinitionData.defaultValue)];
                    }
                }
            }

            if (config.get("type") === "TRENDS" || config.get("type") === "MULTI_METRIC_TREND") {
                savedGroupBy = [{
                        name: visInfo.date || "_ts",
                        limit: 10,
                        sort: {
                            name: 'date',
                            dir: 'Ascending Value'
                        }
                    }];
            }

            if(config.get("type") === "ZOOMABLE_MAP" || config.get("templateType") === "ZOOMABLE_MAP"){
                savedGroupBy = [{
                    name: variables['State'],
                    limit: 10000,
                    sort: {
                        name: 'count',
                        dir: 'Descending Value'
                    }
                }];
            }
            return savedGroupBy;
        },
        
        _getDefaultGroup: function() {
            var objectFields,
                neededType = 'ATTRIBUTE',
                attribute,
                defaultGroup = {
                    name: '',
                    limit: 10,
                    sort: {
                        name: 'count',
                        dir: 'Descending Value'
                    }
                };
            objectFields = this.options.fields;
            attribute = _.findWhere(objectFields, {type: neededType});
            defaultGroup.name = attribute ? attribute.name : 'none';

            return defaultGroup;
        },
        _getDefaultGroups: function(amount) {
            var objectFields,
                neededType = 'ATTRIBUTE',
                attribute,
                defaultGroups = [];
            
            objectFields = this.options.fields;

            for(var i = 0; i < objectFields.length; i++){
                var objectField = objectFields[i];
                if(objectField.type === neededType){
                    var defaultGroup = {
                        name: objectField.name,
                        limit: 10,
                        sort: {
                            name: 'count',
                            dir: 'Descending Value'
                        }
                    };
                    defaultGroups.push(defaultGroup);
                    if(defaultGroups.length >= amount){
                        break;
                    }
                }
            }

            return defaultGroups;
        },
        _retrieveGroup: function() {
            var variables = this.config.get('variables'),
                group = _.findWhere(variables, {type: 'group'});

            if (!group) {
                group = false;
            }

            return group;
        },
        _retrieveGroups: function() {
            var variables = this.config.get('variables'),
                groups = _.findWhere(variables, {type: 'multi-group'});

            if (!groups) {
                groups = false;
            }

            return groups;
        },
        _retrieveMetrics: function() {
            var variables = this.config.get('variables'),
                fields = this.options.fields || [],
                variablesConfiguration = this.config.get('source').variables,
                metrics = [];

            variables.forEach(function(variable) {
                variable.type == 'metric'
                    ? addMetric(variable)
                    : variable.type == 'multi-metric'
                    ? parseMultiMetric(variable)
                    : null;
            });

            function addMetric(metric) {
                var label = metric.name,
                    configuration = variablesConfiguration[label] || 'none',
                    split = configuration.split(':'),
                    name = split[0],
                    field = fields.filter(function (item) { return item.name === name; })[0],
                    func = split[1] || field.func || (name !== 'count' && name != 'none' ? "sum" : null),
                    metricOptions = {};

                if (split[2]) {
                    metricOptions = JSON.parse(split[2].replace(/\|/g, ':'));
                    $.extend(metric, metricOptions);
                }
                metrics.push($.extend(metricOptions, {label: label, name: name, func: func, id: label}));
            }

            function parseMultiMetric(multiMetric) {
                var label = multiMetric.name,
                    configuration = variablesConfiguration[label].split(' ');

                if (multiMetric.metricType === 'color') {
                    addMetric(multiMetric);
                } else {
                    configuration.forEach(function (config) {
                        var name = config.split(':')[0],
                            field = fields.filter(function (item) { return item.name === name; })[0],
                            func = config.split(':')[1] || field.func;

                        metrics.push({label: label, name: name, func: func, id: label+'-'+metrics.length});
                    });
                }
            }

            return metrics;
        },

        /** Adds a filter for this visualization.
         * @name addFilter
         * @memberof controller.state
         * @function
         * @param {object} filter Filter to be added to the visualization.
         * @param {String} filter.operation 'IN' for Include and 'EX' for Exclude.
         * @param {String} filter.path Field to filter on. e.g.: 'userstate'
         * @param {String[]} filter.value An Array of values to filter on. e.g.: ['California']
         * @param {object} options [Options used when adding a model to a collection in Backbone.js]{@link http://backbonejs.org/#Collection-add}
         * @example
         * var filter = {
         *      operation: 'IN',
         *      path: 'userstate',
         *      value: ['California']
         * };
         *
         * visualization.controller.state.addFilter(filter);
         */
        addFilter: function(filter, options) {
            var filters = this.filters, existing, path, attributes, operation;

            options = options || {};

            if(Array.isArray(filter)){
                this.filters.add(filter, _.extend({
                    merge: true
                }, options));
                return this;
            }

            !(filter instanceof Filter)
                ? filter = new Filter(filter)
                : null;

            path = filter.get('path');
            operation = filter.get('operation');
            attributes = filter.get('value');

            existing = filters.findWhere({
                path: path
            });

            if (existing) {
                var trigger = false;
                options.silent = true;
                if (typeof attributes === 'number' || typeof existing.get('value') === 'number' || typeof attributes[0] === 'number') {
                    existing.set('value', attributes, options);
                    trigger = true;
                } else {
                    _.each(attributes, function (attr) {
                        if (!existing.hasAttribute(attr, options)) {
                            trigger = true;
                            existing.addAttribute(attr, options);
                        }
                    });
                    _.each(existing.get('value'), function (attr) {
                        if (!filter.hasAttribute(attr, options)) {
                            existing.removeAttribute(attr, options);
                        }
                    });
                }
                
                if (existing.get('operation') !== operation) {
                    trigger = false;
                    existing.set('operation', operation, options);
                }

                if (trigger) {
                    existing.trigger('change');
                }

            } else {
                this.filters.add(filter, options);
            }

            return this;
        },

        /** A convenience function for adding multiple filters to a visualization.
         * @name addFilters
         * @memberof controller.state
         * @function
         * @param {Filter[]} filters Filter to be added to the visualization.
         * @example
         * var filters = [{
         *      operation: 'IN',
         *      path: 'userstate',
         *      value: ['California']
         * }, {
         *      operation: 'EX',
         *      path: 'group',
         *      value: ['Electronics']
         * }];
         *
         * visualization.controller.state.addFilters(filters);
         */
        addFilters: function(filters) {
            var instance = this;

            filters = _.sortBy(filters, function (filter){
                return instance.filters.findWhere({path: filter.path});
            });

            filters.forEach(function(filter, i) {
                instance.addFilter(filter, {silent: (i !== filters.length - 1)});
            });
        },

        /** Remove a filter for this visualization. Remove a specific value, or the entire filter.
         * @name removeFilter
         * @memberof controller.state
         * @function
         * @param {object} filter Filter to be removed from the visualization.
         * @param {String} filter.path Field of the filter being removed. e.g.: 'userstate'
         * @param {String[]} filter.value Values of the filter being removed. e.g.: ['California']
         * @param {object} options [Options used when removing from a Backbone.js Collection]{@link http://backbonejs.org/#Collection-remove}
         * @example
         * var filter = {
         *      path: 'userstate',
         *      value: ['California']
         * };
         *
         * visualization.controller.state.removeFilter(filter);
         */
        removeFilter: function(filter, options) {
            var that = this;

            if ($.isArray(filter)) {
                for (var i = 0; i < filter.length; i++) {
                    removeFilter(filter[i]);
                }
            } else {
                removeFilter(filter);
            }


            function removeFilter(filter) {
                var filters = that.filters, existing, path, attributes;

                !(filter instanceof Filter)
                    ? filter = new Filter(filter)
                    : null;

                path = filter.get('path');
                attributes = filter.get('value');

                existing = filters.findWhere({
                    path: path
                });

                if (existing && attributes.length === 1 && existing.hasAttribute(attributes[0], options)) {
                    existing.removeAttribute(attributes[0], options);
                    return that;
                }

                if (typeof attributes[0] === 'undefined' || attributes.length > 1) {
                    that.filters.remove(existing);
                    return that;
                }
            }

            return this;
        },

        /** Set a filter for this visualization. If the filter already exists, replace it. Otherwise add it.
         * @name setFilter
         * @memberof controller.state
         * @function
         * @param {object} filter Filter to be added to the visualization.
         * @param {String} filter.operation 'IN' for Include and 'EX' for Exclude.
         * @param {String} filter.path Field to filter on. e.g.: 'userstate'
         * @param {String[]} filter.value An Array of values to filter on. e.g.: ['California']
         * @param {object} options [Options used when setting a model in Backbone.js]{@link http://backbonejs.org/#Model-set}
         * @example
         * var filter = {
         *      operation: 'IN',
         *      path: 'userstate',
         *      value: ['California']
         * };
         *
         * visualization.controller.state.setFilter(filter);
         */
        setFilter: function(filter, options) {
            var filters = this.filters, existing, path, attribute;

            !(filter instanceof Filter)
                ? filter = new Filter(filter)
                : null;

            path = filter.get('path');

            existing = filters.findWhere({
                path: path
            });

            if (existing) {
                existing.set(filter.attributes, options);
            } else {
                this.addFilter(filter, options);
            }
        },
        toRequest: function(restart) { // restart flag set to true if visualization is already loaded and running. see Zoomdata.Components -> restartVisualization
            var isLive = this.time.get('live'),
                sourceConfig = this.config.get('source'),
                queryBuilderSource = this.queryBuilderSource || sourceConfig.variables['queryBuilderSource'],
                _limitPeriod = sourceConfig.variables['_limitPeriod'];

            if (_limitPeriod) {
                sourceConfig.variables['_TempLimitPeriod'] = _limitPeriod;
                delete sourceConfig.variables['_limitPeriod'];
            }
            var request = $.extend({}, this.attributes),
                startFrom = this.config.get('source').startFrom,
                timestampField = this.get('timestampField'),
                timeWindowScale = this.get('timeWindowScale'),
                config = {};

            request.time = (!timestampField || isLive) ? null : this.time.get('time');

            // do not use client time zone if data resolution is 1 day
            if (this.time.get("minSpeed") == 86400 || "DAY" === sourceConfig.dataResolution) {
                request.tz = "GMT";
            } else {
                request.tz = this.time.get('tz');
            }

            request.speed = this.time.get('speed');
            config.pauseAfterRead = this.time.get('paused');

            var sortMetricName = 'count';
            var sortDirection  = 'desc';
            if (this.get('sort') /*&& this.get('volume')*/) {
                delete request.sort;
                config = config || {};

                if (this.metrics.size() > 0) {
                    sortMetricName = this.metrics.at(0).get('name');
                }
                sortDirection = this.get('sort').dir;
                config.sort = {
                    name: sortMetricName,
                    dir : sortDirection
                };
            }

            if (this.groupBy) {
                delete request.groupBy;
                config = config || {};

                config.group = {};
                config.group.limit = 1;

                config.group.fields = this.groupBy.toJSON();

                config.group.fields.forEach(function(f) {///!!!!
                    config.group.limit = config.group.limit * +f.limit;
                    var sort = _.clone(f.sort);
                    sort.name = sort.name === 'count' ? sortMetricName : sort.name;
                    f.sort = sort;
                });

                if (config.group.fields.length === 1) {
                    config.group.limit && (delete config.group.limit);
                }

                config.group.metrics = config.group.metrics || [];

                this.metrics.each(function(metric) {
                    if (!metric.isCount() && !metric.isNone())
                        config.group.metrics.push({name: metric.get('name'), func: metric.get('func').toUpperCase()});
                });

                if (this.get('timeTrendStep')) {
                    delete request.timeTrendStep;

                    config.group.timeTrendStep = this.get('timeTrendStep');
                }
            }
            if (this.filters.length > 0) {
                delete config.filters;
                config = config || {};

                config.filters = this.filters.toRequest();
            }

            if (this.get('sort') /*&& this.get('volume')*/) {
                delete request.sort;
                delete config.sort;
            }

            if (queryBuilderSource) {
                config = config || {};
                config.queryBuilderSource = queryBuilderSource;
            }

            var comparisonPeriod = this.get("comparisonPeriod");
            request.comparisonPeriod = this.dataToFormatString(this.getTimeByType(request.time, comparisonPeriod));

            if (config) {
                request.cfg = config;
            }

            request.volume ? delete request.volume : null;
            request.color ? delete request.color : null;

            request.timestampField = timestampField;
            return request;
        },
        getTimeByType: function(fromTime, type) {
            var time = type;
            var today = fromTime && fromTime <= new Date() ? new Date(fromTime) : new Date();

            var yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            var weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);

            var lastMonth = new Date(today);
            lastMonth.setDate(today.getDate() - 30);

            var monthYearAgo = new Date(today);
            monthYearAgo.setDate(today.getDate() - 365);

            var lastYear = new Date(today);
            lastYear.setDate(today.getDate() - 365);

            switch (type) {
                case 'YESTERDAY':
                    time = yesterday;
                    break;
                case 'WEEK_AGO':
                    time = weekAgo;
                    break;
                case 'LAST_MONTH':
                    time = lastMonth;
                    break;
                case 'MONTH_YEAR_AGO':
                    time = monthYearAgo;
                    break;
                case 'LAST_YEAR':
                    time = lastYear;
                    break;
            }
            return time;
        },
        dataToFormatString: function(data) {
            var formated = '';
            if (data.getFullYear) {
                formated = data.getFullYear() + "-" + (data.getMonth() + 1 < 10 ? "0" : "") + (data.getMonth() + 1) + "-" + (data.getDate() < 10 ? "0" : "") + data.getDate();
            } else {
                formated = data;
            }
            return formated;
        },
        isSingleGroupBy: function() {
            var isSingleGroupBy = true,
                groupBy = this.groupBy;
            if (groupBy.length > 1) {
                isSingleGroupBy = false;
            }
            return isSingleGroupBy;
        },
        convertToBookmark: function() {
            var self = this,
                source = this.config.get('source'),
                metricLabels = this.metrics.pluck('label'),
                bookmark = $.extend({}, source, {
                    filters: this.filters.toJSON(),
                    timeWindowScale: this.get('timeWindowScale'),
                    timeTrendStep: this.get('timeTrendStep'),
                    startFrom: this.time.getEndTime(),
                    sourceId: source.sourceId,
                    sourceName: source.sourceName
                });

            bookmark.variables = bookmark.variables || {};
            bookmark.variables["Sort"] = CLIENT_SORT_REVERSE[this.attributes.clientSort];
            bookmark.variables["Comparison"] = this.get('comparison') ? "On" : "Off";
            bookmark.variables._comparisonPeriod = this.get('comparisonPeriod');

            if (this.isSingleGroupBy()) {
                var groupByName = '',
                    groupBy = null,
                    groupByConfig = _.findWhere(self.config.get('variables'), {'type': 'group'});

                if (groupByConfig) {
                    groupByName = groupByConfig.name;

                    groupBy = this.groupBy.at(0);

                    bookmark.variables[groupByName] = JSON.stringify(groupBy.toJSON());
                }
            } else {
                var groupByName = '',
                    groupBy = null,
                    groupByConfig = _.findWhere(self.config.get('variables'), {'type': 'multi-group'});

                if (groupByConfig) {
                    groupByName = groupByConfig.name;

                    groupBy = this.groupBy;

                    bookmark.variables[groupByName] = JSON.stringify(groupBy.toJSON());
                }
            }

            metricLabels.forEach(function(metricLabel) {
                bookmark.variables[metricLabel] = '';
            });

            this.metrics.map(function(metric, i, arr) {

                var label = metric.get('label'),
                    name = metric.get('name'),
                    func = metric.get('func'),
                    colors,
                    domain;

                bookmark.variables.hasOwnProperty(label)
                    ? bookmark.variables[label] += (bookmark.variables[label].length > 0 ? ' ' : '') + ((name == 'count')
                    ? name
                    : name + ':' + func)
                    : null;

                if (self.colorMetric && self.colorMetric.id === metric.id) {
                    if (bookmark.variables[label].split(':').length === 1) {
                        bookmark.variables[label] += ':';
                    }
                    colors = self.colorMetric.get('colors') || self.colorMetric.get('savedColors');
                    if (typeof colors !== 'string') {
                        colors = JSON.stringify(colors);
                    }
                    if (self.divergingColorRange === 'distinct') {
                        domain = self.colorMetricDomain;
                    }
                    bookmark.variables[label] += ':' + JSON.stringify({
                        colorNumb: self.colorNumb,
                        legendType: self.legendType,
                        divergingColorRange: self.divergingColorRange,
                        autoShowColorLegend: self.colorMetric.get('autoShowColorLegend'),
                        savedColors: colors,
                        domain: domain
                    }).replace(/:/g, '|');
                }
            });

            return bookmark;
        },
        isTimeTrends: function() {
            return "TRENDS" === this.config.get("type")
                || "MULTI_METRIC_TREND" === this.config.get("type")
                || "TRENDS" === this.config.get("templateType")
                || "MULTI_METRIC_TREND" === this.config.get("templateType");
        }
    });

}(window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";

    var Utilities = Zoomdata.Utilities;
    Zoomdata.Collections = Zoomdata.Collections || {};

    Zoomdata.Collections.Graph = Backbone.Collection.extend({
        model: Zoomdata.Models.Datum,
        metric: null,

        initialize: function(item, options) {
            _.bindAll(this, 'setSortOrder');
            this.metric = options.metric;
        },

        setSortOrder: function(order) {
            if ("valueAscending" === order) {
                this.comparator = function(item) {
                    return this.metric.raw(item.attributes);
                };
            }
            else if ("valueDescending" === order) {
                this.comparator = function(item) {
                    return -this.metric.raw(item.attributes);
                };
            }
            else if ("alphabetical" === order) {
                this.comparator = function(item) {
                    return item.get('group');
                };
            }
            else if ("reverseAlphabetical" === order) {
                this.comparator = function(item1, item2) {
                    if (item1.get('group') > item2.get('group')) {
                        return -1; // before
                    }
                    if (item1.get('group') < item2.get('group')) {
                        return 1; // after
                    }
                    return 0; // equal
                };
            }
            else if ("date" === order) {  
                this.comparator = function(item) {
                    return item.get("group")*1;  
                };
            }
            else {
                this.comparator = null;
            }

            if (this.comparator) {
                this.sort();
            }
        }
    });
}(window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";
    /*jshint multistr: true */

    var Controls = {},
        Utilities = Zoomdata.Utilities;

    Controls.Slider = Zoomdata.MVC.View.extend({

        defaults: {
            orientation: "vertical",
            range: false,
            value: 50,
            min: 0,
            max: 100
        },

        initialize: function (options) {
            var instance = this,
                sliderOpts = {
                    start: function (event, ui) {
                        instance.trigger('slide:start', ui.value, instance);
                        instance.data.set('value', ui.value, {silent: true});
                    },
                    stop: function (event, ui) {
                        instance.trigger('slide:stop', ui.value, instance);
                        instance.data.set('value', ui.value, {silent: true});
                    },
                    change: function (event, ui) {
                        instance.trigger('slide:change', ui.value, instance);
                        instance.data.set('value', ui.value, {silent: true});
                    }
                };

            this.options = $.extend({}, this.defaults, options);

            this.data = new Zoomdata.MVC.Model({
                min: this.options.min,
                max: this.options.max,
                value: this.options.value
            });

            this.$el.slider($.extend({}, sliderOpts, this.options));

            this.listenTo(this.data, 'change', this.render);
        },

        render: function () {
            this.$el.slider(this.data.attributes);

            return this;
        },

        /* === Accessors === */
        value: function (val) {
            var instance = this;

            function getter() {
                return instance.data.get('value');
            }
            function setter(val) {
                instance.data.set('value', val);
            }

            if (typeof val === 'number') {
                setter(val);
                return this;
            } else {
                return getter();
            }
        },

        min: function (val) {
            var instance = this;

            function getter() {
                return instance.data.get('min');
            }
            function setter(val) {
                instance.data.set('min', val);
            }

            if (typeof val === 'number') {
                setter(val);
                return this;
            } else {
                return getter();
            }
        },

        max: function (val) {
            var instance = this;

            function getter() {
                return instance.data.get('max');
            }
            function setter(val) {
                instance.data.set('max', val);
            }

            if (typeof val === 'number') {
                setter(val);
                return this;
            } else {
                return getter();
            }
        }
    });

    var horizontalTemplate = _.template('\
            <button class="arrow-left btn" title="left" value="left"><i class="icon-arrow-left"></i></button>\
            <button class="arrow-right btn" title="right" value="right"><i class="icon-arrow-right"></i></button>\
        '),
        verticalTemplate = _.template('\
            <div class="btn-group-vertical">\
                <button class="arrow-up btn" title="up" value="up"><i class="icon-arrow-up"></i></button>\
                <button class="arrow-down btn" title="down" value="down"><i class="icon-arrow-down"></i></button>\
            </div>\
        '),
        allTemplate = _.template('\
            <button class="arrow-left btn" title="left" value="left"><i class="icon-arrow-left"></i></button>\
            <div class="btn-group-vertical">\
                <button class="arrow-up btn" title="up" value="up"><i class="icon-arrow-up"></i></button>\
                <button class="arrow-down btn" title="down" value="down"><i class="icon-arrow-down"></i></button>\
            </div>\
            <button class="arrow-right btn" title="right" value="right"><i class="icon-arrow-right"></i></button>\
        ');

    Controls.Arrows = Zoomdata.MVC.View.extend({

        _horizontalTemplate: horizontalTemplate,
        _verticalTemplate: verticalTemplate,
        _allTemplate: allTemplate,

        defaults: {
            direction: 'all'
        },

        events: {
            'click button[value="up"]': '_onUpClick',
            'click button[value="down"]': '_onDownClick',
            'click button[value="left"]': '_onLeftClick',
            'click button[value="right"]': '_onRightClick'
        },

        initialize: function (options) {
            this.childViews = [];

            this.options = $.extend({}, this.defaults, options);

            switch (this.options.direction) {
                case 'vertical': this.template = this._verticalTemplate;
                    break;
                case 'horizontal': this.template = this._horizontalTemplate;
                    break;
                case 'all':
                default: this.template = this._allTemplate;
                    break;
            }
        },

        render: function () {
            this.$el.html(this.template());

            return this;
        },

        _onUpClick: function () {
            this.trigger('translate:up');
        },
        _onDownClick: function () {
            this.trigger('translate:down');
        },
        _onLeftClick: function () {
            this.trigger('translate:left');
        },
        _onRightClick: function () {
            this.trigger('translate:right');
        }
    });

    Controls.Zoomable = Zoomdata.MVC.View.extend({

        className: 'zoomable',

        defaults: {
            snapToEdges: true,
            maxScale: false,
            minScale: false,
            eventNamespace: 'zoomable:',
            mouseWheel: false
        },

        initialize: function (options) {
            var instance = this;

            this._enabled = true;

            this.childViews = [];

            this.options = $.extend({}, this.defaults, options);

            this.$content = $('<div class="zoomable-content"></div>')
                .appendTo(this.$el);

            if (Zoomdata.Utilities.MODE.NATIVE !== Zoomdata.Utilities.mode()) {
                this._zoomHammer = this.$content.zoomHammer(this.options).data('zoomHammer');

                this.$el.on('zoomable:transformstart', function () {
                    instance.trigger('transform:start', instance);
                });
                this.$el.on('zoomable:transformend', function () {
                    instance.trigger('transform:end', instance);
                });
                this.$el.on('zoomable:transform', function () {
                    instance.trigger('transform:transition', instance);
                });
            }
        },

        disable: function (options) {
            var resizeStart = options ? options.resizeStart : null;

            this._zoomHammer && this._zoomHammer.disable();

            !this.$el.hasClass('zoomable-disabled') && !resizeStart
                ? this.$el.addClass('zoomable-disabled')
                : null;

            this._enabled = false;
        },

        enable: function (options) {
            var resizeStop = options ? options.resizeStop : null;

            this._zoomHammer &&  this._zoomHammer.enable();

            this.$el.hasClass('zoomable-disabled') && !resizeStop
                ? this.$el.removeClass('zoomable-disabled')
                : null;

            this._enabled = true;
        },

        isEnabled: function () {
            return this._enabled;
        },

        getMinScale: function () {
            return this._zoomHammer && this._zoomHammer.parsedScale().min || 1;
        },

        setMinScale: function (value) {
            value || (value = this._zoomHammer.options.minScale);
            this._zoomHammer.options.minScale = value;
            return this;
        },

        getMaxScale: function () {
            return this._zoomHammer && this._zoomHammer.parsedScale().max || 1;
        },

        setMaxScale: function (value) {
            value || (value = this._zoomHammer.options.maxScale);
            this._zoomHammer.options.maxScale = value;
            return this;
        },

        getScale: function () {
            return this._zoomHammer && this._zoomHammer.scale() || 1;
        },

        getTranslation: function () {
            return this._zoomHammer && this._zoomHammer.translate() || null;
        },

        zoom: function (scale, duration, callback) {
            this._zoomHammer && this._zoomHammer.move({scale: scale}, duration, callback);

            return this;
        },

        translate: function (destination, callback) {
            destination = destination || {};

            (typeof destination.x === 'number') ? destination.left = destination.x : null;
            (typeof destination.y === 'number') ? destination.top = destination.y : null;

            delete destination.x;
            delete destination.y;

            this._zoomHammer && this._zoomHammer.move(destination, callback);

            return this;
        },

        refresh: function (duration, callback) {
            this._zoomHammer && this._zoomHammer.adjust(duration, callback);
        },

        render: function (content) {
            this.$content.html(content);

            return this;
        }
    });

    var dialogTemplate = _.template('\
        <div class="modal hide fade <%= customClass %>" >\
            <div class="modal-header">\
                <button title="Close" value="dialog-reject" class="close">&times;</button>\
                <h3 class="dialog-head pull-left"></h3>\
                <div class="clearfix"></div>\
            </div>\
            <div class="modal-body dialog-body">\
            </div>\
            <div class="modal-footer dialog-controls">\
                <button title="<%= rejectButtonTitle %>" value="dialog-reject" class="btn btnNo" aria-hidden="true"><%= rejectButtonLabel %></button>\
                <button title="<%= acceptButtonTitle %>" value="dialog-accept" class="btn btn-primary btnYes"><%= acceptButtonLabel %></button>\
            </div>\
        </div>\
    ');
    Controls.Dialog = Zoomdata.MVC.View.extend({
        template: dialogTemplate,

        defaults: {
            mode: 'dialog',
            draggable: false,
            wide: false,
            modal: 'static',
            rejectButtonLabel: 'Close',
            acceptButtonLabel: 'Accept',
            rejectButtonTitle: 'Close',
            acceptButtonTitle: 'Accept',
            containment: 'body',
            docked: true,
            customClass: ""
        },

        events: {
            'click button[value="dialog-reject"]': 'hide',
            'click button[value="dialog-accept"]': 'accept',
            'click button[value="dialog-back"]': 'back'
        },

        initialize: function (options) {
            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);
            _.bindAll(this, "back");

            var instance = this;
            options = options || {};
            if (options.actions) {
                this.actions = options.actions;
                delete options.actions;
            }
            if (options.template) {
                this.template = options.template;
                delete options.template;
            }
            this.settings = $.extend({}, this.defaults, options);

            // Hides other modal panes
            this.removeOtherDocked();

            $('.modal-backdrop.zd-overlay').remove();
            
            this.setElement(this.template({
                rejectButtonLabel: this.settings.rejectButtonLabel,
                acceptButtonLabel: this.settings.acceptButtonLabel,
                rejectButtonTitle: this.settings.rejectButtonTitle,
                acceptButtonTitle: this.settings.acceptButtonTitle,
                customClass: this.settings.customClass
            }));
            this.$el.appendTo('body');

            this.$el.modal({
                show: false,
                backdrop: this.settings.modal,
                keyboard: false
            });

            switch (this.settings.mode) {
                case 'palette': this.$('.dialog-controls').hide();
                    break;
                case 'alert': this.$('button[value="dialog-accept"]').hide();
                    break;
            }
            this.$head = this.$('.dialog-head');
            this.$body = this.$('.dialog-body');
            this.$actions = $('<div class="zd-dialog-actions btn-group btn-block"></div>');
            this.setActions(options.actions);
            if (this.settings.draggable) {
                this.$el.draggable({
                    handle: this.$('.dialog-head, .header'),
                    start: function () {
                        instance.$el.removeClass('fade');

                        if (typeof instance.settings.draggable.onDragStart == 'function') {
                            instance.settings.draggable.onDragStart.apply(this, arguments);
                        }
                    },
                    stop: function () {
                        instance.$el.addClass('fade');

                        if (typeof instance.settings.draggable.onDragStop == 'function') {
                            instance.settings.draggable.onDragStop.apply(this, arguments);
                        }
                    },
                    cursor: 'move',
                    containment: this.settings.containment
                });
            }
            if (this.settings.wide) {
                this.goWide();
            }
            this.$el.one('hidden', function () {
                instance.trigger('dialog:rejected');
                instance.remove();
                instance.onReject();
                instance.onHide();
            });

            this.listenTo(Zoomdata.eventDispatcher, 'visualization:add', function() {
                this.hide();
            });

            this.listenTo(Zoomdata.eventDispatcher, 'admin-control:clicked', this.removeOtherDocked);
        },

        removeOtherDocked: function(){
            var $dockedPanes = $('.modal.zd-palette.docked');
            var $dockedPopup = $('.modal.zd-infopopup.docked');
            $('.control-rounded').removeClass('active');
            $('.control-button').removeClass('active');
            $('.header-control').removeClass('active');
            $dockedPanes.remove();
            $dockedPopup.remove();
        },

        setActions: function (actions) {
            var instance = this;

            actions
                ? this.actions = actions
                : actions = this.actions;

            this.$actions.empty();

            _.each(this.actions, function (action) {
                var $button = $(actionButton({
                    type: action.type,
                    label: action.label,
                    title: action.title || action.label
                }));

                instance.$actions.append($button);

                $button.on('click', action.callback);
                $button.css({
                    width: 100/instance.actions.length + '%'
                });
            });

            return this;
        },

        clearActions: function () {
            this.actions = null;
            this.$actions.empty();

            return this;
        },
        render: function (content, head) {
            this.$el.attr('data-name',head);
            this.$body.empty();
            this.$head.empty();

            this.$body.append(content);

            if (head !== undefined) {
                this.$head.append(head);
                this.$head.show();
            } else {
                this.$head.hide();
            }
            

            this.$el.modal('show');

            if (this._onFullScreenMode()) {
                this.zIndex = this.zIndex || this.$el.zIndex();
                this.$el.zIndex(this.zIndex + 10);
                this.listenToOnce(Zoomdata.eventDispatcher, 'widget:fullOff', this.hide);
            }          

            this.$el.find('button[value="dialog-back"]').on("click", this.back);

            this.actions && this.$(this.$actions).length == 0
                ? this.$body.after(this.$actions)
                : null;

            this.delegateEvents();

            Zoomdata.eventDispatcher.trigger('dialog:show');

            return this;
        },

        goWide: function () {
            !this.$el.hasClass('wide')
                ? this.$el.addClass('wide')
                : null;

            this.resetSizes();
            return this;
        },

        goNormal: function () {
            this.$el.hasClass('wide')
                ? this.$el.removeClass('wide')
                : null;

            this.resetSizes();

            return this;
        },

        resetSizes: function () {
            this.$el.css({
                width: '',
                height: ''
            });

            this.$body.css({
                width: '',
                height: ''
            });

            this.adjustBodySizes();
            return this;
        },

        adjustBodySizes: function () {
            var $element = this.$el,
                $container = $(this.settings.containment),
                outerOffset = $container.offset(),
                offset = this.$el.offset(),
                innerOffset = offset,
                css = {};
            offset.left += 44;
            offset.top += 44;
            innerOffset.left = offset.left - outerOffset.left;
            innerOffset.top = offset.top - outerOffset.top;
            innerOffset.right = $container.width() - innerOffset.left - $element.width();
            innerOffset.bottom = $container.height() - innerOffset.top - $element.height();

            innerOffset.left < 0
                ? (css.maxWidth += innerOffset.left,
                    css.marginLeft = parseInt(this.$el.css('margin-left')) - innerOffset.left)
                : null;

            innerOffset.right < 0
                ? (css.maxWidth += innerOffset.right,
                    css.marginRight = parseInt(this.$el.css('margin-right')) - innerOffset.right)
                : null;

            css.maxHeight = $container.height() - innerOffset.top - offset;
            this.$el.css(css);

            this.$body.css({
                maxHeight: css.maxHeight
            });
        },
        position: function (options) {
            var modal = this.$el.data().modal;
            options = options || {};

            if (modal) {
                modal.$element.css({
                    left: options.left || 'auto',
                    top: options.top || 'auto',
                    right: options.right || 'auto',
                    bottom: options.bottom || 'auto'
                });
            }

            if (options.of || options.my || options.at || options.collision) {
                this.$el.position({
                    of: options.of,
                    my: options.my,
                    at: options.at,
                    collision: options.collision,
                    within: $(this.settings.containment),
                    using: options.using
                });

                this.adjustBodySizes();
            }

            return this;
        },

        positionInToolbar: function (item) {

            this.position({
                of: item,
                my: 'right+40px bottom-20px',
                at: 'center top',
                collision: 'flip flip'
            });

            var $element = this.$el,
                $container = $(this.settings.containment),
                itemFrame = item.getBoundingClientRect(),
                width = document.body.offsetWidth,
                height = document.body.offsetHeight,
                spaceRight = width - (itemFrame.width + itemFrame.left),
                spaceLeft = itemFrame.left,
                elementFrame = { left: 0, top: itemFrame.top, width: 0, height: 0 },
                maxWidth = parseInt($element.css("maxWidth"), 10),
                arrow = { left: 10, top: -35 };

            if (spaceLeft > spaceRight) {
                // Position to the right
                elementFrame.width = spaceLeft - 120;
            }
            else {
                // Position to the left
                elementFrame.width = spaceRight - 40;
            }

            elementFrame.left = (itemFrame.width + itemFrame.left) - 40;

            $element.css({ margin: 0,
                left: elementFrame.left + "px",
                top: elementFrame.top + 50 + "px",
                width: elementFrame.width  + "px" 
            });

            this.$pointer.css({ 
                'left': arrow.left + "px", 
                '-webkit-transform': 'scale(1, -1)',
                '-moz-transform': 'scale(1, -1)',
                '-ms-transform': 'scale(1, -1)'
            });
        },

        onBeforeHide: $.noop,

        hide: function () {
            if (this.onBeforeHide() !== false) {
                var instance = this;
                if(this.$el.hasClass('rail-control')) {
                    this.$el.animate({
                        'left': this.$el.width() * -1
                    }, 300, function() {
                        instance.$el.modal('hide');
                    });
                } else {
                    this.$el.fadeOut(200, function() {
                        instance.$el.modal('hide');
                    });
                }
            }
        },

        onReject: $.noop,

        onBeforeAccept: $.noop,

        accept: function () {
            var instance = this;

            if (this.onBeforeAccept() !== false) {
                this.$el.off('hidden');
                this.$el.one('hidden', function () {
                    instance.trigger('dialog:accepted');
                    instance.remove();
                    instance.onAccept();
                    instance.onHide();
                });

                this.$el.modal('hide');
            }
        },

        back: function() {
            this.onBack();
        },

        _onFullScreenMode: function(){
            return $('.fullScreenView').is(':visible');
        },

        onAccept: $.noop,
        onHide: $.noop,
        onBack: $.noop
    });

    var paletteTemplate = _.template('\
        <div class="modal hide zd-palette <%= customClass %>">\
            <div class="modal-header zd-palette-titlebar">\
                <button title="Close" value="dialog-reject" class="zd icon close" /> \
                <button title="" value="dialog-back" class="zd icon back" style="display:none;" /> \
                <div class="zd icon header"/> \
                <h3 class="dialog-head zd-palette-header"></h3>\
                <div class="clearfix"></div>\
            </div>\
            <div class="modal-body dialog-body zd-palette-body">\
            </div>\
            <div class="zd-palette-background">\
            </div>\
            <div class="zd-palette-background small">\
            </div>\
        </div>\
    '),
        actionButton = _.template('\
            <button title="<%=title%>" class="zd btn btn-<%=type%>"><%=label%></button>\
        ');
    Controls.Palette = Controls.Dialog.extend({
        template: paletteTemplate,
        events : {
            'mousedown .modal-header' : 'moveToFront',
            'click button[value="dialog-reject"]': 'hide',
            'click .zd-palette-background': 'hideDocked',
            'keypress input': 'keyEnterPressed'
        },
        defaults: {
            template: dialogTemplate,
            mode: 'palette',
            draggable: true,
            docked: false,
            modal: true,
            containment: 'body',
            minWidth: 250,
            minHeight: 100,
            defaultWidth: 264
        },

        keyEnterPressed: function(e){
            Zoomdata.Views.SearchBox.prototype.keyEnterPressed.apply(e, arguments);
        },

        initialize: function (options) {
            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);
            var instance = this;
            options = options || {};
            _.bindAll(this, "showBackButton", "hideBackButton");

            Controls.Dialog.prototype.initialize.apply(this, arguments);

            this.$body.css({
                maxHeight: 'none'
            });

            if ($(this.settings.containment).length) {
                this.$body.css({
                    height: $(this.settings.containment).height() - this.$el.offset().top  - 79
                });
            }


            this.$el.on('dragstop', function () {
                instance.adjustBodySizes();
            });

            if (this.options.draggable) {
                this.setDragEvents();
            }

        },

        render: function () {
            Controls.Dialog.prototype.render.apply(this, arguments);

            this.$el
                .resizable({
                    containment: '.zd-main',
                    alsoResize: this.$body,
                    minWidth: this.settings.minWidth,
                    minHeight: this.settings.minHeight
                })
                .data()
                .modal.$backdrop
                .addClass('zd-overlay');

            !this.isDocked()
                ? this.undock()
                : null;

            this.actions
                ? this.$body.append(this.$actions)
                : null;

            return this;
        },

        setDragEvents: function() {
            var instance = this,
                defaultPalettePosition = {
                    left : Zoomdata.main.$section.find('.leftPane').width()+2,
                    top: Zoomdata.main.$header.height()
                };
                
            this.palettePosition = defaultPalettePosition;

            this.settings.draggable = {
                onDragStart: function(e) {
                    instance.$el.removeClass('docked');
                    instance.$el.addClass('undocked');
                    instance.settings.docked = false;
                    instance.$('div.zd-palette-background').remove();
                }
            };

        },

        isDocked: function () {
            return this.settings.docked;
        },

        undock: function () {
            this.$el.removeClass('docked');
            !this.$el.hasClass('undocked')
                ? this.$el.addClass('undocked')
                : null;

            this.$('div.zd-palette-background').hide();

            this.settings.docked = false;

            return this;
        },

        dock: function (position) {
            var that = this;

            this.position(position);

            this.$el.removeClass('undocked');
            !this.$el.hasClass('docked')
                ? this.$el.addClass('docked')
                : null;


            this.$('div.zd-palette-background').show();

            this.settings.docked = true;

            setFirstSize();

            function setFirstSize() {
                var redocked = !that.$('div.zd-palette-background').length > 0;
                if (redocked) {
                    that.$el.css({
                        width: that.settings.defaultWidth,
                        height: $(that.settings.containment).height()
                    });
                    that.$body.css({
                        width: that.settings.defaultWidth - 24,
                        height: $(that.settings.containment).height() - that.$head.parent().height() - 24 //2*that.$el.offset().top
                    });
                }
            }

            return this;
        },

        hide : function() {
            this.$el.removeClass('active');
            this.$el.removeClass('fade');
            Controls.Dialog.prototype.hide.apply(this, arguments);
        },

        hideDocked: function() {
            if (this.settings.docked){
                this.hide();
            }
        },

        moveToFront: function(){
            if (this._onFullScreenMode()) {
                $('.zd-palette').zIndex($('.leftPane').zIndex() - 2);
                this.$el.zIndex($('.leftPane').zIndex() - 1);
            } else {
                $('.zd-palette').zIndex(1018);
                this.$el.zIndex(1019);
            }
        },

        showBackButton: function() {
            this.$('button[value="dialog-back"]').show();
        },

        hideBackButton: function() {
            this.$('button[value="dialog-back"]').hide();
        },

        remove: function () {
            this.clearActions();
            Zoomdata.Controls.Dialog.prototype.remove.apply(this, arguments);
        }
    });

    var infoPopupTemplate = _.template('\
        <div class="modal hide zd-infopopup <%= customClass %>" >\
            <div class="modal-header zd-infopopup-titlebar">\
                <button title="Close" value="dialog-reject" class="zd icon close" />\
                <button title="" value="dialog-back" class="zd icon back" style="display:none;" />  \
                <h3 class="dialog-head zd-infopopup-header"></h3>\
                <div class="clearfix"></div>\
            </div>\
            <div class="modal-body dialog-body zd-infopopup-body">\
            </div>\
            <div class="zd-infopopup-background">\
            </div>\
            <div class="zd-infopopup-background small">\
            </div>\
        </div>\
    ');

    Controls.InfoPopup = Controls.Dialog.extend({
        template: infoPopupTemplate,
        events: {
            'click .zd-infopopup-background': 'hide',
            'keypress input': 'keyEnterPressed'
        },
        defaults: {
            autohide: true,
            mode: 'palette',
            draggable: false,
            resizable: false,
            modal: false,
            containment: 'body'
        },

        keyEnterPressed: function(e){
            Controls.Palette.prototype.keyEnterPressed.apply(e, arguments);
        },

        initialize: function (options) {
            var instance = this;

            this.options = $.extend({}, this.options, options);

            this._lastPostiton = null;
            this._repostionCallback = _.debounce(reposition, 300);

            $.extend(this.events, Controls.Dialog.prototype.events);
            Controls.Dialog.prototype.initialize.apply(this, arguments);
            this.$pointer = $('<div class="zd-infopopup-pointer"><div class="zd-infopopup-pointer-arrow"></div> </div>');

            $('body').one("dragstart", function () { instance.hide() });
            this.$el.on('dragstart', false);

            $(window).on('resize', this._repostionCallback);

            if (this.options.autohide == true ||
                (typeof this.options.autohide == 'string' && this.options.autohide.search('onStop') !== -1))
                this.listenTo(Zoomdata.eventDispatcher, 'visualization:stop', this.hide);

            function reposition() {
                instance._lastPostiton
                    ? instance.position()
                    : null;
            }
        },

        render: function () {
            Controls.Dialog.prototype.render.apply(this, arguments);
            this.$('.zd-infopopup-background').show();

            this.$el.addClass('docked');

            // Fix for Mac scroll issue, see ZD-5019
            this.$el.on("mousewheel", "textarea", function(ev, delta, deltaX, deltaY) {
                ev.preventDefault();
                var top = $(this).scrollTop();
                $(this).scrollTop(top + deltaY);
            });

            return this;
        },

        position: function (options) {
            var instance = this;

            options = options || this._lastPostiton || {};
            this._lastPostiton = options;
            options.using = options.using || using;
            
            return Controls.Dialog.prototype.position.call(this, options);

            function using(position, data) {
                instance.$el.css(position);
                instance._showPointer(data);
            }
        },

        _showPointer: function (data) {
            var pointerWidth = this.options.pointerWidth ? this.options.pointerWidth : 14,
                popup = data.element,
                target = data.target,
                adjust = {},
                position = 'behind',
                transparentBorder = pointerWidth + 'px solid transparent',
                filledBorder = pointerWidth + 'px solid rgba(50, 50, 50, 0.9)',
                popupRadius = parseInt(this.$el.css('border-radius'));
            
            target.center = {
                left: target.left + target.width/2,
                top: target.top+ target.height/2
            };
            popup.center = {
                left: popup.left + popup.width/2,
                top: popup.top+ popup.height/2
            };

            adjust.vertical = target.center.top - popup.center.top;

            adjust.vertical < 0
                ? adjust.vertical = adjust.vertical +'px'
                : adjust.vertical = '+'+adjust.vertical+'px';

            adjust.horizontal = target.center.left - popup.center.left;
            adjust.horizontal < 0
                ? adjust.horizontal = adjust.horizontal+'px'
                : adjust.horizontal = '+'+adjust.horizontal+'px';

            if (popup.left + popup.width <= target.center.left) {
                position += ' right';
            }
            if (popup.left >= target.center.left) {
                position += ' left';
            }
            if (popup.top + popup.height <= target.center.top) {
                position += ' bottom';
            }
            if (popup.top >= target.center.top) {
                position += ' top';
            }

            position = position.split(' ').splice(1);
            if (position.length == 1) {
                this.$pointer.appendTo(this.$el);
                switch (position[0]) {
                    case 'left':
                        this.$pointer
                            .css({
                                "border-top": transparentBorder,
                                "border-bottom": transparentBorder,
                                "border-right": filledBorder
                            })
                            .position({
                                my: 'right center',
                                at: 'left center'+adjust.vertical,
                                of: this.el
                            });
                        if (target.width === 0) {
                            data.element.element.css({
                                left: '+=20'
                            });
                        }
                        break;
                    case 'right':
                        this.$pointer
                            .css({
                                "border-top": transparentBorder,
                                "border-bottom": transparentBorder,
                                "border-left": filledBorder
                            })
                            .position({
                                my: 'left center',
                                at: 'right center'+adjust.vertical,
                                of: this.el
                            });
                        if (target.width === 0) {
                            data.element.element.css({
                                left: '-=20'
                            });
                        }
                        break;
                    case 'top':
                        this.$pointer
                            .css({
                                "border-top": filledBorder,
                                "border-right": transparentBorder,
                                "border-left": transparentBorder
                            })
                            .position({
                                my: 'center bottom',
                                at: 'center'+adjust.horizontal+' top',
                                of: this.el
                            });
                        break;
                    case 'bottom':
                        this.$pointer
                            .css({
                                "border-right": transparentBorder,
                                "border-top": filledBorder,
                                "border-left": transparentBorder
                            })
                            .position({
                                my: 'center top',
                                at: 'center'+adjust.horizontal+' bottom',
                                of: this.el
                            });
                        break;
                }

                var pointer = {};
                pointer.top = parseInt(this.$pointer.css('top'));
                pointer.left = parseInt(this.$pointer.css('left'));
                pointer.offset = this.$pointer.offset();

                switch (position[0]) {
                    case 'left':
                        break;
                    case 'right':
                        if (popup.top + popupRadius > pointer.offset.top) {
                            this.$pointer.css('top', pointer.top + popupRadius);
                        }
                        break;
                    case 'top':
                        break;
                    case 'bottom':
                        if (popup.left + popupRadius > pointer.offset.left) {
                            this.$pointer.css('left', pointer.left + popupRadius);
                        }
                        break;
                }
            }
        },

        remove: function () {
            $(window).off('resize', this._repostionCallback);
            Controls.Dialog.prototype.remove.apply(this, arguments);
        }
    });

    var smallPopupTemplate = _.template('\
        <div class="modal hide zd-smallpopup <%= customClass %>" >\
            <div class="modal-body dialog-body zd-smallpopup-body">\
            </div>\
            <div class="zd-smallpopup-background">\
            </div>\
            <div class="zd-smallpopup-background small">\
            </div>\
        </div>\
    ');

    Controls.SmallPopup = Controls.Dialog.extend({
        template: smallPopupTemplate,
        events: {
            'click .zd-smallpopup-background': 'hide',
            'keypress input': 'keyEnterPressed'
        },
        defaults: {
            mode: 'palette',
            draggable: false,
            resizable: false,
            modal: false,
            containment: 'body'
        },

        keyEnterPressed: function(e){
            Controls.Palette.prototype.keyEnterPressed.apply(e, arguments);
        },

        initialize: function () {
            var instance = this;

            this._lastPostiton = null;
            this._repostionCallback = _.debounce(reposition, 300);

            $.extend(this.events, Controls.Dialog.prototype.events);
            Controls.Dialog.prototype.initialize.apply(this, arguments);
            this.$pointer = $('<div class="zd-smallpopup-pointer"><div class="zd-smallpopup-pointer-arrow"></div></div>');

            $('body').one("dragstart", function () { instance.hide() });
            this.$el.on('dragstart', false);

            $(window).on('resize', this._repostionCallback);

            this.listenTo(Zoomdata.eventDispatcher, 'visualization:stop', this.hide);

            function reposition() {
                instance._lastPostiton
                    ? instance.position()
                    : null;
            }
        },

        render: function () {
            Controls.Dialog.prototype.render.apply(this, arguments);
            this.$('.zd-smallpopup-background').show();

            // Fix for Mac scroll issue, see ZD-5019
            this.$el.on("mousewheel", "textarea", function(ev, delta, deltaX, deltaY) {
                ev.preventDefault();
                var top = $(this).scrollTop();
                $(this).scrollTop(top + deltaY);
            });

            return this;
        },

        position: function (options) {
            var instance = this;

            options = options || this._lastPostiton || {};
            this._lastPostiton = options;
            options.using = options.using || using;

            return Controls.Dialog.prototype.position.call(this, options);

            function using(position, data) {
                position.top -= options.pointerTop || 0;
                instance.$el.css(position);
                instance._showPointer(data);
            }
        },

        _showPointer: function (data) {
            var popup = data.element,
                target = data.target,
                adjust = {},
                position = 'behind',
                transparentBorder = '10px solid transparent',
                filledBorder = '10px solid rgb(230, 230, 230)';

            target.center = {
                left: target.left + target.width/2,
                top: target.top+ target.height/2
            };
            popup.center = {
                left: popup.left + popup.width/2,
                top: popup.top+ popup.height/2
            };

            adjust.vertical = target.center.top - popup.center.top;
            adjust.vertical < 0
                ? adjust.vertical = adjust.vertical+'px'
                : adjust.vertical = '+'+adjust.vertical+'px';

            adjust.horizontal = target.center.left - popup.center.left;
            adjust.horizontal < 0
                ? adjust.horizontal = adjust.horizontal+'px'
                : adjust.horizontal = '+'+adjust.horizontal+'px';


            if (popup.left + popup.width < target.center.left) {
                position += ' right';
            }
            if (popup.left > target.center.left) {
                position += ' left';
            }
            if (popup.top + popup.height < target.center.top) {
                position += ' bottom';
            }
            if (popup.top > target.center.top) {
                position += ' top';
            }

            position = position.split(' ').splice(1);
            if (position.length == 1) {
                this.$pointer.appendTo(this.$el);
                switch (position[0]) {
                    case 'left':
                        this.$pointer
                            .css({
                                "border-top": transparentBorder,
                                "border-bottom": transparentBorder,
                                "border-right": filledBorder
                            })
                            .position({
                                my: 'right center',
                                at: 'left center'+adjust.vertical,
                                of: this.el
                            });
                        break;
                    case 'right':
                        this.$pointer
                            .css({
                                "border-top": transparentBorder,
                                "border-bottom": transparentBorder,
                                "border-left": filledBorder
                            })
                            .position({
                                my: 'left center',
                                at: 'right center'+adjust.vertical,
                                of: this.el
                            });
                        break;
                    case 'top':
                        this.$pointer
                            .css({
                                "border-top": filledBorder,
                                "border-right": transparentBorder,
                                "border-left": transparentBorder
                            })
                            .position({
                                my: 'center bottom',
                                at: 'center'+adjust.horizontal+' top',
                                of: this.el
                            });
                        break;
                    case 'bottom':
                        this.$pointer
                            .css({
                                "border-right": transparentBorder,
                                "border-top": filledBorder,
                                "border-left": transparentBorder
                            })
                            .position({
                                my: 'center top',
                                at: 'center'+adjust.horizontal+' bottom',
                                of: this.el
                            });
                        break;
                }
            }
        },

        remove: function () {
            $(window).off('resize', this._repostionCallback);
            Controls.Dialog.prototype.remove.apply(this, arguments);
        },

        closeModal: function() {
            this.$el.fadeOut(300);
        }

    });

    Controls.PalettePopup = Controls.InfoPopup.extend({

        initialize: function(options){
            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);
            _.bindAll(this, "showBackButton", "hideBackButton");

            Controls.InfoPopup.prototype.initialize.apply(this, arguments);
            this.$el.on('dragstart', false);

            return this;
        },

        render: function(){
            var offset = {
                top: 12,
                bottom: 66
            };
            Controls.InfoPopup.prototype.render.apply(this, arguments);
            this.$el.addClass('zd-palettepopup');

            if (this.settings.handlers) {
                this.showHandlers();
            }

            this.$body.css('max-height', this.options.containment.height() - offset.top - offset.bottom - (this.$el.outerHeight() - this.$body.height()));

            return this;
        },

        showHandlers: function(){
            var instance = this;
            this.handlers = this.options.handlers;
            this.$footer = $('<div class="zd-infopopup-footer"></div>');
            this.$el.append(this.$footer);

            _.each(this.handlers, function (handler){
                var tagName = handler.tagName || 'button',
                    $button = $('<'+tagName+' class="">'+handler.title+'</'+tagName+'>');

                if (handler.icon)       $button.prepend('<i class="zd icon '+handler.icon+'"></i>');
                if (handler.className)  $button.addClass(handler.className);

                $button.click(function(){
                    handler.callback();
                });

                instance.$footer.append($button);

            });
        },

        showBackButton: function() {
            Zoomdata.Controls.Palette.prototype.showBackButton.apply(this, arguments);
            return this;
        },

        hideBackButton: function() {
            Zoomdata.Controls.Palette.prototype.hideBackButton.apply(this, arguments);
            return this;
        }

    });

    Controls.DetailsPopup = Controls.Dialog.extend({
        template: infoPopupTemplate,
        events: {
            'click .zd-infopopup-background': 'hide'
        },
        defaults: {
            mode: 'palette',
            draggable: false,
            resizable: false,
            modal: false,
            containment: 'body'
        },

        initialize: function () {
            $.extend(this.events, Controls.Dialog.prototype.events);
            Controls.Dialog.prototype.initialize.apply(this, arguments);
        }
    });

    var sidePaneTemplate = _.template('\
        <div> \
            <div class="zd-side-pane">\
                <div class="zd-side-pane-header"/>\
                <button value="closeSidePane" class="close">&times;</button>\
                <div class="zd-side-pane-body"/>\
            </div>\
        </div> \
    ');

    var sidePaneTemplateModal = _.template('\
        <div class="zd-modal sidepane"> \
            <div class="zd-side-pane">\
                <div class="zd-side-pane-loading"/>\
                <div class="zd-side-pane-header"/>\
                <div class="zd-side-pane-body"/>\
            </div>\
        </div> \
    ');

    Controls.SidePane = Zoomdata.MVC.View.extend({

        initialize: function () {
            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);
            _.bindAll(this, "render", "hide", "show", "close", "getHeader", "visible");
            var instance = this;
            this.hasCloseButton = this.options.hasCloseButton;
            this.template = this.hasCloseButton? sidePaneTemplate : sidePaneTemplateModal;
            this.setElement(this.template());
            this.$el.appendTo('body');
            this.hide();
            this.$loading = this.$('.zd-side-pane-loading');
            this.$body = this.$('.zd-side-pane-body');
            this.$header = this.$('.zd-side-pane-header');
            this.$closeButton = this.$('.close');
            function manualHide(){
                var currentUser = Zoomdata.user ||  new Zoomdata.Models.User();
                currentUser.bootstrap().done(function() {
                    var name = currentUser.get('name');
                    window.localStorage['sidePaneHasBeenClosedBy' + name] = 'true';
                });
                instance.$el.hide();
                Zoomdata.eventDispatcher.trigger('sidepane:manualhide');
            }
            if (!this.hasCloseButton) {
                this.$(".zd-side-pane").on("click", function(event) {
                    event.stopPropagation();
                });
                this.$el.on("click", manualHide);
            }
        },

        events: {
            'click .close': 'hide'
        },

        render: function (content) {
            this.$body.empty();
            this.$body.append(content);

            this.delegateEvents();

            return this;
        },
        hide: function() {
            this.$el.hide();
        },
        show: function() {
            $('.zd-side-pane').parent('div').hide();
            this.$el.show();
            this.$el.find("input").blur();
        },
        close: function () {
            this.$el.remove();
        },
        getHeader: function() {
            return this.$header;
        },
        visible: function() {
            return this.$el && this.$el.is(':visible');
        }

    });


    var confirmMessageTemplate = _.template('\
        <span><%= message %></span>\
        <i title="<%= acceptTitle%>" class="icon-ok icon-white"></i>\
        <i title="<%= cancelTitle%>" class="icon-remove icon-white"></i>\
    ');
    Controls.ConfirmMessage = Zoomdata.MVC.View.extend({

        tagName: 'span',

        className: 'label label-warning pull-right confirmMessage',

        defaults: {
            template: confirmMessageTemplate,
            message: 'Warning',
            acceptTitle: 'Accept',
            cancelTitle: 'Cancel'
        },

        events: {
            'click .icon-ok': 'accept',
            'click .icon-remove': 'cancel'
        },

        initialize: function (options) {
            this.settings = $.extend({}, this.defaults, options);

            this._deferred = $.Deferred();
            this.result = this._deferred.promise();
        },

        accept: function () {
            var instance = this;

            this.$el.fadeOut(function () {
                instance.remove();
                instance._deferred.resolve();
            });

            return false;
        },
        cancel: function () {
            var instance = this;

            this.$el.fadeOut(function () {
                instance.remove();
                instance._deferred.reject();
            });

            return false;
        },
        render: function () {
            this.$el.html(this.settings.template({
                message: this.settings.message,
                acceptTitle: this.settings.acceptTitle,
                cancelTitle: this.settings.cancelTitle
            }));
            this.$el.hide().fadeIn();
            this.delegateEvents();

            return this;
        }
    });

    Controls.Notification = Zoomdata.MVC.View.extend({
        defaults: {
            delay: 3000,
            type: 'info'
        },

        events: {
            'click': 'remove'
        },

        initialize: function (options) {
            options = options || {};

            if (options.template) {
                this.template = options.template;
                delete options.template;
            }

            this.options = $.extend({}, this.defaults, options);

            this.$el
                .addClass(('zd notification alert alert-' + this.options.type))
                .appendTo('body')
                .hide();
        },

        render: function (content) {
            var instance = this;

            this.empty();
            this.$el.append(content);

            if (this.options.type != "error") {
                setTimeout(function () {
                    instance.remove();
                }, this.options.delay);
            } else {
                this.$el.append('<div class="closeError zd icon remove"></div>');
            }

            this.$el.slideDown();

            return this;
        },

        remove: function () {
            var instance = this,
                args = arguments;

            this.$el.slideUp(function () {
                Zoomdata.MVC.View.prototype.remove.apply(instance, args);
            });
        }
    });

    Controls.Popover = (function () {
        var Popover = Zoomdata.MVC.View.extend({
            contentView: null,
            _data: false,
            _container: false,
            _stopHide: false,
            _setEvents: false,
            _setHeadEvents: false,
            _buttons:{},
            _headTemplate: '<span style="overflow: hidden;display: block;"><%=name%></span>',
            _bodyTemplate: '<div class="span4" style="margin-left:0"> \
                    <div class="row-fluid">   \
                        <div class="popoverWindow" id="popowerWindow_1" style="min-height:<%=height%>px;">\
                        <div style="height: <%=height-40%>px; overflow: auto;"> \
                        <% _.each(data, function(period) { %>\
                            <div class="span12 popoverSmallHeader">\
                                <%=period.name%> \
                            </div>  \
                            <div class="span12 popoverDataInfo">\
                                Time Window \
                                <div><%=period.time%></div> \
                            </div>  \
                            <% _.each(period.values, function(val) { %>\
                                <div class="span12 popoverDataInfo">\
                                    <%=val.name%> \
                                    <div><%=val.value%></div> \
                                </div>  \
                            <%});%>\
                        <%});%>\
                        </div> \
                            <div class="span12 popoverFooter">\
                                <span></span>\
                                <div class="btn-group">\
                                    <button class="btn<% if (buttons.zoom == false) {%> dis<%}%>" data-type="zoom">Zoom In</button>\
                                    <button class="btn<% if (buttons.details == false) {%> dis<%}%>" data-type="details">Details</button>\
                                    <button class="btn<% if (buttons.trend == false) {%> dis<%}%>" data-type="trend" data-name="_ts">Trend</button>\
                                    <% if (buttons.twitter) {%><button class="btn" data-type="twitter" data-name="_ts">Twitter</button><%}%>\
                                </div>\
                            </div>\
                        </div>\
                        <div class="popoverWindow" id="popowerWindow_2" style="display:none;min-height:<%=height%>px;">\
                            <div style="height: <%=height%>px; overflow: auto;"> \
                                <% _.each(zoomInFields, function(val) { %>\
                                    <div class="span12 popoverDataInfo">\
                                        <div class="popoverZoomTo" data-name="<%=val.name%>"><%=val.label%></div> \
                                    </div>  \
                                <%});%>\
                            </div>\
                        </div>\
                        \
                    </div>\
                </div>',
            initialize: function(options) {
                Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);
                _.bindAll(this, 'render', 'buildPopoverHeader', 'buildPopoverBody', 'show', 'hide', 'setTemplate', 'data', 'stopHide');

                options = $.extend({
                    setEvents: false,
                    setHeadEvents: false,
                    body: false,
                    head: false,
                    container: $('body'),
                    buttons:false
                },options);
                this._buttons = {
                    zoom: true,
                    details: false,
                    trend: false,
                    twitter: false
                };
                var that = this;
                if(typeof options.setEvents === "function") this._setEvents = options.setEvents;
                if(typeof options.setHeadEvents === "function") this._setHeadEvents = options.setHeadEvents;
                if(options.body) this._bodyTemplate = options.body;
                if(options.buttons) this._buttons = $.extend(this._buttons, options.buttons);
                if(options.head) this._headTemplate = options.head;
                if(options.container) this._container = options.container;
                $("#popoverElement").remove();
                $("body").append($('<div>').attr("id","popoverElement").css({
                    position: "absolute",
                    width: 1,
                    height: 1,
                    display: "none",
                    "z-index": 1010
                }).append("<div>"));
                return this.render();
            },

            render: function() {
                var that = this;

                $("#popoverElement>div").popover({
                    html: true,
                    title: function(){
                        return that.buildPopoverHeader();
                    },
                    content: function(){
                        return that.buildPopoverBody();
                    }
                }).on("show", function() {
                        console.log("popover shown");
                        $(".zd-main-section").off('click').on('click', function(event) {
                            that.hide(event);
                        });
                        Zoomdata.eventDispatcher.trigger('freezeTime');
                    }).on("hide", function() {
                        console.log("popover hidden");
                        $(".zd-main-section").off('click');
                        Zoomdata.eventDispatcher.trigger('unfreezeTime');
                    });

                Zoomdata.eventDispatcher.trigger('rendered');

                this.listenToOnce(Zoomdata.eventDispatcher, 'visualization:stop', function() {
                    $("#popoverElement").remove();
                });
                
                return this;
            },

            buildPopoverHeader: function(){
                var el = $(_.template(this._headTemplate, this._data));
                if(typeof this._setHeadEvents == "function") this._setHeadEvents(el,this._data);
                return el;
            },

            buildPopoverBody: function(){
                this._data.buttons = this._buttons;
                this._data.height = Math.max(250,Math.min(500,$('body').height()/2));
                var el = $(_.template(this._bodyTemplate, this._data));
                if(typeof this._setEvents == "function") this._setEvents(el,this._data);
                return el;
            },
            hideDelay:false,
            show: function(data,el) {
                var atX = el.x /*+ el.width/2*/,
                    atY = el.y /*+ el.height/2*/;
                //console.log(el, window.event);
                this._data = data;
                var that = this;
                $("#popContainer").attr('class', Zoomdata.main.$section.width()<500 ? "span3":"span4");
                $("#popoverElement .popoverFooter .btn-group").css('paddingLeft', Zoomdata.main.$section.width()<500 ? "6%":"15%");
                
                var bodyHeight = $('body').height(),
                    $popoverElement = null,
                    $popoverElementPopover = null,
                    $arrow = null,
                    arrowTop = 0,
                    popoverElementTop = 0;
                
                var topOffsetPopap = Zoomdata.Utilities.MODE.WIDGET !== Zoomdata.Utilities.mode() && bodyHeight >= 450 ? 300 : 10;
                var bottomOffsetPopap = Zoomdata.Utilities.MODE.WIDGET !== Zoomdata.Utilities.mode() && bodyHeight >= 450 ? 50 : 10;
                
                popoverElementTop = Math.max(200, Math.min(Math.max(atY, topOffsetPopap), bodyHeight - bottomOffsetPopap));
                $popoverElement = $("#popoverElement");
                $popoverElement.css({
                    top: popoverElementTop,
                    left: atX
                }).show().find('div').popover("show");
                
                $popoverElementPopover = $("#popoverElement .popover");
                $arrow = $("#popoverElement .arrow");
                
                if(atX + $popoverElementPopover.width()*1 > Zoomdata.main.$section.width()+$("#popContainer").width()/2){
                    $popoverElement.css("left",Math.max(10,atX - $popoverElementPopover.width()-10)).find('.popover').removeClass('right').addClass('left');
                }
                
                var h = $("#popoverElement>.popover").height();
                if(popoverElementTop + h/2 > bodyHeight - bottomOffsetPopap){
                    popoverElementTop = bodyHeight - bottomOffsetPopap - h/2;
                    $popoverElement.css("top", popoverElementTop);
                }
                
                arrowTop = atY - (popoverElementTop + $popoverElementPopover.position().top);
                var arrowMaxTop = h,
                    borderRadius = 2,
                    arrowHeight = $arrow[0].offsetHeight;
                arrowTop = Math.min(arrowMaxTop - arrowHeight / 2 - borderRadius, arrowTop);
                arrowTop = Math.max(arrowHeight / 2 + borderRadius*2, arrowTop);
                $arrow.css('top', arrowTop);
                
                this.hideDelay  = true;
                setTimeout(function(){
                    that.hideDelay = false;
                },200);
            },
            hide: function(e){
                if(this._stopHide){
                    this._stopHide = false;
                    return;
                }
                if(undefined !== e){
                    if ($(e.target).parents(".popover").length || $(e.target).parent(".bar").length || this.hideDelay) {
                        return;
                    }
                }
                $("#popoverElement>div:first").popover("hide");
            },
            setTemplate: function(template, isHead){
                if(undefined !== isHead && isHead){
                    this._headTemplate = template;
                }else{
                    this._bodyTemplate = template;
                }
            },
            data: function(){
                return this._data;
            },
            stopHide: function(){
                this._stopHide = true;
            }
        });

        return Popover;
    }());

    Controls.TwittViewer = Zoomdata.MVC.View.extend({
        contentView: null,
        _data: false,
        _stopHide: false,
        _setEvents: false,
        _bodyTemplate: '<div></div>',
        initialize: function(options) {
            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);
            options = $.extend({
                setEvents: false,
                body: false
            },options);
            var that = this;
            if(typeof options.setEvents == "function") this._setEvents = options.setEvents;
            if(options.body) this._bodyTemplate = options.body;
            $("#twittViewerElement").remove();
            $("body").append($('<div>')
                .attr("id","twittViewerElement")
                .attr("class","modal hide fade")
                .attr("tabindex","-1")
                .attr("role","dialog")
                .attr("aria-labelledby","myModalLabel")
                .attr("aria-hidden","true")
            );
            return this.render();
        },

        render: function() {
            $("#twittViewerElement").html(this.buildTwittViewerBody());
            $("#twittViewerElement").modal({
                show: false
            });
            return this;
        },

        buildTwittViewerBody: function(){
            console.log(this._data);
            var el = $(_.template(this._bodyTemplate, this._data)());
            if(typeof this._setEvents == "function") this._setEvents(el,this._data);
            return el;
        },
        show: function(data,el){
            //el = $(el);
            this._data = data;
            var that = this;
            var hideTwittViewerEvent = function(e){
                that.hide(e);
            };
            $("#twittViewerElement").modal("show");
        },
        hide: function(e){
            $("#twittViewerElement").modal("hide");
            Zoomdata.eventDispatcher.trigger('twittViewerHide');
        },
        data: function(){
            return this._data;
        }
        
    });

    var radialMenuItemTemplate = _.template('\
        <span class="zd-radial-item-label"><%=label%></span>\
    ');

    Controls.RadialMenu = Zoomdata.MVC.View.extend({

        className: 'zd-radial-menu',

        defaults: {
            template: radialMenuItemTemplate,
            arc: {
                start: -40,
                end: 220,
                gap: 4,
                radius: 66,
                width: 44,
                color: 'rgba(0, 0, 0, 0.7)'
            },
            arcClosed: {
                radius: 66,
                width: 44,
                start: 89,
                angle: 2
            }

        },

        events: {

        },

        initialize: function (options) {
            var menuClosed, instance = this;
            options = options || {};

            this.items = [];
            this.icons = [];
            this.closed = [];
            this.position = {
                left: '50%',
                top: '50%'
            };

            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);
            menuClosed = {
                start: 90,
                end: 90,
                gap: 0,
                radius: this.options.arc.radius,
                width: this.options.arc.width
            };

            this.start = $('<div class="zd-radial-start"></div>');
            this._renderStart(menuClosed);

            this.end = $('<div class="zd-radial-end"></div>');
            this._renderEnd(menuClosed);

            if (options.items) {
                this.reset(options.items);

                delete this.options.items;
            }

            return this;
        },

        render: function (at) {
            var instance = this;
            at = at || {};
            this.empty();

            if (at.group === "") {
                this.$el.addClass("zd-empty-group");
            } else {
                this.$el.removeClass("zd-empty-group");
            }

            this.$el.append(this.start.show());
            this.$el.append(this.end.show());

            this.start.off('transitionend');
            this.end.off('transitionend');

            this.start
                .on('click', function () {
                    instance.items[0].arc.$donut.click();
                })
                .on('mouseenter', function () {
                    !instance.items[0].arc.$donut.hasClass('active')
                        ? instance.items[0].arc.$donut.addClass('active')
                        : null;
                }).on('mouseleave', function () {
                    instance.items[0].arc.$donut.hasClass('active')
                        ? instance.items[0].arc.$donut.removeClass('active')
                        : null;
                });
            this.end
                .on('click', function () {
                    var last = instance.items.length-1;

                    instance.items[last].arc.$donut.click();
                })
                .on('mouseenter', function () {
                    var last = instance.items.length-1;

                    !instance.items[last].arc.$donut.hasClass('active')
                        ? instance.items[last].arc.$donut.addClass('active')
                        : null;
                }).on('mouseleave', function () {
                    var last = instance.items.length-1;

                    instance.items[last].arc.$donut.hasClass('active')
                        ? instance.items[last].arc.$donut.removeClass('active')
                        : null;
                });
            requestAnimationFrame(function () {
                instance._renderStart();
                instance._renderEnd();
            });

            this.setPosition(at);
            this.renderItems();
            this.renderIcons();

            return this;
        },

        renderIcons: function () {
            var instance = this;

            _.each(this.icons, function (_, index) {
                instance.renderIcon(index);
            });

            return this;
        },
        renderIcon: function (index) {
            var instance = this,
                icons = this.icons;

            if (index < 0 || index >= icons.length) return this;

            !this.$el.children().has(icons[index].$icon).length
                ? this.$el.append(icons[index].$icon)
                : null;

            requestAnimationFrame(function () {
                index % 2
                    ? icons[index].$icon.css({
                    top: 20,
                    right: instance.options.arc.radius,
                    opacity: 1
                })
                    : icons[index].$icon.css({
                    top: 20,
                    left: instance.options.arc.radius,
                    opacity: 1
                });
            });

            return this;
        },

        setPosition: function (position) {
            this.position.left = position.left || this.position.left;
            this.position.top = position.top || this.position.top;

            this.$el.css({
                left: this.position.left,
                top: this.position.top
            });

            return this;
        },

        renderItems: function() {
            var instance = this,
                length = this.items.length;

            _.each(this.items, function (_, index) {
                instance.renderItem(index);
            });

            return this;
        },

        renderItem: function (index) {
            var items = this.items;

            if (this.isClosed(index)) return this;
            if (index < 0 || index >= items.length) return this;

            this._renderArc(index);
            items[index].arc.$el.show(200);

            return this;
        },

        reset: function (items) {
            var instance = this;
            this.clear();

            _.each(items, function (item) {
                instance.add(item);
            });

            return this;
        },

        clear: function () {
            this.clearItems();
            this.clearIcons();

            return this;
        },

        clearItems: function () {
            while (this.items.length !== 0) {
                this.removeItem(0)
            }

            this.closed = [];

            return this;
        },

        clearIcons: function () {
            while (this.icons.length !== 0) {
                this.removeIcon(0)
            }

            return this;
        },

        add: function (item) {
            switch (item.type) {
                case 'icon':
                    this.addIcon(item)
                    break;
                case 'arc':
                default:
                    this.addItem(item)
                    break;
            }

            return this;
        },

        addIcon: function (item) {
            var instance = this;

            item.$icon = $('<div class="zd-radial-icon" title="'+item.label+'"></div>');
            item.$icon.append('<i class="zd-icon zd-icon-'+item.label.toLowerCase()+'"/>');

            item.$icon.on('click', function (event) {
                if (typeof item.action == 'function') {
                    return item.action.call(this, event, instance.$el);
                } else {
                    return null;
                }
            });

            this.icons.push(item);

            return this;
        },

        addItem: function (item) {
            var instance = this,
                items = this.items,
                first = items[0],
                last = items[items.length - 1];

            item.arc = new Utilities.Arc(this.options.arcClosed);
            item.arc.$donut.on('click', function (event) {
                if (item.group.group !== "" && typeof item.action == 'function') {
                    return item.action.call(this, event, instance.$el);
                } else {
                    if (item.group.group === "") {
                        event.stopPropagation();
                    }
                    return null;
                }
            });

            item.arc.$center.html(this.options.template(item));

            last && last.arc.$donut.off('mouseenter');
            last && last.arc.$donut.off('mouseleave');

            item.arc.$donut
                .on('mouseenter', function () {
                    !instance.end.hasClass('active')
                        ? instance.end.addClass('active')
                        : null;
                }).on('mouseleave', function () {
                    instance.end.hasClass('active')
                        ? instance.end.removeClass('active')
                        : null;
                });

            first && first.arc.$donut
                .on('mouseenter', function () {
                    !instance.start.hasClass('active')
                        ? instance.start.addClass('active')
                        : null;
                }).on('mouseleave', function () {
                    instance.start.hasClass('active')
                        ? instance.start.removeClass('active')
                        : null;
                });

            var hideAction = this.allOrUnFilterAll(item);
            
            if(item.disabled !== undefined && $.isFunction(item.disabled) && item.disabled() === true){
                    return this;
            }
            if (hideAction !== item.name) {
                this.items.push(item);
            }

            return this;
        },

        allOrUnFilterAll: function(item){
            var visualizations = Zoomdata.main.currentSection.widgetGrid.childViews;
            var hideAction = 'un_filter_all';

            if (item.name === 'un_filter_all' || item.name === 'filter_all'){
                _.each(visualizations, function(view){
                    if (view.controller.filtersIndicator) {
                        var models = view.controller.filtersIndicator.collection.models;
                        _.each(models, function(model){
                            model.get('value').indexOf(item.group.group)>=0 ? hideAction = 'filter_all' : null;
                        });
                    }
                });
            }

            return hideAction;
        },

        removeItem: function (index) {
            var item = this.items[index];

            if (this.isClosed(index))
                this.closed.splice(this.closed.indexOf(index), 1);

            item.arc.$donut.off('click');
            item.arc.$donut.off('mouseenter');
            item.arc.$donut.off('mouseleave');

            item.arc.remove();

            this.items.splice(index, 1);

            return this;
        },

        removeIcon: function (index) {
            var item = this.icons[index];

            item.$icon.off('click');
            item.$icon.remove();

            this.icons.splice(index, 2);

            return this;
        },

        close: function () {
            var instance = this,
                menuClosed = {
                    start: 90,
                    end: 90,
                    gap: 0,
                    radius: this.options.arc.radius,
                    width: this.options.arc.width
                };

            _.each(this.items, function (_, index) {
                instance.closeItem(index);
            });

            _.each(this.icons, function (_, index) {
                instance.closeIcon(index);
            });

            if (this.start) {
                this._renderStart(menuClosed);
                this.start.one('transitionend', function () {
                    instance.start.hide();
                    instance.empty();
                });
            }
            if (this.end) {
                this._renderEnd(menuClosed);
                this.end.one('transitionend', function () {
                    instance.end.hide();
                    instance.empty();
                });
            }

            return this;
        },

        open: function () {
            this.closed = [];
            this.renderItems();
            this.renderIcons();

            return this;
        },

        closeItem: function (index) {
            var items = this.items;

            if (this.isClosed(index)) return this;
            if (index < 0 || index >= items.length) return this;

            items[index].arc.set(this.options.arcClosed);
            items[index].arc.$el.fadeOut(200);
            this.closed.push(index);

            return this;
        },

        closeIcon: function (index) {
            var icons = this.icons;

            icons[index].$icon.css({
                width: 0,
                height: 0,
                opacity: 0
            });

            return this;
        },

        openItem: function (index) {
            var items = this.items;

            if (!this.isClosed(index)) return this;
            if (index < 0 || index >= items.length) return this;

            this.closed.splice(this.closed.indexOf(index), 1);
            this.renderItem(index);

            return this;
        },

        isClosed: function (index) {
            return this.closed.indexOf(index) !== -1;
        },

        _renderArc: function (index) {
            var itemOrder = index,
                count = this.items.length - this.closed.length,
                arc = this.items[index].arc,
                options = {};

            _.each(this.closed, function (closedIndex) {
                index > closedIndex
                    ? itemOrder--
                    :null;
            });

            options.gap = this.options.arc.gap;
            options.radius = this.options.arc.radius;
            options.angle = (this.options.arc.end - this.options.arc.start)/count;
            options.start = this.options.arc.start + options.angle*itemOrder;

            !this.$el.children().has(arc.$el).length
                ? this.$el.append(arc.$el)
                : null;

            requestAnimationFrame(function () {arc.set(options);});

            return this;
        },

        _renderStart: function (options) {
            var $elem = this.start,
                options = options || this.options.arc,
                angle = options.end+90,
                size = options.width,
                top = options.radius - options.width,
                left = -options.width/2 + options.gap/2;

            $elem.css({
                transform: 'rotate('+angle+'deg)',
                transformOrigin: (-left) +'px ' + (-top) + 'px',

                width: size/2,
                height: size,

                borderBottomLeftRadius: size/2,
                borderTopLeftRadius: size/2,

                top: top,
                left: left
            });
        },

        _renderEnd: function (options) {
            var $elem = this.end,
                options = options || this.options.arc,
                angle = options.start+90,
                size = options.width,
                top = options.radius - options.width,
                left = -options.gap/2;

            $elem.css({
                transform: 'rotate('+angle+'deg)',
                transformOrigin: (-left) +'px ' + (-top) + 'px',

                width: size/2,
                height: size,

                borderBottomRightRadius: size/2,
                borderTopRightRadius: size/2,

                top: top,
                left: left
            });
        }
    });

    var colorPickerTemplate = '\
        <div class="color-picker-button" style="background: <%=color%>;"></div> \
    ';
    Controls.ColorPicker = Zoomdata.MVC.View.extend({
        initialize: function(options) {
            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);

            this.color = options.color;
            return this.render();
        },

        render: function() {
            this.button = $(_.template(colorPickerTemplate, {
                color: this.color
            }));
            this.$el.append(this.button);
            this.renderPopup();
            return this;
        },

        setColor: function (newColor) {
            this.color = newColor;
            this.button.css('background', this.color);
            this.button.spectrum("set", this.color);
        },

        renderPopup: function () {
            var self = this,
                pickerPalette,
                pickerContainer;
            this.button.spectrum({
                color: this.color,
                preferredFormat: 'hex',
                showInput: true,
                showInitial: true,
                chooseText: "Apply",
                cancelText: "Cancel",

                change: function(color) {
                    self.color = color.toHexString();
                    self.button.css('background', self.color);
                    self.trigger('change', self.color);
                },
                beforeShow: function () {
                    self.trigger('beforeShow');
                },
                show: function () {
                    if (!pickerContainer) {
                        pickerContainer = $('.sp-container:visible');
                        pickerContainer.find('.sp-choose')
                            .addClass('zd btn btn-success btn-block');
                        pickerContainer.find('.sp-cancel')
                            .addClass('zd btn btn-cancel btn-block')
                            .insertAfter(pickerContainer.find('.sp-choose'));
                    }
                    pickerPalette = new Zoomdata.Controls.SmallPopup({
                        containment: Zoomdata.main.$section,
                        customClass: 'colorPickerPalette',
                        pointerWidth: 14
                    });
                    pickerPalette.render(pickerContainer)
                        .position({
                            of: self.button,
                            my: 'left+10 center+10',
                            at: 'right center',
                            collision: 'flipfit flipfit'
                        });
                },
                hide: function () {
                    pickerContainer.appendTo('body');
                    pickerPalette.hide();
                }
            });
        }

    });

    Zoomdata.Controls = Controls;
} (window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";
    /*jshint multistr: true */

    var template = '\
        <table class="table table-striped">\
            <tr>\
                <td>Item No</td>\
                <td><%=index%></td>\
            </tr>\
            <%_.each(_.keys(attributes), function (key) {%>\
                <tr>\
                    <td><%=key%></td>\
                    <td><%=attributes[key]%></td>\
                </tr>\
            <%});%>\
        </table> \
        ';

    Zoomdata.Views = Zoomdata.Views || {};
    Zoomdata.Views.ListItem = Zoomdata.MVC.View.extend({

        tagName: 'li',
        className: 'zd-list-item',

        model: new Zoomdata.MVC.Model(),

        events: {
            'click': '_onClick'
        },

        defaults: {
            template: _.template(template),
            selectedClass: 'zd-item-selected',
            selectable: false
        },

        initialize: function (options) {
            this.childViews = [];
            this.settings = $.extend({}, this.defaults, options);

            this.$el.data('itemView', this);

            this.listenTo(this.model, 'change', this.render);
            return this;
        },

        render: function () {

            this.$el.html(this.settings.template({
                attributes: this.model.attributes,
                index: this.model.index
            }));

            this.delegateEvents();

            return this;
        },

        _onClick: function () {
            if (this.settings.selectable) {
                this.toggle();
                return false;
            }else{
                var confPaletteObj = $('.widgetBody').has('.configure-palette');
                
                if(confPaletteObj.length != 0){
                    Zoomdata.eventDispatcher.trigger('close:configurePalette')
                }
            }
        },

        toggle: function () {
            this.$el.toggleClass(this.settings.selectedClass);

//            this.model.collection.trigger('toggle', this.model);
            this.trigger('toggle', this.model);
        }
    });
}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";

    var ItemView = Zoomdata.Views.ListItem,
        SearchBox = Zoomdata.Views.SearchBox,
        List = Zoomdata.MVC.Collection,
        loaderTemplate = _.template('\
            <span class="zd-loader">Loading...</span> \
        ');

    Zoomdata.Views = Zoomdata.Views || {};
    Zoomdata.Views.ListView = Zoomdata.MVC.View.extend({

        tagName: 'ul',

        className: 'unstyled',

        defaults: {
            loaderTemplate: loaderTemplate,
            search: false,
            sortable: false,
            selectable: false, // 'checkbox' || 'radio'
            sortOptions: {
                tolerance: "pointer"
            },
            sortbyOptions: null,
            sortOpened: false, // Move opened sources to top of list || 'Favorites'
            filter: function () {return true},
            ItemView: ItemView
        },

        events: {
            'sortstop': 'onSortstop',
            'sortreceive': 'onSortreceive',
            'sortremove': 'onSortremove'
        },

        initialize: function (options) {
            var instance = this;

            this.childViews = [];
            this.options = $.extend({}, this.defaults, options);

            this.collection = this.collection || new List();

            this.applyListeners();

            if (this.options.sortable) {
                this.$el.sortable(this.options.sortOptions);
            }

            if (this.options.search !== false) {
                this.searchBox = new SearchBox();

                this.listenTo(this.searchBox, 'search', this._renderItems);
            }

            if (this.options.selectable) {
                this.selected = [];
                this.listenTo(this.collection, 'toggle', function (model) {
                    var index = instance.selected.indexOf(model),
                        items = instance.childViews,
                        selected = instance.selected;

                    if (instance.options.selectable !== 'checkbox') {
                        _.each(items, function (item) {
                            (item.model !== model && selected.indexOf(item.model) !== -1)
                                ? item.toggle()
                                : null;
                        });

                        index = instance.selected.indexOf(model);
                    }

                    index == -1
                        ? selected.push(model)
                        : selected.splice(index, 1);
                });
            }

            return this;
        },
        
        applyListeners: function(){
            this.listenTo(this.collection, 'request:collection', this._showLoader);
            this.listenTo(this.collection, 'remove reset sync:collection', this.render);
            this.listenTo(this.collection, 'add', this._onAddItem);
        },
        removeListeners: function(){
            this.stopListening(this.collection, 'request:collection');
            this.stopListening(this.collection, 'remove reset sync:collection');
            this.stopListening(this.collection, 'add');
        },

        getItemByModel: function (model) {
            var items = this.childViews,
                item = null;

            _.each(items, function (view) {
                view.model == model
                    ? item = view
                    : null;
            });

            return item;
        },

        getSelectedItems: function () {
            return this.selected;
        },

        sortCollection: function (options) {
            var instance = this,
                comparator = this.collection.comparator,
                sortby = options && options.sortby,
                ascending = options && options.ascending,
                limitShowCount = options && options.limitShowCount ? options.limitShowCount : null;

            if (!options || sortby === 'Name' || sortby === 'Filter Name') {
                var sorted = _.sortBy(this.collection.models, function(model){ 
                    if (options && !options.ascending) {
                        var str = model.get('name').toLowerCase();
                        str = str.split("");
                        str = _.map(str, function(letter) { 
                            return String.fromCharCode(-(letter.charCodeAt(0)));
                        });
                        return str;
                    }
                    else if (comparator) {
                        // Skip sorting
                    }
                    else {
                        return model.get('name') ? model.get('name').toLowerCase() : "";
                    }
                });

                this.collection.models = sorted;
            }

            else if (sortby === 'Author') {
                var sorted = _.sortBy(this.collection.models, function(model) {
                    var userName = (model.get('userName') || '').toLowerCase();
                    if (options && options.topValue === model.get('userName')) {
                        userName = ' ' + userName;
                    }
                    if (options && !options.ascending) {
                        userName = _.map(userName.split(""), function(letter) {
                            return String.fromCharCode(-(letter.charCodeAt(0)));
                        });
                        return userName;
                    }
                    return userName;
                });
                this.collection.models = sorted;
            }

            else if (sortby === 'Last Used') {
                var sorted = _.sortBy(this.collection.models, function(model){
                    return ascending ? -model.get('lastModified') : model.get('lastModified');
                });
                this.collection.models = sorted;
            }

            else if (sortby === 'Popularity') {
                var sorted = _.sortBy(this.collection.models, function(model){
                    return ascending ? -model.get('viewsCount') : model.get('viewsCount');
                });
                this.collection.models = sorted;
            }

            else if (sortby === 'Type') {
                var sorted = _.sortBy(this.collection.models, function(model){
                    return model.get('type');
                });
                this.collection.models = ascending ? sorted : sorted.reverse();
            }

            if (this.options.sortOpened) {
                (typeof this.options.sortOpened === 'string') 
                    ? sortCollectionOpened(this.collection) 
                    : sortCollectionOpened(this.collection, this.options.openedSources);
            }

            if (this.collection.findWhere({selectAll: true})) {
                this.collection.models = _.sortBy(sorted, function (item){
                    return item.get('selectAll');
                });
            }
            
            function sortCollectionOpened(collection, openedSources) {
                _.each(collection.models, function(model, i){
                    var sourceName = model.get('name');
                    if (openedSources && openedSources.indexOf(sourceName) >= 0) {
                        var opened = collection.models.splice(i, 1);
                        collection.models.unshift(opened[0]);
                    } 
                    else if (sourceName === instance.options.sortOpened) {
                        var opened = collection.models.splice(i, 1);
                        collection.models.unshift(opened[0]);
                    }
                });
            }

        },

        onSortstop: function () {
            this.sortCollection();
        },

        onSortreceive: function (event, ui) {
            var $target = ui.item,
                item = $target.data('itemView'),
                model = item.model;

            this.collection.add(model, {silent: true});
            this.sortCollection();
            this.collection.trigger('add');
        },

        onSortremove: function (event, ui) {
            var $target = ui.item,
                item = $target.data('itemView'),
                model = item.model;

            this.collection.remove(model, {silent: true});
            this.childViews.splice(this.childViews.indexOf(item), 1);
        },

        _onAddItem: function (model) {
            if (!model || this.searchBox && !model.matchesSearch(this.options.search, this.searchBox.model.toJSON())) {
                return false;
            }

            this._renderItem(model);

            return false;
        },

        _renderItem: function (model) {
            var instance = this,
                config = {
                    model: model,
                    template: this.options.template,
                    selectable: this.options.selectable
                };

            if (this.options.itemOption) {
                config = $.extend({}, this.options.itemOption, config);
            }

            var item = new this.options.ItemView(config);

            if (this.sources) {
                item.model.set('sources',this.sources);
            }

            this.$el.append(item.render().el);
            this.childViews.push(item);

            this.listenTo(item, 'select', function (model, $item) {
                instance.trigger('select', model, $item);
            });
            this.listenTo(item, 'toggle', function (model) {
                instance.trigger('toggle', model);
            });
        },

        _renderItems: function () {
            var instance = this,
                searchResults = this.collection.models,
                sortbyOptions = instance.options.sortbyOptions,
                limitShowCount = sortbyOptions && sortbyOptions.limitShowCount ? sortbyOptions.limitShowCount : null;

            this._removeItems();

            if (this.searchBox) {
                searchResults = this.collection.search(this.options.search, this.searchBox.model.toJSON());
            }

            _.each(
                _.filter(
                    searchResults, this.options.filter),
                function (model, i) {

                    if (limitShowCount && i >= limitShowCount) return;

                    instance._renderItem(model);
                }
            );

            if (this.options.sortable) {
                this.$el.sortable('refresh');
            }

        },

        _removeItems: function () {
            // Since only items are stored in this.childViews we can use this method of Zoomdata.MVC.View
            // to remove them from view. If any other subviews are tracked here make sure to modify this method
            this._removeChildViews();
        },

        render: function (options) {
            options = $.extend({}, this.options.sortbyOptions, options);

            var sortby = this.options.sortbyOptions || options && options.sortby ? options : null;

            this.empty();            
            
            sortby ? this.sortCollection(sortby) : this.sortCollection();
            this.searchBox ? this.$el.prepend(this.searchBox.render().el) : null;

            this._renderItems();

            return this;
        },
        _showLoader: function () {
            this.empty();

            this.$el.html(this.options.loaderTemplate());
        },
        remove: function () {
            Zoomdata.MVC.View.prototype.remove.apply(this, arguments);
            this.searchBox ? this.searchBox.remove() : null;
        }
    });
}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";
    /*jshint multistr: true */

    var ItemView = Zoomdata.Views.ListItem,
        ListView = Zoomdata.Views.ListView,
        List = Zoomdata.MVC.Collection;

    var headerTemplate = '  \
        <legend class="subhead"><%= label %></legend>\
    ';

    Zoomdata.Views = Zoomdata.Views || {};
    Zoomdata.Views.GroupedListView = Zoomdata.MVC.View.extend({

        className: 'unstyled',

        defaults: {
            ItemView: ItemView,
            ListView: ListView,
            groupClassName: 'nav nav-tabs nav-stacked',
            selectable: false,
            filter: function (model) {
                return true;
            }
        },

        events: {
        },

        initialize: function (options) {
            var instance = this;
            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);

            this.childViews = [];
            this.groups = {};

            this.collection = this.collection || new List();

            this.listenTo(this.collection, 'add', function (model) {
                var groupBy = instance.options.groupBy,
                    name = model.get(groupBy);

                typeof name !== 'undefined' ? this._addToGroup(model.get(groupBy), model): null;
            });

            this.listenTo(this.collection, 'remove', function (model) {
                var name = model.get(instance.options.groupBy);

                typeof name !== 'undefined' ? this._removeFromGroup(model.get(instance.options.groupBy), model): null;
            });

            this.listenTo(this.collection, 'reset', function (model) {
                this._resetGroups();
            });

            this._resetGroups();

            return this;
        },

        _createGroup: function (name, models) {
            var instance = this;

            if (typeof this.groups[name] !== 'undefined') {
                this._removeGroup(name);
            }

            var list = new List(models);

            if (this.options.comparator) {
                list.comparator = this.options.comparator;
                list.sort();
            }

            this.groups[name] = new this.options.ListView({
                className: this.options.groupClassName,
                ItemView: this.options.ItemView,
                itemOption: this.options.itemOption || null,
                selectable: this.options.selectable,
                template: this.options.template,
                collection: list,
                filter: this.options.filter
            });
            this._renderGroup(name);
            this.childViews.push(this.groups[name]);

            this.listenTo(this.groups[name], 'select', function (model) {
                instance.trigger('select', model);
            });
        },

        _removeGroup: function (name) {
            if (typeof this.groups[name] !== 'undefined') {

                this.groups[name].$el.prev().remove();
                this.groups[name].remove();

                this.childViews.splice(this.childViews.indexOf(this.groups[name]), 1);

                delete this.groups[name];
            }
        },

        _clearGroups: function () {
            var instance = this;

            _.each(this.groups, function (models, name) {
                instance._removeGroup(name)
            })
        },

        _removeFromGroup: function (name, item) {
            var target;
            if (typeof this.groups[name] !== 'undefined') {
                target = this.groups[name].collection.findWhere(item.attributes);
                target ? this.groups[name].collection.remove(target) : null;
                this.groups[name].collection.length == 0 ? this._removeGroup(name) : null;
            }
        },

        _addToGroup: function (name, model) {
            if (typeof this.groups[name] === 'undefined') {
                this._createGroup(name);
            }

            this.groups[name].collection.add(model, {merge: true});
        },

        _resetGroups: function () {
            var instance = this;

            this._clearGroups();

            var groups = this.collection.groupBy(function(item) {
                return item.get(instance.options.groupBy);
            });
            
            _.each(groups, function (models, name) {
                instance._createGroup(name, models);
            });
        },

        _renderGroup: function (name) {

            var listElement = this.groups[name].render().el;

            if(listElement.childNodes.length) {
                this.$el.append(_.template(headerTemplate, { label: Zoomdata.Utilities.toTitleCase(name) }));
                this.$el.append(this.groups[name].el);
            }
        },

        _sortGroups: function () {
            var groups = this.groups;
            var sortedGroups = {};

            var sortedArr = Object.keys(groups).sort(function(a, b){
                return groups[a]-groups[b];
            });

            sortedArr.sort();
            
            for (var name in groups) {
                _.each(sortedArr, function(name, i){
                    sortedGroups[sortedArr[i]] = groups[name];
                });
            }

            this.groups = sortedGroups;
//            this._sortGroupModels(this);
        },

        _sortGroupModels: function(view){
            var groups = view.groups;
            var sortedGroups = {};

            _.each(groups, function(group, name){
                var sortedFieldsArr = [];
                var sortedModels = [];

                _.each(group.collection.models, function(label, i){
                    var label = group.collection.models[i].get('label');
                    sortedFieldsArr.push([label, i, group.collection.models[i]]);
                });

                sortedFieldsArr.sort();

                _.each(sortedFieldsArr, function(label, i){
                    var model = sortedFieldsArr[i][2];
                    group.collection.model[i] = model;
                    sortedModels.push(model);
                });

                sortedGroups[name] = sortedModels;
                group.collection.models = sortedModels;
            });

        },

        setFilter: function (filter) {
            this.options.filter = filter;
            _.each(this.groups, function (name, list) {
                list.options.filter = filter;
            });
        },

        render: function () {
            var instance = this;

            this.empty();
            this._sortGroups();

            _.each(this.groups, function (group, name) {
                instance._renderGroup(name);
            });

            return this;
        },

        remove: function () {
            this._clearGroups();
            Zoomdata.MVC.View.prototype.remove.apply(this, arguments);
        }
    });
}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";
    /*jshint multistr: true */

    var Source = Zoomdata.Models.Source,

        template = _.template('\
            <div class="object-field-container ">\
                <div title="<%= attributes.type.toLowerCase()%>" class="zd icon drag-icon <%= attributes.type.toLowerCase()%>"></div>\
                <div class="text"><%= attributes.label%></div>\
                <i class="zd icon right-chevron" style="display: none"></i>\
            </div>\
        '),

        attributeAxisItemTemplate = _.template('\
            <div class="attributeItem">\
                <div class="text"><%= attributes.label%></div>\
            </div>\
        ');


    Zoomdata.Views = Zoomdata.Views || {};
    Zoomdata.Views.ObjectFieldItem = Zoomdata.Views.ListItem.extend({

        model: new Source(),
        className: 'object-field',
        events: {
            'click': 'select'
        },

        defaults: {
            template: template
        },

        select: function () {
            this.model.collection.trigger('select', this.model);
            this.trigger('select', this.model);
        }
    });

    Zoomdata.Views.SmallObjectFieldItem = Zoomdata.Views.ObjectFieldItem.extend({
        className: '',
        selectTemplate: '<span class="zd icon checkbox radio"><span class="zd checked <%=selected %>"></span></span>',
        defaults: {
            template: attributeAxisItemTemplate,
            checkbox: true
        },

        initialize: function(options){
            Zoomdata.Views.ObjectFieldItem.prototype.initialize.apply(this, arguments);

            this.options = $.extend({}, this.defaults, options);

            return this;
        },

        render: function(){
            Zoomdata.Views.ObjectFieldItem.prototype.render.apply(this, arguments);

            if (this.settings.checkbox) {
                var selected = this.model.get('selected'),
                    disabled = this.model.get('disabled'),
                    checkbox = _.template(this.selectTemplate, {
                        selected: selected ? ' selected' : ''
                    });

                this.$el.prepend(checkbox);

                selected 
                    ? this.$el.addClass('selected') 
                    : null;

                disabled
                    ? this.$el.addClass('disabled') 
                    : null;

            }
            else {
                this.$el.addClass('minimal');
            }

            return this;
        }
    });


}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";

    var metricFormatter = function (type) {
            return new Zoomdata.Components.MetricFormatter(type);
        },
            dataItemTemplate = _.template('\
            <dt title="<%= label==="Count"?"Volume":label%> <%=func ? "("+func+")": ""%>"><%= label==="Count"?"Volume":label%> <%=func ? "("+func+")": ""%>:</dt>\
            <dd><%=value%></dd>\
        '),
            timeItemTemplate = _.template('\
            <dt title="<%= label%>"><%= label%>:</dt>\
            <dd><%= from%></dd>\
            <dd><%= to%></dd>\
        '),
            groupDelimiter = _.template('\
            <legend><%= label%></legend>\
        '),
            detailsButton = _.template('\
            <button title="Show Details" value="button-details" class="zd btn btn-success btn-block">Details</button> \
        '),
        getEndTimeWithinStep = Zoomdata.Utilities.time.getEndTimeWithinStep;

    Zoomdata.Views = Zoomdata.Views || {};
    Zoomdata.Views.DataItem = Zoomdata.MVC.View.extend({

        className: 'zd-data-item',

        defaults: {
            dataItemTemplate: dataItemTemplate,
            timeItemTemplate: timeItemTemplate,
            groupDelimiter: groupDelimiter,
            detailsButton: detailsButton
        },

        events: {
           // "click button[value='button-details']": "_onShowDetails"
        },

        initialize: function (options) {
            options = options || {};

            if (options.state) {
                this.state = options.state;
                delete options.state;
            }
            if (options.fields) {
                this.fields = options.fields;
                delete options.fields;
            }
            if (options.data) {
                this.data = options.data;
                delete options.data;
            } else {
                this.data = {};
            }

            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);
            this.options = $.extend({}, this.defaults, options);

            return this;
        },

        render: function (dataItem) {
            var timeTrendStep = this.state.get('timeTrendStep');

            dataItem
                ? this.data = dataItem
                : dataItem = this.data;

            var time = this.getCurrentTime(dataItem);
            
            this.$el.empty();
            this.renderGroup('Current', dataItem.current, time);

            if (dataItem['historical']) {
                this.renderGroup('Historical', dataItem.historical, this.getHistoricalTime(dataItem));
            }

            this.delegateEvents();

            return this;
        },

        update: function (data) {
            var dataItem = this.data,
                group = dataItem.group,
                newDataItem = _.where(data, {group: group})[0];

            newDataItem && this.render(newDataItem);
            return this;
        },

        isTrends: function(){
            // If date field is configured, then source has time attribute
            var instance = this;
            return (function () {
                return instance.state.isTimeTrends();
            }());
        },

        getCurrentTime: function(data){
            var isTrends = this.isTrends();
            var sourceConfig = this.state.config.get('source');
            var timeTrendStep = this.state.get('timeTrendStep');
            if (typeof sourceConfig.date !== 'undefined' && !isTrends) {
                if ("DAY" === this.state.config.get("source").dataResolution) {
                    var from = new Date(this.state.time.get('fromTime')),
                        to = new Date(this.state.time.get('time'));

                    return {
                        from: (from.getUTCMonth() + 1) + "/" + from.getUTCDate() + "/" + from.getUTCFullYear(),
                        to: (to.getUTCMonth() + 1) + "/" + to.getUTCDate() + "/" + to.getUTCFullYear()
                    };
                }

                return {
                    from: new Date(this.state.time.get('fromTime')).toLocaleString(),
                    to: new Date(this.state.time.get('time')).toLocaleString()
                };

            } 
            else if (isTrends) {
                if ("DAY" === this.state.config.get("source").dataResolution) {
                    var from = new Date(data.group),
                        to = new Date(getEndTimeWithinStep(data.group, timeTrendStep));

                    return {
                        from: (from.getUTCMonth() + 1) + "/" + from.getUTCDate() + "/" + from.getUTCFullYear(),
                        to: (to.getUTCMonth() + 1) + "/" + to.getUTCDate() + "/" + to.getUTCFullYear()
                    };
                }

                return {
                    from: new Date(data.group).toLocaleString(),
                    to: new Date(getEndTimeWithinStep(data.group, timeTrendStep)).toLocaleString()
                }

            } 
            else {
                return null;
            }
        },

        getHistoricalTime: function(data){
            var isTrends = this.isTrends();
            var sourceConfig = this.state.config.get('source');
            var timeTrendStep = this.state.get('timeTrendStep');
            if (typeof sourceConfig.date !== 'undefined' && !isTrends) {
                return {
                    from: new Date(this.state.time.get('historicalFrom')).toLocaleString(),
                    to: new Date(this.state.time.get('historicalTo')).toLocaleString()
                };
            } 
            else if (isTrends) {
                return {
                    from: new Date(data['historical'].group).toLocaleString(),
                    to: new Date(getEndTimeWithinStep(data['historical'].group, timeTrendStep)).toLocaleString()
                }
            }
            else {
                return null;
            }
        },

        renderGroup: function (label, data, time) {
            var $group = $('<dl></dl>'),
                volumeMetric = this.state.get('volume'),
                colorMetric = this.state.get('color'),
                fields = this.fields;
            
            this.$el
                .append(this.options.groupDelimiter({
                    label: label
                }))
                .append($group);

            time !== null
                ? $group.append(this.options.timeItemTemplate({
                    label: 'Time Window',
                    from: time.from || null,
                    to: time.to || null
                }))
                : null;
            
            $group.append(this.options.dataItemTemplate({
                label: 'Count',
                value: metricFormatter("NUMBER").format(data.count),
                func: null
            }));
            
            if (data.metrics) {

                _.each(data.metrics, function (data, name) {
                    var key = '';
                    for (var _key in data) {
                        key = _key; 

                        var metrics = _.filter(fields.models, function(model){
                            return (name === model.get('name') || model.distinctCount);
                        });

                        var metricInfo = _.find(metrics, function(model){
                            if (model.get('func') && key === 'distinct_count') {
                                return model.get('distinctCount');
                            }
                            else if (model.get('func') && key !== 'distinct_count'){
                                return (key === model.get('func').toLowerCase());
                            } else {
                                return key === 'avg' || key === 'distinct_count';
                            }
                        });

                        if (!metricInfo) {
                            // We get info from default metrics for presetted ManageVis metrics.
                            // But if default is AVG and presetted is SUM - there is undefined.
                            // Just need to get label and type.
                            metricInfo = _.find(metrics, function(model){
                                return model.get('name') === name;
                            });
                        }

                        var _label = metricInfo.get('label'),
                            _type = metricInfo.get('type');

                        $group.append(dataItemTemplate({
                            label: _label,
                            value: key !== "distinct_count" ? metricFormatter(_type).format(data[key]) : data[key],
                            func: key
                        }));

                    }

                });
            }
        },

        _onShowDetails: function () {
            this.renderDetails();
        }
    });
}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {
    "use strict";

    var ListView = Zoomdata.Views.ListView,

        Model = Zoomdata.MVC.Model.extend({
            idAttribute: '_id',
            initialize: function () {
                var instance = this;
                Zoomdata.MVC.Model.prototype.initialize.apply(this, arguments);

                this.fields = this.collection.fields;
                this.setFields();

                this.on('change', function () {
                    instance.setFields()
                });
                return this;
            },
            setFields: function (fields) {
                var instance = this;
                this.fields = fields || this.fields;

                _.each(_.keys(this.attributes), function (fieldName) {
                    if (fieldName !== '_zdFields') {
                        var field = instance.fields.findWhere({
                            name: fieldName
                        });

                        instance.attributes['_zdFields'] = instance.attributes['_zdFields'] || {};
                        instance.attributes['_zdFields'][fieldName] = field && field.toJSON() || {label: fieldName};
                    }
                });
            }
        }),
        Collection = Zoomdata.MVC.Collection.extend({
            model: Model,

            initialize: function (models, options) {
                if (options.fields) {
                    this.fields = options.fields;
                    delete options.fields;
                }
                Zoomdata.MVC.Collection.prototype.initialize.apply(this, arguments);

                return this;
            }
        }),

        metricFormatter = function (type) {
            return new Zoomdata.Components.MetricFormatter(type);
        },

        moreButton = _.template('\
            <button title="Get More Details" value="button-more" class="zd btn btn-success btn-block">\
                More\
            </button> \
        '),
        progressBar = _.template('\
            <div class="progress progress-striped active">\
                <div class="bar" style="width: <%=value%>%"></div> \
            </div>\
        '),
        template = _.template('\
            <legend>\
                <h4 class="pull-left"><%=title%></h4>\
                <div class="clearfix"></div> \
            </legend>\
        '),
        itemTemplate = _.template('\
            <div class="media minimized" data-role="item-holder">\
                <div class="media-body">\
                    <h4 class="media-heading">\
                        <%= attributes.time !== null ? new Date(attributes.time).toLocaleString(): ("Item " + index) %>\
                    </h4>\
                    <div class="media">\
                        <blockquote data-role="item-holder">\
                            <div class="zd-data-item-details-holder" data-role="details-holder">\
                                <table class="table table-striped">\
                                    <%_.each(_.keys(attributes), function (key, index) {%>\
                                        <% if (key !== "_id" && key !== "time" && key !== "_zdFields" && attributes._zdFields[key]) {%>\
                                            <tr>\
                                                <td><%=attributes._zdFields[key].label%></td>\
                                                <td>\
                                                    <% var imageLink = new RegExp("[/|.|\w|\s]*\/(?:image)/");%>\
                                                    <% var imageExt = new RegExp("(http|https)"+".*?"+"(jpg|gif|png|jpeg|JPG|GIF|PNG|JPEG)");%>\
                                                    <% var imageLink = new RegExp("(http|https)"+".*?"+"(image)");%>\
                                                    <% var image = imageExt.test(attributes[key]) || imageLink.test(attributes[key]); %>\
                                                    <% if (image) { %>\
                                                        <img style="max-width: 300px" src="<%= attributes[key] %>"/> \
                                                    <% } else { %> \
                                                        <%= attributes[key] %>\
                                                    <% } %>\
                                                </td>\
                                            </tr>\
                                        <%}%>\
                                    <%});%>\
                                </table> \
                            </div>\
                            <button value="button-item-details" class="zd btn-link">\
                                Expand <i class="icon-chevron-down"></i>\
                            </button> \
                        </blockquote>\
                    </div> \
                </div> \
            </div> \
        '),
        lpItemTemplate = _.template('\
            <div class="media minimized" data-role="item-holder">\
                <div class="media-body">\
                    <h4 class="media-heading">\
                        <span><%=attributes.rep_dn%></span>\
                        <small class="pull-right"><%=new Date(attributes._ts).toLocaleString()%></small>\
                        <div class="clearfix"></div> \
                    </h4>\
                    <div class="media">\
                        <blockquote>\
                            <%=attributes.text%>\
                            <br>\
                            <div data-role="details-holder" data-itemid="<%=attributes._id%>" style="display: none;" class="media">\
                                <div class="media-body">\
                                    <blockquote>\
                                    </blockquote> \
                                </div> \
                            </div> \
                            <button value="button-item-details" class="zd btn-link">Expand <i class="icon-chevron-down"></i></button> \
                        </blockquote>\
                    </div> \
                </div> \
            </div> \
        '),
        twitterItemTemplate = _.template('\
            <div data-role="item-holder" class="media">\
                <a class="zd pull-left thumbnail" target="_blank" href="https://twitter.com/<%=attributes.user_screen_name%>" class="pull-left">\
                    <img title="<%=attributes.user_name%>" class="media-object" src="<%=attributes.profile_image_url%>">\
                </a>\
                <div class="media-body">\
                    <h4 class="media-heading">\
                        <a title="<%=attributes.user_name%>" target="_blank" href="https://twitter.com/<%=attributes.user_screen_name%>">\
                        <%=attributes.user_name%>\
                        </a>\
                        <small class="pull-right"><%=new Date(attributes.created).toLocaleString()%></small>\
                        <div class="clearfix"></div> \
                    </h4>\
                    <blockquote>\
                        <a \
                            title="<%=attributes.user_name%>"\
                            target="_blank"\
                            href="https://twitter.com/<%=attributes.user_screen_name%>/status/<%=attributes.id%>"\
                        >\
                        <%=attributes.text%>\
                        </a> \
                        <small>\
                            <a title="<%=attributes.user_name%>" target="_blank" href="https://twitter.com/<%=attributes.user_screen_name%>">\
                                @<%=attributes.user_screen_name%>\
                            </a>\
                        </small>\
                    </blockquote>\
                </div>\
            </div>\
        ');

    Zoomdata.Views = Zoomdata.Views || {};
    Zoomdata.Views.DataDetails = Zoomdata.MVC.View.extend({

        className: 'zd-data-item-details',

        defaults: {
            template: template,
            itemTemplate: itemTemplate,
            filter: function () {
                return true;
            },
            search: false,
            count: 15,
            offset: 0
        },

        events: {
            "click button[value='button-more']": '_onMoreClick',
            "click button[value='button-item-details']": '_onItemDetailsClick'
        },

        initialize: function (options) {

            if (options.state) {
                this.state = options.state;
                delete options.state;
            }
            if (options.fields) {
                this.fields = options.fields;
                delete options.fields;
            }
            if (options.data) {
                this.data = options.data;
                delete options.data;
            } else {
                this.data = {};
            }
            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);

            this.collection = this.collection || new Collection([], {
                fields: this.fields
            });

            this.list = new ListView({
                collection: this.collection,
                filter: this.options.filter,
                search: this.options.search,
                template: this.options.itemTemplate
            });

            this.childViews.push(this.list);

            this.$progressBar = $(progressBar({value: 100}));
            this.$moreButton = $(moreButton());

            var sourceType = this.state.config.get('streamType'),
                streamSourceId = this.state.get('streamSourceId'),
                paths = this.state.groupBy.getAttributes(),
                path = paths[0],
                isMultiGroup = paths.length > 1,
                currentGroup = this.data.group,
                currentGroupKey = this.data.key,
                currentCount = this.data.current.count,
                filters = this.state.filters,
                fromTime = options.fromTime,
                toTime = options.toTime,
                restrictions = filters.toJSON(),
                opts = {
                    streamSourceId: streamSourceId,
                    fromTime: fromTime,
                    toTime: toTime,
                    restrictions: restrictions,
                    itemTemplate: itemTemplate,
                    title: currentCount + ' Total Record' + (currentCount > 1 ? 's' : '')
                };

            if (path !== this.state.get('timestampField')) {
                if (isMultiGroup) {
                    restrictions.push({
                        path: paths[1],
                        operation: 'EQUALS',
                        value: currentGroup
                    });
                    restrictions.push({
                        path: paths[0],
                        operation: 'EQUALS',
                        value: currentGroupKey
                    });
                } else {
                    restrictions.push({
                        path: path,
                        operation: 'EQUALS',
                        value: currentGroup
                    });
                }
            }

            switch (sourceType) {
                case 'TWEET':
                    opts.itemTemplate = twitterItemTemplate;
                    opts.title = currentCount + ' Total Tweet' + (currentCount > 1 ? 's' : '');
                    break;
            }

            this.setOptions(opts);
            this.fields = Zoomdata.sources.get(streamSourceId).objectFields;

            return this;
        },

        setOptions: function (options) {
            options = options || {};
            this.options = $.extend({}, this.options, options);

            this.options.itemTemplate
                ? this.list.options.template = this.options.itemTemplate
                : null;

            return this;
        },

        render: function () {
            this.$el.html(this.options.template({title: this.options.title}));
            this.$el.append(this.list.render().el);
            this.renderDetails();
            this.delegateEvents();

            return this;
        },

        renderDetails: function (options) {
            var instance = this;
            this.setOptions(options);

            this.forbidMore();
            this.showLoader();

            this.getDetails()
                .done(function (details) {
                    var documents = details.documents;

                    _.each(documents, function (document, i) {
                        var objectField,
                            field, type;

                        for (field in document) {
                            objectField = instance.fields.findWhere({name: field});
                            type = objectField && objectField.get('type');

                            if (objectField && (type === "MONEY" || type === "TIME" || type === "NUMBER")) {
                                document[field] = metricFormatter(objectField.get('type')).format(document[field]);
                            }

                        }
                    });

                    instance.hideLoader();
                    instance.allowMore();

                    instance.collection.add(documents, {silent: true});
                    instance.collection.forEach(function (model, i){
                        model.index = i+1;
                    });

                    instance.list.render();

                    details.hasNext
                        ? instance.allowMore()
                        : instance.forbidMore();
                })
                .fail(function (response) {
                    instance.$el.append($(
                        '<div class="alert alert-error">'
                            + 'Failed to fetch documents: '
                            + response.statusText
                            + '</div> '));
                });
        },

        getDetails: function () {
            var dfd = $.Deferred(),
                details = {},
                count = 0,
                ts = this.state.get('timestampField');

            this.fields.bootstrap()
                .done(function () {
                    count++;

                    count == 2
                        ? dfd.resolve(details)
                        : null;
                })
                .fail(function (response) {
                    dfd.reject(response);
                });

            var requestData = {
                count: this.options.count,
                offset: this.options.offset,
                streamSourceId: this.options.streamSourceId,
                toTime: this.options.toTime
            };

            var restrictions = this.options.restrictions.filter(function(r){
                return r.path !== ts;
            });
            
            requestData.restrictions = restrictions;

            this.options.fromTime ? requestData.fromTime = this.options.fromTime : null;
            ts ? requestData.timestampField = ts : null;

            $.ajax({
                type: 'POST',
                url: 'service/stream/preview',
                data: JSON.stringify(requestData),
                contentType: "application/json"
            })
                .done(function (message) {
                    details = message;
                    count++;

                    count == 2
                        ? dfd.resolve(details)
                        : null;
                })
                .fail(function (response) {
                    dfd.reject(response);
                });

            return dfd.promise();
        },

        allowMore: function () {
            var instance = this;
            this.$el.on('scroll', function () {
                var scrollHeight = instance.$el.prop('scrollHeight'),
                    scrollTop = instance.$el.scrollTop(),
                    height = instance.$el.height();

                if (scrollHeight - scrollTop <= height) {
                    instance.renderDetails({
                        offset: instance.collection.length
                    });
                }
            });

            return this;
        },

        forbidMore: function () {
            this.$el.off('scroll');

            return this;
        },

        showLoader: function () {
            this.$el.append(this.$progressBar);
        },

        hideLoader: function () {
            this.$progressBar.remove();
        },

        toggleItemDetails: function ($holders) {
            var instance = this;
            $holders = $holders || this.$('[data-role="item-holder"]');
            $holders.each(function () {
                var $holder = $(this),
                    $button = $holder.find('button[value="button-item-details"]'),
                    $detailsHolder = $holder.find('[data-role="details-holder"]');

                if ($holder.hasClass('open')) {
                    $holder.removeClass('open');
                    $holder.addClass('minimized');
                    $button.html('Expand <i class="icon-chevron-down"></i>');
                    instance.hideDetails($detailsHolder);
                } else {
                    $holder.addClass('open');
                    $holder.removeClass('minimized');
                    $button.html('Collapse <i class="icon-chevron-up"></i> ');
                    instance.showDetails($detailsHolder);
                }
            });
        },

        showDetails: function ($holder) {
            // Implementation depends on source type and is defined in initialize method
            return this;
        },

        hideDetails: function ($holder) {
            // Implementation depends on source type and is defined in initialize method
            return this;
        },

        _onItemDetailsClick: function (e) {
            var $button = $(e.currentTarget),
                $holder = $button.parents('[data-role="item-holder"]');

            this.toggleItemDetails($holder, $button);
        }
    });

    function _showLPDetails($holder) {
        var streamSourceId = this.state.get('streamSourceId'),
            itemId = $holder.data('itemid'),
            url = 'service/stream/' + streamSourceId + '/' + itemId,
            $content = $holder.find('blockquote');
        $holder.show();
        $content.html(this.$progressBar.clone());
        $.get(url, function (message) {
            if (message.htmlVerbatim) {
                $content.html(message.htmlVerbatim);
            } else {
                $content.html('<div>No chat available</div>');
            }
        });

        return this;
    }

    function _hideLPDetails($holder) {
        $holder.hide();

        return this;
    }
}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function(root, Zoomdata) {
    "use strict";
    /*jshint multistr: true */
    /* jshint -W099 */

	var TEMPLATE = '\
            <div class="color-key"> \
                <div class="color-key-content"> \
                    <div class="color-key-metric-label"><b><%= metricLabel %></b></div> \
                    <div class="color-key-linear-view"> \
                        <div class="color-key-scale"></div> \
                        <div class="color-key-labels"></div> \
                    </div> \
                    <ul class="color-key-list-view unstyled" style="display: none;"></ul> \
                </div>	\
            </div>	\
        ',
        COLOR_ITEM_TEMPLATE = '<div class="color-item" style="background: <%= color %>;"></div>',
        COLOR_LIST_TEMPLATE = '<li class="color-list-item"><div class="color-item" style="background: <%= color %>;"></div></li>';

    Zoomdata.Views = Zoomdata.Views || {};

    Zoomdata.Views.ColorKey = Zoomdata.MVC.View.extend({

        defaults: {
            isDraggable: true
        },

		initialize: function (options) {
            _.bindAll(this, "render", "remove");

            if (options.controller) {
                this.controller = options.controller;
                delete options.controller;

                if (this.controller.state.colorMetric) {
                    this.colorMetricLabel = this.controller.state.colorMetric.get('label');
                }

            } else {
                throw new Error('controller must be defined');
            }
            this.autoShow = options.autoShow;

            if (options.type) {
                this.type = options.type;
                delete options.type;
            } else {
                this.type = 'gradient';
            }

            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);

            if (this.options.isDraggable && typeof $.fn.draggable !== "undefined") {
                this.$el.draggable({
                    start: function () {
                        $(this).css({
                            bottom: 'auto',
                            right: 'auto'
                        });
                    },
                    cursor: 'move',
                    containment: this.$el.parent()
                });

                this.$el.on('drag', function (e) {//fixed dragging bug in Heatmap (widget mode)
                    e.stopPropagation();
                });
            }
        },

        render: function () {
            var metricLabel,
                metricFunc;
            if (!this.colorMetricLabel) {
                return this;
            }
            
            this.colorMetric = this.controller._controller.metrics[this.colorMetricLabel];
            if (this.colorMetric && this.colorMetric[0]) {
                this.colorMetric = this.colorMetric[0];
                this.multiMetric = true;
            }
            if (!this.colorMetric) {
                this.hide();
                return this;
            }
            if (!this.multiMetric) {
                metricLabel = this.colorMetric.get('label');
                metricFunc = this.colorMetric.metric.func;
                if (metricFunc && this.colorMetric.metric.name !== 'none') {
                    metricLabel += ' (' + metricFunc + ')';
                }
            } else {
                metricLabel = this.colorMetric.metric.label;
            }
            this.$el.empty().append(_.template(TEMPLATE, {
                metricLabel: metricLabel
            }));
            this.initScale();
            this.initLabels();
            if (this.autoShow) {
                this.show();
            }

            this.delegateEvents();

            return this;
        },

        fixPosition: function() {
            var leftMax = this.$el.parent().width() - this.$el.width() - 5,
                topMax = this.$el.parent().height() - this.$el.height() - 5,
                position = this.$el.position();

            if (position.top > topMax) {
                this.$el.css('top', topMax);
            }
            if (position.left > leftMax) {
                this.$el.css('left', leftMax);
            }
        },

        cloneTo: function(element) {
            var elementCopy = this.$el.find('.color-key').clone().show();
            element.append(elementCopy);
        },

        initScale: function() {
            var vendorPrefix = getVendorPrefix(),
                $colorScale = this.$el.find('.color-key-scale').empty(),
                $colorList = this.$el.find('.color-key-list-view').empty(),
                colors = this.colorMetric.colorRange() || [];
            if (!colors.length) {
                return;
            }
            if (this.colorMetric.metric.name === 'none') {
                colors = [ colors[0], colors[0] ];
            }
            if (!this.multiMetric && (this.controller.state.divergingColorRange === 'gradient' || this.colorMetric.metric.name === 'none')) {
                this.$el.find('.color-key').css('width', '');
                $colorList.hide();
                $colorScale
                    .show()
                    .css('width', null)
                    .css('background', vendorPrefix + 'linear-gradient(left, ' + colors.join(',') + ')')
                    .css('background', 'linear-gradient(to right, ' + colors.join(',') + ')');
            } else if (!this.multiMetric && colors.length <= 3) {
                this.$el.find('.color-key').css('width', '');
                $colorList.hide();
                $colorScale.show().css('width', '85%').css('background', 'transparent');
                $.each(colors, function (index, color) {
                    $colorScale.append(_.template(COLOR_ITEM_TEMPLATE, {
                        color: color
                    }));
                });
                $colorScale.find('.color-item').css('width', (100 / colors.length) + '%');
            } else {
                this.$el.find('.color-key').css('width', 'auto');
                $colorScale.hide();
                $colorList.show();
                $.each(colors, function (index, color) {
                    $colorList.append(_.template(COLOR_LIST_TEMPLATE, {
                        color: color
                    }));
                });
            }
        },

        initLabels: function() {
            var domain = this.colorMetric.domain() || [],
                $colorList = this.$el.find('.color-key-list-view li'),
                $labelsWrapper = this.$el.find('.color-key-labels').empty();

            if (this.controller.state.divergingColorRange === 'gradient') {
                domain = [ domain[0], domain[domain.length - 1] ];
            }
            if (this.colorMetric.metric.name === 'none') {
                domain = [];
            }
            if (!this.multiMetric && domain && typeof domain[0] !== 'undefined') {
                $.each(domain, function (index, value) {
                    if (value > 10) {
                        domain[index] = value = value.toFixed(0);
                    } else if ( (value * 100).toFixed(0) !== (value * 100).toString() ) {
                        domain[index] = value = value.toFixed(2);
                    }
                    if (domain.length <= 4) {
                        $labelsWrapper.append('<span class="color-key-label">' + value + '</span>');
                    }
                });
                if (domain.length > 4) {
                    $colorList.each(function (index, elem) {
                        var label = domain[index];
                        if (domain[index + 1]) {
                            label += ' - ' + domain[index + 1];
                        } else {
                            label += ' +';
                        }
                        elem.innerHTML += label;
                    });
                }
            } else if (this.multiMetric) {
                $colorList.each(function (index, elem) {
                    elem.innerHTML += domain[index];
                });
            }
            if (this.controller.state.divergingColorRange !== 'gradient' && domain.length <= 4) {
                $labelsWrapper.find('.color-key-label').css('width', (100 / domain.length) + '%');
            }
        },

        show: function() {
            this.$el.show();
            this.fixPosition();
        },

        hide: function() {
            this.$el.hide();
            this.autoShow = false;
        },

        isVisible: function() {
            return this.$el.is(':visible');
        }

    });

    function getVendorPrefix() {
        var styles = window.getComputedStyle(document.documentElement, ''),
            pre = (Array.prototype.slice
                .call(styles)
                .join('')
                .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
                )[1];
        return '-' + pre + '-';
    }

}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";
    /*jshint multistr: true */

    Zoomdata.Components = Zoomdata.Components || {};
    
    var SmallObjectFieldItem = Zoomdata.Views.SmallObjectFieldItem;
    var ObjectFieldsBrowserGroup = Zoomdata.Views.GroupedListView;
    var MetricPalette = Zoomdata.Views.MetricPalette;
    var TimeScaleControl = Zoomdata.Views.TimeScaleControl;
    var DataItem = Zoomdata.Views.DataItem;
    var DataDetails = Zoomdata.Views.DataDetails;

    var eventDispatcher = Zoomdata.eventDispatcher;

    var getEndTimeWithinStep = Zoomdata.Utilities.time.getEndTimeWithinStep;
    
    // Templates for visualization name
    var METRIC = "$Metric";
    var GROUPBY = "$Groupby";
    var SOURCE_NAME = "$Source";

    var TEMPLATES = {
        "VERTICAL_BARS": "Vertical Bars: " + SOURCE_NAME + " - " + METRIC + " by " + GROUPBY,
        "PIE": "Pie Chart: " + SOURCE_NAME + " - " + METRIC + " by " + GROUPBY,
        "HEAT_MAP": "Heatmap: " + SOURCE_NAME + " - " + METRIC + " by " + GROUPBY,
        "PIVOT_TABLE": "Pivot Table: " + SOURCE_NAME + " - " + METRIC + " by " + GROUPBY,
        "WORD_CLOUD": "Word Cloud: " + SOURCE_NAME + " - " + METRIC + " by " + GROUPBY,
        "BUBBLES": "Bubbles: " + SOURCE_NAME,
        "SIDE_BY_SIDE_BARS": "Side-by-side Bars: " + SOURCE_NAME,
        "MULTI_LINE": "Multi Line: " + SOURCE_NAME,
        "MULTI_METRIC_TREND": "Multi-Metric Trend: " + SOURCE_NAME,
        "TRENDS": "Time Trends: " + SOURCE_NAME + " - Time Trends by " + METRIC,
        "ZOOMABLE_MAP": "Zoomable Map: " + SOURCE_NAME,
        "STACKED_BARS": "Stacked Bars: " + SOURCE_NAME
    };
    
    Zoomdata.Components.InteractiveElementsMethods = function(){
        this.registerInteractiveElements = function (input, role, options, popoverTitle) {
                // TODO:
                // role:
                // attribute | axis | time;          default: attribute
                // attribute -- supposed to have a radial menu and accept ATTRIBUTE dropped from dataPalette
                // axis -- supposed to accept blue metrics dropped from dataPalette
                // time -- supposed to have special implementation of zoomIn (decrease timeTrendStep)

                if(typeof role == 'object'){
                    options = role;
                }else{
                    $(input).attr('data-zd-interactive-type',role);
                }

                var instance = this,
                    thread = this.thread,
                    getter = options.data,
                    sourceConfig = this.config.get('source'),
                    currentSource = this.source,
                    isTimeSource = sourceConfig.date !== 'undefined',
                    isTimeTrend = this.state.isTimeTrends(),
                    actions = [],
                    droppable = null;

                if (typeof getter == 'function') {
                    switch(role){
                        case 'searchDetails':
                            addSearchDetailsAction();
                            activateDroppable('search');
                            break;
                        case 'search':
                            addSearchDetailsAction();
                            addFilterAllAction();
                            unFilterAllAction();
                            addFilterAction();
                            activateDroppable('search');
                            break;
                        case 'timeScale':
                            addTimeScaleAction();
                            activateDroppable('timeScale');
                            break;
                        case 'attribute':
                            addAttributeAction();
                            activateDroppable('objectField');
                            break;
                        case 'metric':
                            addMetricAction();
                            activateDroppable('metric');
                            break;
                        case 'groupBy1':
                            addAttributeAction();
                            activateDroppable('objectField');
                            break;
                        case 'groupBy2':
                            addAttributeAction();
                            activateDroppable('objectField');
                            break;
                        case 'radius':
                            addRadiusAction();
                            activateDroppable('metric');
                            break;
                        case 'objectFieldAcceptor':
                            activateDroppableAcceptor();
                            break;
                        case 'pivotLabel':
                            addPivotLabelAction();
                            activateDroppableAcceptor();
                            break;
                        default:
                            addInfoAction(options);
                            addFilterAllAction();
                            unFilterAllAction();
                            addFilterAction();
                            addZoomAction();
                            if (isTimeSource && !isTimeTrend)
                                addTrendsAction();
                            if (!isTimeTrend)
                                addExcludeAction();
                            activateDroppable('objectField');
                            break;
                    }
                }

            instance.elementsManager.register(input, {
                actions: actions,
                droppable: droppable,
                data: getter
            });

            function addInfoAction(options) {

                    actions.push({
                        name: 'info',
                        group: getter(),
                        label: 'Info',
                        type: 'icon',
                        action: function (event, $at) {
                            var data = getter(),
                                paths = instance.state.groupBy.getAttributes(),
                                path = paths[0],
                                isMultiGroup = paths.length > 1,
                                volume = instance.state.get('volume'),
                                fields = instance.fields,
                                fromTime = instance.state.time.get("fromTime"),
                                toTime = instance.state.time.get("time"),
                                timeTrendStep = instance.state.get('timeTrendStep'),
                                trendsLabel = "";

                            if (instance.state.isTimeTrends()) {
                                var timestampGranularity = instance._controller.fields.findWhere({name: path}).get('timestampGranularity');
                                var _utc = timestampGranularity === 'DAY';
                                fromTime = data.group;
                                toTime = getEndTimeWithinStep(data.group, timeTrendStep, _utc);

                                trendsLabel = new Zoomdata.Components.MetricFormatter(timeTrendStep, timestampGranularity).format(data.group);
                            }

                            var dataItem = new DataItem({
                                    state: instance.state,
                                    fields: fields,
                                    data: data
                                });

                            var dataDetails = null;

                            if (!options.hideDetails) {
                                dataDetails = new DataDetails({
                                    state: instance.state,
                                    fields: fields,
                                    data: data,
                                    fromTime: fromTime,
                                    toTime: toTime
                                });
                            }

                            showInfo();

                            function showInfo() {

                                thread.on('thread:message', updateInfo);
                                thread.on('thread:timeline', updateTime);

                                var palette = new Zoomdata.Controls.InfoPopup({
                                    containment: Zoomdata.main.$section,
                                    customClass: dataDetails ? "" : "zd-infopopup-hide-details"
                                });

                                var actions = null;
                                if (dataDetails) {
                                    actions = [{
                                            label: 'Details',
                                            type: 'success',
                                            callback: function () {
                                                palette.hide();
                                                showDetails();
                                            }
                                        }];
                                }

                                palette
                                    .setActions(actions)
                                    .render(
                                        dataItem.render().el,
                                        instance.state.isTimeTrends()
                                            ? trendsLabel
                                            : (data.key ? data.key + ', ' : '') + data.group
                                    ).position({
                                        of: $at,
                                        my: 'left top-30',
                                        at: 'center center',
                                        collision: 'flipfit flipfit'
                                    });

                                palette.onHide = function () {
                                    thread.off('thread:message', updateInfo);
                                    thread.off('thread:timeline', updateTime);
                                    dataItem.remove();
                                };
                            }

                            function showDetails() {
                                var detailsPopup = new Zoomdata.Controls.DetailsPopup({
                                        containment: Zoomdata.main.$section,
                                        modal: true,
                                        wide: true
                                    }),
                                    path = isMultiGroup ? paths[1] : paths[0];

                                detailsPopup.onHide = function () {
                                    dataDetails.remove();
                                };

                                detailsPopup
                                    .render(
                                        dataDetails.render().el,
                                        instance.state.isTimeTrends()
                                            ? trendsLabel
                                            : fields.findWhere({name: path}).get('label')
                                                + ': ' + data.group
                                    ).position({
                                        of: Zoomdata.main.$section,
                                        my: 'center top',
                                        at: 'center top',
                                        collision: 'flip flip'
                                    });
                            }

                            function updateInfo(data) {
                                dataItem.update(data);
                            }

                            function updateTime() {
                                dataItem.render()
                            }
                        }
                    });

                }

            function addTrendsAction() {
                actions.push({
                    name: 'trend',
                    group: getter(),
                    label: 'Trend',
                    disabled: function(){
                        return instance.config.attributes.source.date === undefined;
                    },
                    action: function () {
                        var presentTrends = function(trends) {
                            var data = getter(),
                                path = instance.state.groupBy.getAttributes(),
                                filters = instance.state.filters,
                                filter = {
                                    editable: true,
                                    operation: 'IN',
                                    path: path[0],
                                    value: [data.group]
                                },
                                existing = filters.findWhere({
                                    path: path
                                });

                            if (instance.state.groupBy.length > 1) {
                                filter = [{
                                    editable: true,
                                    operation: 'IN',
                                    path: path[1],
                                    value: [data.group]
                                }, {
                                    editable: true,
                                    operation: 'IN',
                                    path: path[0],
                                    value: [data.key]
                                }];
                            }

                            trends.bootstrap()
                                .done(function () {
                                    if (existing) {
                                        existing.hasAttribute(data.group)
                                            ? existing.set(filter, {silent: true})
                                            : existing.addAttribute(data.group, {silent: true})

                                    } else {
                                        $.isArray(filter)
                                            ? _.each(filter, function(f){
                                                instance.state.filters.add(f, {silent: true});
                                            })
                                            : instance.state.filters.add(filter, {silent: true});
                                    }

                                    instance.setVisualization(trends);
                                })
                                .fail(function () {
                                    var notification = new Zoomdata.Controls.Notification({
                                        type: 'error'
                                    });

                                    notification.render("Couldn't configure Time Trends visualization.");
                                });
                        };

                        currentSource.visualizations.bootstrap()
                            .done(function () {
                                if (instance._controller.trends) {
                                    var trends = instance._controller.trends(currentSource.visualizations.toJSON());

                                    if (trends) {
                                        presentTrends(currentSource.visualizations.findWhere({visId: trends.visId}));
                                    }
                                }
                                else {
                                    presentTrends(currentSource.visualizations.findWhere({type: 'TRENDS'}));
                                }
                            });
                    }
                });
            }

            function addFilterAllAction() {

                actions.push({
                    name: 'filter_all',
                    group: getter(),
                    disabled: function(){
                        return Zoomdata.Utilities.isSingleVizualization();
                    },
                    label: 'Filter <br> all',
                    action: function () {
                        var data = getter(),
                            sourceId = instance.state.config.sourceId,
                            path = instance.state.groupBy.getAttributes(),
                            filter = {
                                editable: true,
                                operation: 'IN',
                                path: data.attr || path[0],
                                value: [data.group]
                            };

                        if (instance.state.groupBy.length > 1) {
                            filter = [{
                                        editable: true,
                                        operation: 'IN',
                                        path: path[1],
                                        value: [data.group]
                                    }, {
                                        editable: true,
                                        operation: 'IN',
                                        path: path[0],
                                        value: [data.key]
                                    }];
                        }

                        eventDispatcher.trigger(
                            'visualization:filterAll', sourceId, instance.UUID, filter,
                            {
                                timestampField: instance.state.get('timestampField'),
                                timeTrendStep: instance.state.get('timeTrendStep')
                            }
                        );
                    }
                });
            }

            function unFilterAllAction() {

                actions.push({
                    name: 'un_filter_all',
                    group: getter(),
                    disabled: function(){
                        return Zoomdata.Utilities.isSingleVizualization();
                    },
                    label: 'Un<br>Filter <br> all',
                    action: function () {
                        var data = getter(),
                            sourceId = instance.state.config.sourceId,
                            path = instance.state.groupBy.getAttributes(),
                            filter = {
                                editable: true,
                                operation: 'NOTIN',
                                path: path[0],
                                value: [data.group]
                            };

                        if (instance.state.groupBy.length > 1) {
                            filter = [{
                                        editable: true,
                                        operation: 'IN',
                                        path: path[1],
                                        value: [data.group]
                                    }, {
                                        editable: true,
                                        operation: 'IN',
                                        path: path[0],
                                        value: [data.key]
                                    }];
                        }

                        eventDispatcher.trigger('visualization:unfilterAll', sourceId, instance.UUID, filter);
                    }
                });
            }

            function addFilterAction() {
                actions.push({
                    name: 'filter',
                    group: getter(),
                    label: 'Filter',
                    action: function (event, $at) {
                        var data = getter(),
                            sourceId = instance.state.config.sourceId,
                            path = instance.state.groupBy.getAttributes(),
                            filter = {
                                editable: true,
                                operation: 'IN',
                                path: data.attr || path[0],
                                value: [data.group]
                            };

                            if (instance.state.groupBy.length > 1) {
                                filter = [{
                                            editable: true,
                                            operation: 'IN',
                                            path: path[1],
                                            value: [data.group]
                                        }, {
                                            editable: true,
                                            operation: 'IN',
                                            path: path[0],
                                            value: [data.key]
                                        }];
                            }

                        eventDispatcher.trigger(
                            'visualization:filter', sourceId, instance.UUID, filter, $at,
                            {
                                timestampField: instance.state.get('timestampField'),
                                timeTrendStep: instance.state.get('timeTrendStep')
                            }
                        );
                    }
                });
            }

            function addAttributeAction(){
                actions.push({
                    name: 'attribute',
                    group: getter(),
                    label: 'Attribute',
                    action: function ($at) {
                        var data = getter();
                        if (instance.state.isTimeTrends()) {
                            var step = instance.state.get('timeTrendStep'),
                                timeFrom = new Date(data.group),
                                timeTo = new Date(Zoomdata.Utilities.time.getEndTimeWithinStep(timeFrom, step)),
                                range = Zoomdata.Utilities.time.getRoundedDateRange(timeFrom, timeTo),
                                dataResolution = instance.state.config.get("source").dataResolution;

                            if ((dataResolution && step === dataResolution) || step === 'MINUTE') {
                                return;
                            }

                            instance.state.time.set({'time': timeTo.getTime()},{silent: true});
                            instance.state.set({
                                'timeTrendStep': range.step,
                                'limit': range.amount + 1
                            }, {silent: true});

                            instance.state.trigger('change');

                            return;
                        }

                        var palette = new Zoomdata.Controls.PalettePopup({
                                containment: Zoomdata.main.$section,
                                customClass: 'attributePalette',
                                pointerWidth: 14
                            }),
                            objectFieldsBrowser = new ObjectFieldsBrowserGroup({
                                className: 'nav nav-tabs nav-stacked',
                                ItemView: SmallObjectFieldItem,
                                collection: instance.fields,
                                groupBy: "type",
                                filter: function (model) {
                                    var isVisible = !!model.get('visible'),
                                        isAttribute = model.get('type') == 'ATTRIBUTE',
                                        specialTypes = ['SIDE_BY_SIDE_BARS', 'HORIZONTAL_SIDE_BY_SIDE_BARS', 'STACKED_BARS', 'VERTICAL_100PCT_STACKED_BARS', 'VERTICAL_STACKED_BARS'],
                                        type = instance.config.get('type');

                                    model.get('label') === data
                                            ? model.set({selected: true}, {silent: true})
                                            : model.set({selected: false}, {silent: true});

                                    // Only used for multi group by
                                    // README: We can change specialTypes checking to new groupBy behavior
                                    // groupBy = instance.visualizationController.state.groupBy;
                                    // if (groupBy.length > 1) { }

                                    if ((specialTypes.indexOf(type) != -1)) {
                                        var disabledName = "";
                                        if (input.hasClass('groupBy1')) {
                                            disabledName = instance._controller.variables["Second Group By"];
                                        }
                                        else if (input.hasClass('groupBy2')) {
                                            disabledName = instance._controller.variables["First Group By"];
                                        }

                                        model.get('name') === disabledName
                                                    ? model.set({disabled: true}, {silent: true})
                                                    : model.set({disabled: false}, {silent: true});

                                    }

                                    return (isVisible
                                        && isAttribute);
                                },
                                comparator: function(model) {
                                    return model.get("label");
                                }
                            });

                        palette.render(objectFieldsBrowser.render().el, popoverTitle);
                        palette.position({
                            of: $at,
                            my: 'left+20 top-30',
                            at: 'right center',
                            collision: 'flipfit flipfit'
                        });

                        instance.listenToOnce(objectFieldsBrowser, 'select', function (objectField) {

                            if (objectField.get('disabled')) return;

                            var type = instance.config.get('type'),
                                templateType = instance.config.get('templateType'),
                                specialTypes = ['SIDE_BY_SIDE_BARS', 'STACKED_BARS'];

                            if ((specialTypes.indexOf(type) != -1) || (specialTypes.indexOf(templateType) != -1)) {
                                if(input.hasClass('groupBy1')){
                                    instance.state.groupBy.at(0).setAttribute(objectField.get('name'));
                                }
                                if(input.hasClass('groupBy2')){
                                    instance.state.groupBy.at(1).setAttribute(objectField.get('name'));
                                }
                            } else {
                                instance.state.groupBy.setAttribute(objectField.get('name'));
                            }

                            palette.remove();
                            objectFieldsBrowser.remove();
                        });
                    }
                });
            }

            function addPivotLabelAction() {
            var pivot = options.pivot();
            var callbacks = options.callbacks();
            var data = getter(),
                    type = data.get && data.get('type') === 'ATTRIBUTE' || data.type === 'ATTRIBUTE' ? 'attribute' : 'metric';
            if (type === 'attribute') {
            actions.push({
                    name: 'attribute',
                    group: getter(),
                    label: 'Attribute',
                    action: function($at) {
                        var el = $at.closest('[data-zd-interactive-type="pivotLabel"]');

                        if($at.is('[data-zd-interactive-type="pivotLabel"]')){
                            el = $at;
                        }

                         el.addClass('active');

                        var palette = new Zoomdata.Controls.PalettePopup({
                            containment: Zoomdata.main.$section,
                            customClass: 'attributePalette',
                            pointerWidth: 14,
                            handlers: callbacks&&callbacks.attribute&&callbacks.attribute.onRemove?callbacks.attribute.onRemove(data,'attributePalette'):null
                        }),
                        objectFieldsBrowser = new ObjectFieldsBrowserGroup({
                            className: 'nav nav-tabs nav-stacked',
                            ItemView: SmallObjectFieldItem,
                            collection: instance.fields,
                            groupBy: "type",
                            filter:callbacks&&callbacks.attribute&&callbacks.attribute.filter?function(model){return callbacks.attribute.filter(model,data)}:function(){return true},
                            comparator: function(model) {
                                return model.get("label");
                            }
                        });

                         palette.onHide=function(){
                             el.removeClass('active');
                        };

                        palette.render(objectFieldsBrowser.render().el, popoverTitle);
                        palette.position({
                            of: $at,
                            my: 'left+20 top-30',
                            at: 'right center',
                            collision: 'flipfit flipfit'
                        });

                        instance.listenToOnce(objectFieldsBrowser, 'select', function(objectField) {
                            callbacks&&callbacks.attribute&&callbacks.attribute.onClick?callbacks.attribute.onClick(data,palette,objectField):function(){return true}
                        });
                    }
                });
            } else {
                actions.push({
                    name: 'metric',
                    group: getter(),
                    label: 'Metric',
                    action: function($at, e) {
                         var el = $at.closest('[data-zd-interactive-type="pivotLabel"]');
                        if($at.is('[data-zd-interactive-type="pivotLabel"]')){
                            el = $at;
                        }

                         el.addClass('active');

                        var palette = new Zoomdata.Controls.PalettePopup({
                            containment: Zoomdata.main.$section,
                            customClass: 'metricPalette',
                            pointerWidth: 14,
                            handlers: callbacks&&callbacks.metric&&callbacks.metric.onRemove?callbacks.metric.onRemove(data,'attributePalette'):null
                            }),
                            objectFieldsBrowser = new MetricPalette({
                            collection: instance.fields,
                            currentItem: data.attributes,
                            filter: callbacks&&callbacks.metric&&callbacks.metric.filter?function(model){return callbacks.metric.filter(model,data)}:function(){return true}
                        });

                        palette.onHide=function(){
                            el.removeClass('active');
                        };

                        palette.render(objectFieldsBrowser.render().el, popoverTitle);
                        palette.position({
                            of: e,
                            my: 'left+5 center',
                            at: 'center center',
                            collision: 'flipfit flipfit'
                        });

                        instance.listenTo(objectFieldsBrowser, 'select:metric', function(objectField){
                            callbacks&&callbacks.metric&&callbacks.metric.onClick?callbacks.metric.onClick(data,palette,objectField):function(){return true}
                        });
                    }
                });
            }



            instance.elementsManager.register(input, {actions: actions});
        }

            function addTimeScaleAction() {
                actions.push({
                    name: 'timeScale',
                    group: getter(),
                    label: 'Time Scale',
                    action: function ($at) {
                        var data = getter();
                        var palette = new Zoomdata.Controls.PalettePopup({
                                containment: Zoomdata.main.$section,
                                customClass: 'timeScalePaletteContainer',
                                pointerWidth: 14
                            }),
                            scaleBrowser = new TimeScaleControl({
                                className: 'timeScalePalette',
                                currentItem: getter()
                            });

                        palette.render(scaleBrowser.render().el, popoverTitle);
                        palette.position({
                            of: $at,
                            my: 'left+20 top-30',
                            at: 'right center',
                            collision: 'flipfit flipfit'
                        });

                        instance.listenToOnce(scaleBrowser, 'select', function (scale) {
                            var intervalsPrototype = [
                                    {name:'MINUTE',title:'Minutes',limit:60, time: 60},
                                    {name:'HOUR',title:'Hours',limit:24, time: 60*60},
                                    {name:'DAY',title:'Days',limit:7, time: 60*60*24},
                                    {name:'WEEK',title:'Weeks',limit:5, time: 60*60*24*7},
                                    {name:'MONTH',title:'Months',limit:12, time: 60*60*24*31},
                                    {name:'YEAR',title:'Years',limit:4, time: 60*60*24*365}
                                ];
                            var step = intervalsPrototype.filter(function(d){return scale.toUpperCase() === d.name;})[0],
                                oldStep = this._controller.state.get('timeTrendStep'),
                                oldLimit = this._controller.state.get('limit'),
                                min = new Date(this._controller.state.time.get('min')),
                                max = new Date(this._controller.state.time.get('max')),
                                maxPossibleLimitSet = {
                                    'MINUTE' : Zoomdata.Utilities.time.getRoundedDateRange(min, max, 'MINUTE'),
                                    'HOUR' : Zoomdata.Utilities.time.getRoundedDateRange(min, max, 'HOUR'),
                                    'DAY' : Zoomdata.Utilities.time.getRoundedDateRange(min, max, 'DAY'),
                                    'WEEK' : Zoomdata.Utilities.time.getRoundedDateRange(min, max, 'WEEK'),
                                    'MONTH' : Zoomdata.Utilities.time.getRoundedDateRange(min, max, 'MONTH'),
                                    'YEAR' : Zoomdata.Utilities.time.getRoundedDateRange(min, max, 'YEAR')
                                },
                                maxPossibleLimit = maxPossibleLimitSet[step.name].amount + 1;

                            step.limit = Zoomdata.Utilities.time.recalculateLimit(oldStep, oldLimit, step.name);
                            step.limit = step.limit > maxPossibleLimit ? maxPossibleLimit : step.limit;

                            this._controller.state.set({ timeTrendStep: step.name, limit: step.limit }, {silent: true});
                            this._controller.state.trigger('change');

                            palette.remove();
                            scaleBrowser.remove();
                        });
                    }
                });
            }

            function addMetricAction() {
                actions.push({
                    name: 'metric',
                    group: getter().label,
                    label: 'Metric',
                    action: function ($at,e) {
                        var data = getter(),
                            palette = new Zoomdata.Controls.PalettePopup({
                                autohide: false,
                                containment: Zoomdata.main.$section,
                                customClass: 'metricPalette',
                                pointerWidth: 14
                            }),
                            objectFieldsBrowser = new MetricPalette({
                                collection: instance.visualizationController.fields,
                                currentItem: $.extend({}, instance.field.toJSON(), instance.metric.toJSON())
                            });

                        instance.childViews.push(palette);
                        instance.childViews.push(objectFieldsBrowser);

                        palette.render(objectFieldsBrowser.render().el, instance.options.popoverTitle)
                            .position({
                                of: e,
                                my: 'left+5 center',
                                at: 'center center',
                                collision: 'flipfit flipfit'
                            });

                        palette.onHide = function() {
                            objectFieldsBrowser.trigger('hide');

                            instance.childViews.splice(instance.childViews.indexOf(palette), 1);
                            instance.childViews.splice(instance.childViews.indexOf(objectFieldsBrowser), 1);
                        };

                        instance.listenTo(objectFieldsBrowser, 'select:metric', function (objectField) {
                            instance.state.metrics.at(0).set(objectField);
                        });
                    }
                });
            }

            function addRadiusAction(){
                actions.push({
                    name: 'radius',
                    group: getter().label,
                    label: 'Radius',
                    action: function ($at,e) {
                        var data = getter(),
                            palette = new Zoomdata.Controls.PalettePopup({
                                containment: Zoomdata.main.$section,
                                customClass: 'metricPalette',
                                pointerWidth: 14
                            }),
                            objectFieldsBrowser = new MetricPalette({
                                collection: instance.fields,
                                currentItem: data
                            });

                        palette.render(objectFieldsBrowser.render().el, popoverTitle);
                        palette.position({
                            of: e,
                            my: 'left top-30',
                            at: 'center center',
                            collision: 'flipfit flipfit'
                        });
                        palette.onHide = function(){
                            objectFieldsBrowser.trigger('hide');
                        };

                        // TODO: Should be rewrited after implemented new variables instead of Volume and Color using
                        // Now variable metric used "metricname:func"
                        instance.listenTo(objectFieldsBrowser, 'select:metric', function (objectField) {
                            instance.state.config.get('source').variables['_metric-radius'] = objectField.name + ":" + objectField.func;
                            instance.state.trigger('change');
                        });
                    }
                });
            }

            function addZoomAction() {
                actions.push({
                    name: 'zoom',
                    group: getter(),
                    label: 'Zoom',
                    action: function (event, $at) {
                        var data = getter(),
                            paths = instance.state.groupBy.getAttributes(),
                            path = paths[0],
                            isMultiGroup = paths.length > 1;

                        if (instance.state.isTimeTrends()) {
                            var step = instance.state.get('timeTrendStep'),
                                timeFrom = new Date(data.group),
                                timeTo = new Date(Zoomdata.Utilities.time.getEndTimeWithinStep(timeFrom, step)),
                                range = Zoomdata.Utilities.time.getRoundedDateRange(timeFrom, timeTo),
                                dataResolution = instance.state.config.get("source").dataResolution;

                            if ((dataResolution && step === dataResolution) || step === 'MINUTE') {
                                return;
                            }
                            instance.state.time.set({'time': timeTo.getTime()},{silent: true});
                            instance.state.set({
                                'timeTrendStep': range.step,
                                'limit': range.amount + 1
                            }, {silent: true});
                            instance.state.trigger('change');

                            return;
                        }

                        var filter = {
                                editable: true,
                                operation: 'IN',
                                path: path,
                                value: [data.group]
                            },
                            palette = new Zoomdata.Controls.PalettePopup({
                                containment: Zoomdata.main.$section,
                                customClass: 'attributePalette'
                            }),
                            objectFieldsBrowser = new ObjectFieldsBrowserGroup({
                                className: 'nav nav-tabs nav-stacked',
                                ItemView: SmallObjectFieldItem,
                                itemOption: {checkbox: false},
                                collection: instance.fields,
                                groupBy: "type",
                                filter: function (model) {
                                    var isVisible = !!model.get('visible'),
                                        isAttribute = model.get('type') == 'ATTRIBUTE',
                                        isCurrentGroup = model.get('name') == path;

                                    return (isVisible
                                        && isAttribute
                                        && !isCurrentGroup);
                                },
                                comparator: function(model) {
                                    return model.get("label");
                                }
                            });

                        palette.render(objectFieldsBrowser.render().el, 'Zoom Into');
                        palette.position({
                            of: $at,
                            my: 'left+20 top-30',
                            at: 'center center',
                            collision: 'flipfit flipfit'
                        });

                        instance.listenToOnce(objectFieldsBrowser, 'select', function (objectField) {
                            if (isMultiGroup) {
                                switchToBars(objectField);
                            } else {
                                instance.state.addFilter(filter, {silent: true});
                                instance.state.groupBy.setAttribute(objectField.get('name'));
                            }

                            palette.remove();
                            objectFieldsBrowser.remove();

                            Zoomdata.eventDispatcher.trigger('zoomItem:select');
                        });

                        function switchToBars(objectField){
                            var path = instance.state.groupBy.getAttributes(),
                                filter = [{
                                            editable: true,
                                            operation: 'IN',
                                            path: path[1],
                                            value: [data.group]
                                        }, {
                                            editable: true,
                                            operation: 'IN',
                                            path: path[0],
                                            value: [data.key]
                                        }];
                                    
                            currentSource.visualizations.bootstrap()
                                    .done(function () {
                                        var bars = currentSource.visualizations.findWhere({type: 'VERTICAL_BARS'});
                                        bars.bootstrap()
                                            .done(function () {
                                                bars.get('source').variables['Comparison'] = "Off";
                                                
                                                instance.setVisualization(bars);
                                                
                                                instance.state.groupBy.setAttribute(objectField.get('name'),{silent:true});
                                                _.each(filter, function (f){
                                                    instance.state.filters.add(f, {silent: true});
                                                });                                                
                                            });
                                    });
                        };

                    }
                });
            }

            function addSearchDetailsAction() {
                actions.push({
                    name: 'search_details',
                    group: getter(),
                    label: 'Details',
                    action: function (event, $at) {
                        var data = getter();

                        showInfo();

                        function showInfo() {
                            var palette = new Zoomdata.Controls.InfoPopup({
                                containment: Zoomdata.main.$section,
                                customClass: 'searchResultsDetails'
                            });

                            var actions = null,
                                fields = instance.fields,
                                fieldLabels = {};
                            fields.each(function(f){
                                fieldLabels[f.get('name')] = f.get('label');
                            });
                            var SearchDetailsView = Zoomdata.MVC.View.extend({
                                itemTemplate: '<tr>\n\
                                    <td><%= name %></td>\n\
                                    <td><%= value %></td>\n\
                                </tr>',
                                tagName: 'table',
                                initialize: function(options){
                                    Zoomdata.MVC.View.prototype.initialize.call(this,options);
                                    _.bindAll(this, 'render');
                                    this.data = options.data || {};
                                    this.query = options.query || '';
                                },
                                preg_quote: function (str) {
                                    return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
                                },
                                highlightMatchedWords: function (value) {
                                    var highlighted = value;
                                    if (typeof highlighted == "string" && this.query && this.query !== ''){
                                        highlighted =  value.replace(new RegExp("(" + this.preg_quote(this.query).replace(' ','|') + ")", 'gi'), "<span class='selected-result'>$1</span>");
                                    }
                                    return highlighted;
                                },
                                render: function(){
                                    var html = '';
                                    for (var attr in this.data) {
                                        if (this.data.hasOwnProperty(attr)) {
                                            var name  = fieldLabels[attr],
                                                value = this.highlightMatchedWords(this.data[attr]);
                                            html += _.template(this.itemTemplate,{
                                                name : name,
                                                value: value
                                            });
                                        }
                                    }
                                    this.$el.html(html);
                                    return this;
                                }
                            });
                            var searchDetailsView = new SearchDetailsView({
                                data : data.metadata,
                                query: data.query
                            });
                            palette
                                .setActions(actions)
                                .render(
                                    searchDetailsView.render().el,
                                    'Search Result Detail'
                                ).position({
                                    of: $at,
                                    my: 'left top-30',
                                    at: 'center center',
                                    collision: 'flipfit flipfit'
                                });

                            palette.onHide = function () {
                                searchDetailsView.remove();
                            };
                        }
                    }
                });
            }

            function addExcludeAction() {
                actions.push({
                name: 'exclude',
                group: getter(),
                label: 'Exclude',
                type: 'icon',
                action: function () {
                        var data = getter(),
                            type = instance.config.get('type'),
                            pathes = instance.state.groupBy.getAttributes(),
                            path = Array.isArray(pathes) ? pathes[0] : pathes,
                            value = data.group;

                        if (type === 'STACKED_BARS') {
                            value = data.key;
                        } 
                        else if (type === 'SIDE_BY_SIDE_BARS') {
                            path = Array.isArray(pathes) ? pathes[1] : pathes;
                        }
                        
                        var filter = {
                                editable: true,
                                operation: 'NOTIN',
                                path: path,
                                value: [value]
                            };
                        var existing = instance.state.filters.findWhere({
                            path      : path,
                            operation :'NOTIN'
                        });
                        if(existing){
                            var existedValues = existing.get('value');
                            if(existedValues.indexOf(value) === -1){
                                filter.value = existedValues.concat([value]);
                            }else{
                                return;
                            }
                        }
                        instance.state.addFilter(filter);
                    }
                });
            }

            function activateDroppable(scope) {
                droppable = {
                    scope: scope,
                    over: function () {

                    },
                    drop: function (objectField) {
                        var $input = $(input),
                            interactiveType = $input.attr('data-zd-interactive-type'),
                            data = getter();

                        if (interactiveType) {
                            switch (interactiveType) {
                                case 'group':
                                case 'multi-group':
                                case 'attribute':
                                    if (objectField.get('type') == 'ATTRIBUTE'
                                        && instance.fields.findWhere({
                                        name: objectField.get('name')
                                    }) !== null)  {
                                        instance.state.groupBy.setAttribute(objectField.get('name'));
                                    }
                                    break;
                                case 'metric':
                                    if (Zoomdata.Utilities.isNumericAttributeType(objectField.get('type'))
                                        && instance.fields.findWhere({
                                        name: objectField.get('name')
                                    }) !== null)  {
                                        var newMetric = new Zoomdata.Components.Metric({
                                            name: objectField.get('name'),
                                            func: objectField.get('func') ? objectField.get('func').toLowerCase() : 'avg',
                                            type: objectField.get('type'),
                                            label: objectField.get('label')
                                        });

                                        instance.state.set('volume', newMetric);
                                    }

                                    break;
                            }
                        } else {
                            if (objectField.get('type') == 'ATTRIBUTE'
                                && instance.fields.findWhere({
                                name: objectField.get('name')
                            }) !== null)  {
                                if (instance.config.get('type') === 'TRENDS') {
                                    Zoomdata.eventDispatcher.trigger('TimeTrendsZoomIn', data.group);
                                    return;
                                }
                                var path = instance.state.groupBy.getAttribute(),
                                    filter = {
                                        editable: true,
                                        operation: 'IN',
                                        path: path,
                                        value: [data.group]
                                    };

                                instance.state.addFilter(filter, {silent: true});

                                instance.state.groupBy.setAttribute(objectField.get('name'));
                            }
                        }
                    },
                    out: function () {

                    }
                };
            }

            function activateDroppableAcceptor() {
                droppable = {
                    scope: 'objectField',
                    over: function () {

                    },
                    drop: function (objectField) {
                        options.droppable.drop(objectField);
                    },
                    out: function () {

                    }
                };
            }
        }

        this.releaseInteractiveElement = function (input, options) {
            if (this.isRemote) return null; //TODO: A temporary solution for StandaloneClient.

            this.elementsManager.release(input, options);
            }
    };
} (window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    var eventDispatcher = Zoomdata.eventDispatcher;

    Zoomdata.Components = Zoomdata.Components || {};
    Zoomdata.Components.InteractiveElementController = function (manager, element, options) {
        var instance = this,
            hasData = (typeof options.data == 'function'),
            hasActions = !!(options.actions),
            hasDraggableHandlers = !!(options.draggable),
            hasDroppableHandlers = !!(options.droppable);

        _.bindAll(this, '_onInteractionStart', '_onInteraction', '_onInteractionEnd');

        if (typeof $(element).data('interactiveElement') !== 'undefined'
                && $(element).data('interactiveElement') !== null)
            throw new Error('An element already is an instance of interactiveElement');

        this._manager = manager;
        this.element = element;
        this.$el = $(this.element);
        
        this.gestureTimeOut = null;

        if (this.isSVG()) {
            this._createDroppable = _createSVGDroppable;
            this._destroyDroppable = _destroySVGDroppable;
        }

        if (options.actionList) {
            this.actionList = options.actionList;
            delete options.actionList;
        }

        this.options = {};

        this.options.interactions = $.extend({},
            this.defaults.interactions,
            options.interactions);

        this.data = (hasData
            ? options.data
            : null);

        hasActions
            ? this.options.actions = options.actions
            : null;

        hasDroppableHandlers
            ? this.droppable = this._createDroppable(options.droppable)
            : this.droppable = null;

        hasDraggableHandlers
            ? this.draggable = this._createDraggable(options.draggable)
            : this.draggable = null;

        this._allowed = [];
        this._prevented = [];

        this._allow(this.options.interactions.start);
        this._allow(this.options.interactions.action);
        this._allow(this.options.interactions.end);

        this.$el.data('interactiveElement', this);
    };



    Zoomdata.Components.InteractiveElementController.prototype = {
        defaults: {
            interactions: {
                start: 'mousedown',
                action: clickEvents(),
                end: 'mouseup'
            },
            draggable: {
                containment: 'body',
                appendTo: 'body',
                helper: 'clone',
                revert: 'invalid',
                addClasses: false,
                dragClass: 'zd-interactive-draggable',
                cursor: 'pointer',
                cursorAt: {left: 25, top: 25},
                zIndex: 2000,
                scope: 'default'
            },
            droppable: {
                addClasses: false,
                tolerance: 'pointer',
                activeClass: 'zd-interactive-droppable-accepts',
                scope: 'default'
            }
        },

        get: function () {
            var values = [];

            if (arguments.length == 0) {
                values = this.options
            } else if (arguments.length == 1) {
                values = this.options[arguments[0]] || null
            } else {
                for (var i = 0; i < arguments.length; i++) {
                    values[arguments[i]] = this.options[arguments[i]] || null;
                }
            }

            return values;
        },

        set: function (options) {

        },

        showActionsList: function (at) {
            var self = this;
            if(this.gestureTimeOut !== null){
                return this;
            }
            if (typeof this.actionList !== 'undefined') {

                at = at || {};

                at.left = typeof at.left !== 'number'
                    ? this.$el.offset().left + this.$el.width()/2
                    : at.left;
                at.top = typeof at.top !== 'number'
                    ? this.$el.offset().top + this.$el.height()/2
                    : at.top;
                
                // Ta-da. Hack for IE 10 with love.
                if(navigator.appVersion.indexOf("MSIE 10.")!=-1){
                    setTimeout(function(){
                        self.actionList
                            .close();
                    },100);
                    setTimeout(function(){
                        self.actionList
                            .reset(self.options.actions);
                    },200);
                    setTimeout(function(){
                        self.actionList
                            .render(at);
                    },300);
                    this.gestureTimeOut = setTimeout(function(){
                        self.gestureTimeOut = null;
                    },600);
                }else{ // Normal case for normal browsers
                    this.actionList
                        .close()
                        .reset(this.options.actions)
                        .render(at);
                }
            }

            return this;
        },

        isSVG: function () {
            return !!(this.element.tagName == 'svg' || this.element.ownerSVGElement !== null);
        },

        _notify: function (action, options) {
            this._manager._notify(action, this, options);
        },

        _createDroppable: _createHTMLDroppable,

        _destroyDroppable: _destroyHTMLDroppable,

        _createDraggable: function (draggable) {
            var instance = this,
                options = this.options.draggable = $.extend({},
                    this.defaults.draggable,
                    draggable);

            options.start = function (e, ui) {
                var helper = ui.helper;

                instance._dragHelper = helper;
                instance._notify('drag:start');

                helper.css('pointer-events', 'none');

                !helper.hasClass(options.dragClass)
                    ? helper.addClass(options.dragClass)
                    : null;

                typeof draggable.start == 'function'
                    ? draggable.start.apply(this, arguments)
                    : null;
            };

            options.drag = function () {

                typeof draggable.drag == 'function'
                    ? draggable.drag.apply(this, arguments)
                    : null;
            };
            options.stop = function (e, ui) {
                var helper = ui.helper;

                instance._notify('drag:stop');

                instance.$el.draggable('option','revert', options.revert);

                helper.css('pointer-events', 'all');

                helper.hasClass(options.dragClass)
                    ? helper.removeClass(options.dragClass)
                    : null;

                typeof draggable.stop == 'function'
                    ? draggable.stop.apply(this, arguments)
                    : null;
            };
            
            // Dirty hack maden to unify our d'n'd logic for attributes
            // without changing logic of all of visualizations
            this.$el.on('touchend', function(event){
                var endTarget = document.elementFromPoint(
                    event.originalEvent.changedTouches[0].pageX,
                    event.originalEvent.changedTouches[0].pageY
                );
                $(endTarget).trigger('mouseup');
            });

            this.$el.draggable(options);

            return this.$el.data('draggable');
        },

        _destroyDraggable: function () {
            this.draggable
                ? this.draggable.destroy()
                : null;

            this._dragHelper instanceof jQuery
                ? this._dragHelper.remove()
                : null;
        },

        _isAllowed: function (eventType) {
            return this._allowed.indexOf(eventType) !== -1;
        },

        _allow: function (eventType) {
            var interactions = this.options.interactions,
                instance = this;

            if (!this._isAllowed(eventType)) {
                this._allowed.push(eventType);
                switch (eventType) {
                    case interactions.start:
                        allowInteractionStart();
                        break;
                    case interactions.action:
                        allowInteraction();
                        break;
                    case interactions.end:
                        allowInteractionEnd();
                        break;
                }
            }

            function allowInteractionStart() {
                instance.$el.on(interactions.start, instance._onInteractionStart);
            }
            function allowInteraction() {
                instance.$el.on(interactions.action, instance._onInteraction);
            }
            function allowInteractionEnd() {
                instance.$el.on(interactions.end, instance._onInteractionEnd);
            }
        },

        _restrict: function (eventType) {
            var interactions = this.options.interactions,
                instance = this;

            if (this._isAllowed(eventType)) {
                this._allowed.splice(this._allowed.indexOf(eventType), 1);
                switch (eventType) {
                    case interactions.start:
                        restrictInteractionStart();
                        break;
                    case interactions.action:
                        restrictInteraction();
                        break;
                    case interactions.end:
                        restrictInteractionEnd();
                        break;
                }
            }

            function restrictInteractionStart() {
                instance.$el.off(interactions.start, instance._onInteractionStart);
            }
            function restrictInteraction() {
                instance.$el.off(interactions.action, instance._onInteraction);
            }
            function restrictInteractionEnd() {
                instance.$el.off(interactions.end, instance._onInteractionEnd);
            }

        },

        _isPrevented: function (eventType) {
            return this._prevented.indexOf(eventType) !== -1;
        },

        _prevent: function (eventType) {
            var interactions = this.options.interactions;
            if (!this._isPrevented(eventType)) {
                this._prevented.push(eventType);
                switch (eventType) {
                    case interactions.start:
                        this.$el.on(interactions.start, returnFalse);
                        break;
                    case interactions.action:
                        this.$el.on(interactions.action, returnFalse);
                        break;
                    case interactions.end:
                        this.$el.on(interactions.end, returnFalse);
                        break;
                }
            }
        },

        _release: function (eventType) {
            var interactions = this.options.interactions;
            if (this._isPrevented(eventType)) {
                this._prevented.splice(this._allowed.indexOf(eventType), 1);
                switch (eventType) {
                    case interactions.start:
                        this.$el.off(interactions.start, returnFalse);
                        break;
                    case interactions.action:
                        this.$el.off(interactions.action, returnFalse);
                        break;
                    case interactions.end:
                        this.$el.off(interactions.end, returnFalse);
                        break;
                }
            }
        },

        _onInteractionStart: function (e) {
            var options = this.options,
                interactions = this.options.interactions;

            this._notify('interaction:start');

            return null;
        },

        _onInteraction: function (e) {
            if ($(e.target).hasClass("prevent-click-element") || $(e.target).closest(".prevent-click").get(0)) {
                return null;
            }

            var options = this.options,
                elementData;

            this._notify('interaction');

            if (options.actions && options.actions.length) {
                if (options.actions.length === 1) {
                    options.actions[0].action($(e.target),e);
                } else {
                    elementData = d3.select(this.element).data()[0] || {};
                    this.showActionsList({left: e.pageX || e.originalEvent.pageX, top: e.pageY || e.originalEvent.pageY, group: elementData.group});
                    return false;
                }
            }


            return null;
        },

        _onInteractionEnd: function (e) {
            this._notify('interaction:stop');
            return null;
        },

        destroy: function () {
            var interactions = this.options.interactions;

            this._destroyDroppable();
            this._destroyDraggable();
            this._restrict(interactions.action);
            this._restrict(interactions.start);
            this._restrict(interactions.end);

            this.$el.data('interactiveElement', null);
        }
    };

    function returnFalse() {
        return false;
    }

    function returnTrue() {
        return true;
    }

    function _createHTMLDroppable(droppable) {
        var manager = this._manager,
            options = this.options.droppable = $.extend({},
            this.defaults.droppable,
            droppable);

        options.over = function (e, ui) {
            var activeElement = manager.getElementInAction('drag');

            if (activeElement
                && options.scope
                && options.scope == activeElement.options.draggable.scope) {

                console.log('hover options',options.scope);
                $(this).css({
                    opacity: 0.7
                });

                typeof droppable.over == 'function'
                    ? droppable.over.apply(this, activeElement.$el.data(options.scope))
                    : null;
            }
        };

        options.drop = function () {
            var activeElement = manager.getElementInAction('drag');

            if (activeElement
                && options.scope
                && options.scope == activeElement.options.draggable.scope) {

                $(this).css({
                    opacity: 1
                });

                typeof droppable.drop == 'function'
                    ? droppable.drop.apply(this, activeElement.$el.data(options.scope))
                    : null;
            }
        };

        options.out = function (e, ui) {
            var activeElement = manager.getElementInAction('drag');

            if (activeElement
                && options.scope
                && options.scope == activeElement.options.draggable.scope) {

                $(this).css({
                    opacity: 1
                });

                typeof droppable.out == 'function'
                    ? droppable.out.apply(this, activeElement.$el.data(options.scope))
                    : null;
            }
        };

        this.$el.droppable(options);

        return this.$el.data('droppable');
    }
    function _destroyHTMLDroppable() {
        this.droppable
            ? this.droppable.destroy()
            : null;
    }

    function _createSVGDroppable(droppable) {
        var manager = this._manager,
            options = this.options.droppable = $.extend({},
            this.defaults.droppable,
            droppable);

        this.$el.on('mouseenter', function () {
            var activeElement = manager.getElementInAction('drag');

            if (activeElement
                && options.scope
                && options.scope == activeElement.options.draggable.scope) {

                var type = this.getAttribute('data-zd-interactive-type');
                if(type === "attribute" || type === "metric"){
                    $(this).addClass('over');
                }else{
                    $(this).css({
                        opacity: 0.7
                    });
                }

                typeof droppable.over == 'function'
                    ? droppable.over.apply(this, activeElement.$el.data(options.scope))
                    : null;
            }
        });
        this.$el.on('mouseup', function () {
            var activeElement = manager.getElementInAction('drag'),
                revert;

            if (activeElement
                && options.scope
                && options.scope == activeElement.options.draggable.scope) {

                var type = this.getAttribute('data-zd-interactive-type');
                if(type === "attribute" || type === "metric"){
                    $(this).removeClass('over');
                }else{
                    $(this).css({
                        opacity: 1
                    });
                }

                activeElement.$el.draggable('option', 'revert', returnFalse);

                typeof droppable.drop == 'function'
                    ? droppable.drop.call(this, activeElement.$el.data(options.scope))
                    : null;
            }
        });

        this.$el.on('mouseleave', function () {
            var activeElement = manager.getElementInAction('drag');

            if (activeElement
                && options.scope
                && options.scope == activeElement.options.draggable.scope) {

                var type = this.getAttribute('data-zd-interactive-type');
                if(type === "attribute" || type === "metric"){
                    $(this).removeClass('over');
                }else{
                    $(this).css({
                        opacity: 1
                    });
                }

                typeof droppable.out == 'function'
                    ? droppable.out.apply(this, activeElement.$el.data(options.scope))
                    : null;
            }
        });
    }
    function _destroySVGDroppable() {

    }

    function clickEvents(){
        var events;
        if(navigator.appVersion.indexOf("MSIE 10.")!=-1){
            if(Zoomdata.Utilities.detectTouchDevice()){
                events = 'MSPointerDown click';
            }else{
                events = 'MSPointerUp click';
            }
        }else{
            events = 'click';
        }

        return events;
    }

} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    var InteractiveElementController = Zoomdata.Components.InteractiveElementController,
        Events = _.clone(Zoomdata.MVC.Events);

    Zoomdata.Components = Zoomdata.Components || {};
    Zoomdata.Components.InteractiveElementsManager = function (options) {
        options || (options = {});

        if (options.actionList) {
            this.actionList = options.actionList;
            delete options.actionList;
        }

        this.options = $.extend({}, this.defaults, options);
        this.elements = [];
        this._interactions = {};
    };

    Zoomdata.Components.InteractiveElementsManager.prototype = _.extend({
        defaults: {

        },

        register: function (input, options) {
            var instance = this;

            if (input instanceof Array) {
                _.each(input, function (element) {
                    register(element, options);
                });
            } else {
                register(input, options);
            }

            function register(element, options) {
                options.actionList = instance.actionList;

                instance.registered(element)
                    ? instance.updateElement(element, options)
                    : instance._addToRegistry(element, options);
            }
        },

        release: function (input, options) {
            var instance = this;

            if (input instanceof Array) {
                _.each(input, function (element) {
                    release(element, options);
                });
            } else {
                release(input, options);
            }

            function release(element, options) {
                var interactiveElement = instance.getInteractiveElementFor(element);

                !!interactiveElement
                    ? instance._removeFromRegistry(interactiveElement)
                    : null;
            }
        },

        getInteractiveElementFor: function(element) {
            return _.find(this.elements, function (interactiveElement) {
                return interactiveElement.element == element;
            });
        },

        registered: function (element) {
            return !!this.getInteractiveElementFor(element);
        },

        updateElement: function (element, options) {
            var interactiveElement = this.getInteractiveElementFor(element);

            if (!!interactiveElement)
                interactiveElement.set(options);
        },

        inProgress: function (interaction) {
            return !!this._interactions[interaction];
        },

        getElementInAction: function (interaction) {
            var element;

            this.inProgress(interaction)
                ? element = this._interactions[interaction]
                : element = null;

            return element;
        },

        _notify: function (action, interactiveElement, options) {
            options || (options = {});
            var interaction = action.split(':')[0],
                state = action.split(':')[1] || 'action';

            switch (state) {
                case 'start':
                    this.inProgress(interaction)
                        ? this._stop(interaction, options)
                        : null;
                    this._start(interaction, interactiveElement, options);
                    break;
                case 'stop':
                    this._stop(interaction, options);
                    break;
                case 'action':
                    this._trigger(interaction, interactiveElement, options);
                    break;
            }
        },

        _start: function (interaction, interactiveElement, options) {
            this._interactions[interaction] = interactiveElement;
        },

        _stop: function (interaction, options) {
            delete this._interactions[interaction];
        },

        _trigger: function (interaction, interactiveElement, options) {
            var silent = !!options.silent;

            if (!silent) this.trigger(interaction, interactiveElement);
        },

        _removeFromRegistry: function (element) {
            var instance = this;
            _.each(_.keys(this._interactions), function (interaction) {
                element == instance.getElementInAction(interaction)
                    ? instance._stop(interaction)
                    : null;
            });
            element.destroy();
            this.elements.splice(this.elements.indexOf(element), 1);
        },

        _addToRegistry: function (element, options) {
            this.elements.push(new InteractiveElementController(this, element, options));
        },

        destroy: function () {
            var instance = this;

            while (this.elements.length > 0) {
                this._removeFromRegistry(this.elements[0]);
            }
        }
    }, Events);

} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    Zoomdata.Components = Zoomdata.Components || {};

    var eventDispatcher = Zoomdata.eventDispatcher;

    var Thread = Zoomdata.Components.Thread = function (options) {
        var instance = this;
        options = (options || {});

        _.bindAll(this,
            '_onStreamError',
            '_onViewport',
            '_onMessage',
            '_onTimeLine',
            '_onStartFromTimeDone',
            '_onStartVisDone',
            '_onNoDataFound',
            '_onDirtyData',
            '_onNotDirtyData');

        if (options.dataStream) {

            this.dataStream = options.dataStream;

        } else {
            throw new Error('dataStream must be defined');
        }

        this.tuneTo(options);
        
        this._progress = 0;

        this.status('idle');

        this.onStreamError = $.noop;
        this.onMessage = $.noop;
        this.onTimeLine = $.noop;

        this.onStartFromTimeDone = $.noop;
        this.onStartVisDone = $.noop;
        this.onNoDataFound = $.noop;
        this.onPauseDone = $.noop;
        this.onSpeedUpdatedDone = $.noop;

        this.onDirtyData = $.noop;
        this.onNotDirtyData = $.noop;

        this.onPagination = $.noop;
        this.onPivotPaging = $.noop;
        this.onViewport = $.noop;
        this.onExeption = $.noop;

        this.listenTo(eventDispatcher, 'stream:error', this._onStreamError);
        this.listenTo(eventDispatcher, 'stream:message', this._onMessage);
        this.listenTo(eventDispatcher, 'stream:TIME_LINE', this._onTimeLine);

        this.listenTo(eventDispatcher, 'stream:START_FROM_TIME_DONE', this._onStartFromTimeDone);
        this.listenTo(eventDispatcher, 'stream:START_VIS_DONE', this._onStartVisDone);
        this.listenTo(eventDispatcher, 'stream:STOP_VIS_DONE', this._onStopVisDone);
        this.listenTo(eventDispatcher, 'stream:NO_DATA_FOUND', this._onNoDataFound);
        this.listenTo(eventDispatcher, 'stream:PAUSE_DONE', this._onPauseDone);
        this.listenTo(eventDispatcher, 'stream:UPDATE_SPEED_DONE', this._onSpeedUpdatedDone);

        this.listenTo(eventDispatcher, 'stream:DIRTY_DATA', this._onDirtyData);
        this.listenTo(eventDispatcher, 'stream:NOT_DIRTY_DATA', this._onNotDirtyData);

        this.listenTo(eventDispatcher, 'stream:PAGINATION', this._onPagination);
        this.listenTo(eventDispatcher, 'stream:PAGING', this._onPivotPaging);
        this.listenTo(eventDispatcher, 'stream:VIEWPORT', this._onViewport);
        this.listenTo(eventDispatcher, 'stream:EXCEPTION', this._onExeption);
    };

    _.extend(Thread.prototype, Zoomdata.MVC.Events, {

        tuneTo: function(options){
            this.stopListening(this.time);
            
            if (options.state) {

                this.state = options.state;
                this.time = this.state.time;

            } else if (options.config) {

                this.state = new Zoomdata.Models.State({
                    streamSourceId: config.source.sourceId
                }, {
                    config: new Zoomdata.MVC.Model(config)
                });
                this.time = this.state.time;

            } else {
                throw new Error('state or config must be defined');
            }

            this.state.config.options = {};
            
            this.listenTo(this.time, 'change:time', this._onTimeChange);
            this.listenTo(this.time, 'change:speed', this._onSpeedChange);
            this.listenTo(this.time, 'change:paused', this._onPausedChange);
        },

        resetProgress: function () {
            this.progress(0);
        },

        progress: function (progress) {
            var instance = this;

            return (typeof progress == 'undefined'
                ? getter()
                : setter(progress));

            function setter(progress) {
                instance._progress = progress;
                return instance;
            }

            function getter() {
                return instance._progress;
            }
        },

        destroy: function () {
            this.stop();
            this.stopListening();
        },

        setUUID: function () {
            this.UUID = Zoomdata.Utilities.generateUUID();

            return this.UUID;
        },

        getUUID: function () {
            return this.UUID;
        },

        status: function (status) {
            if (typeof status == 'string') {
                this._status = status;
                this.trigger('status:change', status, this);
                return this;
            } else {
                return this._status;
            }
        },

        start: function (restart) {
            var request = this.state.toRequest(restart);

            var message = JSON.stringify({
                type:"START_VIS",
                cid: this.UUID,
                request: request
            });

            this.status() !== 'idle'
                ? this.stop()
                : null;

            console.log("Thread: start ", JSON.parse(message));
            this.dataStream.send(message);
            this.resetProgress();
            this.status('start');
            this.trigger('thread:start', JSON.parse(message));
            // used for Undo controll

            Zoomdata.eventDispatcher.trigger('thread:start', JSON.parse(message));
        },

        stop: function () {
            var message = JSON.stringify({
                type: 'STOP_VIS',
                cid: this.UUID
            });

            this.dataStream.send(message);
            this.resetProgress();
            this.trigger('thread:stop', JSON.parse(message));
            console.log("Thread: stop", JSON.parse(message));
            this.status('idle');
        },

        pause: function () {
            var message = JSON.stringify({
                type: 'PAUSE',
                cid: this.UUID
            });
            this.dataStream.send(message);
            console.log("Thread: pause", JSON.parse(message));
        },

        unpause: function () {
            var message = JSON.stringify({
                type: 'UNPAUSE',
                cid: this.UUID
            });

            this.dataStream.send(message);
            console.log("Thread: unpause", JSON.parse(message));
        },
        
        request_data: function(options) {
            var options = options || {records: 1000};
            var message = JSON.stringify({
                type: 'REQUEST_DATA',
                cid: this.UUID,
                request: options
            });

            this.dataStream.send(message);
            console.log("Thread: request_data", JSON.parse(message));
        },

        togglePause: function () {
            var paused = this.time.get('paused');

            paused
                ? this.unpause()
                : this.pause();
        },

        startFromTime: function (time) {
            var current = new Date().getTime(),
                timeModel = this.time,
                request, message;

            if (time > current && "LIVE" === this.config.get("source").startFrom) {
                time = null;
            }

            request = {
                speed: timeModel.get('speed'),
                time: time,
                pauseAfterRead: timeModel.get('paused')
            };
            message = {
                type: 'START_FROM_TIME',
                cid: this.UUID,
                request: request
            };

            console.log('Thread: startFromTime', message);
            this.dataStream.send(
                JSON.stringify(message)
            );
            this.resetProgress();

            this.trigger('thread:time', message);
            Zoomdata.eventDispatcher.trigger('thread:time', message);
        },

        startFromTimeTo: function (timeTo) {
            var current = new Date().getTime(),
                timeModel = this.time,
                request = {},
                time = timeModel.get('time');
            if (timeTo > current) {
                timeTo = null;
            }
            request = {
                speed: timeModel.get('speed'),
                timeWindow: timeTo,
                pauseAfterRead: timeModel.get('paused')
            };
            if(time && time !== null){
                request.time = time;
            }
            var message = {
                type: 'START_FROM_TIME',
                cid: this.UUID,
                request: request
            };
            this.dataStream.send(
                JSON.stringify(message)
            );
            this.resetProgress();
        },

        updateSpeed: function (speed) {
            var message = JSON.stringify({
                type: 'UPDATE_SPEED',
                cid: this.UUID,
                request: {
                    speed: speed | this.time.get('speed')
                }
            });

            this.dataStream.send(message);
            console.log('Thread: updateSpeed', message);
        },

        _onTimeChange: function (model, time) {
            this.startFromTime(time);
        },

        _onSpeedChange: function (model, speed) {
            this.updateSpeed(speed);
        },

        _onPausedChange: function (model, paused) {
            paused
                ? this.pause()
                : this.unpause();
        },

        _onStreamError: function (message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                this.status('error');
                typeof this.onStreamError == 'function'
                    ? this.onStreamError(data.data)
                    : null;

                this.trigger('thread:error', message);
            }
        },

        _onDirtyData: function (message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                this.status('dirtydata');
                typeof this.onDirtyData == 'function'
                    ? this.onDirtyData(data.data)
                    : null;

                typeof data.progress == 'number'
                    ? this.progress(data.progress)
                    : this.resetProgress();

                this.trigger('thread:dirtyData', data);
            }
        },

        _onNotDirtyData: function (message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                this.status('running');
                typeof this.onNotDirtyData == 'function'
                    ? this.onNotDirtyData(data.data)
                    : null;

                this.progress(100);
                this.trigger('thread:notDirtyData', data);
            }
        },

        _onMessage: function (message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                this.status('progress');
                typeof this.onMessage == 'function'
                    ? this.onMessage(data.data)
                    : null;

                this.trigger('thread:message', data.data);
            }
        },

        _onTimeLine: function (message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {

                if (data.source === "HISTORICAL") {
                    this.time.set({ historicalFrom: data.fromTime, historicalTo: data.toTime });
                    return;
                }

                this.stopListening(this.time, 'change:time', this._onTimeChange);

                var timeLine = {
                    fromTime: data.fromTime,
                    time: data.toTime,
                    min: (data.minTime && data.minTime !== '-1') ? data.minTime : undefined,
                    max: (data.maxTime && data.maxTime !== '-1') ? data.maxTime : undefined,
                    live: data.live,
                    speed: data.speed
                };

                this.time.set(timeLine);
                this.listenTo(this.time, 'change:time', this._onTimeChange);

                this.status('progress');
                typeof this.onTimeLine == 'function'
                    ? this.onTimeLine(data.data)
                    : null;

                this.trigger('thread:timeline', data.data);
            }
        },

        _onStartFromTimeDone: function (message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                this.status('progress');
                typeof this.onStartFromTimeDone == 'function'
                    ? this.onStartFromTimeDone(data.data)
                    : null;

                this.trigger('thread:startFromTimeDone', data.data);
            }
        },

        _onStartVisDone: function (message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                this.status('progress');
                typeof this.onStartVisDone == 'function'
                    ? this.onStartVisDone(data.data)
                    : null;

                this.trigger('thread:startVisDone', data.data);
            }
        },
        
        _onStopVisDone: function(message){
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                typeof this.onStopVisDone == 'function'
                    ? this.onStopVisDone(data.data)
                    : null;

                this.trigger('thread:stopVisDone', data.data);
            }
        },

        _onNoDataFound: function (message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                this.status('nodata');
                typeof this.onNoDataFound == 'function'
                    ? this.onNoDataFound(data.data)
                    : null;

                this.trigger('thread:noData', data.data);
            }
        },

        _onPauseDone: function(message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                this.time.set('paused', true);

                typeof this.onPauseDone == 'function'
                    ? this.onPauseDone(data)
                    : null;

                this.trigger('thread:pauseDone', data);
            }
        },

        _onSpeedUpdatedDone: function (message) {
            var data = JSON.parse(message.data);
            if (data.cid == this.UUID) {
                typeof this.onSpeedUpdatedDone == 'function'
                    ? this.onSpeedUpdatedDone(data.data)
                    : null;

                this.trigger('thread:updateSpeedDone', data.data);
            }
        },

        _onPagination: function(message) {
            var data = JSON.parse(message.data);
            if (data.cid === this.UUID) {
                this.state.set('nextPageAvailable', data.nextPageAvailable, {silent: true});
                this.state.set('pages', data.pages, {silent: true});
                this.state.set('precise', data.precise, {silent: true});
                this.state.trigger('pages');

                typeof this.onPagination == 'function'
                    ? this.onPagination(data)
                    : null;

                this.trigger('thread:pagination', data);
            }
        },

        _onPivotPaging: function(message) {
            var data = JSON.parse(message.data);
            if (data.cid === this.UUID) {
                this.state.pagesCount = data.pagesCount;
                this.state.precise = data.precise;
                this.state.set('pageIndex', data.pageIndex, {silent: true});

                typeof this.onPivotPaging == 'function'
                        ? this.onPivotPaging(data)
                        : null;

                this.trigger('thread:pivotPaging', data);
            }
        },
        
        _onViewport: function(message) {
            var data = JSON.parse(message.data);
            if (data.cid === this.UUID) {
                typeof this.onViewport == 'function'
                        ? this.onViewport(data)
                        : null;

                this.trigger('thread:viewport', data);
            }
        },
         _onExeption: function(message) {
            var data = JSON.parse(message.data);
            this.trigger('thread:exeption', data);
        }

    });

    function applyCallback(context, name) {
        var args = arguments.length > 2
            ? Array.prototype.slice.call(arguments, 2)
            : [];

        context.hasOwnProperty(name) && typeof context[name] == 'function'
            ? context[name].apply(context, args)
            : null;
    }

}(window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    var Events = _.clone(Zoomdata.MVC.Events),
        TRENDS_TYPES = ['TRENDS', 'MULTI_METRIC_TREND'],
        PIVOT_TABLE = 'PIVOT_TABLE';

    Zoomdata.Components = Zoomdata.Components || {};
    Zoomdata.Components.StateInheritanceManager = function (options) {
        options || (options = {});

        this.options = $.extend({}, this.defaults, options);
        
        if(this.options.controller){
            this.controller = this.options.controller;
            delete this.options.controller;
        }else{
            throw new Error('Controller must be defined');
        }
        
        this.history = [];
        this.addToHistory(this.controller.state, this.controller.config);
    };

    Zoomdata.Components.StateInheritanceManager.prototype = _.extend({
        
        defaults: {},
        
        merge: function(options){
            var config = this.controller.config;
            var state  = this.controller.state;
            var oldConfig = options.oldConfig;
            var oldState  = options.oldState;
            
            this.addToHistory(oldState, oldConfig);
            
            this.mergeTime(oldState, oldConfig);
            this.mergeFilters(oldState, oldConfig);
            if(this.isType(config, PIVOT_TABLE)){
                this.mergeToPivot(oldState, oldConfig);
                return this;
            }
            if(this.isType(oldConfig, PIVOT_TABLE)){
                this.mergeFromPivot(oldState, oldConfig);
                return this;
            }
            this.mergeMetrics(oldState, oldConfig);
            this.mergeGroupBy(oldState, oldConfig);
            this.mergeClientSort(oldState);
            
            return this;
        },
        
        mergeFilters: function(oldState, oldConfig){
            var config = this.controller.config;
            var state  = this.controller.state;
            
            if(oldState.filters.length > 0){
                state.filters.set(oldState.filters.toJSON(),{silent: true});
            }
            
            return this;
        },
        
        mergeToPivot: function(oldState, oldConfig){
            var config = this.controller.config;
            var state  = this.controller.state;
            var onCols = config.attributes.source.variables['Metric Direction'] === 'Columns';
            var groupVar;
            var secondGroupVar;
            var metrics;
            var foundMetrics = {};

            if(onCols){
                groupVar = 'Column Attributes';
                secondGroupVar = 'Row Attributes';
            }else{
                groupVar = 'Row Attributes';
                secondGroupVar = 'Column Attributes';
            }
            
            // METRICS
            metrics = oldState.metrics.toJSON()
                .filter(function(m, i){
                    var name = m.name;
                    var func = m.func;
                    var path = name+func;
                    var shouldSkip = false;
                    if(name === 'none'){
                        shouldSkip = true;
                    }
                    if(foundMetrics[path] === true){
                        shouldSkip = true;
                    }
                    if(shouldSkip){
                        return false;
                    }else{
                        foundMetrics[path] = true;
                        return true;
                    }
                })
                .map(function(m, i){
                    return {
                        name: m.name,
                        func: m.func,
                        label: 'Metrics',
                        id: 'Metrics-' + i
                    };
                });
            state.metrics.reset(metrics,{silent: true});
            
            var oldType = this.getOriginalType(oldConfig);
            if(_.contains(TRENDS_TYPES, oldType) || oldState.groupBy.length === 0){
                return this;
            }
            // ATTRIBUTES
            if(oldState.groupBy.length > 0){
                config.attributes.source.variables[secondGroupVar] = [oldState.groupBy.getAttribute()];
                config.attributes.source.variables[groupVar] = oldState.groupBy.getAttributes().slice(1);
            }
            
            return this;
        },
        
        mergeFromPivot: function(oldState, oldConfig){
            var config = this.controller.config;
            var state  = this.controller.state;
            var onCols = oldConfig.attributes.source.variables['Metric Direction'] === 'Columns';
            var groupVar;
            var secondGroupVar;

            if(onCols){
                groupVar = 'Column Attributes';
                secondGroupVar = 'Row Attributes';
            }else{
                groupVar = 'Row Attributes';
                secondGroupVar = 'Column Attributes';
            }
            
            // METRICS
            this.mergeMetrics(oldState, oldConfig);

            // ATTRIBUTES
            var pivotGroupBy = new Zoomdata.Collections.GroupBy(
                    oldConfig.attributes.source.variables[secondGroupVar]
                    .concat(oldConfig.attributes.source.variables[groupVar])
                    .map(function(g){return {name: g};})
            );
            this.mergeGroupBy(oldState, oldConfig, pivotGroupBy);
        },
        
        mergeTime: function(oldState, oldConfig){
            var config = this.controller.config;
            var state  = this.controller.state;
            
            var oldType = this.getOriginalType(oldConfig);
            var newType = this.getOriginalType(config);
            
            if(oldType !== newType && (_.contains(TRENDS_TYPES, newType) || _.contains(TRENDS_TYPES, oldType))){
                return this;
            }
            
            if (state.time && oldState.time) {
                if (state.time.get('timeWindow') === oldState.time.get('timeWindow')) {
                    state.time.set(oldState.time.toJSON(),{silent: true});
                }
            }
            return this;
        },
        
        mergeClientSort: function(oldState){
            var state  = this.controller.state;
            state.set({
                clientSort: oldState.get('clientSort')
            },{silent: true});
            return this;
        },
        
        mergeGroupBy: function(oldState, oldConfig, pivotOldGroupBy){
            var config = this.controller.config;
            var state  = this.controller.state;
            
            if(pivotOldGroupBy){
                oldState.groupBy = pivotOldGroupBy;
            }
            
            var oldGroups = oldState.groupBy.models;
            var newGroups = state.groupBy.models;

            var oldGroupModels = oldState.groupBy.toJSON();
            var newGroupModels = state.groupBy.toJSON();
            
            var oldType = this.getOriginalType(oldConfig);
            var newType = this.getOriginalType(config);
            
            if(oldType !== newType && (_.contains(TRENDS_TYPES, newType) || _.contains(TRENDS_TYPES, oldType))){
                return this;
            }
            
            if(newGroupModels.length > oldGroupModels.length){
                var oas = oldState.groupBy.getAttributes();
                var nas = state.groupBy.getAttributes();
                var tail = newGroupModels.slice(oldGroupModels.length);
                var tailAttributes = nas.slice(oldGroupModels.length);
                var diff = _.difference(nas, oas);
                oldGroupModels.forEach(function(ogm, i){
                    var ng = newGroups[i];
                    ng.setAttribute(ogm.name, {silent:true});
                    ng.setSort(ogm.sort, {silent:true});
                });
                
                var diffOffset = 0;
                if(_.intersection(tailAttributes, oas).length > 0){
                    tailAttributes.forEach(function(ta, i){
                        var originalIndex = i + oldGroupModels.length;
                        if(_.contains(oas, ta)){
                            var ng = newGroups[originalIndex];
                            var og = _.findWhere(newGroupModels,{
                                name: diff[diffOffset]
                            });

                            if(og){
                                ng.setAttribute(og.name, {silent:true});
                                ng.setSort(og.sort, {silent:true});
                            }
                            diffOffset++;
                        }
                    });
                }
            }else{
                newGroups.forEach(function(ng, i){
                    var og = oldGroups[i];
                    if(og){
                        var oModel = og.toJSON();
                        ng.setAttribute(oModel.name, {silent:true});
                        ng.setSort(oModel.sort, {silent:true});
                    }
                });
            }
            
            return this;
        },
        
        mergeMetrics: function(oldState){
            var state  = this.controller.state;

            if(state.metrics.length === 0 || oldState.metrics.length === 0){
                return;
            }
            
            var nColorDef = _getColorMetricDefinition(state);
            var oColorDef = _getColorMetricDefinition(oldState);

            var nms = _getMetricsWithoutColor(state, nColorDef);
            var oms = _getMetricsWithoutColor(oldState, oColorDef);
            
            nms.forEach(function(nm, i){
                var om = oms[i],
                    name,
                    func;
                if(om){
                    name = om.get('name');
                    func = name === 'count' ? null : om.get('func');
                    if(name !== 'none'){
                        nm.set({
                            name: name,
                            func: func
                        },{silent: true});
                    }
                }
            });
            
            if(nColorDef && oColorDef){
                var nColor = state.metrics.findWhere({id:nColorDef.name});
                var oColor = oldState.metrics.findWhere({id:oColorDef.name});
                var cName = oColor.get('name');
                var cFunc = cName === 'count' ? null : oColor.get('func');
                if(cName !== 'none'){
                    nColor.set({
                        name: cName,
                        func: cFunc
                    },{silent: true});
                }
            }

            return this;

            function _getMetricsWithoutColor(_state, colorDefinition){
                var _metrics = [];
                if(colorDefinition){
                    _metrics = _state.metrics.models.filter(function(m){
                        return m.get('label') !== colorDefinition.name;
                    });
                }else{
                    _metrics = _state.metrics.models;
                }
                return _metrics;
            };
            
            function _getColorMetricDefinition(_state){
                return _.findWhere(_state.config.attributes.variables, {metricType: 'color'});
            };
        },
        
        addToHistory: function(state, config){
            this.history.push({
                state  : state,
                config : config
            });
            return this;
        },
        
        getPrev: function(){
            var last = this.history.pop();
            return last;
        },
        
        getOriginalType: function(config){
            var type = config.get('type');
            type = type === 'CUSTOM' ? config.get('templateType') : type;
            return type;
        },
        
        isType: function(config, types){
            var _types = Array.isArray(types) ? types : [types];
            var _isType = false;
            var type = this.getOriginalType(config);
            if(_.contains(_types, type)){
                _isType = true;
            }
            return _isType;
        }
        
    }, Events);

} (window, Zoomdata));;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    "use strict";
    /*jshint multistr: true */

    Zoomdata.Components = Zoomdata.Components || {};
    
    var ComponentSources = Zoomdata.Collections.ComponentSources;
    var LibrariesSources = Zoomdata.Collections.LibrariesSources;

    var AxisLabel = Zoomdata.Views.AxisLabel;
    var ColorKey = Zoomdata.Views.ColorKey;

    var eventDispatcher = Zoomdata.eventDispatcher;
    var Thread = Zoomdata.Components.Thread;

    var interactiveElementsMethods = Zoomdata.Components.InteractiveElementsMethods;
    var MetricAccessor = Zoomdata.Components.MetricAccessor;
    
    var StateInheritanceManager = Zoomdata.Components.StateInheritanceManager;

    // Templates for visualization name
    var SOURCE_NAME = "$Source";

    Zoomdata.Components.VisualizationController = Zoomdata.MVC.View.extend({

        defaults: {

        },

        remove: function () {
            this.stopVisualization();
            this.removeVisualization();

            Zoomdata.MVC.View.prototype.remove.apply(this, arguments);
        },

        initialize: function (options) {
            var instance = this,
                source;

            this.dfd = null;
            this.axisLabels = [];
            this.metrics = {};
            this.progress = 0;

            this.data = [];
            
            if (typeof options.interactiveElements !== 'undefined') {
                this.elementsManager = options.interactiveElements;
                delete options.interactiveElements;
            } else {
                throw new Error('interactiveElements must be defined');
            }

            if (typeof options.config == 'object') {
                this.config = options.config;
                delete options.config;
            } else {
                throw new Error('config must be defined');
            }

            if (typeof options.source == 'object') {
                this.source = options.source;
                delete options.source;

                source = this.source;

            } else {
                throw new Error('source must be defined');
            }

            if (typeof options.host == 'object') {
                this.isRemote = true;
            } else {
                this.isRemote = false;
            }

            this.worker = window.Worker && this.isRemote === false ? new Worker('/zoomdata/js/components/Zoomdata.Workers.ProcessSocketData.js') : null;

            this._assemblyMethods();

            Zoomdata.MVC.View.prototype.initialize.apply(this, arguments);

            this.state = new Zoomdata.Models.State({
                streamSourceId: this.config.get('source').sourceId
            }, {
                config: this.config,
                objectFields: this.source.objectFields
            });

            this.thread = new Thread({state: this.state, dataStream: Zoomdata.dataStream});

            this.fields = source.objectFields;
            this.formulas = source.formulaList;

            this._configureMetricAccessors();

            this.time = this.state.time;

            this.$el
                .attr('data-visid',this.config.get('visId'))
                .removeAttr('id');

            this.components = new ComponentSources(this.config.get('components'), {
                visId: this.config.get('visId'),
                name: this.config.get('name'),
                remote: this.isRemote && this.options.host.remote,
                secure: this.isRemote && this.options.host.secure,
                apiKey: this.isRemote && this.options.host.apiKey
            });

            this.libraries = new LibrariesSources(this.config.get('libs'), {
                remote: this.isRemote && this.options.host.remote,
                secure: this.isRemote && this.options.host.secure,
                apiKey: this.isRemote && this.options.host.apiKey
            });

            this.inheritanceManager = new StateInheritanceManager({
                controller: this
            });

            this.resetIndicators();
        },

        _configureMetricAccessors: function () {
            var instance = this,
                variables = instance.config.get('variables'),
                colorMetricVariable,
                generalMetricVariable,
                colorNumb,
                colors = [],
                metricAccessors = this.metrics = {},
                objectFields = this.fields;

            $(variables).each(function (index, item) {
                if (item.type !== 'metric' && item.type !== 'multi-metric') {
                    return;
                }
                switch (item.metricType) {
                    case 'color':
                        colorMetricVariable = item;
                        instance.autoShowColorLegend = item.autoShowColorLegend;
                        if (typeof item.colors === 'string') {
                            item.colors = JSON.parse(item.colors);
                        }
                        if (item.savedColors && typeof item.savedColors === 'string') {
                            item.savedColors = JSON.parse(item.savedColors);
                        }
                        colorNumb = item.colors ? item.colors.length : 0;
                        if (item.colors) {
                            $.each(item.colors, function (index, colorItem) {
                                if (colorMetricVariable.savedColors && typeof colorMetricVariable.savedColors[index] === 'string') {
                                    colors.push(colorMetricVariable.savedColors[index]);
                                } else {
                                    colors.push(colorItem.color || colorItem);
                                }
                            });
                        }
                        break;
                    case 'general':
                        generalMetricVariable = item;
                        break;
                }
            });
            this.state.divergingColorRange = 'gradient';
            this.state.metrics.each(function (metric) {
                var fieldName = metric.get('name'),
                    metricName = metric.get('label'),
                    variable = _.where(variables, {name: metricName})[0],
                    metricType = variable ? variable.type : 'metric',
                    visColorMetric,
                    objectField = (metric.isNone()
                        ? objectFields.noneField
                        : (metric.isCount()
                            ? objectFields.volumeField
                            : objectFields.findWhere({name: fieldName})));

                if (metricType == 'multi-metric') {
                    metricAccessors[metricName] instanceof Array
                        ? metricAccessors[metricName].push(new MetricAccessor(metric.toJSON(), objectField.toJSON()))
                        : metricAccessors[metricName] = [new MetricAccessor(metric.toJSON(), objectField.toJSON())];
                } else {
                    metricAccessors[metricName] = new MetricAccessor(metric.toJSON(), objectField.toJSON());
                }

                if (colorMetricVariable && metricName === colorMetricVariable.name) {
                    if (!instance.state.colorMetric || instance.state.colorMetric.get('label') !== metricName) {
                        instance.state.colorMetric = metric;
                    }
                    instance.state.colorNumb = colorNumb;
                    visColorMetric = instance.metrics[colorMetricVariable.name][0] || instance.metrics[colorMetricVariable.name];
                    if (!visColorMetric.metric.colors || typeof visColorMetric.metric.colors === 'string') {
                        instance.state.legendType = colorMetricVariable.legendType || 'range';
                        instance.state.divergingColorRange = colorMetricVariable.divergingColorRange || 'gradient';
                        visColorMetric.setColorRangeType(instance.state.divergingColorRange);
                        visColorMetric.metric.colors = colors;
                        visColorMetric.domainValue = colorMetricVariable.domain;
                    }
                    if (instance.metrics[colorMetricVariable.name][0]) {
                        instance.state.divergingColorRange = null;
                        visColorMetric.objectFields = [];
                        instance.source.objectFields.forEach(function (item) {
                            var type = item.get('type');
                            if (type === 'FORMULA' || colorMetricVariable.attributeType.indexOf(type) !== -1) {
                                visColorMetric.objectFields.push(item);
                            }
                            if (visColorMetric.objectFields.length > visColorMetric.metric.colors) {
                                visColorMetric.metric.colors.push('#ffffff');
                            }
                        });
                        visColorMetric.metric.colors.splice(visColorMetric.objectFields.length, visColorMetric.metric.colors.length);
                        instance.state.colorNumb = visColorMetric.metric.colors.length;
                    }
                    visColorMetric.metric.colorsData = colorMetricVariable.colors;
                } else if (generalMetricVariable && metricName === generalMetricVariable.name) {
                    instance.state.generalMetric = metric;
                }

            });
            if (this._controller) {
                this._controller.metrics = this.metrics;
            }
        },

        _onGroupByChange: function(){
            this.clearVisualization();
            this.restartVisualization();
        },

        _onMetricChange: function (metric) {
            var metricLabel = metric.get('label'),
                fieldName = metric.get('name'),
                accessor = this.metrics[metricLabel],
                field = (metric.isNone()
                        ? this.fields.noneField
                        : (metric.isCount()
                            ? this.fields.volumeField
                            : this.fields.findWhere({name: fieldName})));

            accessor instanceof Array
                ? changeMultiMetric(accessor, metric)
                : accessor.setAccessTo(metric.toJSON(), field.toJSON());

            this.restartVisualization();

            function changeMultiMetric(multiAccessor, metric) {
                var accessor = _.find(multiAccessor, function (accessor) {
                    var match = (accessor.metric.name == (typeof metric.changed.name !== 'undefined'
                            ? metric.previous('name')
                            : metric.get('name'))) &&
                        (accessor.metric.func == (typeof metric.changed.func !== 'undefined'
                            ? metric.previous('func')
                            : metric.get('func')));
                    return match;
                });

                accessor.setAccessTo(metric.toJSON(), field.toJSON());
            }
        },

        _onMetricReset: function(metrics){
            this.restartVisualization();
        },

        _onMetricAdd: function (metric) {
            var metricLabel = metric.get('label'),
                fieldName = metric.get('name'),
                accessor = this.metrics[metricLabel],
                field = (metric.isCount()
                    ? this.fields.volumeField
                    : this.fields.findWhere({name: fieldName}));
                    
            accessor instanceof Array ? null : accessor = [].concat(accessor);

            accessor.push(new MetricAccessor(metric.toJSON(), field.toJSON()));

            this.restartVisualization();
        },

        _onMetricRemove: function (metric) {
            var metricLabel = metric.get('label'),
                metricFunc = metric.get('func'),
                fieldName = metric.get('name'),
                accessor = this.metrics[metricLabel] instanceof Array ? this.metrics[metricLabel] : [].concat(this.metrics[metricLabel]),
                currentAccessor = _.find(accessor, function (metricAccessor) {
                    return metricAccessor.metric.name == fieldName && metricAccessor.metric.func == metricFunc;
                });

            currentAccessor && accessor.splice(accessor.indexOf(currentAccessor), 1);

            this.restartVisualization();
        },

        _onMessage: function (data) {
            if (typeof this._controller.processData == 'function') {
                this._controller.processData(data, this.thread.progress());
            } else {
                this.processSocketData(data);
            }
        },

        _onNoDataFound: function(){
            this.clearVisualization();
            this._controller.onNoDataFound();
        },

        _onStartFromTimeDone: function(){
            this.data = [];
        },

        _assemblyMethods: function(){
//            _.extend(this, new streamHandlers());
            _.extend(this, new interactiveElementsMethods());
        },

        _createAxisLabel: function (options) {
            if (this.isRemote) return null; //TODO: A temporary solution for StandaloneClient.
            var label = new AxisLabel(
                    $.extend({},
                        options,
                        { controller: this }
                    )
                ),

                $el = label.render().$el,
                $widgetBody = $(this.el.parentElement),
                $widgetContent = $(this.el);

            switch(options.position){
                case "left":
                    var $left = $widgetBody.find('.widgetLabel.left').eq(0);
                    if(!$left || $left.length === 0){
                        $left = $('<div class="widgetLabel left"/>');
                        $widgetBody.prepend($left);
                    }
                    $widgetContent.css({
                        'left':'50px'
                    });
                    $left.append($el);
                    break;
                case "right":
                    var $right = $widgetBody.find('.widgetLabel.right').eq(0);
                    if(!$right || $right.length === 0){
                        $right = $('<div class="widgetLabel right"/>');
                        $widgetBody.prepend($right);
                    }
                    $widgetContent.css({
                        'right':'50px'
                    });
                    $right.append($el);
                    break;
                case "top":
                    var $top = $widgetBody.find('.widgetLabel.top').eq(0);
                    if(!$top || $top.length === 0){
                        $top = $('<div class="widgetLabel top"/>');
                        $widgetBody.prepend($top);
                    }
                    $widgetContent.css({
                        'top':'50px'
                    });
                    $top.append($el);
                    break;
                case "bottom":
                    var $bottom = $widgetBody.find('.widgetLabel.bottom').eq(0);
                    if(!$bottom || $bottom.length === 0){
                        $bottom = $('<div class="widgetLabel bottom"/>');
                        $widgetBody.prepend($bottom);
                    }
                    $widgetContent.css({
                        'bottom':'50px'
                    });
                    $bottom.append($el);
                    break;
            }

            label.position();

            $el.hide().show(0);

            this.axisLabels.push(label);

            return $el;
        },

        resetIndicators: function () {
        },

        setVisualization: function (config, restart, customState) {  // restart flag set to true if visualization needs to be loaded from a scratch
            var instance = this,
                oldState = this.state,
                newState = restart && customState
                                    ? customState
                                    : new Zoomdata.Models.State({
                                            streamSourceId: config.get('source').sourceId
                                        }, {
                                            config: config,
                                            objectFields: this.source.objectFields,
                                            oldTimeWindowScale: this.state.time.get('timeWindow')
                                        }),
                oldConfig = this.config;
            
            if(config){
                this.config = config;
                this.config.sourceId = oldConfig.sourceId;
            }
            
            this.stopVisualization();
            this.removeVisualization();

            this.state = newState;

// from create
            this.thread.tuneTo({
                state  : this.state,
                config : this.config
            });

            this.time = this.state.time;

            this.$el
                .attr('data-visid',this.config.get('visId'))
                .removeAttr('id');

            this.libraries.reset(this.config.get('libs'));

            this.components.reset(this.config.get('components'));
            this.components.setVisId(this.config.get('visId'));
            this.components.setVisName(this.config.get('name'));
// from create
            
            if(!restart){
                this.inheritanceManager.merge({
                    oldState  : oldState,
                    oldConfig : oldConfig
                });
            }
            
            this._configureMetricAccessors();

            this.loadVisualization()
                .done(function () {
                    instance.initVisualization();
                    instance.startVisualization();
                });

            this.trigger('visualization:change');

        },

        applyEvents: function () {
            var instance = this;

            this.listenTo(eventDispatcher, 'visualization:showpopup', instance.showPopup);

            this.listenTo(this.thread, 'thread:message', this._onMessage);
            this.listenTo(this.thread, 'thread:start',   this._onStart);
            this.listenTo(this.thread, 'thread:error',   this._onStreamError);
            this.listenTo(this.thread, 'thread:notDirtyData',      this._onNotDirtyData);
            this.listenTo(this.thread, 'thread:noData',            this._onNoDataFound);
            this.listenTo(this.thread, 'thread:startFromTimeDone', this._onStartFromTimeDone);
            this.listenTo(this.thread, 'thread:viewport',          this._onViewport);
            this.listenTo(this.thread, 'thread:stop',              this._onStop);      
            this.listenTo(this.thread, 'thread:exeption',          this._onExeption);

            this.listenTo(this.state, 'change', this.restartVisualization);
            this.listenTo(this.state, 'change:clientSort', this.refreshVisualization);

            this.listenTo(this.state.filters, 'add remove change reset', this.restartVisualization);

            this.listenTo(this.state.metrics, 'change', this._onMetricChange);
            this.listenTo(this.state.metrics, 'add',    this._onMetricAdd);
            this.listenTo(this.state.metrics, 'remove', this._onMetricRemove);
            this.listenTo(this.state.metrics, 'reset', this._onMetricReset);

            this.listenTo(this.state.groupBy, 'change reset', this._onGroupByChange);

            this.listenTo(Zoomdata.eventDispatcher, 'restart', function(event) {
                instance.startVisualization();
            });

            this.on('resize', this._onResize);

        },
        muteEvents: function () {
            this.stopListening(eventDispatcher, 'visualization:showpopup', this.showPopup);

            this.stopListening(this.thread, 'thread:message', this._onMessage);
            this.stopListening(this.thread, 'thread:start',   this._onStart);
            this.stopListening(this.thread, 'thread:error',   this._onStreamError);
            this.stopListening(this.thread, 'thread:notDirtyData',      this._onNotDirtyData);
            this.stopListening(this.thread, 'thread:noData',            this._onNoDataFound);
            this.stopListening(this.thread, 'thread:startFromTimeDone', this._onStartFromTimeDone);
            this.stopListening(this.thread, 'thread:viewport',          this._onViewport);
            this.stopListening(this.thread, 'thread:stop',          this._onStop);
            this.stopListening(this.thread, 'thread:exeption',          this._onExeption);

            this.stopListening(this.state, 'change', this.restartVisualization);
            this.stopListening(this.state, 'change:clientSort', this.refreshVisualization);

            this.stopListening(this.state.filters, 'add remove change reset', this.restartVisualization);

            this.stopListening(this.state.metrics, 'change', this._onMetricChange);
            this.stopListening(this.state.metrics, 'add',    this._onMetricAdd);
            this.stopListening(this.state.metrics, 'remove', this._onMetricRemove);
            this.stopListening(this.state.metrics, 'reset', this._onMetricReset);

            this.stopListening(this.state.groupBy, 'change reset', this._onGroupByChange);

            this.off('resize', this._onResize);

            if(this._controller){
                $(this._controller.element).off('resize');
                this._controller.element.resize = null;
            }
        },

        initVisualization: function () {
            var instance = this,
                namespace = this.components.getComponentsNamespace(),
                WIDGET = Zoomdata.Utilities.MODE.WIDGET === Zoomdata.Utilities.mode();

            if (this._controller) {
                this._controller.toolbar().remove();
            }
            
            this.axisLabels = [];

            /** Custom Visualization Controller
             * @name controller
             * @namespace
             */
            this._controller = {

                /** The HTML Element your visualization should be appended to.
                 * @name element
                 * @type {HtmlElement}
                 * @memberof controller
                 * @instance
                 * @example
                 * var svg = d3.select(controller.element).append("svg")
                 *      .attr("width", "100%")
                 *      .attr("height", "100%");
                 */
                element: this.el,

                /** The State of your Visualization's data stream from the Zoomdata server.
                 * @name controller#state
                 * @type {Backbone.Model}
                 * @memberof controller
                 * @instance
                 * @example
                 * controller.state.set('groupBy', '<MY FIELD>'); //Change the grouped attribute of the data stream.
                 */
                state: this.getVisualizationState(),
                config: this.getSourceConfiguration(),

                /** The Scope is an object which could be used to transfer any type of data between Visualization Components.
                 * @name controller#scope
                 * @type {object}
                 * @memberof controller
                 * @instance
                 * @example
                 * // Settings.js
                 * ...
                 * var SETTINGS = {
                 *     margins : [ 10 , 20 ]
                 * };
                 * controller.scope.margins = SETTINGS.margins;
                 * ...
                 * 
                 * // Main.js
                 * ...
                 * var verticalMargins = controller.scope.margins[0];
                 * ...
                 */
                scope: {},
                labels: this.axisLabels,

                /** Metrics used in the visualization.
                 * @name metrics
                 * @type {object}
                 * @memberof controller
                 * @instance
                 * @example
                 * controller.metrics['Size'];
                 */
                metrics: this.metrics,

                /** Fields of the visualization's data source.
                 * @name fields
                 * @type {Backbone.Collection}
                 * @memberof controller
                 * @instance
                 */
                fields: this.fields,

                /* Intended to be overridden */
                onAdd: $.noop,
                onRemove: $.noop,
                onChange: $.noop,
                /** A function your visualization provides, called whenever data should update in the visualization.
                 * @name controller#update
                 * @memberof controller
                 * @function
                 * @param {object[]} data Data sent to the visualization to be rendered.
                 * @param {number} progress A number between 0 and 100 to indicate sharpening progress.
                 */
                update: $.noop,
                
                /** Same as 'controller.update' method, but it brings raw data from server.
                 * @name controller#processData
                 * @memberof controller
                 * @function
                 * @param {object[]} data Data sent to the visualization to be processed.
                 * @param {number} progress A number between 0 and 100 to indicate sharpening progress.
                 * @example
                 * controller.processData = function(data, progress){
                 *     var currentDataToBeRemoved = [],
                 *         currentDataToBeMerged  = [],
                 *         historicalDataToBeRemoved = [],
                 *         historicalDataToBeMerged  = [];
                 *     data.forEach(function(item){
                 *         if(item.current.count === -1){
                 *             currentDataToBeRemoved.push(item);
                 *         }else{
                 *             currentDataToBeMerged.push(item);
                 *         }
                 *         if(item.historical){
                 *            if(item.historical.count === -1){
                 *                 historicalDataToBeRemoved.push(item);
                 *             }else{
                 *                 historicalDataToBeMerged.push(item);
                 *            }
                 *         }
                 *     });
                 * }
                 */

                /** A function your visualization provides, called whenever the visualization is need to be cleaned.
                 * @name controller#clean
                 * @memberof controller
                 * @function
                 */

                
                
                /** A function your visualization provides, called whenever no data found for current conditions.
                 * @name controller#onNoDataFound
                 * @memberof controller
                 * @function
                 */
                onNoDataFound: $.noop,

                /** A function your visualization provides, called whenever the visualization is resized.
                 * @name controller#resize
                 * @memberof controller
                 * @function
                 * @param {number} width Data sent to the visualization to be rendered.
                 * @param {number} height A number between 0 and 100 to indicate sharpening progress.
                 * @param {string} size A zoomdata determined size of small, medium or large.
                 */
                resize: $.noop,
                
                /** A function your visualization provides, called whenever some Stream/Server Error happened.
                 * @name controller#onStreamError
                 * @memberof controller
                 * @function
                 * @param {string} message The Error Message
                 */
                onStreamError:$.noop,
                
                onViewport:$.noop,
                
                onExeption:$.noop,

                /** A function your visualization provides, called whenever data sharpening process done.
                 * @name controller#onNotDirtyData
                 * @memberof controller
                 * @function
                 */
                onNotDirtyData:$.noop,
                onStart:$.noop,
                onStop:$.noop,

                /** Register HTML Elements that you want to be interactive. Example: a bar in a bar chart.
                 * @name controller#registerInteractiveElements
                 * @memberof controller
                 * @function
                 * @param {HTMLElement} input HTML Element to make interactive. Can be an HTML or SVG element.
                 * @param {object} options Interactive element options.
                 * @param {function} options.data Function returns the data object that this element represents.
                 * @example
                 * node.enter().append("div")
                 *      .each(function () {
                 *          var item = d3.select(this);
                 *          controller.registerInteractiveElements(this, {
                 *              data: function () {return item.data()[0]}
                 *          });
                 *      });
                 */
                registerInteractiveElements: function (input, roles, options, title) {
                    instance.registerInteractiveElements(input, roles, options, title);
                },


                /** Release HTML Elements you no longer want to be interactive. Example: a bar in a bar chart.
                 * @name controller#releaseInteractiveElement
                 * @memberof controller
                 * @function
                 * @param {HTMLElement} input HTML Element to release. Can be an HTML or SVG element.
                 * @example
                 * node.exit()
                 *      .each(function () {
                 *          controller.releaseInteractiveElement(this);
                 *      })
                 *      .remove();
                 */
                releaseInteractiveElement: function (input, options) {
                    instance.releaseInteractiveElement(input, options);
                },
                registered: function(input){
                    return instance.elementsManager.registered(input);
                },
                requestData: function() {
                    return instance.thread.request_data.bind(instance.thread);
                },

                /* To be reviewed and simplified */
                customReadyStatusDelay: false,
                setVisualization: function(data, restart){
                    instance.setVisualization(data, restart);
                },


                /** Create an axis label for your visualization.
                 * @name controller#createAxisLabel
                 * @memberof controller
                 * @function
                 * @param {object} options Configuration options for the axis label.
                 * @param {string} options.picks The name of the metric or the keyword 'attribute' to indicate what this label represents.
                 * @param {string} options.orientation Orient the label as horizontal or vertical.
                 * @param {string} options.position Specify a position for the axis label: top, bottom, left or right.
                 * @param {string} options.popoverTitle Title to be used for the axis label picker.
                 * @example
                 *  controller.createAxisLabel({
                 *      picks: "attribute",
                 *      orientation: "horizontal",
                 *      position: "bottom",
                 *      popoverTitle: "Attribute"
                 *  });
                 */
                createAxisLabel: function (options) {
                    var variables = instance.state.config.get('variables'),
                        currentVariable = variables.filter(function (item) { return item.name === options.picks; })[0];

                    if (currentVariable && (currentVariable.type === 'multi-group' || currentVariable.type === 'group')) {
                        return instance.state.groupBy.map(function(group, i) {
                            var popoverTitle;

                            if (options.popoverTitle) {
                                popoverTitle = options.popoverTitle;
                                if (instance.state.groupBy.length > 1) {
                                    popoverTitle += ' ' + (i + 1);
                                }
                            } else {
                                popoverTitle = group.getLabel() || 'Group ' + (i + 1);
                            }

                            return instance._createAxisLabel(
                                $.extend({},
                                    options,
                                    { picks: group, popoverTitle: popoverTitle }
                                )
                            );
                        });
                    } else {
                        return instance._createAxisLabel(options);
                    }
                },

                toolbar: function () {
                    var toolbar = instance._controller.toolbar;

                    if (!toolbar.$_toolbar) {
                        toolbar.$_toolbar = $('\
                            <div class="zd-visualization-toolbar navbar"> \
                                <div class="navbar-inner">  \
                                    <div class="container"> \
                                        <ul class="nav pull-left"/>  \
                                        <ul class="nav pull-right"/> \
                                    </div>  \
                                </div>\
                            </div>')
                            .prependTo($(instance._controller.element).parent());

                        var left = function() { return toolbar.$_toolbar.find('.nav.pull-left'); }
                        var right = function() { return toolbar.$_toolbar.find('.nav.pull-right'); }

                        toolbar.append = function(options, prepend) {
                            if (options.item && undefined !== options.item.availableForMode && "function" === typeof options.item.availableForMode) {
                                var available = options.item.availableForMode(Zoomdata.Utilities.mode());

                                if (!available) {
                                    return;
                                }
                            }


                            var side = options.side || options.item && options.item.side || 'left',
                                el = options.el || options.item && options.item.render().el;

                            if (!el) {
                                var toolbarItem = new Zoomdata.VisualizationControls.ToolbarItem(options);
                                el = toolbarItem.render().el;
                            }

                            if ('left' === side) {
                                prepend ? left().prepend(el) : left().append(el);
                            }
                            else {
                                prepend ? right().prepend(el) : right().append(el);
                            }

                            if (options.item && options.name) {
                                if (!toolbar._items) {
                                    toolbar._items = {};
                                }
                                toolbar._items[options.name] = options.item;
                            }

                            var toolbarElement = instance.$el.parent().find('.zd-visualization-toolbar');

                            // Insert only pagination control to toolbar for widget mode.
                            if (WIDGET && options.item.icon !== 'list') {
                                $(el).remove();
                            }else{
                                if(toolbarElement.length > 0){
                                    $(instance._controller.element).css({
                                        'height':'87%'
                                    });
                                } else {
                                    $(instance._controller.element).css("height","calc(100% - 42px)");
                                }
                            }

                            return toolbar;
                        };

                        toolbar.get = function(name) {
                            return toolbar._items && toolbar._items[name] || null;
                        };

                        toolbar.remove = function() {
                            toolbar._items = null;
                            toolbar.$_toolbar.remove();
                            toolbar.$_toolbar = null;
                        };
                    }

                    return toolbar;
                }
            };

            $.each(this.metrics, function (index, metric) {
                if (metric.colorMetric) {
                    instance._controller.colorMetric = metric;
                    return false;
                }
            });

            var toolbarItemNames = _.filter(this.config.get("controls"), function(control) {
                return control.indexOf("ToolbarItem") >= 0 ? control : null;
            });

            if (toolbarItemNames.length > 0) {
                var toolbarItems = [];
                toolbarItemNames.forEach(function(name) {
                    if (Zoomdata.VisualizationToolbar[name]) {
                        var item = new Zoomdata.VisualizationToolbar[name]({ controller: instance._controller });
                        item.name = name;
                        toolbarItems.push(item);
                    }
                });

                toolbarItems = _.sortBy(toolbarItems, function(item) {
                    return item.order || Number.MAX_VALUE;
                });

                toolbarItems.forEach(function(item) {
                    instance._controller.toolbar().append({ item:item, name:item.name });
                });
            }

            this._controller.variables = this.config.get("source").variables;

            this.components
                .where({type: 'text/javascript'})
                .forEach(function(component) {
                    var func = component.getConstructorName();
                    Zoomdata.Visualizations[namespace][func](instance._controller, Zoomdata);
                });

            this._controller.update = this._controller.update || $.noop;
            this._controller.onAdd = this._controller.onAdd || $.noop;
            this._controller.onRemove = this._controller.onRemove || $.noop;
            this._controller.onChange = this._controller.onChange || $.noop;
            this._controller.clear = this._controller.clear || $.noop;
            this._controller.resize = this._controller.resize || $.noop;
            this._controller.onStreamError = this._controller.onStreamError || $.noop;
            this._controller.onNotDirtyData = this._controller.onNotDirtyData || $.noop
            this._controller.onStart = this._controller.onStart || $.noop;
            this._controller.onViewport = this._controller.onViewport || $.noop;
            this._controller.onExeption = this._controller.onExeption || $.noop;

            // Display Toolbar only for Grid on widget mode.
            var visType = this.config.get('type');
            if (WIDGET && visType !== 'PIVOT_TABLE') {
                this._controller.toolbar().remove();
            }
            this.initColorKey();

            this.applyEvents();
        },

        removeVisualization: function () {
            var visId = this.config.get('visId'),
                sources = {},
                scripts = $('script'),
                $body = this.$el.parents('.widgetBody, .fullScreenContainer').eq(0);

            this.$el.appendTo($body); // Because of Pivot
            
            this.components.each(function(c){
                if(c.get('type') === 'text/javascript'){
                    var cid = c.get('id');
                    scripts.each(function(i,s){
                        if(s.getAttribute('src')
                                && (s.getAttribute('src').indexOf(visId) > -1)
                                && (s.getAttribute('src').indexOf(cid) > -1)){
                            sources[cid] = $(s);
                        }
                    });
                }
            });

            $body.children().not('.widgetContent').remove();
            $body.removeAttr('id');
            
            this.clearVisualization(true);
            this.data = [];
            if(this._controller){
                $(this._controller.element).children().not('.zd-legend').remove();
                if(this._controller.labels.length > 0){
                    this._controller.labels.forEach(function(label){
                        label.remove();
                        label = null;
                    });
                }
            }
            this.$el.removeAttr('style data-visid');
            this.muteEvents();
            this.trigger("visualization:removed");
            for(var id in sources){
                if(sources.hasOwnProperty(id)){
                    sources[id].remove();
                }
            }
        },

        initColorKey: function () {
            this.colorKey = new ColorKey({
                el: this.$el.find('.zd-legend'),
                controller: this,
                isDraggable: true,
                autoShow: this.autoShowColorLegend
            });
        },

        loadVisualization: function () {
            var instance = this,
                namespace = this.components.getComponentsNamespace();
            this.dfd = $.Deferred();

            if (Zoomdata.Visualizations instanceof Array) {
                instance.trigger("visualization:loaded");
                this.dfd.resolve();
            }
            else {
                Zoomdata.Visualizations[namespace] || (Zoomdata.Visualizations[namespace] = {});

                this.trigger("visualization:loading");
                this.$el
                    .attr('data-visid',this.config.get('visId'))
                    .removeAttr('id');
                this.libraries.load()
                    .done(function () {
                        instance.components.load()
                            .done(function () {
                                instance.trigger("visualization:loaded");
                                instance.dfd.resolve();
                            })
                            .fail(function(response) {
                                throw response.message;
                                instance.trigger("visualization:loaded");
                                instance.dfd.reject(response);
                            });
                    })
                    .fail(function (response) {
                        throw response.message;
                        instance.trigger("visualization:loaded");
                        instance.dfd.reject(response);
                    });
            }

            return this.dfd.promise();
        },

        setUUID: function () {
            this.thread.setUUID();
            this.UUID = this.thread.getUUID();
            this.config.set('id', this.UUID);
            this._controller.UUID = this.UUID;
        },
        
        applyScope: function(){
            var self = this,
                components = this._controller.state.config.attributes.components,
                stylesList = document.styleSheets,
                style = null,
                idPrefix = 'uuid_',
                check = document.createElement( 'style' ),
                withScope,
                visId = self.config.attributes.visId;
            document.body.appendChild( check );
            withScope = check.scoped+'';
            check.parentNode.removeChild(check);
                
            if(withScope){
                var styleSheetDOM = $('style[data-visid="' + visId + '"]');
                styleSheetDOM.appendTo(self.$el);
                styleSheetDOM.attr('scoped','');
                styleSheetDOM.scopedPolyFill();
                return;
            }
        
            components.map(function(d){
                try{
                    if(d.type === 'text/css'){
                        
                        for(var i = 0, sl = stylesList.length; i < sl; i++){
                            var s = stylesList[i],
                                cId = d.id;
                            if(visId
                            && s.ownerNode.attributes['data-visid'] && visId === s.ownerNode.attributes['data-visid'].value
                            && cId
                            && s.ownerNode.attributes['data-componentid'] && cId === s.ownerNode.attributes['data-componentid'].value
                            && s.UUID === undefined){
                                style = s;
                                break;
                            }
                        }
                        if(style){
                            var id = self._controller.UUID;
//                            style.UUID = id;
                            self.$el.attr('id', idPrefix + id);
                            for(i=0, sl = style.cssRules.length; i < sl; i++){
                                var rules = style.cssRules
                                    ? style.cssRules[i].selectorText.split(',')
                                    : style.rules[i].selectorText.split(','),
                                    newRules = '';
                                rules.forEach(function(r,i){
                                    newRules += '#' + idPrefix + id + ' ' + r
                                        + (i !== (rules.length - 1) ? ',':'');
                                });
                                if(style.cssRules){
                                    style.cssRules[i].selectorText = newRules;
                                    var ns = _.extend({},style.cssRules[i]);
                                    style.removeRule ? style.removeRule( i ) : style.deleteRule( i );
                                }else{
                                    style.rules[i].selectorText = newRules;
                                    var ns = _.extend({},style.rules[i]);
                                    style.removeRule ? style.removeRule( i ) : style.deleteRule( i );
                                }
                                if(style.insertRule) {
                                    style.insertRule(ns.cssText, i);
                                }
                                else {
                                    style.addRule(newRules, ns.style.cssText, i);
                                }
                            }
                        }
                    }
                }catch(e){
                    console.log('Scoped error',e);
                    throw e;
                }
            });
        },
        
        startVisualization: function (restart) { 
            // Marker restart to indicate that vis restarted, not initial load. used to set time for rolling hour correctly
            // UndoConfig give prev.request for back to prev.controller state

            this.setUUID();
            if(this._controller.delayedStart && this._controller.delayedStart === true){
                return;
            }

            this.thread.start();

            return this;
        },
        
        stopVisualization: function () {
            this.thread.stop();

            this.trigger('visualization:stop', this);
            eventDispatcher.trigger('visualization:stop', this);

            return this;
        },

        restartVisualization: function () {
            this.data = [];
            this.stopVisualization();
            this.startVisualization(true);
        },

        refreshVisualization: function() {
            var clientSort = this.state.get('clientSort'),
                metric = this.state.metrics.at(0);
            if (metric && clientSort) {
                this.state.config.set('clientSort', clientSort);
            }
            var dataForVisualization = this.data;
            if (typeof this._controller.processData == 'function') {
                this._controller.processData(dataForVisualization,this.progress);
            }
            this._updateMetricsDomain(dataForVisualization);
            this.processSocketData(dataForVisualization,this.progress);
            this.colorKey.render();
        },

        clearVisualization: function (close) {
            if(!close){
                this.data = [];
                this.refreshVisualization();
            }
            if(this._controller){
                (typeof this._controller.clear == 'function')
                ? this._controller.clear()
                : null;
            }else if(this.dfd){
                this.dfd.reject();
            }
        },

        getControlsList: function () {
            return this.getSourceConfiguration().controls || [];
        },

        getSourceConfiguration: function () {
            return this.config.toJSON();
        },

        getVisualizationState: function () {
            return this.state;
        },

        updateVisualizationState: function (fields) {
            this.state.set(fields);
            return this;
        },

        processSocketData: function(data) {
            var instance = this,
                worker = this.worker,
                group = this._controller.state.groupBy.at(0),
                sortAttribute = group && group.get
                    ? group.get('sort').name
                    : 'count';

            if(sortAttribute === 'count' && this.state.metrics.length > 0){
                var metric = this.config.get('variables').filter(function(v){
                        return v.type === 'metric' && v.metricType !== 'color'
                    })[0],
                    metricName = metric && metric.name ? metric.name : false;
                
                sortAttribute = this.metrics && this.metrics[metricName] ? this.metrics[metricName].metric.name : 'count';
            }
            
            // WebWorkers turned off because we have issues if receive several packaged with data
            // if (!worker) {
                if (data instanceof Array && data.length > 0) {
                    var result = [],
                        oldObject = {},
                        newObject = {},
                        oldData = this.data,
                        newData = data;

                    if (oldData.length === 0) {
                        result = newData;
                    } else if (newData.length === 0) {
                        result = oldData;
                    } else {
                        oldData.forEach(function(item) {
                            var group = Array.isArray(item.group)
                                ? item.group.join()
                                : item.group;
                            oldObject[group] = item;
                        });
                        newData.forEach(function(item) {
                            var group = Array.isArray(item.group)
                                ? item.group.join()
                                : item.group;
                            newObject[group] = item;
                        });
                        for (var key in newObject) {
                            if (newObject.hasOwnProperty(key)) {
                                if (newObject[key].current.count === -1) {
                                    if (oldObject[key]) {
                                        delete oldObject[key];
                                    }
                                } else {
                                    oldObject[key] = newObject[key];
                                }
                            }
                        }
                        for (var key in oldObject) {
                            if (oldObject.hasOwnProperty(key)) {
                                result.push(oldObject[key]);
                            }
                        }
                    }
                    this.data = this._sortData(result);
                    oldObject = null;
                    newObject = null;
                }
                var dataForVisualization = JSON.parse(JSON.stringify(this.data));
                this._updateMetricsDomain(dataForVisualization);
                this._controller.update(dataForVisualization, this.thread.progress(), {original_data: data});
            // } else {
            //     worker.onmessage = function(e) {
            //         if (e.data.data) {
            //             instance.data = e.data.data;            
            //             var dataForVisualization = JSON.parse(JSON.stringify(instance.data));
            //             instance._updateMetricsDomain(dataForVisualization);
            //             instance._controller.update(dataForVisualization, instance.thread.progress(), {
            //                 original_data: data
            //             });
            //             instance.colorKey.render();
            //         }
            //     };
            //     worker.postMessage({
            //         data: data,
            //         oldData: this.data,
            //         clientSort: this.state.get('clientSort'),
            //         sortAttribute: sortAttribute
            //     });
            // }
        },

        _mergeData: function(data, newdata){
            var map = [],
                uniqData = [];

            createMapOfData(data);
            createMapOfData(newdata);

            uniqData = this._sortData(uniqData);

            function createMapOfData(array){
                for (var i in array) {
                    if (map.indexOf(array[i].group) === -1) {
                        map.push(array[i].group);
                        uniqData.push(array[i]);
                    } else {
                        var item = _.findWhere(uniqData, {group: array[i].group});
                        item = array[i];
                    }
                }
            }

            return uniqData;
        },
                
        _sortData: function(data){
            var clientSort = this.state.get('clientSort'),
                result = [];
            if (clientSort && this.state.metrics.size() > 0) {
                var sortIterator = null,
                    metric = this.metrics[this.state.metrics.at(0).get('label')];
                    metric instanceof Array ? metric = metric[0] : null;
                switch(clientSort){
                    case 'valueDescending':
                        sortIterator = function(a,b){
                            var diff = metric.raw(b) - metric.raw(a);
                            if(diff === 0){
                                var aString = a.group.join ? a.group.join('') : a.group,
                                    bString = b.group.join ? b.group.join('') : b.group;
                                return aString.localeCompare(bString);
            }
                            return diff;
                        };
                        break;
                    case 'valueAscending':
                        sortIterator = function(a,b){
                            var diff = metric.raw(a) - metric.raw(b);
                            if(diff === 0){
                                var aString = a.group.join ? a.group.join('') : a.group,
                                    bString = b.group.join ? b.group.join('') : b.group;
                                return bString.localeCompare(aString);
                            }
                            return diff;
                        };
                        break;
                    case 'alphabetical':
                        sortIterator = function(a,b){
                            var aString = a.group.join ? a.group.join('') : a.group,
                                bString = b.group.join ? b.group.join('') : b.group;
                            return aString.localeCompare(bString);
                        };
                        break;
                    case 'reverseAlphabetical':
                        sortIterator = function(a,b){
                            var aString = a.group.join ? a.group.join('') : a.group,
                                bString = b.group.join ? b.group.join('') : b.group;
                            return bString.localeCompare(aString);
                        };
                        break;
                    default: sortIterator = null;
                }
                result = data.sort(sortIterator);
            }else{
                result = data;
            }
            return result;
        },

        _updateMetricsDomain: function(data) {
            var self = this;

            function update(a){
               $.each(a, function (metricName, metric) {
                  if(metric instanceof Array){
                      update(metric);
                  }else{
                    metric._updateDomain(data, self.state.colorNumb);
                    self.state.colorMetricDomain = metric.domain();
                  }
              });
            }
            
            update(this.metrics);
        },

        _updateMetricsDivergingColorRange: function(type) {
            function update(a){
               $.each(a, function (metricName, metric) {
                  if(metric instanceof Array){
                      update(metric);
                  }else{
                    metric.setColorRangeType(type);
                  }
              });
            }

            this.state.divergingColorRange = type;
            update(this.metrics);
        },

        calculateBottomMargin: function (size) {
            var marginBottom;

            switch(size){
                case 'large':
                    marginBottom = 10;
                    break;
                case 'medium':
                    marginBottom = 40;
                    break;
                case 'small':
                    marginBottom = 50;
                    break;
            }

            return marginBottom;
        },

        _onResize: function() {
            var $elem = $(this._controller.element),
                $widget = $elem.parents('.widget, .fullScreenContainer').eq(0),
                widgetWidth = $widget.width(),
                widgetHeight = $widget.height(),
                width = $elem.width(),
                height = $elem.height(),
                size = Zoomdata.Utilities.getWidgetSizeClass(widgetWidth,widgetHeight),
                toolbarElement = this.$el.parent().find('.zd-visualization-toolbar'),
                marginBottom = 0;

            if(toolbarElement.length > 0){
                marginBottom = this.calculateBottomMargin(size);
            }

            $elem.trigger('resize',[width, height]);
            
            width = $elem.width();
            height = $elem.height() - marginBottom;
            
            this.colorKey.fixPosition();
            this._controller.resize(width, height, size);
        },
        _onStreamError:function(message){
            this._controller.onStreamError(message);
        },
        _onStart:function(message){
            this._controller.onStart(message);
            this.trigger('visualization:start');
        },
        _onNotDirtyData:function(message){
            this._controller.onNotDirtyData(message);
        },
        
        _onViewport: function(data) {
            this._controller.onViewport(data);
        },
        
         _onExeption: function(data) {
            this._controller.onExeption(data);
        },
        
        _onStop: function(data) {
            this._controller.onStop(data);
        },

        startFromTime: function (timeModel, time) {
            this.thread.startFromTime(time);
        },
        startFromTimeTo: function (timeModel, timeTo) {
            this.thread.startFromTimeTo(timeTo);
        },
        updateSpeed: function (timeModel, speed) {
            this.thread.updateSpeed(speed);
        },

        togglePause: function (paused) {
            var thread = this.thread;

            paused !== undefined
                ? paused
                    ? thread.unpause()
                    : thread.pause()
                : this.thread.togglePause();
        },

        getRestrictions: function (twitterSettings) {
            var filtersModel =  twitterSettings.restrictions;
            var filters = _.map(filtersModel, function (f) {
                return {path: f.path, operation: f.operation, value: f.value}
            });
            return _.filter(filters, function (f) {
                return f.path != twitterSettings.tsField
            });
        },

        getDefaultTemplate: function(type) {
            return SOURCE_NAME;
        },

        getVisualizationName: function() {
            var instance = this,
                metrics = this.state.metrics,

                defaultMetric = metrics.at(0),
                defaultAccessor = defaultMetric ? this.metrics[defaultMetric.get('label')] : null,

                source = this.config.get("source"),
                type = this.config.get('type'),
                visName = this.config.get('name'),

                groupBy = this.state.groupBy.getAttribute(),
                groupByField = this.fields.findWhere({name: groupBy}),
                groupLabel = groupByField ? groupByField.get('label') : groupBy,

                sourceName = source.sourceName;
                
            var template = source.variables["Visualization Name"] || this.getDefaultTemplate(type);
            var name = template || sourceName;

            if (template) {
                name = name.replace(SOURCE_NAME, sourceName);
            }

            return name;
        }
    });

} (window, Zoomdata));
;
/*
 * Copyright (C) Zoomdata, Inc. 2012-2014. All rights reserved.
 */
(function (root, Zoomdata) {

    Zoomdata.Components = Zoomdata.Components || {};

    var defaults = {
            secureHost: false
        },
        Sources = Zoomdata.Collections.Sources,
        VisualizationController = Zoomdata.Components.VisualizationController,
        InteractiveElementsManager = Zoomdata.Components.InteractiveElementsManager;

    /**
     * Zoomdata Javascript Client Constructor.
     * @name ZoomdataClient
     * @constructor
     * @param {Object} options Options to initialize the Javascript Client with.
     * @param {string} options.apiKey API Key used to access the Zoomdata server. Use this command to generate an API key. <pre>curl -v --user admin:admin http://localhost:8080/zoomdata/service/user/key</pre>
     * @param {boolean} options.secure Boolean flag indicating whether the Zoomdata server uses https or not.
     * @param {string} options.host URL to access the Zoomdata server. example.com/zoomdata
     * @example
     * var zoomdataClient = new ZoomdataClient({
     *      apiKey: API_KEY,
     *      host: 'localhost:8080/zoomdata',
     *      secure: false
     * });
     */
    var StandaloneClient = function StandaloneClient (options) {

        /**
         * An initialized Visualization.
         * @typedef {Object} Visualization
         * @property {string} name The Name of this visualization.
         * @property {string} source The Data Source this visualization uses.
         * @property {controller} controller The visualization controller.
         * @memberof ZoomdataClient
         */

        /** The array of currently initialized visualizations.
         * @name visualizations
         * @type {Visualization[]}
         * @memberof ZoomdataClient
         * @instance
         */
        this.visualizations = [];

        if (typeof options.apiKey !== 'undefined') {
            this.apiKey = options.apiKey;
        } else {
            throw new Error('An apiKey must be defined');
        }

        if (typeof options.secure !== 'undefined') {
            this.secure = options.secure;
        } else {
            this.secure = defaults.secure;
        }

        if (typeof options.host !== 'undefined') {
            this.host = options.host;
        } else {
            throw new Error('An url must be defined');
        }

        this.sources = new Sources([], {
            secure: this.secure,
            remote: this.host,
            apiKey: this.apiKey
        });

        this.stream = startStream(this.host, this.apiKey, this.secure);
    };

    function startStream(host, key, secure) {
        var dataStreamUrl = "/websocket/";
        if (host) {
            dataStreamUrl = host + dataStreamUrl + '?key=' + key;
            if(secure) {
                dataStreamUrl = 'wss://' + dataStreamUrl;
            } else {
                dataStreamUrl = 'ws://' + dataStreamUrl;
            }
        }

        Zoomdata.dataStream = Zoomdata.DataStreamProvider.getStream(dataStreamUrl);
        Zoomdata.dataStream.publish(Zoomdata.eventDispatcher);

        return Zoomdata.dataStream;
    }

    /**
     * Initialize a visualization.
     * @name ZoomdataClient#visualize
     * @method
     * @param {Object} options Options to initialize the Visualization with.
     * @param {string} options.visualization Visualization name to initialize.
     * @param {string} options.source Source name to initialize the visualization with.
     * @param {HTMLElement} options.element HTML Element to attach the visualization to.
     * @example <caption>Simple example of initializing a visualization.</caption>
     * zoomdataClient.visualize({
     *      visualization: "Vertical Bars",
     *      source: "Real Time Sales",
     *      element: document.body
     * });
     * @example <caption>Advanced example of initializing a visualization with loading/success/error callbacks.</caption>
     * zoomdataClient.visualize({
     *      visualization: "Vertical Bars",
     *      source: "Real Time Sales",
     *      element: document.body
     * })
     * .progress(function (message) {
     *      console.log('loading...', message);
     * })
     * .done(function (visualization) {
     *      console.log('Finished loading successfully.');
     * })
     * .fail(function (xhr, response) {
     *      var message = typeof xhr == 'string' ? xhr : null;
     *      console.log(message || (response + ': ' + xhr.statusText));
     * });
     * @returns {Promise} A jQuery Promise (http://api.jquery.com/deferred.promise/)
     */
    function visualize(options) {
        options = options || {};
        var visName, sourceName, source, element,
            instance = this,
            dfd = $.Deferred(),
            sources = this.sources;

        if (typeof options.visualization == 'string' && options.visualization) {
            visName = options.visualization;
        } else {
            throw new Error('Invalid visualization name');
        }

        if (typeof options.source == 'string' && options.source) {
            sourceName = options.source;
        } else {
            throw new Error('Invalid source name');
        }

        if (options.element instanceof root.HTMLElement) {
            element = options.element;
        } else {
            throw new Error('Invalid element');
        }

        source = sources.findWhere({name: sourceName});

        if (source) {
            getVisConfig(visName, source)
                .then(resolve, reject, notify);
        } else {
            dfd.notify('Loading Source');
            sources.fetch({data:{name: sourceName}})
                .then(function (response) {
                    var sourceId, source;

                    if (response[0]) {
                        sourceId = response[0].id;
                        source = sources.get(sourceId);

                        getVisConfig(visName, source).then(resolve, reject, notify);
                    } else {
                        dfd.reject("source doesn't exist");
                    }
                });
        }


        return dfd.promise();

        function resolve(config, source) {
            var host = {
                    remote: instance.host,
                    secure: instance.secure,
                    apiKey: instance.apiKey
                },
                visualization = initController(config, source, element, host);

            instance.visualizations.push(visualization);

            visualization.controller.loadVisualization()
                .done(function () {
                    visualization.controller.initVisualization();
                    visualization.controller.startVisualization();
                    dfd.resolve(visualization);
                });
        }

        function reject(xhr, response) {
            var message = typeof xhr == 'string' ? xhr : null;
            console.warn(message || (response + ': ' + xhr.statusText));

            dfd.reject(xhr, response)
        }

        function notify(message) {
            console.log(message);
            dfd.notify(message);
        }
    }

    /**
     * Stop a visualization.
     * @name ZoomdataClient#stop
     * @method
     * @param {Object} options Options with properties indicating which visualization to stop.
     * @param {string} options.visualization Visualization name to stop.
     * @param {string} options.source Source name of visualization to stop.
     *
     * @example <caption>Simple example of stopping a visualization.</caption>
     * zoomdataClient.stop({
     *      visualization: "Vertical Bars",
     *      source: "Real Time Sales"
     * });
     *
     * @example <caption>Advanced example of stopping a visualization with loading/success/error callbacks.</caption>
     * zoomdataClient.stop({
     *      visualization: "Vertical Bars",
     *      source: "Real Time Sales"
     * })
     * .progress(function (message) {
     *      console.log('stopping...', message);
     * })
     * .done(function () {
     *      console.log('Finished stopping successfully.');
     * })
     * .fail(function (xhr, response) {
     *      var message = typeof xhr == 'string' ? xhr : null;
     *      console.log(message || (response + ': ' + xhr.statusText));
     * });
     * @returns {Promise} A jQuery Promise (http://api.jquery.com/deferred.promise/)
     */
    function stop(options) {
        options = options || {};
        var visName, sourceName, visualization,
            dfd = $.Deferred();

        if (typeof options.visualization == 'string' && options.visualization) {
            visName = options.visualization;
        } else {
            throw new Error('Invalid visualization name');
        }

        if (typeof options.source == 'string' && options.source) {
            sourceName = options.source;
        } else {
            throw new Error('Invalid source name');
        }

        visualization = _.where(this.visualizations, {
            name: visName,
            source: sourceName
        })[0];

        if (visualization) {
            dfd.notify('Closing visualization ' + visName);
            visualization.controller.remove();
            visualization.controller.elementsManager.destroy();
            $(visualization.root).remove();
            this.visualizations.splice(this.visualizations.indexOf(visualization), 1);
            dfd.resolve();
        } else {
            dfd.reject("Visualization doesn't exist");
        }

        return dfd.promise();

    }

    function getVisConfig(visName, source) {
        var config = source.visualizations.findWhere({name: visName}),
            dfd = $.Deferred();

        if (config) {

            dfd.notify('fetching visualization config for ' + visName);
            config.fetch()
                .done(function () {
                    dfd.resolve(config, source);
                })
                .fail(function (xhr, response) {
                    dfd.reject(xhr, response);
                });

        } else {

            dfd.notify('fetching visualizations for '+ source.get('name'));
            source.visualizations.fetch()
                .done(function () {
                    var config = source.visualizations.findWhere({name: visName});

                    if (config) {
                        dfd.notify('fetching visualization config for ' + visName);
                        config.fetch()
                            .done(function () {
                                dfd.resolve(config, source);
                            })
                            .fail(function (xhr, response) {
                                dfd.reject(xhr, response);
                            });
                    } else {
                        dfd.reject("visualization doesn't exist");
                    }
                })
                .fail(function (xhr, response) {
                    dfd.reject(xhr, response);
                });

        }

        return dfd;
    }

    function initController(config, source, element, host) {
        var root = $('<div style="position: relative; height: 100%;"></div>').appendTo(element),
            visContent = $('<div class="widgetContent" style="position: relative; height: 100%;"></div>')
                .append('<div class="zd-legend" style="display: none;"></div>')
                .appendTo(root)[0],
            interactiveElements = new InteractiveElementsManager(),
            controller = new VisualizationController({
                config: config,
                source: source,
                interactiveElements: interactiveElements,
                el: visContent,
                host: host
            }),
            visInfo = {
                name: config.get('name'),
                source: source.get('name'),
                root: root[0],
                controller: controller
            };

        console.log(visInfo);

        return visInfo;
    }

    StandaloneClient.prototype = {
        visualize: visualize,
        stop: stop
    };

    Zoomdata.Components.StandaloneClient = StandaloneClient;

    root.ZoomdataClient = StandaloneClient;

} (window, Zoomdata));
//# sourceMappingURL=standalone-client.js.map