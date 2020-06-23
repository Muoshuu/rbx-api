import * as clone from 'clone';
import * as path from 'path';
import * as fs from 'fs';
import * as xmlParser from 'xml-parser';

import { ClassIconPaths } from 'rbx-icons';

export type Type = { Name: string, Category: string };
export type Property = { Type: string, Value: any };

export type SecurityTag = 'None' | 'LocalUserSecurity' | 'PluginSecurity' | 'RobloxScriptSecurity' | 'RobloxSecurity' | 'NotAccessibleSecurity';

export type Member = {
    Name: string,
    Category: string,
    MemberType: string,
    Security: { Read: SecurityTag, Write: SecurityTag } | SecurityTag,
    Serialization: { CanSave: boolean, CanLoad: boolean },
    Tags?: string[],
    Parameters?: { Name: string, Type: Type }[],
    ValueType?: Type,
    ReturnType?: Type,
    DefaultValue?: Property,
    InheritedFrom?: string
};

export type Class = {
    Name: string,
    MemoryCategory: string,
    Superclass: string,
    Members:  Member[],
    SortOrder?: number,
    ImageIndex?: number,
    Tags?: string[],
    Summary?: string,
    ClassCategory?: string,
    DefaultProperties?: { [propertyName: string]: Property }
};

export type EnumItem = {
    Name: string,
    Value: number,
    Description?: string,
    IsDeprecated?: boolean,
    IsBrowsable?: boolean
};

export type Enum = {
    Name: string,
    Description?: string,
    IsDeprecated?: boolean,
    Items: EnumItem[]
};

export type OriginalAPI = {
    Classes: Class[],
    Enums: Enum[],
    Version: number
};

export type Defaults = {
    Classes: { [className: string]: Class },
    Version: [ number, number, number, number ]
};

export type APIRequestOptions = {
    defaults?: boolean,
    inherited?: boolean
};

type ClassMetadata = {
    ClassName: string,
    SortOrder?: number,
    ImageIndex?: number,
    Summary?: string,
    ClassCategory?: string;
};

type ClassIconIndex = {
    [className: string]: number
};

export function parseXML(xml: string) {
    const data: ClassMetadata[] = [];
    const object = xmlParser(xml);

    for (let container of object.root.children) {
        if (container.attributes.class === 'ReflectionMetadataClasses') {
            for (let child of container.children) {
                if (child.attributes.class === 'ReflectionMetadataClass') {
                    for (let cls of child.children) {
                        let nameElement = cls.children.find(element => {
                            return element.attributes.name === 'Name';
                        });

                        if (nameElement && nameElement.content) {
                            let classMetadata: ClassMetadata = { ClassName: nameElement.content };

                            for (let element of cls.children) {
                                if (element.content) {
                                    switch (element.attributes.name) {
                                        case 'ExplorerOrder':
                                            classMetadata.SortOrder = Number(element.content); break;

                                        case 'ExplorerImageIndex':
                                            classMetadata.ImageIndex = Number(element.content); break;

                                        case 'summary':
                                            classMetadata.Summary = element.content; break;

                                        case 'ClassCategory':
                                            classMetadata.ClassCategory = element.content; break;

                                        default: break;
                                    }
                                }
                            }

                            data.push(classMetadata);
                        }
                    }
                }
            }
        }
    }

    return data;
}

export class API {
    constructor(
        private iconPaths: ClassIconPaths,
        private api: OriginalAPI,
        private defaults: Defaults,
        private metadataXML: string
    ) {
        this.Enums = api.Enums;
        this.Classes = api.Classes;
        this.Metadata = parseXML(metadataXML);

        this.IconIndex = {};

        for (let className in iconPaths) {
            this.IconIndex[className] = Number(path.basename(iconPaths[className], path.extname(iconPaths[className])));
        }

        for (let rbxClass of this.Classes) {
            let inheritedMembers = this._getMembers(rbxClass.Name);
            let defaultValues = defaults.Classes[rbxClass.Name]?.DefaultProperties;
            let metadata = this.Metadata.find(metadata => metadata.ClassName === rbxClass.Name);

            rbxClass.SortOrder = metadata?.SortOrder;
            rbxClass.ImageIndex = metadata?.ImageIndex;
            rbxClass.Summary = metadata?.Summary;
            rbxClass.ClassCategory = metadata?.ClassCategory;

            let rbxClassWithDefaults = clone(rbxClass);
            let rbxClassWithInherited = clone(rbxClass);
            let rbxClassWithBoth = clone(rbxClass);

            if (inheritedMembers) {
                for (let member of inheritedMembers) {
                    if (!rbxClass.Members.find(m => m.Name === member.Name)) {
                        rbxClassWithInherited.Members.push(member);
                        rbxClassWithBoth.Members.push(clone(member));
                    }
                }
            }

            if (defaultValues) {
                for (let member of rbxClassWithInherited.Members) {
                    if (defaultValues[member.Name]) {
                        let memberOfDefaults = rbxClassWithDefaults.Members.find(m => m.Name === member.Name );
                        let memberOfAll = rbxClassWithBoth.Members.find(m => m.Name === member.Name );

                        if (memberOfDefaults) { memberOfDefaults.DefaultValue = defaultValues[member.Name]; }
                        if (memberOfAll) { memberOfAll.DefaultValue = defaultValues[member.Name]; }
                    }
                }
            }

            this.Defaults.push(rbxClassWithDefaults);
            this.Inherited.push(rbxClassWithInherited);
            this.AllData.push(rbxClassWithBoth);
        }
    }

