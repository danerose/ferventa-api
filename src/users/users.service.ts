import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    const rolesCount = await this.roleModel.countDocuments();
    if (rolesCount === 0) {
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
      ];
      await this.roleModel.insertMany(defaultRoles);
      console.log('Default roles seeded successfully.');
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
        });
        console.log('Default admin user seeded: admin@ferventa.com / AdminPassword123!');
      }
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase(), deletedAt: null }).populate('role').exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null }).populate('role').exec();
    if (!user) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.userNotFound') : 'Usuario no encontrado');
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<{ user: UserDocument; formattedText: string }> {
    let { email, password } = createUserDto;
    
    // Auto-generate email if not provided
    if (!email) {
      const cleanName = createUserDto.name.toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      email = `${cleanName}${randomNum}@ferventa.com`;
    }

    // Auto-generate password if not provided
    if (!password) {
      password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase() + '!';
    }

    const existing = await this.findByEmail(email);
    if (existing) {
      const i18n = I18nContext.current();
      const message = i18n ? i18n.t('common.errors.emailRegistered') : 'El correo ya está registrado';
      throw new BadRequestException(message);
    }

    const role = await this.roleModel.findById(createUserDto.roleId);
    if (!role) {
      const i18n = I18nContext.current();
      throw new NotFoundException(i18n ? i18n.t('common.errors.roleNotFound') : 'El rol especificado no existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      email,
      password: hashedPassword,
      role: role._id,
      branches: createUserDto.branches || [],
      phone: createUserDto.phone,
    });

    const saved = await createdUser.save();
    const populated = await saved.populate('role');

    const formattedText = `¡Hola ${populated.name}! Tu cuenta ha sido creada exitosamente.
Detalles de acceso:
- Correo: ${email}
- Teléfono: ${populated.phone}
- Contraseña temporal: ${password}

Puedes iniciar sesión y cambiar tu contraseña en el siguiente enlace:
🔗 https://app.ferventa.com/reset-password`;

    return { user: populated, formattedText };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.findById(id);

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
      const role = await this.roleModel.findById(updateUserDto.roleId);
      if (!role) {
        const i18n = I18nContext.current();
        throw new NotFoundException(i18n ? i18n.t('common.errors.roleNotFound') : 'El rol especificado no existe');
      }
      user.role = role;
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
}
