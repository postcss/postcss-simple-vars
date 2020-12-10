function definition (variables, node, opts) {
  let name = node.prop.slice(1)
  variables[name] = node.value

  if (!opts.keep) {
    node.remove()
  }
}

function variable (variables, node, str, name, opts, result) {
  if (opts.only) {
    if (typeof opts.only[name] !== 'undefined') {
      return opts.only[name]
    }

    return str
  }

  if (typeof variables[name] !== 'undefined') {
    return variables[name]
  }

  if (opts.silent) {
    return str
  }

  let fix = opts.unknown(node, name, result)

  if (fix) {
    return fix
  }

  return str
}

function simpleSyntax (variables, node, str, opts, result) {
  return str.replace(/(^|[^\w])\$([\w\d-_]+)/g, (_, bef, name) => {
    return bef + variable(variables, node, '$' + name, name, opts, result)
  })
}

function inStringSyntax (variables, node, str, opts, result) {
  return str.replace(/\$\(\s*([\w\d-_]+)\s*\)/g, (all, name) => {
    return variable(variables, node, all, name, opts, result)
  })
}

function bothSyntaxes (variables, node, str, opts, result) {
  str = simpleSyntax(variables, node, str, opts, result)
  str = inStringSyntax(variables, node, str, opts, result)
  return str
}

function repeat (value, callback) {
  let oldValue
  let newValue = value
  do {
    oldValue = newValue
    newValue = callback(oldValue)
  } while (newValue !== oldValue && newValue.includes('$'))
  return newValue
}

function declValue (variables, node, opts, result) {
  node.value = repeat(node.value, value => {
    return bothSyntaxes(variables, node, value, opts, result)
  })
}

function declProp (variables, node, opts, result) {
  node.prop = repeat(node.prop, value => {
    return inStringSyntax(variables, node, value, opts, result)
  })
}

function ruleSelector (variables, node, opts, result) {
  node.selector = repeat(node.selector, value => {
    return bothSyntaxes(variables, node, value, opts, result)
  })
}

function atruleParams (variables, node, opts, result) {
  node.params = repeat(node.params, value => {
    return bothSyntaxes(variables, node, value, opts, result)
  })
}

function comment (variables, node, opts, result) {
  node.text = node.text.replace(/<<\$\(\s*(\w+)\s*\)>>/g, (all, name) => {
    return variable(variables, node, all, name, opts, result)
  })
}

function isIgnore (node) {
  if (node.type === 'atrule' && node.name === 'define-mixin') {
    return true
  } else if (node.parent) {
    return isIgnore(node.parent)
  } else {
    return false
  }
}

module.exports = (opts = {}) => {
  if (!opts.unknown) {
    opts.unknown = (node, name) => {
      throw node.error('Undefined variable $' + name)
    }
  }

  if (typeof opts.keep === 'undefined') {
    opts.keep = false
  }

  return {
    postcssPlugin: 'postcss-simple-vars',
    Once (root, { result }) {
      let variables = {}
      if (typeof opts.variables === 'function') {
        variables = opts.variables()
      } else if (typeof opts.variables === 'object') {
        for (let i in opts.variables) variables[i] = opts.variables[i]
      }

      for (let name in variables) {
        if (name[0] === '$') {
          let fixed = name.slice(1)
          variables[fixed] = variables[name]
          delete variables[name]
        }
      }

      root.walk(node => {
        if (isIgnore(node)) return
        if (node.type === 'decl') {
          if (node.value.includes('$')) {
            declValue(variables, node, opts, result)
          }
          if (node.prop[0] === '$' && node.prop[1] !== '(') {
            if (!opts.only) definition(variables, node, opts)
          } else if (node.prop.includes('$(')) {
            declProp(variables, node, opts, result)
          }
        } else if (node.type === 'rule') {
          if (node.selector.includes('$')) {
            ruleSelector(variables, node, opts, result)
          }
        } else if (node.type === 'atrule') {
          if (node.params && node.params.includes('$')) {
            atruleParams(variables, node, opts, result)
          }
        } else if (node.type === 'comment') {
          if (node.text.includes('$')) {
            comment(variables, node, opts, result)
          }
        }
      })

      Object.keys(variables).forEach(key => {
        result.messages.push({
          plugin: 'postcss-simple-vars',
          type: 'variable',
          name: key,
          value: variables[key]
        })
      })
      if (opts.onVariables) {
        opts.onVariables(variables)
      }
    }
  }
}
module.exports.postcss = true
