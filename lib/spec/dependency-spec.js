var Util = require('cts/util');

var DependencySpec = function(kind, url, loadedFrom) {
  this.kind = kind;
  this.url = url;
  this.loadedFrom = loadedFrom;
  this.loaded = false;
};

DependencySpec.prototype.load = function(cb) {
  var self = this;
  var url = Util.Net.fixRelativeUrl(this.url, this.loadedFrom);
  if (this.loaded == false) {
    if (this.kind == 'css') {
      this.loaded = true;
      var link = document.createElement('link')
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('type', 'text/css');
      link.setAttribute('href', url);
      if (CTS && CTS.engine && CTS.engine.forrest) {
        CTS.engine.forrest.dependencyLoading(self);
      }
      link.onload = function() {
        if (CTS && CTS.engine && CTS.engine.forrest) {
          CTS.engine.forrest.dependencyLoaded(self);
        }
        if (typeof cb != 'undefined') {
          cb(self);
        }
      }
      document.getElementsByTagName('head')[0].appendChild(link);
    } else if (this.kind == 'js') {
      this.loaded = true;
      var script = document.createElement('script')
      script.setAttribute('type', 'text/javascript');
      script.setAttribute('src', url);
      if (CTS && CTS.engine && CTS.engine.forrest) {
        CTS.engine.forrest.dependencyLoading(self);
      }      
      script.onload = function() {
        if (CTS && CTS.engine && CTS.engine.forrest) {
          CTS.engine.forrest.dependencyLoaded(self);
        }
        if (typeof cb != 'undefined') {
          cb(self);
        }
      }
      document.getElementsByTagName('head')[0].appendChild(script);
    } else if (this.kind == 'cts') {
      // Ignore
    } else {
      Util.Log.Error("DependencySpec: Unsure how to load: ", this.kind, url);
    }
  } else {
    Util.Log.Warn("DependencySpec: Not loading already loaded", this.kind, url);
  }
};

DependencySpec.prototype.unload = function() {
  if (this.loaded) {
    var url = Util.Net.fixRelativeUrl(this.url, this.loadedFrom);
    if (this.kind == 'css') {
      var links = document.getElementsByTagName('link');
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (typeof link.attributes != "undefined") {
          if (typeof link.attributes["href"] != "undefined") {
            if (link.attributes["href"].value == url) {
              link.parentNode.removeChild(link);
              this.loaded = false;
            }
          }
        }
      }

    } else if (this.kind == 'js') {
      // Can't unload a JS link.
    }
  } else {
    Util.Log.Warn("Tried to unload DependencySpec that wasn't loaded", this);
  }
};

module.exports = DependencySpec;
