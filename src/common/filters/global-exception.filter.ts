import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const i18n = I18nContext.current(host);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ha ocurrido un error inesperado'; // Fallback message
    let errors: any = null;

    if (exception instanceof I18nValidationException) {
      status = exception.getStatus();
      
      const extractErrors = (validationErrors: any[]): string[] => {
        const result: string[] = [];
        const recurse = (errs: any[]) => {
          for (const err of errs) {
            if (err.constraints) {
              result.push(...(Object.values(err.constraints) as string[]));
            }
            if (err.children && err.children.length > 0) {
              recurse(err.children);
            }
          }
        };
        recurse(validationErrors);
        return result;
      };

      const extracted = extractErrors(exception.errors);
      if (extracted.length > 0) {
        message = extracted[0];
      } else {
        const badRequestMsg = i18n?.t('common.errors.badRequest');
        message = typeof badRequestMsg === 'string' ? badRequestMsg : 'Petición incorrecta';
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const msg = (exceptionResponse as any).message;
        // class-validator errors are usually arrays in the 'message' field
        if (Array.isArray(msg)) {
          if (msg.length > 0) {
            message = msg[0];
          } else {
            const badRequestMsg = i18n?.t('common.errors.badRequest');
            message = typeof badRequestMsg === 'string' ? badRequestMsg : 'Petición incorrecta';
          }
        } else if (typeof msg === 'string') {
          message = msg;
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      // Try translating common HTTP exceptions if the message is default
      if (status === HttpStatus.UNAUTHORIZED && message === 'Unauthorized') {
        const translated = i18n?.t('common.errors.unauthorized');
        if (typeof translated === 'string') message = translated;
      } else if (status === HttpStatus.FORBIDDEN && message === 'Forbidden') {
        const translated = i18n?.t('common.errors.forbidden');
        if (typeof translated === 'string') message = translated;
      }
    } else {
      // Log generic exceptions for debugging
      this.logger.error(
        `Unhandle Exception at ${request.method} ${request.url}: ${exception.message || exception}`,
        exception.stack,
      );

      // Map Mongo unique key violation errors
      if (exception.code === 11000) {
        status = HttpStatus.CONFLICT;
        const key = Object.keys(exception.keyValue || {})[0] || 'recurso';
        const isSpanish = !i18n || i18n.lang === 'es';
        message = isSpanish
          ? `El campo '${key}' ya existe en el sistema`
          : `Field '${key}' already exists in the system`;
      } else {
        const defaultErr = i18n?.t('common.errors.default');
        if (typeof defaultErr === 'string') {
          message = defaultErr;
        }
      }
    }

    // In development mode, we can expose the stack / details in data if it's a 500 error
    const isDev = process.env.NODE_ENV !== 'production';
    const errorResponse = {
      success: false,
      data: errors || (isDev && status === HttpStatus.INTERNAL_SERVER_ERROR ? {
        detail: exception.message,
        stack: exception.stack,
      } : null),
      message,
    };

    response.status(status).json(errorResponse);
  }
}
