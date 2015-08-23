var postcss = require('postcss');

var definition = function (result, variables, node) {
    var name = node.prop.slice(1);
    variables[name] = node.value;
    node.remove();
};

var variable = function (result, variables, node, str, name, opts) {
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
    }
    var reason = 'Undefined variable $' + name;
    if(opts.warn) {
        result.warn(reason, {node: node});
        return str;
    } else {
        throw node.error(reason);
    }
};

var simpleSyntax = function (result, variables, node, str, opts) {
    return str.replace(/(^|[^\w])\$([\w\d-_]+)/g, function (_, before, name) {
        return before + variable(result, variables, node, '$' + name, name, opts);
    });
};

var inStringSyntax = function (result, variables, node, str, opts) {
    return str.replace(/\$\(\s*([\w\d-_]+)\s*\)/g, function (all, name) {
        return variable(result, variables, node, all, name, opts);
    });
};

var bothSyntaxes = function (result, variables, node, str, opts) {
    str = simpleSyntax(result, variables, node, str, opts);
    str = inStringSyntax(result, variables, node, str, opts);
    return str;
};

var declValue = function (result, variables, node, opts) {
    node.value = bothSyntaxes(result, variables, node, node.value, opts);
};

var ruleSelector = function (result, variables, node, opts) {
    node.selector = bothSyntaxes(result, variables, node, node.selector, opts);
};

var atruleParams = function (result, variables, node, opts) {
    node.params = bothSyntaxes(result, variables, node, node.params, opts);
};

module.exports = postcss.plugin('postcss-simple-vars', function (opts) {
    if ( typeof opts === 'undefined' ) opts = { };

    return function (css, result) {
        var variables = { };
        if ( typeof opts.variables === 'function' ) {
            variables = opts.variables();
        } else if ( typeof opts.variables === 'object' ) {
            for ( var i in opts.variables ) variables[i] = opts.variables[i];
        }

        css.walk(function (node) {

            if ( node.type === 'decl' ) {
                if ( node.value.toString().indexOf('$') !== -1 ) {
                    declValue(result, variables, node, opts);
                }
                if ( node.prop[0] === '$' ) {
                    if ( !opts.only ) definition(result, variables, node);
                }

            } else if ( node.type === 'rule' ) {
                if ( node.selector.indexOf('$') !== -1 ) {
                    ruleSelector(result, variables, node, opts);
                }

            } else if ( node.type === 'atrule' ) {
                if ( node.params && node.params.indexOf('$') !== -1 ) {
                    atruleParams(result, variables, node, opts);
                }
            }

        });
    };
});
