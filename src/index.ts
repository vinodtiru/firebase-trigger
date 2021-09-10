import * as core from "@actions/core";
import * as admin from "firebase-admin";
import moment = require("moment");
import { DocFile, DocFileSystem, DocFolder } from "./interface/interface";
import {
  readAllMDFile,
  updateFolderPath,
} from "./utils/file-util";

let firebase: admin.app.App;

const isRequired = {
  required: true,
};

const initFirebase = () => {
  try {
    core.info("Initialized Firebase Admin Connection - New");
    const credentials = core.getInput("credentials", isRequired);

    firebase = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(credentials) as admin.ServiceAccount)
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
    const projName = core.getInput("projName", isRequired);

    let folder = updateFolderPath("./docs/", new DocFolder("docs", "folder"));
    core.info(`Completed Folder read`);
    // write path to Firestore
    updateFirestoreDatabase(projName + "-docs", "path", folder);
    core.info(`Path written to DB`);

    let docs = readAllMDFile("./", 0);
    core.info(`Read MD Files completed`);
    for (let index = 0; index < docs.length; index++) {
      const doc = docs[index];
      updateFirestoreDatabase(projName + "-docs", doc.filename.replace(".md", ""), doc);
      core.info(`Updated === ${doc.filename}` );
    }

  } catch (error) {
    core.setFailed(JSON.stringify(error));
    process.exit(core.ExitCode.Failure);
  }
};

processAction();

