# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

## 5.0.1
* Remove test files from npm package.

## 5.0
* Use PostCSS 7 (by Douglas Duteil).
* Remove Node.js 4 support.

## 4.1
* Pass all variables to `result.messages` (by Carl Hopf).

## 4.0
* Use PostCSS 6.0 API.

## 3.1
* Add TypeScript definitions (by Paolo Roth).

## 3.0
* Comment variables now must have special `<<$(syntax)>>`.
* Add nested variables support like `$(color$(idx))`.

## 2.0
* Support variables inside comments (by Vince Speelman).

## 1.2.0
* Add `onVariables` option (by Duncan Beevers).

## 1.1.0
* Allow to use variables in property names.

## 1.0.1
* Fix variables with lead `$` in `variables` option.

## 1.0
* Use PostCSS 5.0 API.
* Add `unknown` option.

## 0.3
* Allow to use variables in variables values.
* Accept function in `variables` option.
* Support PostCSS 4.1 API.
* Fix falling on non-string values in AST (by Anton Telesh).

## 0.2.4
* Fix simple syntax variables in at-rule parameters.

## 0.2.3
* Fix extra space on variables ignoring.

## 0.2.2
* Fix undefined variable error message.

## 0.2.1
* Fix look-behind regexp in simple syntax.

## 0.2
* Allow to use simple syntax with minus like `-$width`.
* Add support for multiple variables in one value.
* Do not remove space before `$var`.

## 0.1
* Initial release.
