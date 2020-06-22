import * as express from 'express';
import * as compression from 'compression';
import * as proxy from 'express-http-proxy';
import * as reflection from './reflection';

const subdomain = require('express-subdomain');

const app = express(); {
    app.use(compression());
    app.disable('x-powered-by');
    app.get('/keepAlive', (_, res) => res.end());

    reflection.serve().then(router => {
        app.use(subdomain('reflection', router));
    });

    app.use(proxy('roblox.com', {
        https: true,

        proxyReqOptDecorator: (reqOptions, req) => {
            let subdomains = req.subdomains;

            if (subdomains[0] === 'staging') {
                subdomains = subdomains.splice(1, 1);
            }

            let subdomain = subdomains.reverse().join('.') || 'www';

            console.log(subdomain);

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

/*if (process.env.PORT) {
    setInterval(() => {
        request('https://rbx-api.xyz/keepAlive');
    }, 600000);
}*/

app.listen(process.env.PORT || 80);