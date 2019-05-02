module.exports = {
    lintOnSave: false,
    pages: {
        playground: {
            entry: 'src/pages/playground.ts',
            template: 'public/playground.html',
            filename: 'playground.html',
            title: 'Playground',
        },
        welcome: {
            entry: 'src/pages/welcome.ts',
            template: 'public/welcome.html',
            filename: 'welcome.html',
            title: 'Welcome',
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
                appId: "com.agustin-burset.shader-playgrounds",
                copyright: "Copyright © 2019 Agustin Burset",
                productName: "Shader Playgrounds",
                publish: [ { provider: "github", owner: "AgustinBrst" } ],
                fileAssociations: {
                    ext: "shdr",
                    name: "Shader Playgrounds File",
                    role: "Editor"
                }
            }
        }
    }
}
