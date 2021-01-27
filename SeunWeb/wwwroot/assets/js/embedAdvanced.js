(function(window){
  var embedIDs = 1,
    frameHeightTimer = -1,
    resizeTimer = -1,
    scrollTimer = -1,
    previousHeight = {},
    iframesLoaded = 0,

    con = {
      log: function(s){console.log(s);},
      warn: function(s){console.warn?console.warn(s):console.log(s);},
      error: function(s){console.error?console.error(s):console.log(s);}
    },
    tgbDivs = (function(){
      var divs = [],
        elems = document.getElementsByClassName('tagboard-embed');
      for (var i = 0; i < elems.length; ++i) {
        if (elems[i].nodeName === 'DIV') {
          divs.push(elems[i]);
        }
      }
      return divs;
    })(),
    tgbDomain = (window.tagboardOptions && window.tagboardOptions.domain) || window.tagboardDomain || "https://embeds.tagboard.com",

    frameHeightChange = function _frameHeightChange() {
      if (frameHeightTimer != -1) {
        clearTimeout(frameHeightTimer);
      }

      frameHeightTimer = window.setTimeout(scrollFinished, 500);
    },

    pageResized = function _pageResized() {
      if (resizeTimer != -1) {
        clearTimeout(resizeTimer);
      }

      resizeTimer = window.setTimeout(resizeFinished, 50);
    },

    pageScrolled = function _pageScrolled() {
      if (scrollTimer != -1) {
        clearTimeout(scrollTimer);
      }

      scrollTimer = window.setTimeout(scrollFinished, 50);
    },

    execForFrames = function _execForFrame(func, frame_id) {
      // Optional frame_id to run for specific embed frame
      var iframes = document.getElementsByClassName('tagboard-iframe');
      for (var i = 0; i < iframes.length; ++i) {
        var ifrm = iframes[i],
          match = ifrm.getAttribute('tgb-frame-id') == frame_id;
        if (ifrm.tagName.toLowerCase() === 'iframe' && (!frame_id || match)) {
          func(ifrm);
          if (frame_id) {
            return;
          }
        }
      }
    },

    resizeFinished = function _resizeFinished(frame_id) {
      execForFrames(function(ifrm) {
        ifrm.contentWindow.postMessage('iFrameOffset:' + ifrm.getBoundingClientRect().top, tgbDomain);
        ifrm.contentWindow.postMessage('windowHeight:' + window.innerHeight, tgbDomain);
      }, frame_id);
    },

    scrollFinished = function _scrollFinished(frame_id) {
      execForFrames(function(ifrm){
        var divYOffset = 0;

        for (var element = ifrm; element != null; element = element.offsetParent) {
          divYOffset += element.offsetTop;
        }

        ifrm.contentWindow.postMessage('scrollPos:' + Math.max(0, window.pageYOffset - divYOffset), tgbDomain);
        ifrm.contentWindow.postMessage('pageYOffset:' + window.pageYOffset, tgbDomain);
      }, frame_id);
    },

    setFrameHeight = function _setFrameHeight(height, frame_id){
      execForFrames(function(ifrm){
        if(ifrm.getAttribute('fixed-height') != 1) {
          var prev = parseInt(ifrm.style.height, 10),
            newHeight = height,
            event = document.createEvent("CustomEvent");

          if (height < prev && previousHeight[frame_id] !== height) { newHeight = prev;  }

          ifrm.style.height = newHeight + "px";

          // Fire off event only if height has changed
          if(previousHeight[frame_id] !== height) {
            event.initCustomEvent("tgb.embedHeight", true, true, { height: height, iframe: ifrm }); // Because IE
            window.dispatchEvent(event);
            frameHeightChange();
          }

          previousHeight[frame_id] = height;
        }
      }, frame_id);
    },

    tagboardAuthWindow,
    authRequested = function _authRequested(network, doConnect) {
      var top = (window.innerHeight / 2) - 300;
        left = (window.innerWidth / 2) - 400,
        authUrl = tgbDomain + "/u/auth_child?network=" + network + "&connect=" + (doConnect ? "1" : "");
      tagboardAuthWindow = window.open(authUrl, "tgbauthwin", "width=800,height=600,resizable=1,location=1,top="+top+",left="+left);
      // check for window open fail - i.e. pop-up blocker doing it's thing
      if (!tagboardAuthWindow) {
        return window.tagboardAuthComplete(false, "The sign-in window was blocked due to a popup blocker. Please allow it to be opened and try again.");
      }

      function checkChild() {
        if (tagboardAuthWindow.closed) {
          return window.tagboardAuthComplete(true);
        }
        setTimeout(checkChild, 500);
      }

      checkChild();
    },

    createModalIframe = function _createModalIframe() {
      if (document.getElementsByName('tagboard-modal').length) { return; }

      var ifrm = document.createElement("iframe"),
          style = document.createElement('style'),
          css = 'body.tgb-noscroll { height: 100%; overflow: hidden; }';

      ifrm.setAttribute("src", tgbDomain + "/embed-modal");
      ifrm.setAttribute("class", "tagboard-modal");
      ifrm.name="tagboard-modal";
      ifrm.setAttribute("style", "border:0; position:fixed !important; top:0 !important; left:0 !important; width:100% !important; height:100% !important; z-index:999999; display:none; visibility:hidden;");
      ifrm.setAttribute("scrolling", "no");
      ifrm.setAttribute("title", "Tagboard Social Post Details");
      document.getElementsByTagName("body")[0].appendChild(ifrm);

      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      document.getElementsByTagName('head')[0].appendChild(style);
    },

    insertIFrame = function _insertIFrame(div, options) {
      var opts = [],
        layout = "",
        embedID = embedIDs++;

      if (options.mobilePostCount) { opts.push('mpc=' + options.mobilePostCount); }
      if (options.postCount) { opts.push('pc=' + options.postCount); }
      if (options.layout) { layout = "/" + options.layout; }
      if (options.inlineMedia) { opts.push('im=' + !!options.inlineMedia); }
      if (options.inverted) { opts.push('in=' + !!options.inverted); }
      if (options.animationType) { opts.push('at=' + options.animationType); }
      if (options.toolbar) { opts.push('tb=' + options.toolbar); }
      if (options.mediaOnly) { opts.push('mo=' + !!options.mediaOnly); }
      if (options.feedType) { opts.push('ft=' + options.feedType); }
      if (options.hashtagColor) { opts.push('hc=' + options.hashtagColor); }
      if (options.fontColor) { opts.push('fc=' + options.fontColor); }
      if (options.bgColor) { opts.push('bc=' + options.bgColor); }
      if (options.roundedCorners) { opts.push('rc=' + !!options.roundedCorners); }
      if (options.infiniteScroll) { opts.push('is=' + !!options.infiniteScroll); }
      if (options.gutter) { opts.push('gutter=' + options.gutter); }
      if (options.nogutter) { opts.push('nogutter=' + !!options.nogutter); }
      if (options.disableHashtag) { opts.push('dh=' + !!options.disableHashtag); }
      if (options.largePostPosition) { opts.push('bp=' + options.largePostPosition); }
      if (options.widePostPosition) { opts.push('wp=' + options.widePostPosition); }
      if (options.disablePostModals) { opts.push('pm=' + !!options.disablePostModals); }
      if (options.enableCardLinks) { opts.push('cl=' + options.enableCardLinks); }
      if (options.showPartialRows) { opts.push('spr=' + !!options.showPartialRows); }
      if (options.inFrameModals) { opts.push('ifm=' + !!options.inFrameModals); }
      if (options.noPostModals) { opts.push('npm=' + !!options.noPostModals); }

      // Snapchat
      if (options.username) { opts.push('un=' + options.username); }
      if (options.snapcode) { opts.push('sc=' + options.snapcode); }

      // Hashtag battle
      if (options.battleHashtags) { opts.push('ht=' + options.battleHashtags); }
      if (options.battleColors) { opts.push('cl=' + options.battleColors); }
      if (options.cta) { opts.push('cta=' + options.cta); }
      if (options.battleLayout) { opts.push('lt=' + options.battleLayout); }
      if (options.units) { opts.push('ut=' + options.units); }
      if (options.startTime) { opts.push('st=' + options.startTime); }
      if (options.endTime) { opts.push('et=' + options.endTime); }

      opts.push('id='+embedID);
      opts = '#' + opts.join('&');

      var ifrm = document.createElement("IFRAME");
      ifrm.setAttribute("src", tgbDomain + "/" + options.tagboard + "/embed" + layout + opts);
      ifrm.setAttribute("onload", "tagboardIframeLoaded("+embedID+")");
      ifrm.setAttribute("class", "tagboard-iframe");
      ifrm.setAttribute("tgb-frame-id", embedID);
      ifrm.name="tagboard";
      ifrm.setAttribute("style", "border:0; width:100%;");
      ifrm.setAttribute("title", "Tagboard Social Content Web Display");
      if (options.fixedHeight) {
        ifrm.setAttribute("fixed-height", "1");
        ifrm.style.height = "100%";
      } else if (layout === "/filmstrip") {
        ifrm.style.height = "310px"; // Default initial height
        ifrm.style.width = "100px";
        ifrm.style.minWidth = "100%";
        ifrm.setAttribute("layout-name", "filmstrip");
        ifrm.setAttribute("scrolling", "no");
      } else {
        ifrm.style.height = "600px"; // Default initial height
        ifrm.setAttribute("scrolling", "no");
      }
      div.appendChild(ifrm);
    },

    handleFrameMessage = function _handleFrameMessage(e) {
      if (e.origin == tgbDomain) {
        var dataObj = {};
        e.data.split('&').forEach(function(e){
          var d = e.split(':');
          dataObj[d[0]] = d.length > 1 ? d[1] : d[0];
        });

        if (dataObj.height) {
          setFrameHeight(parseInt(dataObj.height), dataObj.frame_id);

          if(dataObj.height > 600) {

          }
        }

        if (dataObj.auth) {
          authRequested(dataObj.auth, dataObj.frame_id);
        }

        if (e.data === "tgbShowModalIframe") {
          document.getElementsByClassName('tagboard-modal')[0].style.display = 'block';
          document.getElementsByClassName('tagboard-modal')[0].style.visibility = 'visible';
          document.getElementsByTagName("body")[0].classList.add('tgb-noscroll');
        }
        if (e.data === "tgbHideModalIframe") {
          document.getElementsByClassName('tagboard-modal')[0].style.display = 'none';
          document.getElementsByClassName('tagboard-modal')[0].style.visibility = 'hidden';
          document.getElementsByTagName("body")[0].classList.remove('tgb-noscroll');
        }
        if(e.data.indexOf('tgbRemoveIframe') == 0) {
          var id = e.data.substr(e.data.indexOf(':')+1);
          var element = document.querySelector("iframe[tgb-frame-id='" + id + "']")
          element.parentNode.removeChild(element);
        }

        if(e.data.indexOf('tgbRefreshParent') == 0) {
          window.location.reload(true);
        }
      }
    };

  if (tgbDivs.length > 0) {
    tgbDivs.forEach(function(div){
      var options = {
        tagboard: div.getAttribute('tgb-slug'),
        layout: div.getAttribute('tgb-layout'),
        mobilePostCount: div.getAttribute('tgb-mobile-count'),
        postCount: div.getAttribute('tgb-post-count'),
        fixedHeight: div.getAttribute('tgb-fixed-height') === 'true',
        inlineMedia: div.getAttribute('tgb-inline-media') === 'true',
        inverted: div.getAttribute('tgb-inverted') === 'true',
        animationType: div.getAttribute('tgb-animation-type'),
        toolbar: div.getAttribute('tgb-toolbar'),
        mediaOnly: div.getAttribute('tgb-media-only') === 'true',
        feedType: div.getAttribute('tgb-feed-type'),
        hashtagColor: div.getAttribute('tgb-hashtag-color'),
        fontColor: div.getAttribute('tgb-font-color'),
        bgColor: div.getAttribute('tgb-bg-color'),
        gutter: div.getAttribute('tgb-gutter'),
        nogutter: div.getAttribute('tgb-no-gutter') === 'true',
        roundedCorners: div.getAttribute('tgb-rounded-corners') === 'true',
        infiniteScroll: div.getAttribute('tgb-infinite-scroll') === 'true',
        disableHashtag: div.getAttribute('tgb-disable-hashtag') === 'true',
        largePostPosition: div.getAttribute('tgb-large-position'),
        widePostPosition: div.getAttribute('tgb-wide-position'),
        disablePostModals: div.getAttribute('tgb-disable-modals') === 'true',
        enableCardLinks: div.getAttribute('tgb-enable-card-links') === 'true' || div.getAttribute('tgb-enable-card-links') === null,
        showPartialRows: div.getAttribute('tgb-show-partial-rows') === 'true',
        inFrameModals: div.getAttribute('tgb-in-frame-modals') === 'true',
        username: div.getAttribute('tgb-username'),
        snapcode: div.getAttribute('tgb-snapcode'),
        battleHashtags: div.getAttribute('tgb-hashtags'),
        battleColors: div.getAttribute('tgb-colors'),
        cta: div.getAttribute('tgb-cta'),
        battleLayout: div.getAttribute('tgb-battle-layout'),
        units: div.getAttribute('tgb-units'),
        startTime: div.getAttribute('tgb-start-time'),
        endTime: div.getAttribute('tgb-end-time'),
        noPostModals: div.getAttribute('tgb-no-post-modals') === 'true'
      };

      if (options.tagboard && !div.getAttribute('tgb-built-iframe')) {
        insertIFrame(div, options);
        div.setAttribute('tgb-built-iframe', "1");
      }
    });
  } else {
    con.error("Tagboard script expected DIV with class: 'tagboard-embed'");
    return;
  }

  window.tagboardIframeLoaded = function iframeLoaded(frame_id) {
    if (document.getElementsByClassName('tagboard-iframe').length === ++iframesLoaded) {
      createModalIframe();
    }

    execForFrames(function(ifrm){
      ifrm.contentWindow.postMessage('location:' + JSON.stringify(window.location), tgbDomain);
      ifrm.contentWindow.postMessage('height?', tgbDomain);
      resizeFinished(frame_id);
      scrollFinished(frame_id);
    }, frame_id);
  };

  window.tagboardAuthComplete = function _tagboardAuthComplete(success, failMessage) {
    var authMessage = ["authComplete", success ? "1" : "", failMessage].join(":");
    // close the auth child window
    tagboardAuthWindow && typeof tagboardAuthWindow.close === "function" && tagboardAuthWindow.close();
    // notify the embed of the auth status

    execForFrames(function(ifrm){
      ifrm.contentWindow.postMessage(authMessage, tgbDomain);
    });
  };

  window.handleFrameMessage = handleFrameMessage;
  window.pageResized = pageResized;
  window.pageScrolled = pageScrolled;

  window.addEventListener('message', window.handleFrameMessage, false);
  window.addEventListener('resize', window.pageResized, false);
  window.addEventListener('scroll', window.pageScrolled, false);

  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    window.addEventListener('resize', function() {
      execForFrames(function(ifrm){
        if( ifrm.getAttribute('layout-name') !== "filmstrip" ) {
          ifrm.style.width = ifrm.parentNode.clientWidth + "px";
          setTimeout(function(){ ifrm.style.width = "100%"; }, 250);
        }
      });
    }, true);
  }

})(window);
