import React from 'react';
import VideoView from "./components/Video/Video";

import './App.scss';
import firebase from 'firebase';

type Props = {};
interface LocalState {
  isLoading: boolean;
}

class App extends React.Component<Props, LocalState>{
  
  constructor(props: Props) {
    super(props);

    this.state = {
      isLoading: true
    };
  }

  componentWillMount(){
    const contextThis = this;
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        firebase.auth().signInAnonymously()
        .then((user) => {
          console.log("signed in...");
          contextThis.setState({
            isLoading: false
          });
          return user;
        })
        .catch(function(error) {
          console.log("signInAnonynously error: " + error); 
        });
    });
  }

  render(){
    if(this.state.isLoading){
      return (<div>Loading...</div>);
    }

    return (
        <VideoView filename={"21fb3754ea318df2712b0e39352fd7eb_Lesson1_PositiveAttitude_Handbrake12.mp4"} />
    );
  }
}

export default App;
