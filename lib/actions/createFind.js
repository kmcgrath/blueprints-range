/**
 * Module dependencies
 */
var  _ = require('lodash'),
rangeUtil = require('../rangeUtil');


/**
 * Find Records
 *
 *  get   /:modelIdentity
 *   *    /:modelIdentity/find
 *
 * An API call to find and return model instances from the data adapter
 * using the specified criteria.  If an id was specified, just the instance
 * with that unique id will be returned.
 *
 * Optional:
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
 * @param {Integer} skip       - the number of records to skip (useful for pagination)
 * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function(actionUtil) {
  return function findRecords (req, res) {

    // Look up the model
    var Model = actionUtil.parseModel(req);


    // If an `id` param was specified, use the findOne blueprint action
    // to grab the particular instance with its primary key === the value
    // of the `id` param.   (mainly here for compatibility for 0.9, where
    // there was no separate `findOne` action)
    if ( actionUtil.parsePk(req) ) {
      return require('./findOne')(req,res);
    }

    var countPromise = Model.count().where( actionUtil.parseCriteria(req) );

    countPromise.then(function(count) {
      var rangeOptions = rangeUtil.parseRequest(req,count);
      rangeUtil.updateRequest(req,rangeOptions);
      this.rangeResponse = {
        total: count
      };
    })
    .then(function() {

      var skip = actionUtil.parseSkip(req);
      var limit = actionUtil.parseLimit(req);

      this.rangeResponse.start = skip;
      this.rangeResponse.end =  skip + limit - 1;

      // Lookup for records that match the specified criteria
      var query = Model.find()
      .where( actionUtil.parseCriteria(req) )
      .limit( actionUtil.parseLimit(req) )
      .skip( actionUtil.parseSkip(req) )
      .sort( actionUtil.parseSort(req) );
      // TODO: .populateEach(req.options);
      query = actionUtil.populateEach(query, req);

      return query.then(function found(matchingRecords) {

        // Only `.watch()` for new instances of the model if
        // `autoWatch` is enabled.
        if (req._sails.hooks.pubsub && req.isSocket) {
          Model.subscribe(req, matchingRecords);
          if (req.options.autoWatch) { Model.watch(req); }
          // Also subscribe to instances of all associated models
          _.each(matchingRecords, function (record) {
            actionUtil.subscribeDeep(req, record);
          });
        }
        return matchingRecords;
      });
    })
    .then(function(matchingRecords) {
      this.rangeResponse.length = matchingRecords.length;
      rangeUtil.updateResponse(res,this.rangeResponse);
      res.ok(matchingRecords);
    })
    .catch(rangeUtil.InvalidRangeError, function(e) {
      res.status(416).json({message: "Requested range not satisfiable"});
    })
    .catch(function(err) {
      return res.serverError(err);
    });

  };
};
