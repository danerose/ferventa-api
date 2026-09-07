import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MaintenanceService } from './maintenance.service';
import { Maintenance } from './schemas/maintenance.schema';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { SalesService } from '../sales/sales.service';

describe('MaintenanceService - findAll', () => {
  let service: MaintenanceService;
  let mockMaintenanceModel: any;

  beforeEach(async () => {
    mockMaintenanceModel = {
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        {
          provide: getModelToken(Maintenance.name),
          useValue: mockMaintenanceModel,
        },
        {
          provide: getModelToken(Appointment.name),
          useValue: {},
        },
        {
          provide: VehiclesService,
          useValue: { findAll: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: CustomersService,
          useValue: { findAll: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: InventoryService,
          useValue: {},
        },
        {
          provide: SalesService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
  });

  it('should filter by delivered status and date range without imposing 7-day restriction when from/to are present', async () => {
    await service.findAll('branch-123', {
      scope: 'delivered_recent',
      from: '2026-08-31',
      to: '2026-09-05',
      dateField: 'deliveredAt',
    });

    expect(mockMaintenanceModel.find).toHaveBeenCalledTimes(1);
    const query = mockMaintenanceModel.find.mock.calls[0][0];

    expect(query.branch).toBe('branch-123');
    expect(query.status).toBe('delivered');
    // It should NOT have a sevenDaysAgo restriction in $and
    expect(query.$and).toBeUndefined();
    // It should have the date conditions in $or
    expect(query.$or).toEqual([
      {
        deliveredAt: {
          $gte: new Date('2026-08-31T00:00:00.000Z'),
          $lte: new Date('2026-09-05T23:59:59.999Z'),
        },
      },
      {
        deliveredAt: null,
        endDate: {
          $gte: new Date('2026-08-31T00:00:00.000Z'),
          $lte: new Date('2026-09-05T23:59:59.999Z'),
        },
      },
    ]);
  });

  it('should apply 7-day fallback when scope is delivered_recent and no dates are provided', async () => {
    await service.findAll('branch-123', {
      scope: 'delivered_recent',
    });

    expect(mockMaintenanceModel.find).toHaveBeenCalledTimes(1);
    const query = mockMaintenanceModel.find.mock.calls[0][0];

    expect(query.branch).toBe('branch-123');
    expect(query.status).toBe('delivered');
    expect(query.$or).toBeDefined();
    expect(query.$or[0].deliveredAt.$gte).toBeInstanceOf(Date);
  });
});
