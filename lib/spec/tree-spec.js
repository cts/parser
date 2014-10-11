var Util = require('cts/util');

var TreeSpec = function(kind, args, opts) {

  // @KIND ARG1 ... ARGN {OPTS}
  this.kind = kind;
  this.args = args;
  this.opts = {};
  Util._.extend(this, opts);

  // Parser overloads some opts. This is bad.
  // TODO: Make parser stop overloading opts!!

  // name, url, loadedFrom, fixLinks
  this.fixLinks = true;
  this.loadedFrom = null;
  this.name = null;
  if (args && args.name) {
    this.name = args.name;
  }
  this.url = null;
  if (args && args.url) {
    this.url = args.url;
  }
};

module.exports = TreeSpec;
