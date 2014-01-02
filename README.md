Dave's Flickr Bot
=========

Simple Flickr search and browse module.  No dependencies.  Simply include the <code>flickrbot.min.js</code> file in your page and run the <code>init</code> function as described below.

## Usage

####  API

The Flickr Bot has a very simple API, consisting of two functions.

    FlickrBot.init(options)
 
Configurable options:

- lightbox: boolean,
- photos_\_per\_page: integer ( defaults to 21 ),
- query\_size: integer ( defaults to 300 )

This function initialises and returns the FlickrBot. 

    FlickrBot.search( searchterm )

This function returns the FlickrBot, queries Flickr for photos that match the string given to it, and updates the UI with the new photos.

#### Markup
The FlickrBot consists of the following elements:

- The grid ( the grid of Flickr photos )
- The paging ( UI elements that allow the user to traverse the array of Flickr photos )
- The search box ( The user input their search keywords here to search Flickr. There can be more than one of these if required ).
 -The status ( UI element used to display appropriate messages
- The lightbox ( Wrapper element used to show enlarged images when the user clicks on a photo in the grid ).
- The loading bar ( UI element used to show the status of a Flickr query ).

You can see an example of how these elements are put together in the file <code>app/index.html</code>.

## Future enhancements / Known bugs

- The UI uses classes for showing and hiding certain elements, which is nice because it avoids any inline styling, however it would likely make it easier to use if developers don't need to worry about what class does what.
- A lot of the UI isn't fully optimised in IE8
- The paging currently only has right and left buttons.  Could be useful to have numbered paging.
- Currently no deep-linking to images, would be good to use some basic hash routing.  Potientially problematic because images can get taken down from Flickr so dead links etc.