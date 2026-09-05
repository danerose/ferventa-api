# Guía y Tareas para Frontend (TODO Frontend)

Este documento detalla los requerimientos, endpoints, modelos de datos y especificaciones de interfaz que el equipo de Frontend debe implementar:
1. **Búsqueda Difusa (*Fuzzy Search*)** tolerante a errores tipográficos.
2. **Ciclo de vida y auditoría de tiempos en Mantenimientos**.
3. **Manejo de Notas en Citas y Recepción de Vehículos** (`notes` vs `receptionNotes`).
4. **Bitácora de Diagnóstico y Registro de Fallas en Taller** (`diagnosticNotes`).
5. **Vinculación de Ticket de Venta / POS al Mantenimiento** (`sale`).

---

## 1. Búsqueda de Artículos y Catálogos (Fuzzy Search)

### ¿Qué cambió en el Backend?
El backend cuenta con **búsqueda difusa (*Fuzzy Search*) tolerante a errores ortográficos y tipográficos**.
* Si el usuario escribe `"Ballatas"` (con doble *l*), `"Valata"` (confusión b/v), `"Balatas"` (plural) o `"balta"`, el API automáticamente encontrará `"Balata"`.
* Aplica en los endpoints de productos, marcas, categorías, proveedores, servicios, clientes, vehículos, citas y pedidos.

### Tareas Frontend:
- [ ] Enviar el término de búsqueda directamente en `search` o `q` (ej. `/inventory/products?search=Ballatas`) sin sanitizaciones agresivas que eliminen caracteres del usuario.
- [ ] (Recomendado) Agregar un *debounce* (300ms a 500ms) en los inputs de búsqueda en tiempo real para optimizar las peticiones.

---

## 2. Notas de Cita vs. Notas de Recepción del Vehículo

Existen dos tipos de notas con propósitos distintos que deben reflejarse en los formularios correspondientes:

### A. Notas de la Cita (`notes`)
* **Cuándo se captura**: Al momento de **agendar la cita** (tanto el cliente en el portal público como el recepcionista/vendedor en el panel administrativo).
* **Propósito**: Describir el motivo de la cita, peticiones especiales del cliente o preferencias generales.
* **Ejemplo**: *"El cliente prefiere aceite 100% sintético y pide revisar ruido en suspensión delantera"*.
* **Campos**: `notes` en `POST /appointments` y `PATCH /appointments/{id}`.

### B. Notas de Recepción del Vehículo (`receptionNotes`)
* **Cuándo se captura**: Al momento de **recibir físicamente el vehículo** en la sucursal (mediante el botón/modal de **Check-in** o **Recepción Directa**).
* **Propósito**: Registrar el inventario y estado físico del vehículo a su llegada a las instalaciones.
* **Ejemplo**: *"Deja llaves, 1/2 tanque de gasolina, gato hidráulico en cajuela y leve rayón en puerta derecha"*.
* **Endpoints**:
  * Check-in de Cita:
    ```http
    PATCH /api/appointments/{id}/check-in
    Content-Type: application/json

    {
      "receptionNotes": "Deja llaves, 1/2 tanque de gasolina, llanta de refacción incluida"
    }
    ```
  * Recepción Directa: `POST /api/maintenance/direct-reception` (soporta `assignedMechanic`, `notes`, etc.).
  * Creación y Edición de Mantenimiento:
    * `POST /api/maintenance` (soporta `assignedMechanic`, `receptionNotes`, `notes`, `saleId`, etc.)
    * `PATCH /api/maintenance/{id}` (soporta `assignedMechanic`, `receptionNotes`, `notes`, `laborCost`, `status`, `saleId`)

---

## 3. Bitácora de Fallas y Diagnósticos en Mantenimiento (`diagnosticNotes`)

Durante el trabajo de taller, el mecánico o asesor suele detectar fallas adicionales, desgastes o diagnósticos conforme se va revisando el auto.

### Endpoint para Registrar Fallas / Diagnósticos:
* **`POST /api/maintenance/{id}/notes`**
```json
{
  "note": "Se detectó fuga de aceite en retén de cigüeñal"
}
```
* **Respuesta (`201`)**: Devuelve la orden actualizada con la nueva nota anexada a `diagnosticNotes`.

