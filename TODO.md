# 📋 TODO: Soporte para Refacciones / Ítems Externos en Punto de Venta (POS)

## 🎯 Objetivo
Permitir que el cajero/recepcionista pueda vender productos o refacciones compradas bajo demanda a otros talleres o refaccionarias sin necesidad de darlas de alta previamente en el catálogo de inventario ni descontar stock.

---

## 🏗️ 1. Interfaz de Usuario (UI/UX) en la Pantalla de POS

### A. Botón de Acción Rápida
- [ ] En la sección del buscador de productos/catálogo del POS, agregar un botón secundario visible:
  - **Texto sugerido:** `+ Refacción / Ítem Externo` o `+ Concepto Libre`.
  - **Ícono sugerido:** `PlusCircle` / `ExternalLink` / `Wrench`.

---

### B. Modal / Drawer de Captura de Ítem Externo
Crear un modal o diálogo simple y rápido con los siguientes campos:

- [ ] **Nombre / Descripción de la Refacción (`name`)** `[OBLIGATORIO]`
  - *Ejemplo:* `"Bomba de agua Gates 1.6"` o `"Balatas traseras cerámicas"`.
  - *Validación:* String no vacío.
- [ ] **Cantidad (`quantity`)** `[OBLIGATORIO]`
  - *Default:* `1`. Mínimo `1`.
- [ ] **Precio de Venta al Cliente (`unitPrice`)** `[OBLIGATORIO]`
  - *Ejemplo:* `$1,800.00`.
  - Es el precio que se sumará al subtotal del ticket y pagará el cliente.
- [ ] **Costo de Compra al Tercero (`costPrice`)** `[OPCIONAL]`
  - *Ejemplo:* `$1,200.00`.
  - *Tooltip / Leyenda:* `"Opcional: Lo que costó comprar la refacción para calcular el margen de ganancia real."`
  - Si no se captura, se enviará `0` o `undefined`.
- [ ] **Taller / Proveedor Origen (`supplier`)** `[OPCIONAL]`
  - *Ejemplo:* `"Taller Eléctrico Los Primos"` o `"AutoZone Norte"`.
- [ ] **Notas / Garantía (`notes`)** `[OPCIONAL]`
  - *Ejemplo:* `"Garantía 30 días directo con el proveedor"`.

---

### C. Visualización en la Lista / Carrito de Venta
- [ ] Renderizar el ítem en la lista del carrito con una etiqueta o badge distintivo:
  - Badge tipo: `[EXTERNO]` o `[BAJO DEMANDA]` (color neutro o morado suave).
- [ ] Mostrar subtítulo con información secundaria si existe:
  - *Ejemplo:* `1x Bomba de agua Gates — $1,800.00`
  - *(Interno)* `Costo: $1,200.00 · Proveedor: Taller Los Primos`
- [ ] Permitir modificar la cantidad, aplicar descuento unitario (`discount`) o eliminar el ítem del carrito igual que con productos estándar.

---

### D. Ticket de Venta / Impresión al Cliente
- [ ] En el ticket impreso o digital para el cliente final:
  - **Debe salir:** Nombre (`name`), Cantidad (`quantity`), Precio Unitario (`unitPrice`) y Subtotal.
  - **NO debe salir:** Ni el costo de compra (`costPrice`) ni el proveedor externo (`supplier`) para mantener la privacidad comercial.

---

## 📡 2. Integración con el Backend (`POST /sales`)

### Payload esperado por la API:
Al confirmar la venta, cada ítem externo se envía dentro del arreglo `items` con `type: 'external'`:

```json
{
  "customerId": "60d5ec49c6d48227b409748b",
  "items": [
    {
      "type": "external",
      "name": "Bomba de agua Gates 1.6",
      "quantity": 1,
      "unitPrice": 1800,
      "costPrice": 1200,
      "supplier": "Taller Los Primos",
      "notes": "Garantía 30 días",
      "discount": 0
    },
    {
      "type": "product",
      "productId": "60d5ec49c6d48227b409748e",
      "quantity": 2,
      "unitPrice": 150,
      "discount": 0
    }
  ],
  "globalDiscount": 0,
  "paymentMethod": "cash",
  "paymentReference": ""
}
```

### ⚠️ Reglas y Validaciones Clave:
1. **`type`**: Debe ser `'external'`.
2. **`productId` / `serviceId`**: **NO** enviarlos en ítems externos (deben ser omitidos o `undefined`).
3. **`name`** y **`unitPrice`**: Son obligatorios para `type: 'external'`.
4. **`costPrice`**, **`supplier`**, **`notes`**: Son opcionales (el backend asignará `0` de costo si no se envían).
5. **Inventario:** El backend automáticamente omitirá la validación y el descuento de stock para estos ítems.
