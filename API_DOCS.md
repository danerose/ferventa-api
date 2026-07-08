# API de Punto de Venta e Inventario para Taller de Autopartes — Documentación de Endpoints

Esta documentación detalla los endpoints de la API, agrupados por módulos de negocio, con sus roles de acceso, especificaciones de Request y de Response en formato normalizado.

---

## Formato de Respuestas Normalizado

Todos los endpoints retornan una estructura uniforme para respuestas exitosas:

```json
{
  "success": true,
  "data": {},
  "message": "Mensaje traducido de éxito o error (es / en)"
}
```

La traducción de los mensajes se realiza de forma automática basándose en la cabecera HTTP `Accept-Language` (por defecto `es`).

### Respuestas de Error (4xx / 5xx)

Cuando una petición falla (por ejemplo, errores de validación de campos), la respuesta tendrá el siguiente formato normalizado:

```json
{
  "success": false,
  "data": null,
  "message": "The field customerEmail must be a valid email address"
}
```

- **success**: Siempre `false` para indicar que la petición no fue exitosa.
- **data**: Siempre `null` (excepto en ambiente de desarrollo para errores internos del servidor (500), donde se podría adjuntar información de depuración como `detail` y `stack`).
- **message**: Contiene el detalle del error. En el caso de errores de validación (por ejemplo, múltiples campos inválidos en la petición), el API devolverá **únicamente el primer error** encontrado en este campo.

---

## 1. Autenticación (`/auth`)

### Registrar un Usuario (`POST /auth/signup`)
- **Descripción:** Registra un nuevo usuario en el sistema. Por defecto se le asigna el rol de `seller`.
- **Acceso:** Público.
- **Request Body (SignupDto):**
  ```json
  {
    "name": "Alexis Rojas",
    "email": "alexis@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "name": "Alexis Rojas",
      "email": "alexis@example.com",
      "role": "60d5ec49c6d48227b409748b",
      "isActive": true
    },
    "message": "Usuario registrado exitosamente"
  }
  ```

### Iniciar Sesión (`POST /auth/login`)
- **Descripción:** Autentica a un usuario y genera un Access Token (15 min) y un Refresh Token (7 días). Registra la sesión activa.
- **Acceso:** Público.
- **Request Body (LoginDto):**
  ```json
  {
    "email": "admin@ferventa.com",
    "password": "AdminPassword123!"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "user": {
        "id": "60d5ec49...",
        "name": "Administrador",
        "email": "admin@ferventa.com",
        "role": "admin"
      }
    },
    "message": "Sesión iniciada correctamente"
  }
  ```

### Refrescar Token (`POST /auth/refresh`)
- **Descripción:** Renueva el Access Token si el Refresh Token es válido y la sesión no ha sido revocada.
- **Acceso:** Público.
- **Request Body (RefreshDto):**
  ```json
  {
    "refreshToken": "eyJhbGci..."
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGci..."
    },
    "message": "Token renovado exitosamente"
  }
  ```

### Cerrar Sesión (`POST /auth/logout`)
- **Descripción:** Invalida y revoca la sesión activa actual en la base de datos.
- **Acceso:** Autenticado (Cualquier rol).
- **Response (200):**
  ```json
  {
    "success": true,
    "data": null,
    "message": "Sesión cerrada correctamente"
  }
  ```

### Obtener Perfil (`GET /auth/me`)
- **Descripción:** Retorna el perfil del usuario autenticado actual.
- **Acceso:** Autenticado (Cualquier rol).
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "id": "60d5ec49...",
      "name": "Administrador",
      "email": "admin@ferventa.com",
      "role": {
        "name": "admin",
        "permissions": ["*"]
      }
    },
    "message": "Operación realizada con éxito"
  }
  ```

---

## 2. Gestión de Sesiones (`/sessions`)

### Ver mis sesiones activas (`GET /sessions/me`)
- **Descripción:** Lista los accesos activos de sesión del usuario autenticado.
- **Acceso:** Autenticado (Cualquier rol).
- **Response (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6a49b26d...",
        "ip": "::1",
        "userAgent": "Mozilla/5.0...",
        "loginAt": "2026-07-04T20:10:00.000Z",
        "expireAt": "2026-07-11T20:10:00.000Z",
        "isRevoked": false
      }
    ],
    "message": "Operación realizada con éxito"
  }
  ```

