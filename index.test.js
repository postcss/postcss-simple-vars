var postcss = require('postcss');

var vars = require('./');

function run(input, output, opts) {
    return postcss([ vars(opts) ]).process(input)
        .then(result => {
            expect(result.css).toEqual(output);
            expect(result.warnings().length).toBe(0);
            return result;
        });
}

it('replaces variables in values', () => {
    run(
        '$size: 10px;\na{ width: $size; height: $size }',
        'a{ width: 10px; height: 10px }'
    );
});

it('replaces vars in property names', () => {
    run('$prop: width; a{ $(prop): 1px }', 'a{ width: 1px }');
});

it('replaces vars inside property names', () => {
    run('$dir: top; a{ margin-$(dir): 1px }', 'a{ margin-top: 1px }');
});

it('replaces vars in comments', () => {
    run('$prop: width; /* <<$(prop)>>: 1px */', '/* width: 1px */');
});

it('allows dashes and digits in variable name', () => {
    run('$a-b_10: 1;\na{ one: $a-b_10 a$(a-b_10) }', 'a{ one: 1 a1 }');
});

it('needs space before variable', () => {
    run('$size: 10px; a { width: one$size }', 'a { width: one$size }');
});

it('does not remove first symbol', () => {
    run('a{ a: 1 $a }', 'a{ a: 1 1 }', { variables: { a: 1 } });
});

it('allows to use in negative numbers', () => {
    run('a{ a: -$a }', 'a{ a: -1 }', { variables: { a: 1 } });
});

it('replaces multiple variables', () => {
    run('a{ a: $a $a }', 'a{ a: 1 1 }', { variables: { a: 1 } });
});

it('has second syntax for varibles', () => {
    run('$size: 10; a { width: $(size)px }', 'a { width: 10px }');
});

it('replaces variables in selector', () => {
    run('$name: a; $name $(name)b { }', 'a ab { }');
});

it('replaces variables in at-rule params', () => {
    run('$name: a; @at $name; @at $(name)b { }', '@at a; @at ab { }');
});

it('parses at-rule without params', () => {
    run('@atrule{}', '@atrule{}');
});

it('overrides variables', () => {
    run(
        '$var: 1; a{ one: $var } b{ $var: 2; two: $var } c{ two: $var }',
        'a{ one: 1 } b{ two: 2 } c{ two: 2 }'
    );
});

it('throws an error on unknown variable', () => {
    return new Promise(resolve => {
        run('a{ width: -$size }').catch(e => {
            expect(e.message).toEqual(
                'postcss-simple-vars: <css input>:1:4: ' +
                'Undefined variable $size'
            );
            resolve();
        });
    });
});

it('allows to silent errors', () => {
    run('a{ width: $size }', 'a{ width: $size }', { silent: true });
});

it('gets variables from options', () => {
    run('a{ width: $one }', 'a{ width: 1 }', { variables: { one: 1 } });
});

it('works with any syntax in option', () => {
    run('a{ width: $one }', 'a{ width: 1 }', { variables: { $one: 1 } });
});

it('cans get variables only from option', () => {
    run(
        '$one: 2; $two: 2; a{ one: $one $two }',
        '$one: 2; $two: 2; a{ one: 1 $two }',
        { only: { one: 1 } }
    );
});

it('works with false value', () => {
    run('a{ zero: $zero }', 'a{ zero: 0 }', { variables: { zero: 0 } });
});

it('allows to use var in other vars', () => {
    run('$one: 1; $two: $one 2; a{ value: $two }', 'a{ value: 1 2 }');
});

it('set default values by function', () => {
    var value;
    var config = () => {
        return { config: value };
    };

    value = 1;
    run('a{ width: $config }', 'a{ width: 1 }', { variables: config });

    value = 2;
    run('a{ width: $config }', 'a{ width: 2 }', { variables: config });
});

it('has callback for unknown variable', () => {
    var result  = [];
    var unknown = (node, name) => {
        result.push([node.prop, name]);
    };

    run('a{width:$one}', 'a{width:$one}', { unknown: unknown });
    expect(result).toEqual([['width', 'one']]);
});

it('has callback for exporting variables', () => {
    return new Promise(resolve => {
        run('$one: 1;', '', {
            onVariables: (variables) => {
                expect(variables.one).toEqual('1');
                resolve();
            }
        });
    });
});

it('overrides unknown variable', () => {
    var unknown = () => 'unknown';
    run('a{width:$one}', 'a{width:unknown}', { unknown: unknown });
});

it('supports nested vairables', () => {
    run('$one: 1; $p: on; test: $($(p)e)', 'test: 1');
});

it('exports variables to messages', () => {
    return run('$one: 1; $p: on;', '').then(function (result) {
        expect(result.messages).toEqual([
            {
                plugin: 'postcss-simple-vars',
                type: 'variable',
                name: 'one',
                value: '1'
            },
            {
                plugin: 'postcss-simple-vars',
                type: 'variable',
                name: 'p',
                value: 'on'
            }
        ]);
    });
});

it('overrides default variables', () => {
    var variables = { a: 1 };
    run('a: $a; $a: 2; b: $a;', 'a: 1; b: 2;', { variables });
    expect(variables).toEqual({ a: 1 });
});
