import * as express from 'express';

let route: Route = {
    base: 'icons',
    router: express.Router(),
};

const handleRequest = (req: express.Request, res: express.Response, type?: string) => {
    if (route.state && route.state.api) {
        let api  = route.state.api;

        switch (type) {
            case 'Index':
                return res.status(200).json(api.getIconIndex());
            
            case 'Sheet':
                let sheetBuffer = api.getSheet();

                if (sheetBuffer) {
                    return res.status(200).contentType('image/png').send(sheetBuffer);
                }

                break;

            case 'Icon':
                let iconBuffer = api.getIcon(req.params.iconParam);

                if (iconBuffer) {
                    return res.status(200).contentType('image/png').send(iconBuffer);
                }

            default: break;
        }
    }

    res.status(404).json({ message: 'Not Found' });
};

const router = route.router; {
    router.get('/', (req, res) => handleRequest(req, res, 'Index'))
    .get('/sheet', (req, res) => handleRequest(req, res, 'Sheet'))
    .get('/:iconParam', (req, res) => handleRequest(req, res, 'Icon'))
    .get('*', (req, res) => handleRequest(req, res, ''));
}

export default route;