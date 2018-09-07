var postcss = require('postcss')

var vars = require('./')

function run (input, output, opts) {
  return postcss([vars(opts)]).process(input, { from: '/test.css' })
    .then(function (result) {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
      return result
    })
}

it('replaces variables in values', function () {
  run(
    '$size: 10px;\na{ width: $size; height: $size }',
    'a{ width: 10px; height: 10px }'
  )
})

it('replaces vars in property names', function () {
  run('$prop: width; a{ $(prop): 1px }', 'a{ width: 1px }')
})

it('replaces vars inside property names', function () {
  run('$dir: top; a{ margin-$(dir): 1px }', 'a{ margin-top: 1px }')
})

it('replaces vars in comments', function () {
  run('$prop: width; /* <<$(prop)>>: 1px */', '/* width: 1px */')
})

it('allows dashes and digits in variable name', function () {
  run('$a-b_10: 1;\na{ one: $a-b_10 a$(a-b_10) }', 'a{ one: 1 a1 }')
})

it('needs space before variable', function () {
  run('$size: 10px; a { width: one$size }', 'a { width: one$size }')
})

it('does not remove first symbol', function () {
  run('a{ a: 1 $a }', 'a{ a: 1 1 }', { variables: { a: 1 } })
})

it('allows to use in negative numbers', function () {
  run('a{ a: -$a }', 'a{ a: -1 }', { variables: { a: 1 } })
})

it('replaces multiple variables', function () {
  run('a{ a: $a $a }', 'a{ a: 1 1 }', { variables: { a: 1 } })
})

it('has second syntax for varibles', function () {
  run('$size: 10; a { width: $(size)px }', 'a { width: 10px }')
})

it('replaces variables in selector', function () {
  run('$name: a; $name $(name)b { }', 'a ab { }')
})

it('replaces variables in at-rule params', function () {
  run('$name: a; @at $name; @at $(name)b { }', '@at a; @at ab { }')
})

it('parses at-rule without params', function () {
  run('@atrule{}', '@atrule{}')
})

it('overrides variables', function () {
  run(
    '$var: 1; a{ one: $var } b{ $var: 2; two: $var } c{ two: $var }',
    'a{ one: 1 } b{ two: 2 } c{ two: 2 }'
  )
})

it('throws an error on unknown variable', function () {
  return new Promise(function (resolve) {
    run('a{ width: -$size }').catch(function (e) {
      expect(e.message).toEqual(
        'postcss-simple-vars: /test.css:1:4: ' +
                'Undefined variable $size'
      )
      resolve()
    })
  })
})

it('allows to silent errors', function () {
  run('a{ width: $size }', 'a{ width: $size }', { silent: true })
})

it('gets variables from options', function () {
  run('a{ width: $one }', 'a{ width: 1 }', { variables: { one: 1 } })
})

it('works with any syntax in option', function () {
  run('a{ width: $one }', 'a{ width: 1 }', { variables: { $one: 1 } })
})

it('cans get variables only from option', function () {
  run(
    '$one: 2; $two: 2; a{ one: $one $two }',
    '$one: 2; $two: 2; a{ one: 1 $two }',
    { only: { one: 1 } }
  )
})

it('works with false value', function () {
  run('a{ zero: $zero }', 'a{ zero: 0 }', { variables: { zero: 0 } })
})

it('allows to use var in other vars', function () {
  run('$one: 1; $two: $one 2; a{ value: $two }', 'a{ value: 1 2 }')
})

it('set default values by function', function () {
  var value
  var config = function () {
    return { config: value }
  }

  value = 1
  run('a{ width: $config }', 'a{ width: 1 }', { variables: config })

  value = 2
  run('a{ width: $config }', 'a{ width: 2 }', { variables: config })
})

it('has callback for unknown variable', function () {
  var result = []
  var unknown = function (node, name) {
    result.push([node.prop, name])
  }

  run('a{width:$one}', 'a{width:$one}', { unknown: unknown })
  expect(result).toEqual([['width', 'one']])
})

it('has callback for exporting variables', function () {
  return new Promise(function (resolve) {
    run('$one: 1;', '', {
      onVariables: function (variables) {
        expect(variables.one).toEqual('1')
        resolve()
      }
    })
  })
})

it('overrides unknown variable', function () {
  var unknown = function () { return 'unknown' }
  run('a{width:$one}', 'a{width:unknown}', { unknown: unknown })
})

it('supports nested vairables', function () {
  run('$one: 1; $p: on; test: $($(p)e)', 'test: 1')
})

it('exports variables to messages', function () {
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
    ])
  })
})

it('overrides default variables', function () {
  var variables = { a: 1 }
  run('a: $a; $a: 2; b: $a;', 'a: 1; b: 2;', {
    variables: variables
  })
  expect(variables).toEqual({ a: 1 })
})
