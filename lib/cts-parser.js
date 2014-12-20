var Util = require('cts/util');
var RelationSpec = require('./spec/relation-spec');
var DependencySpec = require('./spec/dependency-spec');
var SelectionSpec = require('./spec/selection-spec');
var TreeSpec = require('./spec/tree-spec');
var ForrestSpec = require('./spec/forrest-spec');

var CtsParserImpl = {

  parse: function(str) {

    // First, remove all comments
    str = CtsParserImpl.RemoveComments(str);

    var i = 0;
    var c;
    var relations = [];
    var ats = [];
    while (i < str.length) {
      c = str[i];
      if ((c == ' ') || (c == '\n') || (c == '\t') || (c == '\r')) {
        i++;
      } else if (c == "@") {
        tup = CtsParserImpl.AT(str, i+1);
        i = tup[0];
        ats.push(tup[1]);
      } else {
        tup = CtsParserImpl.RELATION(str, i);
        i = tup[0];
        relations.push(tup[1]);
      }
    }
    var r = {headers: ats, relations: relations};
    return r;
  },

  RemoveComments: function(str) {
    var inQuestion = str;
    var lastChar = '';
    var i = 0;
    var inComment = false;
    var commentOpen = null;
    // no nesting allowed
    while (i < inQuestion.length) {
      if (! inComment) {
        if ((inQuestion[i] == '*') && (lastChar == '/')) {
          inComment = true;
          commentOpen = i-1;
        }
        lastChar = inQuestion[i];
      } else {
        if ((inQuestion[i] == '/') && (lastChar == '*')) {
          var prefix = inQuestion.substring(0, commentOpen);
          inQuestion = prefix + " " + inQuestion.substring(i+1);
          inComment = false;
          i = i - (i - commentOpen) + 1;
          commentOpen = null;
          lastChar = '';
        } else {
          lastChar = inQuestion[i];
        }
      }
      i++;
    }
    if (inComment) {
      inQuestion = inQuestion.substring(0, commentOpen);
    }
    return inQuestion;
  },

  /* Can take the form:
   *   @string string2 string3 ... stringN { optional: args } ;
   */
  AT: function(str, i) {
    var start = i;
    var curly = -1;
    while ((i < str.length) && (str[i] != ';')) {
      if (str[i] == "{") {
        curly = i;
      }
      i++;
    }
    var s;
    if (curly) {
      s = str.substring(start, curly);
    } else {
      s = str.substring(start, i);
    }
    var opts = {};
    if (curly >= 0) {
      var optResults = CtsParserImpl.KV(str, curly);
      opts = optResults[1];
    }

    var s = str.substring(start, i);
    var parts = s.split(" ");
    for (var k = 0; i < parts.length; k++) {
      parts[k].trim();
    }
    return [i+1, [parts, opts]];
  },

  RELATION: function(str, i) {
    var tup = CtsParserImpl.SELECTOR(str, i, false);
    i = tup[0];
    var s1 = tup[1];

    tup = CtsParserImpl.RELATOR(str, i);
    i = tup[0];
    var r = tup[1][0];
    var kv = tup[1][1];

    var tup = CtsParserImpl.SELECTOR(str, i, true);
    i = tup[0];
    var s2 = tup[1];

    return [i, new RelationSpec(s1, s2, r, kv)];
  },

  SELECTOR: function(str, i, second) {
    var spaceLast = false;
    var spaceThis = false;
    var bracket = 0;
    var kv = null;
    var start = i;
    var treeName = 'body';
    var selector = null;
    var cont = true;

    while ((i < str.length) && cont) {
      if ((kv === null) && (str[i] == '{')) {
        selector = str.substring(start, i).trim();
        var tup = CtsParserImpl.KV(str, i);
        i = tup[0] - 1; // Necessary -1
        kv = tup[1];
      } else if (str[i] == '[') {
        bracket++;
      } else if (str[i] == ']') {
        bracket--;
      } else if ((str[i] == '|') && (bracket == 0) && (kv === null)) {
        treeName = str.substring(start, i).trim();
        start = i+1;
      } else if (((!second) && spaceLast && (str[i] == ':'))
               ||( second && (str[i] == ';'))) {
        if (kv === null) {
          selector = str.substring(start, i).trim();
        }
        cont = false;
      } 

      if (second && (i == (str.length - 1))) {
        if (kv === null) {
          if (str[i] == ';') {
            selector = str.substring(start, i).trim();
          } else {
            selector = str.substring(start, i+1).trim();
          }
        }
      }

      spaceLast = ((str[i] == ' ') || (str[i] == '\t') || (str[i] == '\n'));
      i++;
    }

    return [i, new SelectionSpec(treeName, selector, kv)];
  },

  KV: function(str, i) {
    // Parse a JSON Dict
    var start = i;
    var openQuote = null;    
    while ((i < str.length) && (
      ((openQuote == null) && (str[i] != '}')) || (openQuote != null))) { 
      if (openQuote == null) {
        if ((str[i] == '"') || (str[i] == "'")) {
          openQuote = str[i];
        }
      } else {
        if (str[i] == openQuote) {
          if (str[i-1] != "\\") {
            openQuote = null;
          }
        }
      }
      i += 1;
    }
    var s = str.substring(start, i+1);
    var ret = JSON.parse(s);
    return [i+1, ret];
  },

  KEY: function(str, i) {
    var start = i;
    while ((i < str.length) && (str[i] != ':')) {
      i++;
    }
    return [i+1, str.substring(start, i).trim()];
  },

  VALUE: function(str, i) {
    var start = i;

    var quoted = false;
    var seenNonQuotedString = false;
    var quoteChar = null;
    var end = -1;

    while ((i < str.length) && ((!quoted) && (str[i] != ",") && (str[i] != "}"))) {
      if (!quoted) {
        if ((!seenNonQuotedString) && ((str[i] == '\'') || (str[i] == '"'))) {
          quoted = true;
          seenNonQuotedString = true;
          start = i+1;
          quoteChar = str[i];
        } else if (str[i] != ' ') {
          seenNonQuotedString = true;
        }
      } else {
        if ((str[i] == quoteChar) && (str[i-1] != '\\')) {
          end = i;
          quoted = false;
        }
      }
      i++;
    }
    if (end == -1) {
      end = i;
    }
    var val = str.substring(start, end).trim();
    if (str[i] == ",") {
      return [i+1, val];
    } else {
      return [i, val]; // Parent needs to see } for terminal condition.
    }
  },

  RELATOR: function(str, i) {
    var kv = {};
    var start = i;
    var cont = true;
    while ((i < str.length) && (str[i] != ' ') && (str[i] != '\n') && (str[i] != '\t') && (str[i] != '\r')) {
      i++;
    }
    var relator = str.substring(start, i).trim();
    while ((i < str.length) && ((str[i] == ' ') || (str[i] == '\n') || (str[i] == '\t') || (str[i] == '\r'))) {
      i++;
    }
    if (str[i] == "{") {
      var tup = CtsParserImpl.KV(str, i);
      i = tup[0];
      kv = tup[1];
    }
    return [i, [relator, kv]];
  }
};

