/* eslint-disable @typescript-eslint/no-unused-vars */
import { ICommentDocument } from '@comments/interfaces/comments.interface';
import { IReactionDocument } from '@reaction/interfaces/reaction.interface';
import { Server, Socket} from 'socket.io';


export let socketIOPostObject: Server;
export class SocketIOPostHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIOPostObject = io; // this field holds same value as this.io, It is using to listen, emit events from outside of the class
  }

  public listen() : void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('reaction', (data: IReactionDocument) => {
        this.io.emit('update reaction', data);
      });

      socket.on('comment', (data: ICommentDocument) => {
        this.io.emit('update comment', data);
      });
    });
  }
 }
