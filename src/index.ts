import * as express from 'express';
import { serveProxy } from './proxy';
import { serveReflection } from './reflection/.';
import request = require('request-promise');

const compression = require('compression')();

const app = express(); {
	app.use(compression);

	serveProxy(app);
	serveReflection(app);
}

if (process.env.PORT) {
	setInterval(() => {
		request('https://rbx-api.herokuapp.com/dump/classes/Part/members');
	}, 600000);
}

app.listen(process.env.PORT || 5000);