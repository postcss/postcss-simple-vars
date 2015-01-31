var postcss = require('postcss');
var expect  = require('chai').expect;

var vars = require('../');

var test = function (input, output, opts) {
    expect(postcss(vars(opts)).process(input).css).to.eql(output);
};

describe('postcss-simple-vars', function () {

    it('replaces variables in values', function () {
        test('$size: 10px;\n' + 'a { width: $size; height: $size; }',
             'a { width: 10px; height: 10px; }');
    });

    it('overrides variables', function () {
        test('$var: 1; a{ one: $var } b{ $var: 2; two: $var } c{ two: $var }',
             'a{ one: 1 } b{ two: 2 } c{ two: 2 }');
    });

    it('throws an error on unknown variable', function () {
        expect(function () {
            test('a { width: $size }');
        }).to.throw('<css input>:1:5: Undefined variable $size');
    });

    it('allows to silent errors', function () {
        test('a { width: $size }', 'a { width: $size }', { silent: true });
    });

});
