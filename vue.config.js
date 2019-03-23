module.exports = {
    lintOnSave: false,
    pages: {
        index: {
            entry: 'src/pages/playground.ts',
            template: 'public/playground.html',
            filename: 'playground.html',
            title: 'Playground',
        }
    },
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
        // Web-Workers Loader
        config.module
            .rule( "worker" )
            .test( /\.worker\.js$/ )
            .use( "worker-loader" )
                .loader( "worker-loader" )
                .end()
    },
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                "appId": "com.agustin-burset.shaders-playground",
                "copyright": "Copyright © 2019 Agustin Burset",
                "productName": "Shaders Playground"
            }
        }
    }
}
