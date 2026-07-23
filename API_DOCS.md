# Ferventa API Documentation

Base URL: `/api`

> All successful responses are wrapped in a standard JSON format:
> ```json
> {
>   "success": true,
>   "data": <PAYLOAD>,
>   "message": "Message"
> }
> ```

## Monitoreo (Health)

### [GET] /
**Summary**: No summary

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /health
**Summary**: Obtener el estado del servicio y su disponibilidad (Health Check)

**Responses**:
- `200`: Servicio en funcionamiento (OK)
  ```json
  {
    "success": true,
    "data": null,
    "message": "Servicio en funcionamiento (OK)"
  }
  ```

---

## Usuarios

### [POST] /users
**Summary**: Crear un nuevo usuario (Solo Admin)

**Request Body**:
```json
{
  "name": "Alexis Rojas",
  "username": "alexis.rojas",
  "email": "alexis@example.com",
  "password": "Password123!",
  "phone": "8118765432",
  "roleId": "60d5ec49c6d48227b409748b",
  "branches": [
    "60d5ec49c6d48227b409748c"
  ]
}
```
> **Nota**: `username`, `email` y `password` son opcionales. Si no se especifican, se autogeneran automáticamente (`username` basado en el nombre, `email` como `{username}@ferventa.com`, y `password` con una contraseña temporal segura).

**Responses**:
- `201`: Usuario creado exitosamente. Devuelve los detalles del usuario creado junto con la contraseña temporal, mensaje formateado para WhatsApp y el `whatsappUrl` listo para ser abierto por el frontend.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "60d5ec49c6d48227b409748b",
        "name": "Alexis Rojas",
        "username": "alexis.rojas",
        "email": "alexis.rojas@ferventa.com",
        "phone": "8118765432",
        "role": {
          "_id": "60d5ec49c6d48227b409748a",
          "name": "seller"
        },
        "isActive": true
      },
      "tempPassword": "a1b2c3d4!",
      "message": "¡Hola Alexis Rojas! Tu cuenta en Ferventa ha sido creada exitosamente.\n\nDetalles de acceso:\n- Usuario: alexis.rojas\n- Correo: alexis.rojas@ferventa.com\n- Teléfono: 8118765432\n- Contraseña temporal: a1b2c3d4!\n\nPuedes iniciar sesión en el siguiente enlace:\n🔗 https://app.ferventa.com/login",
      "whatsappUrl": "https://api.whatsapp.com/send?phone=528118765432&text=%C2%A1Hola%20Alexis%20Rojas!..."
    },
    "message": "Usuario creado exitosamente"
  }
  ```
- `400`: Datos inválidos, o correo / nombre de usuario ya registrado.

---

### [GET] /users
**Summary**: Listar todos los usuarios (Solo Admin)

**Parameters**:
- `role` (query): Filtrar por nombre de rol 
- `isActive` (query): Filtrar por estado activo 

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "60d5ec49c6d48227b409748b",
        "name": "Alexis Rojas",
        "username": "alexis.rojas",
        "email": "alexis@example.com",
        "phone": "8118765432"
      }
    ],
    "message": "Success"
  }
  ```

---

### [GET] /users/roles
**Summary**: Obtener la lista de roles activos

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /users/generate-username
**Summary**: Generar un nombre de usuario único basado en el nombre de la persona (Solo Admin)

**Parameters**:
- `name` (query): Nombre completo de la persona (Required)

**Responses**:
- `200`: Nombre de usuario único disponible generado exitosamente
  ```json
  {
    "success": true,
    "data": {
      "username": "alexis.rojas"
    },
    "message": "Success"
  }
  ```

---

### [GET] /users/check-username
**Summary**: Validar si un nombre de usuario ya existe o está disponible (Solo Admin)

**Parameters**:
- `username` (query): Nombre de usuario a validar (Required)

