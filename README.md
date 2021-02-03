# PostCSS Simple Variables

<img align="right" width="135" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="https://postcss.org/logo-leftp.svg">

[PostCSS] plugin for Sass-like variables.

You can use variables inside values, selectors and at-rule parameters.

```pcss
$dir:    top;
$blue:   #056ef0;
$column: 200px;

.menu_link {
  background: $blue;
  width: $column;
}
.menu {
  width: calc(4 * $column);
  margin-$(dir): 10px;
}
```

```css
.menu_link {
  background: #056ef0;
  width: 200px;
}
.menu {
  width: calc(4 * 200px);
  margin-top: 10px;
}
```

If you want be closer to W3C spec,
you should use [postcss-custom-properties] and [postcss-at-rules-variables] plugins.

Look at [postcss-map] for big complicated configs.

[postcss-at-rules-variables]: https://github.com/GitScrum/postcss-at-rules-variables
[postcss-custom-properties]:  https://github.com/postcss/postcss-custom-properties
[postcss-map]:                https://github.com/pascalduez/postcss-map
[PostCSS]:                    https://github.com/postcss/postcss

<a href="https://evilmartians.com/?utm_source=postcss-simple-vars">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>


## Interpolation

There is special syntax for using variables inside CSS words:

```pcss
$prefix: my-company-widget

$prefix { }
$(prefix)_button { }
```


## Comments

You can use variables in comments too (for example, to generate special
[mdcss] comments). Syntax for comment variables is different to separate
them from PreCSS code examples:

```pcss
$width: 100px;
/* $width: <<$(width)>> */
```

compiles to:

```css
/* $width: 100px */
```

[mdcss]: https://github.com/jonathantneal/mdcss


## Escaping

If you want to escape `$` in the `content` property, use Unicode escape syntax.

```css
.foo::before {
  content: "\0024x";
}
```


## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss postcss-simple-vars
```

**Step 2:** Check your project for existing PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you do not use PostCSS, add it according to [official docs]
and set this plugin in settings.

**Step 3:** Add the plugin to plugins list:

```diff
module.exports = {
  plugins: [
+   require('postcss-simple-vars'),
    require('autoprefixer')
  ]
}
```

[official docs]: https://github.com/postcss/postcss#usage


## Options

Call plugin function to set options:

```js
    require('postcss-simple-vars')({ silent: true })
```


### `variables`

Set default variables. It is useful to store colors or other constants
in a common file:

```js
// config/colors.js

module.exports = {
  blue: '#056ef0'
}

// postcss.config.js

const colors = require('./config/colors')
const vars   = require('postcss-simple-vars')

module.exports = {
  plugins: [
    require('postcss-simple-vars')({ variables: colors })
  ]
}
```

You can use a function return an object, if you want to update default
variables in webpack hot reload:

```js
    require('postcss-simple-vars')({
      variables: function () {
        return require('./config/colors');
      }
    })
```


### `onVariables`

Callback invoked once all variables in css are known. The callback receives
an object representing the known variables, including those explicitly declared
by the [`variables`](#variables) option.

```js
    require('postcss-simple-vars')({
      onVariables (variables) {
        console.log('CSS Variables');
        console.log(JSON.stringify(variables, null, 2));
      }
    })
```


### `unknown`

Callback on unknown variable name. It receives the node instance, variable name
and PostCSS Result object.

```js
    require('postcss-simple-vars')({
      unknown (node, name, result) {
        node.warn(result, 'Unknown variable ' + name);
      }
    })
])
```


### `silent`

Leave unknown variables in CSS and do not throw an error. Default is `false`.


### `only`

Set value only for variables from this object.
Other variables will not be changed. It is useful for PostCSS plugin developers.


### `keep`

Keep variables as is and not delete them. Default is `false`.


## Messages

This plugin passes `result.messages` for each variable:

```js
const result = await postcss([vars]).process('$one: 1; $two: 2')
console.log(result.messages)
```

will output:

```js
[
  {
    plugin: 'postcss-simple-vars',
    type: 'variable',
    name: 'one'
    value: '1'
  },
  {
    plugin: 'postcss-simple-vars',
    type: 'variable',
    name: 'two'
    value: '2'
  }
]
```

You can access this in `result.messages` and
in any plugin that included after `postcss-simple-vars`.
