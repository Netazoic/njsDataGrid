module.exports = {
    runtimeCompiler: true,
    filenameHashing: false,
    outputDir: process.env.NODE_ENV === 'production' ? 'dist/prd' : 'dist/dev',
    publicPath:
        process.env.NODE_ENV === 'production'
            ? '/app/njs-grid/dist/prd'
            : '/app/njs-grid/dist/dev',
    pages: {
        'njs-grid': 'src/index.js'
    },
    configureWebpack: {
        resolve: {
            alias: {
                'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
            }
        },
        devtool: 'source-map'
    },
    chainWebpack: config => {
        config.externals({
            "jquery": "jQuery"
        });
        config.output
            .filename(
                process.env.NODE_ENV === 'production'
                    ? 'js/[name].js'
                    : 'js/[name].dev.js'
            );
        config.plugins.delete('hmr');
        config.optimization.delete('splitChunks');
    }
};
