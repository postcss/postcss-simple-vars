var definition = function (variables, node) {
    var name = node.prop.slice(1);
    variables[name] = node.value;
    node.removeSelf();
};

var declValue = function (variables, node, silent) {
    node.value = node.value.replace(/\$[\w\d-]+/, function (str) {
        var name = str.slice(1);
        if ( variables[name] ) {
            return variables[name];
        } else if ( silent ) {
            return str;
        } else {
            throw node.error('Undefined variable ' + str);
        }
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
