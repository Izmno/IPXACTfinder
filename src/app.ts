import fs from 'fs';
import { join, extname } from 'path';

function findXML(dir: string, recursive?: boolean): string[] {
    if (!fs.existsSync(dir)) {
        throw new Error("Path " + dir + "  does not exist");
    }

    var files = [] as string[];

    for (var file of fs.readdirSync(dir)) {
        var filename = join(dir, file);

        if (fs.lstatSync(filename).isDirectory() && recursive) {
            files.push(...findXML(filename, recursive));
        }

        else if ( isXML(filename) ) {
            files.push(filename);
        }
        
    }

    return files;
}

function isXML(filename: string): boolean {
    return [".xml"].includes(extname(filename.toLowerCase()));
}


/**
 * Test this out
 */
var data_dir = "data"


for (var file of findXML(data_dir, true)) {
    console.log(file);
}
