var Util = require('cts/util');

var RelationSpec = function(selector1, selector2, name, props) {
  this.selectionSpec1 = selector1;
  this.selectionSpec2 = selector2;
  this.name = name;
  this.opts = props || {};
  this.forCreationOnly = false;
};

Util._.extend(RelationSpec.prototype, {
  head: function() {
    return this.selectionSpec1;
  },

  tail: function() {
    return this.selectionSpec2;
  },

  clone: function() {
    var spec = RelationSpec(this.selectionSpec1, this.selectionSpec2, name, props);
    spec.forCreationOnly = this.forCreationOnly;
    return spec;
  }
});

module.exports = RelationSpec;