import * as express from 'express';
import { serveProxy } from './proxy';
import { serveReflection } from './reflection/.';

const app = express(); {
	serveProxy(app);
	serveReflection(app);
}

app.listen(process.env.PORT || 5000);