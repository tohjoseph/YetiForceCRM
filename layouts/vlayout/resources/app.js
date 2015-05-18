/*+***********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 * Contributor(s): YetiForce.com
 *************************************************************************************/

var app = {

	/**
	 * variable stores client side language strings
	 */
	languageString : [],
	
	
	weekDaysArray : {Sunday : 0,Monday : 1, Tuesday : 2, Wednesday : 3,Thursday : 4, Friday : 5, Saturday : 6},

	/**
	 * Function to get the module name. This function will get the value from element which has id module
	 * @return : string - module name
	 */
	getModuleName : function() {
		return jQuery('#module').val();
	},

	/**
	 * Function to get the module name. This function will get the value from element which has id module
	 * @return : string - module name
	 */
	getParentModuleName : function() {
		return jQuery('#parent').val();
	},

	/**
	 * Function returns the current view name
	 */
	getViewName : function() {
		return jQuery('#view').val();
	},
	/**
	 * Function to get the contents container
	 * @returns jQuery object
	 */
	getContentsContainer : function() {
		return jQuery('.bodyContents');
	},

	/**
	 * Function which will convert ui of select boxes.
	 * @params parent - select element
	 * @params view - select2
	 * @params viewParams - select2 params
	 * @returns jquery object list which represents changed select elements
	 */
	changeSelectElementView : function(parent, view, viewParams){

		var selectElement = jQuery();
		if(typeof parent == 'undefined') {
			parent = jQuery('body');
		}

		//If view is select2, This will convert the ui of select boxes to select2 elements.
		if(view == 'select2') {
			app.showSelect2ElementView(parent, viewParams);
			return;
		}
		selectElement = jQuery('.chzn-select', parent);
		//parent itself is the element
		if(parent.is('select.chzn-select')) {
			selectElement = parent;
		}

		//fix for multiselect error prompt hide when validation is success
		selectElement.filter('[multiple]').filter('[data-validation-engine*="validate"]').on('change',function(e){
			jQuery(e.currentTarget).trigger('focusout');
		});
		var moduleName = app.getModuleName();
		if( selectElement.filter('[multiple]') && moduleName!= 'Install'){
			selectElement.data('placeholder',app.vtranslate('JS_SELECT_SOME_OPTIONS'));
		}else if( moduleName!= 'Install' ){
			selectElement.data('placeholder',app.vtranslate('JS_SELECT_AN_OPTION'));
		}
		var params = {
			no_results_text:  app.vtranslate('JS_NO_RESULTS_FOUND')+':'
		};
	
		
		var chosenElement = selectElement.chosen(params);
		var chosenSelectConainer = jQuery('.chzn-container');
		//Fix for z-index issue in IE 7
		if (jQuery.browser.msie && jQuery.browser.version === "7.0") {
			var zidx = 1000;
			chosenSelectConainer.each(function(){
				$(this).css('z-index', zidx);
				zidx-=10;
			});
		}
		return chosenSelectConainer;
	},

	/**
	 * Function to destroy the chosen element and get back the basic select Element
	 */
	destroyChosenElement : function(parent) {
		var selectElement = jQuery();
		if(typeof parent == 'undefined') {
			parent = jQuery('body');
		}

		selectElement = jQuery('.chzn-select', parent);
		//parent itself is the element
		if(parent.is('select.chzn-select')) {
			selectElement = parent;
		}

		selectElement.css('display','block').removeClass("chzn-done").data("chosen", null).next().remove();

		return selectElement;

	},
	/**
	 * Function which will show the select2 element for select boxes . This will use select2 library
	 */
	showSelect2ElementView : function(selectElement, params) {
		if(typeof params == 'undefined') {
			params = {};
		}

		var data = selectElement.data();
		if(data != null) {
			params = jQuery.extend(data,params);
		}
		params.placeholder = app.vtranslate('JS_SELECT_AN_OPTION');
		params.formatNoMatches = function (msn) {return app.vtranslate('JS_NO_RESULTS_FOUND');} ;

		// Sort DOM nodes alphabetically in select box.
		if (typeof params['customSortOptGroup'] != 'undefined' && params['customSortOptGroup']) {
			jQuery('optgroup', selectElement).each(function(){
				var optgroup = jQuery(this);
				var options  = optgroup.children().toArray().sort(function(a, b){
					var aText = jQuery(a).text();
					var bText = jQuery(b).text();
					return aText < bText ? 1 : -1;
				});
				jQuery.each(options, function(i, v){
					optgroup.prepend(v);
				});
			});
			delete params['customSortOptGroup'];
		}

		//formatSelectionTooBig param is not defined even it has the maximumSelectionSize,
		//then we should send our custom function for formatSelectionTooBig
		if(typeof params.maximumSelectionSize != "undefined" && typeof params.formatSelectionTooBig == "undefined") {
			var limit = params.maximumSelectionSize;
			//custom function which will return the maximum selection size exceeds message.
			var formatSelectionExceeds = function(limit) {
					return app.vtranslate('JS_YOU_CAN_SELECT_ONLY')+' '+limit+' '+app.vtranslate('JS_ITEMS');
			}
			params.formatSelectionTooBig = formatSelectionExceeds;
		}
		if(selectElement.attr('multiple') != 'undefined' && typeof params.closeOnSelect == 'undefined') {
			params.closeOnSelect = false;
			params.placeholder = app.vtranslate('JS_SELECT_SOME_OPTIONS');
		}

		selectElement.select2(params)
					 .on("open", function(e) {
						 var element = jQuery(e.currentTarget);
						 var instance = element.data('select2');
						 instance.dropdown.css('z-index',1000002);
					 });
		if(typeof params.maximumSelectionSize != "undefined") {
			app.registerChangeEventForMultiSelect(selectElement,params);
		}
		return selectElement;
	},

	showPopoverElementView : function(selectElement, params) {
		if (typeof params == 'undefined') {
			params = {trigger: 'hover', placement: 'top', delay: {show: 1000, hide: 100}};
		}
		if(selectElement.data('placement')){
			params.placement = selectElement.data('placement');
		}
		
		if (selectElement.hasClass('delay0')) {
			params.delay = {show: 0, hide: 0}
		}
		var data = selectElement.data();
		if (data != null) {
			params = jQuery.extend(data, params);
		}
		selectElement.popover(params);
		return selectElement;
	},
        
	/**
	 * Function to check the maximum selection size of multiselect and update the results
	 * @params <object> multiSelectElement
	 * @params <object> select2 params
	 */

	registerChangeEventForMultiSelect :  function(selectElement,params) {
		if(typeof selectElement == 'undefined') {
			return;
		}
		var instance = selectElement.data('select2');
		var limit = params.maximumSelectionSize;
		selectElement.on('change',function(e){
			var data = instance.data()
			if (jQuery.isArray(data) && data.length >= limit ) {
				instance.updateResults();
            }
		});

	},

	/**
	 * Function to get data of the child elements in serialized format
	 * @params <object> parentElement - element in which the data should be serialized. Can be selector , domelement or jquery object
	 * @params <String> returnFormat - optional which will indicate which format return value should be valid values "object" and "string"
	 * @return <object> - encoded string or value map
	 */
	getSerializedData : function(parentElement, returnFormat){
		if(typeof returnFormat == 'undefined') {
			returnFormat = 'string';
		}

		parentElement = jQuery(parentElement);

		var encodedString = parentElement.children().serialize();
		if(returnFormat == 'string'){
			return encodedString;
		}
		var keyValueMap = {};
		var valueList = encodedString.split('&')

		for(var index in valueList){
			var keyValueString = valueList[index];
			var keyValueArr = keyValueString.split('=');
			var nameOfElement = keyValueArr[0];
			var valueOfElement =  keyValueArr[1];
			keyValueMap[nameOfElement] = decodeURIComponent(valueOfElement);
		}
		return keyValueMap;
	},

	showModalWindow: function(data, url, cb, css) {

		var unBlockCb = function(){};
		var overlayCss = {};

		//null is also an object
		if(typeof data == 'object' && data != null && !(data instanceof jQuery)){
			css = data.css;
			cb = data.cb;
			url = data.url;
			unBlockCb = data.unblockcb;
			overlayCss = data.overlayCss;
			data = data.data

		}
		if (typeof url == 'function') {
			if(typeof cb == 'object') {
				css = cb;
			}
			cb = url;
			url = false;
		}
		else if (typeof url == 'object') {
			cb = function() { };
			css = url;
			url = false;
		}

		if (typeof cb != 'function') {
			cb = function() { }
		}

		var id = 'globalmodal';
		var container = jQuery('#'+id);
		if (container.length) {
			container.remove();
		}
		container = jQuery('<div></div>');
		container.attr('id', id);

		var showModalData = function (data) {

			var defaultCss = {
							'top' : '0px',
							'width' : 'auto',
							'cursor' : 'default',
							'left' : '35px',
							'text-align' : 'left',
							'border-radius':'6px'
							};
			var effectiveCss = defaultCss;
			if(typeof css == 'object') {
				effectiveCss = jQuery.extend(defaultCss, css)
			}

			var defaultOverlayCss = {
										'cursor' : 'default'
									};
			var effectiveOverlayCss = defaultOverlayCss;
			if(typeof overlayCss == 'object' ) {
				effectiveOverlayCss = jQuery.extend(defaultOverlayCss,overlayCss);
			}
			container.html(data);

			// Mimic bootstrap modal action body state change
			jQuery('body').addClass('modal-open');

			//container.modal();
			jQuery.blockUI({
					'message' : container,
					'overlayCSS' : effectiveOverlayCss,
					'css' : effectiveCss,

					// disable if you want key and mouse events to be enable for content that is blocked (fix for select2 search box)
					bindEvents: false,

					//Fix for overlay opacity issue in FF/Linux
					applyPlatformOpacityRules : false
				});
			var unblockUi = function() {
				app.hideModalWindow(unBlockCb);
				jQuery(document).unbind("keyup",escapeKeyHandler);
			}
			var escapeKeyHandler = function(e){
				if (e.keyCode == 27) {
						unblockUi();
				}
			}
			if( jQuery('#backgroundClosingModal').val() == 1){
				jQuery('.blockOverlay').click(unblockUi);
			}
			jQuery(document).on('keyup',escapeKeyHandler);
			jQuery('[data-dismiss="modal"]', container).click(unblockUi);

			container.closest('.blockMsg').position({
				'of' : jQuery(window),
				'my' : 'center top',
				'at' : 'center top',
				'collision' : 'flip none',
				//TODO : By default the position of the container is taking as -ve so we are giving offset
				// Check why it is happening
				'offset' : '0 50'
			});
			//container.css({'height' : container.innerHeight()+15+'px'});

			// TODO Make it better with jQuery.on
			app.changeSelectElementView(container);
            //register all select2 Elements
            app.showSelect2ElementView(container.find('select.select2'));
			//register date fields event to show mini calendar on click of element
			app.registerEventForDatePickerFields(container);
			cb(container);
		}

		if (data) {
			showModalData(data)

		} else {
			jQuery.get(url).then(function(response){
				showModalData(response);
			});
		}

		return container;
	},

	/**
	 * Function which you can use to hide the modal
	 * This api assumes that we are using block ui plugin and uses unblock api to unblock it
	 */
	hideModalWindow : function(callback) {
		// Mimic bootstrap modal action body state change - helps to avoid body scroll
		// when modal is shown using css: http://stackoverflow.com/a/11013994
		jQuery('body').removeClass('modal-open');

		var id = 'globalmodal';
		var container = jQuery('#'+id);
		if (container.length <= 0) {
			return;
		}

		if(typeof callback != 'function') {
			callback = function() {};
		}
		jQuery.unblockUI({
			'onUnblock' : callback
		});
	},

	isHidden : function(element) {
		if(element.css('display')== 'none') {
			return true;
		}
		return false;
	},

	/**
	 * Default validation eninge options
	 */
	validationEngineOptions: {
		// Avoid scroll decision and let it scroll up page when form is too big
		// Reference: http://www.position-absolute.com/articles/jquery-form-validator-because-form-validation-is-a-mess/
		scroll: false,
		promptPosition: 'topLeft',
		//to support validation for chosen select box
		prettySelect : true,
		useSuffix: "_chzn",
        usePrefix : "s2id_"
	},

	/**
	 * Function to push down the error message size when validation is invoked
	 * @params : form Element
	 */
	formAlignmentAfterValidation : function(form){
		// to avoid hiding of error message under the fixed nav bar
		var formError = form.find(".formError:not('.greenPopup'):first")
		if(formError.length > 0){
			var destination = formError.offset().top;
			var resizedDestnation = destination-105;
			jQuery('html').animate({
				scrollTop:resizedDestnation
			}, 'slow');
		}
	},

	convertToDatePickerFormat: function(dateFormat){
		switch( dateFormat ) {
			case 'yyyy-mm-dd':	return 'Y-m-d';	break;
			case 'mm-dd-yyyy':	return 'm-d-Y';	break;
			case 'dd-mm-yyyy':	return 'd-m-Y';	break;
			case 'yyyy.mm.dd':	return 'Y.m.d';	break;
			case 'mm.dd.yyyy':	return 'm.d.Y';	break;
			case 'dd.mm.yyyy':	return 'd.m.Y';	break;
			case 'yyyy/mm/dd':	return 'Y/m/d';	break;
			case 'mm/dd/yyyy':	return 'm/d/Y';	break;
			case 'dd/mm/yyyy':	return 'd/m/Y';	break;
		}
	},

	convertTojQueryDatePickerFormat: function(dateFormat){
		var i = 0;
		var dotMode = '-';
		if( dateFormat.indexOf("-") != -1 ){ dotMode = '-'; }
		if( dateFormat.indexOf(".") != -1 ){ dotMode = '.'; }
		if( dateFormat.indexOf("/") != -1 ){ dotMode = '/'; }
		var splitDateFormat = dateFormat.split(dotMode);
		for(var i in splitDateFormat){
			var sectionDate = splitDateFormat[i];
			var sectionCount = sectionDate.length;
			if(sectionCount == 4){
				var strippedString = sectionDate.substring(0,2);
				splitDateFormat[i] = strippedString;
			}
		}
		var joinedDateFormat =  splitDateFormat.join(dotMode);
		return joinedDateFormat;
	},
	getDateInVtigerFormat: function(dateFormat,dateObject){
		var finalFormat = app.convertTojQueryDatePickerFormat(dateFormat);
		var date = jQuery.datepicker.formatDate(finalFormat,dateObject);
		return date;
	},

	registerEventForTextAreaFields : function(parentElement) {
		if(typeof parentElement == 'undefined') {
			parentElement = jQuery('body');
		}

		parentElement = jQuery(parentElement);

		if(parentElement.is('textarea')){
			var element = parentElement;
		}else{
			var element = jQuery('textarea', parentElement);
		}
		if(element.length == 0){
			return;
		}
		element.autosize();
	},

	registerEventForDatePickerFields : function(parentElement,registerForAddon,customParams){
		if(typeof parentElement == 'undefined') {
			parentElement = jQuery('body');
		}
		if(typeof registerForAddon == 'undefined'){
			registerForAddon = true;
		}

		parentElement = jQuery(parentElement);

		if(parentElement.hasClass('dateField')){
			var element = parentElement;
		}else{
			var element = jQuery('.dateField', parentElement);
		}
		if(element.length == 0){
			return;
		}
		if(registerForAddon == true){
			var parentDateElem = element.closest('.date');
			jQuery('.add-on',parentDateElem).on('click',function(e){
				var elem = jQuery(e.currentTarget);
				//Using focus api of DOM instead of jQuery because show api of datePicker is calling e.preventDefault
				//which is stopping from getting focus to input element
				elem.closest('.date').find('input.dateField').get(0).focus();
			});
		}
		var dateFormat = element.data('dateFormat');
		var vtigerDateFormat = app.convertToDatePickerFormat(dateFormat);
		var language = jQuery('body').data('language');
		var lang = language.split('_');
		
		//Default first day of the week
		var defaultFirstDay = jQuery('#start_day').val();
		if(defaultFirstDay == '' || typeof(defaultFirstDay) == 'undefined'){
			var convertedFirstDay = 1
		} else {
			convertedFirstDay = this.weekDaysArray[defaultFirstDay];
		}
		var params = {
			format : vtigerDateFormat,
			calendars: 1,
			locale: $.fn.datepicker.dates[lang[0]],
			starts: convertedFirstDay,
			eventName : 'focus',
			onChange: function(formated){
                var element = jQuery(this).data('datepicker').el;
                element = jQuery(element);
                var datePicker = jQuery('#'+ jQuery(this).data('datepicker').id);
                var viewDaysElement = datePicker.find('table.datepickerViewDays');
                //If it is in day mode and the prev value is not eqaul to current value
                //Second condition is manily useful in places where user navigates to other month
                if(viewDaysElement.length > 0 && element.val() != formated) {
                    element.DatePickerHide();
                    element.blur();
                }
				element.val(formated).trigger('change').focusout();
			},
			onBeforeShow: function(formated){
				element.each(function(index,domElement){
					var jQelement = jQuery(domElement);
					if (jQelement[0] != document.activeElement) {
						jQelement.DatePickerHide();
						jQelement.blur();
					}
				});
				
			},
		}
		if(typeof customParams != 'undefined'){
			var params = jQuery.extend(params,customParams);
		}
		element.each(function(index,domElement){
			var jQelement = jQuery(domElement);
			var dateObj = new Date();
			var selectedDate = app.getDateInVtigerFormat(dateFormat, dateObj);
			//Take the element value as current date or current date
			if(jQelement.val() != '') {
				selectedDate = jQelement.val();
			}
			params.date = selectedDate;
			params.current = selectedDate;
			jQelement.DatePicker(params)
		});

	},
	registerEventForDateFields : function(parentElement) {
		if(typeof parentElement == 'undefined') {
			parentElement = jQuery('body');
		}

		parentElement = jQuery(parentElement);

		if(parentElement.hasClass('dateField')){
			var element = parentElement;
		}else{
			var element = jQuery('.dateField', parentElement);
		}
		element.datepicker({'autoclose':true}).on('changeDate', function(ev){
			var currentElement = jQuery(ev.currentTarget);
			var dateFormat = currentElement.data('dateFormat');
			var finalFormat = app.getDateInVtigerFormat(dateFormat,ev.date);
			var date = jQuery.datepicker.formatDate(finalFormat,ev.date);
			currentElement.val(date);
		});
	},

	/**
	 * Function which will register time fields
	 *
	 * @params : container - jquery object which contains time fields with class timepicker-default or itself can be time field
	 *			 registerForAddon - boolean value to register the event for Addon or not
	 *			 params  - params for the  plugin
	 *
	 * @return : container to support chaining
	 */
	registerEventForTimeFields : function(container, registerForAddon, params) {

		if(typeof cotainer == 'undefined') {
			container = jQuery('body');
		}
		if(typeof registerForAddon == 'undefined'){
			registerForAddon = true;
		}

		container = jQuery(container);

		if(container.hasClass('timepicker-default')) {
			var element = container;
		}else{
			var element = container.find('.timepicker-default');
		}

		if(registerForAddon == true){
			var parentTimeElem = element.closest('.time');
			jQuery('.add-on',parentTimeElem).on('click',function(e){
				var elem = jQuery(e.currentTarget);
				elem.closest('.time').find('.timepicker-default').focus();
			});
		}

		if(typeof params == 'undefined') {
			params = {};
		}

		var timeFormat = element.data('format');
		if(timeFormat == '24') {
			timeFormat = 'H:i';
		} else {
			timeFormat = 'h:i A';
		}
		var defaultsTimePickerParams = {
			'timeFormat' : timeFormat,
			'className'  : 'timePicker'
		};
		var params = jQuery.extend(defaultsTimePickerParams, params);

		element.timepicker(params);

		return container;
	},

	/**
	 * Function to destroy time fields
	 */
	destroyTimeFields : function(container) {

		if(typeof cotainer == 'undefined') {
			container = jQuery('body');
		}

		if(container.hasClass('timepicker-default')) {
			var element = container;
		}else{
			var element = container.find('.timepicker-default');
		}
		element.data('timepicker-list',null);
		return container;
	},

	/**
	 * Function to get the chosen element from the raw select element
	 * @params: select element
	 * @return : chosenElement - corresponding chosen element
	 */
	getChosenElementFromSelect : function(selectElement) {
		var selectId = selectElement.attr('id');
		var chosenEleId = selectId+"_chzn";
		return jQuery('#'+chosenEleId);
	},

	/**
	 * Function to get the select2 element from the raw select element
	 * @params: select element
	 * @return : select2Element - corresponding select2 element
	 */
	getSelect2ElementFromSelect : function(selectElement) {
		var selectId = selectElement.attr('id');
		//since select2 will add s2id_ to the id of select element
		var select2EleId = "s2id_"+selectId;
		return jQuery('#'+select2EleId);
	},

	/**
	 * Function to get the select element from the chosen element
	 * @params: chosen element
	 * @return : selectElement - corresponding select element
	 */
	getSelectElementFromChosen : function(chosenElement) {
		var chosenId = chosenElement.attr('id');
		var selectEleIdArr = chosenId.split('_chzn');
		var selectEleId = selectEleIdArr['0'];
		return jQuery('#'+selectEleId);
	},

	/**
	 * Function to set with of the element to parent width
	 * @params : jQuery element for which the action to take place
	 */
	setInheritWidth : function(elements) {
		jQuery(elements).each(function(index,element){
			var parentWidth = jQuery(element).parent().width();
			jQuery(element).width(parentWidth);
		});
	},


	initGuiders: function (list) {
	},

	showScrollBar : function(element, options) {
		if(typeof options == 'undefined') {
			options = {};
		}
		if(typeof options.height == 'undefined') {
			options.height = element.css('height');
		}

		return element.slimScroll(options);
	},

	showHorizontalScrollBar : function(element, options) {
		if(typeof options == 'undefined') {
			options = {};
		}
		var params = {
			horizontalScroll: true,
			theme: "dark-thick",
			advanced: {
				autoExpandHorizontalScroll:true
			}
		}
		if(typeof options != 'undefined'){
			var params = jQuery.extend(params,options);
		}
		return element.mCustomScrollbar(params);
	},

	/**
	 * Function returns translated string
	 */
	vtranslate : function(key) {
		if(app.languageString[key] != undefined) {
			return app.languageString[key];
		} else {
			var strings = jQuery('#js_strings').text();
			if(strings != '') {
				app.languageString = JSON.parse(strings);
				if(key in app.languageString){
					return app.languageString[key];
				}
			}
		}
		return key;
	},

	/**
	 * Function which will set the contents height to window height
	 */
	setContentsHeight : function() {
		var borderTopWidth = parseInt(jQuery(".mainContainer").css('margin-top'))+21; // (footer height 21px)
		jQuery('.bodyContents').css('min-height',(jQuery(window).innerHeight()-borderTopWidth));
	},

	/**
	 * Function will return the current users layout + skin path
	 * @param <string> img - image name
	 * @return <string>
	 */
	vimage_path : function(img) {
		return jQuery('body').data('skinpath')+ '/images/' + img ;
	},

	/*
	 * Cache API on client-side
	 */
	cacheNSKey: function(key) { // Namespace in client-storage
		return 'vtiger6.' + key;
	},
	cacheGet: function(key, defvalue) {
		key = this.cacheNSKey(key);
		return jQuery.jStorage.get(key, defvalue);
	},
	cacheSet: function(key, value) {
		key = this.cacheNSKey(key);
		jQuery.jStorage.set(key, value);
	},
	cacheClear : function(key) {
		key = this.cacheNSKey(key);
		return jQuery.jStorage.deleteKey(key);
	},

	htmlEncode : function(value){
		if (value) {
			return jQuery('<div />').text(value).html();
		} else {
			return '';
		}
	},

	htmlDecode : function(value) {
		if (value) {
			return $('<div />').html(value).text();
		} else {
			return '';
		}
	},

	/**
	 * Function places an element at the center of the page
	 * @param <jQuery Element> element
	 */
	placeAtCenter : function(element) {
		element.css("position","absolute");
		element.css("top", ((jQuery(window).height() - element.outerHeight()) / 2) + jQuery(window).scrollTop() + "px");
		element.css("left", ((jQuery(window).width() - element.outerWidth()) / 2) + jQuery(window).scrollLeft() + "px");
	},

	getvalidationEngineOptions : function(select2Status){
		return app.validationEngineOptions;
	},

	/**
	 * Function to notify UI page ready after AJAX changes.
	 * This can help in re-registering the event handlers (which was done during ready event).
	 */
	notifyPostAjaxReady: function() {
		jQuery(document).trigger('postajaxready');
	},

	/**
	 * Listen to xready notiications.
	 */
	listenPostAjaxReady: function(callback) {
		jQuery(document).on('postajaxready', callback);
	},

	/**
	 * Form function handlers
	 */
	setFormValues: function(kv) {
		for (var k in kv) {
			jQuery(k).val(kv[k]);
		}
	},

	setRTEValues: function(kv) {
		for (var k in kv) {
			var rte = CKEDITOR.instances[k];
			if (rte) rte.setData(kv[k]);
		}
	},

	/**
	 * Function returns the javascript controller based on the current view
	 */
	getPageController : function() {
		var moduleName = app.getModuleName();
		var view = app.getViewName()
		var parentModule = app.getParentModuleName();

		var moduleClassName = parentModule+"_"+moduleName+"_"+view+"_Js";
		if(typeof window[moduleClassName] == 'undefined'){
			moduleClassName = parentModule+"_Vtiger_"+view+"_Js";
		}
		if(typeof window[moduleClassName] == 'undefined') {
			moduleClassName = moduleName+"_"+view+"_Js";
		}
		if(typeof window[moduleClassName] == 'undefined') {
			moduleClassName = "Vtiger_"+view+"_Js";
		}
        if(typeof window[moduleClassName] != 'undefined') {
			return new window[moduleClassName]();
		}
	},

	/**
	 * Function to decode the encoded htmlentities values
	 */
	getDecodedValue : function(value) {
		return jQuery('<div></div>').html(value).text();
	},

	/**
	 * Function to check whether the color is dark or light
	 */
	getColorContrast: function(hexcolor){
		var r = parseInt(hexcolor.substr(0,2),16);
		var g = parseInt(hexcolor.substr(2,2),16);
		var b = parseInt(hexcolor.substr(4,2),16);
		var yiq = ((r*299)+(g*587)+(b*114))/1000;
		return (yiq >= 128) ? 'light' : 'dark';
	},
    
    updateRowHeight : function() {
        var rowType = jQuery('#row_type').val();
        if(rowType.length <=0 ){
            //Need to update the row height
            var widthType = app.cacheGet('widthType', 'mediumWidthType');
            var serverWidth = widthType;
            switch(serverWidth) {
                case 'narrowWidthType' : serverWidth = 'narrow'; break;
                case 'wideWidthType' : serverWidth = 'wide'; break;
                default : serverWidth = 'medium';
            }
			var userid = jQuery('#current_user_id').val();
            var params = {
                'module' : 'Users',
                'action' : 'SaveAjax',
                'record' : userid,
                'value' : serverWidth,
                'field' : 'rowheight'
            };
            AppConnector.request(params).then(function(){
                jQuery(rowType).val(serverWidth);
            });
        }
    },
	
	getCookie : function(c_name) {
		var c_value = document.cookie;
		var c_start = c_value.indexOf(" " + c_name + "=");
		if (c_start == -1)
		  {
		  c_start = c_value.indexOf(c_name + "=");
		  }
		if (c_start == -1)
		  {
		  c_value = null;
		  }
		else
		  {
		  c_start = c_value.indexOf("=", c_start) + 1;
		  var c_end = c_value.indexOf(";", c_start);
		  if (c_end == -1)
			{
			c_end = c_value.length;
			}
		  c_value = unescape(c_value.substring(c_start,c_end));
		  }
		return c_value;
	},

	setCookie : function(c_name,value,exdays) {
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
		document.cookie=c_name + "=" + c_value;
	},
        
    getUrlVar : function(varName) {
        var getVar = function() {
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                vars[key] = value;
            });
            return vars;
        };

        return getVar()[varName];  
    },
    
    getStringDate: function(date) {
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var y = date.getFullYear();

        d = (d <= 9) ? ("0" + d) : d;
        m = (m <= 9) ? ("0" + m) : m;
        return y + "-" + m + "-" + d;
    },
	
	formatDate: function(date) {
		var y = date.getFullYear(),
			m = date.getMonth() + 1,
			d = date.getDate(),
			h = date.getHours(),
			i = date.getMinutes(),
			s = date.getSeconds();
		return y+'-'+this.formatDateZ(m)+'-'+this.formatDateZ(d)+' '+this.formatDateZ(h)+':'+this.formatDateZ(i)+':'+this.formatDateZ(s);
	},
	
    formatDateZ: function(i) {
        return (i <= 9 ? '0'+i : i);
    },
	
    saveAjax: function(mode, param) {
		var aDeferred = jQuery.Deferred();
		var params = {};
		params['module'] = app.getModuleName();
		params['parent'] = app.getParentModuleName();
		params['action'] = 'SaveAjax';
		params['mode'] = mode;
		params['param'] = param;
		AppConnector.request(params).then(
			function (data) {
				aDeferred.resolve(data);
			},
			function (error) {
				aDeferred.reject();
			}
		);
		return aDeferred.promise();
    },
	showBtnSwitch : function(selectElement, params) {
		if (typeof params == 'undefined') {
			params = {};
		}
		selectElement.bootstrapSwitch(params);
		return selectElement;
	},
}

jQuery(document).ready(function(){
	app.changeSelectElementView();

	//register all select2 Elements
	app.showSelect2ElementView(jQuery('body').find('select.select2'));
	app.showPopoverElementView(jQuery('body').find('.popoverTooltip'));
	app.showBtnSwitch(jQuery('body').find('.switchBtn'));
	app.setContentsHeight();
	
	//Updating row height
	app.updateRowHeight();
	
	jQuery(window).resize(function(){
		app.setContentsHeight();
	})

	String.prototype.toCamelCase = function(){
		var value = this.valueOf();
		return  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
	}

    // in IE resize option for textarea is not there, so we have to use .resizable() api
    if(jQuery.browser.msie || (/Trident/).test(navigator.userAgent)) {
        jQuery('textarea').resizable();
    }
    
	// Instantiate Page Controller
	var pageController = app.getPageController();
	if(pageController) pageController.registerEvents();
});

/* Global function for UI5 embed page to callback */
function resizeUI5IframeReset() {
	jQuery('#ui5frame').height(650);
}
function resizeUI5Iframe(newHeight) {
	jQuery('#ui5frame').height(parseInt(newHeight,10)+15); // +15px - resize on IE without scrollbars
}
