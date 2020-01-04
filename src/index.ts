import * as express from 'express';
import { serveProxy } from './proxy';
import { serveReflection } from './reflection/.';

const compression = require('compression')();

const app = express(); {
	app.use(compression);
	
	serveProxy(app);
	serveReflection(app);
}

app.listen(process.env.PORT || 5000);