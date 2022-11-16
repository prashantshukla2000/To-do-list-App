/*!
 * file-demand
 *
 * Copyright(c) 2014 Delmo Carrozzo <dcardev@gmail.com>
 * MIT Licensed
 */

var fs = require("graceful-fs")
  , path = require("path")
  , mkdirp = require("mkdirp")
  , extend = require("extend")
  , Store = require("./store")

/**
 * 
 * Initialize a new FileGateway with `conf`.
 *
 * @param {String} dir
 * @param {Object} conf
 */
var FileGateway = module.exports = function(dir, conf) {
  var self = this

  if(false === (self instanceof FileGateway)) {
    return new FileGateway()
  }

  self.version = require("../package.json").version

  // initialize de store
  self.objects = {}
  self.root = path.resolve(dir)

  /*
  if (!fs.existsSync(self.root))
    throw new Error("The root path `" + self.root + "` not exists")
  */

  self.store = Store(conf)

  // set configs
  self.config(conf)

  /*process.on("exit",function(){
    self.store.stop()
    if (self.process !== true) return

    var tosave = self.store.cache.filter(function(obj){
      return obj.mode.match(/dynamic/ig);
    })

    tosave.forEach(function(obj){
      var content = obj.content
      
      if (obj.json === true)
        content = JSON.stringify(content)

      fs.writeFileSync(key, content)
    })
    
  })*/

  return self
}

/**
 *  
 * Configure the FileGateway instance
 *
 * @param {Object} conf
 */
FileGateway.prototype.config = function(conf) {
  var self = this
  conf = conf || {}

  self.process = (conf.process !== undefined) ? conf.process : true
  self.extend = (conf.extend !== undefined) ? conf.extend : false
  self.encoding = conf.encoding || 'utf-8'
  self.saveOnSet = (conf.saveOnSet !== undefined) ? conf.saveOnSet : false

  self.cache = extend(false, 
                      { expire:((1000 * 60) * 10 ), length: 20  },
                      conf.cache || {}
                     )
 
  self.store.config(conf)

  return self
}

/**
 *  
 * Register a new object
 *
 */
FileGateway.prototype.add = function() {
  var self = this

  if (arguments.length === 2) {
    return self.__add(arguments[0], arguments[1])
  }

  if (arguments.length === 1 && arguments[0] instanceof Array) {
    arguments[0].forEach(function(obj){
      self.__add(obj.key, obj)
    })
  }

  return self
}

// add function implementation
FileGateway.prototype.__add = function(key, obj) {
  var self = this

  if (self.objects[key] !== undefined) 
    throw new Error("The key `" + key + "` already exists")
  
  if (obj.type === undefined || !obj.type.match(/(file|folder)/g))
      throw new Error("Invalid object type `" + obj.type + "`")

  obj.key = key
  self.objects[key] = obj

  return self
}

/**
 *  
 * Resolve paths
 *
 */
FileGateway.prototype.resolve = function(key, args) {
  var self = this

  var fargs = Array.prototype.slice.call(arguments, 0);

  key = fargs[0]

  var obj = self.objects[key]
  if (obj === undefined || obj === null)
    throw new Error("The key `" + key + "` not found")

  if (obj.type === "file")
    return path.join(self.root, obj.name)

  // is a folder
  //if (obj.type === "folder")
  var paths = fargs.slice(1)
  if (paths.length === 0) 
    return path.join(self.root, obj.name)

  var tojoin = [self.root, obj.name].concat(paths)

  return path.join.apply(self, tojoin)
}

/**
 *  
 * Initialize folders and files
 * the json statics and json dinamics
 * will be extended defined at `exted`
 * when demand the file
 *
 * NOTE: with extend=true all json files will be readed
 *
 */
FileGateway.prototype.init = function(ext) {
  var self = this

  // gets the folders
  Object.keys(self.objects).forEach(function(key){
    var obj = self.objects[key]
    
    var d = self.resolve(key)

    if (obj.type === "file"){
      d = path.dirname(d)
    }

    if (!fs.existsSync(d)) {
      mkdirp.sync(d)
      //console.log("mkdir " + d)
    }
  })

  // initialize the files or extend
  var files = []

  Object.keys(self.objects).forEach(function(key){
    var obj = self.objects[key]
    if (obj.type === "file") 
      files.push(obj)
  })

  files.forEach(function(file){
    var filename = self.resolve(file.key)
    if (!fs.existsSync(filename)) {
      // save into store?
      var content = file.json === true ? JSON.stringify(file.defaults) : file.defaults
      fs.writeFileSync(filename, content)
      return
    } else if (file.json === true && ext === true) {
      // save into store?
      var now = JSON.parse(fs.readFileSync(filename, self.encoding))
      var be = extend(true, now, file.defaults)
      fs.writeFileSync(filename, JSON.stringify(be))
    }
  })

  return self
}


