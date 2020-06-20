import * as request from 'request-promise';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as parse from 'xml-parser';
import * as roblox from './roblox';
import * as clone from 'clone';

const subdomain = require('express-subdomain');

let API: roblox.APIDump;
let defaults: roblox.APIDump;
let iconIndex: { [className: string]: number } = {};

function send(req: express.Request, res: express.Response, type: string): void {
    let obj: any;
    
    switch (type) {
        case 'Inherited':
            obj = roblox.getClass(API, req.params.className);

            if (obj) {
                if (obj.Superclass) {
                    obj = roblox.getInheritedMembers(API, obj.Superclass);
                } else {
                    obj = [];
                }
            } else {
                obj = undefined;
            }

            break;

        case 'Defaults':
            for (let cls of Object.values(defaults.Classes)) {
                if (cls.Name === req.params.className) {
                    obj = cls.DefaultProperties; break;
                }
            }

            break;

        case 'Class': case 'Members': obj = roblox.getClass(API, req.params.className); break;
        case 'Enum': case 'Items': obj = roblox.getEnum(API, req.params.enumName); break;

        case 'EnumItem': obj = roblox.getEnumItem(API, req.params.enumName, req.params.enumItemIdentifier); break;
        case 'Member': obj = roblox.getMember(API, req.params.className, req.params.memberName); break;
        
        default: break;
    }

    res.status(obj ? 200 : 404).send(obj ? ((type === 'Items' || type === 'Members') ? obj[type] : obj) : { message: 'Not Found' });
}

export default async function(app: express.Express) {
    await update();

    const mainRouter = express.Router();

    const v1 = express.Router(); {
        v1.get('/', (req, res) => res.send(API))
        .get('/version', (req, res) => res.send(API.Version.toString()));

        Classes: {
            v1.get('/classes', (req, res) => res.send(API.Classes))
            .get('/classes/:className', (req, res) => send(req, res, 'Class'))
            .get('/classes/:className/members', (req, res) => send(req, res, 'Members'))
            .get('/classes/:className/members/inherited', (req, res) => send(req, res, 'Inherited'))
            .get('/classes/:className/members/defaults', (req, res) => send(req, res, 'Defaults'))
            .get('/classes/:className/members/:memberName', (req, res) => send(req, res, 'Member'));
        }

        Enums: {
            v1.get('/enums', (req, res) => res.send(API.Enums))
            .get('/enums/:enumName', (req, res) => send(req, res, 'Enum'))
            .get('/enums/:enumName/items', (req, res) => send(req, res, 'Items'))
            .get('/enums/:enumName/items/:enumItemIdentifier', (req, res) => send(req, res, 'EnumItem'));
        }

        Icons: {
            mainRouter.get('/icons', (req, res) => res.send(iconIndex))
            .get('/icons/latest', (req, res) => res.contentType('image/png').send(fs.readFileSync(path.join(RESOURCE_DIR, 'classImages.png'))))
            .get('/icons/:iconParam', (req, res) => {
                res.contentType('image/png');

                if (Number(req.params.iconParam)) {
                    res.send(fs.readFileSync(path.join(RESOURCE_DIR, 'classes', req.params.iconParam + '.png')));
                } else {
                    let obj = roblox.getClass(API, req.params.iconParam);

                    if (obj) {
                        res.send(fs.readFileSync(path.join(RESOURCE_DIR, 'classes', obj.ImageIndex + '.png')));
                    } else {
                        res.status(404).send({ message: 'Not Found' });
                    }
                }
            });
        }

        v1.get('/all', (req, res) => {
            res.send({ api: API, defaults: defaults, iconIndex: iconIndex });
        });
    }
    
    mainRouter.use('/v1', v1);

    app.use(subdomain('reflection', mainRouter));
}

function insertMeta(xml: string) {
    const obj = parse(xml);

    for (let container of obj.root.children) {
        if (container.attributes.class === 'ReflectionMetadataClasses') {
            for (let child of container.children) {
                if (child.attributes.class === 'ReflectionMetadataClass') {
                    for (let cls of child.children) {
                        let nameElement = cls.children.find(element => {
                            return element.attributes.name === 'Name';
                        });

                        if (nameElement && nameElement.content) {
                            let rbxClass = roblox.getClass(API, nameElement.content);

                            if (rbxClass) {
                                for (let element of cls.children) {
                                    if (element.content) {
                                        switch (element.attributes.name) {
                                            case 'ExplorerOrder':
                                                rbxClass.SortOrder = Number(element.content); break;

                                            case 'ExplorerImageIndex':
                                                rbxClass.ImageIndex = Number(element.content); break;

                                            case 'summary':
                                                rbxClass.Summary = element.content; break;

                                            case 'ClassCategory':
                                                rbxClass.ClassCategory = element.content; break;

                                            default: break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

import generateIcons from './generate-icons';
const RESOURCE_DIR = path.join(__dirname, '..', 'tmp');

if (!fs.existsSync(RESOURCE_DIR)) {
    fs.mkdirSync(RESOURCE_DIR);
}

function update(): Promise<void> {
    return new Promise((resolve, reject) => {
        Promise.all([
            request('https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Tracker/roblox/API-Dump.json'),
            request('https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Tracker/roblox/ReflectionMetadata.xml'),
            request('https://raw.githubusercontent.com/Muoshuu/static/master/rbx/api/default_properties.json'),

            generateIcons(path.join(__dirname, '..', 'tmp'))

        ]).then(res => {
            API = JSON.parse(res[0]); insertMeta(res[1]);
            defaults = JSON.parse(res[2]);

            for (let cls of API.Classes) {
                iconIndex[cls.Name] = cls.ImageIndex;
            }
            
            resolve();
        }).catch(reject);
    });
}

setInterval(() => {
    update().then(() => {
        console.log('Reflection updated');
    }).catch(err => {
        console.error(err);

        setTimeout(update, 30000); // 30s later
    });
}, 3600000); // Every hour