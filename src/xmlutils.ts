import fs from 'fs';
import path from 'path';
import convert from 'xml-js';

function splitNameSpace(tag: string): {tag: string, namespace?:string} {
    var splits = tag.split(':');        
    if (splits.length > 1) {
        return {tag: splits[1], namespace: splits[0]};
    } else {
        return {tag: splits[1] };
    }
}

export class XMLAttribute {
    key: string;
    value?: string;
    namespace?: string;

   
    constructor(key: string, namespace?: string, value?: string) {
        this.key = key;
        this.value = value;
        this.namespace = namespace; 
    }
}

export class XMLElement {
    tag: string;
    namespace?: string;
    text?: string;
    attributes = [] as XMLAttribute[]
    children = [] as XMLElement[] 
    
    constructor(tag: string, namespace?: string) {
        this.tag = tag;
    } 

    static fromObject(key: string, obj: Object): XMLElement {
        var { tag, namespace } = splitNameSpace(key);
        var el = new XMLElement(tag, namespace);

        for (const [childkey, value] of Object.entries(obj)) {
            if (childkey == '_attributes'){
                for (const [attkey, attvalue] of Object.entries(value)) {
                    var splittag = splitNameSpace(attkey);
                    el.attributes.push(new XMLAttribute(splittag.tag, splittag?.namespace, String(attvalue)));
                }
            } else if (childkey == '_text') {
                el.text = String(value);
            }
            else {
                el.children.push(XMLElement.fromObject(childkey, value));
            }

        }
        return el;
    }

    static fromFile(path: string): XMLElement {
        var xml = fs.readFileSync(path, 'utf8');
        var json = convert.xml2json(xml, { compact: true, spaces : 4});
        var obj = JSON.parse(json);

        // Assume there are 2 keys in top level: an XML declaration and a top level element
        // return only the top level element
        return XMLElement.fromObject(...(Object.entries(obj)[1] as [string, Object]));
    }

    public getChild(tag: string): XMLElement {
        for (let c of this.children) {
            if (c.tag == tag) {
                return c;
            }
        }
        throw new Error("Tag not found: " + tag);
    }

    public getAttribute(key: string) {
        for (let a of this.attributes) {
            if (a.key == key) {
                return a;
            }
        }
        throw new Error("Key not found: " + key);
    }
}

function isXML(filename: string): boolean {
    return [".xml"].includes(path.extname(filename.toLowerCase()));
}

export function findXML(dir: string, recursive?: boolean) : { path: string; el: XMLElement }[] {
    var list = [ ] as { path: string; el: XMLElement }[];
    
    if (!fs.existsSync(dir)) {
        throw new Error("Path " + dir + "  does not exist");
    }


    for (var file of fs.readdirSync(dir)) {
        var filename = path.join(dir, file);

        if (fs.lstatSync(filename).isDirectory() && recursive) {
            list.push(...findXML(filename, recursive));
        }

        else if ( isXML(filename) ) {
            list.push({ 
                path: filename, 
                el: XMLElement.fromFile(filename)
            });
        }
        
    }
    return list;
}



export default XMLElement;