**Responses**:
- `200`: Estado de disponibilidad del nombre de usuario
  ```json
  {
    "success": true,
    "data": {
      "exists": false,
      "available": true,
      "username": "alexis.rojas"
    },
    "message": "Success"
  }
  ```

---

### [GET] /users/check-username/{username}
**Summary**: Validar si un nombre de usuario ya existe por parámetro de ruta (Solo Admin)

**Parameters**:
- `username` (path): Nombre de usuario a validar (Required)

**Responses**:
- `200`: Estado de disponibilidad del nombre de usuario
  ```json
  {
    "success": true,
    "data": {
      "exists": false,
      "available": true,
      "username": "alexis.rojas"
    },
    "message": "Success"
  }
  ```

---

### [POST] /users/migrate-usernames
**Summary**: Migrar usuarios existentes que no tengan un nombre de usuario asignado (Solo Admin)

**Responses**:
- `200`: Migración ejecutada exitosamente. Devuelve el número total de usuarios migrados y la lista de nombres asignados.
  ```json
  {
    "success": true,
    "data": {
      "totalMigrated": 2,
      "users": [
        {
          "id": "60d5ec49c6d48227b409748b",
          "name": "Juan Pérez",
          "username": "juan.perez",
          "email": "juan@example.com"
        }
      ]
    },
    "message": "Success"
  }
  ```

---

### [GET] /users/{id}
**Summary**: Obtener un usuario por ID (Solo Admin)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /users/{id}
**Summary**: Actualizar datos de un usuario (Solo Admin)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "roleId": "string",
  "isActive": true
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /users/{id}
**Summary**: Eliminar (Soft Delete) un usuario (Solo Admin)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Sesiones y Auditoría

### [GET] /sessions/me
**Summary**: Ver mis sesiones activas

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /sessions
**Summary**: Ver todas las sesiones activas en el sistema (Solo Admin)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /sessions/{id}/revoke
**Summary**: Revocar/cerrar una sesión específica

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: Sesión revocada correctamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Sesión revocada correctamente."
  }
  ```

---

## Autenticación

### [POST] /auth/signup
**Summary**: Registrar un nuevo usuario (Vendedor por defecto)

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string"
}
```

**Responses**:
- `201`: Usuario registrado exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Usuario registrado exitosamente."
  }
  ```
- `400`: El correo ya está registrado.

---

### [POST] /auth/login
**Summary**: Iniciar sesión con nombre de usuario o correo electrónico y contraseña

**Request Body**:
Opción A (por Nombre de Usuario):
```json
{
  "username": "alexis.rojas",
  "password": "AdminPassword123!"
}
```
Opción B (por Correo Electrónico):
```json
{
  "email": "alexis.rojas@ferventa.com",
  "password": "AdminPassword123!"
}
```
> **Nota**: El sistema acepta indistintamente `username` o `email` en la petición. Los usuarios sin `username` asignado pueden ingresar con su correo electrónico sin problemas.

**Responses**:
- `200`: Sesión iniciada correctamente, tokens y datos de usuario retornados.
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1...",
      "refreshToken": "eyJhbGciOiJIUzI1...",
      "user": {
        "id": "6a4e9cefd...",
        "name": "Alexis Rojas",
        "username": "alexis.rojas",
        "email": "alexis.rojas@ferventa.com",
        "role": "admin",
        "branches": [
          "6a5e6e9a0..."
        ]
      }
    },
    "message": "auth.login"
  }
  ```
- `401`: Credenciales inválidas.

---

### [POST] /auth/refresh
**Summary**: Renovar access token usando refresh token

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Responses**:
- `200`: Token renovado exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Token renovado exitosamente."
  }
  ```
- `401`: Refresh token inválido o expirado.

---

### [POST] /auth/logout
**Summary**: Cerrar sesión e invalidar la sesión actual

**Responses**:
- `200`: Sesión cerrada exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Sesión cerrada exitosamente."
  }
  ```

---

### [GET] /auth/me
**Summary**: Obtener el perfil del usuario autenticado

