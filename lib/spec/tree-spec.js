var Util = require('cts/util');

var TreeSpec = function(kind, opts) {
  this.kind = kind;
  // name, url, loadedFrom, fixLinks
  this.fixLinks = true;
  this.loadedFrom = null;
  this.name = null;
  this.url = null;
  this.opts = {};
  Util._.extend(this, opts);
};

module.exports = TreeSpec;
