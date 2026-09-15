import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('POS & Taller Autopartes API')
    .setDescription('API REST para sistema de punto de venta e inventario de taller mecánico')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swagger = SwaggerModule.createDocument(app, config);

  let md = '# Ferventa API Documentation\n\n';
  md += `Base URL: \`/api\`\n\n`;
  md += `> All successful responses are wrapped in a standard JSON format:\n`;
  md += `> \`\`\`json\n> {\n>   "success": true,\n>   "data": <PAYLOAD>,\n>   "message": "Message"\n> }\n> \`\`\`\n\n`;

  const schemas = (swagger as any).components?.schemas || {};

  function generateMock(schema: any): any {
    if (!schema) return null;
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      return generateMock(schemas[refName]);
    }
    if (schema.type === 'object') {
      const obj: any = {};
      if (schema.properties) {
        for (const [k, v] of Object.entries(schema.properties)) {
          obj[k] = generateMock(v);
        }
      }
      return obj;
    }
    if (schema.type === 'array') {
      return [generateMock(schema.items)];
    }
    if (schema.type === 'string') {
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.enum && schema.enum.length) return schema.enum[0];
      return 'string';
    }
    if (schema.type === 'number' || schema.type === 'integer') return 0;
    if (schema.type === 'boolean') return true;

    if (schema.properties) {
      const obj: any = {};
      for (const [k, v] of Object.entries(schema.properties)) {
        obj[k] = generateMock(v);
      }
      return obj;
    }

    return null;
  }

  const groups: Record<string, any[]> = {};
  for (const [p, methods] of Object.entries(swagger.paths)) {
    for (const [method, details] of Object.entries(methods as any)) {
      const tag = (details as any).tags ? (details as any).tags[0] : 'Default';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push({ path: p, method, details });
    }
  }

  for (const [tag, endpoints] of Object.entries(groups)) {
    md += `## ${tag}\n\n`;
    for (const ep of endpoints) {
      md += `### [${ep.method.toUpperCase()}] ${ep.path}\n`;
      md += `**Summary**: ${ep.details.summary || 'No summary'}\n\n`;

      if (ep.details.description) {
        md += `**Description**: ${ep.details.description}\n\n`;
      }

      if (ep.details.parameters && ep.details.parameters.length > 0) {
        md += `**Parameters**:\n`;
        for (const p of ep.details.parameters) {
          md += `- \`${p.name}\` (${p.in}): ${p.description || ''} ${p.required ? '(Required)' : ''}\n`;
        }
        md += `\n`;
      }

      if (ep.details.requestBody) {
        md += `**Request Body**:\n`;
        const content = ep.details.requestBody.content?.['application/json'];
        if (content && content.schema) {
          const mockPayload = generateMock(content.schema);
          md += `\`\`\`json\n${JSON.stringify(mockPayload, null, 2)}\n\`\`\`\n\n`;
        }
      }

      md += `**Responses**:\n`;
      for (const [status, res] of Object.entries((ep.details.responses || {}) as Record<string, any>)) {
        md += `- \`${status}\`: ${res.description || ''}\n`;

        if (status.startsWith('2')) {
          let payloadMock = null;
          const content = res.content?.['application/json'];
          if (content && content.schema) {
            payloadMock = generateMock(content.schema);
          }

          const wrapped: any = {
            success: true,
            data: payloadMock,
            message: res.description || 'Success',
          };

          if (ep.path === '/sales/stats' && status === '200') {
            wrapped.data = {
              summary: {
                totalRevenue: 5328764604,
                totalSales: 29,
                averageTicket: 183750503.59,
                subtotal: 5328764604,
                discount: 0,
                mainPaymentMethod: 'cash',
                mainPaymentMethodLabel: 'Efectivo',
              },
              paymentMethods: {
                cash: {
                  revenue: 3916709859,
                  count: 17,
                  percentage: 73.5,
                  label: 'Efectivo',
                },
                card: {
                  revenue: 257094091,
                  count: 6,
                  percentage: 4.8,
                  label: 'Tarjeta',
                },
                transfer: {
                  revenue: 1154960654,
                  count: 6,
                  percentage: 21.7,
                  label: 'Transferencia',
                },
              },
              dailyRevenue: [
                { day: 'lun', label: 'lun', date: '2026-09-07', revenue: 0, count: 0 },
                { day: 'mar', label: 'mar', date: '2026-09-08', revenue: 0, count: 0 },
                { day: 'mié', label: 'mié', date: '2026-09-09', revenue: 5052932.8, count: 28 },
                { day: 'jue', label: 'jue', date: '2026-09-03', revenue: 0, count: 0 },
                { day: 'vie', label: 'vie', date: '2026-09-04', revenue: 0, count: 0 },
                { day: 'sáb', label: 'sáb', date: '2026-09-05', revenue: 120000, count: 1 },
                { day: 'dom', label: 'dom', date: '2026-09-06', revenue: 0, count: 0 },
              ],
              monthlyTrend: [
                { month: '2026-04', label: 'abr', revenue: 0, count: 0 },
                { month: '2026-05', label: 'may', revenue: 0, count: 0 },
                { month: '2026-06', label: 'jun', revenue: 0, count: 0 },
                { month: '2026-07', label: 'jul', revenue: 0, count: 0 },
                { month: '2026-08', label: 'ago', revenue: 0, count: 0 },
                { month: '2026-09', label: 'sep', revenue: 5328764604, count: 29 },
              ],
              itemTypesBreakdown: {
                services: {
                  revenue: 1500000000,
                  itemsCount: 12,
                  salesCount: 10,
                  revenuePercentage: 28.1,
                },
                products: {
                  revenue: 3828764604,
                  itemsCount: 45,
                  salesCount: 22,
                  revenuePercentage: 71.9,
                },
              },
            };
            wrapped.message = 'Métricas del dashboard obtenidas exitosamente.';
          }

          if (ep.path === '/auth/login' && status === '200') {
            wrapped.data = {
              accessToken: 'eyJhbGciOiJIUzI1...',
              refreshToken: 'eyJhbGciOiJIUzI1...',
              user: {
                id: '6a4e9cefd...',
                name: 'Administrador Inicial',
                email: 'admin@ferventa.com',
                role: 'admin',
                branches: ['6a5e6e9a0...'],
              },
            };
            wrapped.message = 'auth.login';
          }

          if (ep.path === '/auth/me' && status === '200') {
            wrapped.data = {
              id: '6a4e9cefd...',
              name: 'Administrador Inicial',
              email: 'admin@ferventa.com',
              role: 'admin',
              branches: ['6a5e6e9a0...'],
              lastLoginAt: new Date().toISOString(),
            };
            wrapped.message = 'Perfil retornado con éxito';
          }

          // Mock data overrides for realistic frontend response models
          const mockReceptionItem = {
            _id: '60d5ec49c6d48227b409748f',
            product: {
              _id: '60d5ec49c6d48227b4097490',
              name: 'Aceite Sintético 5W-30 1L',
              sku: 'ACE-SYN-5W30',
              sellingPrice: 145,
              brand: { _id: '60d5ec49c6d48227b409749a', name: 'Castrol' },
              category: { _id: '60d5ec49c6d48227b409749b', name: 'Aceites y Lubricantes' },
            },
            sku: 'ACE-SYN-5W30',
            name: 'Aceite Sintético 5W-30 1L',
            quantity: 12,
            costPrice: 110,
            sellingPrice: 145,
            boxCode: 'BOX-M8B2X-1-042',
            isBoxSealed: true,
            openedAt: null,
            openedBy: null,
          };

          const mockReception = {
            _id: '60d5ec49c6d48227b409748a',
            branch: '60d5ec49c6d48227b409748b',
            provider: {
              _id: '60d5ec49c6d48227b409748c',
              name: 'Distribuidora Castrol México',
              providerCode: 'PRV-001',
            },
            receivedBy: {
              _id: '60d5ec49c6d48227b409748d',
              name: 'Juan Vendedor',
              email: 'juan@ferventa.com',
            },
            approvedBy: {
              _id: '60d5ec49c6d48227b409748e',
              name: 'Administrador Principal',
              email: 'admin@ferventa.com',
            },
            approvedAt: '2026-09-14T18:30:00.000Z',
            status: 'approved',
            invoiceOrFolio: 'FAC-98421',
            notes: 'Lote de 24 botellas de aceite sintético 5W-30',
            items: [mockReceptionItem],
            createdAt: '2026-09-14T17:00:00.000Z',
            updatedAt: '2026-09-14T18:30:00.000Z',
          };

          if (ep.path === '/inventory/receptions' && (status === '200' || status === '201')) {
            wrapped.data = status === '201'
              ? { ...mockReception, status: 'draft', approvedBy: null, approvedAt: null }
              : [mockReception];
            wrapped.message = status === '201' ? 'Recepción registrada en borrador' : 'Recepciones obtenidas exitosamente';
          }

          if (ep.path === '/inventory/receptions/{id}' && status === '200') {
            wrapped.data = mockReception;
            wrapped.message = 'Detalle de recepción obtenido exitosamente';
          }

          if (ep.path === '/inventory/receptions/{id}/approve' && status === '200') {
            wrapped.data = mockReception;
            wrapped.message = 'Recepción aprobada exitosamente';
          }

          if (ep.path === '/inventory/receptions/{id}/reject' && status === '200') {
            wrapped.data = { ...mockReception, status: 'rejected', rejectionReason: 'No coincide con la factura física' };
            wrapped.message = 'Recepción rechazada';
          }

          if (ep.path === '/inventory/boxes/open' && (status === '200' || status === '201')) {
            wrapped.data = {
              success: true,
              message: 'Caja BOX-M8B2X-1-042 abierta exitosamente. Se agregaron 12 piezas al stock (Total: 15) y el precio se actualizó a $145',
              boxCode: 'BOX-M8B2X-1-042',
              product: {
                _id: '60d5ec49c6d48227b4097490',
                name: 'Aceite Sintético 5W-30 1L',
                sku: 'ACE-SYN-5W30',
                previousStock: 3,
                currentStock: 15,
                previousSellingPrice: 130,
                currentSellingPrice: 145,
              },
            };
            wrapped.message = 'Caja abierta y precio unificado en mostrador exitosamente';
          }

          if (ep.path === '/attendance/kiosk/employees' && status === '200') {
            wrapped.data = [
              {
                _id: '60d5ec49c6d48227b409748c',
                name: 'Carlos Mecánico',
                username: 'carlos.mecanico',
                role: 'mechanic',
                status: 'working',
                hasActiveShift: true,
                activeBreak: null,
                currentWorkMinutes: 185,
              },
              {
                _id: '60d5ec49c6d48227b409748d',
                name: 'Luis Vendedor',
                username: 'luis.vendedor',
                role: 'seller',
                status: 'on_break',
                hasActiveShift: true,
                activeBreak: {
                  startTime: '2026-09-14T19:00:00.000Z',
                  durationMinutes: 25,
                  note: 'Comida',
                },
                currentWorkMinutes: 265,
              },
              {
                _id: '60d5ec49c6d48227b409748e',
                name: 'Mario Almacén',
                username: 'mario.almacen',
                role: 'warehouse',
                status: 'off_shift',
                hasActiveShift: false,
                activeBreak: null,
                currentWorkMinutes: 0,
              },
            ];
            wrapped.message = 'Lista de empleados de la sucursal para el kiosco';
          }

          if (ep.path === '/attendance/kiosk/clock' && (status === '200' || status === '201')) {
            wrapped.data = {
              success: true,
              message: 'Entrada registrada exitosamente para Carlos Mecánico',
              action: 'clock-in',
              userName: 'Carlos Mecánico',
              timestamp: '2026-09-14T19:30:00.000Z',
              data: {
                _id: '60d5ec49c6d48227b4097491',
                user: '60d5ec49c6d48227b409748c',
                branch: '60d5ec49c6d48227b409748b',
                date: '2026-09-14',
                clockIn: '2026-09-14T19:30:00.000Z',
                clockOut: null,
                status: 'working',
                totalWorkMinutes: 0,
                totalBreakMinutes: 0,
                netWorkMinutes: 0,
                breaks: [],
              },
            };
            wrapped.message = 'Acción de asistencia registrada exitosamente';
          }

          if (ep.path === '/audit-logs' && status === '200') {
            wrapped.data = [
              {
                _id: '60d5ec49c6d48227b4097492',
                branch: {
                  _id: '60d5ec49c6d48227b409748b',
                  name: 'Sucursal Matriz Centro',
                },
                module: 'inventory',
                action: 'OPEN_BOX',
                description: 'Caja BOX-M8B2X-1-042 abierta. 12 piezas ingresadas al stock. Precio venta unificado: $145',
                performedBy: {
                  _id: '60d5ec49c6d48227b409748d',
                  name: 'Juan Vendedor',
                  email: 'juan@ferventa.com',
                  role: 'seller',
                },
                entityId: '60d5ec49c6d48227b4097490',
                entityType: 'Product',
                entityFolio: '',
                metadata: {
                  boxCode: 'BOX-M8B2X-1-042',
                  sku: 'ACE-SYN-5W30',
                  quantity: 12,
                  sellingPrice: 145,
                  receptionId: '60d5ec49c6d48227b409748a',
                },
                createdAt: '2026-09-14T19:32:00.000Z',
              },
            ];
            wrapped.message = 'Bitácora de auditoría obtenida exitosamente';
          }

          if (ep.path === '/appointments/{id}/cancel' && status === '200') {
            wrapped.data = {
              _id: '60d5ec49c6d48227b4097493',
              branch: '60d5ec49c6d48227b409748b',
              customer: {
                _id: '60d5ec49c6d48227b4097494',
                name: 'Roberto García',
                phone: '8112345678',
              },
              vehicle: {
                brand: 'Nissan',
                model: 'Versa',
                year: 2020,
                serialNumberLastFour: '8492',
                color: 'Plata',
              },
              scheduledAt: '2026-09-15T10:00:00.000Z',
              duration: 60,
              status: 'cancelled',
              serviceRequested: 'Afinación Mayor',
              notes: 'Cancelada por el cliente por motivo de viaje',
              createdAt: '2026-09-14T12:00:00.000Z',
            };
            wrapped.message = 'Cita cancelada exitosamente';
          }

          if (ep.path === '/appointments/{id}/check-in' && status === '200') {
            wrapped.data = {
              appointment: {
                _id: '60d5ec49c6d48227b4097493',
                status: 'completed',
                receptionNotes: 'Se recibe con 1/4 de tanque, rayón en puerta derecha',
                customer: {
                  _id: '60d5ec49c6d48227b4097494',
                  name: 'Roberto García',
                  phone: '8112345678',
                },
              },
              maintenance: {
                _id: '60d5ec49c6d48227b4097495',
                status: 'not_started',
                receptionNotes: 'Se recibe con 1/4 de tanque, rayón en puerta derecha',
                receptionDate: '2026-09-14T19:35:00.000Z',
                customer: '60d5ec49c6d48227b4097494',
                vehicle: '60d5ec49c6d48227b4097496',
                appointment: '60d5ec49c6d48227b4097493',
              },
            };
            wrapped.message = 'Vehículo recibido en taller para cita agendada';
          }

          if (ep.path === '/maintenance/{id}/notify-client' && status === '200') {
            wrapped.data = {
              _id: '60d5ec49c6d48227b4097495',
              status: 'completed',
              notifiedAt: '2026-09-14T19:36:00.000Z',
              notificationHistory: [
                {
                  _id: '60d5ec49c6d48227b4097497',
                  sentAt: '2026-09-14T19:36:00.000Z',
                  sentBy: {
                    _id: '60d5ec49c6d48227b409748d',
                    name: 'Juan Vendedor',
                    email: 'juan@ferventa.com',
                  },
                  channel: 'whatsapp',
                  notes: 'Vehículo listo para entrega en sucursal',
                  message: 'Se notificó al cliente que su vehículo está listo para entrega',
                },
              ],
            };
            wrapped.message = 'Notificación enviada al cliente y registrada en el historial';
          }

          md += `  \`\`\`json\n  ${JSON.stringify(wrapped, null, 2).replace(/\n/g, '\n  ')}\n  \`\`\`\n`;
        }
      }
      md += `\n---\n\n`;
    }
  }

  const targetPath = path.resolve(__dirname, '../API_DOCS.md');
  fs.writeFileSync(targetPath, md);
  console.log('API_DOCS.md updated successfully at', targetPath);

  const webTargetPath = path.resolve(__dirname, '../../ferventa-web/API_DOCS.md');
  if (fs.existsSync(path.dirname(webTargetPath))) {
    try {
      fs.writeFileSync(webTargetPath, md);
      console.log('ferventa-web/API_DOCS.md updated successfully at', webTargetPath);
    } catch (e: any) {
      console.warn('Could not write to ferventa-web/API_DOCS.md:', e?.message);
    }
  }

  await app.close();
  process.exit(0);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
