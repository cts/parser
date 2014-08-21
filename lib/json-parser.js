var Util = require('cts/util');
var RelationSpec = require('./spec/relation-spec');
var DependencySpec = require('./spec/dependency-spec');
var SelectionSpec = require('./spec/selection-spec');
var TreeSpec = require('./spec/tree-spec');
var ForrestSpec = require('./spec/forrest-spec');

var JsonParser = {

  parseInlineSpecs: function(json, node, intoForrest) {
    var promise = Util.Promise.defer();

    if (typeof json == 'string') {
      json = JSON.parse(json);
    }

    // Now we build a proper spec document around it.
    var relations = intoForrest.incorporateInlineJson(json, node);

    return promise;
  },

  parseForrestSpec: function(json) {
    var rets = [];

    if (typeof json == 'string') {
      json = JSON.parse(json);
    }
    var ret = new ForrestSpec();

    if (! Util._.isUndefined(json.trees)) {
      Util._.each(json.trees, function(treeSpecJson) {
        var ts = JsonParser.parseTreeSpec(treeSpecJson);
        ret.treeSpecs.push(ts);
      });
    };

    if (! Util._.isUndefined(json.relations)) {
      Util._.each(json.relations, function(relationSpecJson) {
        var s1 = JsonParser.parseSelectorSpec(relationSpecJson[0]);
        var s2 = JsonParser.parseSelectorSpec(relationSpecJson[2]);
        var r  = JsonParser.parseRelationSpec(relationSpecJson[1], s1, s2);
        ret.relationSpecs.push(r);
      });
    }

    rets.push(ret);
    return Util.Promise.resolve(rets);
  },

  /*
   * Returns a Forrest.
   *
   * Arguments:
   *  json - Either a string or JSON object containing CTS.
   *
   */
  parseTreeSheet: function(json, intoForrestSpec) {
    if (typeof json == 'string') {
      json = JSON.parse(json);
    }

    if ((typeof intoForrestSpec == 'undefined') || (intoForrestSpec == null)) {
      intoForrestSpec = new ForrestSpec();
    }

    intoForrestSpec.incorporate(json);
  },

  parseRelationSpec: function(json, selectorSpec1, selectorSpec2) {
    var ruleName = null;
    var ruleProps = {};
    if (Util._.isArray(json)) {
      if (json.length == 2) {
        Util._.extend(ruleProps, json[1]);
      }
      if (json.length > 0) {
        ruleName = json[0];
      }
    } else if (Fn.isObject(json)) {
      if (!Fn.isUndefined(json.name)) {
        ruleName = json.name;
      }
      if (!Fn.isUndefined(json.props)) {
        ruleProps = json.props;
      }
    } else if (typeof json == 'string') {
      ruleName = json;
    }
    var r = new RelationSpec(selectorSpec1, selectorSpec2, ruleName, ruleProps);
    return r;
  },

  parseTreeSpec: function(json) {
    var ret = new TreeSpec();
    ret.kind = json[0];
    ret.name = json[1];
    ret.url = json[2];
    if (Util._.isObject(json[json.length - 1])) {
      ret.opts = json[json.length - 1];
    }
    return ret;
  },

  parseSelectorSpec: function(json, inlineNode) {
    var treeName = null;
    var selectorString = null;
    var args = {};

    if ((json === null) && (inlineNode)) {
      treeName = inlineNode.tree.name;
    } else if (Util._.isArray(json)) {
      if (json.length == 1) {
        selectorString = json[0];
      } else if (json.length == 2) {
        treeName = json[0];
        selectorString = json[1];
      } else if (json.length == 3) {
        treeName = json[0];
        selectorString = json[1];
        args = json[2];
      }
    } else if (Fn.isObject(json)) {
      if (!Fn.isUndefined(json.treeName)) {
        treeName = json.treeName;
      }
      if (!Fn.isUndefined(json.selectorString)) {
        selectorString = json.selectorString;
      }
      if (!Fn.isUndefined(json.props)) {
        args = json.props;
      }
    } if (typeof json == 'string') {
      selectorString = json;
    }

    if (treeName == null) {
      treeName = 'body';
    }

    var s = new SelectionSpec(treeName, selectorString, args);
    if ((json === null) && (inlineNode)) {
      s.inline = true;
      s.inlineObject = inlineNode;
    }
    return s;
  }

};

module.exports = JsonParser;
