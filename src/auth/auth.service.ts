import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Role, RoleDocument } from '../users/schemas/role.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async signup(signupDto: SignupDto): Promise<UserDocument> {
    const existing = await this.usersService.findByEmail(signupDto.email);
    if (existing) {
      const i18n = I18nContext.current();
      const message = i18n ? i18n.t('common.errors.emailRegistered') : 'El correo ya está registrado';
      throw new BadRequestException(message);
    }

    // Default role for self-registration is 'seller'
    const sellerRole = await this.roleModel.findOne({ name: 'seller' });
    if (!sellerRole) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.defaultRoleNotConfigured') : 'El rol de vendedor por defecto no está configurado');
    }

    const result = await this.usersService.create({
      name: signupDto.name,
      email: signupDto.email,
      password: signupDto.password,
      roleId: (sellerRole._id as any).toString(),
      phone: signupDto.phone,
      branches: [],
    });

    return result.user;
  }

  async login(loginDto: LoginDto, ip: string, userAgent: string) {
    const identifier = (loginDto.username || loginDto.email || '').trim();
    if (!identifier) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.badRequest') : 'Se requiere un nombre de usuario o correo electrónico');
    }

    let user = await this.usersService.findByUsername(identifier);
    if (!user) {
      user = await this.usersService.findByEmail(identifier);
    }
    
    // Set session expiration to 7 days in future for refresh token length
    const refreshExpiresInString = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 7); // Default to 7 days

    if (!user) {
      const i18n = I18nContext.current();
      throw new UnauthorizedException(i18n ? i18n.t('common.errors.invalidCredentials') : 'El usuario/correo o la contraseña son incorrectos');
    }

    if (!user.isActive) {
      // Create a failed session record
      await this.sessionsService.create(
        (user._id as any).toString(),
        ip,
        userAgent,
        new Date(),
        false,
        'Usuario inactivo',
      );
      const i18n = I18nContext.current();
      throw new UnauthorizedException(i18n ? i18n.t('common.errors.inactiveUser') : 'El usuario está inactivo');
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordMatches) {
      // Create a failed session record
      await this.sessionsService.create(
        (user._id as any).toString(),
        ip,
        userAgent,
        new Date(),
        false,
        'Contraseña incorrecta',
      );
      const i18n = I18nContext.current();
      throw new UnauthorizedException(i18n ? i18n.t('common.errors.invalidCredentials') : 'El usuario/correo o la contraseña son incorrectos');
    }

    // Create a successful session
    const session = await this.sessionsService.create(
      (user._id as any).toString(),
      ip,
      userAgent,
      expireAt,
      true,
    );

    // Update last login
    await this.usersService.updateLastLogin((user._id as any).toString());

    // Generate tokens
    const accessToken = this.generateAccessToken(user, (session._id as any).toString());
    const refreshToken = this.generateRefreshToken((user._id as any).toString(), (session._id as any).toString());

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        username: user.username || null,
        email: user.email,
        role: user.role.name,
        branches: user.branches || [],
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const { sub: userId, sessionId } = payload;

      const isSessionActive = await this.sessionsService.isValid(sessionId);
      if (!isSessionActive) {
        const i18n = I18nContext.current();
        throw new UnauthorizedException(i18n ? i18n.t('common.errors.sessionExpired') : 'Sesión revocada o expirada');
      }

      const user = await this.usersService.findById(userId);
      if (!user || !user.isActive) {
        const i18n = I18nContext.current();
        throw new UnauthorizedException(i18n ? i18n.t('common.errors.inactiveUser') : 'Usuario no válido o inactivo');
      }

      const accessToken = this.generateAccessToken(user, sessionId);
      
      return {
        accessToken,
      };
    } catch (e) {
      const i18n = I18nContext.current();
      throw new UnauthorizedException(i18n ? i18n.t('common.errors.invalidRefreshToken') : 'Refresh token inválido o expirado');
    }
  }

  async logout(sessionId: string, userId: string) {
    await this.sessionsService.revoke(sessionId, userId, false);
  }

  private generateAccessToken(user: UserDocument, sessionId: string): string {
    const payload = {
      sub: user._id,
      username: user.username || null,
      email: user.email,
      role: {
        name: user.role.name,
        permissions: user.role.permissions,
      },
      branches: user.branches || [],
      sessionId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '20h') as any,
    });
  }

  private generateRefreshToken(userId: string, sessionId: string): string {
    const payload = {
      sub: userId,
      sessionId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });
  }
}
