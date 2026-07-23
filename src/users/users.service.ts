import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  // Startup seeding of roles and default admin user
  async onModuleInit() {
    await this.seedRoles();
    await this.seedAdminUser();
  }

  private async seedRoles() {
    const defaultRoles = [
      {
        name: 'admin',
        permissions: ['*'],
        description: 'Administrador del sistema con acceso total',
      },
      {
        name: 'seller',
        permissions: [
          'sales:create',
          'sales:read',
          'quotes:create',
          'quotes:read',
          'customers:create',
          'customers:read',
          'vehicles:create',
          'vehicles:read',
          'appointments:create',
          'appointments:read',
          'inventory:read',
        ],
        description: 'Vendedor / Asesor del taller',
      },
      {
        name: 'warehouse',
        permissions: [
          'inventory:create',
          'inventory:read',
          'inventory:update',
          'inventory:movements:create',
          'inventory:movements:read',
        ],
        description: 'Encargado de almacén e inventario',
      },
      {
        name: 'mechanic',
        permissions: [
          'appointments:read',
          'maintenance:read',
          'maintenance:update',
          'maintenance:evidence',
          'inventory:read',
        ],
        description: 'Mecánico / Técnico de taller',
      },
    ];

    for (const roleDef of defaultRoles) {
      const exists = await this.roleModel.findOne({ name: roleDef.name });
      if (!exists) {
        await this.roleModel.create(roleDef);
        console.log(`Role '${roleDef.name}' seeded successfully.`);
      }
    }
  }

  private async seedAdminUser() {
    const adminCount = await this.userModel.countDocuments();
    if (adminCount === 0) {
      const adminRole = await this.roleModel.findOne({ name: 'admin' });
      if (adminRole) {
        const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
        await this.userModel.create({
          name: 'Administrador Inicial',
          email: 'admin@ferventa.com',
          password: hashedPassword,
          role: adminRole._id as any,
          isActive: true,
          phone: '0000000000',
        });
        console.log('Default admin user seeded: admin@ferventa.com / AdminPassword123!');
      }
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase(), deletedAt: null }).populate('role').exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    if (!username) return null;
    return this.userModel.findOne({ username: username.toLowerCase().trim(), deletedAt: null }).populate('role').exec();
  }

  async generateUsername(name: string): Promise<string> {
    if (!name || !name.trim()) {
      name = 'usuario';
    }

    let base = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      base = `${parts[0]}.${parts[parts.length - 1]}`.replace(/[^a-z0-9.]/g, '');
    } else {
      base = parts[0].replace(/[^a-z0-9.]/g, '');
    }

    if (!base) {
      base = 'usuario';
    }

    let candidate = base;
    let counter = 1;

    while (await this.userModel.exists({ username: candidate, deletedAt: null })) {
      candidate = `${base}${counter}`;
      counter++;
    }

    return candidate;
  }

  async checkUsername(username: string): Promise<{ exists: boolean; available: boolean; username: string }> {
    if (!username || !username.trim()) {
      const i18n = I18nContext.current();
      throw new BadRequestException(i18n ? i18n.t('common.errors.badRequest') : 'Se requiere un nombre de usuario');
    }
    const cleanUsername = username.toLowerCase().trim();
    const existing = await this.userModel.exists({ username: cleanUsername, deletedAt: null });
    return {
      exists: !!existing,
      available: !existing,
      username: cleanUsername,
    };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null }).populate('role').exec();
    if (!user) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.userNotFound') : 'Usuario no encontrado');
    }
    return user;
  }

  async findRoleByIdOrName(roleIdOrName: string): Promise<RoleDocument | null> {
    if (!roleIdOrName) return null;
    const trimmed = roleIdOrName.trim();
    if (isValidObjectId(trimmed)) {
      const role = await this.roleModel.findById(trimmed);
      if (role) return role;
    }
    return this.roleModel.findOne({ name: trimmed.toLowerCase() });
  }

  async create(createUserDto: CreateUserDto): Promise<{ user: UserDocument; tempPassword?: string; message: string; whatsappUrl: string }> {
    let { email, password, username, name, phone } = createUserDto;
    
    if (username) {
      username = username.toLowerCase().trim();
      const existingUsername = await this.findByUsername(username);
      if (existingUsername) {
        const i18n = I18nContext.current();
        const message = i18n ? i18n.t('common.errors.usernameRegistered') : 'El nombre de usuario ya está registrado';
        throw new BadRequestException(message);
      }
    } else {
      username = await this.generateUsername(name);
    }

    // Auto-generate email if not provided
    if (!email) {
      email = `${username}@ferventa.com`;
    }

    // Auto-generate password if not provided
    let rawPassword = password;
    if (!rawPassword) {
      rawPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase() + '!';
    }

    const existing = await this.findByEmail(email);
    if (existing) {
      const i18n = I18nContext.current();
      const message = i18n ? i18n.t('common.errors.emailRegistered') : 'El correo ya está registrado';
      throw new BadRequestException(message);
    }

    const role = await this.findRoleByIdOrName(createUserDto.roleId);
    if (!role) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.roleNotFound') : 'El rol especificado no existe');
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      username,
      email,
      password: hashedPassword,
      role: role._id,
      branches: createUserDto.branches || [],
      phone,
    });

    const saved = await createdUser.save();
    const populated = await saved.populate('role');

    const formattedText = `¡Hola ${populated.name}! Tu cuenta en Ferventa ha sido creada exitosamente.

Detalles de acceso:
- Usuario: ${username}
- Correo: ${email}
- Teléfono: ${populated.phone}
- Contraseña temporal: ${rawPassword}

Puedes iniciar sesión en el siguiente enlace:
🔗 https://app.ferventa.com/login`;

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `52${cleanPhone}`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(formattedText)}`;

    return {
      user: populated,
      tempPassword: rawPassword,
      message: formattedText,
      whatsappUrl,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.findById(id);

    if (updateUserDto.username) {
      const cleanUsername = updateUserDto.username.toLowerCase().trim();
      if (cleanUsername !== user.username) {
        const existing = await this.findByUsername(cleanUsername);
        if (existing) {
          const i18n = I18nContext.current();
          const message = i18n ? i18n.t('common.errors.usernameRegistered') : 'El nombre de usuario ya está registrado';
          throw new BadRequestException(message);
        }
        user.username = cleanUsername;
      }
    }

    if (updateUserDto.email && updateUserDto.email.toLowerCase() !== user.email) {
      const existing = await this.findByEmail(updateUserDto.email);
      if (existing) {
        const i18n = I18nContext.current();
        const message = i18n ? i18n.t('common.errors.emailRegistered') : 'El correo ya está registrado';
        throw new BadRequestException(message);
      }
      user.email = updateUserDto.email.toLowerCase();
    }

    if (updateUserDto.name) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.isActive !== undefined) {
      user.isActive = updateUserDto.isActive;
    }

    if (updateUserDto.roleId) {
      const role = await this.findRoleByIdOrName(updateUserDto.roleId);
      if (!role) {
        const i18n = I18nContext.current();
        throw new NotFoundException(i18n ? i18n.t('common.errors.roleNotFound') : 'El rol especificado no existe');
      }
      user.role = role._id as any;
    }

    const updated = await user.save();
    return updated.populate('role');
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();
  }

  async findAll(filters: { role?: string; isActive?: boolean }): Promise<UserDocument[]> {
    const query: any = { deletedAt: null };

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.role) {
      const role = await this.roleModel.findOne({ name: filters.role.toLowerCase() });
      if (role) {
        query.role = role._id;
      } else {
        return []; // Role doesn't exist, return empty list
      }
    }

    return this.userModel.find(query).populate('role').exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.updateOne({ _id: id }, { lastLoginAt: new Date() }).exec();
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleModel.find({ isActive: true }).exec();
  }

  async migrateUsernames(): Promise<{ totalMigrated: number; users: Array<{ id: string; name: string; username: string; email: string }> }> {
    const usersWithoutUsername = await this.userModel.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' },
      ],
      deletedAt: null,
    });

    const migratedUsers: Array<{ id: string; name: string; username: string; email: string }> = [];

    for (const user of usersWithoutUsername) {
      const generatedUsername = await this.generateUsername(user.name);
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { username: generatedUsername } },
      );
      migratedUsers.push({
        id: (user._id as any).toString(),
        name: user.name,
        username: generatedUsername,
        email: user.email,
      });
      console.log(`Migrated user '${user.name}' -> username: '${generatedUsername}'`);
    }

    return {
      totalMigrated: migratedUsers.length,
      users: migratedUsers,
    };
  }
}
