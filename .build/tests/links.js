var fs = require('fs');
var http = require('http');
var utils = require('utils');

var env = fs.read('./.env');
var baseUrl = env.match(/URL=.*/g)[0].slice(4);
var apiKey = env.match(/API_KEY=(.*)/g)[0].slice(8);
var password = env.match(/PASSWORD=(.*)/g)[0].slice(9);
var apiRequestBaseUrl = 'https://' + apiKey + ':' + password + '@' + baseUrl + '/admin';

var gitConfig = fs.read('./.git/config');
var repoUrl = gitConfig.match(/\[remote "beanstalk"\]\n.*url = (.*)/)[1];
var repoId = repoUrl.match(/.*\/(.*)\.git/)[1];

var testingThemeId = '';
var homepageUrl = 'http://' + baseUrl;
var productPageUrl = '';
var collectionPageUrl = '';

var urls = [];
var products = [];

casper.test.setUp(function (done) {
  casper.start()
  .then(function () {
    this.echo('Starting test setup.');
  })
  .thenOpen('http://captain-webhook.herokuapp.com/sites/' + repoId, function () {
    this.echo('Getting testing theme id.');
    testingThemeId = '?preview_theme_id=' + JSON.parse(this.getPageContent()).testingThemeId;
  })
  .thenOpen(apiRequestBaseUrl + '/products.json?limit=250&published_status=published', function () {
    this.echo('Getting product data.');
    products = JSON.parse(this.getPageContent()).products;
    productPageUrl = 'http://' + baseUrl + '/products/' + products[0].handle;
  })
  .then(function () {
    this.echo('Getting collection data.');
    collectionPageUrl = 'http://' + baseUrl + '/collections/all';
  })
  .thenOpen(homepageUrl + testingThemeId, function () {
    this.echo('Getting homepage urls.');
    var hrefs = this.getElementsAttribute('a', 'href').filter(function (url) {
      return url.search(/^(https?:)?(\/\/).*/) !== -1;
    }).map(function (url) {
      return (url.search(/^https?:/) !== -1) ? url : 'http:' + url;
    });
    urls = urls.concat(hrefs);
  })
  .thenOpen(productPageUrl + testingThemeId, function () {
    this.echo('Getting product page urls.');
    var hrefs = this.getElementsAttribute('a', 'href').filter(function (url) {
      return url.trim() !== '' && url.trim()[0] !== '#' && url.indexOf("mailto:") === -1;
    }).map(function (url) {
      if (url.indexOf('//') === 0) {
        return 'http:' + url;
      } else if (url.indexOf('/') === 0) {
        return homepageUrl + url;
      } else if (url.indexOf('http') === 0 || url.indexOf('www') === 0) {
        return url;
      } else {
        return homepageUrl + '/' + url;
      }
    });
    urls = urls.concat(hrefs);
  })
  .then(function () {
    urls = utils.unique(urls);
  })
  .then(function () {
    this.echo('Finished test setup.');
  })
  .run(done);
});

casper.test.begin('All external links return 200 http status codes.', function suite(test) {
  casper.start();

  casper.then(function () {
    this.echo('Checking ' + urls.length + ' urls...');
  });

  casper.eachThen(urls, function (response) {
    var url = response.data;
    this.thenOpen(url, function (response) {
      this.echo('Opening: ' + url);
      test.assertHttpStatus(200);
    });
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.tearDown(function () {
  urls = [];
});
