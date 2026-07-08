import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nContext } from 'nestjs-i18n';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const responseMessageKey = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        // If data is already in the normalized response format, return it directly
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data &&
          'message' in data
        ) {
          return data;
        }

        const i18n = I18nContext.current(context);
        let message = 'Operación realizada con éxito'; // default Spanish message

        if (responseMessageKey) {
          // Target the 'success' section inside 'common.json'
          const translationKey = responseMessageKey.startsWith('common.success.')
            ? responseMessageKey
            : `common.success.${responseMessageKey}`;

          const translated = i18n?.t(translationKey);
          message = typeof translated === 'string' ? translated : responseMessageKey;
        } else {
          // Default fallback translations
          const defaultMsg = i18n?.t('common.success.default');
          if (typeof defaultMsg === 'string') {
            message = defaultMsg;
          }
        }

        return {
          success: true,
          data: data ?? null,
          message,
        };
      }),
    );
  }
}
