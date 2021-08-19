import * as core from "@actions/core";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import moment = require("moment");
import { DocFile, DocFileSystem, DocFolder } from "./interface/interface";

let firebase: admin.app.App;

const isRequired = {
  required: true,
};

const initFirebase = () => {
  try {
    core.info("Initialized Firebase Admin Connection");
    const credentials = core.getInput("credentials", isRequired);

    firebase = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(credentials) as admin.ServiceAccount),
      databaseURL: core.getInput("databaseUrl"),
    });
  } catch (error) {
    core.setFailed(JSON.stringify(error));
    process.exit(core.ExitCode.Failure);
  }
};

const updateFirestoreDatabase = (path: string, document: string, value: Record<string, any>) => {
  core.info(`Updating4 Firestore Database at collection: ${path} document: ${document} and value: ${value}`);
  firebase
    .firestore()
    .collection(path)
    .doc(document)
    .set(value)
    .then(
      () => {
        process.exit(core.ExitCode.Success);
      },
      (reason) => {
        core.setFailed(JSON.stringify(reason));
        process.exit(core.ExitCode.Failure);
      }
    );
};

function updateFolderPath(dir: string, folder: DocFileSystem): DocFileSystem {
  core.info(`update Folder is Called`);

  let files = fs.readdirSync(path.resolve(dir));
  core.info(`Files Read for ${path}`);

  files.forEach(async (file) => {
    core.info(`inside foreach ${file}`);

    if (file.indexOf(".") < 0) {
      core.info(`this is not a md file`);
      (folder as DocFolder).items.push(updateFolderPath(dir + "/" + file, new DocFolder(file, "folder")));
    } else if (file.endsWith(".md")) {
      core.info(`this is a md file ${file}`);
      let d = new DocFile(file.replace(".md", ""), "description");
      (folder as DocFolder).items.push(d);
    }
  });
  core.info(`Finally return`);
  return folder;
}

const processAction = () => {
  initFirebase();

  try {
    const path: string = core.getInput("path", isRequired);
    const projName = core.getInput("projName", isRequired);

    core.info(`Start of new code`);

    let folder = updateFolderPath("./", new DocFolder("docs", "folder"));
    core.info(`Completed Folder read`);
    // write path to Firestore
    updateFirestoreDatabase(projName + "-docs", "path", folder);
    core.info(`Data written to DB`);

    // setLastUpdatedTimeToDB();
    const value2 = {
      name: fs.readFileSync("README.md", "utf8"),
      age: 3,
    };

    const value3 = {
      name: "vinod-123",
      age: moment(new Date()).valueOf().toString(),
    };

    updateFirestoreDatabase(path, "doc2", value2);
  } catch (error) {
    core.setFailed(JSON.stringify(error));
    process.exit(core.ExitCode.Failure);
  }
};

// function setLastUpdatedTimeToDB() {
//   // write current time in ms
//   updateFirestoreDatabase("lastTimeStamp","last", moment(new Date()).valueOf().toString());
// }

processAction();

//////

// import { DocFolder } from "./interface/interface";
// import {
//   // getLastUpdatedTime,
//   // isFileUpdate,
//   // readAllMDFile,
//   // setLastUpdatedTime,
//   updateFolderPath,
// } from "./utils/file-util";

// let folderPath = "./"; // proj.getDocPath();
// let time = getLastUpdatedTime();

// // const data = { name: "vinod kkk ta -latest" };
// // db.collection("doc2").doc("path123").set(data);

// if (isFileUpdate(folderPath, time, false)) {
//   // let folder = updateFolderPath(folderPath, new DocFolder("docs", "folder"));
//   // // write path to Firestore
//   // db.collection(projName + "-docs")
//   //   .doc("path")
//   //   .set(JSON.parse(JSON.stringify(folder)));
//   // let docs = readAllMDFile(folderPath, time);
//   // for (let index = 0; index < docs.length; index++) {
//   //   const doc = docs[index];
//   //   // write each doc to Firestore
//   //   db.collection(projName + "-docs")
//   //     .doc(doc.filename.replace(".md", ""))
//   //     .set(JSON.parse(JSON.stringify(doc)));
//   // }
// }

// setLastUpdatedTime();
