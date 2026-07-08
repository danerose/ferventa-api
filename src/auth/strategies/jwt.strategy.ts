import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { SessionsService } from '../../sessions/sessions.service';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'default_jwt_access_secret_key_change_me_in_prod',
    });
  }

  async validate(payload: any) {
    // Validate if the session is still active and valid (revocable JWT)
    if (payload.sessionId) {
      const isSessionActive = await this.sessionsService.isValid(payload.sessionId);
      if (!isSessionActive) {
        const i18n = I18nContext.current();
        throw new UnauthorizedException(i18n ? i18n.t('common.errors.sessionExpired') : 'Sesión revocada o expirada');
      }
    }

    const user = await this.usersService.findById(payload.sub);
    
    if (!user || !user.isActive || user.deletedAt !== null) {
      const i18n = I18nContext.current();
      throw new UnauthorizedException(i18n ? i18n.t('common.errors.inactiveUser') : 'Usuario inactivo o no autorizado');
    }

    // Attach sessionId to user request context for easy logout
    (user as any).sessionId = payload.sessionId;

    return user;
  }
}

