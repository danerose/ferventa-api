# 📋 Guía de Implementación Frontend: Flujo de Recepción de Vehículos (Walk-in & Citas)

## 📌 1. Diagnóstico del Problema Actual

### ¿Por qué el cliente encontraba el proceso confuso y cansado?
1. **Diseño enfocado únicamente en citas remotas:** El flujo original fue diseñado para que el cliente final agendara desde la web con anticipación. Al crearse una cita, entra en estado `pending` y genera una orden de mantenimiento en "limbo" (`awaiting_appointment`).
2. **La realidad del taller (Llegadas directas / Walk-ins):** La mayoría de los clientes llegan con su vehículo directamente a la sucursal sin previa cita.
3. **El dolor del asesor:** Para ingresar el auto, el asesor tenía que:
   - Entrar al formulario de citas e inventar una hora (sufriendo posibles bloqueos por horario laboral o traslapes).
   - Crear la cita (se creaba en `pending`).
   - Salir a la lista de citas y dar clic en "Aprobar" (lo que disparaba un mensaje de WhatsApp redundante al cliente que ya estaba frente a él).
   - Cambiar la cita a `completed` para que la orden de mantenimiento se descongelara a `not_started`.

---

## 🚀 2. Mejoras Implementadas en la API

La API de Ferventa ya está 100% optimizada para resolver esta situación con endpoints directos:

### 🟢 Endpoint A: Recepción Directa en Taller (Walk-in)
> **Resuelve:** Cuando el cliente llega a sucursal manejando y entrega las llaves sin haber agendado previamente. **Todo en una sola petición.**

- **Método y Ruta:** `POST /api/maintenance/direct-reception`
- **Permisos:** `admin`, `seller`
- **Headers:**
  - `Authorization: Bearer <TOKEN>`
  - `x-branch-id: <BRANCH_ID>`
- **¿Qué hace el backend automáticamente?**
  1. Busca al cliente por teléfono o lo crea en automático si es nuevo.
  2. Busca el auto por sus últimos 4 dígitos de serie o lo registra vinculado al cliente.
  3. Registra la visita en el historial de citas ya como `completed` (para métricas y cronograma).
  4. Crea la **Orden de Mantenimiento** directamente en estado `not_started` (activa de inmediato).
  5. Devuelve la orden con el cliente y vehículo poblados.

#### Request Body:
```json
{
  "customerName": "Carlos Sánchez",
  "customerPhone": "8119876543",
  "customerEmail": "carlos@example.com",     // Opcional
  "whatsappId": "whatsapp_carlos",           // Opcional
  "vehicle": {
    "brand": "Ford",
    "model": "Fiesta",
    "year": 2018,
    "serialNumberLastFour": "1234",          // Placas o últimos 4 del VIN
    "color": "Rojo"                          // Opcional
  },
  "serviceRequested": "Revisión de frenos y cambio de balatas",
  "notes": "Cliente menciona rechinido al frenar a baja velocidad", // Opcional
  "laborCost": 450,                          // Opcional (Default: 0)
  "assignedMechanic": "Roberto Sánchez"      // Opcional
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "66d790123abcde0012345678",
    "status": "not_started",
    "laborCost": 450,
    "notes": "Cliente menciona rechinido al frenar a baja velocidad",
    "customer": {
      "_id": "66d790123abcde0012345679",
      "name": "Carlos Sánchez",
      "phone": "8119876543"
    },
    "vehicle": {
      "_id": "66d790123abcde001234567a",
      "brand": "Ford",
      "model": "Fiesta",
      "year": 2018,
      "serialNumberLastFour": "1234"
    },
    "appointment": "66d790123abcde001234567b",
    "createdAt": "2026-09-03T21:00:00.000Z"
  },
  "message": "Success"
}
```

---

### 🟢 Endpoint B: "Recibir Vehículo" (Check-in de Cita Previa)
> **Resuelve:** Cuando el cliente **SÍ agendó previamente** por la web/WhatsApp y se presenta a su cita en sucursal.

- **Método y Ruta:** `PATCH /api/appointments/:id/check-in`
- **Permisos:** `admin`, `seller`
- **Headers:**
  - `Authorization: Bearer <TOKEN>`
  - `x-branch-id: <BRANCH_ID>`
