import * as express from 'express';
import * as compression from 'compression';
import * as proxy from 'express-http-proxy';
import * as reflection from './reflection';

import bent = require('bent');

const subdomain: (subdomainName: string, handler: express.RequestHandler) => express.RequestHandler = require('express-subdomain');

const app = express(); {
    app.use(compression());
    app.disable('x-powered-by');
    app.get('/keepAlive', (_, res) => res.status(204).end());

    reflection.serve().then(reflectionRouter => {
        const proxyReqOptDecorator = (reqOptions: any, req: any) => {
            if (req.params.subdomain === 'reflection') {
                return Promise.reject('');
            }

            let subdomain = req.subdomains[0] || 'www';
            
            if (subdomain === 'staging' && req.params.subdomain) {
                subdomain = req.params.subdomain;
            }

            switch (subdomain) {
                case '': break;
                case 'reflection': return Promise.reject();
                default: reqOptions.hostname = subdomain + '.roblox.com';
            }

            reqOptions.headers = reqOptions.headers || {};
            reqOptions.headers['X-Forwarded-For'] = req.connection.remoteAddress;

            delete reqOptions.headers['roblox-id'];

            return reqOptions;
        };

        const proxyErrorHandler = (err: any, res: express.Response) => {
            if (err.code === 'ENOTFOUND') {
                res.status(404).json({ code: 404, message: 'Not Found' });
            }
        };

        app.use(subdomain('reflection', reflectionRouter));
        app.use('/:subdomain', proxy('roblox.com', { https: true, proxyReqOptDecorator, proxyErrorHandler }));
        app.use('/reflection', subdomain('staging', reflectionRouter));
    });
}

if (process.env.PORT) {
    setInterval(() => {
        bent('https://rbx-api.xyz/keepAlive');
    }, 600000);
}

app.listen(process.env.PORT || 80);