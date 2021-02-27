import { XMLElement } from './xmlutils';


export interface IVersionedIDConstructor {
    new (obj: XMLElement): IVersionedID;
}

export interface IVersionedID {
    vendor: string;
    library: string;
    name: string;
    version: string;
    
    VLNV(): string;
}

export default function createTopLevel(obj: XMLElement) {
    switch (obj.tag.toLowerCase()) {
        case "busdefinition":
            return new BusDefinition(obj);
        case "abstractiondefinition":
            return new AbstractionDefintion(obj);
        case "component": 
            return new Component(obj);
        case "design:":
            return new Design(obj);
        case "abstractor":
            return new Abstractor(obj);
        case "generatorchain":
            return new GeneratorChain(obj);
        case "designconfiguration":
            return new DesignConfiguration(obj);
        case "catalog":
            return new Catalog(obj);
        default:
            throw new Error(`Invalid Top level IP-XACT element. XML tag: ${obj.tag}`);
    }

}



export abstract class TopLevel implements IVersionedID {
    abstract ipxacttype: string;
    vendor: string;
    library: string;
    name: string;
    version: string;

    constructor (obj: XMLElement) {
        try {
            this.vendor = obj.getChild("vendor").text || "";
            this.library = obj.getChild("library").text || "";
            this.name = obj.getChild("name").text || "";
            this.version = obj.getChild("version").text || "";
        } catch (e) {
            console.log(e);
            throw new Error("Invalid Top level IP-XACT element")
        }        
    }

    VLNV(): string {
        return this.vendor + ':' + this.library + ':' + this.name + ':' + this.version;
    }
}

export class BusDefinition extends TopLevel { 
    ipxacttype = 'BusDefinition' 
}
export class AbstractionDefintion extends TopLevel {
    ipxacttype = 'AbstractionDefinition';
}
export class Component extends TopLevel {
    ipxacttype = 'Component';
}
export class Design extends TopLevel { 
    ipxacttype = 'Design';
}
export class Abstractor extends TopLevel { 
    ipxacttype = 'Abstractor';
}
export class GeneratorChain extends TopLevel { 
    ipxacttype = 'GeneratorChain';
}
export class DesignConfiguration extends TopLevel { 
    ipxacttype = 'DesignConfiguration';
}
export class Catalog extends TopLevel { 
    ipxacttype = 'Catalog';
}