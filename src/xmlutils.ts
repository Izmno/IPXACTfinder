import fs from 'fs';
import path from 'path';
import convert from 'xml-js';

import {newline, indentString, prepareXMLText} from './stringutils';

function splitNameSpace(tag: string): {tag: string, namespace?:string} {
    var splits = tag.split(':');        
    if (splits.length > 1) {
        return {tag: splits[1], namespace: splits[0]};
    } else {
        return {tag: splits[1] };
    }
}

function joinNameSpace(tag: string, namespace?: string) {
    return `${namespace? `${namespace}:`: ''}${tag}`;
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

    serialize(): string {
        return `${joinNameSpace(this.key, this.namespace)}${this.value ? `="${this.value}"` : ''} `;
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
        this.namespace = namespace;
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



    /**
     * Serializing methods
     * @param indent 
     * @param notfirst 
     * @param appendTo 
     */
    public serialize(indent?: number, notfirst?: boolean, appendTo?: string) : string {
        var s = appendTo || '';

        var attstring = this.attributes.length > 0 ? ' ' : '';
        for (let att of this.attributes) {
            attstring += att.serialize();
        }

        var initialIndent = indent || 0;
        if (notfirst) {
            s = newline(s, initialIndent);
        } else {
            s = indentString(s, initialIndent);
        }

        if (this.children.length > 0) {
            s += this.xmlOpen();
            for (let child of this.children) {
                s = child.serialize(initialIndent + 4, true, s);
            }
            s = newline(s, initialIndent);
            s += this.xmlClose();
        } else if (this.text) {
            s += this.xmlOpen();
            s += prepareXMLText(this.text, initialIndent + 4);
            s += this.xmlClose();
        } else {
            s += this.xmlOpenClose();
        }
        return s;
    }

    private attString(): string {
        var attstring = this.attributes.length > 0 ? ' ' : '';
        for (let att of this.attributes) {
            attstring += att.serialize();
        }
        return attstring;
    }

    private xmlOpen(): string {
        return this.xmlGeneric(true, false, false)
    }

    private xmlClose(): string {
        return this.xmlGeneric(false, true, false);
    }

    private xmlOpenClose(): string {
        return this.xmlGeneric(true, false, true);
    }

    private xmlGeneric(includeAttributes: boolean, slashOpen: boolean, slashClose: boolean): string {
        return (slashOpen? '</' : '<') +  
            (joinNameSpace(this.tag, this.namespace)) +  
            (includeAttributes? this.attString() : '') + 
            (slashClose? '/>' : '>')
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