/*
 * jDigiClock plugin 2.1
 *
 * http://www.radoslavdimov.com/jquery-plugins/jquery-plugin-digiclock/
 *
 * Copyright (c) 2009 Radoslav Dimov
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */


(function($) {
    $.fn.extend({
        jdigiclock: function(options) {

            var defaults = {
                clockImagesPath:   'images/clock/',
                weatherImagesPath: 'images/weather/',
                lang: 'en',
                am_pm: false,
                weatherLocationCode: 'EUR|BG|BU002|BOURGAS',
                weatherMetric: 'C',
                weatherUpdate: 0,
                proxyType: 'yahoo'
                
            };

            var regional = [];
            regional['en'] = {
                monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            };
            regional['de'] = {
                monthNames: ['Jan', 'Feb', 'M&auml;r', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
                dayNames: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
            };


            var options = $.extend(defaults, options);
            var i = options.weatherLocationCode.indexOf('[');
            if (i != -1) {
                options.weatherLocationCode = options.weatherLocationCode.substring(i+1);
                i = options.weatherLocationCode.indexOf(']');
                options.weatherLocationCode = options.weatherLocationCode.substring(0, i);
            }

            return this.each(function() {
                
                var $this = $(this);
                var o = options;
                $this.clockImagesPath = o.clockImagesPath;
                $this.weatherImagesPath = o.weatherImagesPath;
                $this.lang = regional[o.lang] == undefined ? regional['en'] : regional[o.lang];
				$this.lang.lang = o.lang;
                $this.am_pm = o.am_pm;
                $this.weatherLocationCode = o.weatherLocationCode;
                $this.weatherMetric = o.weatherMetric == 'C' ? 1 : 0;
                $this.weatherUpdate = o.weatherUpdate;
                $this.proxyType = o.proxyType;
                $this.currDate = '';
                $this.timeUpdate = '';


                var html = '<div id="plugin_container">';
                html    += '<p id="left_arrow"><img src="'+o.clockImagesPath+'../icon_left.png" /></p>';
                html    += '<p id="right_arrow"><img src="'+o.clockImagesPath+'../icon_right.png" /></p>';
                html    += '<div id="digital_container">';
                html    += '<div id="clock"></div>';
                html    += '<div id="weather"></div>';
                html    += '</div>';
                html    += '<div id="forecast_container"></div>';
                html    += '</div>';

                $this.html(html);

                $this.displayClock($this);

                $this.displayWeather($this);               

                var panel_pos = ($('#plugin_container > div').length - 1) * 500;
                var next = function() {
                    //$('#right_arrow').unbind('click', next);
                    $('#plugin_container > div').filter(function(i) {
                        $(this).animate({'left': (i * 500) - 500 + 'px'}, 400, function() {
                            if (i == 0) {
                                $(this).appendTo('#plugin_container').css({'left':panel_pos + 'px'});
                            }
                            //$('#right_arrow').bind('click', next);
                        });                        
                    });
                };
                $('#right_arrow').bind('click', next);

                var prev = function() {
                    //$('#left_arrow').unbind('click', prev);
                    $('#plugin_container > div:last').prependTo('#plugin_container').css({'left':'-500px'});
                    $('#plugin_container > div').filter(function(i) {
                        $(this).animate({'left': i * 500 + 'px'}, 400, function() {
                            //$('#left_arrow').bind('click', prev);
                        });
                    });
                };
                $('#left_arrow').bind('click', prev);

            });
        }
    });  

    $.fn.displayClock = function(el) {
        $.fn.getTime(el);
        setTimeout(function() {$.fn.displayClock(el)}, $.fn.delay());
    }

    $.fn.displayWeather = function(el) {
        $.fn.getWeather(el);
        if (el.weatherUpdate > 0) {
            setTimeout(function() {$.fn.displayWeather(el)}, (el.weatherUpdate * 60 * 1000));
        }
    }

    $.fn.delay = function() {
        var now = new Date();
        var delay = (60 - now.getSeconds()) * 1000;
        
        return delay;
    }

    $.fn.getTime = function(el) {
        var now = new Date();
        var old = new Date();
        old.setTime(now.getTime() - 60000);
        
        var now_hours, now_minutes, old_hours, old_minutes, timeOld = '';
        now_hours =  now.getHours();
        now_minutes = now.getMinutes();
        old_hours =  old.getHours();
        old_minutes = old.getMinutes();

        if (el.am_pm) {
            var am_pm = now_hours > 11 ? 'pm' : 'am';
            now_hours = ((now_hours > 12) ? now_hours - 12 : now_hours);
            old_hours = ((old_hours > 12) ? old_hours - 12 : old_hours);
        } 

        now_hours   = ((now_hours <  10) ? "0" : "") + now_hours;
        now_minutes = ((now_minutes <  10) ? "0" : "") + now_minutes;
        old_hours   = ((old_hours <  10) ? "0" : "") + old_hours;
        old_minutes = ((old_minutes <  10) ? "0" : "") + old_minutes;
        // date
        el.currDate = el.lang.dayNames[now.getDay()] + ',&nbsp;' + now.getDate() + '&nbsp;' + el.lang.monthNames[now.getMonth()];
        // time update
        el.timeUpdate = el.currDate + ',&nbsp;' + now_hours + ':' + now_minutes;

        var firstHourDigit = old_hours.substr(0,1);
        var secondHourDigit = old_hours.substr(1,1);
        var firstMinuteDigit = old_minutes.substr(0,1);
        var secondMinuteDigit = old_minutes.substr(1,1);
        
        timeOld += '<div id="hours"><div class="line"></div>';
        timeOld += '<div id="hours_bg"><img src="' + el.clockImagesPath + 'clockbg1.png" /></div>';
        timeOld += '<img src="' + el.clockImagesPath + firstHourDigit + '.png" id="fhd" class="first_digit" />';
        timeOld += '<img src="' + el.clockImagesPath + secondHourDigit + '.png" id="shd" class="second_digit" />';
        timeOld += '</div>';
        timeOld += '<div id="minutes"><div class="line"></div>';
        if (el.am_pm) {
            timeOld += '<div id="am_pm"><img src="' + el.clockImagesPath + am_pm + '.png" /></div>';
        }
        timeOld += '<div id="minutes_bg"><img src="' + el.clockImagesPath + 'clockbg1.png" /></div>';
        timeOld += '<img src="' + el.clockImagesPath + firstMinuteDigit + '.png" id="fmd" class="first_digit" />';
        timeOld += '<img src="' + el.clockImagesPath + secondMinuteDigit + '.png" id="smd" class="second_digit" />';
        timeOld += '</div>';

        el.find('#clock').html(timeOld);

        // set minutes
        if (secondMinuteDigit != '9') {
            firstMinuteDigit = firstMinuteDigit + '1';
        }

        if (old_minutes == '59') {
            firstMinuteDigit = '511';
        }

        setTimeout(function() {
            $('#fmd').attr('src', el.clockImagesPath + firstMinuteDigit + '-1.png');
            $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg2.png');
        },200);
        setTimeout(function() { $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg3.png')},250);
        setTimeout(function() {
            $('#fmd').attr('src', el.clockImagesPath + firstMinuteDigit + '-2.png');
            $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg4.png');
        },400);
        setTimeout(function() { $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg5.png')},450);
        setTimeout(function() {
            $('#fmd').attr('src', el.clockImagesPath + firstMinuteDigit + '-3.png');
            $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg6.png');
        },600);

        setTimeout(function() {
            $('#smd').attr('src', el.clockImagesPath + secondMinuteDigit + '-1.png');
            $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg2.png');
        },200);
        setTimeout(function() { $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg3.png')},250);
        setTimeout(function() {
            $('#smd').attr('src', el.clockImagesPath + secondMinuteDigit + '-2.png');
            $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg4.png');
        },400);
        setTimeout(function() { $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg5.png')},450);
        setTimeout(function() {
            $('#smd').attr('src', el.clockImagesPath + secondMinuteDigit + '-3.png');
            $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg6.png');
        },600);

        setTimeout(function() {$('#fmd').attr('src', el.clockImagesPath + now_minutes.substr(0,1) + '.png')},800);
        setTimeout(function() {$('#smd').attr('src', el.clockImagesPath + now_minutes.substr(1,1) + '.png')},800);
        setTimeout(function() { $('#minutes_bg img').attr('src', el.clockImagesPath + 'clockbg1.png')},850);

        // set hours
        if (now_minutes == '00') {
           
            if (el.am_pm) {
                if (now_hours == '00') {                   
                    firstHourDigit = firstHourDigit + '1';
                    now_hours = '12';
                } else if (now_hours == '01') {
                    firstHourDigit = '001';
                    secondHourDigit = '111';
                } else {
                    firstHourDigit = firstHourDigit + '1';
                }
            } else {
                if (now_hours != '10') {
                    firstHourDigit = firstHourDigit + '1';
                }

                if (now_hours == '20') {
                    firstHourDigit = '1';
                }

                if (now_hours == '00') {
                    firstHourDigit = firstHourDigit + '1';
                    secondHourDigit = secondHourDigit + '11';
                }
            }

            setTimeout(function() {
                $('#fhd').attr('src', el.clockImagesPath + firstHourDigit + '-1.png');
                $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg2.png');
            },200);
            setTimeout(function() { $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg3.png')},250);
            setTimeout(function() {
                $('#fhd').attr('src', el.clockImagesPath + firstHourDigit + '-2.png');
                $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg4.png');
            },400);
            setTimeout(function() { $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg5.png')},450);
            setTimeout(function() {
                $('#fhd').attr('src', el.clockImagesPath + firstHourDigit + '-3.png');
                $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg6.png');
            },600);

            setTimeout(function() {
            $('#shd').attr('src', el.clockImagesPath + secondHourDigit + '-1.png');
            $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg2.png');
            },200);
            setTimeout(function() { $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg3.png')},250);
            setTimeout(function() {
                $('#shd').attr('src', el.clockImagesPath + secondHourDigit + '-2.png');
                $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg4.png');
            },400);
            setTimeout(function() { $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg5.png')},450);
            setTimeout(function() {
                $('#shd').attr('src', el.clockImagesPath + secondHourDigit + '-3.png');
                $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg6.png');
            },600);

            setTimeout(function() {$('#fhd').attr('src', el.clockImagesPath + now_hours.substr(0,1) + '.png')},800);
            setTimeout(function() {$('#shd').attr('src', el.clockImagesPath + now_hours.substr(1,1) + '.png')},800);
            setTimeout(function() { $('#hours_bg img').attr('src', el.clockImagesPath + 'clockbg1.png')},850);
        }
    }

	$.fn.processAnswer = function(el, data) {
        var metric = el.weatherMetric == 1 ? 'C' : 'F';
		
		el.find('#weather .loading, #forecast_container .loading').hide();

		var curr_temp = '<p class="temp">' + data.curr_temp + '&deg;<span class="metric">' + metric + '</span></p>';

		if (data.curr_icon.indexOf("http://") == -1)
			el.find('#weather').css('background','url(' + el.weatherImagesPath + data.curr_icon + '.png) 50% 100% no-repeat');
		else
			el.find('#weather').css('background','url('+ data.curr_icon + ') 50% 100% no-repeat');
		var weather = '<div id="local"><p class="city">' + data.city + '</p><p>' + data.curr_text + '</p></div>';
		weather += '<div id="temp"><p id="date">' + el.currDate + '</p>' + curr_temp + '</div>';
		el.find('#weather').html(weather);

		// forecast
		el.find('#forecast_container').append('<div id="current"></div>');
		var curr_for = curr_temp + '<p class="high_low">' + data.forecast[0].day_htemp + '&deg;&nbsp;/&nbsp;' + data.forecast[0].day_ltemp + '&deg;</p>';
		curr_for    += '<p class="city">' + data.city + '</p>';
		curr_for    += '<p class="text">' + data.forecast[0].day_text + '</p>';
		
		if (data.forecast[0].day_icon.indexOf("http://") == -1)
			el.find('#current').css('background','url(' + el.weatherImagesPath + data.forecast[0].day_icon + '.png) 50% 0 no-repeat').append(curr_for);
		else
			el.find('#current').css('background','url('+data.forecast[0].day_icon + ') 100% 0 no-repeat').css('background-size', '100% auto').append(curr_for);

		el.find('#forecast_container').append('<ul id="forecast"></ul>');
		data.forecast.shift();
		for (var i in data.forecast) {
			var d_date = new Date(data.forecast[i].day_date);
			var day_name = el.lang.dayNames[d_date.getDay()];
			var forecast = '<li>';
			forecast    += '<p>' + day_name + '</p>';
			forecast    += '<img src="';
			
			if (data.forecast[i].day_icon.indexOf("http://") == -1)
				forecast += el.weatherImagesPath + data.forecast[i].day_icon + '.png';
			else
				forecast += data.forecast[i].day_icon;
				
			forecast    += '" alt="' + data.forecast[i].day_text + '" title="' + data.forecast[i].day_text + '" />';
			forecast    += '<p>' + data.forecast[i].day_htemp + '&deg;&nbsp;/&nbsp;' + data.forecast[i].day_ltemp + '&deg;</p>';
			forecast    += '</li>';
			el.find('#forecast').append(forecast);
		}

		el.find('#forecast_container').append('<div id="update"><img src="'+el.clockImagesPath+'../refresh_01.png" alt="reload" title="reload" id="reload" />' + el.timeUpdate + '</div>');

		$('#reload').click(function() {
			el.find('#weather').html('');
			el.find('#forecast_container').html('');
			$.fn.getWeather(el);
		});
	}
	
	// Get time string as date
	$.fn._getTimeAsDate = function(t) {

		d = new Date();
		r = new Date(d.toDateString() +' '+ t);

		return r;
	};	
    $.fn.getWeather = function(el) {

        el.find('#weather').html('<p class="loading">Update Weather ...</p>');
        el.find('#forecast_container').html('<p class="loading">Update Weather ...</p>');
        var proxy = '';

			
        switch (el.proxyType) {
            case 'php':
                proxy = 'php/proxy.php';
                $.getJSON('lib/proxy/' + proxy + '?location=' + el.weatherLocationCode + '&metric=' + el.weatherMetric, function (data) {$.fn.processAnswer (el, data);});
				break;
            case 'asp':
                proxy = 'asp/WeatherProxy.aspx';
                $.getJSON('lib/proxy/' + proxy + '?location=' + el.weatherLocationCode + '&metric=' + el.weatherMetric, function (data) {$.fn.processAnswer (el, data);});
				break;
			case 'yahoo':
				var now = new Date();
			// Create Yahoo Weather feed API address
				var query = "select * from weather.forecast where woeid in ('"+ el.weatherLocationCode +"') and u='"+ (el.weatherMetric ? 'c' : 'f') +"'";
				var api = 'http://query.yahooapis.com/v1/public/yql?q='+ encodeURIComponent(query) +'&rnd='+ now.getFullYear() + now.getMonth() + now.getDay() + now.getHours() +'&format=json&callback=?';
				
				// Send request
				$.ajax({
					type: 'GET',
					url: api,
					dataType: 'json',
					context: el,
					success: function(data) {
						if (data.query) {
							var modData = {};
							var feed = data.query.results.channel;
                            if (feed.item.forecast === undefined) {
                                return;
                            }
							var wf = feed.item.forecast[0];
							// Determine day or night image
							wpd = feed.item.pubDate;
							n = wpd.indexOf(":");
							tpb =  $.fn._getTimeAsDate(wpd.substr(n-2,8));
							tsr =  $.fn._getTimeAsDate(feed.astronomy.sunrise);
							tss =  $.fn._getTimeAsDate(feed.astronomy.sunset);

							// Get night or day
							if (tpb>tsr && tpb<tss) { daynight = 'day'; } else { daynight = 'night'; }
									// Translation function
									
							var _tt = []; {
							_tt[0]    = {'en':'Tornado', 'de': 'Sitze Zuhause:)'};
							_tt[1]    = {'en':'Tropical storm', 'de': 'Tropischer Sturm'};
							_tt[2]    = {'en':'Hurricane', 'de': 'Hurrikan'};
							_tt[3]    = {'en':'Severe thunderstorms', 'de': 'Heftiges Gewitter'};
							_tt[4]    = {'en':'Thunderstorms', 'de': 'Gewitter'};
							_tt[5]    = {'en':'Mixed rain and snow', 'de' : 'Regen mit Schnee'};
							_tt[6]    = {'en':'Mixed rain and sleet', 'de' : 'Regen mit Graupel'};
							_tt[7]    = {'en':'Mixed snow and sleet', 'de' : 'Schnee mit Graupel'};
							_tt[8]    = {'en':'Freezing drizzle', 'de' : 'Eisnieselregen'};
							_tt[9]    = {'en':'Drizzle', 'de' : 'Nieselregen'};
							_tt[10]   = {'en':'Freezing rain', 'de': 'Eisregen'};
							_tt[11]   = {'en':'Showers', 'de': 'Regenschauer'};
							_tt[12]   = {'en':'Showers', 'de': 'Regenschauer'};
							_tt[13]   = {'en':'Snow flurries', 'de': 'Schneetreiben'};
							_tt[14]   = {'en':'Light snow showers', 'de': 'Leichter Regen mit Schnee'};
							_tt[15]   = {'en':'Bowing snow', 'de': 'Schnee'};
							_tt[16]   = {'en':'Snow', 'de': 'Schnee'};
							_tt[17]   = {'en':'Hail', 'de': 'Hagel'};
							_tt[18]   = {'en':'Sleet', 'de': 'Graupel'};
							_tt[19]   = {'en':'Dust', 'de':'Staubig'};
							_tt[20]   = {'en':'Foggy', 'de':'Neblig'};
							_tt[21]   = {'en':'Haze', 'de':'Nebel'};
							_tt[22]   = {'en':'Smoky', 'de':'Qualmig'};
							_tt[23]   = {'en':'Blustery', 'de':'St&uuml;rmisch'};
							_tt[24]   = {'en':'Windy', 'de':'Windig'};
							_tt[25]   = {'en':'Cold', 'de':'Kalt'};
							_tt[26]   = {'en':'Cloudy', 'de':'W&ouml;lkig'};
							_tt[27]   = {'en':'Mostly cloudy (night)', 'de':'&Uuml;berwiegend w&ouml;lkig'};
							_tt[28]   = {'en':'Mostly cloudy (day)', 'de':'&Uuml;berwiegend w&ouml;lkig'};
							_tt[29]   = {'en':'partly cloudy (night)', 'de':'Teilweise wolkig'};
							_tt[30]   = {'en':'partly cloudy (day)', 'de':'Meistens sonnig'};
							_tt[31]   = {'en':'clear (night)', 'de':'Klar'};
							_tt[32]   = {'en':'sunny', 'de':'Sonnig'};
							_tt[33]   = {'en':'fair (night)', 'de': 'Sch&ouml;nwetter'};
							_tt[34]   = {'en':'fair (day)', 'de': 'Sch&ouml;nwetter'};
							_tt[35]   = {'en':'mixed rain and hail', 'de': 'Regen mit Hagel'};
							_tt[36]   = {'en':'hot', 'de': 'Warm'};
							_tt[37]   = {'en':'isolated thunderstorms', 'de': 'Vereinzeltes Gewitter'};
							_tt[38]   = {'en':'scattered thunderstorms', 'de': 'Verstreutes Gewitter'};
							_tt[39]   = {'en':'scattered thunderstorms', 'de': 'Verstreutes Gewitter'};
							_tt[40]   = {'en':'scattered showers', 'de': 'Verstreuter Regen'};
							_tt[41]   = {'en':'heavy snow', 'de':'Starker Schneefall'};
							_tt[42]   = {'en':'scattered snow showers', 'de': 'Verstreuter Schneeregen'};
							_tt[43]   = {'en':'heavy snow', 'de':'Starker Schneefall'};
							_tt[44]   = {'en':'partly cloudy', 'de':'Teilweise wolkig'};
							_tt[45]   = {'en':'thundershowers', 'de':'Gewitterschauer'};
							_tt[46]   = {'en':'snow showers', 'de': 'Schneeregen'};
							_tt[47]   = {'en':'isolated thundershowers', 'de': 'Vereinzelter Gewitterschauer'};
							_tt[3200] = {'en':'not available',  'de': ''};	
							};
							
							modData['city']      = feed.location.city;
							modData['curr_text'] = _tt[feed.item.condition.code][el.lang.lang];
							modData['curr_temp'] = feed.item.condition.temp;
							modData['curr_icon'] = 'http://l.yimg.com/a/i/us/nws/weather/gr/'+ feed.item.condition.code + daynight.substring(0,1) +'.png';
							modData['forecast']    = [];
							for (var i = 0; i < feed.item.forecast.length; i++)
							{
								modData['forecast'][i] = {};
								modData['forecast'][i]['day_htemp'] = feed.item.forecast[i].high;
								modData['forecast'][i]['day_ltemp'] = feed.item.forecast[i].low;
								modData['forecast'][i]['day_text']  = _tt[ feed.item.forecast[i].code][el.lang.lang];//feed.item.forecast[i].text;
								modData['forecast'][i]['day_icon']  = 'http://l.yimg.com/a/i/us/nws/weather/gr/'+ feed.item.forecast[i].code + daynight.substring(0,1) +'.png';
								modData['forecast'][i]['day_date']  = feed.item.forecast[i].date;
							}
							
							$.fn.processAnswer (el, modData);
						} 
						else {
							//if (options.showerror) $e.html('<p>Weather information unavailable</p>');
						}
					},
					error: function(data) {
						//if (options.showerror) $e.html('<p>Weather request failed</p>');
					}
				});
            break;
        }
    }
	
    $.fn.extend({
        jweatherCity: function(options) {
            var defaults = {
                lang:         'en',
                currentValue: null,
				onselect:     null,
				onselectArg:  null,
                proxyType:   'yahoo'   // Actually unused             
            };		
            var options = $.extend(defaults, options);
            return this.each(function() {
                
                var $this = $(this);
                var o = options;
				$this._showCitySelector ($this, o.currentValue, (o.lang== 'de') ? 'Stadt:' : 'City:', o.onselect, o.onselectArg);
			});
		}
	});
	
	$.fn._weatherGeocode = function (search, outputId, onselect, onselectArg) {

		// Set document elements
		var output = document.getElementById(outputId);

		if (search) {
			$(output).empty();

			// Cache results for an hour to prevent overuse
			now = new Date();

			// Create Yahoo Weather feed API address
			var query = 'select * from geo.places where text="'+ search +'"';
			var api = 'http://query.yahooapis.com/v1/public/yql?q='+ encodeURIComponent(query) +'&rnd='+ now.getFullYear() + now.getMonth() + now.getDay() + now.getHours() +'&format=json&callback=?';

			// Send request
			$.ajax({
				type: 'GET',
				url: api,
				dataType: 'json',
				success: function(data) {

					if (data.query.count > 0 ) {						

						var html = '<select id="weatherAddress">';

						// List multiple returns
						if (data.query.count > 1) {
							for (var i=0; i<data.query.count; i++) {
								html += '<option value="'+ data.query.results.place[i].woeid +'">' + $.fn._getWeatherAddress(data.query.results.place[i]) +'</option>';
							}
						} else {
							html += '<option value="'+ data.query.results.place.woeid +'" >'+ $.fn._getWeatherAddress(data.query.results.place) +'</option>';
						}
  	
						html += '</select>';

						$(output).html (html);

						// Bind callback links
						$("#weatherAddress").unbind('change').change(function(e) {
							if (this.options.selectedIndex >= 0 && onselect)
								onselect (this.options[this.options.selectedIndex].value, this.options[this.options.selectedIndex].text, onselectArg);
						}).trigger('change'); 
					} else {
						$(output).html ('The location could not be found');
					}
				},
				error: function(data) {
					$(output).html ('An error has occurred');
				}
			});

		} else {

			// No search given
			$(output).html ('Please enter a location or partial address');
		}
	}

	$.fn._getWeatherAddress = function (data) {

		// Get address
		var address = data.name;
		if (data.admin2) address += ',\n' + data.admin2.content;
		if (data.admin1) address += ',\n' + data.admin1.content;
		address += ',\n' + data.country.content;

		// Get WEOID
		var woeid = data.woeid;

		return address + '\n['+ woeid +']';
	}
	
	$.fn._showCitySelector = function (elemParent, curSelection, selectText, onselect, onselectArg) {
		if (elemParent == null || elemParent === undefined)
			elemParent = $('body');
		var html = "<table><tr><td>";
		html += (selectText == null) ? "Select:" : selectText;
		html += '<input type="text" id="weatherLocation" name="weatherLocation" size="33" value="'+((curSelection != null) ? curSelection : "")+'"/>';
		html += '<input id="weatherLocationBtn" type="submit" name="submit" value="..." /></td></tr>';
		html += '<tr><td id="weatherList"></td></tr>';
		elemParent.html(html);
		$('#weatherLocationBtn').click( function(e) {
			e.preventDefault();
			$.fn._weatherGeocode(document.getElementById('weatherLocation').value, 'weatherList', onselect, onselectArg);
		});

	}
	
})(jQuery);