**Responses**:
- `200`: Perfil retornado con éxito.
  ```json
  {
    "success": true,
    "data": {
      "id": "6a4e9cefd...",
      "name": "Administrador Inicial",
      "email": "admin@ferventa.com",
      "role": "admin",
      "branches": [
        "6a5e6e9a0..."
      ],
      "lastLoginAt": "2026-07-20T22:01:38.489Z"
    },
    "message": "Perfil retornado con éxito"
  }
  ```

---

## Inventario

### [POST] /inventory/brands
**Summary**: Registrar una marca de autopartes (Admin / Warehouse)

**Request Body**:
```json
{
  "name": "string"
}
```

**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /inventory/brands
**Summary**: Listar todas las marcas

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /inventory/brands/{id}
**Summary**: Eliminar una marca (Admin / Warehouse)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /inventory/categories
**Summary**: Registrar una categoría (Admin / Warehouse)

**Request Body**:
```json
{
  "name": "string"
}
```

**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /inventory/categories
**Summary**: Listar todas las categorías

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /inventory/categories/{id}
**Summary**: Eliminar una categoría (Admin / Warehouse)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /inventory/providers
**Summary**: Registrar un proveedor (Admin / Warehouse)

**Request Body**:
```json
{
  "name": "string",
  "providerCode": "string"
}
```

**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /inventory/providers
**Summary**: Listar todos los proveedores

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /inventory/providers/{id}
**Summary**: Actualizar datos de un proveedor (Admin / Warehouse)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "name": "string",
  "providerCode": "string"
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /inventory/providers/{id}
**Summary**: Eliminar un proveedor (Admin / Warehouse)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /inventory/products
**Summary**: Registrar una autoparte/producto (Admin / Warehouse)

**Request Body**:
```json
{
  "sku": "string",
  "name": "string",
  "description": "string",
  "brandId": "string",
  "categoryId": "string",
  "costPrice": 0,
  "sellingPrice": 0,
  "stock": 0,
  "minStock": 0,
  "unit": "string",
  "photos": [
    "string"
  ],
  "compatibility": [
    "string"
  ]
}
```

**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /inventory/products
**Summary**: Listar autopartes con filtros opcionales

**Parameters**:
- `search` (query): Buscar por nombre, SKU o compatibilidad 
- `categoryId` (query): Filtrar por categoría ID 
- `brandId` (query): Filtrar por marca ID 

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /inventory/products/{id}
**Summary**: Obtener detalle de un producto por ID

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /inventory/products/{id}
**Summary**: Actualizar un producto (Admin / Warehouse)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "brandId": "string",
  "categoryId": "string",
  "costPrice": 0,
  "sellingPrice": 0,
  "stock": 0,
  "minStock": 0,
  "unit": "string",
  "photos": [
    "string"
  ],
  "compatibility": [
    "string"
  ],
  "isActive": true
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /inventory/products/{id}
**Summary**: Dar de baja un producto (Admin / Warehouse)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /inventory/products/sku/{sku}
**Summary**: Obtener detalle de un producto por SKU

**Parameters**:
- `sku` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /inventory/movements
**Summary**: Registrar movimiento de stock manual (Admin / Warehouse)

**Request Body**:
```json
{
  "productId": "string",
  "providerId": "string",
  "type": "in",
  "quantity": 0,
  "reason": "string"
}
```

**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /inventory/movements
**Summary**: Ver todos los movimientos de stock del sistema

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /inventory/products/{id}/movements
**Summary**: Ver movimientos de stock de un producto específico

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Clientes

### [POST] /customers
**Summary**: Registrar un nuevo cliente (Admin / Seller)

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "whatsappId": "string"
}
```

**Responses**:
- `201`: Cliente creado correctamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Cliente creado correctamente."
  }
  ```

---

### [GET] /customers
**Summary**: Listar todos los clientes o buscar por nombre/teléfono

