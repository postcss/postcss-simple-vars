let { equal, throws } = require('uvu/assert')
let { test } = require('uvu')
let postcss = require('postcss')

let plugin = require('./')

function checkResult(result, expected) {
  equal(result.css, expected)
  equal(result.warnings().length, 0)
  return result
}

function runWithPlugins(plugins, input, output) {
  let result = postcss(plugins).process(input, { from: '/test.css' })
  return checkResult(result, output)
}

function run(input, output, opts) {
  let result = postcss([plugin(opts)]).process(input, { from: '/test.css' })
  return checkResult(result, output)
}

test('works with postcss-mixin variables', () => {
  runWithPlugins(
    [plugin(), require('postcss-mixins')],
    '$b: 1; @define-mixin b $a: $b {width: $a; height: $b;}\n.a{@mixin b;}',
    '.a{width: 1;height: 1;}'
  )
})

test('works with postcss-for', () => {
  runWithPlugins(
    [plugin(), require('postcss-for')],
    '$a: 1; $i: 5; @for $i from 1 to 3 {.b-$i {width: calc($i + $a);}}',
    '.b-1 {width: calc(1 + 1);} .b-2 {width: calc(2 + 1);} ' +
      '.b-3 {width: calc(3 + 1);}'
  )
})

test('works with postcss-each', () => {
  runWithPlugins(
    [require('postcss-each')({ plugins: { afterEach: plugin() } })],
    '@each $n, $w in (a, b, c), (1, 2, 3) {.a-$n {width: $w;}}',
    '.a-a {width: 1;}\n.a-b {width: 2;}\n.a-c {width: 3;}'
  )
})

test('replaces variables in values', () => {
  run(
    '$size: 10px;\na{ width: $size; height: $size }',
    'a{ width: 10px; height: 10px }'
  )
})

test('replaces vars in property names', () => {
  run('$prop: width; a{ $(prop): 1px }', 'a{ width: 1px }')
})

test('replaces vars inside property names', () => {
  run('$dir: top; a{ margin-$(dir): 1px }', 'a{ margin-top: 1px }')
})

test('replaces vars in comments', () => {
  run('$prop: width; /* <<$(prop)>>: 1px */', '/* width: 1px */')
})

test('allows dashes and digits in variable name', () => {
  run('$a-b_10: 1;\na{ one: $a-b_10 a$(a-b_10) }', 'a{ one: 1 a1 }')
})

test('needs space before variable', () => {
  run('$size: 10px; a { width: one$size }', 'a { width: one$size }')
})

test('does not remove first symbol', () => {
  run('a{ a: 1 $a }', 'a{ a: 1 1 }', { variables: { a: 1 } })
})

test('allows to use in negative numbers', () => {
  run('a{ a: -$a }', 'a{ a: -1 }', { variables: { a: 1 } })
})

test('transforms unicode escapes', () => {
  run(
    String.raw`$a: b[c="\U0001F389"]\u003Afocus\u003Ahover; $a { width: 1px }`,
    'b[c="🎉"]:focus:hover { width: 1px }'
  )
})

test('does not transform escaped backslashes', () => {
  run(
    String.raw`$a: b[c="\\U0001F389"]\\u003Afocus\\u003Ahover; $a { d:1 }`,
    String.raw`b[c="\U0001F389"]\u003Afocus\u003Ahover { d:1 }`
  )
  run(
    String.raw`$a: b[c="\\\\U0001F389"]\\\\u003Afocus\\\\u003Ahover; $a{ d:1 }`,
    String.raw`b[c="\\U0001F389"]\\u003Afocus\\u003Ahover{ d:1 }`
  )
})

test('replaces multiple variables', () => {
  run('a{ a: $a $a }', 'a{ a: 1 1 }', { variables: { a: 1 } })
})

test('has second syntax for varibles', () => {
  run('$size: 10; a { width: $(size)px }', 'a { width: 10px }')
})

test('replaces variables in selector', () => {
  run('$name: a; $name $(name)b { }', 'a ab { }')
})

