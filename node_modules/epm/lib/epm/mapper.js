/*!
 * This file is part of EPM.
 *
 * please see the LICENSE
 */

'use strict';

var _ = require('underscore')
  , async = require('async');

var mapper = module.exports = {};

mapper.metadata = function(pkgs, files, cb){

  async.map(
    Object.keys(pkgs.packages),
    function(uid, fn){
      var res = {};

      res.uid = uid;
      res.build = pkgs.packages[uid].build;
      res.filename = pkgs.packages[uid].filename;
      res.checksum = files[pkgs.packages[uid].filename].checksum;

      fn && fn(null, res);
    },
    function(err, results){
      cb && cb(null, results);
    }
  );
}

/*mapper.mapTrackedsSync = function(type, collection, cb){

}*/