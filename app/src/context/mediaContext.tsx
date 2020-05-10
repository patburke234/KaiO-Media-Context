import React, { Component } from 'react';
import { DeviceStorage, NavigatorExtended } from './deviceStorageAPI';
import { withRemoteServer, RemoteServerContextProps } from './remoteServerContext';

const Context = React.createContext<MediaContextStateProps|undefined>(undefined);

export interface MediaConsumerProps{
  fileSystem: MediaContextStateProps
}

export interface MediaContextStateProps {
  getRemoteFileUrl:(fileName: string, downloadInBackground?: boolean) => Promise<string | undefined>,
  getFileMetadata: (fileName: string) => MediaMetadata | undefined,
  getLocalFile: (fileName: string, onSuccess: (blob: File) => void) => void,
  addUserFile: (file:Blob, fileName:string, callback: (fileName: string, url: string) => void) => void,
  downloadRemoteFile: (fileName: string, onComplete: () => void) => Promise<void>
  removeLocalFile: (fileName: string) => void,
  waitUntilReady: () => Promise<boolean>
}

interface LocalState {
  device: DeviceStorage | undefined;
  metadataDB: Map<string, MediaMetadata>;
  availableSpace: number;
  totalSpace: number;
  isDebugMode: boolean;
  deviceReady: boolean;
}
type State = LocalState & MediaContextStateProps;

interface MediaMetadata{
  location: string;
  isLocal: boolean;
  size: number;
}

interface LocalProps {
}
type Props = LocalProps & RemoteServerContextProps;

class MediaContext extends Component<Props, State> {
  private rootFolder:string = "rootDeviceFolder"; //Add your name here
  private sdCardFolder:string = "/sdcard/";

  constructor(props:Props){
    super(props);

    this.state = {
      getRemoteFileUrl: this.getRemoteFileUrl,
      getFileMetadata: this.getFileMetadata,
      getLocalFile: this.getLocalFile,
      addUserFile: this.addUserFile,
      downloadRemoteFile: this.downloadRemoteFile,
      removeLocalFile: this.removeFile,
      waitUntilReady: this.waitUntilReady,
      metadataDB: new Map<string, MediaMetadata>(),
      device: undefined,
      totalSpace: 0,
      availableSpace: 0, 
      isDebugMode: true,
      deviceReady: false
    };
  }

  componentDidMount() {
    this.initDevice();
  }

  initDevice = () => {
    const navigatorExtended = navigator as NavigatorExtended;
    if(navigatorExtended && navigatorExtended.getDeviceStorages){
      const devices = navigatorExtended.getDeviceStorages("sdcard");
      console.log(devices);
      if(devices && devices.length > 0){
        this.setState({
            device:devices[0],
            isDebugMode: false
          }, () =>{
          this.initAvailSpace();
          this.enum();
        });
      }
    }
  };

  initAvailSpace = () => {
    if(this.state.device && !this.state.isDebugMode){
      const request = this.state.device.freeSpace();

      const context = this;
      request.onsuccess = function () {
        // The result is express in bytes, lets turn it into megabytes
        const size = this.result / 1048576;
        context.setState({
          availableSpace: size,
          totalSpace: size
        });
        console.log("The videos on your device use a total of " + size.toFixed(2) + "Mo of space.");
      }

      request.onerror = function () {
        console.warn("Unable to get the space used by videos: " + this.error);
      }
    }
    else{
      console.log("Debug Mode: initAvailSpace unavailable");
    }
  }

  recalcAvailSpace = () => {
    if(this.state.device && !this.state.isDebugMode){
      const request = this.state.device.freeSpace();

      const context = this;
      request.onsuccess = function () {
        // The result is express in bytes, lets turn it into megabytes
        const size = this.result / 1048576;
        context.setState({
          availableSpace: size
        });
        console.log("The videos on your device use a total of " + size.toFixed(2) + "Mo of space.");
      }

      request.onerror = function () {
        console.warn("Unable to get the space used by videos: " + this.error);
      }
      
    }
    else{
      console.log("Debug Mode: recalcAvailSpace unavailable");
    }
  }

  enum = () => {
    if(this.state.device && !this.state.isDebugMode){
      const cursor = this.state.device.enumerate(this.rootFolder);
      const context = this;
      cursor.onsuccess = function () {
        if(this.result && this.result.name !== null) {
          const file = this.result;

          if(!context.state.metadataDB.has(file.name)){
            context.state.metadataDB.set(file.name, {
              location: file.name,
              isLocal: true,
              size: file.size
            });
          }
          this.continue();
        }
        else{
          context.setState({
            deviceReady: true
          });
        }
      }
      
      cursor.onerror = function () { 
          console.warn(this.error.name + ": " + this.error.message);
      }
    }
    else{
      console.log("Debug Mode: enum unavailable");
    }
  }

  waitUntilReady = async(): Promise<boolean> => {
    if(this.state.isDebugMode) return false;

    while(!this.state.deviceReady){
      await this.sleep(1000);
    }
    return true;
  }

