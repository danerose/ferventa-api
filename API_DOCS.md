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
  "name": "string",
  "username": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "roleId": "string",
  "branches": [
    "string"
  ]
}
```

**Responses**:
- `201`: Usuario creado exitosamente. Devuelve el usuario, contraseña temporal, mensaje de WhatsApp y whatsappUrl.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Usuario creado exitosamente. Devuelve el usuario, contraseña temporal, mensaje de WhatsApp y whatsappUrl."
  }
  ```
- `400`: Datos inválidos o correo/usuario ya registrado.

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
    "data": null,
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
**Summary**: Generar un nombre de usuario único basado en el nombre de la persona

**Parameters**:
- `name` (query): Nombre completo de la persona (Required)

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

### [GET] /users/check-username
**Summary**: Validar si un nombre de usuario ya existe o está disponible (por query param)

**Parameters**:
- `username` (query): Nombre de usuario a validar (Required)

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

### [POST] /users/migrate-usernames
**Summary**: Migrar usuarios existentes que no tengan un nombre de usuario asignado (Solo Admin)

**Responses**:
- `200`: Migración de nombres de usuario ejecutada exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Migración de nombres de usuario ejecutada exitosamente."
  }
  ```

---

### [GET] /users/check-username/{username}
**Summary**: Validar si un nombre de usuario ya existe o está disponible (por param de ruta)

**Parameters**:
- `username` (path):  (Required)

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

### [PATCH] /users/change-password
**Summary**: Actualizar la propia contraseña del usuario autenticado

**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Responses**:
- `200`: Contraseña actualizada exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Contraseña actualizada exitosamente."
  }
  ```
- `400`: Contraseña actual incorrecta o nueva contraseña inválida.

---

### [PATCH] /users/{id}/password
**Summary**: Actualizar o restablecer la contraseña de un usuario por su ID (Solo Admin)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "newPassword": "string"
}
```

**Responses**:
- `200`: Contraseña actualizada exitosamente. Devuelve el usuario, contraseña asignada, mensaje y enlace de WhatsApp.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Contraseña actualizada exitosamente. Devuelve el usuario, contraseña asignada, mensaje y enlace de WhatsApp."
  }
  ```
- `404`: Usuario no encontrado.

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
  "username": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "branches": [
    "string"
  ],
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
**Summary**: Iniciar sesión con correo y contraseña

