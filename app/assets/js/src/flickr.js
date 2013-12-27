
/*  Dave's Flickr Machine
/* =============================== */

(function(w,d){

    'use strict';

    var _ = {},
        queries = {},
        elements = {},
        images = [];

    // Caching our API credentials for ease.
    var api_key = '5e0c3a5a074554ab8740d758e7384a3a',
        secret = '80e37ce5945edef8',
        RESTurl = 'http://api.flickr.com/services/rest/?api_key=' + api_key;

    // Global settings for the flickr bot, overridable via parameters
    // fed to the init function
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
    _.init = function(opts) {

        settings = _.extend(settings, opts);

        // Cache our elements
        elements.grid = _.select('.flickr-grid');
        elements.masthead = _.select('.flickr-masthead');
        elements.lightbox = _.select('#flickr-lightbox');
        elements.searchfield = _.select('.flickr-search');
        elements.loadingbar = _.select('.flickr-loading-bar');

        // Listen for lightbox clicks ( closes the lightbox )
        _.listen( elements.lightbox, 'click', function(e) {
            elements.lightbox.className = '';
        });

        // Listen for search input
        _.listen( elements.searchfield, 'keydown', function(e) {
            e.which = e.which || e.keyCode;
            if ( e.which == 13 ) {
                _.search( e.target.value );
            }
        });

        _.buildGrid();

        return FlickrBot;
    };


    // Simple extend function - iterates through all the properties of the second
    // argument object and adds them / overwrites them on the first argument
    _.extend = function(obj, ext) {

        for (var prop in ext) {
            obj[prop] = (obj.hasOwnProperty(prop)) ? obj[prop] : ext[prop];
        }
        
        return obj;

    };


    // Basic ajax GET function.  @TODO: use a promise here rather than 
    // a simple callback
    _.get = function(url, callback) {
    
        var xhr = new XMLHttpRequest();
        // elements.loadingbar.className = 'show';

        function checkStatus() {

            switch ( xhr.readyState ) {
                case 1:
                    elements.loadingbar.style.width = '25%';
                    return;
                    break;

                case 2:
                    elements.loadingbar.style.width = '50%';
                    return;
                    break;

                case 3:
                    elements.loadingbar.style.width = '75%';
                    return;
                    break;

                // Request is good, lets do this
                case 4:
                    elements.loadingbar.style.width = '100%';
                    callback(xhr);
                    break;
            }

            // Error code recieved from the server
            if (xhr.status !== 200) {
                console.log('The request was made, but it was not good.');
                return;
            }
        
        }

        xhr.onreadystatechange = checkStatus;
        xhr.open('GET', url, true);
        xhr.send('');

    };


    _.buildGrid = function( opts ) {

        for ( var i = 0, l = settings.photos_per_page; i < l; i++ ) {

            // Create a new image element and give it a class
            images[i] = new Image();
            images[i].className = 'loading';

            // Create the loaded event listener before we give the image a source
            // otherwise it will kick up a fuss in IE
            images[i].onload = function(e) {
                images[i].className = 'loaded';
            };

            // Create a div element we can use to wrap the image, for layout purposes
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

            // Add in a float-clearing element
            if ( i === (settings.photos_per_page-1) ) {
                elements.gridClear = d.createElement('div');
                elements.gridClear.className = 'clear';
                elements.grid.appendChild(elements.gridClear);
            }

        }

    }


    _.search = function(keywords, page) {

        if ( typeof page === "undefined" ) {
            page = 1;
        }

        var method = 'flickr.photos.search';        

        _.get( RESTurl + '&method=' + method + '&tags=' + keywords + '&page=' + page + '&format=json&nojsoncallback=1&per_page=80', function(res){      
            
            var response = JSON.parse( res.response );
            queries[keywords] = response.photos.photo;
            _.updateGrid( response.photos.photo );

            return FlickrBot;
        });

    };


    _.updateGrid = function( photos ) {

        // If the grid already contains image elements, reset their 
        // src attribute so we can see the loading state.
        if ( images.length !== 0 ) {
            for ( var i = 0, l = images.length; i < l; i++ ) {
                images[i].src = 'assets/img/trans.png';
            }
        }

        var len = photos.length;

        for ( var i = 0; i < photos.length; i++ ) {
            console.log(images[i]);
            // URL format details can be found here: http://www.flickr.com/services/api/misc.urls.html
            var url = 'http://farm' + photos[i].farm + '.staticflickr.com/' + photos[i].server + '/' + photos[i].id + '_' + photos[i].secret + '_';
            
            images[i].src = url + ( i === 0 ? 'q' : 'q' ) + '.jpg';
            images[i].dataset.lightbox = url + 'b.jpg';
            images[i].className = 'loading';

            if ( i > len ) {
                images[i].className = 'hidden';
            }
        
        }

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

                // If we detect a '#' character ( indicating an id selector ) ->
                return d.getElementById(target.split('#')[1]);
            } else if (target.indexOf('.') !== -1) {

                // If we detect a '.' character ( indicating a class selector ) ->
                var arr = d.querySelectorAll(target);
                return (arr.length > 1) ? arr : arr[0];
            }
        } else if ('nodeType' in target && target.nodeType === 3) {

            // if the argument is in fact an actual ELEMENT, return it
            return target;
        } else {

            // Fail
            return null;
        }

    };


    _.addClass = function( el, cl ) {
        
        if ( el.className.indexOf(cl) === -1 ) {
            el.className += (el.className.length === 0 ? '' :  ' ') + cl;
        }
        return el;

    };


    _.removeClass = function( el, cl ) {

        switch ( el.className.indexOf(cl) ) {
            case -1:
                return el;
                break;

            case el.className.length:
                el.className.replace(' ' + cl, '');
                break;

            case 0:
                el.className.replace( cl + ' ', '');
                break;
        }
        
    };


    // Adds an event listener - returns the appropriate function depending 
    // on whether it supports addEventListener ( or if it's IE )
    _.listen = (function(e) {

        if (w.addEventListener) {
            return function(el, ev, fn) {
                if ( length in el ) {
                    for ( var i = 0; i < el.length; i++ ) {
                        el[i].addEventListener(ev, fn, false);    
                    }
                } else {
                    el.addEventListener(ev, fn, false);
                }
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
    FlickrBot.select = _.select;
    FlickrBot.addClass = _.addClass;
    FlickrBot.removeClass = _.removeClass;

    w.FlickrBot = FlickrBot;

})(window, document);