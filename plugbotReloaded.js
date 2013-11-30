/*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

/*
* TERMS OF REPRODUCTION USE
*
* 1. Provide a link back to the original repository (this repository), as
* in, https://github.com/ConnerGDavis/Plugbot, that is well-visible
* wherever the source is being reproduced. For example, should you
* display it on a website, you should provide a link above/below that
* which the users use, titled something such as "ORIGINAL AUTHOR".
*
* 2. Retain the GNU GPL, TERMS OF REPRODUCTION USE and author header comments at
* the beginning of any redistributed files you produce.
*
* Failure to follow these terms will result in me getting very angry at you
* and having your software tweaked or removed if possible. Either way, you're
* still an idiot for not following such a basic rule, so at least I'll have
* that going for me.
*/

/*
* CREDITS AND PROPS TO THE ORIGINAL AUTHOR
* @author Conner Davis (Fugitive. on Plug.dj)
* @author Murohman (For the Reloaded Version)
*/
 
/*
* Whether the user has currently enabled auto-woot.
*/
var autowoot;
/*
* Whether the user has currently enabled auto-queueing.
*/
var autoqueue;

/*
* Cookie constants
*/
var COOKIE_WOOT = 'autowoot';
var COOKIE_QUEUE = 'autoqueue';

/*
* Maximum amount of people that can be in the waitlist.
*/
var MAX_USERS_WAITLIST = 50;

/*
* Color codes for the buttons in the UI.
*/
var BUTTON_ON = '#3fff00';
var BUTTON_OFF = '#ed1c24';


/**
* Initialise all of the Plug.dj API listeners which we use to asynchronously intercept specific events and the data
* attached with them.
*/
function initAPIListeners()
{
  /*
* This listens in for whenever a new DJ starts playing.
*/
  API.on(API.DJ_ADVANCE, djAdvanced);

  /*
* This listens for changes in the waiting list
*/
  API.on(API.WAIT_LIST_UPDATE, queueUpdate);

  /*
* This listens for changes in the dj booth
*/
  API.on(API.DJ_UPDATE, queueUpdate);

  /*
* This listens for whenever a user in the room either WOOT!s or Mehs the current song.
*/
  API.on(API.VOTE_UPDATE, function (obj) {
    if (userList) {
      populateUserlist();
    }
  });

  /*
* Whenever a user joins, this listener is called.
*/
  API.on(API.USER_JOIN, function (user) {
    if (userList) {
      populateUserlist();
    }
  });

  /*
* Called upon a user exiting the room.
*/
  API.on(API.USER_LEAVE, function (user) {
    if (userList) {
      populateUserlist();
    }
  });
}


/**
* Renders all of the Plug.bot "UI" that is visible beneath the video player.
*/
function displayUI()
{
  /*
* Be sure to remove any old instance of the UI, in case the user reloads the script without refreshing the page
* (updating.)
*/
  $('#plugbot-ui').remove();

  /*
* Generate the HTML code for the UI.
*/

  /*
* Determine the color of the menu item based on its state, on or off.
*/
  var cWoot = autowoot ? BUTTON_ON : BUTTON_OFF;
  var cQueue = autoqueue ? BUTTON_ON : BUTTON_OFF;
  var cHideVideo = hideVideo ? BUTTON_ON : BUTTON_OFF;
  var cUserList = userList ? BUTTON_ON : BUTTON_OFF;

  /*
* Draw the UI.
*/
  $('#chat-header').append('<div id="autowoot" class="chat-header-button" style="color:' + cWoot + '; background-color:' + cWoot + '; left:213px;"></div>');
}


/**
* For every button on the Plug.bot UI, we have listeners backing them that are built to intercept the user's clicking
* each button. Based on the button that they clicked, we can execute some logic that will in some way affect their
* experience.
*
* A generic description of all the listeners is this:
* 1. Invert the state of the toggle.
* 2. Invert the color to match the new state.
* 3. *Execute whatever logic pertains to the specific button*
* 4. Update the cookie.
*/
function initUIListeners()
{

  /*
* Toggle auto-woot.
*/
  $('#autowoot').on('click', function() {
    autowoot = !autowoot;
    $(this).css('color', autowoot ? BUTTON_ON : BUTTON_OFF);

    if (autowoot) {
      $('#woot').click();
    }

    jaaulde.utils.cookies.set(COOKIE_WOOT, autowoot);
  });

  /*
* Toggle auto-queue/auto-DJ.
*/
  $('#plugbot-btn-queue').on('click', function() {
    autoqueue = !autoqueue;
    $(this).css('color', autoqueue ? BUTTON_ON : BUTTON_OFF);

    queueUpdate();
       
    jaaulde.utils.cookies.set(COOKIE_QUEUE, autoqueue);
  });
}


/**
* Called whenever a new DJ begins playing in the room.
*
* @param obj This contains the current DJ's data.
*/
function djAdvanced(obj)
{
  /*
* If auto-woot is enabled, WOOT! the song.
*/
  if (autowoot) {
    $('#woot').click();
  }
}