    public IconIndex: ClassIconIndex;
    public Metadata: ClassMetadata[];
    public Classes: Class[];
    public Enums: Enum[];

    public Defaults: Class[] = [];
    public Inherited: Class[] = [];
    public AllData: Class[] = [];

    private _getClass(className: string): Class | undefined {
        for (let rbxClass of this.Classes) {
            if (rbxClass.Name === className) {
                return rbxClass;
            }
        }
    }

    private _getMembers(className: string): Member[] | undefined {
        let rbxClass = this._getClass(className);

        if (rbxClass) {
            let members: Member[] = [];

            for (let member of rbxClass.Members) {
                members.push(member);
            }

            if (rbxClass.Superclass) {
                let inheritedMembers = this._getMembers(rbxClass.Superclass);

                if (inheritedMembers) {
                    for (let member of inheritedMembers) {
                        if (!members.some(m => m.Name === member.Name)) {
                            if (!member.InheritedFrom) {
                                member = clone(member);
                                member.InheritedFrom = rbxClass.Superclass;
                            }

                            members.push(member);
                        }
                    }
                }
            }

            return members;
        }
    }

    private _getClasses(options?: APIRequestOptions): Class[] {
        if (options) {
            if (options.inherited && options.defaults) {
                return this.AllData;
            } else if (options.inherited) {
                return this.Inherited;
            } else if (options.defaults) {
                return this.Defaults;
            }
        }

        return  this.Classes;
    }

    getAllLegacy() {
        return { api: this.api, defaults: this.defaults, iconIndex: this.IconIndex };
    }

    getAPI(): OriginalAPI {
        return this.api;
    }

    getAll(): any {
        return this.AllData;
    }

    getClasses(options?: APIRequestOptions): Class[] {
        return this._getClasses(options);
    }

    getClass(className: string, options?: APIRequestOptions): Class | undefined {
        return this._getClasses(options).find(rbxClass => rbxClass.Name === className);
    }

    getMembers(className: string, options?: APIRequestOptions): Member[] | undefined {
        return this.getClass(className, options)?.Members;
    }

    getMember(className: string, memberName: string, options?: APIRequestOptions): Member | undefined {
        return this.getMembers(className, options)?.find(member => member.Name === memberName);
    }

    getEnums(): Enum[] | undefined {
        return this.Enums;
    }

    getEnum(enumName: string): Enum | undefined {
        return this.Enums.find(rbxEnum => rbxEnum.Name === enumName);
    }

    getEnumItems(enumName: string): EnumItem[] | undefined {
        return this.Enums.find(rbxEnum => rbxEnum.Name === enumName)?.Items;
    }

    getEnumItem(enumName: string, enumItemIdentifier: string | number): EnumItem | undefined {
        return this.getEnumItems(enumName)?.find(enumItem => enumItem.Name === enumItemIdentifier || enumItem.Value === Number(enumItemIdentifier));
    }

    getSheet(): Buffer | undefined {
        let filePath = path.join(this.iconPaths.Part, '..', 'sheet.png');

        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath);
        }
    }

    getIconIndex(): ClassIconIndex {
        return this.IconIndex;
    }

    getIcon(iconIdentifier: string | number): Buffer | undefined {
        let n = Number(iconIdentifier);

        if (n || n === 0) {
            let filePath = path.join(this.iconPaths.Part, '..', iconIdentifier + '.png');

            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath);
            }
        }

        if (typeof iconIdentifier === 'string') {
            let filePath = this.iconPaths[iconIdentifier];

            if (filePath) {
                return fs.readFileSync(filePath);
            }
        }
    }

    getXML(): string {
        return this.metadataXML;
    }
}