  private async sleep(msec:number) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }

  addUserFile = async (file:Blob, fileName:string, callback: (fileName: string, url: string) => void) => {
    this.addFile(file, fileName);
    await this.props.remoteServer.UploadMedia(fileName, file, callback);
  }

  addFile = (file:Blob, fileName:string) => {
    if(this.state.device && !this.state.isDebugMode){
      let localFilePath = this.rootFolder + "/" + fileName;
      if(this.state.metadataDB.has(localFilePath)){
        return; 
      }

      const request = this.state.device.addNamed(file, localFilePath);

      const context = this;
      request.onsuccess = function() {
        if(!context.state.metadataDB.has(this.result)){
          context.state.metadataDB.set(this.result, {
            location: this.result,
            isLocal: true,
            size: file.size
          });
        }
        context.recalcAvailSpace();
      };

      request.onerror = function() {
        console.error(this.error.name + ": " + this.error.message);
      };
    }
    else {
      console.log("Debug Mode: addFile unavailable");
    }
  }

  removeFile = (fileName: string) => {
    if(this.state.device && !this.state.isDebugMode){
      let localFilePath = fileName;
      if(!localFilePath.startsWith(this.sdCardFolder)){
        localFilePath = this.sdCardFolder + this.rootFolder + "/" + fileName;
      }

      if (this.state.metadataDB.has(localFilePath)) {
          this.state.metadataDB.delete(localFilePath);
      }
      
      const context = this;
      const request = this.state.device.delete(localFilePath);
      request.onsuccess = function () {
        context.recalcAvailSpace();
      }
      
      request.onerror = function () {
        console.warn("Unable to delete the file: " + this.error.name + ": " + this.error.message);
      }

      this.flush();
    }
    else {
      console.log("Debug Mode: removeFile unavailable");
    }
  }

  flush = () => {
    this.setState({metadataDB : new Map(this.state.metadataDB) });
  }

  render() {
    return (
      <Context.Provider value={this.state}>
        {this.props.children}
      </Context.Provider>
    )
  }

  downloadRemoteFile = async(fileName: string, onComplete: () => void): Promise<void> =>{
    if(this.state.device && !this.state.isDebugMode){
      let localFilePath = fileName;
      if(!localFilePath.startsWith(this.sdCardFolder)){
        localFilePath = this.sdCardFolder + this.rootFolder + "/" + fileName;
      }

      if(this.state.metadataDB.has(localFilePath)){
        const file = this.state.metadataDB.get(localFilePath);
        if(file){
          console.log(`File exists with props: ${file.isLocal} ${file.location} ${file.size}`)
          return; //Already exists locally
        }
      }

      await this.props.remoteServer.DownloadMedia(fileName, (blob) =>{
        if(blob){
          this.addFile(blob, fileName);
          onComplete();
        }
        else{
          console.log(`----downloadRemoteFile download failed----`);
        }
      });
    }
    else{
      console.log("Debug Mode: downloadRemoteFile unavailable");
      onComplete();
    }
  }

  getLocalFile = (fileName: string, onSuccess: (blob: File) => void): void => {
    if(!this.state.device) return;

    let localFilePath = fileName;
    if(!localFilePath.startsWith(this.sdCardFolder)){
      localFilePath = this.sdCardFolder + this.rootFolder + "/" + fileName;
    }
    
    if(this.state.metadataDB.has(localFilePath)){
      const file = this.state.metadataDB.get(localFilePath);
      if(file && file.isLocal){
          const getRequest = this.state.device.get(this.rootFolder + "/" + fileName);
          getRequest.onsuccess = function () {
              const fileBlob:File = getRequest.result;
              onSuccess(fileBlob);
          };
          getRequest.onerror = function() {
            console.warn(this.error.name + ": " + this.error.message);
          };
      }
    }
  }

  getFileMetadata = (fileName: string): MediaMetadata | undefined => {
    let localFilePath = fileName;
    if(!localFilePath.startsWith(this.sdCardFolder)){
      localFilePath = this.sdCardFolder + this.rootFolder + "/" + fileName;
    }
    
    if(this.state.metadataDB.has(localFilePath)){
      const file = this.state.metadataDB.get(localFilePath);
      if(file){
        return file;
      }
    }

    return undefined;
  }

  getRemoteFileUrl = async(fileName: string, downloadInBackground?: boolean): Promise<string | undefined> => {
    let localFilePath = fileName;
    if(!localFilePath.startsWith(this.sdCardFolder)){
      localFilePath = this.sdCardFolder + this.rootFolder + "/" + fileName;
    }

    if(this.state.metadataDB.has(localFilePath)){
      const file = this.state.metadataDB.get(localFilePath);
      if(file){
          if(file.isLocal){
            return new Promise<string | undefined>(resolve => {
              this.getLocalFile(fileName, (blob) => {
                const url = URL.createObjectURL(blob);
                resolve(url);
              });
            });
          }
          return file.location;
      }
    }

    const remoteUrl = await this.props.remoteServer.GetMediaDownloadUrl(fileName);
    if(remoteUrl){
      const fileSize = await this.props.remoteServer.GetMediaSize(fileName);
      this.state.metadataDB.set(fileName, {
        isLocal: false,
        location: remoteUrl,
        size: fileSize || 0
      });
    }

    if(downloadInBackground === true){
      this.props.remoteServer.DownloadMedia(fileName, (blob) => {
        this.addFile(blob, fileName);
      })
    }

    return remoteUrl;
  }
}

const withMedia = (Component:any) => (props:any) => (
  <MediaConumer>
    {fileSystem => <Component {...props} 
                    fileSystem={fileSystem}
                  />}
  </MediaConumer>
);

export {withMedia};
export const MediaProvider = withRemoteServer(MediaContext);
export const MediaConumer = Context.Consumer;