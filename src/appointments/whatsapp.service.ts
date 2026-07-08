import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMessage(to: string, text: string): Promise<boolean> {
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    const apiToken = this.configService.get<string>('WHATSAPP_API_TOKEN');
    const senderNumber = this.configService.get<string>('WHATSAPP_SENDER_NUMBER');

    if (!apiUrl || !apiToken) {
      this.logger.warn(
        `WhatsApp API no está configurada (Falta WHATSAPP_API_URL o WHATSAPP_API_TOKEN). ` +
        `Simulando envío a ${to}. Mensaje: "${text}"`
      );
      return true;
    }

    try {
      this.logger.log(`Enviando mensaje de WhatsApp a ${to}...`);
      
      // Sanitizar el número de teléfono (dejar solo dígitos)
      const cleanPhone = to.replace(/\D/g, '');

      // Payload adaptable para la mayoría de pasarelas de WhatsApp
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { body: text },
        // Campos opcionales por si la pasarela requiere remitente
        sender: senderNumber || undefined,
        // O versión simplificada compatible con webhooks genéricos
        message: text,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `Error al enviar mensaje de WhatsApp. Status: ${response.status}. Detalle: ${errText}`
        );
        return false;
      }

      this.logger.log(`Mensaje de WhatsApp enviado correctamente a ${to}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Excepción al intentar enviar mensaje de WhatsApp a ${to}: ${error.message || error}`
      );
      return false;
    }
  }
}
