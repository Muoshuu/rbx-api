import request = require('request-promise');
import express = require('express');
import parse = require('xml-parser');
import path = require('path');
import fs = require('fs');
import clone = require('clone');

import * as Roblox from './interfaces';

let API: Roblox.APIDump;

function getResponse(req: express.Request, res: express.Response, type: string, name: string, arg?: string): void {
	let obj: any; switch(type) {
		case 'Class': case 'Members': obj = Roblox.getClass(API, name); break;
		case 'Enum': case 'Items': obj = Roblox.getEnum(API, name); break;

		case 'EnumItem': obj = Roblox.getEnumItem(API, arg || '', name); break;
		case 'Member': obj = Roblox.getMember(API, arg || '', name); break;
		
		default: break;
	}

	if (obj) {
		if (type === 'Items' || type === 'Members') {
			obj = obj[type];
		}

		if (req.query.defaults !== undefined) {
			obj = clone(obj); obj.Defaults = (Roblox.Defaults as any)[name];
		}
			
		if (req.query.inherited !== undefined && obj.Superclass) {
			obj = clone(obj); obj.Members = obj.Members.concat(Roblox.getInheritedMembers(API, obj.Superclass) || []);
		}

		res.status(200).json(obj);
	} else {
		res.status(404).json({ message: 'Not Found' });
	}
}

export async function serveReflection(app: express.Express) {
	await updateReflection();

	app.get('/dump', (req, res) => {
		res.json(API);
	}).get('/dump/version', (req, res) => {
		res.send(API.Version.toString());
	});

	classes: {
		const router = express.Router();

		router.get(`/`, (req, res) => {
			res.json(API.Classes);
		}).get('/:className', (req, res) => {
			getResponse(req, res, 'Class', req.params.className);
		}).get(`/:className/members`, (req, res) => {
			getResponse(req, res, 'Members', req.params.className);
		}).get(`/:className/members/:memberName`, (req, res) => {
			getResponse(req, res, 'Member', req.params.memberName, req.params.className);
		});

		app.use('/dump/classes', router);
	}

	enums: {
		const router = express.Router();

		router.get(`/`, (req, res) => {
			res.json(API.Enums);
		}).get('/:enumName', (req, res) => {
			getResponse(req, res, 'Enum', req.params.enumName);
		}).get(`/:enumName/items`, (req, res) => {
			getResponse(req, res, 'Items', req.params.enumName);
		}).get(`/:enumName/items/:itemParam`, (req, res) => {
			getResponse(req, res, 'EnumItem', req.params.itemParam, req.params.enumName);
		});

		app.use('/dump/enums', router);
	}

	setInterval(() => {

	}, 60000);
}

export function updateReflection(): Promise<void> {
	return new Promise(resolve => {
		Promise.all([
			request('https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Tracker/roblox/API-Dump.json'),
			request('https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Tracker/roblox/ReflectionMetadata.xml')
		]).then(values => {
			let dump = JSON.parse(values[0]); API = dump;

			insertMetadata(values[1]);
			
			resolve();
			
			try {
				fs.accessSync(path.join(__dirname, 'fallback'), fs.constants.F_OK);
			} catch (err) {
				fs.mkdirSync(path.join(__dirname, 'fallback'));
			}

			fs.writeFileSync(path.join(__dirname, 'fallback', 'API-Dump.json'), values[0]);
			fs.writeFileSync(path.join(__dirname, 'fallback', 'ReflectionMetadata.xml'), values[1]);
		}).catch(err => {
			console.error(err);
			
			API = JSON.parse(fs.readFileSync(path.join(__dirname, 'fallback', 'API-Dump.json')).toString());
			insertMetadata(fs.readFileSync(path.join(__dirname, 'fallback', 'ReflectionMetadata.xml')).toString());
			
			resolve();
		});
	});
}

export function insertMetadata(xml: string): void {
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
							let rbxClass = Roblox.getClass(API, nameElement.content);

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