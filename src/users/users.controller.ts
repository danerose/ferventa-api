import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @ResponseMessage('users.create')
  @ApiOperation({ summary: 'Crear un nuevo usuario (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente. Devuelve el usuario, contraseña temporal, mensaje de WhatsApp y whatsappUrl.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o correo/usuario ya registrado.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar todos los usuarios (Solo Admin)' })
  @ApiQuery({ name: 'role', required: false, description: 'Filtrar por nombre de rol' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  findAll(
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool = isActive === undefined ? undefined : isActive === 'true';
    return this.usersService.findAll({ role, isActive: isActiveBool });
  }

  @Get('roles')
  @ApiOperation({ summary: 'Obtener la lista de roles activos' })
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Get('generate-username')
  @Roles('admin')
  @ApiOperation({ summary: 'Generar un nombre de usuario único basado en el nombre de la persona' })
  @ApiQuery({ name: 'name', required: true, description: 'Nombre completo de la persona' })
  async generateUsername(@Query('name') name: string) {
    if (!name) {
      throw new BadRequestException('El parámetro name es requerido');
    }
    const username = await this.usersService.generateUsername(name);
    return { username };
  }

  @Get('check-username')
  @Roles('admin')
  @ApiOperation({ summary: 'Validar si un nombre de usuario ya existe o está disponible (por query param)' })
  @ApiQuery({ name: 'username', required: true, description: 'Nombre de usuario a validar' })
  checkUsernameQuery(@Query('username') username: string) {
    return this.usersService.checkUsername(username);
  }

  @Post('migrate-usernames')
  @Roles('admin')
  @ApiOperation({ summary: 'Migrar usuarios existentes que no tengan un nombre de usuario asignado (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Migración de nombres de usuario ejecutada exitosamente.' })
  migrateUsernames() {
    return this.usersService.migrateUsernames();
  }

  @Get('check-username/:username')
  @Roles('admin')
  @ApiOperation({ summary: 'Validar si un nombre de usuario ya existe o está disponible (por param de ruta)' })
  checkUsernameParam(@Param('username') username: string) {
    return this.usersService.checkUsername(username);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener un usuario por ID (Solo Admin)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ResponseMessage('users.update')
  @ApiOperation({ summary: 'Actualizar datos de un usuario (Solo Admin)' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ResponseMessage('users.delete')
  @ApiOperation({ summary: 'Eliminar (Soft Delete) un usuario (Solo Admin)' })
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
