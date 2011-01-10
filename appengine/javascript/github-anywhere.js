(function () {
  var G = {},
  callback = false,
  rpc = false,
  loading = {
    jQuery: false,
    easyXDM: false,
    style: false
  },
  callback = function () {},
  config = {
    xdrURL: 'https://githubanywhere.appspot.com/xdr.html',
    clientID: '',
    redirectURI: 'https://githubanywhere.appspot.com/callback.html',
    scope: 'user,public_repo,gist',
    easyXDMSource: 'https://githubanywhere.appspot.com/javascript/easyXDM.min.js',
    jQuerySource: 'https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js',
    styleSource: 'https://githubanywhere.appspot.com/style/style.css'
  };

  if (typeof window.GitHubAnywhere !== 'function') {
    console.log('Adding GitHubAnywhere to window');
    window.GitHubAnywhere = GHA;
  }
  
  if (typeof window.jQuery !== 'function') {
    load();
  }
  
  function GHA(c) {
    console.log('GHA()');
    callback = c;
  }
  
  function load() {
    console.log('load()');
    var head = document.getElementsByTagName('head').item(0), script, link;
    if (typeof window.jQuery !== 'function' || typeof window.easyXDM !== 'object') {
      if (!loading.jQuery) {
        loading.jQuery = true;
        script = document.createElement("script");
        script.src = config.jQuerySource;
        head.appendChild(script); 
      }
      if (!loading.easyXDM) {
        loading.easyXDM = true;
        script = document.createElement("script");
        script.src = config.easyXDMSource;
        head.appendChild(script);
      }
      if (!loading.style) {
        loading.style = true;
        link = document.createElement("link");
        link.rel = 'stylesheet';
        link.href = config.styleSource;
        head.appendChild(link);        
      }
      setTimeout(load, 50);
    } else {
      init();
    }
  }
  
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
    callback(G);
    callback = false;
  }

  G.buttons = function (selector) {
    console.log('G.buttons()');
    scanPage(selector);
  }
  
  function scanPage(selector) {
    console.log('scanPage()');
    var $github, $link, user, repo, selector = selector ? selector : 'a.github-anywhere', following = JSON.parse(get('following'));

    $github = $(selector);
    $github.each(function () {
      var $this = $(this);
      if ($this.hasClass('github-anywhere-watch')) {
        $this.html("<span><span class='github-anywhere-icon'></span>" + $this.html() + '</span>');
        if (get('watching_' + $this.attr('data-user') + '/' + $this.attr('data-repo'))) {
          $this.addClass('github-anywhere-enabled')
          $this.find('span').html('<span class="github-anywhere-icon"></span>Unwatch ' + $this.attr('data-user') + '/' + $this.attr('data-repo') + ' on GitHub');
        } else {
          $this.removeClass('github-anywhere-enabled')
          $this.find('span').html('<span class="github-anywhere-icon"></span>Watch ' + $this.attr('data-user') + '/' + $this.attr('data-repo') + ' on GitHub');
        }
      } else {
        $this.html('<span>' + $this.html() + '</span>');
        if ($.inArray($this.attr('data-user'), following) !== -1) {
          $this.addClass('github-anywhere-enabled')
          $this.children().text('Unfollow ' + $this.attr('data-user') + ' on GitHub');
        }
      }
    });
    $github.addClass('github-anywhere-minibutton')
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
          set('nextAction', JSON.stringify({ action: 'toggle', type: 'repo', target: { repo: repo, user: user } }));
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
  
  function startAuthentication() {
    console.log('startAuthentication()');
    var url, child;
    url = 'https://github.com/login/oauth/authorize?client_id=' + config.clientID + '&redirect_uri=' + config.redirectURI + '&scope=' + config.scope;
    child = window.open(url, '', 'width=975,height=600');
    checkForCode();
    return false;
  }

  function completeAuthentication(options) {
    console.log('completeAuthentication()');
    set('accessToken', options.accessToken);
    performNextAction();
  };

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

  function performNextAction() {
    console.log('performNextAction()');
    var nextAction;
    if (get('nextAction')) {
      nextAction = JSON.parse(get('nextAction'));
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
        $link.removeClass('github-anywhere-enabled')
        $link.children().text('Follow ' + user + ' on GitHub');
        set('following', JSON.stringify(response.users));
      }, function (errorObj){
        
      });
    } else {
      rpc.post({ path: '/user/follow/' + user, parameters: { access_token: get('accessToken') } }, function (response){
        console.log('rpc.post(user/follow)');
        $link.addClass('github-anywhere-enabled')
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
        $link.removeClass('github-anywhere-enabled')
        $link.find('span').html('<span class="github-anywhere-icon"></span>Watch ' + user + '/' + repo + ' on GitHub');
        remove('watching_' + response.repository.owner + '/' + response.repository.name);
      }, function (errorObj){
        
      });
    } else {
      rpc.post({ path: '/repos/watch/' + user + '/' + repo, parameters: { access_token: get('accessToken') } }, function (response){
        console.log('rpc.post(repos/watch)');
        $link.addClass('github-anywhere-enabled')
        $link.find('span').html('<span class="github-anywhere-icon"></span>Unwatch ' + user + '/' + repo + ' on GitHub');
        set('watching_' + response.repository.owner + '/' + response.repository.name, true);
      }, function (errorObj){
        
      });
    }
  }

  function get(key) {
    console.log('get()');
    return localStorage.getItem(key) && localStorage.getItem(key) != 'undefined' ? localStorage.getItem(key) : false;
  }

  function set(key, value) {
    console.log('set()');
    localStorage.setItem(key, value);
    localStorage.setItem(key + 'Time', time());
  }
  
  function remove(key) {
    console.log('remove()');
    localStorage.removeItem(key);
    localStorage.removeItem(key + 'Time');
  }
  
  function time() {
    console.log('time()');
    var d = new Date();
    return d.getTime();
  }
})();