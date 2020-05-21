import React from 'react';

import './Video.scss';
import { MediaConsumerProps, withMedia } from '../../context/mediaContext';

interface LocalProps{
    filename: string;
}
type Props = LocalProps 
  & MediaConsumerProps;

interface LocalState {
    playing: boolean,
    duration: number,
    seeking: boolean,
    played: number,
    videoUrl?: string,
    blob: File | Blob | undefined,
    isLoading: boolean;
}

class VideoView extends React.Component<Props, LocalState> {
  
    constructor(props: Props){
        super(props);
          
        this.state = {
            playing: false,
            duration: 0,
            seeking: false,
            played: 0,
            videoUrl: undefined,
            isLoading: true,
            blob: undefined
        };
    }

    async componentWillMount() {
      await this.props.fileSystem.waitUntilReady();
      console.log('file system ready...');
      
      // const url = await this.props.fileSystem.getRemoteFileUrl(this.props.filename);
      // this.setState({
      //     videoUrl: url,
      //     isLoading: false
      // });

      console.log("attempted to download file: " + this.props.filename);
      await this.props.fileSystem.downloadRemoteFile(this.props.filename, () => {
        console.log("downloaded!");
      });

      console.log("attempted to get file metadata");
      const fileMeta = await this.props.fileSystem.getFileMetadata(this.props.filename);
      if(fileMeta && fileMeta.isLocal){
        console.log("found local file! Creating blob url...")
          this.props.fileSystem.getLocalFile(this.props.filename, async (file) => {
              this.setState({
                  blob: file,
                  isLoading: false
              });
          });
      }
      else{
          console.log("using remote url...")
          const url = await this.props.fileSystem.getRemoteFileUrl(this.props.filename);
          this.setState({
              videoUrl: url,
              isLoading: false
          });
      }
  }

  render () {
    if(this.state.isLoading) return (<div>Loading Video...</div>);

    let src = this.state.videoUrl;
    if(this.state.blob)
      src = URL.createObjectURL(this.state.blob);
      
    //const src = this.state.videoUrl;
    return (
      <div className='video-player'>
          <div className='player-wrapper'>
            <video width="320" height="240" autoPlay={true} muted={true}>
              <source src={src} type="video/mp4"/>
              Your browser does not support the video tag.
            </video>
          </div>
      </div>
    )
  }
}



export default withMedia(VideoView);