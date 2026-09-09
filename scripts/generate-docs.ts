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
                { date: '2026-09-03', label: 'jue', revenue: 0, count: 0 },
                { date: '2026-09-04', label: 'vie', revenue: 0, count: 0 },
                { date: '2026-09-05', label: 'sáb', revenue: 120000, count: 1 },
                { date: '2026-09-06', label: 'dom', revenue: 0, count: 0 },
                { date: '2026-09-07', label: 'lun', revenue: 0, count: 0 },
                { date: '2026-09-08', label: 'mar', revenue: 0, count: 0 },
                { date: '2026-09-09', label: 'mié', revenue: 5052932.8, count: 28 },
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

          md += `  \`\`\`json\n  ${JSON.stringify(wrapped, null, 2).replace(/\n/g, '\n  ')}\n  \`\`\`\n`;
        }
      }
      md += `\n---\n\n`;
    }
  }

  const targetPath = path.resolve(__dirname, '../API_DOCS.md');
  fs.writeFileSync(targetPath, md);
  console.log('API_DOCS.md updated successfully at', targetPath);

  await app.close();
  process.exit(0);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
