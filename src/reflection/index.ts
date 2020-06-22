import * as express from 'express';
import * as path from 'path';
import * as bent from 'bent';
import * as rbx from './roblox';
import * as icons from 'rbx-icons';

declare global {
    type State = { api?: rbx.API };
    type Route = { base: string, router: express.Router, state?: State };
}

const getJSON = bent('json');
const getText = bent('string');

import route_v1 from './routes/v1';
import route_v2 from './routes/v2';
import route_ic from './routes/icons';

const updateAPI = (state: State) => {
    return new Promise((resolve, reject) => {
        Promise.all([
            getText('https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Tracker/roblox/ReflectionMetadata.xml'),
            getJSON('https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Tracker/roblox/API-Dump.json'),
            getJSON('https://raw.githubusercontent.com/Muoshuu/static/master/rbx/api/default_properties.json'),

            icons.generate(path.join(__dirname, 'icons'))

        ]).then((data: any) => {
            state.api = new rbx.API(data[3], data[1], data[2], data[0].toString()); resolve();
        }).catch(reject);
    });
};

const autoUpdater = (state: State) => {
    return updateAPI(state).then(() => {
        setTimeout(() => autoUpdater(state), 3600 * 1000); // Hourly
    }).catch(err => {
        console.error(err); setTimeout(() => autoUpdater(state), 60 * 1000); // Minutely
    });
};

export async function serve() {
    const state: State = {};

    await autoUpdater(state);

    const mainRouter = express.Router();

    for (let route of [
        route_v1,
        route_v2,
        route_ic,
    ]) {
        route.state = state; mainRouter.use('/' + route.base, route.router);
    }

    return mainRouter;
}