**Parameters**:
- `search` (query):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /customers/{id}
**Summary**: Obtener detalle de un cliente por ID

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /customers/{id}
**Summary**: Actualizar un cliente (Admin / Seller)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "whatsappId": "string"
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /customers/{id}
**Summary**: Eliminar un cliente (Solo Admin)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /customers/phone/{phone}
**Summary**: Obtener detalle de un cliente por teléfono

**Parameters**:
- `phone` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Vehículos

### [POST] /vehicles
**Summary**: Registrar un vehículo (Admin / Seller)

**Request Body**:
```json
{
  "customerId": "string",
  "brand": "string",
  "model": "string",
  "year": 0,
  "serialNumberLastFour": "string",
  "color": "string"
}
```

**Responses**:
- `201`: Vehículo registrado correctamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Vehículo registrado correctamente."
  }
  ```

---

### [GET] /vehicles
**Summary**: Listar vehículos con filtros de búsqueda y cliente propietario

**Parameters**:
- `customerId` (query): Filtrar por ID del cliente 
- `search` (query): Buscar por marca, modelo o últimos 4 dígitos del número de serie 

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /vehicles/{id}
**Summary**: Obtener detalle de un vehículo por ID

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /vehicles/{id}
**Summary**: Actualizar datos de un vehículo (Admin / Seller)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "customerId": "string",
  "brand": "string",
  "model": "string",
  "year": 0,
  "serialNumberLastFour": "string",
  "color": "string"
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /vehicles/{id}
**Summary**: Eliminar un vehículo (Solo Admin)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /vehicles/serial/{serial}
**Summary**: Obtener detalle de un vehículo por los últimos 4 dígitos de su número de serie

**Parameters**:
- `serial` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Citas (Appointments)

### [POST] /appointments/public
**Summary**: Agendar una cita desde el portal público (Cliente)

**Parameters**:
- `x-branch-id` (header):  (Required)

**Request Body**:
```json
{
  "customerName": "string",
  "customerPhone": "string",
  "customerEmail": "string",
  "whatsappId": "string",
  "customerId": "string",
  "vehicle": null,
  "serviceRequested": "string",
  "scheduledAt": "string",
  "notes": "string",
  "duration": 0,
  "assignedMechanic": "string",
  "branchName": "string"
}
```

**Responses**:
- `201`: Cita agendada correctamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Cita agendada correctamente."
  }
  ```

---

### [GET] /appointments/public/status
**Summary**: Consultar el estado de una cita por Folio (ID), teléfono o placas

