import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SalesService } from './sales.service';
import { Sale } from './schemas/sale.schema';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { QuotesService } from '../quotes/quotes.service';
import { MercadoPagoService } from './mercado-pago.service';
import { ServicesService } from '../services/services.service';
import { Types } from 'mongoose';

describe('SalesService', () => {
  let service: SalesService;
  let mockSaleModel: any;

  beforeEach(async () => {
    mockSaleModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        ...dto,
        populate: jest.fn().mockResolvedValue(dto),
      }),
    }));

    mockSaleModel.find = jest.fn();
    mockSaleModel.findOne = jest.fn();
    mockSaleModel.findOneAndUpdate = jest.fn();
    mockSaleModel.aggregate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getModelToken(Sale.name),
          useValue: mockSaleModel,
        },
        {
          provide: CustomersService,
          useValue: {},
        },
        {
          provide: InventoryService,
          useValue: {},
        },
        {
          provide: QuotesService,
          useValue: {},
        },
        {
          provide: MercadoPagoService,
          useValue: {},
        },
        {
          provide: ServicesService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should aggregate and calculate correct summary, payment methods, daily series, and product vs service breakdown', async () => {
      const branchId = new Types.ObjectId().toString();

      // Mock aggregation result for facet query
      mockSaleModel.aggregate
        .mockResolvedValueOnce([
          {
            summary: [
              {
                _id: null,
                totalRevenue: 5328764604,
                subtotal: 5328764604,
                discount: 0,
                totalSales: 29,
              },
            ],
            paymentMethods: [
              { _id: 'cash', revenue: 3916709859, count: 17 },
              { _id: 'card', revenue: 257094091, count: 6 },
              { _id: 'transfer', revenue: 1154960654, count: 6 },
            ],
            dailyStats: [
              { _id: 7, revenue: 120000, count: 1 }, // Sábado
              { _id: 4, revenue: 5328644604, count: 28 }, // Miércoles
            ],
            itemBreakdown: [
              {
                _id: 'service',
                revenue: 1500000000,
                itemsCount: 12,
                salesCount: 10,
              },
              {
                _id: 'product',
                revenue: 3828764604,
                itemsCount: 45,
                salesCount: 22,
              },
            ],
          },
        ])
        // Mock aggregation result for monthly query
        .mockResolvedValueOnce([
          { _id: '2026-09', revenue: 5328764604, count: 29 },
        ]);

      const result = await service.getStats(branchId, {
        startDate: '2026-09-03',
        endDate: '2026-09-09',
        utcOffsetMinutes: 300,
      });

      // 1. Summary validation
      expect(result.summary.totalRevenue).toBe(5328764604);
      expect(result.summary.totalSales).toBe(29);
      expect(result.summary.averageTicket).toBe(183750503.59);
      expect(result.summary.mainPaymentMethod).toBe('cash');
      expect(result.summary.mainPaymentMethodLabel).toBe('Efectivo');

      // 2. Payment methods validation
      expect(result.paymentMethods.cash.revenue).toBe(3916709859);
      expect(result.paymentMethods.cash.count).toBe(17);
      expect(result.paymentMethods.cash.percentage).toBe(73.5);

      expect(result.paymentMethods.card.revenue).toBe(257094091);
      expect(result.paymentMethods.card.count).toBe(6);
      expect(result.paymentMethods.card.percentage).toBe(4.8);

      expect(result.paymentMethods.transfer.revenue).toBe(1154960654);
      expect(result.paymentMethods.transfer.count).toBe(6);
      expect(result.paymentMethods.transfer.percentage).toBe(21.7);

      // 3. Daily series validation (should have 7 days: lun, mar, mié, jue, vie, sáb, dom)
      expect(result.dailyRevenue.length).toBe(7);
      expect(result.dailyRevenue[0].day).toBe('lun');
      expect(result.dailyRevenue[0].revenue).toBe(0);
      expect(result.dailyRevenue[2].day).toBe('mié');
      expect(result.dailyRevenue[2].revenue).toBe(5328644604);
      expect(result.dailyRevenue[5].day).toBe('sáb');
      expect(result.dailyRevenue[5].revenue).toBe(120000);
      expect(result.dailyRevenue[6].day).toBe('dom');
      expect(result.dailyRevenue[6].revenue).toBe(0);

      // 4. Monthly trend validation (should have exactly 6 months)
      expect(result.monthlyTrend.length).toBe(6);
      expect(result.monthlyTrend[5].month).toBe('2026-09');
      expect(result.monthlyTrend[5].revenue).toBe(5328764604);
      expect(result.monthlyTrend[0].revenue).toBe(0);

      // 5. Products vs Services validation
      expect(result.itemTypesBreakdown.services.revenue).toBe(1500000000);
      expect(result.itemTypesBreakdown.services.itemsCount).toBe(12);
      expect(result.itemTypesBreakdown.services.salesCount).toBe(10);
      expect(result.itemTypesBreakdown.services.revenuePercentage).toBe(28.1);

      expect(result.itemTypesBreakdown.products.revenue).toBe(3828764604);
      expect(result.itemTypesBreakdown.products.itemsCount).toBe(45);
      expect(result.itemTypesBreakdown.products.salesCount).toBe(22);
      expect(result.itemTypesBreakdown.products.revenuePercentage).toBe(71.9);
    });

    it('should return empty stats without error when no sales match', async () => {
      const branchId = new Types.ObjectId().toString();

      mockSaleModel.aggregate
        .mockResolvedValueOnce([
          {
            summary: [],
            paymentMethods: [],
            dailyStats: [],
            itemBreakdown: [],
          },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getStats(branchId, {
        startDate: '2026-09-01',
        endDate: '2026-09-02',
      });

      expect(result.summary.totalRevenue).toBe(0);
      expect(result.summary.totalSales).toBe(0);
      expect(result.summary.averageTicket).toBe(0);
      expect(result.summary.mainPaymentMethod).toBe('none');
      expect(result.summary.mainPaymentMethodLabel).toBe('Sin ventas');
      expect(result.paymentMethods.cash.revenue).toBe(0);
      expect(result.itemTypesBreakdown.services.revenue).toBe(0);
      expect(result.itemTypesBreakdown.products.revenue).toBe(0);
    });
  });
});
