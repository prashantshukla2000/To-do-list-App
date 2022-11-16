# eql-engine

E-Learnig query language interpreter

## Usage

For node.js

```js
// npm install eql-engine
var eql = require('eql-engine');
```

```js

var query = eql.parse("select all:some text");
// do something with query

```

## Parsed queries

**SELECT** 

basic

```js
// select all:Lorem ipsum
{
  "command": "select",
  "where": {
    "predicate": {
      "key": "all",
      "operator": "=",
      "value": "Lorem ipsum"
    }
  }
}

```

advanced

```js
// select all:Lorem ipsum other:dolor sit amet
{
  "command": "select",
  "where": {
    "predicate": {
      "key": "all",
      "operator": "=",
      "value": "Lorem ipsum other"
    }
  }
}

```

```js
// select all:Lorem ipsum && other!:dolor sit amet
{
  "command": "select",
  "where": {
    "predicate": {
      "key": "all",
      "operator": "=",
      "value": "Lorem ipsum"
    },
    "and": {
      "predicate": {
        "key": "other",
        "operator": "!=",
        "value": "dolor sit amet"
      }
    }
  }
}

```

```js
// select all:Lorem ipsum || other:dolor sit amet
{
  "command": "select",
  "where": {
    "predicate": {
      "key": "all",
      "operator": "=",
      "value": "Lorem ipsum"
    },
    "or": {
      "predicate": {
        "key": "other",
        "operator": "=",
        "value": "dolor sit amet"
      }
    }
  }
}

```

```js
// select all%Lorem ipsum || other:dolor sit amet
{
  "command": "select",
  "where": {
    "predicate": {
      "key": "all",
      "operator": "contains",
      "value": "Lorem ipsum"
    },
    "or": {
      "predicate": {
        "key": "other",
        "operator": "=",
        "value": "dolor sit amet"
      }
    }
  }
}

```

## Licencia

Copyright(c) 2014 Dirección de Tecnología Educativa de Buenos Aires (Dte-ba)

Distrubuido bajo la licencia [GNU GPL v3](http://www.gnu.org/licenses/gpl-3.0.html)
