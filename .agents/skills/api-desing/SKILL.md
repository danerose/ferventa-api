# Prompt para agente de desarrollo — API de Punto de Venta para Taller de Autopartes

## Contexto del proyecto

Necesito que construyas una API REST con **NestJS + MongoDB (Mongoose)** para un sistema de Punto de Venta (POS) enfocado en un **taller mecánico / venta de autopartes**. No es un POS genérico de abarrotes: debe manejar inventario de refacciones, cotizaciones, órdenes de servicio/mantenimiento con seguimiento de status, y agendado de citas.

El objetivo final es tener una API robusta, documentada, y con buenas prácticas de seguridad, que después conectaré a un frontend y a un bot de WhatsApp.

---

## Stack técnico obligatorio

- **Backend:** NestJS (TypeScript), arquitectura modular (un módulo por dominio).
- **Base de datos:** MongoDB con Mongoose.
- **Auth:** JWT (access token + refresh token).
- **Validación:** class-validator / class-transformer en todos los DTOs.
- **Documentación:** Swagger (OpenAPI) autogenerado a partir de decoradores, más un mecanismo para exportar/actualizar un archivo `CHANGELOG.md` o `API_DOCS.md` cada vez que se agregue o modifique un endpoint (ver sección de documentación abajo).
- **Variables de entorno:** `.env` con `@nestjs/config`, nunca credenciales hardcodeadas.

---

## Módulos y entidades principales

### 1. Auth & Users
- Entidad `User` con campos: nombre, email, password (hasheado con bcrypt/argon2), rol, estado (activo/inactivo), fecha de creación, último login.
- Roles iniciales (valores en inglés, ver sección de convenciones de datos más abajo): `admin`, `seller`, `warehouse`. Diseña el sistema de roles como un enum o colección aparte para que yo pueda agregar roles nuevos sin tocar lógica de negocio (RBAC extensible, no hardcodeado por strings sueltos regados en el código).
- **Endpoints:**
  - `POST /auth/signup` (registro con email + password)
  - `POST /auth/login` (retorna access token + refresh token)
  - `POST /auth/refresh` (renueva access token usando refresh token)
  - `POST /auth/logout` (invalida la sesión actual)
  - `GET /auth/me` (perfil del usuario autenticado)
- Diseña el módulo de auth pensando en que **a futuro agregaré más estrategias** (Google, magic link, etc.) — usa Passport con strategies desacopladas, no amarres todo a "email+password" a nivel de arquitectura.

### 2. Sesiones y auditoría de acceso
- Colección `Session` (o `LoginHistory`) que registre: usuario, IP, user-agent/dispositivo, fecha/hora de login, fecha de expiración/logout, y si fue exitoso o fallido (para poder detectar intentos de fuerza bruta).
- Endpoint para que el usuario (o un admin) pueda ver sus sesiones activas y **revocar una sesión específica** (invalidar ese refresh token).

### 3. CRUD de usuarios (gestión, solo admin)
- `GET/POST/PATCH/DELETE /users` — alta, baja (soft delete), edición y listado de usuarios, con filtro por rol y estado.
- Endpoint para cambiar rol y para forzar reseteo de contraseña.

### 4. Inventario
- Entidades: `Producto` (autoparte/insumo), `Marca`, `Proveedor`, `Categoria`.
- `Producto` debe incluir: SKU, nombre, descripción, marca, categoría, proveedor, precio de costo, precio de venta, stock actual, stock mínimo (para alertas), unidad, fotos, y aplicabilidad (ej. modelo de auto/moto compatible, si aplica).
- CRUD completo para cada entidad.
- Endpoint de **movimientos de inventario** (entradas/salidas manuales, ajustes), con historial por producto (quién, cuándo, cuánto, motivo).

### 5. Citas (appointments)
- Entidad `Cita`: cliente (nombre, teléfono, referencia a WhatsApp si aplica), vehículo (marca, modelo, año, placas), servicio solicitado, fecha/hora propuesta, status (`pending`, `approved`, `rejected`, `cancelled`, `completed`), notas.
- **CRUD admin/staff:** listar, aprobar, rechazar, reprogramar citas.
- **Panel público/cliente:** endpoint para que el cliente agende una cita (sin necesidad de cuenta de staff — piensa si esto requiere un modelo `Cliente` ligero o autenticación simplificada) y endpoint para consultar el status de su cita/mantenimiento (por folio o teléfono, por ejemplo).
- Deja el modelo preparado para que después se pueda alimentar desde un webhook de WhatsApp (no lo implementes ahora, solo que la estructura no lo bloquee).

### 6. Órdenes de servicio / Mantenimientos
- Entidad `Mantenimiento` u `OrdenServicio`: vinculada a cliente y vehículo, lista de refacciones/insumos usados (con referencia a `Producto` y descuento automático de stock), mano de obra, status (`not_started`, `in_progress`, `completed`, `delivered`), evidencia fotográfica (subida de imágenes) por etapa.
- Endpoint para cambiar status y para subir fotos como evidencia (piensa en almacenamiento: local temporal + preparado para mover a S3/Cloud Storage después).
- Vista para el cliente donde solo vea el status y las fotos de **su** mantenimiento (sin exponer datos de otros clientes).

