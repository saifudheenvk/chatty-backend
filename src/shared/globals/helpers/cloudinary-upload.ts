import cloudinary, { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export function uploads(
  file: string,
  public_id?: string,
  invalidate?: boolean,
  overwrite?: boolean
): Promise<UploadApiErrorResponse | UploadApiResponse | undefined> {
  return new Promise((resolve) => {
    return cloudinary.v2.uploader.upload(
      file,
      { overwrite, public_id, invalidate },
      (err: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (err) resolve(err);
        resolve(result);
      }
    );
  });
}

export function videoUpload(
  file: string,
  public_id?: string,
  invalidate?: boolean,
  overwrite?: boolean
): Promise<UploadApiErrorResponse | UploadApiResponse | undefined> {
  return new Promise((resolve) => {
    return cloudinary.v2.uploader.upload(
      file,
      { overwrite, public_id, invalidate, resource_type: 'video', chunk_size: 50000 },
      (err: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (err) resolve(err);
        resolve(result);
      }
    );
  });
}
