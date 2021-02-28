import { findXML } from './xmlutils';
import createTopLevel, { Catalog, TopLevel } from './ipxact';





/**
 * Test this out
 */
var data_dir = "data"

var xmls = findXML(data_dir, true);
var ips = [] as TopLevel[];

for (let xml of xmls) {
    var toplevel = TopLevel.fromXMLElement(xml.el);
    toplevel.fileref = xml.path;
    ips.push(toplevel);

    //console.log(toplevel);
}

var cat = new Catalog('simonemeyere', 'cats', 'mycatalog', '1.0');

//console.log(cat);

for (let ip of ips) {
    cat.addIP(ip);
}

//console.log(cat);

for (let ip of ips) {
    console.log(ip);
}

console.log(cat.XMLElement().serialize());