import { findXML, XMLAttribute, XMLElement } from './xmlutils';


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

export default function createTopLevel(tag: string, vendor: string, library: string, name: string, version: string) {
    switch (tag.toLowerCase()) {
        case "busdefinition":
            return new BusDefinition(vendor, library, name, version);
        case "abstractiondefinition":
            return new AbstractionDefinition(vendor, library, name, version);
        case "component": 
            return new Component(vendor, library, name, version);
        case "design:":
            return new Design(vendor, library, name, version);
        case "abstractor":
            return new Abstractor(vendor, library, name, version);
        case "generatorchain":
            return new GeneratorChain(vendor, library, name, version);
        case "designconfiguration":
            return new DesignConfiguration(vendor, library, name, version);
        case "catalog":
            return new Catalog(vendor, library, name, version);
        default:
            throw new Error(`Invalid Top level IP-XACT element. XML tag: ${tag}`);
    }

}





/**
 * Some work on collection as first IPXact implementation
 */

 /*
export interface stringIndexable {
    [property: string] : any;
}

export interface numberIndexable {
    [property: number] : any;
}

export type element = stringIndexable | number | string;
*/


export interface ISerializable {
    serialize(): string;
}

export interface IXMLGenerator {
    XMLElement(): XMLElement | XMLAttribute;
}

export interface IfromXML {
    fromXMLElement(el: XMLElement): IfromXML;
}

export interface IipxactType extends ISerializable, IXMLGenerator {
    value?: string;
    _asAttribute: string[];
    _asElement: string[];
    _xml_namespace?: string;
    _tag: string;

    getProperty<T extends IipxactType, K extends keyof T>(o: T, propertyName: K): T[K];
 }


 /**
  * TODO: attributes can be lists
  */
 export abstract class ipxactType implements IipxactType {
    value?: string;

    abstract _xml_namespace?: string;
    abstract _tag: string;
    _asAttribute: string[];
    _asElement: string[];

    constructor() {

        this._asAttribute = [];
        this._asElement = [];
    }


    /**
     * TODO: this is not implemented
     */
    serialize(): string {
        return this.XMLElement().serialize();
    }

    XMLElement(): XMLElement {
        // Properties marked as _asAttribute
        //
        var atts = [] as XMLAttribute[];
        for (let key of this._asAttribute) {
            try {
                // Any property marked as _asAttribute should always be a number or string property
                // we can use String(value) to create the attribute
                var val = this.getProperty(this, key as keyof this);
                atts.push(new XMLAttribute(key, String(val), this._xml_namespace))
            } catch {
                // fail silently
            }
        }

        // Properties marked as _asElement
        // Should generate a child element of the one we are generating
        // Could be either a string or number, an IipxactType, or a list of any of the previous
        var children = [] as (XMLElement)[];
        for (let key of this._asElement) {
            try {
                var val = this.getProperty(this, key as keyof this) ;
                var child = ipxactType.generateXML(key, this._xml_namespace, val);
                if (child){
                    children.push(child);
                }
            } catch (e) {
                console.log("failing silently");
            }
        }
        var xml = new XMLElement(this._tag, this._xml_namespace);
        xml.attributes = atts;
        xml.children = children;
        return xml;
    }

    static generateXML(key: string, namespace: string | undefined, value: any): XMLElement | undefined {
        if (value instanceof ipxactType) {
            var el = value.XMLElement();
            if (el instanceof XMLElement) {
                return el;
            }
        }
        else if (typeof value == 'string' || typeof value == 'number') {
            var el = new XMLElement(key, namespace);
            el.text = String(value);
            return el;
        }
        else if (value instanceof Array && value.length > 0) {
            var el = new XMLElement(key, namespace);
            for (let aval of value) {
                var child = ipxactType.generateXML(key, namespace, aval);
                if (child) {
                    el.children.push(child);
                }
            }
            return el;
        }
        // fail silently on unsupported types
        return undefined;
    }

    /**
     * Gets a property of this class. 
     * Should return either 
     *  - string
     *  - number
     *  - an object implementing IipxactType
     *  - a list of any of the previous
     * @param o: any element of a class extending this class
     * @param propertyName: the property to be accessed
     */
    getProperty<T extends IipxactType, K extends keyof T>(o: T, propertyName: K): T[K] {
        return o[propertyName];
    }
 }

export interface IipxactFile extends IipxactType {
    vlnv: string;
    name: string;
    description: string;
    vendorExtensions: IipxactType[]

    addVendorExtension(ext: IipxactType): void;
}

/**
 * TODO: vlnv is not a string
 */
export class ipxactFile extends ipxactType implements IipxactFile {
    vlnv: string;
    name: string;
    description: string;
    vendorExtensions: IipxactType[];

    _tag = 'ipxactFile';
    _xml_namespace = 'spirit';

