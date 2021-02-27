"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
function findXML(dir, recursive) {
    if (!fs_1.default.existsSync(dir)) {
        throw new Error("Path " + dir + "  does not exist");
    }
    var files = [];
    for (var file of fs_1.default.readdirSync(dir)) {
        var filename = path_1.join(dir, file);
        if (fs_1.default.lstatSync(filename).isDirectory() && recursive) {
            files.push(...findXML(filename, recursive));
        }
        else if (isXML(filename)) {
            files.push(filename);
        }
    }
    return files;
}
function isXML(filename) {
    return [".xml"].includes(path_1.extname(filename.toLowerCase()));
}
/**
 * Test this out
 */
var data_dir = "data";
for (var file of findXML(data_dir, true)) {
    console.log(file);
}
//# sourceMappingURL=app.js.map