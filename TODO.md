# 📋 Guía Técnica y Lista de Tareas (TODO) — Ferventa

Este documento consolida la arquitectura de **Recepciones de Mercancía, Cajas en Bodega, Códigos QR, FIFO y Unificación de Precios**, junto con el código y las especificaciones exactas para el desarrollador de **Frontend (`ferventa-web`)**.

---

## 🧭 Resumen de Estatus

* **Backend (`ferventa-api`)**: 100% implementado y listo para consumo. Modelos, endpoints de recepciones en borrador, aprobación, generación de `boxCode`, apertura de cajas, unificación de precios y registro en Kardex.
* **Frontend (`ferventa-web`)**: Pendiente de integrar los formularios, impresión de etiquetas QR y acción de apertura de caja.

---

## 1. 💡 Arquitectura: ¿Cómo funciona el Inventario, Cajas y FIFO?

1. **Piso de Venta (Mostrador) vs Bodega:**
   * El campo `product.stock` representa **exclusivamente el mostrador** (lo vendible en el POS).
   * Al recibir mercancía, las piezas quedan como **cajas selladas en bodega** (`isBoxSealed: true`), por lo que el stock de mostrador **no aumenta de inmediato**.
2. **Nuevo Precio de Venta (`sellingPrice`):**
   * Al capturar la recepción se asigna el costo (`costPrice`) y opcionalmente el **Nuevo Precio de Venta al Público (`sellingPrice`)**.
   * Mientras la caja esté sellada en bodega, el mostrador sigue vendiendo el remanente al precio anterior.
3. **Cajas independientes por producto:**
   * Si en una remisión recibes Aceite y Bujías, se generan dos códigos de caja independientes (ej. `BOX-...-1-042` para Aceite y `BOX-...-2-891` para Bujías).
   * Puedes abrir únicamente la caja de Bujías y dejar el Aceite guardado en bodega.
4. **Apertura de Caja (`openBox` / FIFO):**
   * Al escanear o presionar "Abrir Caja" con el `boxCode`:
     * Suma la cantidad de piezas al `product.stock` de mostrador.
     * Actualiza el `product.sellingPrice` y `costPrice` con los valores del nuevo lote.
     * Marca la caja como abierta (`isBoxSealed: false`) y crea el movimiento de Kardex.

---

## 2. 🛠️ Endpoints y Payloads del Backend

### A. Listar Recepciones (Paginado)
* **Método:** `GET /inventory/receptions?page=1&limit=10&status=approved`
* **Roles:** `admin`, `warehouse`, `seller`
* **Query Params:**
  * `page` (opcional, default 1): Número de página.
  * `limit` (opcional, default 10): Elementos por página.
  * `status` (opcional): `draft`, `approved`, o `rejected`.
* **Respuesta:**
```json
{
  "items": [
    {
      "_id": "60d5ec49c6d48227b4097400",
      "status": "approved",
      "invoiceOrFolio": "FAC-98421",
      "items": [
        {
          "sku": "ACE-MOTUL-10W40",
          "name": "Aceite Motul 10W40 1L",
          "quantity": 20,
          "boxCode": "BOX-1726435200000-1-9821",
          "isBoxSealed": true
        }
      ],
      "totalBoxes": 1,
      "sealedBoxesCount": 1,
      "openedBoxesCount": 0,
      "isFullyOpened": false,
      "sealedStock": 20,
      "openedStock": 0,
      "totalStock": 20
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### B. Crear Recepción en Borrador
* **Método:** `POST /inventory/receptions`
* **Roles:** `admin`, `warehouse`, `seller`
* **Body:**
```json
{
  "providerId": "60d5ec49c6d48227b409748f",
  "invoiceOrFolio": "FAC-98421",
  "notes": "Lote recibido en almacén",
  "items": [
    {
      "productId": "60d5ec49c6d48227b409748e",
      "quantity": 20,
      "costPrice": 120,
      "sellingPrice": 200
    }
  ]
}
```

---

### C. Aprobar Recepción (Solo Admin)
* **Método:** `PATCH /inventory/receptions/:id/approve`
* **Roles:** `admin`
* **Respuesta (`items` con códigos de caja generados):**
```json
{
  "_id": "60d5ec49c6d48227b4097400",
  "status": "approved",
  "invoiceOrFolio": "FAC-98421",
  "items": [
    {
      "_id": "60d5ec49c6d48227b4097499",
      "sku": "ACE-MOTUL-10W40",
      "name": "Aceite Motul 10W40 1L",
      "quantity": 20,
      "costPrice": 120,
      "sellingPrice": 200,
      "boxCode": "BOX-M3X89K-1-042",
      "isBoxSealed": true
    }
  ]
}
```

---

### D. Rechazar Recepción (Solo Admin)
* **Método:** `PATCH /inventory/receptions/:id/reject`
* **Roles:** `admin`
* **Body:**
```json
{
  "reason": "Factura con importes incorrectos"
}
```

---

### E. Abrir Caja (Surtir Mostrador y Nivelar Precio)
* **Método:** `POST /inventory/boxes/open`
* **Roles:** `admin`, `warehouse`, `seller`
* **Body:**
```json
{
  "boxCode": "BOX-M3X89K-1-042"
}
```
* **Respuesta:**
```json
{
  "success": true,
  "message": "Caja BOX-M3X89K-1-042 abierta exitosamente...",
  "boxCode": "BOX-M3X89K-1-042",
  "product": {
    "_id": "60d5ec49c6d48227b409748e",
    "name": "Aceite Motul 10W40 1L",
    "previousStock": 3,
    "currentStock": 23,
    "previousSellingPrice": 180,
    "currentSellingPrice": 200
  }
}
```

---

## 3. 💻 Código Frontend Listo para Usar (`ferventa-web`)

### Paso 1: Instalar librería QR
```bash
npm install qrcode.react
```

### Paso 2: Componente de Etiqueta Térmica (`BoxQRLabel.tsx`)
```tsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface BoxItemData {
  _id: string;
  sku: string;
  name: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  boxCode: string;
  isBoxSealed: boolean;
}