### Ver todas las sesiones activas (`GET /sessions`)
- **Descripción:** Lista todas las sesiones activas en el sistema para auditoría de accesos.
- **Acceso:** Solo `admin`.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6a49b26d...",
        "user": {
          "id": "60d5ec49...",
          "name": "Alexis Rojas"
        },
        "ip": "::1",
        "isRevoked": false
      }
    ],
    "message": "Operación realizada con éxito"
  }
  ```

### Revocar una sesión (`POST /sessions/:id/revoke`)
- **Descripción:** Cierra/revoca una sesión activa de forma remota. El Access Token de dicha sesión quedará bloqueado.
- **Acceso:** Propietario de la sesión o `admin`.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": null,
    "message": "Sesión revocada exitosamente"
  }
  ```

---

## 3. CRUD de Usuarios (`/users`)

### Crear un nuevo usuario (`POST /users`)
- **Acceso:** Solo `admin`.
- **Request Body (CreateUserDto):**
  ```json
  {
    "name": "Sofía Martínez",
    "email": "sofia@example.com",
    "password": "Password123!",
    "roleId": "60d5ec49c6d48227b409748b"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "60d5ec49...",
      "name": "Sofía Martínez",
      "email": "sofia@example.com",
      "role": "60d5ec49c6d48227b409748b"
    },
    "message": "Usuario creado exitosamente"
  }
  ```

### Listar todos los usuarios (`GET /users`)
- **Descripción:** Obtiene los usuarios con filtros opcionales de búsqueda.
- **Acceso:** Solo `admin`.
- **Query Params:**
  - `role` (Opcional, string): Nombre del rol a filtrar.
  - `isActive` (Opcional, boolean): Filtrar activos (`true`/`false`).