**Parameters**:
- `x-branch-id` (header):  (Required)
- `q` (query): ID de cita, teléfono de cliente o placas del vehículo (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /appointments/schedule
**Summary**: Obtener la configuración del horario semanal laboral

**Parameters**:
- `x-branch-id` (header):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /appointments/schedule
**Summary**: Actualizar la configuración del horario laboral (Solo Staff)

**Request Body**:
```json
{
  "schedules": [
    {
      "dayOfWeek": 0,
      "isWorking": true,
      "startTime": "string",
      "endTime": "string"
    }
  ]
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /appointments/holidays
**Summary**: Obtener el listado de días festivos / cierres especiales

**Parameters**:
- `x-branch-id` (header):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /appointments/holidays
**Summary**: Registrar un día no laboral / festivo (Solo Staff)

**Request Body**:
```json
{
  "date": "string",
  "description": "string"
}
```

**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /appointments/holidays/{id}
**Summary**: Remover un día no laboral / festivo (Solo Staff)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /appointments/occupied-slots
**Summary**: Obtener fechas festivas, días inactivos y horas ocupadas

**Parameters**:
- `x-branch-id` (header):  (Required)
- `startDate` (query):  (Required)
- `endDate` (query):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /appointments/timeline
**Summary**: Obtener citas detalladas para vista de timeline/cronograma

**Parameters**:
- `startDate` (query):  (Required)
- `endDate` (query):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /appointments
**Summary**: Registrar una cita desde panel administrativo (Admin / Seller)

**Request Body**:
```json
{
  "customerName": "string",
  "customerPhone": "string",
  "customerEmail": "string",
  "whatsappId": "string",
  "customerId": "string",
  "vehicle": null,
  "serviceRequested": "string",
  "scheduledAt": "string",
  "notes": "string",
  "duration": 0,
  "assignedMechanic": "string",
  "branchName": "string"
}
```

**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /appointments
**Summary**: Listar todas las citas con filtros opcionales

**Parameters**:
- `search` (query): Buscar por cliente, teléfono o placas 
- `status` (query): Filtrar por estado 
- `fromDate` (query): Filtrar desde fecha (YYYY-MM-DD) 
- `toDate` (query): Filtrar hasta fecha (YYYY-MM-DD) 

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /appointments/{id}
**Summary**: Obtener detalle de una cita por ID (Staff)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /appointments/{id}
**Summary**: Actualizar/aprobar/reprogramar una cita

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "customerName": "string",
  "customerPhone": "string",
  "customerEmail": "string",
  "whatsappId": "string",
  "customerId": "string",
  "vehicle": null,
  "serviceRequested": "string",
  "scheduledAt": "string",
  "status": "pending",
  "notes": "string",
  "duration": 0,
  "assignedMechanic": "string",
  "branchName": "string"
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /appointments/{id}
**Summary**: Eliminar una cita (Solo Admin)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /appointments/{id}/approve
**Summary**: Aprobar una cita enviando confirmación por WhatsApp

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "message": "string"
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /appointments/{id}/reject
**Summary**: Rechazar una cita enviando notificación por WhatsApp

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "message": "string"
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /appointments/{id}/reschedule
**Summary**: Reagendar una cita (manteniendo status pendiente) y enviando confirmación por WhatsApp

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "scheduledAt": "string",
  "duration": 0,
  "message": "string"
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Ordenes de Servicio / Mantenimiento

### [GET] /maintenance/track/public
**Summary**: Consultar el avance y fotos de mantenimiento por últimos 4 dígitos del número de serie o celular del cliente (Público)

**Parameters**:
- `x-branch-id` (header):  (Required)
- `q` (query):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /maintenance
**Summary**: Crear una orden de servicio/mantenimiento (Admin / Seller)

**Request Body**:
```json
{
  "customerId": "string",
  "vehicleId": "string",
  "laborCost": 0,
  "notes": "string",
  "appointmentId": "string"
}
```

**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /maintenance
**Summary**: Listar órdenes de mantenimiento con filtros

**Parameters**:
- `customerId` (query):  (Required)
- `status` (query):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /maintenance/{id}
**Summary**: Obtener detalle de una orden de mantenimiento por ID

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /maintenance/{id}
**Summary**: Actualizar estado o mano de obra de una orden

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "status": "awaiting_appointment",
  "laborCost": 0,
  "notes": "string"
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /maintenance/{id}
**Summary**: Eliminar una orden (Solo Admin - si no ha iniciado)

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /maintenance/{id}/items
**Summary**: Registrar refacción/insumo usado (Descuenta stock automáticamente)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "productId": "string",
  "quantity": 0
}
```

**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /maintenance/{id}/evidence
**Summary**: Subir evidencia fotográfica por etapa de mantenimiento (Máx. 5 fotos)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
**Responses**:
- `201`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Cotizaciones

### [POST] /quotes
**Summary**: Crear una nueva cotización

**Request Body**:
```json
{
  "customerId": "string",
  "items": [
    {
      "productId": "string",
      "quantity": 0,
      "discount": 0
    }
  ],
  "globalDiscount": 0,
  "validUntil": "string"
}
```

**Responses**:
- `201`: Cotización creada correctamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Cotización creada correctamente."
  }
  ```

---

### [GET] /quotes
**Summary**: Listar cotizaciones con filtros

**Parameters**:
- `customerId` (query): Filtrar por cliente ID 
- `status` (query): Filtrar por estado 

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /quotes/{id}
**Summary**: Obtener detalle de una cotización por ID

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /quotes/{id}
**Summary**: Actualizar una cotización (Siempre que no esté ya vendida)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "customerId": "string",
  "items": [
    {
      "productId": "string",
      "quantity": 0,
      "discount": 0
    }
  ],
  "globalDiscount": 0,
  "validUntil": "string",
  "status": "pending"
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Ventas (POS)

### [POST] /sales
**Summary**: Registrar una venta (Pago en efectivo o con tarjeta Mercado Pago Point)

**Request Body**:
```json
{
  "quoteId": "string",
  "customerId": "string",
  "items": [
    {
      "productId": "string",
      "quantity": 0,
      "discount": 0
    }
  ],
  "globalDiscount": 0,
  "paymentMethod": "cash",
  "paymentReference": "string"
}
```

**Responses**:
- `201`: Venta registrada exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Venta registrada exitosamente."
  }
  ```