var CtsParser = {

  parseInlineSpecs: function(str, node, intoForrest) {
    var promise = Util.Promise.defer();
    // First parse out the spec. The user should be using "this" to refer
    // to the current node.

    CtsParser.parseForrestSpec(str).then(
      function(specs) {
        // We have to zip through here to find any instances of 'this' and replace
        // it with the tree that we're working with.
        var promises = Util._.map(specs, function(spec) {
          var nullSelector = false;
          if (typeof spec.relationSpecs != "undefined") {
            for (var i = 0; i < spec.relationSpecs.length; i++) {
              var rs = spec.relationSpecs[i];
              var s1 = rs.selectionSpec1;
              var s2 = rs.selectionSpec2;
              if ((s1.selectorString != null) && (s2.selectorString != null)) {
                if (s1.selectorString.trim() == "this") {
                  s1.inline = true;
                  s1.inlineObject = node;
                }
                if (s2.selectorString.trim() == "this") {
                  s2.inline = true;
                  s2.inlineObject = node;
                }
              } else {
                nullSelector = true;
              }
            }
          }
          if (nullSelector) {
            var error = "parseInlineSpecs: Null selector  ";
            Util.Log.Error(error, spec);
            Util.Promise.reject(error);
          } else {
            return intoForrest.addSpec(spec);
          }
        });

        Util.Promise.all(promises).then(
          // Specs here is ref to result from parseForrestSpec
          function() {
            promise.resolve(specs);
          },
          function(reason) {
            promise.reject(reason);
          }
        );
      },
      function(reason) {
        promise.reject(reason);
      }
    );

    return promise;
  },

  parseForrestSpec: function(str, fromLocation) {
    var promise = Util.Promise.defer();
    var json = null;
    var remoteLoads = [];
    var self = this;

    try {
      json = CtsParserImpl.parse(str.trim());
    } catch (e) {
      Util.Log.Error("Parser error: couldn't parse string", str, e);
      return null;
    }
    json.trees = [];
    json.css = [];
    json.js = [];
    var i;
    var forrestSpecs = [];
    var f = new ForrestSpec();
    if (typeof json.headers != 'undefined') {
      for (i = 0; i < json.headers.length; i++) {
        var headerBlob = json.headers[i];
        var h = headerBlob[0];
        var headerOpts = headerBlob[1];
        var kind = h.shift().trim();

        // Handle dependency specs first
        if (kind == 'css') {
          f.dependencySpecs.push(new DependencySpec('css', h[0]));
        } else if (kind == 'cts') {
          f.dependencySpecs.push(new DependencySpec('cts', h[0]));
          var url = h[0];
          if (typeof fromLocation != 'undefined') {
            url = Util.Net.fixRelativeUrl(url, fromLocation);
          }
          remoteLoads.push(
            Util.Net.fetchString({url: url}).then(
              function(str) {
                return self.parseForrestSpec(str, url);
              }
            )
          );
        } else if (kind == 'js') {
          f.dependencySpecs.push(new DependencySpec('js', h[0]));
        } else {
          // Everything else is a TreeSpec
          var treeSpec = new TreeSpec(kind, h, headerOpts);
          // TODO: Get these special cases out of here!
          // Parser shouldn't know about particulars of trees!
          if (kind == 'gsheet') {
            treeSpec.opts['name'] = h[0];
            treeSpec.opts['url'] = h[1];
            if (h.length > 2) {
              treeSpec.opts['worksheet'] = h[2];              
            }
          } else if (kind == 'html') {
            treeSpec.name = treeSpec.opts['name'] = h[0];
            treeSpec.url = treeSpec.opts['url'] = h[1];
          } else if (kind == 'firebase') {          
            treeSpec.name = treeSpec.opts['name'] = h[0];
            treeSpec.url = treeSpec.opts['url'] = h[1];
          }
          f.treeSpecs.push(treeSpec);
        } // case treespec
      } // for header in headers
    } // if headers
    f.relationSpecs = json.relations;
    forrestSpecs.push(f);

    Util.Promise.all(remoteLoads).then(
      function(moreSpecs) {
        // Results here contains MORE cts strings
        //var parsePromises = Util._.map(results, function(result) {
        //  return self.parseForrestSpec(result);
        //});
//        Q.all(parsePromises).then(
//          function(moreSpecs) {
            for (var i = 0; i < moreSpecs.length; i++) {
              for (var j = 0; j < moreSpecs[i].length; j++) {
                forrestSpecs.push(moreSpecs[i][j]);
              }
            }
            promise.resolve(forrestSpecs);
//          },
//          function(reason) {
//            deferred.reject(reason);
//          }
//        );
      },
      function(reason) {
        promise.reject(reason);
      }
    );
    return promise;
  },

  parseSelector: function(str) {
    return CtsParserImpl.SELECTOR(str, 0, true)[1];
  }
};

module.exports = CtsParser;
