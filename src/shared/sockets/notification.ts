
import { Server } from 'socket.io';


export let socketIONotificationObject: Server;
export class SocketIONotificationHandler {

  public async listen(io: Server) {
    socketIONotificationObject = io; // this field holds same value as this.io, It is using to listen, emit events from outside of the class
  }
 }
