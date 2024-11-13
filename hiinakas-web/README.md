const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const { ESBuildMinifyPlugin } = require("esbuild-loader");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: "./src/index.tsx",
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "[name].[contenthash].js",
    },
    mode: process.env.NODE_ENV || "development",
    module: {
        rules: [
            {
                test: /\.(scss|css)$/i,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1,
                            esModule: true,
                            modules: {
                                localIdentName: "wr-[path]:[local]",
                            },
                            url: false,
                        },
                    },
                    "sass-loader",
                ],
            },
            {
                test: /\.(js|ts)x?$/,
                loader: "esbuild-loader",
                options: {
                    loader: "tsx",
                    target: "es2015",
                },
            },
            {
                test: /\.(gif|png|jpe?g|jpg|svg)$/i,
                loader: "url-loader",
                options: {
                    limit: 100000000,
                    name: "[name].[hash:7].[ext]",
                },
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            "react": "preact/compat",
            "react-dom/test-utils": "preact/test-utils",
            "react-dom": "preact/compat",
            "react/jsx-runtime": "preact/jsx-runtime",
            "@common": path.resolve(__dirname, 'src/common/'),
            "@types": path.resolve(__dirname, 'src/types/'),
            "@stores": path.resolve(__dirname, 'src/stores/'),
            "@components": path.resolve(__dirname, 'src/components/'),
            "@views": path.resolve(__dirname, 'src/views/'),
            "@assets": path.resolve(__dirname, 'src/assets/'),
            "@__i18n": path.resolve(__dirname, 'src/i18n'),
            "@theme": path.resolve(__dirname, 'src/theme'),
        },
    },
    //  devtool: 'eval-cheap-source-map',
    optimization: {
        splitChunks: {
            chunks: "all",
        },
        minimizer: [
            new ESBuildMinifyPlugin({
                target: "es2015",
            }),
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, "./dist"),
        writeToDisk: true,
        host: "0.0.0.0",
        port: 8087,
        proxy: {
            "/api/v1/monitor": {
                target: "http://localhost:7070",
                ws: true,
                secure: false,
                logLevel: 'debug',
            },
            '/api': {
                target: 'http://127.0.0.1:7070',
                logLevel: 'debug',
            },
        },
        quiet: false,
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({ template: "src/index.html" }),
        new CopyPlugin({
            patterns: [
                /* ASSETS - FontAwesome */
                { from: "./src/assets/fonts/fontawesome", to: "assets/fonts/fontawesome" },

            ],
        }),
    ],
};





{
    "compilerOptions": {
      "allowSyntheticDefaultImports": true,
      "emitDecoratorMetadata": true,
      "experimentalDecorators": true,
      "forceConsistentCasingInFileNames": true,
      "jsx": "react",
      "module": "esnext",
      "moduleResolution": "node",
      "noImplicitAny": true,
      "outDir": "./dist",
      "preserveConstEnums": true,
      "target": "es6",
      "baseUrl": "src",
      "resolveJsonModule":true,
      "types": ["node", "jest", "@testing-library/jest-dom"],
      "lib": ["es2019","dom", "dom.iterable"],
      "paths": {
        "@__i18n": ["i18n"],
        "@types": ["types/index"],
        "@stores": [
          "stores/index"
        ],
        "@common/*": ["common/*"],
        "@components/*": ["components/*"],
        "@views/*": ["views/*"],
        "@stores/*" : ["stores/*"],
        "@assets/*": ["assets/*"]
    },
    },
    "exclude": [
      "node_modules"
    ],
    "include": [
      "./src",
      "./declaration.d.ts"
    ]
    
  }
  
  
    {
  "name": "@wayren/icp-configuration-ui",
  "version": "1.0.0",
  "devDependencies": {
    "@jest/globals": "^28.1.0",
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@types/html-minifier-terser": "^5.1.2",
    "@types/mocha": "^9.1.1",
    "@types/react": "^18.0.15",
    "@types/react-dom": "^17.0.2",
    "@types/uuid": "^8.3.4",
    "@typescript-eslint/eslint-plugin": "^4.14.2",
    "@typescript-eslint/parser": "^4.14.2",
    "clean-webpack-plugin": "^4.0.0",
    "copy-webpack-plugin": "^11.0.0",
    "css-loader": "^6.2.0",
    "esbuild-loader": "^2.15.1",
    "eslint": "^7.19.0",
    "fake-indexeddb": "^3.1.7",
    "html-webpack-plugin": "^5.3.2",
    "jest": "^28.1.1",
    "jest-environment-jsdom": "^28.1.1",
    "msw": "^0.42.1",
    "postcss": "^8.4.14",
    "sass": "^1.52.1",
    "sass-loader": "^12.1.0",
    "style-loader": "^3.2.1",
    "testcafe": "^1.19.0",
    "ts-jest": "^28.0.4",
    "typescript": "^4.7.2",
    "url-loader": "^4.1.1",
    "webpack": "^5.51.1",
    "webpack-bundle-analyzer": "^4.4.2",
    "webpack-cli": "^4.9.1",
    "webpack-dev-server": "^3.11.2"
  },
  "dependencies": {
    "@webcomponents/webcomponentsjs": "^2.6.0",
    "i18next": "^21.8.9",
    "i18next-browser-languagedetector": "^6.1.4",
    "i18next-http-backend": "^1.4.1",
    "immutable": "^4.1.0",
    "is-mobile": "^3.1.1",
    "preact": "^10.7.3",
    "react-i18next": "^11.17.1",
    "reconnecting-websocket": "^4.4.0",
    "spin-delay": "^1.2.0",
    "styled-components": "^5.3.5",
    "uuid": "^8.3.2"
  },
  "scripts": {
    "dev": "yarn webpack serve --config ./webpack.config.dev.js",
    "build": "yarn webpack build --config ./webpack.config.build.js",
    "e2e-tests": "yarn dev & yarn testcafe -e -u chrome ./e2e_tests",
    "unit-tests": ""
  },
  "msw": {
    "workerDirectory": "dist"
  }
}
