npm init -y

npm install --save-dev webpack webpack-cli typescript ts-node-dev ts-loader
npm install express @types/express
npm install express-ws @types/express-ws

package.json ->
"scripts": {
    "start": "ts-node-dev ./src/server.ts",
    "package": "npx webpack"
  },

webpack.config.js ->
const path = require("path");

module.exports = {
    entry: './src/server.ts',
    devtool: 'inline-source-map',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'server.js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        filename: 'server.js',
        port: 3000
    },
    // until azure roll forward with this fix https://github.com/node-fetch/node-fetch/issues/667
    optimization: {
        minimize: false
    }
};

./src/server.ts ->
import * as express from 'express';

class Server {
    public app: express.Application;

    constructor(
        private port: number
    ) {
        const app = express();
    }

    public listen(): void {
        this.app.listen(this.port, () => {
            console.log(`Listening on port ${this.port}`);
        });
    }
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000; 
new Server(port).listen();



setup react
npx create-react-app src/client --template typescript



docker build -t wally .
docker run -p 8080:8080 -e PORT=8080 -e NEDB_ROOT_DIR=/data -v c:/projects/wally/server/store:/data  wally