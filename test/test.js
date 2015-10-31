var postcss = require('postcss');
var expect  = require('chai').expect;

var vars = require('../');

var test = function (input, output, opts) {
    expect(postcss(vars(opts)).process(input).css).to.eql(output);
};

describe('postcss-simple-vars', function () {

    it('replaces variables in values', function () {
        test('$size: 10px;\na{ width: $size; height: $size }',
             'a{ width: 10px; height: 10px }');
    });

    it('replaces vars in property names', function () {
        test('$prop: width; a{ $(prop): 1px }', 'a{ width: 1px }');
    });

    it('replaces vars inside property names', function () {
        test('$dir: top; a{ margin-$(dir): 1px }', 'a{ margin-top: 1px }');
    });

    it('allows dashes and digits in variable name', function () {
        test('$a-b_10: 1;\na{ one: $a-b_10 a$(a-b_10) }', 'a{ one: 1 a1 }');
    });

    it('needs space before variable', function () {
        test('$size: 10px; a { width: one$size }', 'a { width: one$size }');
    });

    it('does not remove first symbol', function () {
        test('a{ a: 1 $a }', 'a{ a: 1 1 }', { variables: { a: 1 } });
    });

    it('allows to use in negative numbers', function () {
        test('a{ a: -$a }', 'a{ a: -1 }', { variables: { a: 1 } });
    });

    it('replaces multiple variables', function () {
        test('a{ a: $a $a }', 'a{ a: 1 1 }', { variables: { a: 1 } });
    });

    it('has second syntax for varibles', function () {
        test('$size: 10; a { width: $(size)px }', 'a { width: 10px }');
    });

    it('replaces variables in selector', function () {
        test('$name: a; $name $(name)b { }', 'a ab { }');
    });

    it('replaces variables in at-rule params', function () {
        test('$name: a; @at $name; @at $(name)b { }', '@at a; @at ab { }');
    });

    it('parses at-rule without params', function () {
        test('@atrule{}', '@atrule{}');
    });

    it('overrides variables', function () {
        test('$var: 1; a{ one: $var } b{ $var: 2; two: $var } c{ two: $var }',
             'a{ one: 1 } b{ two: 2 } c{ two: 2 }');
    });

    it('throws an error on unknown variable', function () {
        expect(function () {
            test('a{ width: -$size }');
        }).to.throw('<css input>:1:4: Undefined variable $size');
    });

    it('allows to silent errors', function () {
        test('a{ width: $size }', 'a{ width: $size }', { silent: true });
    });

    it('gets variables from options', function () {
        test('a{ width: $one }', 'a{ width: 1 }', { variables: { one: 1 } });
    });

    it('works with any syntax in option', function () {
        test('a{ width: $one }', 'a{ width: 1 }', { variables: { $one: 1 } });
    });

    it('cans get variables only from option', function () {
        test('$one: 2; $two: 2; a{ one: $one $two }',
             '$one: 2; $two: 2; a{ one: 1 $two }',
             { only: { one: 1 } });
    });

    it('works with false value', function () {
        test('a{ zero: $zero }', 'a{ zero: 0 }', { variables: { zero: 0 } });
    });

    it('allows to use var in other vars', function () {
        test('$one: 1; $two: $one 2; a{ value: $two }', 'a{ value: 1 2 }');
    });

    it('set default values by function', function () {
        var value;
        var config = function () {
            return { config: value };
        };

        value = 1;
        test('a{ width: $config }', 'a{ width: 1 }', { variables: config });

        value = 2;
        test('a{ width: $config }', 'a{ width: 2 }', { variables: config });
    });

    it('has callback for unknown variable', function () {
        var result = [];
        var unknown = function (node, name) {
            result.push([node.prop, name]);
        };

        test('a{width:$one}', 'a{width:$one}', { unknown: unknown });
        expect(result).to.eql([['width', 'one']]);
    });

    it('overrides unknown variable', function () {
        var unknown = function () {
            return 'unknown';
        };
        test('a{width:$one}', 'a{width:unknown}', { unknown: unknown });
    });

});
