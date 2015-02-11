# PostCSS Simple Variables [![Build Status](https://travis-ci.org/postcss/postcss-simple-vars.svg)](https://travis-ci.org/postcss/postcss-simple-vars)

<img align="right" width="95" height="95" src="http://postcss.github.io/postcss/logo.svg" title="Philosopher’s stone, logo of PostCSS">

[PostCSS] plugin for Sass-like variables.

You can use variables inside values, selectors and at-rule’s parameters.

If you want be closer to W3C spec, you should use [postcss-custom-properties] plugin.

```css
$blue: #056ef0
$column: 200px

.menu {
    width: calc(4 * $column);
}
.menu_link {
    background: $blue;
    width: $column;
}
```

```css
.menu {
    width: calc(4 * 200px);
}
.menu_link {
    background: #056ef0;
    width: 200px;
}
```

[PostCSS]: https://github.com/postcss/postcss
[postcss-custom-properties]: https://github.com/postcss/postcss-custom-properties

## Interpolation

There is special syntax if you want to use variable inside CSS words:

```css
$prefix: my-company-widget

$prefix { }
$(prefix)_button { }
```

## Namespaces

If you want to group related variables together you can use a namespace rule:

```css
%myNamespace {
    red: #f33;
    myWeight: bold
}

p {
    color: $myNamespace.red;
    font-weight: $myNamespace.red;
}

```

## Usage

Without options:

```js
postcss([ require('postcss-simple-vars') ])
```

With options:

```js
postcss([
    require('postcss-simple-vars')({ variables: require('./constants') })
])
```

See [PostCSS] docs for examples for your environment.

## Options

Call plugin function to set options:

```js
.pipe(postcss([ require('postcss-simple-vars')({ silent: true }) ]))
```

### `variables`

Set default variables. It is useful to store colors or other constants
in common file:

```js
// config/colors.js

module.exports = {
    blue: '#056ef0'
}

// gulpfile.js

var colors = require('./config/colors');
var vars   = require('postcss-simple-vars')

gulp.task('css', function () {
     return gulp.src('./src/*.css')
        .pipe(postcss([ vars({ variables: colors }) ]))
        .pipe(gulp.dest('./dest'));
});
```

### `silent`

Left unknown variables in CSS and do not throw a error. Default is `false`.

### `only`

Set value only for variables from this object.
Other variables will not be changed. It is useful for PostCSS plugin developers.
