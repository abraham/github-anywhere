#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import urlfetch
from django.utils import simplejson as json

base = 'https://github.com/login/oauth/access_token'
client_id = '?client_id='
redirect_url = '&redirect_uri=https://githubanywhere.appspot.com/callback.html'
client_secret = '&client_secret='

class MainHandler(webapp.RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write('Hello world!')

class APIv0LoginOauthAccessTokenHandler(webapp.RequestHandler):
  def post(self):
    self.response.headers['Content-Type'] = 'text/plain'
#    self.response.out.write('APIv0UserFollowHandler\n')
    user = GetUserFromPath(self.request.path)
    code = self.request.get('code')
    url = base + client_id + redirect_url + client_secret + '&code=' + code
    result = urlfetch.fetch(url, None, 'POST')
    self.response.out.write(result.content)

class APIv0Handler(webapp.RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'application/json'
    # self.response.out.write('APIv0Handler\n')
    url = 'https://github.com/api/v2/json' + self.request.path
    access_token = self.request.get('access_token')
    if access_token:
      url += '?access_token=' + access_token
    result = urlfetch.fetch(url, None, 'GET')
    self.response.out.write(result.content)
  def post(self):
    self.response.headers['Content-Type'] = 'application/json'
    # self.response.out.write('APIv0UserFollowHandler\n')
    url = 'https://github.com/api/v2/json' + self.request.path
    access_token = self.request.get('access_token')
    if access_token:
      url += '?access_token=' + access_token
    result = urlfetch.fetch(url, None, 'POST')
    self.response.out.write(result.content)


def GetUserFromPath(path, element = 3):
  return path.split('/')[element]

def main():
  application = webapp.WSGIApplication([
      ('/', MainHandler),
      ('/login/oauth/access_token', APIv0LoginOauthAccessTokenHandler),
      ('/.*', APIv0Handler),
    ],
    debug=True)
  util.run_wsgi_app(application)


if __name__ == '__main__':
  main()