**Request Body**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Responses**:
- `200`: Sesión iniciada correctamente, tokens retornados.
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1...",
      "refreshToken": "eyJhbGciOiJIUzI1...",
      "user": {
        "id": "6a4e9cefd...",
        "name": "Administrador Inicial",
        "email": "admin@ferventa.com",
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

### [PATCH] /auth/change-password
**Summary**: Actualizar la propia contraseña del usuario autenticado

**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Responses**:
- `200`: Contraseña actualizada exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Contraseña actualizada exitosamente."
  }
  ```
- `400`: Contraseña actual incorrecta o nueva contraseña inválida.

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
      "lastLoginAt": "2026-09-09T19:05:06.821Z"
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
**Summary**: Listar todas las marcas paginadas con filtro opcional de búsqueda

**Parameters**:
- `search` (query): Búsqueda por nombre 
- `q` (query): Alias para término de búsqueda 
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `categoryId` (query): Filtrar por ID de Categoría 
- `brandId` (query): Filtrar por ID de Marca 
- `isActive` (query): Filtrar por estado activo 

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

### [GET] /inventory/brands/search
**Summary**: Buscar marcas por nombre

**Parameters**:
- `q` (query): Término de búsqueda por nombre (Required)
- `search` (query):  (Required)
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `categoryId` (query): Filtrar por ID de Categoría 
- `brandId` (query): Filtrar por ID de Marca 
- `isActive` (query): Filtrar por estado activo 

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
**Summary**: Listar todas las categorías paginadas con filtro opcional de búsqueda

**Parameters**:
- `search` (query): Búsqueda por nombre 
- `q` (query): Alias para término de búsqueda 
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `categoryId` (query): Filtrar por ID de Categoría 
- `brandId` (query): Filtrar por ID de Marca 
- `isActive` (query): Filtrar por estado activo 

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

### [GET] /inventory/categories/search
**Summary**: Buscar categorías por nombre

**Parameters**:
- `q` (query): Término de búsqueda por nombre (Required)
- `search` (query):  (Required)
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `categoryId` (query): Filtrar por ID de Categoría 
- `brandId` (query): Filtrar por ID de Marca 
- `isActive` (query): Filtrar por estado activo 

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
**Summary**: Listar todos los proveedores paginados con filtro opcional de búsqueda

**Parameters**:
- `search` (query): Búsqueda por nombre o código 
- `q` (query): Alias para término de búsqueda 
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `categoryId` (query): Filtrar por ID de Categoría 
- `brandId` (query): Filtrar por ID de Marca 
- `isActive` (query): Filtrar por estado activo 

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

### [GET] /inventory/providers/search
**Summary**: Buscar proveedores por nombre o código

**Parameters**:
- `q` (query): Término de búsqueda por nombre o código (Required)
- `search` (query):  (Required)
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `categoryId` (query): Filtrar por ID de Categoría 
- `brandId` (query): Filtrar por ID de Marca 
- `isActive` (query): Filtrar por estado activo 

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
**Summary**: Listar autopartes con filtros opcionales y paginación

**Parameters**:
- `search` (query): Buscar por nombre, SKU o compatibilidad 
- `q` (query): Alias para término de búsqueda 
- `categoryId` (query): Filtrar por categoría ID 
- `brandId` (query): Filtrar por marca ID 
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `isActive` (query): Filtrar por estado activo 

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

### [GET] /inventory/products/search
**Summary**: Buscar productos por SKU, nombre o compatibilidad

**Parameters**:
- `q` (query): Término de búsqueda (Required)
- `search` (query):  (Required)
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `categoryId` (query): Filtrar por ID de Categoría 
- `brandId` (query): Filtrar por ID de Marca 
- `isActive` (query): Filtrar por estado activo 

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
**Summary**: Obtener detalle de un producto por SKU exacto

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

### [POST] /inventory/movements
**Summary**: Registrar movimiento de stock manual (Admin / Warehouse)

**Request Body**:
```json
{
  "productId": "string",
  "providerId": "string",
  "type": "in",
  "quantity": 0,
  "reason": "string",
  "branchId": "string"
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

### [DELETE] /inventory/movements/{id}
**Summary**: Eliminar o revertir un movimiento de stock (Admin / Warehouse)

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
  "receptionNotes": "string",
  "duration": 0,
  "assignedMechanic": "string",
  "branchName": "string",
  "status": "pending"
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
  "receptionNotes": "string",
  "duration": 0,
  "assignedMechanic": "string",
  "branchName": "string",
  "status": "pending"
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
  "receptionNotes": "string",
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

### [PATCH] /appointments/{id}/check-in
**Summary**: Recibir vehículo para una cita agendada (Check-in rápido en sucursal con notas de recepción)

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

### [PATCH] /appointments/{id}/no-show
**Summary**: Marcar cita como No Asistió (No-show)

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

### [POST] /maintenance/direct-reception
**Summary**: Recepción directa de vehículo sin cita previa (Walk-in / Mostrador)

**Request Body**:
```json
{
  "customerName": "string",
  "customerPhone": "string",
  "customerEmail": "string",
  "whatsappId": "string",
  "customerId": "string",
  "vehicleId": "string",
  "vehicle": null,
  "serviceRequested": "string",
  "notes": "string",
  "laborCost": 0,
  "assignedMechanic": "string"
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

### [POST] /maintenance
**Summary**: Crear una orden de servicio/mantenimiento (Admin / Seller)

**Request Body**:
```json
{
  "customerId": "string",
  "vehicleId": "string",
  "laborCost": 0,
  "notes": "string",
  "appointmentId": "string",
  "receptionNotes": "string",
  "assignedMechanic": "string",
  "saleId": "string"
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
**Summary**: Listar órdenes de mantenimiento con filtros avanzados de estado, fechas y vistas

**Parameters**:
- `customerId` (query):  (Required)
- `status` (query):  (Required)
- `scope` (query):  (Required)
- `from` (query):  (Required)
- `to` (query):  (Required)
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
  "notes": "string",
  "receptionNotes": "string",
  "assignedMechanic": "string",
  "saleId": {}
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

### [PATCH] /maintenance/{id}/notify
**Summary**: Registrar que se notificó al cliente que su vehículo está listo

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

### [PATCH] /maintenance/{id}/link-sale
**Summary**: Vincular un ticket de compra / venta POS a la orden de mantenimiento

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "saleId": "string",
  "folio": "string"
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

### [PATCH] /maintenance/{id}/unlink-sale
**Summary**: Desvincular el ticket de compra / venta POS de la orden de mantenimiento

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

### [POST] /maintenance/{id}/notes
**Summary**: Agregar nota de diagnóstico/falla detectada durante el servicio

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "note": "string"
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
      "type": "product",
      "productId": "string",
      "serviceId": "string",
      "name": "string",
      "quantity": 0,
      "unitPrice": 0,
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
- `hasService` (query): Filtrar por si incluye servicios 
- `paymentMethod` (query): Filtrar por método de pago 
- `startDate` (query): Fecha inicio (YYYY-MM-DD) en zona local del cliente 
- `endDate` (query): Fecha fin (YYYY-MM-DD) en zona local del cliente 
- `utcOffsetMinutes` (query): Offset UTC del cliente en minutos (ej: 300 para UTC-5). Equivale a Date.getTimezoneOffset() 

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

### [GET] /sales/stats
**Summary**: Obtener estadísticas y métricas del dashboard de ventas (ingresos, ticket promedio, métodos de pago, gráficas y servicios vs productos)

**Parameters**:
- `startDate` (query): Fecha de inicio (YYYY-MM-DD) en la zona horaria del cliente 
- `endDate` (query): Fecha de fin (YYYY-MM-DD) en la zona horaria del cliente 
- `utcOffsetMinutes` (query): Offset UTC en minutos (ej: 300 para UTC-5 / América). Equivale a new Date().getTimezoneOffset() 
- `isCancelled` (query): Filtrar por estatus de cancelación (true, false o only_active) 
- `paymentMethod` (query): Filtrar por método de pago específico 
- `customerId` (query): Filtrar por cliente específico 
- `branchId` (query): ID de la sucursal (por defecto se toma del header x-branch-id) 

**Responses**:
- `200`: Métricas del dashboard obtenidas exitosamente.
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "totalRevenue": 5328764604,
        "totalSales": 29,
        "averageTicket": 183750503.59,
        "subtotal": 5328764604,
        "discount": 0,
        "mainPaymentMethod": "cash",
        "mainPaymentMethodLabel": "Efectivo"
      },
      "paymentMethods": {
        "cash": {
          "revenue": 3916709859,
          "count": 17,
          "percentage": 73.5,
          "label": "Efectivo"
        },
        "card": {
          "revenue": 257094091,
          "count": 6,
          "percentage": 4.8,
          "label": "Tarjeta"
        },
        "transfer": {
          "revenue": 1154960654,
          "count": 6,
          "percentage": 21.7,
          "label": "Transferencia"
        }
      },
      "dailyRevenue": [
        {
          "date": "2026-09-03",
          "label": "jue",
          "revenue": 0,
          "count": 0
        },
        {
          "date": "2026-09-04",
          "label": "vie",
          "revenue": 0,
          "count": 0
        },
        {
          "date": "2026-09-05",
          "label": "sáb",
          "revenue": 120000,
          "count": 1
        },
        {
          "date": "2026-09-06",
          "label": "dom",
          "revenue": 0,
          "count": 0
        },
        {
          "date": "2026-09-07",
          "label": "lun",
          "revenue": 0,
          "count": 0
        },
        {
          "date": "2026-09-08",
          "label": "mar",
          "revenue": 0,
          "count": 0
        },
        {
          "date": "2026-09-09",
          "label": "mié",
          "revenue": 5052932.8,
          "count": 28
        }
      ],
      "monthlyTrend": [
        {
          "month": "2026-04",
          "label": "abr",
          "revenue": 0,
          "count": 0
        },
        {
          "month": "2026-05",
          "label": "may",
          "revenue": 0,
          "count": 0
        },
        {
          "month": "2026-06",
          "label": "jun",
          "revenue": 0,
          "count": 0
        },
        {
          "month": "2026-07",
          "label": "jul",
          "revenue": 0,
          "count": 0
        },
        {
          "month": "2026-08",
          "label": "ago",
          "revenue": 0,
          "count": 0
        },
        {
          "month": "2026-09",
          "label": "sep",
          "revenue": 5328764604,
          "count": 29
        }
      ],
      "itemTypesBreakdown": {
        "services": {
          "revenue": 1500000000,
          "itemsCount": 12,
          "salesCount": 10,
          "revenuePercentage": 28.1
        },
        "products": {
          "revenue": 3828764604,
          "itemsCount": 45,
          "salesCount": 22,
          "revenuePercentage": 71.9
        }
      }
    },
    "message": "Métricas del dashboard obtenidas exitosamente."
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