---

### [GET] /sales
**Summary**: Listar todas las ventas

**Parameters**:
- `customerId` (query): Filtrar por ID del cliente 
- `isCancelled` (query): Filtrar por estado de cancelación 

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /sales/{id}/cancel
**Summary**: Cancelar/anular una venta y regresar stock al almacén (Solo Admin)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "reason": "string"
}
```

**Responses**:
- `200`: Venta cancelada y stock devuelto exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Venta cancelada y stock devuelto exitosamente."
  }
  ```

---

### [GET] /sales/{id}
**Summary**: Ver detalle completo de una venta por ID

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /sales/ticket/{query}
**Summary**: Obtener la información del ticket de venta por ID o Folio

**Parameters**:
- `query` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Reportes & Dashboard

### [GET] /reports/sales
**Summary**: Obtener resumen financiero de ventas por rango de fechas (Solo Admin)

**Parameters**:
- `startDate` (query): Fecha inicio (YYYY-MM-DD) (Required)
- `endDate` (query): Fecha fin (YYYY-MM-DD) (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /reports/top-products
**Summary**: Listar productos más vendidos por cantidad (Solo Admin)

**Parameters**:
- `startDate` (query):  (Required)
- `endDate` (query):  (Required)
- `limit` (query):  

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /reports/maintenance
**Summary**: Obtener resumen de órdenes de servicio por estatus

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /reports/appointments
**Summary**: Obtener resumen de citas agendadas por estatus

**Parameters**:
- `startDate` (query):  (Required)
- `endDate` (query):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Branches

### [GET] /branches/public
**Summary**: Obtener todas las sucursales (Público)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [POST] /branches
**Summary**: Crear una sucursal

**Request Body**:
```json
{
  "name": "string",
  "address": "string",
  "phone": "string",
  "isActive": true
}
```

**Responses**:
- `201`: Sucursal creada.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Sucursal creada."
  }
  ```

---

### [GET] /branches
**Summary**: Obtener todas las sucursales

**Parameters**:
- `isActive` (query):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [GET] /branches/{id}
**Summary**: Obtener una sucursal por ID

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [PATCH] /branches/{id}
**Summary**: Actualizar una sucursal

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "name": "string",
  "address": "string",
  "phone": "string",
  "isActive": true
}
```

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

### [DELETE] /branches/{id}
**Summary**: Eliminar una sucursal

**Parameters**:
- `id` (path):  (Required)

**Responses**:
- `200`: 
  ```json
  {
    "success": true,
    "data": null,
    "message": "Success"
  }
  ```

---

## Sistema y Utilidades

### [POST] /system/migration/branches
**Summary**: Migra todos los registros antiguos para asignarles la sucursal por defecto. Asigna esta sucursal a los usuarios administradores. Es idempotente.

**Responses**:
- `200`: Migración ejecutada exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Migración ejecutada exitosamente."
  }
  ```

---

