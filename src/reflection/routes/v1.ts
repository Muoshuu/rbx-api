import * as express from 'express';
import * as rbx from '../roblox';
import e = require('express');

let route: Route = {
    base: 'v1',
    router: express.Router()
};

function handleRequest(req: express.Request, res: express.Response, type: string) {
    if (route.state && route.state.api) {
        let api = route.state.api;
        let response: any;

        switch (type) {
            case 'All':
                return res.json(api.getAllLegacy());

            case 'API':
                return res.json(api.getAPI());

            case 'Classes':
                return res.json(api.getClasses());

            case 'Class':
                let rbxClass = api.getClass(req.params.className); if (rbxClass) { return res.json(rbxClass); } break;

            case 'Members':
                let rbxMembers = api.getMembers(req.params.className); if (rbxMembers) { return res.json(rbxMembers); } break;

            case 'Member':
                let rbxMember = api.getMember(req.params.className, req.params.memberName); if (rbxMember) {  res.json(rbxMember); } break;

            case 'Enums':
                return res.json(api.getEnums());

            case 'Enum':
                let rbxEnum = api.getEnum(req.params.enumName); if (rbxEnum) { return res.json(rbxEnum); } break;

            case 'EnumItems':
                let rbxEnumItems = api.getEnumItems(req.params.enumName); if (rbxEnumItems) { return res.json(rbxEnumItems); } break;

            case 'EnumItem':
                let rbxEnumItem = api.getEnumItem(req.params.enumName, req.params.enumItemIdentifier); if (rbxEnumItem) { return res.json(rbxEnumItem); } break;

            case 'Inherited':
                let rbxInheritedMembers = api.getMembers(req.params.className, { inherited: true });
                
                if (rbxInheritedMembers) {
                    return res.json(rbxInheritedMembers);
                }

                if (!api.getClass(req.params.className)) {
                    return res.json({ message: 'Not Found' });
                } else {
                    return res.json([]);
                }

            case 'Defaults':
                let rbxMembersWithDefaults = api.getMembers(req.params.className, { inherited: true, defaults: true });

                if (rbxMembersWithDefaults) {
                    let result: { [memberName: string]: rbx.Property } = {};

                    for (let member of rbxMembersWithDefaults) {
                        if (member.DefaultValue) {
                            result[member.Name] = member.DefaultValue;
                        }
                    }

                    return res.json(result);
                }

                if (!api.getClass(req.params.className)) {
                    return res.json({ message: 'Not Found' });
                } else {
                    return res.json({});
                }
            
            default: break;

        }
    } else {
        res.status(500).json({ code: 500, message: 'An unknown internal error occured' });
    }

    res.status(404).json({ code: 404, message: 'Not Found' });
}

const router = route.router; {
    router.get('/', (req, res) => handleRequest(req, res, 'API'))
    .get('/version', (req, res) => handleRequest(req, res, 'Version'));

    Classes: {
        router.get('/classes', (req, res) => handleRequest(req, res, 'Classes'))
        .get('/classes/:className', (req, res) => handleRequest(req, res, 'Class'))
        .get('/classes/:className/members', (req, res) => handleRequest(req, res, 'Members'))
        .get('/classes/:className/members/inherited', (req, res) => handleRequest(req, res, 'Inherited'))
        .get('/classes/:className/members/defaults', (req, res) => handleRequest(req, res, 'Defaults'))
        .get('/classes/:className/members/:memberName', (req, res) => handleRequest(req, res, 'Member'));
    }

    Enums: {
        router.get('/enums', (req, res) => handleRequest(req, res, 'Enums'))
        .get('/enums/:enumName', (req, res) => handleRequest(req, res, 'Enum'))
        .get('/enums/:enumName/items', (req, res) => handleRequest(req, res, 'EnumItems'))
        .get('/enums/:enumName/items/:enumItemIdentifier', (req, res) => handleRequest(req, res, 'EnumItem'));
    }

    router.get('/all', (req, res) => handleRequest(req, res, 'All'));
}

export default route;