- **¿Qué hace el backend automáticamente?**
  1. Cambia el estado de la cita a `completed`.
  2. Descongela automáticamente la orden de mantenimiento vinculada (cambia de `awaiting_appointment` a `not_started`).
  3. Devuelve tanto la cita como la orden de mantenimiento activada para poder navegar a ella.

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "66d790123abcde001234567b",
      "status": "completed",
      "customerName": "Carlos Sánchez",
      "customerPhone": "8119876543"
    },
    "maintenance": {
      "_id": "66d790123abcde0012345678",
      "status": "not_started",
      "notes": "Servicio programado por cita",
      "vehicle": { ... }
    }
  },
  "message": "Success"
}
```

---

### 🟢 Endpoint C: Crear Cita con Estado Inicial (Panel Staff)
> **Resuelve:** Si el asesor registra una cita por llamada telefónica y ya la quiere dejar `approved` (sin pasar por `pending`).

- **Método y Ruta:** `POST /api/appointments`
- Ahora el DTO soporta opcionalmente el campo `"status"`:
```json
{
  "customerName": "Ana Garza",
  "customerPhone": "8181234567",
  "vehicle": {
    "brand": "Nissan",
    "model": "Versa",
    "year": 2020,
    "serialNumberLastFour": "5678"
  },
  "serviceRequested": "Afinación Mayor",
  "scheduledAt": "2026-09-05T10:00:00Z",
  "status": "approved" // Permite 'approved' o 'completed' directamente
}
```

---

## 🛠️ 3. Tareas Pendientes para el Desarrollador Frontend

### ✅ Tarea 1: Crear el Botón y Modal de "Recepción Directa" (Walk-in)
- **Ubicación sugerida:**
  - Botón destacado en el Navbar/Header superior o en el Dashboard principal: **`+ Recibir Auto`** o **`+ Recepción Rápida`**.
  - También disponible en la vista de `/maintenance` (Órdenes de Servicio).
- **Campos del Modal / Formulario:**
  1. **Teléfono del Cliente:** Al teclearlo, hacer debounce de búsqueda (`GET /api/customers/phone/:phone`). Si ya existe, autocompletar el nombre y mostrar sus autos registrados en un dropdown.
  2. **Nombre del Cliente:** Editable o requerido si es nuevo.
  3. **Correo:** (Opcional).
  4. **Vehículo:** Marca, Modelo, Año, Placas / Últimos 4 de serie.
  5. **Motivo de Ingreso / Servicio Solicitado:** Textarea obligatorio (ej. *"Revisión general por calentamiento de motor"*).
  6. **Mano de Obra Inicial:** (Opcional, default 0).
  7. **Mecánico Asignado:** (Opcional, dropdown de usuarios con rol `mechanic`).
- **Acción al Guardar:**
  - Enviar `POST /api/maintenance/direct-reception`.
  - Al recibir respuesta exitosa, mostrar Toast: *"Vehículo recibido exitosamente"*.
  - Redirigir inmediatamente a la orden de mantenimiento generada: `/maintenance/${response.data._id}` (para que puedan subir fotos de evidencia de recepción, agregar refacciones o inspeccionar).

---

### ✅ Tarea 2: Agregar Botón "Recibir Vehículo" (Check-in) en la Lista de Citas
- **Ubicación:** En la tabla o timeline de Citas (`/appointments`), para las filas que estén en estado `approved` o `pending`.
- **Acción de la UI:**
  - Agregar botón de acción con icono de llave: **"Recibir Vehículo"**.
  - Al hacer clic, ejecutar `PATCH /api/appointments/${appointmentId}/check-in`.
  - El backend devolverá el objeto `{ appointment, maintenance }`.
  - Mostrar modal o notificación Toast: *"Vehículo recibido en taller"*, con botón *"Ir a la orden de servicio"* redirigiendo a `/maintenance/${response.data.maintenance._id}`.

---

### ✅ Tarea 3: Mejorar el Formulario de Creación de Citas de Staff
- En el modal de agendar cita dentro del panel administrativo (`/appointments`), agregar un campo selector o checkbox:
  - `Estado de la Cita`: Opciones: `Aprobada (Confirmada)` o `Pendiente de confirmación`.
  - Por defecto para el staff administrativo puede ser `approved`, evitando tener que aprobarla manualmente en un segundo paso.

---

## 🧪 4. Pruebas Rápidas con cURL

### Prueba de Recepción Directa (Walk-in):
```bash
curl -X POST "http://localhost:3000/api/maintenance/direct-reception" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "x-branch-id: <TU_BRANCH_ID>" \
  -d '{
    "customerName": "Juan Pérez",
    "customerPhone": "8110002233",
    "vehicle": {
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2021,
      "serialNumberLastFour": "9988"
    },
    "serviceRequested": "Cambio de balatas delanteras",
    "laborCost": 350
  }'