## Servicios Predefinidos

### [POST] /services
**Summary**: No summary

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "basePrice": 0,
  "isActive": true,
  "supplies": [
    {
      "productId": "string",
      "quantity": 0
    }
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

### [GET] /services
**Summary**: Listar todos los servicios predefinidos paginados

**Parameters**:
- `isActive` (query):  
- `search` (query): Búsqueda por nombre de servicio 
- `q` (query): Alias para término de búsqueda 
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `categoryId` (query): Filtrar por ID de Categoría 
- `brandId` (query): Filtrar por ID de Marca 

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

### [GET] /services/search
**Summary**: Buscar servicios por nombre

**Parameters**:
- `q` (query): Término de búsqueda por nombre (Required)
- `isActive` (query):  
- `page` (query): Número de página 
- `limit` (query): Cantidad de elementos por página 
- `search` (query): Término de búsqueda 
- `categoryId` (query): Filtrar por ID de Categoría 
- `brandId` (query): Filtrar por ID de Marca 

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

### [GET] /services/{id}
**Summary**: No summary

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

### [PATCH] /services/{id}
**Summary**: No summary

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "basePrice": 0,
  "isActive": true,
  "supplies": [
    {
      "productId": "string",
      "quantity": 0
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

### [DELETE] /services/{id}
**Summary**: No summary

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

### [GET] /reports/maintenance-metrics
**Summary**: Obtener métricas de tiempos, promedios de estancia y vehículos pendientes de recolección

**Parameters**:
- `startDate` (query):  
- `endDate` (query):  

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

### [GET] /branches/user
**Summary**: Obtener las sucursales asignadas al usuario autenticado

**Parameters**:
- `isActive` (query):  (Required)

**Responses**:
- `200`: Sucursales del usuario retornadas con éxito.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Sucursales del usuario retornadas con éxito."
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

### [POST] /system/migration/usernames
**Summary**: Migra los usuarios existentes que no tengan un nombre de usuario asignado. Genera un usuario único basado en su nombre.

**Responses**:
- `200`: Migración de nombres de usuario ejecutada exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Migración de nombres de usuario ejecutada exitosamente."
  }
  ```

---

## Asistencia & Control de Horarios

### [POST] /attendance/clock-in
**Summary**: Registrar entrada (Clock In) para el turno del usuario

**Parameters**:
- `x-branch-id` (header): ID de la sucursal activa (Required)

**Request Body**:
```json
{
  "note": "string",
  "userId": "string"
}
```

**Responses**:
- `201`: Entrada registrada exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Entrada registrada exitosamente."
  }
  ```

---

### [POST] /attendance/clock-out
**Summary**: Registrar salida (Clock Out) del turno del usuario

**Request Body**:
```json
{
  "note": "string",
  "userId": "string"
}
```

**Responses**:
- `200`: Salida registrada exitosamente.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Salida registrada exitosamente."
  }
  ```

---

### [POST] /attendance/break/start
**Summary**: Iniciar descanso / hora de comida durante el turno

**Request Body**:
```json
{
  "note": "string",
  "userId": "string"
}
```

**Responses**:
- `200`: Inicio de descanso registrado.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Inicio de descanso registrado."
  }
  ```

---

### [POST] /attendance/break/end
**Summary**: Finalizar descanso / hora de comida actual

**Responses**:
- `200`: Fin de descanso registrado.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Fin de descanso registrado."
  }
  ```

---

### [GET] /attendance/today
**Summary**: Obtener el estado de asistencia actual del usuario o sucursal para hoy

**Parameters**:
- `userId` (query): Filtrar por usuario específico 
- `branchId` (query): Filtrar por sucursal para obtener el estado de todos sus empleados 

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

### [GET] /attendance/branch/today
**Summary**: Obtener el estado de asistencia de todos los usuarios asignados a una sucursal para hoy

**Parameters**:
- `branchId` (query): ID de la sucursal (opcional si se envía el header x-branch-id) 
- `x-branch-id` (header): ID de la sucursal activa (Required)

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

### [GET] /attendance/my-records
**Summary**: Obtener mi historial de registros de asistencia

**Parameters**:
- `startDate` (query):  
- `endDate` (query):  

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

### [GET] /attendance/admin/records
**Summary**: Listar todos los registros de asistencia con filtros (Solo Admin)

**Parameters**:
- `branchId` (query): ID de la sucursal a filtrar 
- `userId` (query): ID del usuario a filtrar 
- `startDate` (query): Fecha inicio (YYYY-MM-DD) 
- `endDate` (query): Fecha fin (YYYY-MM-DD) 
- `status` (query): Estatus del registro 

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

### [GET] /attendance/admin/summary
**Summary**: Obtener resumen de horas trabajadas (semanal, quincenal, mensual) (Solo Admin)

**Parameters**:
- `branchId` (query): ID de la sucursal a filtrar 
- `period` (query): Período del resumen 
- `startDate` (query): Fecha inicio en caso de period=custom (YYYY-MM-DD) 
- `endDate` (query): Fecha fin en caso de period=custom (YYYY-MM-DD) 

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

### [GET] /attendance/admin/user-breakdown/{userId}
**Summary**: Obtener desglose detallado de asistencia y descansos para un usuario (Solo Admin)

**Parameters**:
- `userId` (path):  (Required)
- `startDate` (query):  
- `endDate` (query):  

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

### [PATCH] /attendance/admin/{id}
**Summary**: Modificar/Ajustar manualmente un registro de asistencia (Solo Admin)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "clockIn": "string",
  "clockOut": "string",
  "adminNotes": "string"
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

## Pedidos Especiales (Orders)

### [POST] /orders
**Summary**: Levantar un nuevo pedido especial con anticipo mínimo del 50%

**Request Body**:
```json
{
  "customerId": "string",
  "customerName": "string",
  "customerPhone": "string",
  "customerEmail": "string",
  "itemDescription": "string",
  "costPrice": 0,
  "sellingPrice": 0,
  "advancePayment": 0,
  "paymentMethod": "cash",
  "paymentReference": "string",
  "notes": "string",
  "estimatedArrivalDate": "string"
}
```

**Responses**:
- `201`: Pedido creado exitosamente con anticipo registrado.
  ```json
  {
    "success": true,
    "data": null,
    "message": "Pedido creado exitosamente con anticipo registrado."
  }
  ```

---

### [GET] /orders
**Summary**: Listar todos los pedidos con filtros

**Parameters**:
- `search` (query): Buscar por folio, cliente, teléfono o descripción de pieza 
- `status` (query): Filtrar por estado 
- `isFullyPaid` (query): Filtrar si está liquidado (true/false) 
- `startDate` (query): Fecha inicio (YYYY-MM-DD) 
- `endDate` (query): Fecha fin (YYYY-MM-DD) 

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

### [GET] /orders/summary
**Summary**: Obtener métricas y resumen de pedidos por estatus y saldos pendientes

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

### [GET] /orders/{id}
**Summary**: Obtener detalle de un pedido por ID

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

### [PATCH] /orders/{id}
**Summary**: Actualizar datos generales o precios del pedido

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "itemDescription": "string",
  "costPrice": 0,
  "sellingPrice": 0,
  "notes": "string",
  "estimatedArrivalDate": "string"
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

### [PATCH] /orders/{id}/status
**Summary**: Actualizar el estado del pedido (Pedido Levantado -> Pedido -> En tránsito -> En Sucursal -> Pendiente de entrega -> Entregado)

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "status": "order_placed",
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

### [POST] /orders/{id}/payments
**Summary**: Registrar un abono o liquidación al saldo del pedido

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "amount": 0,
  "paymentMethod": "cash",
  "paymentReference": "string",
  "notes": "string"
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

### [PATCH] /orders/{id}/cancel
**Summary**: Cancelar un pedido especificando el motivo

**Parameters**:
- `id` (path):  (Required)

**Request Body**:
```json
{
  "reason": "string"
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

