(function () {
  var G = {},
      rpc = false,
      loaded = {
        jQuery: typeof window.jQuery === 'function' || false,
        easyXDM: typeof window.easyXDM === 'object' || false,
        style: false
      },
      readyQueue = [],
      config = {
        xdrURL: 'https://githubanywhere.appspot.com/xdr.html',
        clientID: '605fdb0289347957e1b1',
        redirectURI: 'https://githubanywhere.appspot.com/callback.html',
        scope: 'user,public_repo,gist',
        easyXDMSource: 'https://githubanywhere.appspot.com/javascript/easyXDM.min.js',
        jQuerySource: 'https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js',
        styleSource: 'https://githubanywhere.appspot.com/style/style.css'
      };
  
  // Fix issues with browsers that don't have consoles enabled.
  if (!('console' in window)) {
    window.console = {
      log: function () {},
      info: function () {},
      error: function () {}
    };
  }
  
  function GHA(callback) {
    console.log('GHA()');
    ready(callback);
  }
  
  function ready(callback) {
    console.log('ready()');
    if (externalIsLoaded()) {
      $(document).ready(function () {
        callback(G);
      });
    } else {
      readyQueue.push(callback);
    }
  };
  
  if (typeof window.GitHubAnywhere === 'function') {
    // GitHubAnywhere already loaded for whatever reason.
    return;
  } else {
    console.log('Adding GitHubAnywhere to window');
    window.GitHubAnywhere = GHA;
    
    load();
  }
  
  function load() {
    console.log('load()');
    var head = document.getElementsByTagName('head')[0];
    
    if (!loaded.jQuery) {
      appendScript({
        source: 'jQuerySource',
        name: 'jQuery',
        head: head
      });
    }
    
    if (!loaded.easyXDM) {
      appendScript({
        source: 'easyXDMSource',
        name: 'easyXDM',
        head: head
      });
    }
    
    if (!loaded.style) {
      console.log('Stylesheet finished loading');
      var s = document.createElement('link');
      s.rel = 'stylesheet';
      s.href = config.styleSource;
      loaded.style = true;
      
      head.appendChild(s);
    }
    
    finishedLoad();
  }
  
  /**
   *  Appends a script elemnt to <head>.
   *  @param {object} options containing parameters of:
   *    @param {string} source url from Config
   *    @param {string} name of script being loaded
   *    @param {object} head element to append script to
   *  @private
   */
  function appendScript(options) {
    console.log('appendScript()');
    var script = document.createElement('script');
    script.src = config[options.source];// easyXDMSource;
    script.onload = function () {
      loaded[options.name] = true;
      console.log(options.name + ' finished loading');
      finishedLoad();
    };
    options.head.appendChild(script);
  }
  
  /**
   *  Checks to see if all scripts and stylesheets have loaded.
   *  @returns {boolean}
   *  @private
   */
  function externalIsLoaded() {
    console.log('externalIsLoaded()');
    return loaded.jQuery && loaded.easyXDM && loaded.style;
  }
  
  /**
   *  If externals have loaded fire init()
   *  @private
   */
  function finishedLoad() {
    console.log('finishedLoad()');
    if (externalIsLoaded()) {
      init();
    }
  }
  
  /**
   *  Create an easyXDM provider if none exist and fire any queued functions.
   *  @private
   */
  function init() {
    console.log('init()');
    if (!rpc) {
      rpc = new easyXDM.Rpc({
        remote: config.xdrURL
      }, 
      {
        local: {
          get: function (successCallback, errorCallback) {},
          post: function (successCallback, errorCallback) {},
          startAuthentication: function (successCallback, errorCallback) {},
          completeAuthentication: function (options, successCallback, errorCallback) {}
        },
        remote: {
          get: {},
          post: {},
          startAuthentication: {},
          completeAuthentication: {}
        }
      });
    }

    if (readyQueue.length > 0) {
      $.each(readyQueue, function (index, Fn) {
        Fn(G);
      });
    }
  }

  /**
   *  Starts a scan of the page for GHA buttons.
   *  @param {string} selector for jQuery to find
   */
  G.buttons = function (selector) {
    console.log('G.buttons()');
    scanPage(selector);
  }
  
  /**
   *  Scans the page for GHA classes to attach appropriate actions.
   *  @param {string} selector for jQuery to find
   *  @default {string} 'a.github-anywhere'
   *  @private
   */
  function scanPage(selector) {
    console.log('scanPage()');
    var $github, $link, user, repo,
        selector = selector ? selector : 'a.github-anywhere',
        following = JSON.parse(get('following'));

    $github = $(selector);
    $github.each(function () {
      var $this = $(this);
      if ($this.hasClass('github-anywhere-watch')) {
        $this.html("<span><span class='github-anywhere-icon'></span>" + $this.html() + '</span>');
        if (get('watching_' + $this.attr('data-user') + '/' + $this.attr('data-repo'))) {
          $this.addClass('github-anywhere-enabled');
          $this.find('span').html('<span class="github-anywhere-icon"></span>Unwatch ' + $this.attr('data-user') + '/' + $this.attr('data-repo') + ' on GitHub');
        } else {
          $this.removeClass('github-anywhere-enabled');
          $this.find('span').html('<span class="github-anywhere-icon"></span>Watch ' + $this.attr('data-user') + '/' + $this.attr('data-repo') + ' on GitHub');
        }
      } else {
        $this.html('<span>' + $this.html() + '</span>');
        if ($.inArray($this.attr('data-user'), following) !== -1) {
          $this.addClass('github-anywhere-enabled');
          $this.children().text('Unfollow ' + $this.attr('data-user') + ' on GitHub');
        }
      }
    });
    $github.addClass('github-anywhere-minibutton');
    $github.click(function () {
      console.log('click()');
      $link = $(this);
      user = $link.attr('data-user');
      repo = $link.attr('data-repo');
      if (user && !repo) {
        if (get('accessToken')) {
          toggleFollowing({ selection: $link });
        } else {
          set('nextAction', JSON.stringify({ action: 'toggle', type: 'user', target: user }));
          startAuthentication();
        }
      } else if (user && repo) {
        if (get('accessToken')) {
          toggleWatching({ selection: $link });
        } else {
          set('nextAction', JSON.stringify({
            action: 'toggle',
            type: 'repo',
            target: {
              repo: repo,
              user: user
            }
          }));
          startAuthentication();
        }
      }
      return false;
    })

    $('a.github-anywhere-minibutton').bind({
      mousedown: function () {
        $(this).addClass('github-anywhere-mousedown');
      },
      blur: function () {
        $(this).removeClass('github-anywhere-mousedown');
      },
      mouseup: function () {
        $(this).removeClass('github-anywhere-mousedown');
      }
    });
  }
  
  /**
   *  Opens a popup to github.com to authenticate user and starts checkForCode loop.
   *  @returns {boolean}
   *  @default {boolean} false
   *  @private 
   */
  function startAuthentication() {
    console.log('startAuthentication()');
    var child,
        url = 'https://github.com/login/oauth/authorize';
    url += '?client_id=' + config.clientID + '&redirect_uri=' + config.redirectURI + '&scope=' + config.scope;
    child = window.open(url, '', 'width=975,height=600');
    checkForCode();
    return false;
  }

  /**
   *  User has finished authentication flow so perform action delayed for authentication.
   *  @private
   */
  function completeAuthentication(options) {
    console.log('completeAuthentication()');
    set('accessToken', options.accessToken);
    performNextAction();
  };

  /**
   *  Checks to see if user has copmleted auth flow every 500 ms.
   *  @param {object} options passed from github if auth failed
   *  @private
   */
  function checkForCode(options) {
    console.log('checkForCode()');
    if (options && options.message && options.message.error) {
      // GitHub returned an error

    } else {
      rpc.completeAuthentication(completeAuthentication, function () {
        setTimeout(checkForCode, 500, options);
      });
    }
  }

  /**
   *  Authentication flow has finished so perform action started when unauthenticated.
   *  @private
   */
  function performNextAction() {
    console.log('performNextAction()');
    var nextAction = get('nextAction');
    if (nextAction) {
      nextAction = JSON.parse(nextAction);
      remove('nextAction');
      switch (nextAction.type) {
        case 'user':
          $('a.github-anywhere[data-user="' + nextAction.target + '"]:first').click();
          break;
        case 'repo':
          $('a.github-anywhere[data-repo="' + nextAction.target.repo + '"][data-user="' + nextAction.target.user + '"]:first').click();
          break;
      }
    }
  }

  function isFollowing(user) {
    var following = localStorage['github_anywhere_cache_["user/show/' + user + '/following"]'];
    if (!following) {
      rpc.following(user, function (response){

      }, function (errorObj){

      });
    }
  }

  function updateFollowing(user) {
    rpc.following(user, function (response){
      localStorage['github_anywhere_cache_["user/show/' + user + '/following"]'] = JSON.stringify(response);
    }, function (errorObj){
      
    });
  }

  function getFollowing(user) {
    return JSON.parse(localStorage['github_anywhere_cache_["user/show/' + user + '/following"]']);
  }

  function toggleFollowing(options) {
    console.log('toggleFollowing()');
    var $link = $(options.selection), user = $link.attr('data-user');
    if ($link.hasClass('github-anywhere-enabled')) {
      rpc.post({ path: '/user/unfollow/' + user, parameters: { access_token: get('accessToken') } }, function (response){
        console.log('rpc.post(user/unfollow)');
        $link.removeClass('github-anywhere-enabled');
        $link.children().text('Follow ' + user + ' on GitHub');
        set('following', JSON.stringify(response.users));
      }, function (errorObj){
        
      });
    } else {
      rpc.post({ path: '/user/follow/' + user, parameters: { access_token: get('accessToken') } }, function (response){
        console.log('rpc.post(user/follow)');
        $link.addClass('github-anywhere-enabled');
        $link.children().text('Unfollow ' + user + ' on GitHub');
        set('following', JSON.stringify(response.users));
      }, function (errorObj){
        
      });
    }
  }

  function toggleWatching(options) {
    console.log('toggleWatching()');
    var $link = $(options.selection), user = $link.attr('data-user'), repo = $link.attr('data-repo');
    if ($link.hasClass('github-anywhere-enabled')) {
      rpc.post({ path: '/repos/unwatch/' + user + '/' + repo, parameters: { access_token: get('accessToken') } }, function (response){
        console.log('rpc.post(repos/unwatch)');
        $link.removeClass('github-anywhere-enabled');
        $link.find('span').html('<span class="github-anywhere-icon"></span>Watch ' + user + '/' + repo + ' on GitHub');
        remove('watching_' + response.repository.owner + '/' + response.repository.name);
      }, function (errorObj){
        
      });
    } else {
      rpc.post({ path: '/repos/watch/' + user + '/' + repo, parameters: { access_token: get('accessToken') } }, function (response){
        console.log('rpc.post(repos/watch)');
        $link.addClass('github-anywhere-enabled');
        $link.find('span').html('<span class="github-anywhere-icon"></span>Unwatch ' + user + '/' + repo + ' on GitHub');
        set('watching_' + response.repository.owner + '/' + response.repository.name, true);
      }, function (errorObj){
        
      });
    }
  }

  /**
   *  Get value from localStorage.
   *  @param {string} key of value to get
   *  @returns {mixed} value
   *  @default {boolean} false
   *  @private
   */
  function get(key) {
    console.log('get()');
    return localStorage.getItem('gitHubAnywhere_' + key) && localStorage.getItem('gitHubAnywhere_' + key) != 'undefined' ? localStorage.getItem('gitHubAnywhere_' + key) : false;
  }

  /**
   *  Set value to localStorage.
   *  @param {string} key of value to set
   *  @param {mixed} value to set
   *  @private
   */
  function set(key, value) {
    console.log('set()');
    localStorage.setItem('gitHubAnywhere_' + key, value);
    localStorage.setItem('gitHubAnywhere_' + key + 'Time', getTime());
  }
  
  /**
   *  Remove key and value from localStogae.
   *  @param {string} key of value to remove
   *  @private
   */
  function remove(key) {
    console.log('remove()');
    localStorage.removeItem('gitHubAnywhere_' + key);
    localStorage.removeItem('gitHubAnywhere_' + key + 'Time');
  }
  
  /**
   *  Get the current time in milliseconds.
   *  @returns {integer}
   *  @private
   */
  function getTime() {
    console.log('getTime()');
    var d = new Date();
    return d.getTime();
  }
})();