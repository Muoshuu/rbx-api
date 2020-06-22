import * as express from 'express';

let route: Route = {
    base: 'v2',
    router: express.Router()
};

const handleRequest = (req: express.Request, res: express.Response, type: string) => {
    if (route.state && route.state.api) {
        let inherited = req.query.inherited !== undefined;
        let defaults = req.query.defaults !== undefined;

        let api = route.state.api;

        switch (type) {
            case 'API':
                return res.json({ Classes: api.getClasses({ inherited, defaults }), Enums: api.getEnums() });

            case 'Classes':
                return res.json(api.getClasses({ inherited, defaults }));

            case 'Class':
                let rbxClass = api.getClass(req.params.className, { inherited, defaults }); if (rbxClass) { return res.json(rbxClass); } break;

            case 'Members':
                let rbxMembers = api.getMembers(req.params.className, { inherited, defaults }); if (rbxMembers) { return res.json(rbxMembers); } break;

            case 'Member':
                let rbxMember = api.getMember(req.params.className, req.params.memberName, { inherited, defaults }); if (rbxMember) { return res.json(rbxMember); } break;

            case 'Enums':
                return res.json(api.getEnums());

            case 'Enum':
                let rbxEnum = api.getEnum(req.params.enumName); if (rbxEnum) { return res.json(rbxEnum); } break;

            case 'EnumItems':
                let rbxEnumItems = api.getEnumItems(req.params.enumName); if (rbxEnumItems) { return res.json(rbxEnumItems); } break;

            case 'EnumItem':
                let rbxEnumItem = api.getEnumItem(req.params.enumName, req.params.enumItemIdentifier); if (rbxEnumItem) { return res.json(rbxEnumItem); } break;
            
            default: break;
        }
    } else {
        res.status(500).json({ message: 'An unknown internal error occured' });
    }

    res.status(404).json({ code: 404, message: 'Not Found' });
};

const router = route.router; {
    router.get('/', (a, b) => handleRequest(a, b, 'API'));

    router.get('/classes', (a, b) => handleRequest(a, b, 'Classes'))
        .get('/classes/:className', (a, b) => handleRequest(a, b, 'Class'))
        .get('/classes/:className/members', (a, b) => handleRequest(a, b, 'Members'))
        .get('/classes/:className/members/:memberName', (a, b) => handleRequest(a, b, 'Member'));

    router.get('/enums', (a, b) => handleRequest(a, b, 'Enums'))
        .get('/enums/:enumName', (a, b) => handleRequest(a, b, 'Enum'))
        .get('/enums/:enumName/items', (a, b) => handleRequest(a, b, 'EnumItems'))
        .get('/enums/:enumName/items/:itemIdentifier', (a, b) => handleRequest(a, b, 'EnumItem'));

    router.get('*', (req, res) => handleRequest(req, res, ''));
}

export default route;