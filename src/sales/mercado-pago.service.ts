import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  /**
   * Simulates charging an amount on a physical Mercado Pago Point terminal.
   * In production, this would make an HTTP request to Mercado Pago Point APIs:
   * POST /v1/devices/{device_id}/payment_intents
   */
  async processPointPayment(amount: number, description: string): Promise<{ paymentId: string; status: string }> {
    this.logger.log(`[Mercado Pago Point API] Requesting payment intent: $${amount} - "${description}"`);

    // Simulate network delay to device terminal
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate simulated payment reference
    const paymentId = `MP-POINT-${Math.floor(10000000 + Math.random() * 90000000)}`;
    this.logger.log(`[Mercado Pago Point API] Device payment approved. Payment ID: ${paymentId}`);

    return {
      paymentId,
      status: 'approved',
    };
  }
}
