
/*  Module: Dave's Flickr Machine
/*  Author: David Woollard
/*  Date: Dec 2013
/* =============================== */

(function(w,d){


    'use strict';


    var _ = {},
        queries = {},
        elements = {},
        photos = [],
        loaded = false,
        loading = false,
        searchterm,
        currentpage;


    // Caching our API credentials for ease.
    var api_key = '5e0c3a5a074554ab8740d758e7384a3a',
        secret = '80e37ce5945edef8',
        RESTurl = 'http://api.flickr.com/services/rest/?api_key=' + api_key;


    // Global settings for the flickr bot, overridable via parameters
    // fed to the init function
    var settings = {
        photos_per_page: 21,
        query_size: 300,
        lightbox: true
    };


    // Create a public object that we will expose to the window at the 
    // bottom of this closure
    var FlickrBot = function() {
        return FlickrBot;
    };

    
    // Initialise the twitter bot
    // 1. Cache all of the elements that make up the bot
    // 2. Add some event listeners for searching and paging etc
    // 3. Set status to READY
    _.init = function(opts) {

        // Put the user settings into our main settings object
        settings = _.extend(settings, opts);

        // Cache our elements
        elements.grid = _.select('.flickr-grid');
        elements.masthead = _.select('.flickr-masthead');
        elements.lightbox = _.select('#flickr-lightbox');
        elements.searchbox = _.select('.flickr-search-box');
        elements.loadingbar = _.select('.flickr-loading-bar');
        elements.paging = _.select('.flickr-direction-paging');
        elements.status = _.select('.flickr-status');

        // Disable the 'left' paging button, just in case the dev
        // neglects to add it into the markup by default.
        _.addClass(elements.paging.querySelector('.left'), 'disabled');
        _.addClass(elements.status, 'show');

        // Listen for lightbox clicks (closes the lightbox)
        _.listen(elements.lightbox, 'click', function(e) {
            elements.lightbox.className = '';
        });

        // Attach click listeners to the paging buttons
        _.listen(elements.paging.querySelector('.left'), 'click', function(e){
            _.prevent(e);
            _.page('left');
        });

        _.listen(elements.paging.querySelector('.right'), 'click', function(e){
            _.prevent(e);
            _.page('right'); 
        });

        // This check was added in to allow the developer to have multiple flickr
        // search boxes on one page. @TODO: Update the listen function to handle 
        // variable numbers of elements.
        if (length in elements.searchbox && elements.searchbox.length > 1 && elements.searchbox.nodeType === undefined) {
            var len = elements.searchbox.length,
                elems = elements.searchbox;
        } else {
            var len = 1,
                elems = [];
            elems.push(elements.searchbox);
        }

        for ( var i = 0; i < len; i++ ) {
            _.listen( elems[i], 'submit', function(e) {
                _.prevent(e); 
            });        
            _.listen( elems[i].getElementsByTagName('button'), 'click', function(e) {
                _.prevent(e);
                var txt = e.srcElement.parentNode.getElementsByTagName('input')[0].value;
                if ( txt !== '' ) {
                    _.search(txt);
                    e.srcElement.blur(); // hide the keyboard on mobile devices
                    _.hideGrid();
                    _.showStatus();
                }
            });
            _.listen( elems[i].getElementsByTagName('input'), 'keydown', function(e) {
                e.which = e.which || e.keyCode;
                if ( e.which == 13 ) {
                    _.prevent(e);
                    if ( e.srcElement.value !== '' ) {
                        _.search( e.srcElement.value );
                        e.srcElement.blur(); // hide the keyboard on mobile devices
                        _.hideGrid();
                        _.showStatus();
                    }
                }
            });
            _.listen( elems[i].getElementsByTagName('input'), 'click', function(e) {
                e.srcElement.value = '';
            });
        }

        // Cheeky flicker to trick IE8 into showing the icon font properly.
        if ( _.hasClass( d.getElementsByTagName('html')[0], 'lt-ie9' ) ) {
            d.body.style['display'] = 'none';
            d.body.style['display'] = '';
        }

        _.buildGrid();
        return FlickrBot;
    };


    // Basic ajax GET function.  
    // @TODO: replace the callback with a promise
    _.get = function(url, callback) {

        // This is the callback to our ajax request, which decides what to do
        // based on its ready status. Used for styling the green loading bar.
        function checkStatus() {

            switch (xhr.readyState) {
                case 1:
                    _.addClass( elements.loadingbar, 'show' );
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
                    _.removeClass( elements.loadingbar, 'show' );
                    callback(xhr.responseText);
                    break;
            }

            // Error code recieved from the server
            if (xhr.status !== 200) {
                console.log('The request was made, but it was not good.');
                return;
            }
        }

        if ( typeof XDomainRequest === "undefined" ) {
            // This browser is more modern than IE8, create a regular XMLHttpRequest
            // and fire it off.
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = checkStatus;
            xhr.open('GET', url, true);
            xhr.send('');
        } else {
            // Because this is a cross-domain request, IE8 will have a fit if
            // we try and use a regular XMLHttpRequest, so we use an XDomainRequest.
            // No progress report for IE.
            var xdr = new XDomainRequest();
            xdr.onload = function(res) { 
                callback(xdr.responseText); 
            };
            xdr.open('GET', url);
            xdr.send('');    
        }
    };


    // This is responsible to creating the grid of elements that 
    // show the images receieved from the flickr API.
    _.buildGrid = function( opts ) {

        for ( var i = 0, l = settings.photos_per_page; i < l; i++ ) {

            // Create an empty object for this item
            photos[i] = {};

            // Create a new image element and give it a class
            photos[i].image = new Image();
            photos[i].image.className = 'loading';

            // Create the loaded event listener before we give the image a source
            // otherwise it will kick up a fuss in IE
            photos[i].image.onload = function(e) {
                _.addClass( this, 'loaded' );
            };

            photos[i].image.onerror = function(e) {
                _.addClass(this.parentNode, 'hidden');
            }

            // Create a div element we can use to wrap the image, for layout purposes
            photos[i].wrapper = d.createElement('div');
            photos[i].wrapper.className = 'item hidden';
            photos[i].wrapper.appendChild(photos[i].image);
            elements.grid.appendChild(photos[i].wrapper);

            // Because we are creating new image elements, we need to add a 
            // click listener to each one to fire off the lightbox.
            // Note: this is only needed if the lightbox setting is true
            if ( settings.lightbox === true ) {
                _.listen( photos[i].image, 'click', function(e) {
                    var img = new Image();
                    img.className = 'lightbox';
                    img.src = e.srcElement.getAttribute('data-lightbox');
                    
                    elements.lightbox.innerHTML = '';
                    elements.lightbox.appendChild(img);
                    elements.lightbox.className = 'visible';
                });    
            }

            // Add in a float-clearing element
            if ( i === (settings.photos_per_page-1) ) {
                elements.gridClear = d.createElement('div');
                elements.gridClear.className = 'clear';
                elements.grid.appendChild(elements.gridClear);
            }
        }

    }


    // This is responsible for updating the images in the grid
    _.updateGrid = function( arr, start ) {

        if ( typeof start == 'undefined' ) {
            start = 0;
        }

        if ( queries[searchterm].length < ( start + settings.photos_per_page ) && queries[searchterm].all === false ) {
            _.search( searchterm, queries[searchterm].page );
        } else {
            var len = ( arr.length < settings.photos_per_page ? arr.length : settings.photos_per_page );
        
            for ( var i = 0; i < len; i++ ) {

                // This is the array index we are looking at in our cached photos
                var f = start + i;

                if ( typeof arr[f] !== "undefined" ) {
                    
                    // Build the URL for this photo
                    // URL format details can be found here: http://www.flickr.com/services/api/misc.urls.html
                    var url = 'http://farm' + arr[f].farm + '.staticflickr.com/' + arr[f].server + '/' + arr[f].id + '_' + arr[f].secret + '_';   
                    photos[i].image.src = url + ( i === 0 ? 'q' : 'q' ) + '.jpg'; // this is redundant, was used for non-square images
                    photos[i].image.setAttribute('data-lightbox', url + 'b.jpg');
                    photos[i].image.className = 'loading';
                    _.removeClass( photos[i].wrapper, 'hidden' );
                } else {
                    _.addClass( photos[i].wrapper, 'hidden' );
                    // @TODO: optimise this so it only runs once
                    _.addClass(elements.paging.querySelector('.right'), 'disabled');
                }
            }

            if ( loaded === false ) {
                loaded = true;
            }
            if ( start === 0 && queries[searchterm].length >= ( start + settings.photos_per_page ) ) {
                _.addClass(elements.paging, 'show');    
            }

        // Re-enable the UI
        loading = false;
        }

    };


    // Query the Flickr API with the keywords entered by the user.
    // Cache the response to our QUERIES object
    // invoke the updateGrid function to display the search results
    _.search = function( keywords, page ) {

        var method = 'flickr.photos.search',
            response;

        if ( typeof page === "undefined" ) {
            page = 1;
            currentpage = 1;
            elements.paging.getElementsByTagName('span')[0].innerHTML = ('Page ' + currentpage);
            _.addClass(elements.paging.querySelector('.left'), 'disabled');
            _.removeClass(elements.paging.querySelector('.right'), 'disabled');
            searchterm = keywords;
            currentpage = page;
        } else {
            page++;
            elements.paging.getElementsByTagName('span')[0].innerHTML = ('Page ' + currentpage);
        }

        // Update the UI in case it's looking a bit bleak
        _.addClass(elements.status.querySelector('.loading-animation'), 'animated');
        elements.status.querySelector('.message').innerHTML = 'Loading images';

        // Query Flickr for 300 images ( a large number, I know ) so we can
        // take care of caching etc behind the scenes.  Fewer XHR requests is 
        // best.
        _.get( RESTurl + '&method=' + method + '&tags=' + keywords + '&page=' + page + '&format=json&nojsoncallback=1&per_page=' + settings.query_size, function( res ){      
            
            try {
                response = JSON.parse( res );

                if ( response.photos.photo.length === 0 ) {
                    // This query gave us no results, hide the UI and prompt
                    // the user to search again
                    _.hideGrid();
                    _.showStatus();
                    _.removeClass(elements.status.querySelector('.loading-animation'), 'animated');
                    elements.status.querySelector('.message').innerHTML = 'Sorry, your search returned no results.';
                } else {
                    
                    _.hideStatus();
                    if ( page === 1 ) {
                        // Cache this set of search results
                        queries[keywords] = response.photos.photo;
                    } else {
                        // Add this new set of search results to our cached search results
                        // (appends the new array to the old one).
                        Array.prototype.push.apply(queries[keywords], response.photos.photo);
                    }

                    // Store the current page of flickr search results we are on ( different
                    // to the site paging ).
                    queries[keywords].page = page; 
                    
                    // Determine if there are any more flickr results out there,
                    // or whether we have them all.
                    if ( response.photos.photo.length < settings.query_size) {
                        queries[keywords].all = true;
                    } else {
                        queries[keywords].all = false;
                    }

                    if ( page === 1 ) {
                        _.updateGrid( response.photos.photo );                            
                    } else {
                        _.updateGrid( queries[searchterm], currentpage );
                    }
                }
            } catch(e) {
                _.hideGrid();
                _.showStatus();
                _.removeClass(elements.status.querySelector('.loading-animation'), 'animated');
                elements.status.querySelector('.message').innerHTML = "I'm terribly sorry, but an error has occurred.";
            }

            return FlickrBot;
        });

    };


    // Helper function to jump between pages ( can either be a string e.g. UP or DOWN )
    // or it could be a number referencing a specific page. 
    _.page = function( page ) {
        
        if ( loading === false ) {
            switch ( typeof page ) { 
                case 'string':
                    if ( page === 'left' ) {
                        if ( currentpage > 1 && !_.hasClass( elements.paging.querySelector('.left'), 'disabled') ) {
                            
                            loading = true;    
                            
                            for ( var i = 0, l = settings.photos_per_page; i < l; i++ ) {
                                photos[i].image.src = 'assets/img/trans.png';
                            }
                            
                            // The timeout is necessary so the images appear to be loading
                            setTimeout( function() {
                                _.updateGrid( queries[searchterm], settings.photos_per_page * (currentpage-1) );
                                currentpage--;
                                elements.paging.getElementsByTagName('span')[0].innerHTML = ('Page ' + currentpage);
                                if ( currentpage === 1 ) {
                                    _.addClass(elements.paging.querySelector('.left'), 'disabled');
                                }
                            }, 25);

                        }
                    } else if ( page === 'right' && !_.hasClass( elements.paging.querySelector('.right'), 'disabled') ) {

                        loading = true;
                        
                        for ( var i = 0, l = settings.photos_per_page; i < l; i++ ) {
                            photos[i].image.src = 'assets/img/trans.png';
                        }

                        // The timeout is necessary so the images appear to be loading
                        setTimeout( function(){
                            _.updateGrid( queries[searchterm], settings.photos_per_page * (currentpage+1) );
                            currentpage++;
                            elements.paging.getElementsByTagName('span')[0].innerHTML = ('Page ' + currentpage);
                            _.removeClass(elements.paging.querySelector('.left'), 'disabled');
                        }, 25);

                    }
                    break;

                case 'number':
                    _.updateGrid(queries[searchterm], (settings.photos_per_page * page));
                    break;
            }
        }

    };


    _.showStatus = function() {

        if ( elements.status ) {
            _.addClass( elements.status, 'show' );
        }

    };


    _.hideStatus = function() {

        if ( elements.status ) {
            _.removeClass( elements.status, 'show' );
        }

    };


    _.hideGrid = function() {

        for ( var i = 0; i < photos.length; i++ ) {
            _.addClass(photos[i].wrapper, 'hidden');
        }
        _.removeClass(elements.paging, 'show');

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

    // Utility function that returns true if the given element has
    // the given class, false if not
    _.hasClass = function( el, cl ) {

        return el.className.indexOf(cl) === -1 ? false : true;

    };


    // Utility function to add a class to a DOM element
    _.addClass = function( el, cl ) {
        
        // Check if the element has the class already
        if ( el.className.indexOf(cl) === -1 ) {
            el.className += (el.className.length === 0 ? '' :  ' ') + cl;
        }
        return el;

    };


    // Utility function to remove a class from a DOM element
    _.removeClass = function( el, cl ) {

        // Establish if the class in question is at the start or end of
        // the className, or whether it is the only class, then remove it.
        if ( el.className.indexOf( cl ) !== -1 ) {
            if ( el.className.indexOf( cl + ' ' ) !== -1 ) {
                el.className = el.className.replace( cl + ' ', '' );         
            } else if ( el.className.indexOf( ' ' + cl ) !== -1 ) {
                el.className = el.className.replace( ' ' + cl, '' );
            } else if ( el.className.length === cl.length ) {
                el.className = '';
            }
        }

    };


    // Simple extend function - iterates through all the properties of the second
    // argument object and adds them / overwrites them on the first argument
    _.extend = function(obj, ext) {

        for (var prop in ext) {
            obj[prop] = (obj.hasOwnProperty(prop)) ? obj[prop] : ext[prop];
        }
        return obj;

    };


    // Utility function that prevent the default response to an event
    _.prevent = function(e) {

        if (e.preventDefault) {
            e.preventDefault();
        } else if (e.stopPropagation) {
            e.stopPropagation();
        } else {
            e.returnValue = false;
        }

    }


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
                if ( length in el ) {
                    for ( var i = 0; i < el.length; i++ ) {
                        el[i].attachEvent('on' + ev, fn);
                    }
                } else {
                    el.attachEvent('on' + ev, fn);
                }
                
            };
        }

    })();


    // Expose public methods
    FlickrBot.init = _.init;
    FlickrBot.search = _.search;


    w.FlickrBot = FlickrBot;


})(window, document);