- **Response (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "60d5e...",
        "name": "Sofía Martínez",
        "email": "sofia@example.com",
        "role": { "name": "seller" },
        "isActive": true
      }
    ],
    "message": "Operación realizada con éxito"
  }
  ```

### Obtener roles del sistema (`GET /users/roles`)
- **Descripción:** Obtiene la lista de roles activos definidos en el sistema.
- **Acceso:** Autenticado (Cualquier rol).
- **Response (200):**
  ```json
  {
    "success": true,
    "data": [
      { "id": "60d5e...", "name": "admin", "permissions": ["*"] },
      { "id": "60d5f...", "name": "seller", "permissions": ["sales.create", "quotes.create"] }
    ],
    "message": "Operación realizada con éxito"
  }
  ```

### Obtener un usuario (`GET /users/:id`)
- **Acceso:** Solo `admin`.

### Modificar un usuario (`PATCH /users/:id`)
- **Acceso:** Solo `admin`.
- **Request Body (UpdateUserDto):**
  ```json
  {
    "name": "Sofía M. López",
    "isActive": false
  }
  ```

### Dar de baja un usuario (`DELETE /users/:id`)
- **Descripción:** Realiza un borrado lógico (Soft Delete) del usuario.
- **Acceso:** Solo `admin`.

---

## 4. Clientes (`/customers`)

### Registrar un Cliente (`POST /customers`)
- **Acceso:** `admin` o `seller`.
- **Request Body (CreateCustomerDto):**
  ```json
  {
    "name": "Juan Pérez",
    "phone": "8118765432",
    "email": "juan.perez@example.com",
    "whatsappId": "whatsapp_123"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "60d5e...",
      "name": "Juan Pérez",
      "phone": "8118765432"
    },
    "message": "Cliente creado correctamente."
  }
  ```

### Listar Clientes (`GET /customers`)
- **Query Params:**
  - `search` (Opcional, string): Busca coincidencias por nombre o número telefónico.

### Obtener Cliente por Teléfono (`GET /customers/phone/:phone`)
- **Acceso:** Autenticado (Cualquier rol).

### Modificar Cliente (`PATCH /customers/:id`)
- **Request Body (UpdateCustomerDto):**
  ```json
  {
    "phone": "8110001122"
  }
  ```

### Eliminar Cliente (`DELETE /customers/:id`)
- **Acceso:** Solo `admin`.

---

## 5. Vehículos (`/vehicles`)

### Registrar un Vehículo (`POST /vehicles`)
- **Acceso:** `admin` o `seller`.
- **Request Body (CreateVehicleDto):**
  ```json
  {
    "customerId": "60d5e...",
    "brand": "Nissan",
    "model": "Versa",
    "year": 2018,
    "serialNumberLastFour": "1234",
    "color": "Gris Plata"
  }
  ```

### Listar Vehículos (`GET /vehicles`)
- **Query Params:**
  - `customerId` (Opcional, string): Filtrar por el ID del dueño.
  - `search` (Opcional, string): Buscar coincidencia por marca, modelo o últimos 4 dígitos del número de serie.

### Obtener Vehículo por Número de Serie (`GET /vehicles/serial/:serial`)
- **Acceso:** Autenticado (Cualquier rol).

### Modificar Vehículo (`PATCH /vehicles/:id`)

### Eliminar Vehículo (`DELETE /vehicles/:id`)
- **Acceso:** Solo `admin`.

---

## 6. Citas (`/appointments`)

### Agendar Cita desde Portal Público (`POST /appointments/public`)
- **Descripción:** Permite a clientes externos agendar servicios. Si el número celular provisto no está registrado, **se crea de forma automática el Cliente y el Vehículo** en el sistema. Valida automáticamente que la fecha/hora no esté en el pasado, que esté dentro del horario laboral configurado, que no sea un día festivo/no laboral, y que no se traslape con citas existentes.
- **Acceso:** Público.
- **Request Body (CreateAppointmentDto):**
  ```json
  {
    "customerName": "Carlos Sánchez",
    "customerPhone": "8119876543",
    "customerEmail": "carlos@example.com",
    "vehicle": {
      "brand": "Ford",
      "model": "Fiesta",
      "year": 2015,
      "serialNumberLastFour": "1234"
    },
    "serviceRequested": "Cambio de aceite y filtro",
    "scheduledAt": "2026-07-10T10:00:00Z",
    "notes": "Prefiere aceite sintético",
    "duration": 90,
    "assignedMechanic": "Roberto Sánchez"
  }
  ```

### Consultar Estado Cita (Público) (`GET /appointments/public/status`)
- **Query Params:**
  - `q` (Requerido, string): Folio de cita (ID), número de teléfono del cliente, o últimos 4 dígitos del número de serie del vehículo.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "60d5e...",
        "scheduledAt": "2026-07-10T10:00:00Z",
        "status": "pending",
        "serviceRequested": "Cambio de aceite y filtro",
        "duration": 90,
        "assignedMechanic": "Roberto Sánchez"
      }
    ],
    "message": "Operación realizada con éxito"
  }
  ```

### Registrar Cita por el Staff (`POST /appointments`)
- **Acceso:** `admin` o `seller`.

### Listar Citas (`GET /appointments`)
- **Query Params:**
  - `search` (Opcional): Búsqueda por cliente, celular o últimos 4 dígitos del número de serie.
  - `status` (Opcional): Filtrar por estado (`pending`, `approved`, `rejected`, `cancelled`, `completed`, `rescheduled`).
  - `fromDate` y `toDate` (Opcional, YYYY-MM-DD): Rango de fechas.

### Modificar Cita (`PATCH /appointments/:id`)
- **Request Body (UpdateAppointmentDto):**
  ```json
  {
    "status": "approved",
    "scheduledAt": "2026-07-10T11:00:00Z",
    "duration": 60,
    "assignedMechanic": "Roberto Sánchez"
  }
  ```

### Aprobar Cita (`PATCH /appointments/:id/approve`)
- **Descripción:** Aprueba la cita (cambia el estado a `approved`) y envía de forma automática un mensaje de WhatsApp con el contenido personalizado al número de teléfono del cliente.
- **Acceso:** `admin` o `seller`.
- **Request Body (ApproveAppointmentDto):**
  ```json
  {
    "message": "Hola, tu cita ha sido aprobada para el día programado. ¡Te esperamos!"
  }
  ```