```

### Prueba de Check-in de Cita Existente:
```bash
curl -X PATCH "http://localhost:3000/api/appointments/<APPOINTMENT_ID>/check-in" \
  -H "Authorization: Bearer <TU_TOKEN>" \
  -H "x-branch-id: <TU_BRANCH_ID>"
```

---
---

# 📦 MÓDULO NUEVO: Pedidos Especiales (Apartados bajo Encargo)

## 📌 1. Reglas de Negocio del Pedido Especial

1. **Sin relación con inventario:** Son artículos solicitados específicamente por el cliente que no existen en el stock físico del taller (ej. *"Un tablero digital FT 150 Italika"*).
2. **Costos y Precios:**
   - `costPrice`: Precio de lista / costo al que el taller compra la pieza con el proveedor.
   - `sellingPrice`: Precio de venta pactado con el cliente.
3. **Regla Estricta del 50% de Anticipo:**
   - **Anticipo mínimo:** Obligatoriamente el 50% de `sellingPrice` (`sellingPrice * 0.5`).
   - El cliente puede dar el 50%, más del 50%, o liquidarlo todo al momento (100%).
   - **Validación:**
     - Si el precio de venta es **$800** y el cliente deja **$350**: **Rechazar con error 400**.
       *(Mensaje: "El anticipo mínimo requerido es del 50% ($400.00). Se intentó registrar $350.00 (43.8%)")*.
     - Si deja **$670**: Válido. El sistema calcula en vivo:
       - Porcentaje cubierto: `83.8%`
       - Saldo restante: `$130.00`
       - Estatus de liquidación: `No liquidado`
     - Si deja **$800**: Válido.
       - Porcentaje cubierto: `100%`
       - Saldo restante: `$0.00`
       - Estatus de liquidación: `Liquidado (isFullyPaid: true)`
4. **Ciclo de Vida del Pedido (Estatus):**
   - 🟡 `order_placed`: **Pedido Levantado** (Registrado con anticipo inicial).
   - 🔵 `ordered`: **Pedido** (Solicitado formalmente al proveedor).
   - 🟣 `in_transit`: **En tránsito** (El proveedor ya lo envió / en paquetería).
   - 🟠 `in_branch`: **En Sucursal** (La pieza ya llegó físicamente al taller).
   - 🟢 `ready_for_pickup`: **Pendiente de entrega** (Cliente avisado, esperando que pase a recoger).
   - 🏁 `delivered`: **Entregado** (Entregado al cliente con saldo liquidado).
   - 🔴 `cancelled`: **Cancelado** (Cancelación global del pedido con motivo obligatorio registrado).

---

## 🛠️ 2. Endpoints de la API de Pedidos (`/api/orders`)

Todos los endpoints requieren:
- `Authorization: Bearer <TOKEN>`
- `x-branch-id: <BRANCH_ID>`

### 1. `POST /api/orders` — Levantar Nuevo Pedido
Crea el pedido, valida el 50% mínimo, busca/crea al cliente y registra el pago inicial en el historial.

#### Request Body:
```json
{
  "customerId": "60d5ec49c6d48227b409748b",     // Opcional si es cliente existente
  "customerName": "Juan Pérez",                 // Requerido
  "customerPhone": "8119876543",                // Requerido
  "customerEmail": "juan@example.com",          // Opcional
  "itemDescription": "Tablero digital FT 150",  // Requerido
  "costPrice": 500,                             // Requerido (Precio lista/costo)
  "sellingPrice": 800,                          // Requerido (Precio venta)
  "advancePayment": 400,                        // Requerido (Mínimo 50%)
  "paymentMethod": "cash",                      // 'cash' | 'card' | 'transfer'
  "paymentReference": "REF-12345",              // Opcional
  "notes": "Cliente lo necesita antes del viernes", // Opcional
  "estimatedArrivalDate": "2026-09-12T00:00:00Z" // Opcional
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "66d790123abcde0012349999",
    "folio": "PED-20260903-4821",
    "itemDescription": "Tablero digital FT 150",
    "costPrice": 500,
    "sellingPrice": 800,
    "advancePayment": 400,
    "minAdvanceRequired": 400,
    "advancePercentage": 50,
    "remainingBalance": 400,
    "isFullyPaid": false,
    "status": "order_placed",
    "customer": {
      "_id": "60d5ec49c6d48227b409748b",
      "name": "Juan Pérez",
      "phone": "8119876543"
    },
    "payments": [
      {
        "amount": 400,
        "paymentMethod": "cash",
        "date": "2026-09-03T21:00:00.000Z",
        "notes": "Anticipo inicial de apartado"
      }
    ],
    "statusHistory": [
      {
        "status": "order_placed",
        "changedAt": "2026-09-03T21:00:00.000Z",
        "notes": "Pedido levantado con anticipo inicial"
      }
    ],
    "createdAt": "2026-09-03T21:00:00.000Z"
  },
  "message": "Pedido creado exitosamente con anticipo registrado."
}
```

### 2. `GET /api/orders` — Listar Pedidos con Filtros
Query params opcionales:
- `search`: Folio, nombre de cliente, teléfono o descripción de pieza.
- `status`: Filtrar por estado (`order_placed`, `ordered`, `in_transit`, `in_branch`, `ready_for_pickup`, `delivered`, `cancelled`).
- `isFullyPaid`: `true` | `false`.
- `startDate` / `endDate`: Filtro de fechas (YYYY-MM-DD).

### 3. `GET /api/orders/summary` — Métricas y Dashboard de Pedidos
Retorna:
```json
{
  "success": true,
  "data": {
    "totalOrders": 12,
    "activeOrders": 8,
    "deliveredOrders": 3,
    "cancelledOrders": 1,
    "totalPendingBalance": 3450.00,
    "totalCollected": 6800.00,
    "totalSalesValue": 10250.00,
    "byStatus": {
      "order_placed": 2,
      "ordered": 2,
      "in_transit": 2,
      "in_branch": 1,
      "ready_for_pickup": 1,
      "delivered": 3,
      "cancelled": 1
    }
  }
}
```

### 4. `PATCH /api/orders/:id/status` — Avanzar Estatus del Pedido
```json
{
  "status": "in_transit",
  "notes": "Guía de paquetería FedEx: 99882211"
}
```

### 5. `POST /api/orders/:id/payments` — Registrar Abono o Liquidación
```json
{
  "amount": 400,
  "paymentMethod": "cash",
  "paymentReference": "FOLIO-PAGO-01",
  "notes": "Liquidación al recoger pieza"
}
```
*Si el abono cubre el total restante, `isFullyPaid` pasa automáticamente a `true` y `remainingBalance` a `0`.*

### 6. `PATCH /api/orders/:id/cancel` — Cancelar Pedido
```json
{
  "reason": "Proveedor reportó pieza descontinuada"
}
```

---

## 🎨 3. Especificación de UI/UX para el Desarrollador Frontend

### Vista Principal (`/pedidos` o `/orders`):
1. **Header de Métricas (KPI Cards con Glassmorphism):**
   - 📦 **Pedidos Activos:** Contador total en proceso.
   - 🚚 **En Tránsito:** Pedidos en camino.
   - 🏬 **En Sucursal / Por Entregar:** Pedidos listos para aviso o entrega.
   - 💰 **Saldo por Cobrar:** Monto total pendiente de cobro en color ámbar/dorado.
2. **Barra de Herramientas:**
   - Search input con debounce (300ms).
   - Selector de Estatus (Píldoras/Tabs o vista Pipeline).
   - Botón principal de acción: **`+ Levantar Pedido`** (botón de alto contraste y micro-interacción).
3. **Tabla / Tarjetas de Pedidos:**
   - Folio clickeable con copia rápida al portapapeles.
   - Cliente (Nombre + Icono de WhatsApp con link directo `https://wa.me/52...?text=Hola...`).
   - Pieza solicitada.
   - **Barra de Progreso de Pago:**
     - Barra visual animada: `[████████░░] 83.8% ($670 / $800)`
     - Badge verde `Liquidado` si es 100%, o badge ámbar `Resta: $130.00`.
   - Badge de Estatus con color representativo.
   - Acciones: Ver detalle, Avanzar estatus, Abonar / Liquidar.