### 7. Cotizaciones
- Entidad `Cotizacion`: cliente, lista de productos/servicios con precios tomados del inventario actual, subtotal, descuentos, total, vigencia, status (`pending`, `accepted`, `rejected`, `converted_to_sale`).
- Endpoint para generar cotización a partir del inventario (autocálculo de precios) y endpoint para convertir una cotización aceptada en una venta.

### 8. Ventas (punto de venta)
- Entidad `Venta`: productos vendidos (con descuento de stock automático y validación de que haya suficiente stock), descuentos (por producto o globales), método de pago, referencia a cotización origen (si aplica), vendedor que la realizó, totales, folio.
- **Importante — snapshot de datos al momento de la venta:** el ticket de una venta es un documento histórico e inmutable. Cada línea de producto dentro de la `Venta` debe guardar una **copia (snapshot)** de los datos relevantes en ese momento (SKU, nombre, precio unitario de venta, descuento aplicado), y no solo un `ObjectId` de referencia al producto. Esto es porque si mañana cambio el precio del producto en el inventario, un ticket viejo **no debe cambiar** — debe seguir mostrando el precio al que realmente se vendió.
  - Puedes mantener también la referencia (`ObjectId`) al producto para trazabilidad/reportes (ej. "cuánto he vendido de este producto en total"), pero el precio y demás datos mostrados en el ticket siempre deben salir del snapshot guardado en la venta, nunca de una consulta en vivo al catálogo.
  - Esta misma lógica de snapshot aplica a `Cotizacion` (ya mencionado arriba) y a los productos/insumos usados dentro de `Mantenimiento`/`OrdenServicio`.
- Métodos de pago: efectivo, tarjeta. Para tarjeta, integra el **SDK/API de Mercado Pago Point** (terminal física) para procesar el cobro y quedar preparado para webhooks de confirmación de pago.
- Endpoint para cancelar/anular una venta (con reversa de stock) y para reimprimir/consultar el ticket.

### 9. Dashboard / Reportes
- Endpoints agregados para: ventas por rango de fecha, entradas/salidas de inventario, dinero total recibido (por método de pago), top productos vendidos, mantenimientos por status, citas por status.
- Piensa estos endpoints para que regresen datos ya agregados (no que el frontend tenga que procesar arrays gigantes).

### 10. Vistas adicionales que probablemente te falten (agrégalas)
- Endpoint de **clientes** como entidad propia (no solo texto libre dentro de citas/ventas), para poder tener historial completo por cliente.
- Endpoint de **vehículos** ligado a cliente (un cliente puede tener varios autos/motos).
- Notificaciones internas o log de actividad (quién hizo qué y cuándo, a nivel sistema, no solo login).
- Endpoint de salud (`/health`) para monitoreo.

---

## Convenciones de datos e internacionalización (i18n)

### Valores internos en inglés
- Todo valor que sea un **enum / valor de sistema** (roles, status, métodos de pago, etc.) debe almacenarse y viajar en la API **en inglés**, sin importar el idioma del cliente. El frontend es responsable de traducirlos para mostrarlos al usuario final.
- Ejemplos de esto:
  - Roles: `admin`, `seller`, `warehouse` (en vez de "vendedor", "almacenista").
  - Status de citas: `pending`, `approved`, `rejected`, `cancelled`, `completed`.
  - Status de mantenimiento: `not_started`, `in_progress`, `completed`, `delivered`.
  - Status de cotización: `pending`, `accepted`, `rejected`, `converted_to_sale`.
  - Métodos de pago: `cash`, `card`.
- Define estos enums de forma centralizada (ej. un archivo `constants/enums.ts` por módulo o uno global), nunca como strings sueltos repetidos en cada DTO/servicio.
- Los **mensajes de error y de éxito** (los que sí ve el usuario final) son la única parte que se traduce dinámicamente — ver siguiente sección.

### Idioma de la respuesta (mensajes de error/éxito)
- La API debe leer el idioma deseado desde el **header `Accept-Language`** (o un header custom como `X-Lang` si prefieres algo más explícito — decide uno y sé consistente) en cada request.
- Idiomas soportados iniciales: `es` y `en`, con `es` como fallback si no se envía el header o el idioma no está soportado.
- Implementa esto con el módulo de i18n de NestJS (`nestjs-i18n`) o un servicio propio de traducción de mensajes, centralizado — nunca strings de error hardcodeados dentro de cada controller/service.
- Todos los mensajes (errores de validación, errores de negocio, mensajes de éxito) deben salir de este diccionario central, para poder agregar idiomas después sin tocar lógica de negocio.

### Formato de respuesta normalizado
Toda respuesta de la API (éxito o error) debe seguir esta misma forma, sin excepciones:

```json
{
  "success": true,
  "data": {},
  "message": "Mensaje traducido según el idioma recibido"
}
```

- `success`: booleano, `true` si la operación se completó correctamente, `false` en caso de error.
- `data`: el resultado de la operación (objeto, arreglo, o `null`/`{}` si no aplica). En errores, normalmente `null` o `{}`.
- `message`: texto en el idioma solicitado por el cliente (vía `Accept-Language`), ya sea el mensaje de éxito o la descripción del error.
- Implementa esto con un **interceptor global** (para respuestas exitosas) y un **exception filter global** (para errores), de modo que ningún endpoint tenga que armar este objeto manualmente — se aplica de forma transversal a toda la API.
- Los códigos de estado HTTP (200, 201, 400, 401, 403, 404, 409, 500, etc.) se mantienen igual que siempre; el formato normalizado va **dentro** del body, no lo sustituye.

---

## Diseño de base de datos — el agente es el responsable

Tú (el agente) serás el **orquestador y responsable del diseño de la base de datos**. Yo te di las entidades a alto nivel (Usuario, Producto, Cita, Mantenimiento, Venta, Cotización, Cliente, Vehículo, etc.), pero el diseño detallado de esquemas, relaciones y estructura de documentos en MongoDB corre por tu cuenta. Esto incluye:

- Definir qué colecciones existen y qué campos exactos tiene cada una (tipos, requeridos vs opcionales, índices).
- Decidir, para cada relación, si conviene **referenciar** (`ObjectId` + populate) o **embeber** el documento, justificando la decisión según el patrón de acceso (ej. un `Mantenimiento` probablemente referencia `Cliente` y `Vehículo`, pero puede embeber snapshots de los productos usados para no perder el precio histórico aunque el producto cambie de precio después).
- Definir los **índices** necesarios (únicos, compuestos, de texto si aplica) para las consultas más frecuentes (búsqueda de producto por SKU, citas por fecha, ventas por rango de fecha, etc.).
- Prevenir inconsistencias de datos: por ejemplo, que una venta no pueda dejar el stock en negativo, que una cotización congele los precios al momento de generarse aunque el inventario cambie después, etc.
- Antes de escribir los schemas de Mongoose, preséntame el diseño propuesto (colecciones, campos clave, relaciones y la justificación de referenciar vs embeber) como parte del punto 1 de "Cómo quiero que trabajes" — es decir, esto va dentro de la propuesta inicial de estructura que debo confirmar antes de que empieces a codear.
- Documenta este diseño de datos también en `API_DOCS.md` (o en un archivo separado `DATA_MODEL.md`) para que quede como referencia para otros agentes después.

---

## Seguridad — requisitos explícitos

- Passwords con **bcrypt o argon2**, nunca en texto plano ni en logs.
- JWT: access token de corta duración (ej. 15 min) + refresh token de mayor duración (ej. 7 días), refresh tokens almacenados hasheados en base de datos y revocables.
- **Guards** en todas las rutas protegidas (`JwtAuthGuard`) + **guard de roles** (`RolesGuard`) por endpoint según el módulo (ej. solo `admin` puede hacer CRUD de usuarios).
- Rate limiting (ej. `@nestjs/throttler`) especialmente en `/auth/login` y `/auth/signup` para mitigar fuerza bruta.
- Validación estricta de DTOs en cada endpoint (whitelist + forbidNonWhitelisted en el ValidationPipe global).
- Helmet, CORS configurado explícitamente (no `*` en producción), y sanitización de inputs.
- Manejo de errores centralizado (exception filters) que no filtre stack traces ni detalles internos en producción.
- Registro (log) de intentos de login fallidos y de acciones sensibles (cambios de rol, eliminación de usuarios, cancelación de ventas).

---

## Documentación automática

- Configura **Swagger** (`@nestjs/swagger`) con decoradores completos (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, DTOs documentados) en cada endpoint desde el inicio, no como paso final.
- Además del Swagger interactivo, mantén un archivo **`API_DOCS.md`** en la raíz del proyecto que se actualice (manual o semi-automáticamente vía script) cada vez que se agregue/modifique un endpoint, con: método, ruta, roles permitidos, request/response de ejemplo, y notas relevantes. Esto lo usaré después como contexto para otros agentes, así que debe quedar en formato claro y consistente (una sección por módulo).

---

## Cómo quiero que trabajes

1. Antes de escribir código, propón la estructura de carpetas/módulos completa y espera mi confirmación.
2. Ve construyendo módulo por módulo (empezando por Auth + Users + Sesiones, luego Inventario, luego Citas/Mantenimientos, luego Ventas/Cotizaciones, y al final Dashboard).
3. Cada vez que termines un módulo, actualiza `API_DOCS.md` con los endpoints nuevos.
4. Si algo de lo que pido es ambiguo o te falta un dato (ej. estructura exacta de un campo), no asumas en silencio: dime tu suposición explícitamente antes de seguir.
5. No implementes lógica de WhatsApp todavía, solo deja los modelos preparados para no tener que rediseñarlos después.