- **Response (200):** Cita actualizada con `status: "approved"`.

### Rechazar Cita (`PATCH /appointments/:id/reject`)
- **Descripción:** Rechaza la cita (cambia el estado a `rejected`) y envía un mensaje de WhatsApp de notificación al cliente con el motivo o explicación.
- **Acceso:** `admin` o `seller`.
- **Request Body (RejectAppointmentDto):**
  ```json
  {
    "message": "Hola, lamentablemente hemos tenido que cancelar tu cita debido a falta de disponibilidad."
  }
  ```
- **Response (200):** Cita actualizada con `status: "rejected"`.

### Reagendar Cita (`PATCH /appointments/:id/reschedule`)
- **Descripción:** Cambia el horario de la cita (asigna el estado a `rescheduled` para reflejar que está en proceso de reagendación y espera confirmación) y envía un mensaje de confirmación/aviso por WhatsApp al cliente.
- **Acceso:** `admin` o `seller`.
- **Request Body (RescheduleAppointmentDto):**
  ```json
  {
    "scheduledAt": "2026-07-24T10:00:00.000Z",
    "duration": 90,
    "message": "Hola, hemos reagendado tu cita para el día 24 de Julio a las 10:00 AM. Confírmanos si estás de acuerdo."
  }
  ```
- **Response (200):** Cita actualizada con `status: "rescheduled"`, la nueva fecha y la nueva duración.

### Obtener Horario Semanal (`GET /appointments/schedule`)
- **Descripción:** Obtiene los horarios y días laborables del taller de Lunes a Domingo.
- **Acceso:** Público.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": [
      { "dayOfWeek": 0, "isWorking": false, "startTime": "08:00", "endTime": "18:00" },
      { "dayOfWeek": 1, "isWorking": true, "startTime": "08:00", "endTime": "18:00" }
    ],
    "message": "Operación realizada con éxito"
  }
  ```

### Actualizar Horario Semanal (`PATCH /appointments/schedule`)
- **Descripción:** Configura qué días se trabaja y en qué horario.
- **Acceso:** `admin` o `seller`.
- **Request Body (UpdateScheduleDto):**
  ```json
  {
    "schedules": [
      { "dayOfWeek": 1, "isWorking": true, "startTime": "09:00", "endTime": "19:00" }
    ]
  }
  ```

### Listar Días Festivos y Cierres (`GET /appointments/holidays`)
- **Descripción:** Lista los días que el taller permanecerá cerrado por motivos extraordinarios o días festivos.
- **Acceso:** Público.

### Registrar Día Festivo o Cierre (`POST /appointments/holidays`)
- **Descripción:** Registra un día inhábil para que los clientes no puedan agendar citas.
- **Acceso:** `admin` o `seller`.
- **Request Body (CreateHolidayDto):**
  ```json
  {
    "date": "2026-12-25",
    "description": "Navidad"
  }
  ```

### Remover Día Festivo o Cierre (`DELETE /appointments/holidays/:id`)
- **Acceso:** `admin` o `seller`.

### Obtener Citas y Horas Ocupadas (`GET /appointments/occupied-slots`)
- **Descripción:** Devuelve un consolidado de días inactivos (festivos/fines de semana) y franjas horarias ocupadas por citas agendadas/pendientes en un rango de fechas. Permite desactivar días y horas específicos en la UI del cliente.
- **Query Params:**
  - `startDate` (Requerido, string): Fecha de inicio (YYYY-MM-DD)
  - `endDate` (Requerido, string): Fecha fin (YYYY-MM-DD)
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "holidays": [
        { "date": "2026-12-25", "description": "Navidad" }
      ],
      "nonWorkingDaysOfWeek": [0],
      "busySlots": [
        { "appointmentId": "60d5e...", "date": "2026-07-10", "startTime": "10:00", "endTime": "11:30" }
      ],
      "workingHours": [
        { "dayOfWeek": 1, "isWorking": true, "startTime": "08:00", "endTime": "18:00" }
      ]
    },
    "message": "Operación realizada con éxito"
  }
  ```

