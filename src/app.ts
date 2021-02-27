import { findXML } from './xmlutils';
import createTopLevel, { TopLevel } from './ipxact';





/**
 * Test this out
 */
var data_dir = "data"

var xmls = findXML(data_dir, true);
var ips = [ ] as {path: string, toplevel: TopLevel}[]

for (let xml of xmls) {
    ips.push({path: xml.path, toplevel: createTopLevel(xml.el)});
}


for (let ip of ips) {
    console.log(`[${ip.toplevel.ipxacttype}] ${ip.toplevel.VLNV()} at ${ip.path}`);
}