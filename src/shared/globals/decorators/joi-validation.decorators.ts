/* eslint-disable @typescript-eslint/no-explicit-any */

import { JoiRequestValidationError } from '@global/helpers/error-handler';
import { Request } from 'express';
import { ObjectSchema } from 'joi';

type IJoiDecorator = (target: any, keys: string, descriptor: PropertyDescriptor) => void;

export function JoiValidation(schema: ObjectSchema): IJoiDecorator {
  return (_target: any, _keys: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req: Request = args[0];
      const { error } = await Promise.resolve(schema.validate(req.body));
      if (error?.details) {
        throw new JoiRequestValidationError(error?.details[0].message);
      }
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}
