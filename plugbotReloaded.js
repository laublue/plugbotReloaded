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
* @author Conner Davis (Fugitive. on Plug.dj)
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
* Whether or not the user has enabled hiding this video.
*/
var hideVideo;
/*
* Whether or not the user has enabled the userlist.
*/
var userList;
/*
* Whether the current video was skipped or not.
*/
var skippingVideo = false;

/*
* Cookie constants
*/
var COOKIE_WOOT = 'autowoot';
var COOKIE_QUEUE = 'autoqueue';
var COOKIE_HIDE_VIDEO = 'hidevideo';
var COOKIE_USERLIST = 'userlist';

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

  $('#btn-autowoot').remove();
  $('#btn-autoqueue').remove();

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
  $('#chat-header').append('<div id="btn-autowoot" class="chat-header-button" style="background-color:' + cWoot + 
  '; left:213px; color:'+ !cWoot + ';"><span style="font-size:21px; color:' + !cWoot + ';">W</span></div>');
  $('#chat-header').append('<div id="btn-autoqueue" class="chat-header-button" style="background-color:' + cQueue + 
  '; left:265px; color:'+ !cQueue + ';"><span style="font-size:21px; color:' + !cQueue + ';">Q</span></div>');
}

function displayWelcomeMessage()
{
  API.chatLog("Welcome to PlugBot Reloaded version " + version + " !");
  API.chatLog("Type /pbrhelp for details.");
  if (autowoot) {
   API.chatLog("Autowoot is currently : ON");
  }else {
   API.chatLog("Autowoot is currently : OFF");
  }
  
  if (autoqueue) {
   API.chatLog("AutoQueue is currently : ON");
  }else {
   API.chatLog("AutoQueue is currently : OFF");
  }
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
* Toggle userlist.
*/
  $('#plugbot-btn-userlist').on("click", function() {
    userList = !userList;
    $(this).css('color', userList ? BUTTON_ON : BUTTON_OFF);
   
    $('#plugbot-userlist').css('visibility', userList ? 'visible' : 'hidden');

    if (!userList) {
      $('#plugbot-userlist').empty();
    }
    else {
      populateUserlist();
    }

    jaaulde.utils.cookies.set(COOKIE_USERLIST, userList);
  });

  /*
* Toggle auto-woot.
*/
  $('#btn-autowoot').on('click', function() {
    autowoot = !autowoot;
    $(this).css('background-color', autowoot ? BUTTON_ON : BUTTON_OFF);
    $(this).css('color', !autowoot ? BUTTON_ON : BUTTON_OFF)

    if (autowoot) {
      $('#woot').click();
    }
    
    if(autowoot) {
     API.chatLog("Autowoot is now : ON");
    } else {
     API.chatLog("Autowoot is now : OFF");
    }

    jaaulde.utils.cookies.set(COOKIE_WOOT, autowoot);
  });

  /*
* Toggle hide video.
*/
  $('#plugbot-btn-hidevideo').on('click', function() {
    hideVideo = !hideVideo;
    $(this).css('color', hideVideo ? BUTTON_ON : BUTTON_OFF);
   
    $(this).text(hideVideo ? 'hiding video' : 'hide video');
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

    jaaulde.utils.cookies.set(COOKIE_HIDE_VIDEO, hideVideo);
  });

  /*
* Skip the current video.
*/
  $('#plugbot-btn-skipvideo').on('click', function() {
    skippingVideo = !skippingVideo;
    $(this).css('color', skippingVideo ? BUTTON_ON : BUTTON_OFF);
    $(this).text(skippingVideo ? 'skipping video' : 'skip video');
       
    if (hideVideo == skippingVideo) {
      $('#button-sound').click();
    } else {
      $('#plugbot-btn-hidevideo').click();
      $('#button-sound').click();
    }
  });

  /*
* Toggle auto-queue/auto-DJ.
*/
  $('#btn-autoqueue').on('click', function() {
    autoqueue = !autoqueue;
    alert(autoqueue);
    $(this).css('background-color', autoqueue ? BUTTON_ON : BUTTON_OFF);
    $(this).css('color', !autoqueue ? BUTTON_ON : BUTTON_OFF);

    queueUpdate();
    
    
    if (autoqueue) {
     API.chatLog("AutoQueue is now : ON");
    } else {
     API.chatLog("AutoQueue is now : OFF");
    }
       
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
* If they want the video to be hidden, be sure to re-hide it.
*/
  if (hideVideo) {
    $('#yt-frame').css('height', '0px');
    $('#playback .frame-background').css('opacity', '0.0');
  }

  /*
* If they want to skip the next video, do it.
*/
  if (skippingVideo) {
    $('#plugbot-btn-skipvideo').css('color', BUTTON_ON).text('skip video');
    $('#button-sound').click();
    skippingVideo = false;
  }

  /*
* If auto-woot is enabled, WOOT! the song.
*/
  if (autowoot) {
    $('#woot').click();
  }

  /*
* If the userlist is enabled, re-populate it.
*/
  if (userList) {
    populateUserlist();
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
  if ($('#dj-button').hasClass('is-join')) 
  {
    $('#dj-button').click();
  } 
  else 
  {
    if ($('#dj-button').hasClass('is-wait'))
    {
      $('#dj-button').click();
    } 
    else 
    {
     if (API.getWaitList().length < MAX_USERS_WAITLIST) {
       API.djJoin();
     }
    }
  }
}


/**
* Generates every user in the room and their current vote as color-coded text. Also, moderators get the star next to
* their name.
*/
function populateUserlist()
{
  /*
* Destroy the old userlist DIV and replace it with a fresh empty one to work with.
*/
  $('#plugbot-userlist').remove();
  /*
* Spawn the new one.
*/
  $('body').append('<div id="plugbot-userlist"></div>');

  /*
* Update the current # of users in the room.
*/
  $('#plugbot-userlist').append('<h1 style="text-indent:12px;color:#42A5DC;font-size:14px;font-variant:small-caps;">Users: ' + API.getUsers().length + '</h1>');

  /*
* You can mention people from the userlist.
*/
  $('#plugbot-userlist').append('<p style="padding-left:12px;text-indent:0px !important;font-style:italic;color:#42A5DC;font-size:11px;">Click a username to<br />@mention them</p><br />');

  /*
* If the user is in the waitlist, show them their current spot.
*/
  if ($('#button-dj-waitlist-view').attr('title') !== '') {
    if ($('#button-dj-waitlist-leave').css('display') === 'block' && ($.inArray(API.getDJs(), API.getUser()) == -1)) {
      var spot = $('#button-dj-waitlist-view').attr('title').split('(')[1];
      spot = spot.substring(0, spot.indexOf(')'));
      $('#plugbot-userlist').append('<h1 id="plugbot-queuespot"><span style="font-variant:small-caps">Waitlist:</span> ' + spot + '</h3><br />');
    }
  }

  /*
* An array of all of the room's users.
*/
  var users = new Array();

  /*
* Populate the users array with the next user in the room (this is stored alphabetically.)
*/
  for (user in API.getUsers()) {
    users.push(API.getUsers()[user]);
  }

  /*
* For every user, call the #appendUser(username, vote) method which will display their username with any color
* coding that they match.
*/
  for (user in users) {
    var user = users[user];
    appendUser(user);
  }
}

/**
* Appends another user's username to the userlist.
*
* @param user The user we're adding to the userlist.
*/
function appendUser(user)
{
  var username = user.username;
  /*
* 1: normal (or 0)
* 2: bouncer
* 3: manager
* 4/5: (co-)host
*/
  var permission = user.permission;

  /*
* If they're an admin, set them as a fake permission, makes it easier.
*/
  if (user.admin) {
    permission = 99;
  }

  /*
* For special users, we put a picture of their rank (the star) before their name, and color it based on their
* vote.
*/
  var imagePrefix;
  switch (permission) {
    case 0:
      imagePrefix = 'normal';
      break;
    case 1:
      imagePrefix = 'featured';
      break;
    case 2:
      imagePrefix = 'bouncer';
      break;
    case 3:
      imagePrefix = 'manager';
      break;
    case 4:
    case 5:
      imagePrefix = 'host';
      break;
    case 99:
      imagePrefix = 'admin';
      break;
    }

  /*
* If they're the current DJ, override their rank and show a different color, a shade of blue, to denote that
* they're playing right now (since they can't vote their own song.)
*/
  if (API.getDJs()[0].username == username) {
    if (imagePrefix === 'normal') {
      drawUserlistItem('void', '#42A5DC', username);
    } else {
      drawUserlistItem(imagePrefix + '_current.png', '#42A5DC', username);
    }
  } else if (imagePrefix === 'normal') {
    /*
* If they're a normal user, they have no special icon.
*/
    drawUserlistItem('void', colorByVote(user.vote), username);
  } else {
    /*
* Otherwise, they're ranked and they aren't playing,
* so draw the image next to them.
*/
    drawUserlistItem(imagePrefix + imagePrefixByVote(user.vote), colorByVote(user.vote), username);
  }
}


/**
* Determine the color of a person's username in the userlist based on their current vote.
*
* @param vote Their vote: woot, undecided or meh.
*/
function colorByVote(vote)
{
  if (!vote) {
    return '#fff'; // blame Boycey
  }
    
  switch (vote) {
    case -1: // Meh
      return '#c8303d';
    case 0: // Undecided
      return '#fff';
    case 1: // Woot
      return '#c2e320';
  }
}


/**
* Determine the "image prefix", or a picture that shows up next to each user applicable in the userlist. This denotes
* their rank, and its color is changed based on that user's vote.
*
* @param vote Their current vote.
* @return The varying path to the PNG image for this user, as a string. NOTE: this only provides the suffix
* of the path.. the prefix of the path, which is admin_, host_, etc. is done elsewhere.
*/
function imagePrefixByVote(vote)
{
  if (!vote) {
    return '_undecided.png'; // blame boycey again
  }

  switch (vote) {
    case -1:
      return '_meh.png';
    case 0:
      return '_undecided.png';
    case 1:
      return '_woot.png';
  }
}


/**
* Draw a user in the userlist.
*
* @param imagePath An image prefixed by their username denoting rank; bouncer/manager/etc. 'void' for normal users.
* @param color Their color in the userlist, based on vote.
* @param username Their username.
*/
function drawUserlistItem(imagePath, color, username)
{
  /*
* If they aren't a normal user, draw their rank icon.
*/
  if (imagePath !== 'void') {
    $('#plugbot-userlist').append('<img src="https://raw.github.com/connergdavis/Plugbot/master/icons/'
      + imagePath + '" align="left" style="margin-left:6px;margin-top:2px" />');
  }

  /*
* Write the HTML code to the userlist.
*/
  $('#plugbot-userlist').append('<p style="cursor:pointer;' + (imagePath === 'void' ? '' : 'text-indent:6px !important;')
    + 'color:' + color + ';' + ((API.getDJs()[0].username == username) ? 'font-size:15px;font-weight:bold;' : '')
    + '" onclick="$(\'#chat-input-field\').val($(\'#chat-input-field\').val() + \'@' + username + ' \').focus();">'
    + username + '</p>');
}


////////////////////////////////////////////////////////
////////// THIS IS WHERE WE ACTUALLY DO STUFF //////////
////////////////////////////////////////////////////////

/*
* Clear the old code so we can properly update everything.
*/
$('#plugbot-userlist').remove();
$('#plugbot-css').remove();
$('#plugbotReloaded-js').remove();


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
    $('#woot').click();
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
  displayWelcomeMessage();
}

