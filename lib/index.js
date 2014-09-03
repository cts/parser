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

var _rTree = /^\s*([A-Za-z0-9_\-])+\s*\|(.*)$/;
var _rWorksheet = /^\s*([a-zA-Z0-9_-]+)\s*\!(.*)$/;
var _rRows = /^\s*[Rr][Oo][Ww][Ss]\s*$/;
var _rCols = /^\s*[Cc][Oo][Ll][Ss]\s*$/;
var _rRow = /^\s*[Rr][Oo][Ww]\(([a-zA-Z0-9_\- \.:;,]+)\)\s*$/;
var _rCol = /^\s*[Cc][Oo][Ll]\(([a-zA-Z0-9_\- \.:;,]+)\)\s*$/;
var _rCell = /^\s*([A-Za-z]+)([0-9]+)\s*$/;

/*
 */
var parseSheetSelector = function(selectorString) {
  var s = selectorString.trim();
  var ret = {
    tree: null,
    worksheet: null,
    projection: null,
    row: null,
    col: null
  };
  var match;

  if (match = _rTree.exec(s)) {
    ret.tree = match[1];
    s = match[2];
  }

  // WORKSHEET PREFIX
  if (match = _rWorksheet.exec(s)) {
    // There's a worksheet string
    ret.worksheet = match[1];
    s = match[2];
  }

  if (match = _rRows.exec(s)) {
    ret.projection = 'Rows';
  } else if (match = _rCols.exec(s)) {
    ret.projection = 'Cols';
  } else if (match = _rRow.exec(s)) {
    ret.projection = "Rows";
    ret.row = match[1];
  } else if (match = _rCol.exec(s)) {
    ret.projection = "Cols";
    ret.col = match[1];
  } else if (match = _rCell.exec(s)) {
    ret.projection = "Cells";
    ret.col = match[1]; // A
    ret.row = match[2]; // 1
  }
  return ret;
};

module.exports = {
  parseForrestSpec: parseForrestSpec,
  parse: parse,
  parseInlineSpecs: parseInlineSpecs,
  parseSheetSelector: parseSheetSelector,
  TreeSpec: TreeSpec,
  SelectionSpec: SelectionSpec,
  RelationSpec: RelationSpec,
  ForrestSpec: ForrestSpec,
  DependencySpec: DependencySpec
};