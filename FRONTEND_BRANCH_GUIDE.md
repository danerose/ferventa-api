# Guía de Implementación de Sucursales en el Frontend

El sistema ha sido actualizado para soportar múltiples sucursales (Multi-tenancy). Ahora, el inventario, citas, clientes y otras entidades están ligadas a una sucursal en específico.

Para que el backend sepa de qué sucursal se están haciendo las peticiones, se ha introducido un mecanismo basado en tokens y headers.

## 1. Inicio de Sesión y Sucursales Asignadas

Al iniciar sesión exitosamente (`POST /auth/login`), el JWT regresará, entre otros datos, el arreglo de sucursales a las cuales el usuario tiene acceso:

```json
{
  "access_token": "eyJhb...",
  "user": {
    "_id": "...",
    "email": "...",
    "role": "...",
    "branches": ["64a2...", "64a3..."] // IDs de las sucursales permitidas
  }
}
```

**Acción Frontend:**
Guarda las `branches` del usuario en tu estado global (Redux, Context, Zustand, etc.).

## 2. Seleccionar Sucursal Activa

Si el usuario tiene más de 1 sucursal asignada, la interfaz debe mostrar un **Selector de Sucursal** (por ejemplo, un Dropdown en el Navbar) para que elija en cuál va a operar.
- Si solo tiene 1, selecciónala automáticamente por defecto.
- Guarda la `branchId` activa en el estado global y/o `localStorage`.

## 3. Peticiones Autenticadas (El Header `x-branch-id`)

En absolutamente **todas** las peticiones al API (Inventory, Customers, Sales, Quotes, Appointments, etc.), debes mandar el header `x-branch-id` con el ID de la sucursal seleccionada.

Ejemplo en Axios:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.ferventa.com'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  const activeBranchId = localStorage.getItem('activeBranchId');

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (activeBranchId) {
    config.headers['x-branch-id'] = activeBranchId;
  }

  return config;
});
```

Si el `x-branch-id` no es enviado, o si el usuario no tiene permisos sobre esa sucursal, el API retornará:
- `400 Bad Request` ("No se especificó la sucursal activa en los headers (x-branch-id)")
- `403 Forbidden` ("No tienes acceso a esta sucursal")

## 4. Peticiones Públicas (Track Mantenimiento / Crear Citas)

Las rutas públicas **NO** llevan token (Bearer), pero **SÍ** requieren el header `x-branch-id` para saber a qué taller / sucursal están interactuando.
Esto significa que en el módulo de reservación pública o rastreo web, debes tener un selector de sucursal inicial, o inyectar el ID de la sucursal por defecto.

Ejemplo:
```javascript
// Agendar cita pública
axios.post('/appointments/public', data, {
  headers: {
    'x-branch-id': 'ID_DE_LA_SUCURSAL'
  }
})
```

## 5. Administrador de Usuarios y Sucursales

Al crear (`POST /users`) o editar (`PATCH /users/:id`) un usuario, ahora debes enviar un arreglo con los IDs de las sucursales a las que tendrán acceso en la propiedad `branches`:

```json
{
  "name": "Juan Perez",
  "email": "juan@ferventa.com",
  "roleId": "...",
  "branches": ["ID_SUCURSAL_1", "ID_SUCURSAL_2"]
}
```

El endpoint `/branches` (métodos `GET`, `POST`, `PATCH`, `DELETE`) puede ser usado por los Administradores para gestionar el catálogo de sucursales del sistema.