---

## 4. Vinculación de Ticket de Compra / POS (`Sale`)

Para no duplicar cobros ni inventarios, las refacciones y mano de obra se cobran desde el **POS** de forma normal (generando su respectivo ticket de venta, corte de caja y métodos de pago). Luego, ese ticket se vincula al mantenimiento.

### ¿Cómo funciona en el API?
Cada orden de mantenimiento (`Maintenance`) contiene la referencia populada del ticket de venta:
```json
{
  "_id": "66d9b231901a87b801234567",
  "status": "completed",
  "sale": {
    "_id": "66d9c123...",
    "folio": "VEN-0045",
    "total": 1850.0,
    "paymentMethod": "card",
    "paymentReference": "123456789",
    "items": [
      { "name": "Balatas Delanteras", "quantity": 1, "priceSnapshot": 850.0 },
      { "name": "Servicio de Afinación", "quantity": 1, "priceSnapshot": 1000.0 }
    ],
    "seller": { "_id": "...", "name": "Carlos Vendedor" },
    "createdAt": "2026-09-05T12:00:00.000Z"
  }
}
```

### Endpoints para Vincular / Desvincular Ticket:
1. **Vincular Ticket**:
   ```http
   PATCH /api/maintenance/{id}/link-sale
   Content-Type: application/json

   {
     "saleId": "66d9c123..."
   }
   ```
   *(También soporta vincular por folio: `{ "folio": "VEN-0045" }`)*

2. **Desvincular Ticket**:
   ```http
   PATCH /api/maintenance/{id}/unlink-sale
   ```

### Tareas Frontend para Vinculación de Ticket:
- [ ] En la vista de detalle de Mantenimiento (`DashboardQuickDetailDrawer`):
  - **Si no tiene ticket vinculado (`sale == null`)**: Mostrar botón **"🔗 Vincular Ticket de Venta / POS"** que abra un modal/buscador de ventas recientes (por folio o cliente) para asociarlo.
  - **Si ya tiene ticket vinculado (`sale != null`)**: Mostrar tarjeta resumen con:
    - 🏷️ Folio: `#VEN-0045`
    - 💰 Total Cobrado: `$1,850.00`
    - 💳 Método de pago: `Tarjeta (Mercado Pago)`
    - 👤 Vendedor / Cajero: `Carlos Vendedor`
    - Botones para **"Ver Detalle / Reimprimir Ticket"** y **"Desvincular"**.

---

## 5. Vistas y Filtros de Mantenimientos (`GET /api/maintenance`)

La pantalla de **Mantenimiento / Taller** se organiza en 3 pestañas principales:

```
[ 🚗 En Taller / Activos ]   [ ⏱️ Entregados Esta Semana ]   [ 📁 Historial Completo ]
```

### Pestaña 1: "En Taller / Activos"
* **Endpoint**: `GET /api/maintenance?scope=active`
* **Estados**: `not_started`, `in_progress`, `completed`.

### Pestaña 2: "Entregados Esta Semana"
* **Endpoint**: `GET /api/maintenance?scope=delivered_recent`
* **Qué muestra**: Vehículos entregados en los últimos 7 días.

### Pestaña 3: "Historial de Mantenimientos"
* **Endpoint**: `GET /api/maintenance?scope=history`
* **Filtros**:
  * `from` y `to` (`YYYY-MM-DD`).
  * `dateField` (`receptionDate`, `completedAt`, `deliveredAt`, `createdAt`).
  * `status` (`all`, `delivered`, `completed`, `in_progress`, etc.).
  * `search` (búsqueda difusa).

---

## 6. Dashboard de Métricas de Taller

### Endpoint: `GET /api/reports/maintenance-metrics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
* `volume`: `totalReceived`, `totalCompleted`, `totalDelivered`, `pendingPickupCount`.
* `averages`: `avgQueueHours`, `avgWorkHours`, `avgPickupDays`, `avgTotalStayDays`.
* `pendingPickupVehicles`: Lista de autos terminados esperando recolección con días de retraso.
