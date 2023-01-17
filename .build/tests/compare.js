var fs         = require('fs');
var utils      = require('utils');
var webpage    = require('webpage');
var phantomcss = require('../../node_modules/phantomcss/phantomcss.js');

var baseUrl = fs.read('./.env').match(/URL=.*/g)[0].slice(4);
var repoId = fs.read('./.git/config').match(/\[remote "beanstalk"\]\n.*\/(.*)\.git/)[1];

var testingThemeId = '';
var productPageUrl = '';

var mocks = [];

phantomcss.init({
  libraryRoot: fs.absolute( fs.workingDirectory + '/node_modules/phantomcss' ),
  screenshotRoot: './test/screenshots',
  failedComparisonsRoot: false,
  addIteratorToImage: false,
  mismatchTolerance: 0.00,
  rebase: casper.cli.get("rebase")
});

casper.test.setUp(function (done) {
  casper.start()
  .thenOpen('http://captain-webhook.herokuapp.com/sites/' + repoId, function () {
    this.echo('Getting testing theme id.');
    testingThemeId = JSON.parse(this.getPageContent()).testingThemeId;
  })
  .then(function () {
    this.echo('Clearing test/screenshots/ directory.');
    fs.list('./test/screenshots/').forEach(function (file) {
      if (fs.isFile('./test/screenshots/' + file)) {
        fs.remove('./test/screenshots/' + file);
      }
    });
  })
  .then(function () {
    this.echo('Getting information from mocks.');
    mocks = fs.list('./test/mocks/').filter(function (file) {
      return fs.isFile('./test/mocks/' + file);
    }).map(function (file) {
      var parts = file.replace('.' + utils.fileExt(file), '').split('.');
      var page = webpage.create();
      var imgSize = {};
      var url = 'file://' + fs.workingDirectory +  '/test/mocks/' + file;
      page.open(url, function () {
        var size = page.evaluate(function(selector) {
          return {
            width: document.querySelector(selector).naturalWidth,
            height: document.querySelector(selector).naturalHeight
          };
        }, 'img');
        imgSize.width = size.width;
        imgSize.height = size.height;
      });
      return {
        size: imgSize,
        file: file,
        filePath: url,
        device: parts[0],
        template: parts[1],
        handle: parts[2],
        alternateTemplate: parts[3] || false
      };
    });
  })
  .run(done);
});

casper.test.begin('Create comparison images.', function suite(test) {
  casper.start();

  casper.then(function () {
    this.echo('Comparing screenshots to mocks...');
  });

  casper.eachThen(mocks, function (response) {
    var mock = response.data;
    var urlBase = 'http://' + baseUrl + '/' + mock.template + '/' + mock.handle + '?preview_theme_id=' + testingThemeId;
    var url = (mock.alternateTemplate === false) ? urlBase : urlBase + '&view=' + mock.alternateTemplate;

    this.thenOpen(url);

    this.viewport(mock.size.width, mock.size.height);

    this.then(function () {
      phantomcss.screenshot('body', mock.file.replace('.png', ''));
    });

    this.then(function () {
      phantomcss.compareFiles('./test/mocks/' + mock.file, './test/screenshots/' + mock.file);
    });
  });

  casper.run(function() {
    casper.test.done();
  });
});
