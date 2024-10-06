import { IFileImageDocument } from './../interfaces/image.interface';
import { model, Model, Schema } from 'mongoose';




const imageSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  bgImageVersion: { type: String, default: '' },
  bgImageId: { type: String, default: '' },
  imgId: { type: String, default: '' },
  imgVersion: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const ImageModel: Model<IFileImageDocument> = model<IFileImageDocument>('Image', imageSchema, 'Images');