### Obtener Cronograma de Citas (`GET /appointments/timeline`)
- **Descripción:** Devuelve las citas de un rango de fechas con todos sus detalles (cliente, teléfono, vehículo, servicio, mecánico, horas exactas de inicio/fin, duración) estructurado de forma ideal para renderizar una línea de tiempo o calendario semanal en el panel de administración.
- **Acceso:** `admin` o `seller`.
- **Query Params:**
  - `startDate` (Requerido, string): Fecha inicio (YYYY-MM-DD)
  - `endDate` (Requerido, string): Fecha fin (YYYY-MM-DD)
- **Response (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "60d5e...",
        "customerName": "Juan Pérez",
        "customerPhone": "8119876543",
        "serviceRequested": "Mantenimiento Preventivo",
        "scheduledAt": "2026-07-09T08:00:00Z",
        "duration": 90,
        "status": "approved",
        "assignedMechanic": "Roberto Sánchez",
        "vehicle": {
          "brand": "Yamaha",
          "model": "MT-09",
          "serialNumberLastFour": "1234"
        },
        "startTime": "08:00",
        "endTime": "09:30"
      }
    ],
    "message": "Operación realizada con éxito"
  }
  ```

---

## 7. Inventario y Almacén (`/inventory`)

### Registrar Marca (`POST /inventory/brands`)
- **Request Body:** `{ "name": "Bosch" }`

### Registrar Categoría (`POST /inventory/categories`)
- **Request Body:** `{ "name": "Frenos" }`

### Registrar Proveedor (`POST /inventory/providers`)
- **Request Body (CreateProviderDto):**
  ```json
  {
    "name": "Autopartes Norte",
    "phone": "8112345678",
    "email": "contacto@autopartesnorte.com"
  }
  ```

### Registrar Producto/Refacción (`POST /inventory/products`)
- **Acceso:** `admin` o `warehouse`.
- **Request Body (CreateProductDto):**
  ```json
  {
    "sku": "BAL-DEV-DEL",
    "name": "Balatas Delanteras Bosch",
    "brandId": "60d5ec...",
    "categoryId": "60d5ed...",
    "providerId": "60d5ee...",
    "costPrice": 450.00,
    "sellingPrice": 750.00,
    "stock": 15,
    "minStock": 5,
    "unit": "kit",
    "compatibility": ["Nissan Versa 2018", "Nissan March 2017"]
  }
  ```

### Listar Catálogo de Productos (`GET /inventory/products`)
- **Query Params:**
  - `search` (Opcional): Búsqueda por coincidencia en Nombre, SKU o Compatibilidad.
  - `categoryId` y `brandId` (Opcional): Filtrado específico.

### Obtener Producto por SKU (`GET /inventory/products/sku/:sku`)

### Registrar Movimiento de Stock Manual (`POST /inventory/movements`)
- **Descripción:** Añade o retira stock (ajustes, mermas, auditorías físicas).
- **Acceso:** `admin` o `warehouse`.
- **Request Body (CreateStockMovementDto):**
  ```json
  {
    "productId": "60d5ec...",
    "type": "in",
    "quantity": 10,
    "reason": "Reabastecimiento de urgencia"
  }
  ```

---

## 8. Mantenimientos / Órdenes de Servicio (`/maintenance`)

### Crear Orden de Servicio (`POST /maintenance`)
- **Acceso:** `admin` o `seller`.
- **Request Body (CreateMaintenanceDto):**
  ```json
  {
    "customerId": "60d5ec...",
    "vehicleId": "60d5ed...",
    "laborCost": 1200.00,
    "notes": "Diagnóstico inicial por rechinido al frenar"
  }
  ```

### Consumir Refacciones (`POST /maintenance/:id/items`)
- **Descripción:** Registra las refacciones ocupadas en el servicio. Realiza el descuento físico del almacén, guarda el costo histórico e inmutable del artículo, y genera el movimiento de salida.
- **Acceso:** `admin`, `seller` o `warehouse`.
- **Request Body (AddItemUsedDto):**
  ```json
  {
    "productId": "60d5ec...",
    "quantity": 1
  }
  ```

### Subir Evidencia Fotográfica (`POST /maintenance/:id/evidence`)
- **Descripción:** Carga un máximo de 5 fotos de la orden asociadas a una fase del mantenimiento.
- **Request Body (Multipart Form):**
  - `stage`: (string) e.g., `reception`, `disassembly`, `completed`.
  - `photos`: (files) Archivos de imagen (JPG/PNG).

### Tracking de Mantenimiento por Cliente (Público) (`GET /maintenance/track/public`)
- **Query Params:**
  - `q` (Requerido, string): Número celular del cliente o últimos 4 dígitos del número de serie del vehículo.
- **Response (200):** Retorna el historial de la orden, detalles del vehículo, mano de obra, piezas consumidas y enlaces a fotos de evidencia clasificadas por etapa.

---

## 9. Cotizaciones (`/quotes`)

### Generar Cotización (`POST /quotes`)
- **Descripción:** Crea una propuesta económica con 15 días de validez.
- **Request Body (CreateQuoteDto):**
  ```json
  {
    "customerId": "60d5ec...",
    "items": [
      {
        "productId": "60d5ed...",
        "quantity": 2,
        "discount": 10.00
      }
    ],
    "globalDiscount": 20.00,
    "validUntil": "2026-07-20T23:59:59Z"
  }
  ```

### Modificar Cotización (`PATCH /quotes/:id`)
- **Acceso:** `admin` o `seller` (Sólo si el estado actual es `pending`).

---

## 10. Ventas y Terminal POS (`/sales`)

### Registrar Venta (`POST /sales`)
- **Descripción:** Crea la transacción de venta. 
  - Si `paymentMethod: 'card'`, se simula la aprobación a través del SDK de Mercado Pago Point.
  - Genera el descuento automático de stock de catálogo e inyecta los snapshots inmutables correspondientes.
- **Request Body (CreateSaleDto):**
  ```json
  {
    "customerId": "60d5ec...",
    "paymentMethod": "cash",
    "items": [
      {
        "productId": "60d5ed...",
        "quantity": 1,
        "discount": 0
      }
    ]
  }
  ```

### Cancelar Venta (`POST /sales/:id/cancel`)
- **Descripción:** Anula la venta, registra los motivos y **devuelve todo el stock** de los productos vendidos de regreso al almacén.
- **Acceso:** Solo `admin`.
- **Request Body (CancelSaleDto):**
  ```json
  {
    "reason": "Cliente solicitó devolución de la refacción por incompatibilidad"
  }
  ```

### Consultar Ticket (`GET /sales/ticket/:query`)
- **Descripción:** Obtiene los datos completos formateados de la venta para impresión por su Folio de Venta o ID de documento.

---

## 11. Reportes y Dashboard (`/reports`)

### Resumen de Ventas Financiero (`GET /reports/sales`)
- **Acceso:** Solo `admin`.
- **Query Params:** `startDate=YYYY-MM-DD`, `endDate=YYYY-MM-DD`
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "totalRevenue": 24500.00,
      "salesCount": 12,
      "byPaymentMethod": { "cash": 18000.00, "card": 6500.00 },
      "dailySales": [ { "date": "2026-07-04", "revenue": 750.00 } ]
    },
    "message": "Operación realizada con éxito"
  }
  ```

### Productos Más Vendidos (`GET /reports/top-products`)
- **Acceso:** Solo `admin`.
- **Query Params:** `startDate=YYYY-MM-DD`, `endDate=YYYY-MM-DD`, `limit=5`

### Estado de Órdenes de Mantenimiento (`GET /reports/maintenance`)
- **Acceso:** `admin` o `seller`.
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "not_started": 2,
      "in_progress": 4,
      "completed": 1,
      "delivered": 5
    },
    "message": "Operación realizada con éxito"
  }
  ```

---

## 12. Monitoreo (`/health`)

### Health Check (`GET /health`)
- **Acceso:** Público.
- **Response (200):**
  ```json
  {
    "status": "ok",
    "uptime": 124.56,
    "timestamp": "2026-07-04T20:25:30.123Z"
  }
  ```
