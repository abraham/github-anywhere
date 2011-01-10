GitHub Anywhere
===============

An experimental JavaScript platform for adding GitHub follow, watch, and fork widgets to any site with a simple HTML snippet. You can try out a demo on <http://abraham.github.com/github-anywhere>.

Warning
-------

GHA is alpha quality. It may break things and could have security vulnerabilities. Use at your own risk.

Using GHA
---------

To add GHA to your site add the following snippet inside of the `<head>` section of your page.
  
    <script src='https://githubanywhere.appspot.com/github-anywhere.js'></script>
    <script>
      GitHubAnywhere(function(G) {
       G.buttons();
      });
    </script>

Adding the following links to your page will create a user follow button and a watch repo button. Be sure to replace `:user` with the GitHub username and `:repo` with the repository name.

    <a href='http://github.com/:name' class='github-anywhere' data-user=':name'>Follow :name on GitHub</a>
    <a href='http://github.com/:name/:repo' class='github-anywhere github-anywhere-watch' data-user=':name' data-repo=':repo'>Watch :name/:repo on GitHub</a>

For example a follow button for `abraham` would look like this:

    <a href='http://github.com/abraham' class='github-anywhere' data-user='abraham'>Follow abraham on GitHub</a>

Support
-------

If you find bugs or have any feature requests please [let us know](https://github.com/abraham/github-anywhere/issues).

Browser support
---------------

While GHA is primarily tested in Google Chrome it should work in any modern browser with localStorage support.

Hacking
-------

Interested in hosting your own version or participating in the development? The code is hosted on [GitHub](https://github.com/abraham/github-anywhere) under an MIT license. Feel free to fork, hack, and generally tear apart the code. Be sure to jump into the [Google Group](https://groups.google.com/forum/#!forum/github-anywhere) and say hi!

Credits
-------

The proxy for the [GitHub API](http://develop.github.com/) is hosted on [Google App Engine](http://code.google.com/appengine/). The platform uses [easyXDM](http://easyxdm.net/), [jQuery](http://jquery.com/) and [David Walsh's buttons](http://davidwalsh.name/github-css).

Authors
-------

GHA is maintained by:

Abraham Williams - @[abraham](https://twitter.com/abraham) - <the@abrha.am> - <http://abrah.am>