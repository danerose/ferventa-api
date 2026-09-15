import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './schemas/vehicle.schema';
import { CustomersService } from '../customers/customers.service';

describe('VehiclesService - Smart Matching & Optional Fields', () => {
  let service: VehiclesService;
  let mockVehicleModel: any;
  let mockCustomersService: any;

  beforeEach(async () => {
    mockCustomersService = {
      findById: jest.fn().mockResolvedValue({ _id: 'cust-1', name: 'Juan Perez' }),
    };

    // Constructor mock for `new this.vehicleModel(dto)`
    mockVehicleModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: 'new-veh-id',
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: 'new-veh-id',
        populate: jest.fn().mockResolvedValue({ ...dto, _id: 'new-veh-id' }),
      }),
    }));

    // Static find method
    mockVehicleModel.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getModelToken(Vehicle.name),
          useValue: mockVehicleModel,
        },
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should return existing vehicle on exact brand and model match (ITALIKA RUNNER)', async () => {
    const existingVehicle = {
      _id: 'veh-1',
      brand: 'ITALIKA',
      model: 'RUNNER',
      year: 2022,
      serialNumberLastFour: '1234',
      color: 'Negro',
      save: jest.fn().mockResolvedValue(true),
    };

    mockVehicleModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([existingVehicle]),
      }),
    });

    const result = await service.findOrCreateByClosestMatch(
      'cust-1',
      {
        brand: 'ITALIKA',
        model: 'RUNNER',
      },
      'branch-1',
    );

    expect(result._id).toBe('veh-1');
    expect(mockVehicleModel).not.toHaveBeenCalled(); // Did not create a new one
  });

  it('should match closest vehicle with typos and partial model (ITALIKLA RUNNER -> ITALAKI RUNNER 2026)', async () => {
    const existingVehicle = {
      _id: 'veh-closest',
      brand: 'ITALAKI',
      model: 'RUNNER 2026',
      year: 2026,
      serialNumberLastFour: '',
      color: '',
      save: jest.fn().mockResolvedValue(true),
    };

    mockVehicleModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([existingVehicle]),
      }),
    });

    const result = await service.findOrCreateByClosestMatch(
      'cust-1',
      {
        brand: 'ITALIKLA',
        model: 'RUNNER',
      },
      'branch-1',
    );

    expect(result._id).toBe('veh-closest');
    expect(mockVehicleModel).not.toHaveBeenCalled();
  });

  it('should create a new vehicle if the customer submits a completely different brand/model', async () => {
    const existingVehicle = {
      _id: 'veh-italika',
      brand: 'ITALIKA',
      model: 'RUNNER 2026',
      year: 2026,
      serialNumberLastFour: '1234',
      color: 'Rojo',
      save: jest.fn().mockResolvedValue(true),
    };

    mockVehicleModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([existingVehicle]),
      }),
    });

    const result = await service.findOrCreateByClosestMatch(
      'cust-1',
      {
        brand: 'HONDA',
        model: 'CIVIC',
      },
      'branch-1',
    );

    expect(result._id).toBe('new-veh-id');
    expect(mockVehicleModel).toHaveBeenCalled();
  });

  it('should NOT match if both have explicit different serial numbers (fleet vehicles)', async () => {
    const existingVehicle = {
      _id: 'veh-unit-1',
      brand: 'ITALIKA',
      model: 'RUNNER',
      serialNumberLastFour: '1111',
      save: jest.fn().mockResolvedValue(true),
    };

    mockVehicleModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([existingVehicle]),
      }),
    });

    const result = await service.findOrCreateByClosestMatch(
      'cust-1',
      {
        brand: 'ITALIKA',
        model: 'RUNNER',
        serialNumberLastFour: '9999',
      },
      'branch-1',
    );

    expect(result._id).toBe('new-veh-id');
    expect(mockVehicleModel).toHaveBeenCalled();
  });

  it('should enrich missing year/serial/color when matching existing vehicle', async () => {
    const existingVehicle: any = {
      _id: 'veh-incomplete',
      brand: 'ITALIKA',
      model: 'RUNNER',
      year: undefined,
      serialNumberLastFour: '',
      color: '',
      save: jest.fn().mockResolvedValue(true),
    };

    mockVehicleModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([existingVehicle]),
      }),
    });

    const result = await service.findOrCreateByClosestMatch(
      'cust-1',
      {
        brand: 'ITALIKA',
        model: 'RUNNER',
        year: 2025,
        serialNumberLastFour: '4567',
        color: 'Azul',
      },
      'branch-1',
    );

    expect(result._id).toBe('veh-incomplete');
    expect(existingVehicle.year).toBe(2025);
    expect(existingVehicle.serialNumberLastFour).toBe('4567');
    expect(existingVehicle.color).toBe('Azul');
    expect(existingVehicle.save).toHaveBeenCalled();
  });
});
