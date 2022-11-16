/*!
 * This file is part of file-demand.
 *
 * please see the LICENSE
 */

var extend = require("extend")
  , fs = require("graceful-fs")
  , _ = require("underscore")

/**
 * 
 * Initialize a new Store with `conf`.
 *
 */
var Store = module.exports = function(ops) {
  var self = this

  if(false === (self instanceof Store)) {
    return new Store()
  }

  self.config(ops) 

  self.cache = []
  self.expireds = {}

  return self
}

/**
 *  
 * Configure the Store instance
 *
 * @param {Object} conf
 */
Store.prototype.config = function(conf) {
  var self = this

  conf = conf || {}

  self.conf = { cache: {} }
  self.conf.cache = extend(false, 
                      { expire:((1000 * 60) * 10 ), length: 20  },
                      conf.cache || {}
                    )

  return self
}

/**
 *  
 * Add object to store
 *
 * @param {String} key
 * @param {String} mode
 * @param {Object} content
 */
Store.prototype.set = function(key, content, ops) {
  var self = this

  if (self.exists(key)) delete self.cache[key]

  var st = self.setCache(ops.mode, key, content, ops.json === true)

  // not expiration for static or temps
  if (st.mode.match(/(static|temp)/g))
    return self

  var expire = (new Date()).valueOf() + self.conf.cache.expire
  
  //TODO: NOT IMPLEMENTED YET  

  return self
}


/**
 *  
 * Add object to store
 *
 * @param {Boolean} remove
 */
Store.prototype.get = function(key, remove) {
  var self = this

  if (!self.exists(key))
    throw new Error("The key `" + key + "` not found")

  return self.getCache(key)
}


Store.prototype.setCache = function(mode, key, content, json) {
  var self = this

  json = json === true;

  while(self.cache.length >= self.conf.cache.length){
    var shifted = self.cache.shift();

    // save
    var ct = shifted.content
      
    if (shifted.json === true)
      ct = JSON.stringify(ct)

    fs.writeFileSync(shifted.key, ct)

  }
    
  var obj = {
    mode: mode,
    json: json,
    key: key,
    content: content
  }

  self.cache.push(obj)

  return obj
}

Store.prototype.getCache = function(key) {
  var self = this

  return _.find(self.cache, function(obj){ return obj.key === key });
}

Store.prototype.existsCache = function(key) {
  var self = this

  return self.getCache(key) !== undefined
}


/**
 *  
 * Define if the key was cached and still exists
 *
 * @param {String} key
 */
Store.prototype.exists = function(key){
  var self = this
  
  return self.existsCache(key)
}


Store.prototype.stop = function(){
  this.stopped = true
  return this
}

Store.prototype.start = function(){
  this.stopped = false
  return this
}
