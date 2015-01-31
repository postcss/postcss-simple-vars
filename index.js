var definition = function (variables, node) {
    var name = node.prop.slice(1);
    variables[name] = node.value;
    node.removeSelf();
};

var variable = function (variables, node, str, name, silent) {
    if ( variables[name] ) {
        return variables[name];
    } else if ( silent ) {
        return str;
    } else {
        throw node.error('Undefined variable ' + str);
    }
};

var simpleSyntax = function (variables, node, str, silent) {
    return str.replace(/(^|\s)\$[\w\d-_]+/, function (str) {
        var name = str.trim().slice(1);
        return variable(variables, node, str, name, silent);
    });
};

var inStringSyntax = function (variables, node, str, silent) {
    return str.replace(/\$\(\s*[\w\d-_]+\s*\)/, function (str) {
        var name = str.slice(2, -1).trim();
        return variable(variables, node, str, name, silent);
    });
};

var bothSyntax = function (variables, node, str, silent) {
    str = simpleSyntax(variables, node, str, silent);
    str = inStringSyntax(variables, node, str, silent);
    return str;
};

var declValue = function (variables, node, silent) {
    node.value = bothSyntax(variables, node, node.value, silent);
};

var ruleSelector = function (variables, node, silent) {
    node.selector = bothSyntax(variables, node, node.selector, silent);
};

var atruleParams = function (variables, node, silent) {
    node.params = bothSyntax(variables, node, node.params, silent);
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
                    definition(variables, node);
                } else if ( node.value.indexOf('$') != -1 ) {
                    declValue(variables, node, opts.silent);
                }

            } else if ( node.type == 'rule' ) {
                if ( node.selector.indexOf('$') != -1 ) {
                    ruleSelector(variables, node, opts.silent);
                }

            } else if ( node.type == 'atrule' ) {
                if ( node.params && node.params.indexOf('$(') != -1 ) {
                    atruleParams(variables, node, opts.silent);
                }
            }

        });
    };
};

module.exports.postcss = function (css) {
    module.exports()(css);
};
