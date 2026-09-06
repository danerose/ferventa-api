import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './schemas/order.schema';
import { CustomersService } from '../customers/customers.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockOrderModel: any;
  let mockCustomersService: any;

  beforeEach(async () => {
    mockOrderModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        ...dto,
        populate: jest.fn().mockResolvedValue(dto),
      }),
    }));

    mockOrderModel.find = jest.fn();
    mockOrderModel.findOne = jest.fn();

    mockCustomersService = {
      findById: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException if advancePayment is less than 50% of sellingPrice', async () => {
    // sellingPrice = 800, advancePayment = 350 (< 400 minimum)
    await expect(
      service.create(
        {
          customerName: 'Juan',
          customerPhone: '8111223344',
          itemDescription: 'Tablero FT 150',
          costPrice: 500,
          sellingPrice: 800,
          advancePayment: 350,
        },
        'user123',
        'branch123',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully create order if advancePayment is 50% or more', async () => {
    mockCustomersService.findByPhone.mockResolvedValue({ _id: 'cust123' });

    // sellingPrice = 800, advancePayment = 670
    const result = await service.create(
      {
        customerName: 'Juan',
        customerPhone: '8111223344',
        itemDescription: 'Tablero FT 150',
        costPrice: 500,
        sellingPrice: 800,
        advancePayment: 670,
      },
      'user123',
      'branch123',
    );

    expect(result).toBeDefined();
    expect(result.minAdvanceRequired).toBe(400);
    expect(result.advancePercentage).toBe(83.8);
    expect(result.remainingBalance).toBe(130);
    expect(result.isFullyPaid).toBe(false);
  });

  it('should mark isFullyPaid = true if advancePayment equals sellingPrice (100%)', async () => {
    mockCustomersService.findByPhone.mockResolvedValue({ _id: 'cust123' });

    // sellingPrice = 800, advancePayment = 800
    const result = await service.create(
      {
        customerName: 'Juan',
        customerPhone: '8111223344',
        itemDescription: 'Tablero FT 150',
        costPrice: 500,
        sellingPrice: 800,
        advancePayment: 800,
      },
      'user123',
      'branch123',
    );

    expect(result.minAdvanceRequired).toBe(400);
    expect(result.advancePercentage).toBe(100);
    expect(result.remainingBalance).toBe(0);
    expect(result.isFullyPaid).toBe(true);
  });
});
