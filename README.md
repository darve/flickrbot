Dave's Flickr Bot
=========

Simple Flickr search and browse module.  No dependencies.  Simply include the <code>flickrbot.min.js</code> file in your page and run the <code>init</code> function as described below.

## Usage

####  API

The Flickr Bot has a very simple API, consisting of two functions.

    FlickrBot.init(options)
 
Configurable options:

- lightbox: boolean ( defaults to true, represents whether the photos show larger versions in a lightbox when clicked ),
- photos_\_per\_page: integer ( defaults to 21, represents the number of images per page of results ),
- query\_size: integer ( defaults to 300, represents how many photos we query Flickr for at a time, a higher number is obviously a longer loading time but is more efficient with ajax requests )

This function initialises and returns the FlickrBot. 

    FlickrBot.search( searchterm )

This function returns the FlickrBot, queries Flickr for photos that match the string given to it, and updates the UI with the new photos. 


#### Markup
The FlickrBot consists of the following elements:

- *The grid*: the grid of Flickr photos.
- *The paging*: UI elements that allow the user to traverse the array of Flickr photos.
- *The search box*: The user input their search keywords here to search Flickr. There can be more than one of these if required.
 -*The status*: UI element used to display appropriate messages.
- *The lightbox*: Wrapper element used to show enlarged images when the user clicks on a photo in the grid.
- *The loading bar*: UI element used to show the status of a Flickr query.

You can see an example of how these elements are put together in the file <code>app/index.html</code>.

## Future enhancements / Known bugs

- The UI uses classes for showing and hiding certain elements, which is nice because it avoids any inline styling, however it would likely make it easier to use if developers don't need to worry about what class does what.
- A lot of the UI isn't fully optimised in IE8, primarily because the scope of the project was to create a re-usable flickr search & browse module; the UI can be whatever the dev requires it to be.
- The lightbox images in IE are all out of whack, owing to min and max sizes being used.
- The paging currently only has right and left buttons.  Could be useful to have numbered paging.
- Currently no deep-linking to images, would be good to use some basic hash routing.  Potientially problematic because images can get taken down from Flickr so dead links etc.

## My approach

My basic approach to building a module of this sort can be summed up in the following steps:

1. Analyse the objectives and design documents, and draw up a rough list of all of the seperate components / elements and their responsibilities.
2. Choose a framework / any libraries that will likely be useful in order to meet the objectives.
3. Sketch out the UI to see how these components are represented.
4. Write the javscript skeleton ( i.e. empty functions forming the components established earlier ) and some semantic markup representative of the UI sketch.
5. Do some basic styling so any scripting progress can be actually seen and used.
6. Flesh out the functions and update the mark-up accordingly.
7. Style the finished UI.
8. Test
9. Publish

I ran into a few hurdles when developing this module; namely the stand-off between optimising it for fewer ajax calls, and creating a simple paging mechanism for the results returned from Flickr.  When I started building it, I had a lot of the functionality grouped into one place ( the search function ), but as development went on I made the decision to seperate it into seperate functions ( Build Grid, Update Grid, Search ).

I included a couple of helper functions in the module for things like selecting dom elements, adding event listeners and for basic class manipulation.  Were I to build something like this in a production environment I would likely try and integrate it into whatever selector engine was being used ( if there was one ).