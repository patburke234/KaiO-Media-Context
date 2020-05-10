import React from 'react';
import { RemoteServer } from './remoteServer';

const RemoteServerContext = React.createContext<RemoteServer|undefined>(undefined);
export interface RemoteServerContextProps{
  remoteServer: RemoteServer
}
export const withRemoteServer = (Component:any) => (props:any) => (
  <RemoteServerContext.Consumer>
    {remoteServer => <Component {...props} remoteServer={remoteServer} />}
  </RemoteServerContext.Consumer>
);

export default RemoteServerContext;