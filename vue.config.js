module.exports = {
    lintOnSave: false,
    chainWebpack: config => {
        // GLSL Loader
        config.module
            .rule( "glsl" )
            .test( /\.glsl$/ )
            .use( "webpack-glsl-loader" )
            .loader( "webpack-glsl-loader" )
            .end()
        // OBJ Loader
        config.module
            .rule( "obj" )
            .test( /\.obj$/ )
            .use( "raw-loader" )
            .loader( "raw-loader" )
            .end()
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                "mac": {
                    "target": [ "dir" ]
                }
            }
        }
    }
}