/**
* Called whenever a change happens to the queue.
*/
function queueUpdate()
{
  /*
* If auto-queueing has been enabled, and we are currently not in the waitlist, then try to join the list.
*/
  if (autoqueue && !isInQueue())
  {
    joinQueue();
  }
}


/**
* Checks whether or not the user is already in queue.
*
* @return True if the user is in queue, else false.
*/
function isInQueue()
{
  return API.getBoothPosition() !== -1 || API.getWaitListPosition() !== -1;
}


/**
* Tries to add the user to the queue or the booth if there is no queue.
*/
function joinQueue()
{
 if (API.getWaitList().length < MAX_USERS_WAITLIST) {
    API.djJoin();
  }
}

function oldjoinQueue()
{
 if ($('#button-dj-play').css('display') === 'block') {
    $('#button-dj-play').click();
  } else if (API.getWaitList().length < MAX_USERS_WAITLIST) {
    API.djJoin();
  }
}


////////////////////////////////////////////////////////
////////// THIS IS WHERE WE ACTUALLY DO STUFF //////////
////////////////////////////////////////////////////////

/*
* Clear the old code so we can properly update everything.
*/
$('#plugbot-css').remove();
$('#plugbot-js').remove();


/*
* Include cookie library.
*
* @note We'll stick with the old-school JS way of doing this since jQuery
* doesn't support cookies by default, we'd need to also include a
* a separate library which isn't something I want to do.
*/
var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'http://cookies.googlecode.com/svn/trunk/cookies.utils.jaaulde.js';
script.onreadystatechange = function() {
  if (this.readyState == 'complete') {
    readCookies();
  }
}
script.onload = readCookies;
head.appendChild(script);


/**
* Read cookies when the library is loaded.
*/
function readCookies()
{
  /*
* Changing default cookie settings.
*/
  var currentDate = new Date();
  currentDate.setFullYear(currentDate.getFullYear() + 1); // Cookies expire after 1 year
  var newOptions = {
    expiresAt: currentDate
  }
  jaaulde.utils.cookies.setOptions(newOptions);

  /*
* Read Auto-Woot cookie (true by default)
*/
  var value = jaaulde.utils.cookies.get(COOKIE_WOOT);
  autowoot = value != null ? value : true;

  /*
* Read Auto-Queue cookie (false by default)
*/
  value = jaaulde.utils.cookies.get(COOKIE_QUEUE);
  autoqueue = value != null ? value : false;

  /*
* Read hidevideo cookie (false by default)
*/
  value = jaaulde.utils.cookies.get(COOKIE_HIDE_VIDEO);
  hideVideo = value != null ? value : false;

  /*
* Read userlist cookie (true by default)
*/
  value = jaaulde.utils.cookies.get(COOKIE_USERLIST);
  userList = value != null ? value : true;

  onCookiesLoaded();
}


/*
* Write the CSS rules that are used for components of the
* Plug.bot UI.
*/
$('body').prepend('<style type="text/css" id="plugbot-css">#plugbot-ui { position: absolute; margin-left: 349px; }#plugbot-ui p { background-color: #0b0b0b; height: 32px; padding-top: 8px; padding-left: 8px; padding-right: 6px; cursor: pointer; font-variant: small-caps; width: 84px; font-size: 15px; margin: 0; }#plugbot-ui h2 { background-color: #0b0b0b; height: 112px; width: 156px; margin: 0; color: #fff; font-size: 13px; font-variant: small-caps; padding: 8px 0 0 12px; border-top: 1px dotted #292929; }#plugbot-userlist { border: 6px solid rgba(10, 10, 10, 0.8); border-left: 0 !important; background-color: #000000; padding: 8px 0px 20px 0px; width: 12%; }#plugbot-userlist p { margin: 0; padding-top: 4px; text-indent: 24px; font-size: 10px; }#plugbot-userlist p:first-child { padding-top: 0px !important; }#plugbot-queuespot { color: #42A5DC; text-align: left; font-size: 15px; margin-left: 8px }');


/**
* Continue initialization after user's settings are loaded
*/
function onCookiesLoaded()
{
  /*
* Hit the woot button, if autowoot is enabled.
*/
  if (autowoot) {
    $('#button-vote-positive').click();
  }

  /*
* Auto-queue, if autoqueue is enabled and the list is not full yet.
*/
  queueUpdate();

  /*
* Hide video, if hideVideo is enabled.
*/
  if (hideVideo) {
    $('#yt-frame').animate({
      'height': (hideVideo ? '0px' : '271px')
    }, {
      duration: 'fast'
    });
    $('#playback .frame-background').animate({
      'opacity': (hideVideo ? '0' : '0.91')
    }, {
      duration: 'medium'
    });
  }

  /*
* Generate userlist, if userList is enabled.
*/
  if (userList) {
    populateUserlist();
  }

  /*
* Call all init functions to start the software up.
*/
  initAPIListeners();
  displayUI();
  initUIListeners();
}
