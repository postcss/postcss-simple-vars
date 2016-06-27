var postcss = require('postcss');

function definition(variables, node) {
    var name = node.prop.slice(1);
    variables[name] = node.value;
    node.remove();
}

function variable(variables, node, str, name, opts, result) {
    if ( opts.only ) {
        if ( typeof opts.only[name] !== 'undefined' ) {
            return opts.only[name];
        } else {
            return str;
        }

    } if ( typeof variables[name] !== 'undefined' ) {
        return variables[name];

    } else if ( opts.silent ) {
        return str;

    } else {
        var fix = opts.unknown(node, name, result);
        if ( fix ) {
            return fix;
        } else {
            return str;
        }
    }
}

function simpleSyntax(variables, node, str, opts, result) {
    return str.replace(/(^|[^\w])\$([\w\d-_]+)/g, function (_, bef, name) {
        return bef + variable(variables, node, '$' + name, name, opts, result);
    });
}

function inStringSyntax(variables, node, str, opts, result) {
    return str.replace(/\$\(\s*([\w\d-_]+)\s*\)/g, function (all, name) {
        return variable(variables, node, all, name, opts, result);
    });
}

function bothSyntaxes(variables, node, str, opts, result) {
    str = simpleSyntax(variables, node, str, opts, result);
    str = inStringSyntax(variables, node, str, opts, result);
    return str;
}

function repeat(value, callback) {
    var oldValue;
    var newValue = value;
    do {
        oldValue = newValue;
        newValue = callback(oldValue);
    } while (newValue !== oldValue && newValue.indexOf('$') !== -1);
    return newValue;
}

function declValue(variables, node, opts, result) {
    node.value = repeat(node.value, function (value) {
        return bothSyntaxes(variables, node, value, opts, result);
    });
}

function declProp(variables, node, opts, result) {
    node.prop = repeat(node.prop, function (value) {
        return inStringSyntax(variables, node, value, opts, result);
    });
}

function ruleSelector(variables, node, opts, result) {
    node.selector = repeat(node.selector, function (value) {
        return bothSyntaxes(variables, node, value, opts, result);
    });
}

function atruleParams(variables, node, opts, result) {
    node.params = repeat(node.params, function (value) {
        return bothSyntaxes(variables, node, value, opts, result);
    });
}

function comment(variables, node, opts, result) {
    node.text = node.text
        .replace(/<<\$\(\s*([\w\d-_]+)\s*\)>>/g, function (all, name) {
            return variable(variables, node, all, name, opts, result);
        });
}

module.exports = postcss.plugin('postcss-simple-vars', function (opts) {
    if ( typeof opts === 'undefined' ) opts = { };

    if ( !opts.unknown ) {
        opts.unknown = function (node, name) {
            throw node.error('Undefined variable $' + name);
        };
    }

    return function (css, result) {
        var variables = { };
        if ( typeof opts.variables === 'function' ) {
            variables = opts.variables();
        } else if ( typeof opts.variables === 'object' ) {
            for ( var i in opts.variables ) variables[i] = opts.variables[i];
        }

        for ( var name in variables ) {
            if ( name[0] === '$' ) {
                var fixed = name.slice(1);
                variables[fixed] = variables[name];
                delete variables[name];
            }
        }

        css.walk(function (node) {

            if ( node.type === 'decl' ) {
                if ( node.value.toString().indexOf('$') !== -1 ) {
                    declValue(variables, node, opts, result);
                }
                if ( node.prop.indexOf('$(') !== -1 ) {
                    declProp(variables, node, opts, result);
                } else if ( node.prop[0] === '$' ) {
                    if ( !opts.only ) definition(variables, node);
                }

            } else if ( node.type === 'rule' ) {
                if ( node.selector.indexOf('$') !== -1 ) {
                    ruleSelector(variables, node, opts, result);
                }

            } else if ( node.type === 'atrule' ) {
                if ( node.params && node.params.indexOf('$') !== -1 ) {
                    atruleParams(variables, node, opts, result);
                }
            } else if ( node.type === 'comment' ) {
                if ( node.text.indexOf('$') !== -1 ) {
                    comment(variables, node, opts, result);
                }
            }
        });

        if ( opts.onVariables ) {
            opts.onVariables(variables);
        }
    };
});