### Modal "+ Levantar Pedido" con Calculadora de Anticipo Reactiva:
1. **Paso 1: Cliente**
   - Input de Teléfono: Si existe en sistema, autocompleta el nombre automáticamente.
2. **Paso 2: Pieza y Precios**
   - Input: Descripción de la pieza.
   - Input: Precio de Lista / Compra ($).
   - Input: Precio de Venta al cliente ($).
3. **Paso 3: Calculadora de Anticipo Inteligente (Live Calculator)**
   - Al teclear el precio de venta (ej. $800), se muestra de inmediato una etiqueta dinámica:
     > 💡 *Anticipo mínimo requerido (50%): **$400.00***
   - Input: **Monto de Anticipo ($)**
     - Botón de acceso rápido: **`[Pagar 100% / Liquidar]`** (auto-rellena el total).
     - Botón de acceso rápido: **`[Anticipo 50%]`** (auto-rellena el mínimo).
     - **Feedback visual en tiempo real:**
       - Si teclea `< $400` (ej. $350): El borde se pinta de rojo y aparece una alerta: *⛔ Faltan $50.00 para cubrir el 50% mínimo obligatorio*. El botón "Guardar" se desactiva.
       - Si teclea `>= $400` (ej. $670): El borde se pinta de verde, se muestra una barra de progreso que indica: *✅ Cubierto 83.8% | Saldo restante a pagar en entrega: $130.00*.
