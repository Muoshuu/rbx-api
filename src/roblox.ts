export interface Table { [key: string]: any; }
export interface Type { name: string; category: string; }

export interface Member {
    Name: string;
    Category: string;
    MemberType: string;
    Security: { read: string; write: string };
    Serialization: { canLoad: boolean; canSave: boolean; };
    ValueType?: Type;
    ReturnType?: Type;
    Parameters?: { name: string; type: Type }[];
    Tags: string[];
}

export interface Class {
    Name: string;
    MemoryCategory: string;
    Superclass: string;
    Tags: string[];
    Members: Member[];
    DefaultProperties?: Table;
    SortOrder: number;
    ImageIndex: number;
    Summary: string;
    ClassCategory: string;
}

export interface EnumItem {
    Name: string;
    Value: number;
    Description?: string;
    IsBrowsable?: boolean;
    IsDeprecated?: boolean;
}

export interface Enum {
    Name: string;
    Description?: string;
    IsDeprecated?: boolean;
    Items: EnumItem[];
}

export interface APIDump {
    Classes: Class[];
    Enums: Enum[];
    Version: number;
}

export function getClass(API: APIDump | Table, className: string): Class | void {
    for (let obj of API.Classes) {
        if (obj.Name === className) {
            return obj;
        }
    }
}

export function getMember(API: APIDump, className: string, memberName: string): Member | void {
    let rbxClass = getClass(API, className);

    if (rbxClass) {
        for (let item of rbxClass.Members) {
            if (item.Name === memberName) {
                return item;
            }
        }
    }
}

export function getEnum(API: APIDump, enumName: string): Enum | void {
    for (let obj of API.Enums) {
        if (obj.Name === enumName) {
            return obj;
        }
    }
}

export function getEnumItem(API: APIDump, enumName: string, nameOrValue: string | number): EnumItem | void {
    let rbxEnum = getEnum(API, enumName);

    if (rbxEnum) {
        for (let item of rbxEnum.Items) {
            if (item.Name === nameOrValue || item.Value === Number(nameOrValue)) {
                return item;
            }
        }
    }
}

export function getInheritedMembers(API: APIDump, className: string): Member[] | void {
    let rbxClass = getClass(API, className);
    
    if (rbxClass) {
        let members = [];

        for (let member of rbxClass.Members) {
            members.push(member);
        }

        if (rbxClass.Superclass) {
            members = members.concat(getInheritedMembers(API, rbxClass.Superclass) || []);
        }

        return members;
    }
}