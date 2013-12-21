
/*  Dave's Flickr Machine
/* =============================== */

(function(w,d){

    'use strict';


    var _ = {},
        api_key = '5e0c3a5a074554ab8740d758e7384a3a',
        secret = '80e37ce5945edef8',
        RESTurl = 'http://api.flickr.com/services/rest/?api_key=' + api_key,
        elements = {},
        images = [];


    var settings = {
        photos_per_page: 40
    };


    var FlickrBot = function() {
        return FlickrBot;
    };

    
    // Initialise the twitter bot
    // 1. Cache all of the elements that make up the bot
    // 2. Add some event listeners for searching and paging etc
    // 3. Set status to READY
    _.init = function() {

        // Cache our elements
        elements.grid = _.select('.flickr-grid');
        elements.masthead = _.select('.flickr-masthead');
        elements.lightbox = _.select('#lightbox');
        elements.searchfield = _.select('.flickr-search');

        // Listen for lightbox clicks ( closes the lightbox )
        _.listen( elements.lightbox, 'click', function(e) {
            elements.lightbox.className = '';
        });

        // Listen for search input
        _.listen( elements.searchfield, 'keydown', function(e) {
            e.which = e.which || e.keyCode;
            if( e.which == 13 ) {
                _.search( elements.searchfield.value );
            }
        });

        return FlickrBot;
    };


    // Basic ajax GET function.  @TODO: use a promise here rather than 
    // a simple callback
    _.get = function(url, callback) {
    
        var xhr = new XMLHttpRequest();
        
        function checkStatus() {

            // checkStatus was called, but the request isn't complete yet
            if (xhr.readyState < 4) {
                return;
            }
            
            // Error code recieved from the server
            if (xhr.status !== 200) {
                console.log('The request was made, but it was not good.');
                return;
            }

            // Request is good, lets do this
            if (xhr.readyState === 4) {
                callback(xhr);
            }           
        }

        xhr.onreadystatechange = checkStatus;
        xhr.open('GET', url, true);
        xhr.send('');
    };


    _.search = function(keywords, page) {

        // If the grid already contains image elements, reset their 
        // src attribute so we can see the loading state.
        if ( images.length !== 0 ) {
            for ( var i = 0, l = images.length; i < l; i++ ) {
                images[i].src = 'assets/img/trans.png';
            }
        }

        if ( typeof page === "undefined" ) {
            page = 1;
        }

        var method = 'flickr.photos.search';        

        _.get( RESTurl + '&method=' + method + '&tags=' + keywords + '&page=' + page + '&format=json&nojsoncallback=1&per_page=80', function(res){      
            
            var response = JSON.parse( res.response ),
                photos = response.photos.photo;

            for ( var i = 0; i < photos.length; i++ ) {

                // URL format deets can be found here: http://www.flickr.com/services/api/misc.urls.html
                var url = 'http://farm' + photos[i].farm + '.staticflickr.com/' + photos[i].server + '/' + photos[i].id + '_' + photos[i].secret + '_';

                if ( typeof images[i] === 'undefined' ) {
                    // Create a new image element, give it a source ( thumbnail type ),
                    // give it a data attribute of the fullsize image source and then
                    // add a 'loading' class.
                    images[i] = new Image();
                    images[i].src = url + ( i === 0 ? 'q' : 'q' ) + '.jpg';
                    images[i].dataset.lightbox = url + 'b.jpg';
                    images[i].className = 'loading';

                    // Create a div element we can use to wrap the image, for layout 
                    // purposes
                    var griditem = d.createElement('div');
                    griditem.className = 'item';
                    griditem.appendChild(images[i]);
                    elements.grid.appendChild(griditem);

                    // Because we are creating new image elements, we need to add a 
                    // click listener to each one to fire off the lightbox.
                    _.listen( images[i], 'click', function(e) {
                        var img = new Image();
                        img.src = this.dataset.lightbox;
                        img.className = 'lightbox';

                        elements.lightbox.innerHTML = '';
                        elements.lightbox.appendChild(img);
                        elements.lightbox.className = 'visible';
                    });
                } else {
                    // No need to create new image elements, so just update the source
                    images[i].src = url + ( i === 0 ? 'q' : 'q' ) + '.jpg';
                    images[i].dataset.lightbox = url + 'b.jpg';
                    images[i].className = 'loading';
                }
                
            }

            return FlickrBot;
        });

    };


    _.buildGrid = function() {

    };


    _.extend = function(obj, ext) {
        for ( var prop in ext ) {
            obj[prop] = (obj.hasOwnProperty(prop)) ? obj[prop] : ext[prop];
        }
        return obj;
    };


    // Helper function to jump between pages ( can either be a string e.g. UP or DOWN )
    // or it could be a number referencing a specific page. 
    _.page = function( page ) {
        
        switch ( typeof page ) { 

            case 'string':
                break;

            case 'number':
                break;

            default:
                break;

        }
    };


    // document.querySelector is supported in IE8, so we're going to jolly well use that.
    // Bit of string checking used so we can have a similiar selector syntax to the likes of
    // Zepto or JQuery
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
    };


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


    // Expose public methods
    FlickrBot.init = _.init;
    FlickrBot.search = _.search;
    FlickrBot.page = _.page;
    FlickrBot.get = _.get;

    w.FlickrBot = FlickrBot;

})(window, document);

window.onload = function() {
    FlickrBot.init().search( 'coheed', 3 );
};