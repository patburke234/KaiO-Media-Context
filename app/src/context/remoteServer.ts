import firebase from 'firebase';

export interface RemoteServer {
    UploadMedia(fileName: string, file: Blob, callback: (fileName: string, url: string) => void): Promise<void>;
    DownloadMedia(fileName: string, callback: (file: File) => void): Promise<void>;
    GetMediaDownloadUrl(fileName: string): Promise<string | undefined>;
    GetMediaSize(fileName: string): Promise<number | undefined>;
}

export class FirebaseStorageServer implements RemoteServer {
    private firebaseApp: firebase.app.App;
    constructor() {
        this.firebaseApp = firebase.initializeApp({
            //Your config here
        });
    }

    async UploadMedia(fileName: string, file: Blob, callback: (fileName: string, url: string) => void): Promise<void> {
        const uploadResult = await this.uploadFile(fileName, file);
        const url = uploadResult.downloadURL;

        if(url)
            callback(fileName, url);
    }
    
    async DownloadMedia(fileName: string, callback: (file: File) => void): Promise<void> {
        const storageRef = this.firebaseApp.storage().ref();
        const fileRef = storageRef.child(fileName);
        const downloadTask = fileRef.getDownloadURL().then(function(url) {
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = function(event) {
              const blob = xhr.response as File;
              callback(blob);
            };
            xhr.open('GET', url);
            xhr.send();
          }).catch(function(error) {
              console.error(error);
          });

        return await downloadTask;
    }

    async GetMediaDownloadUrl(fileName: string): Promise<string | undefined> {
        const storageRef = this.firebaseApp.storage().ref();
        const fileRef = storageRef.child(fileName);
        const downloadUrl = await fileRef.getDownloadURL();

        return downloadUrl;
    }

    async GetMediaSize(fileName: string): Promise<number | undefined> {
        const storageRef = this.firebaseApp.storage().ref();
        const fileRef = storageRef.child(fileName);

        const metadata = await fileRef.getMetadata();
        if(metadata){
            return metadata.size;
        }
        return undefined;
    }

    private uploadFile = (fileName: string, blob: Blob): firebase.storage.UploadTask => {
        const storageRef = this.firebaseApp.storage().ref();
        const fileRef = storageRef.child(fileName);
        return fileRef.put(blob);
    }
}