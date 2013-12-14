
/*  Dave's Flickr Machine
/* =============================== */

(function(w,d){

    'use strict'

    var _ = {},
        api_key = "5e0c3a5a074554ab8740d758e7384a3a",
        secret = "80e37ce5945edef8",
        RESTurl = 'http://api.flickr.com/services/rest/?api_key=' + api_key;

    /* Public methods
    /* =============================== */
    _.get = function( url, callback ) {
        var xhr;
    
        if (typeof XMLHttpRequest !== 'undefined') {
            xhr = new XMLHttpRequest();
        }
        
        xhr.onreadystatechange = ensureReadiness;
        
        function ensureReadiness() {
            if(xhr.readyState < 4) {
                return;
            }
            
            if(xhr.status !== 200) {
                return;
            }

            // all is well  
            if(xhr.readyState === 4) {
                callback(xhr);
            }           
        }
        
        xhr.open('GET', url, true);
        xhr.send('');
    }

    _.search = function( keywords, page ) {

        var method = 'flickr.photos.search';
        
        if ( typeof page === "undefined" ) {
            var page = 1;
        }

        _.get( RESTurl + '&method=' + method + '&tags=' + keywords + '&page=' + page + '&format=json&nojsoncallback=1', function(xhr){      
            
            var response = JSON.parse( xhr.response );            
            console.log( response.photos.photo );

            var photos = response.photos.photo,
                images = [];

            for ( var i = 0; i < photos.length; i++ ) {
                images[i] = new Image();
                images[i].src = 'http://farm' + photos[i].farm + '.staticflickr.com/' + photos[i].server + '/' + photos[i].id + '_' + photos[i].secret + '.jpg';
                document.body.appendChild( images[i] );
            }

            return response;
        });

    }

    _.page = function( num ) {

    }

    // Private methods
    _.select = function( target ) {
        if (typeof target === 'string') {
            if (target.indexOf('#') !== -1) {
                return d.getElementById(target.split('#')[1]);
            } else if (target.indexOf('.') !== -1) {
                var arr = d.querySelectorAll(target);
                return (arr.length >= 1) ? arr[0] : null;
            }
        } else if ('nodeType' in target && target.nodeType === 3) {
            return target;
        } else {
            return null;
        }
    }

    _.buildElement = function() {

    }

    // Adds an event listener - returns the appropriate function depending 
    // on whether it supports addEventListener ( or if it's IE )
    _.listen = (function() {
        if (w.addEventListener) {
            return function(el, ev, fn) {
                el.addEventListener(ev, fn, false);
            };
        } else if (w.attachEvent) {
            return function(el, ev, fn) {
                w.attachEvent('on' + ev, fn, false);
            };
        }
    })();

    var FlickrBot = function() {
        return FlickrBot;
    }

    // Expose public methods
    FlickrBot.search = _.search;
    FlickrBot.page = _.page;
    FlickrBot.get = _.get;

    w.FlickrBot = FlickrBot;

})(window, document);


window.onload = function() {
    FlickrBot.search('dachshund, dappled', function(response) {
        console.log( response );
    });
}