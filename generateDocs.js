const fs = require('fs');

fetch('http://localhost:3000/api/docs-json')
  .then(r => r.json())
  .then(swagger => {
    let md = '# Ferventa API Documentation\n\n';
    
    md += `Base URL: \`/api\`\n\n`;
    md += `> All successful responses are wrapped in a standard JSON format:\n`;
    md += `> \`\`\`json\n> {\n>   "success": true,\n>   "data": <PAYLOAD>,\n>   "message": "Message"\n> }\n> \`\`\`\n\n`;
    
    const schemas = swagger.components?.schemas || {};

    // Helper to generate a dummy value based on OpenAPI schema
    function generateMock(schema) {
      if (!schema) return null;
      if (schema.$ref) {
        const refName = schema.$ref.split('/').pop();
        return generateMock(schemas[refName]);
      }
      if (schema.type === 'object') {
        const obj = {};
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
      
      // Fallback if no type but has properties (implicit object)
      if (schema.properties) {
        const obj = {};
        for (const [k, v] of Object.entries(schema.properties)) {
          obj[k] = generateMock(v);
        }
        return obj;
      }
      
      return null;
    }

    const groups = {};
    for (const [path, methods] of Object.entries(swagger.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        const tag = details.tags ? details.tags[0] : 'Default';
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push({ path, method, details });
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
        for (const [status, res] of Object.entries(ep.details.responses || {})) {
           md += `- \`${status}\`: ${res.description || ''}\n`;
           
           if (status.startsWith('2')) {
             let payloadMock = null;
             const content = res.content?.['application/json'];
             if (content && content.schema) {
               payloadMock = generateMock(content.schema);
             }
             
             // Wrap in standard format
             const wrapped = {
               success: true,
               data: payloadMock,
               message: res.description || "Success"
             };
             
             // Hardcode auth/login specifically since Nest swagger doesn't easily capture custom objects unless modeled
             if (ep.path === '/auth/login' && status === '200') {
               wrapped.data = {
                 accessToken: "eyJhbGciOiJIUzI1...",
                 refreshToken: "eyJhbGciOiJIUzI1...",
                 user: {
                   id: "6a4e9cefd...",
                   name: "Administrador Inicial",
                   email: "admin@ferventa.com",
                   role: "admin",
                   branches: ["6a5e6e9a0..."]
                 }
               };
               wrapped.message = "auth.login";
             }

             if (ep.path === '/auth/me' && status === '200') {
               wrapped.data = {
                 id: "6a4e9cefd...",
                 name: "Administrador Inicial",
                 email: "admin@ferventa.com",
                 role: "admin",
                 branches: ["6a5e6e9a0..."],
                 lastLoginAt: new Date().toISOString()
               };
               wrapped.message = "Perfil retornado con éxito";
             }
             
             md += `  \`\`\`json\n  ${JSON.stringify(wrapped, null, 2).replace(/\n/g, '\n  ')}\n  \`\`\`\n`;
           }
        }
        md += `\n---\n\n`;
      }
    }
    
    fs.writeFileSync('C:/Users/Alexis/Documents/Development/Ssvel/Ferventa/ferventa-api/API_DOCS.md', md);
    console.log('API_DOCS.md updated successfully in backend');
  }).catch(e => console.error(e));
