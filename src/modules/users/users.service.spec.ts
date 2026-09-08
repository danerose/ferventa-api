import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { Role } from './schemas/role.schema';

describe('UsersService - Password Management', () => {
  let service: UsersService;
  let mockUserModel: any;
  let mockRoleModel: any;

  const createQueryMock = (val: any) => ({
    exec: jest.fn().mockResolvedValue(val),
    populate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(val),
    }),
    then: (resolve: any, reject: any) =>
      Promise.resolve(val).then(resolve, reject),
  });

  beforeEach(async () => {
    mockUserModel = jest.fn().mockImplementation((dto) => {
      const doc = {
        ...dto,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve({
            ...this,
            populate: jest.fn().mockImplementation(() => Promise.resolve(this)),
          });
        }),
      };
      return doc;
    });

    mockUserModel.findOne = jest.fn().mockImplementation(() => createQueryMock(null));
    mockUserModel.findById = jest.fn().mockImplementation(() => createQueryMock(null));
    mockUserModel.find = jest.fn();
    mockUserModel.exists = jest.fn();
    mockUserModel.countDocuments = jest.fn().mockResolvedValue(1);

    mockRoleModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Role.name),
          useValue: mockRoleModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create (Default Password Generation)', () => {
    it('should generate default password, hash it, and store defaultPassword when omitted', async () => {
      mockUserModel.exists.mockResolvedValue(null);
      mockRoleModel.findOne.mockResolvedValue({
        _id: 'role123',
        name: 'seller',
      });

      const result = await service.create({
        name: 'Carlos Mendoza',
        phone: '8112345678',
        roleId: 'seller',
        branches: [],
      });

      expect(result.tempPassword).toBeDefined();
      expect(result.tempPassword.length).toBeGreaterThanOrEqual(8);
      expect(result.user.defaultPassword).toBe(result.tempPassword);
      expect(result.user.isDefaultPassword).toBe(true);
      expect(result.whatsappUrl).toContain('8112345678');
      expect(await bcrypt.compare(result.tempPassword, result.user.password)).toBe(true);
    });
  });

  describe('changePassword (Self Password Update)', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUserModel.findOne.mockImplementation(() => createQueryMock(null));

      await expect(
        service.changePassword('nonexistent', {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if currentPassword does not match', async () => {
      const hashedOld = await bcrypt.hash('CorrectCurrentPassword123!', 10);
      const mockUserDoc = {
        _id: 'user123',
        password: hashedOld,
        defaultPassword: 'CorrectCurrentPassword123!',
        isDefaultPassword: true,
        save: jest.fn(),
      };

      mockUserModel.findOne.mockImplementation(() => createQueryMock(mockUserDoc));

      await expect(
        service.changePassword('user123', {
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if newPassword is identical to currentPassword', async () => {
      const hashedCurrent = await bcrypt.hash('SamePassword123!', 10);
      const mockUserDoc = {
        _id: 'user123',
        password: hashedCurrent,
        defaultPassword: 'SamePassword123!',
        isDefaultPassword: true,
        save: jest.fn(),
      };

      mockUserModel.findOne.mockImplementation(() => createQueryMock(mockUserDoc));

      await expect(
        service.changePassword('user123', {
          currentPassword: 'SamePassword123!',
          newPassword: 'SamePassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should encrypt new password, set defaultPassword to null and isDefaultPassword to false', async () => {
      const hashedOld = await bcrypt.hash('OldPassword123!', 10);
      const mockUserDoc = {
        _id: 'user123',
        password: hashedOld,
        defaultPassword: 'OldPassword123!',
        isDefaultPassword: true,
        save: jest.fn().mockResolvedValue(true),
      };

      mockUserModel.findOne.mockImplementation(() => createQueryMock(mockUserDoc));

      const result = await service.changePassword('user123', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewSecurePassword456!',
      });

      expect(mockUserDoc.defaultPassword).toBeNull();
      expect(mockUserDoc.isDefaultPassword).toBe(false);
      expect(mockUserDoc.save).toHaveBeenCalled();
      expect(await bcrypt.compare('NewSecurePassword456!', mockUserDoc.password)).toBe(true);
      expect(result.message).toBeDefined();
    });
  });

  describe('adminResetPassword (Admin User Password Update)', () => {
    it('should reset user password with provided password, set defaultPassword and isDefaultPassword: true', async () => {
      const mockUserDoc = {
        _id: 'user123',
        name: 'Empleado Taller',
        email: 'empleado@ferventa.com',
        phone: '8118765432',
        password: 'oldHashedPassword',
        defaultPassword: null,
        isDefaultPassword: false,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
        populate: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUserDoc),
        }),
      });

      const result = await service.adminResetPassword('user123', {
        newPassword: 'AdminAssignedPass123!',
      });

      expect(result.tempPassword).toBe('AdminAssignedPass123!');
      expect(mockUserDoc.defaultPassword).toBe('AdminAssignedPass123!');
      expect(mockUserDoc.isDefaultPassword).toBe(true);
      expect(await bcrypt.compare('AdminAssignedPass123!', mockUserDoc.password)).toBe(true);
      expect(result.whatsappUrl).toContain('8118765432');
    });

    it('should generate random default password if newPassword is not provided', async () => {
      const mockUserDoc = {
        _id: 'user123',
        name: 'Empleado Taller',
        email: 'empleado@ferventa.com',
        phone: '',
        password: 'oldHashedPassword',
        defaultPassword: null,
        isDefaultPassword: false,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
        populate: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUserDoc),
        }),
      });

      const result = await service.adminResetPassword('user123', {});

      expect(result.tempPassword).toBeDefined();
      expect(result.tempPassword.length).toBeGreaterThanOrEqual(8);
      expect(mockUserDoc.defaultPassword).toBe(result.tempPassword);
      expect(mockUserDoc.isDefaultPassword).toBe(true);
      expect(result.whatsappUrl).toBeNull();
    });
  });
});