/**
 * Demand a file or folder,
 * if not exists will be created
 *  if is a file by defauls
 *    extended if conf.extend are `true`
 */
FileGateway.prototype.getSync = function(key, filename, ops) {
  var self = this

  var obj = self.objects[key]
  
  if (obj === undefined || obj === null)
    throw new Error("The key `" + key + "` not found")

  // when is type=file
  if (typeof filename === "object")
    ops = filename

  ops = extend(false, ops || {}, { type: "content", encoding: self.encoding })

  filename = self.resolve(key, filename)

  switch(ops.type){
    case "content":  return self.__getContentSync(obj, filename, ops)
    case "stream":  return self.__getStreamSync(obj, filename, ops)
    default: throw new Error("Unknown type `" + ops.type + "`")
  }
}

FileGateway.prototype.__getContentSync = function(obj, filename, ops) {
  var self = this

  if (self.store.exists(filename) === true){
    return self.store.get(filename).content
  }

  // TODO: write file default if not exists
  var content = fs.readFileSync(filename, ops.encoding)

  var json = obj.json === true || ops.json === true

  if(json)
    content = JSON.parse(content)

  if (!obj.mode.match(/(static|dynamic|cache)/g))
    return content

  if (self.store.exists(filename) === true){
    var st = self.store.get(filename)
    return st.content
  }

  // store the content
  self.store.set(filename, content, {mode: obj.mode, json: json})
  
  return content
}

FileGateway.prototype.__getStreamSync = function(filename, ops) {
  var self = this
  return fs.createReadStream(filename, {encoding: ops.encoding})
}

/**
 * Save a file content
 */
FileGateway.prototype.setSync = function(key, relative, content, ops) {
  var self = this

  var obj = self.objects[key]
  if (obj === undefined || obj === null)
    throw new Error("The key `" + key + "` not found")

  if (obj.mode === "static")
    throw new Error("Can be set an static file")

  if (obj.type === "file" && arguments.length >= 4)
    throw new Error("Something wrong the `" + key + "` is a file")

  if (obj.type === "file"){
    content = relative
    ops = content
    return self.__setFileSync(obj, content, ops)
  }

  return self.__setFolderSync(obj, relative, content, ops)
}

FileGateway.prototype.__setFileSync = function(obj, content, ops) {
  var self = this

  filename = self.resolve(obj.key)
  var json = obj.json === true || ops.json === true

  // always write temp files or saveOnSet=true
  var save = (!obj.mode.match(/(dynamic|cache)/g) || !fs.existsSync(filename))

  if (obj.mode.match(/(dynamic|cache)/g)) {

    self.store.set(filename, content, {mode: obj.mode, json:json } )

    // save the file if not exist
    save = (!fs.existsSync(filename) || obj.mode === "cache")
  }
 
  if (self.saveOnSet || save){
    __save(filename, content, json)
  }

  return self
}

FileGateway.prototype.__setFolderSync = function(obj, relative, content, ops) {
  var self = this

  var json = obj.json === true || ops.json === true
 
  filename = self.resolve(obj.key, relative)

  // always write temp files
  var save = (!obj.mode.match(/(dynamic|cache)/g) || !fs.existsSync(filename))

  if (obj.mode.match(/(dynamic|cache)/g)) {

    self.store.set(filename, content, {mode: obj.mode, json:json })
    
    // save the file if not exist or is cache
    save = (!fs.existsSync(filename) || obj.mode === "cache")
  }

  if (self.saveOnSet || save){
    __save(filename, content, json)
  }

  return self
}

//
// private functions
function __save(filename, content, json){
  json = json === true

  if (json) {
    fs.writeFileSync(filename, JSON.stringify(content))
  } else {
    fs.writeFileSync(filename, content)
  }
}