    constructor(vlnv: string, name: string, description: string) {
        super();
        this.vlnv = vlnv;
        this.name = name;
        this.description = description;
        this.vendorExtensions = [];
        this._asElement.push('vlnv', 'name', 'description', 'vendorExtensions');
    }

    static fromTopLevel(toplevel: TopLevel, fileref?: string): ipxactFile {
        if (toplevel.fileref) {
            // todo: description
            return new ipxactFile(toplevel.VLNV(), toplevel.fileref, toplevel.description || '');
        }
        else if (fileref) {
            return new ipxactFile(toplevel.VLNV(), fileref, toplevel.description || '');
        }
        else {
            throw new Error("No file reference set in topLevel");
        }
    }

    addVendorExtension(ext: IipxactType): void {
        this.vendorExtensions.push(ext);
    }
}

export abstract class TopLevel extends ipxactType implements IVersionedID  {
    vendor: string;
    library: string;
    name: string;
    version: string;

    description?: string;

    // optional path to xml file describing this toplevel element
    fileref?: string;

    _xml_namespace = 'spirit';

    constructor (vendor: string, library: string, name: string, version: string) {
        super();
        this.vendor = vendor;
        this.library = library;
        this.name = name;
        this.version = version;
        this._asElement.push('vendor', 'library', 'name', 'version');

    }

    static fromXMLElement(el: XMLElement): TopLevel {
        try {
            var vendor = el.getChild("vendor").text || "";
            var library = el.getChild("library").text || "";
            var name = el.getChild("name").text || "";
            var version = el.getChild("version").text || "";
            return createTopLevel(el.tag, vendor, library, name, version);
        }
        catch (e) {
            console.log(e);
            throw new Error("Invalid Top level IP-XACT element")
        }
    }

    VLNV(): string {
        return this.vendor + ':' + this.library + ':' + this.name + ':' + this.version;
    }
}

export class BusDefinition extends TopLevel { 
    _tag = 'busDefinition' 
}
export class AbstractionDefinition extends TopLevel {
    _tag = 'abstractionDefinition';
}
export class Component extends TopLevel {
    _tag = 'component';
}
export class Design extends TopLevel { 
    _tag = 'design';
}
export class Abstractor extends TopLevel { 
    _tag = 'abstractor';
}
export class GeneratorChain extends TopLevel { 
    _tag = 'generatorChain';
}
export class DesignConfiguration extends TopLevel { 
    _tag = 'designConfiguration';
}

export interface ICatalog extends IipxactType, IVersionedID {
    busDefinitions: IipxactFile[];
    abstractionDefinitions: IipxactFile[];
    components: IipxactFile[];
    abstractors: IipxactFile[];
    designs: IipxactFile[];
    designConfigurations: IipxactFile[];
    generatorChains: IipxactFile[]

} 

function lowerFirst(input: string): string {
    if (input.length > 1) {
        return input.charAt(0).toLowerCase() + input.slice(1);
    } else {
        return input.toLowerCase();
    }
}

export class Catalog extends TopLevel implements ICatalog {
    busDefinitions = [] as IipxactFile[];
    abstractionDefinitions = [] as IipxactFile[];
    components = [] as IipxactFile[];
    abstractors = [] as IipxactFile[];
    designs = [] as IipxactFile[];
    designConfigurations = [] as IipxactFile[];
    generatorChains = [] as IipxactFile[];
    catalogs = [] as IipxactFile[];

    _tag = 'catalog';

    constructor(vendor: string, library: string, name: string, version: string) {
        super(vendor, library, name, version);
        this._asElement.push('busDefinitions', 'abstractionDefinitions', 'components', 'abstractors', 'designs', 'designConfigurations', 'generatorChains', 'catalogs')
    }

    addIP(ip: TopLevel): void {
        switch (ip._tag.toLowerCase()) {
            case "busdefinition":
                this.busDefinitions.push(ipxactFile.fromTopLevel(ip));
                break;
            case "abstractiondefinition":
                this.abstractionDefinitions.push(ipxactFile.fromTopLevel(ip));
                break;
            case "component": 
                this.components.push(ipxactFile.fromTopLevel(ip));
                break;
            case "design:":
                this.designs.push(ipxactFile.fromTopLevel(ip));
                break;
            case "abstractor":
                this.abstractors.push(ipxactFile.fromTopLevel(ip));
                break;
            case "generatorchain":
                this.generatorChains.push(ipxactFile.fromTopLevel(ip));
                break;
            case "designconfiguration":
                this.designConfigurations.push(ipxactFile.fromTopLevel(ip));
                break;
            case "catalog":
                this.catalogs.push(ipxactFile.fromTopLevel(ip));
                break;
            default:
                throw new Error(`Invalid Top level IP-XACT element. XML tag: "${ip._tag}"`);
        }
    }
}


