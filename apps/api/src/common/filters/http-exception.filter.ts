import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: (exception as Error).message };

    let friendlyMessage = 'An unexpected error occurred';
    let errors = null;

    if (typeof exceptionResponse === 'string') {
      friendlyMessage = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const msg = (exceptionResponse as any).message;
      if (Array.isArray(msg)) {
        friendlyMessage = msg[0]; // Take the first validation error as primary message
        errors = msg;
      } else {
        friendlyMessage = msg || friendlyMessage;
      }
    }

    const errorBody = {
      statusCode: status,
      message: friendlyMessage,
      errors: errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(
        `HTTP Error: ${status} - ${JSON.stringify(errorBody)}`,
        (exception as Error).stack,
      );
    } else {
      this.logger.warn(`HTTP Warning: ${status} - ${JSON.stringify(errorBody)}`);
    }

    response.status(status).json(errorBody);
  }
}