test('replaces variables in at-rule params', () => {
  run('$name: a; @at $name; @at $(name)b { }', '@at a; @at ab { }')
})

test('parses at-rule without params', () => {
  run('@atrule{}', '@atrule{}')
})

test('overrides variables', () => {
  run(
    '$var: 1; a{ one: $var } b{ $var: 2; two: $var } c{ two: $var }',
    'a{ one: 1 } b{ two: 2 } c{ two: 2 }'
  )
})

test('throws an error on unknown variable', () => {
  throws(
    () => run('a{ width: -$size }'),
    'postcss-simple-vars: /test.css:1:4: Undefined variable $size'
  )
})

test('allows to silent errors', () => {
  run('a{ width: $size }', 'a{ width: $size }', { silent: true })
})

test('gets variables from options', () => {
  run('a{ width: $one }', 'a{ width: 1 }', { variables: { one: 1 } })
})

test('works with any syntax in option', () => {
  run('a{ width: $one }', 'a{ width: 1 }', { variables: { $one: 1 } })
})

test('cans get variables only from option', () => {
  run(
    '$one: 2; $two: 2; a{ one: $one $two }',
    '$one: 2; $two: 2; a{ one: 1 $two }',
    { only: { one: 1 } }
  )
})

test('works with false value', () => {
  run('a{ zero: $zero }', 'a{ zero: 0 }', { variables: { zero: 0 } })
})

test('allows to use var in other vars', () => {
  run('$one: 1; $two: $one 2; a{ value: $two }', 'a{ value: 1 2 }')
})

test('set default values by function', () => {
  let value
  let config = () => ({ config: value })

  value = 1
  run('a{ width: $config }', 'a{ width: 1 }', { variables: config })

  value = 2
  run('a{ width: $config }', 'a{ width: 2 }', { variables: config })
})

test('has callback for unknown variable', () => {
  let result = []
  let unknown = (node, name) => {
    result.push([node.prop, name])
  }

  run('a{width:$one}', 'a{width:$one}', { unknown })
  equal(result, [['width', 'one']])
})

test('has callback for exporting variables', () => {
  let result = []
  run('$one: 1;', '', {
    onVariables(variables) {
      result.push(variables.one)
    }
  })
  equal(result, ['1'])
})

test('overrides unknown variable', () => {
  let unknown = function () {
    return 'unknown'
  }
  run('a{width:$one}', 'a{width:unknown}', { unknown })
})

test('supports nested vairables', () => {
  run('$one: 1; $p: on; test: $($(p)e)', 'test: 1')
})

test('exports variables to messages', () => {
  equal(run('$one: 1; $p: on;', '').messages, [
    {
      name: 'one',
      plugin: 'postcss-simple-vars',
      type: 'variable',
      value: '1'
    },
    {
      name: 'p',
      plugin: 'postcss-simple-vars',
      type: 'variable',
      value: 'on'
    }
  ])
})

test('overrides default variables', () => {
  let variables = { a: 1 }
  run('a: $a; $a: 2; b: $a;', 'a: 1; b: 2;', {
    variables
  })
  equal(variables, { a: 1 })
})

test('keep top level variables', () => {
  run('$a: 42; body { color: $a }', '$a: 42; body { color: 42 }', {
    keep: true
  })
})

test('keep nested variables', () => {
  run('body { $a: 42; color: $a }', 'body { $a: 42; color: 42 }', {
    keep: true
  })
})

test('ignores @define-mixin', () => {
  run('@define-mixin a $b { color: $b }', '@define-mixin a $b { color: $b }')
})

test('works within @define-mixin', () => {
  run(
    '$a: 1; $b: 2; @define-mixin a $b { color: $b; width: $a }',
    '@define-mixin a $b { color: $b; width: 1 }'
  )
})

test('works inside function-like declarations', () => {
  run(
    '$a: 1; $b: 2; a{ color: a-fn($a nested($b)); }',
    'a{ color: a-fn(1 nested(2)); }'
  )
})

test.run()
