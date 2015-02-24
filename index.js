var definition = function (variables, node) {
    var name = node.prop.slice(1);
    variables[name] = node.value;
    node.removeSelf();
};

var variable = function (variables, node, str, name, opts) {
    if ( opts.only ) {
        if ( typeof(opts.only[name]) != 'undefined' ) {
            return opts.only[name];
        } else {
            return str;
        }

    } if ( typeof(variables[name]) != 'undefined' ) {
        return variables[name];

    } else if ( opts.silent ) {
        return str;

    } else {
        throw node.error('Undefined variable $' + name);
    }
};

var simpleSyntax = function (variables, node, str, opts) {
    return str.replace(/(^|[^\w])\$([\w\d-_]+)/g, function (_, before, name) {
        return before + variable(variables, node, '$' + name, name, opts);
    });
};

var inStringSyntax = function (variables, node, str, opts) {
    return str.replace(/\$\(\s*([\w\d-_]+)\s*\)/g, function (all, name) {
        return variable(variables, node, all, name, opts);
    });
};

var bothSyntaxes = function (variables, node, str, opts) {
    str = simpleSyntax(variables, node, str, opts);
    str = inStringSyntax(variables, node, str, opts);
    return str;
};

var declValue = function (variables, node, opts) {
    node.value = bothSyntaxes(variables, node, node.value, opts);
};

var ruleSelector = function (variables, node, opts) {
    node.selector = bothSyntaxes(variables, node, node.selector, opts);
};

var atruleParams = function (variables, node, opts) {
    node.params = bothSyntaxes(variables, node, node.params, opts);
};

module.exports = function (opts) {
    if ( typeof(opts) == 'undefined' ) opts = { };

    var variables = { };

    if ( typeof(opts.variables) == 'object' ) {
        for ( var i in opts.variables ) variables[i] = opts.variables[i];
    }

    return function (css) {
        css.eachInside(function (node) {

            if ( node.type == 'decl' ) {
                if ( node.prop[0] == '$' ) {
                    if ( !opts.only ) definition(variables, node);
                } else if ( node.value.indexOf('$') != -1 ) {
                    declValue(variables, node, opts);
                }

            } else if ( node.type == 'rule' ) {
                if ( node.selector.indexOf('$') != -1 ) {
                    ruleSelector(variables, node, opts);
                }

            } else if ( node.type == 'atrule' ) {
                if ( node.params && node.params.indexOf('$') != -1 ) {
                    atruleParams(variables, node, opts);
                }
            }

        });
    };
};

module.exports.postcss = function (css) {
    module.exports()(css);
};
