import { Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import * as express from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ResponseMessage('auth.signup')
  @ApiOperation({ summary: 'Registrar un nuevo usuario (Vendedor por defecto)' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'El correo ya está registrado.' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('auth.login')
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiResponse({ status: 200, description: 'Sesión iniciada correctamente, tokens retornados.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: express.Request,
  ) {
    const ip = request.ip || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('auth.refresh')
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiResponse({ status: 200, description: 'Token renovado exitosamente.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado.' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('auth.logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión e invalidar la sesión actual' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente.' })
  async logout(@CurrentUser() user: any) {
    await this.authService.logout(user.sessionId, user._id);
    return { message: 'Sesión cerrada correctamente' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil retornado con éxito.' })
  async getProfile(@CurrentUser() user: any) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branches: user.branches || [],
      lastLoginAt: user.lastLoginAt,
    };
  }
}
