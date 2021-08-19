import * as core from "@actions/core";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import moment = require("moment");
import { DocFile, DocFileSystem, DocFolder } from "./interface/interface";
import {
  // getLastUpdatedTime,
  // isFileUpdate,
  // readAllMDFile,
  // setLastUpdatedTime,
  updateFolderPath,
} from "./utils/file-util";

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

//Record<string, any>
const updateFirestoreDatabase = (path: string, document: string, value: any) => {
  core.info(`Updating Firestore Database at collection: ${path} document: ${document} and value: ${value}`);
  firebase
    .firestore()
    .collection(path)
    .doc(document)
    .set(JSON.parse(JSON.stringify(value)))
    .then(
      () => {
        process.exit(core.ExitCode.Success);
      },
      (reason) => {
        core.info(JSON.stringify(reason));
        core.setFailed(JSON.stringify(reason));
        process.exit(core.ExitCode.Failure);
      }
    );
};



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

    updateFirestoreDatabase(projName + "-docs", "time", {"lastupdated":moment(new Date()).valueOf().toString()})
    // setLastUpdatedTimeToDB();
    core.info(`Time written to DB`);

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
