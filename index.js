var definition = function (variables, node) {
    var name = node.prop.slice(1);
    variables[name] = node.value;
    node.removeSelf();
};

var variable = function (variables, node, name, str, silent) {
    if ( variables[name] ) {
        return variables[name];
    } else if ( silent ) {
        return str;
    } else {
        throw node.error('Undefined variable ' + str);
    }
};

var declValue = function (variables, node, silent) {
    node.value = node.value
        .replace(/\$[\w\d-]+/, function (str) {
            var name = str.slice(1);
            return variable(variables, node, name, str, silent);
        })
        .replace(/\$\(\s*[\w\d-]+\s*\)/, function (str) {
            var name = str.slice(2, -1).trim();
            return variable(variables, node, name, str, silent);
        });
};

module.exports = function (opts) {
    if ( typeof(opts) == 'undefined' ) opts = { };

    var variables = { };

    return function (css) {
        css.eachInside(function (node) {

            if ( node.type == 'decl' ) {
                if ( node.prop[0] == '$' ) {
                    definition(variables, node);
                } else {

                    if ( node.value.indexOf('$') != -1 ) {
                        declValue(variables, node, opts.silent);
                    }
                }

            }

        });
    };
};

module.exports.postcss = function (css) {
    module.exports()(css);
};
