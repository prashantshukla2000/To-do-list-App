# file-gateway

Node.js module to optimize the file access in apps with multiple data files

# Usage

Installation at npm

```
npm install file-gateway
```

## Modes

**static**  

Writed one time if not exists at init can't be setted

**dynamic** 

Not save on setted, save on expiration or process exit

**cache**   

Always save on setted, remains in memory, dispose on expiration

**temp** 

Always save on setted, NO remains in memory

------------------------------

sample

```js

var FileGateway = require('./lib/fg')
  , fs = require('fs')

var fg = new FileGateway('./data')

fg.config({
  process: true,                  // check the nodejs process
  cache: {
    expire: ((1000 * 60) * 2 ),   // cache expired millisecond (2 minutes)
    length: 20                    // 20 files at same time
  },
  extend: true,
  encoding: 'utf-8'
})

// no control changes
// for static files
.add(
  // this file will be writed one time if not exists
  // can't be setted
  "sys-config",
  { 
    mode: "static", type: "file", name: "sys-config.json", json: true,
    defaults: { val1: "val1", val2: "val2" }
  }
)

.add(
  // another static non json file
  "version",
  {
    mode: "static", type: "file", name: "version",
    defaults: "1.0"
  }
)

// small or config file
// but save when process exit
.add(
  "config",
  {
    mode: "dynamic", type: "file", name: "config.json", json: true,
    defaults: { val3: "val3"}
  }
)

// regiter an array of objects
.add([
    // concurrency files
    // mantein in cache
    { key: "data", mode: "cache", type: "folder", name: "data" }
    // no control this files
    // only resolve files
  , { key: "tmp", mode: "temp", type: "folder", name: "tmp" }
])

.add(
  // this file overrides the cache mode of data
  "some",
  {
    mode: "dynamic", type: "file", name: "data/SOME", json: true,
    defaults: { val1: "val1", val2: "val2", val3: "val3" }
  }
)

// initialize
.init(true/*extend currents json files*/ )


fg.setSync("data", "file1.json", { val: "val"}, {json: true})
fg.setSync("data", "file2.json", { val2: "val2"}, {json: true})

console.log(fg.getSync("config"))

var conf = fg.getSync("config")
conf.val4 = "val4"

console.log(fs.readFileSync("./data/config.json", "utf-8"))

fg.setSync("config", conf)

// not saved shet
// saved when process exit
console.log(fs.readFileSync("./data/config.json", "utf-8"))

console.log( fg.getSync("data", "file1.json") )
console.log( fg.getSync("data", "file2.json") )
```

## license 

(The MIT License)

Copyright (c) 2014 Delmo Carrozzo <dcardev@gmail.com>