4. **Paso 4: Método de Pago inicial y Notas**
   - Efectivo, Tarjeta o Transferencia.

---

## 🧠 4. Skill: Agente Senior Especialista en UI/UX & Optimización Frontend

> Copia esta skill en tu agente frontend o úsala como guía de directrices obligatorias al programar la interfaz.

```markdown
---
name: senior-ui-ux-performance-architect
description: Expert UI/UX designer and frontend performance optimizer specializing in modern web design trends, ergonomics, tactile feedback, and sub-millisecond perceived performance.
---

# Rol y Filosofía de Diseño
Eres un Diseñador y Arquitecto Frontend Senior. Tu objetivo es crear experiencias que no solo sean funcionales, sino que transmitan modernidad, precisión, velocidad instantánea y confianza comercial.

## 1. Tendencias UI Modernas (2026 Design Language)
- **Glassmorphism & Profundidad:** Usa fondos con blur (`backdrop-blur-md`), bordes translúcidos (`border border-white/10`) y sombras de contacto suaves (`shadow-2xl shadow-black/20`).
- **Jerarquía Tipográfica Curada:** Evita tipografías por defecto. Usa pesos bien diferenciados (Font-black en números KPI, Font-medium en labels, tracking ajustado `-tracking-tight`).
- **Micro-interacciones y Feedback Físico:**
  - Botones con escala reactiva al presionar (`active:scale-[0.98] transition-transform`).
  - Animaciones de entrada fluidas en modales (`animate-in fade-in zoom-in-95 duration-200`).
  - Barras de progreso con gradiente y transiciones suaves (`transition-all duration-500 ease-out`).
- **Paleta de Color Semántica:**
  - `Emergencia/Error`: Tonos carmesí/rosa neón (`bg-rose-500/10 text-rose-400 border-rose-500/20`).
  - `Éxito/Liquidado`: Tonos esmeralda brillante (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`).
  - `Proceso/Tránsito`: Tonos zafiro y violeta eléctrico (`bg-indigo-500/10 text-indigo-400`).
  - `Pendiente/Anticipo`: Tonos ámbar dorado (`bg-amber-500/10 text-amber-400`).

## 2. Ergonomía para Operadores de Mostrador (UX Frictionless)
- **Zero-Friction Forms:** Al abrir un modal, el primer input recibe foco automático (`autoFocus`).
- **Atajos de Teclado:**
  - `ESC`: Cierra modales sin guardar.
  - `Enter`: Si el formulario es válido, envía la petición.
- **Teclado Numérico Automático:** En inputs de dinero o teléfono, usa `inputMode="decimal"` o `inputMode="tel"` para disparar el teclado numérico en tablets o celulares.
- **One-Click WhatsApp Integration:** En cada tarjeta o fila con teléfono, incluye un botón directo a WhatsApp Web/App con el mensaje pre-armado:
  *"Hola {cliente}, le avisamos que su pedido {folio} ({pieza}) ya se encuentra en sucursal listo para entrega. Saldo restante: ${saldo}."*

## 3. Optimización de Código & Rendimiento Frontend
- **Debounced Lookups:** No dispares llamadas al backend en cada tecla. Usa `useDebounce` de 300ms para autocompletar clientes o buscar folios.
- **Optimistic UI Updates:** Al cambiar el estado de un pedido (ej. de 'en camino' a 'en sucursal'), actualiza el estado local inmediatamente en la UI antes de que termine la llamada HTTP; si la API falla, haz rollback y muestra un Toast de error.
- **Evitar Re-renders Innecesarios:**
  - Separa la calculadora de anticipo en su propio componente o hook (`useOrderFinancials(sellingPrice, advancePayment)`).
  - Memoiza listas de pedidos con `useMemo` y callbacks de acción con `useCallback`.
- **Skeleton Loaders en lugar de Spinners genéricos:** Al cargar la tabla o cards de pedidos, muestra siluetas de carga animadas (`animate-pulse`) con la misma estructura geométrica de las tarjetas finales.
```

