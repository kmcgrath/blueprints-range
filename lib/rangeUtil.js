var _ = require('lodash'),
parseRange = require('range-parser');

var InvalidRangeError = function() {};
InvalidRangeError.prototype = Object.create(Error.prototype);

module.exports.InvalidRangeError = InvalidRangeError;

module.exports.updateResponse = function (res,meta) {
  var total = meta.total || '*';
  var length = meta.length;
  var start = meta.start || 0;
  var end = meta.start + length - 1;

  res.setHeader('Content-Range',"items " + start + "-" + end + "/" + total);
};

module.exports.updateRequest = function (req,options) {
  req.options = req.options || {};
  _.merge(req.options,options);
};

module.exports.parseRequest = function (req,count) {
  if (req.headers.range) {
    var range = parseRange(count,req.headers.range);

    if (range === -1) throw new InvalidRangeError();
    if (range === -2) throw new InvalidRangeError();

    if (range && range[0]) {
      return {
        limit: (range[0].end+1) - range[0].start,
        skip: range[0].start
      }
    }
  }
  else {
    return null;
  }
};
