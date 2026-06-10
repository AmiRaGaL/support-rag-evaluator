import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export function createApiValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validationError: {
      target: false,
      value: false,
    },
    exceptionFactory: (errors) =>
      new BadRequestException({
        message: 'Request validation failed',
        errors: flattenValidationErrors(errors),
      }),
  });
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): string[] {
  return errors.flatMap((error) => {
    const propertyPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const messages = Object.values(error.constraints ?? {}).map(
      (message) => `${propertyPath}: ${message}`,
    );

    return [
      ...messages,
      ...flattenValidationErrors(error.children ?? [], propertyPath),
    ];
  });
}
