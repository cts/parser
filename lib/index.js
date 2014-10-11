var Util = require('cts/util');
var JsonParser = require('./json-parser');
var CtsParser = require('./cts-parser');
var DependencySpec = require('./spec/dependency-spec');
var ForrestSpec = require('./spec/forrest-spec');
var SelectionSpec = require('./spec/selection-spec');
var TreeSpec = require('./spec/tree-spec');
var RelationSpec = require('./spec/relation-spec');

/* Helper: separates inline spec into FORMAT and BODY.
 *
 * Args:
 *  - str: The string encoding of a CTS spec.
 *
 *  str may be either <format>:<cts spec> or <cts spec>
 *  <format> may be either 'json' or 'str'
 *
 * Returns:
 *  Tuple of [format, specBody]
 */
var _typeAndBodyForInline = function(str) {
  var res = /^([a-zA-Z]+):(.*)$/.exec(str);
  if (res === null) {
    return ['string', str];
  } else {
    return [res[1], res[2]];
  }
};

/* Parses a forrest (externally linked) CTS sheet.
 *
 * Args:
 *  - spec: the spec to parse
 *  - format: the format which encodes the spec
 *  - fromUrl: the url which loaded the spec
 *
 * Returns:
 *  Promise for a ForrestSpec object
 */
var parseForrestSpec = function(spec, format, fromUrl) {
  if (format == 'json') {
    return JsonParser.parseForrestSpec(spec, fromUrl);
  } else if (format == 'string') {
    return CtsParser.parseForrestSpec(spec, fromUrl);
  } else {
    return Util.Promise.reject("I don't understand the CTS Format:" + format);
  }
};

/* Helper function which wraps parseForrestSpec.
 *
 * Args:
 *   - spec: the spec to parse
 *   - kind: the format which encodes the spec
 *   - fromUrl: the url which loaded the spec
 */
var parse = function(spec, format, fromUrl) {
  if (typeof format == 'undefined') {
    format = 'string';
  }
  return parseForrestSpec(spec, format, fromUrl);
};

var parseSelectorString = function(str) {
  return CtsParser.parseSelector(str);
};

/* Parses an inline (in a DOM Note attribute) CTS sheet.
 *
 * Args:
 *   - spec: the spec to parse
 *   - node: the CTS node on which the spec was inlined
 *   - intoForrest: the forrest into which to add this inline spec
 *   - realizeTrees: (bool) should any unrealized trees referenced within
 *                   be automatically realized before promise is resolved?
 *
 * Returns:
 *   Promise for a ForrestSpec object.
 */
var parseInlineSpecs = function(spec, node, intoForrest, realizeTrees) {
  var tup = _typeAndBodyForInline(spec);
  var kind = tup[0];
  var body = tup[1];

  if (kind == 'json') {
    return JsonParser.parseInlineSpecs(body, node, intoForrest, realizeTrees);
  } else if (kind == 'string') {
    return CtsParser.parseInlineSpecs(body, node, intoForrest, realizeTrees);
  } else {
    return Util.Promise.reject("I don't understand the CTS Format:" + kind);
  }
};

// var tryPop =  function(str, r) {
//   var match = r.exec(str);
//   console.log(match);
//   return;
// },


module.exports = {
  parseForrestSpec: parseForrestSpec,
  parse: parse,
  parseInlineSpecs: parseInlineSpecs,
  parseSelectorString: parseSelectorString,
  TreeSpec: TreeSpec,
  SelectionSpec: SelectionSpec,
  RelationSpec: RelationSpec,
  ForrestSpec: ForrestSpec,
  DependencySpec: DependencySpec
};