interface BoxQRLabelProps {
  item: BoxItemData;
  invoiceOrFolio?: string;
  branchName?: string;
}

export const BoxQRLabel: React.FC<BoxQRLabelProps> = ({
  item,
  invoiceOrFolio,
  branchName = 'Ferventa',
}) => {
  return (
    <div
      className="box-label-container"
      style={{
        width: '72mm',
        padding: '8px',
        border: '1px dashed #cbd5e1',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        fontFamily: 'monospace, sans-serif',
        color: '#000000',
        pageBreakInside: 'avoid',
        marginBottom: '12px',
      }}
    >
      {/* Cabecera */}
      <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '6px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>{branchName}</div>
        <div style={{ fontSize: '10px' }}>LOTE / CAJA DE ALMACÉN</div>
      </div>

      {/* Cuerpo con QR y Datos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ padding: '4px', backgroundColor: '#fff', border: '1px solid #000', borderRadius: '4px' }}>
          <QRCodeSVG value={item.boxCode} size={90} level="M" />
        </div>

        <div style={{ flex: 1, fontSize: '11px', lineHeight: '1.3' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{item.name}</div>
          <div>SKU: <strong>{item.sku}</strong></div>
          <div>Contenido: <strong>{item.quantity} pzas</strong></div>
          <div>P. Venta: <strong>${item.sellingPrice.toFixed(2)}</strong></div>
          {invoiceOrFolio && <div style={{ fontSize: '9px', color: '#333' }}>Folio: {invoiceOrFolio}</div>}
        </div>
      </div>

      {/* Código visible */}
      <div style={{ marginTop: '6px', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '3px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{item.boxCode}</span>
      </div>
    </div>
  );
};
```

### Paso 3: Modal de Impresión de Etiquetas (`BoxPrintModal.tsx`)
```tsx
import React, { useRef } from 'react';
import { BoxQRLabel, BoxItemData } from './BoxQRLabel';

interface BoxPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reception: {
    _id: string;
    invoiceOrFolio?: string;
    items: BoxItemData[];
  } | null;
}

export const BoxPrintModal: React.FC<BoxPrintModalProps> = ({ isOpen, onClose, reception }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !reception) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #box-print-section, #box-print-section * {
              visibility: visible;
            }
            #box-print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>

      <div className="modal-content" style={{ maxWidth: '500px', padding: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          📦 Etiquetas QR de Cajas
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          Imprime y pega estas etiquetas en cada bulto/caja en la bodega.
        </p>

        <div
          id="box-print-section"
          ref={printAreaRef}
          style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}
        >
          {reception.items.map((item) => (
            <BoxQRLabel
              key={item._id || item.boxCode}
              item={item}
              invoiceOrFolio={reception.invoiceOrFolio}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#0284c7', color: '#fff', fontWeight: 'bold' }}
          >
            🖨️ Imprimir Todas ({reception.items.length})
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 4. 📝 Tareas Pendientes para Frontend (`ferventa-web`)

- [ ] **Modal de Ingreso de Mercancía (`POST /inventory/receptions`):**
  - [ ] Agregar input editable de **Nuevo Precio de Venta (`sellingPrice`)** en la tabla de productos recibidos, pre-llenado con el precio actual.
- [ ] **Bandeja de Recepciones (`GET /inventory/receptions`):**
  - [ ] Mostrar estados `draft`, `approved`, `rejected`.
  - [ ] Botones para Admin: **Aprobar** (`PATCH /inventory/receptions/:id/approve`) y **Rechazar** (`PATCH /inventory/receptions/:id/reject`).
- [ ] **Generador e Impresión de Etiquetas QR:**
  - [ ] Integrar `BoxQRLabel` y `BoxPrintModal` en recepciones aprobadas.
- [ ] **Modal / Botón "Abrir Caja de Bodega" (`POST /inventory/boxes/open`):**
  - [ ] Input para teclear/escanear `boxCode` o botón directo en la lista de cajas selladas.
  - [ ] Toast de confirmación con el nuevo stock y el precio actualizado.
