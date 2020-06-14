import * as express from 'express';
import * as request from 'request-promise';
import * as compression from 'compression';
import * as httpProxy from 'express-http-proxy';

import reflection from './reflection';

const app = express(); {
    app.use(compression());
    app.disable('x-powered-by');
    app.get('/keepAlive', (_, res) => res.end());

    reflection(app);

    app.use(httpProxy('roblox.com', {
        https: true,
        proxyReqOptDecorator: (reqOptions, req) => {
            let subdomain = req.subdomains.reverse().join('.') || 'www';

            switch (subdomain) {
                case '':
                    break;

                case 'reflection':
                    return Promise.reject();
                
                default:
                    reqOptions.hostname = subdomain + '.roblox.com';
            }

            if (!reqOptions.headers) { reqOptions.headers = {}; }

            reqOptions.headers['X-Forwarded-For'] = req.connection.remoteAddress;

            delete reqOptions.headers['roblox-id'];

            return reqOptions;
        }
    }));
}

if (process.env.PORT) {
    setInterval(() => {
        request('https://rbx-api.xyz/keepAlive');
    }, 600000);
}

app.listen(process.env.PORT || 80);