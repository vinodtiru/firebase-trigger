import * as fs from "fs";
import * as path from "path";
import { Doc, DocFile, DocFileSystem, DocFolder } from "../interface/interface";
import * as docUtil from "./doc-util";
import * as moment from "moment";
import * as core from "@actions/core";

let timeFilePath = "/Users/vi40070509/Work/Docs/Time.txt";

export function getLastUpdatedTime(): number {
  return Number.parseInt(fs.readFileSync(timeFilePath).toString());
}

export function setLastUpdatedTime() {
  // write current time in ms
  fs.writeFileSync(timeFilePath, moment(new Date()).valueOf().toString());
}

export function readAllMDFile(dir: string, time: number): Array<Doc> {
  let docs: Array<Doc> = [];
  readMDFile(docs, dir, time);
  return docs;
}

function readMDFile(docs: Array<Doc>, dir: string, time: number) {
  let files = fs.readdirSync(path.resolve(dir));

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    core.info(`Time 1 ${file} - ${fs.statSync(dir + "/" + file).mtimeMs} - ${fs.statSync(dir + "/" + file).ctimeMs}`);
    
    if (file.indexOf(".") < 0) {
      readMDFile(docs, dir + "/" + file, time);
    } else if (
      file.endsWith(".md") &&
      (fs.statSync(dir + "/" + file).mtimeMs > time ||
        fs.statSync(dir + "/" + file).ctimeMs > time)
    ) {
      // run this only for newly modified files
      let content = fs.readFileSync(dir + "/" + file);
      let d = docUtil.getDoc(content.toString());
      d.filename = file;
      docs.push(d);
    }
  }
}

export function updateFolderPath(
  dir: string,
  folder: DocFileSystem
): DocFileSystem {
  core.info(`update Folder is Called`);
  
  let files = fs.readdirSync(path.resolve(dir));
  core.info(`Files Read for ${path}`);
  
  files.forEach(async (file) => {
    core.info(`inside foreach ${file}`);
  
    if (file.indexOf(".") < 0) {
      (folder as DocFolder).items.push(
        updateFolderPath(dir + "/" + file, new DocFolder(file, "folder"))
      );
    } else if (file.endsWith(".md")) {
      core.info(`this is a md file ${file}`);
      let d = new DocFile(file.replace(".md",""), "description");
      (folder as DocFolder).items.push(d);
    }
  });
  return folder;
}

export function isFileUpdate(
  dir: string,
  time: number,
  isUpdated: boolean
): boolean {
  // break if isUpdated true
  if (isUpdated) return isUpdated;

  let files = fs.readdirSync(path.resolve(dir));
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (file.indexOf(".") < 0) {
      if (
        fs.statSync(dir + "/" + file).mtimeMs > time ||
        fs.statSync(dir + "/" + file).ctimeMs > time
      ) {
        isUpdated = true;
      }
      isUpdated = isFileUpdate(dir + "/" + file, time, isUpdated);
    } else if (
      file.endsWith(".md") &&
      fs.statSync(dir + "/" + file).mtimeMs > time
    ) {
      isUpdated = true;
    }
  }
  return isUpdated;
}
