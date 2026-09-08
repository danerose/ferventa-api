# 📋 Guía Frontend: Gestión de Contraseñas (Paso a Paso con Manzanas 🍎)

Esta guía explica al equipo de Frontend cómo integrar el nuevo sistema de **contraseñas por defecto**, **cambio de contraseña propia** y **restablecimiento de contraseñas por el Administrador**.

---

## 🍎 La Explicación con Manzanas (¿Cómo funciona esto?)

Imagina que cada vez que das de alta a un empleado en el taller:

1. **La Llave Provisional (Contraseña por Defecto):**  
   El backend le crea una "llave genérica" (`defaultPassword`). Como es una llave provisional, el Administrador **siempre la puede ver** en su panel por si el empleado no sabe cuál es o no puede entrar.
2. **El Empleado pone su propio candado privado:**  
   Cuando el empleado entra por primera vez, el frontend le pide cambiar esa contraseña. Al poner su contraseña nueva, la llave genérica **desaparece para siempre de la base de datos** (`defaultPassword = null`). A partir de ese segundo, nadie (ni el admin ni el dueño) puede verla. Solo el empleado conoce su llave.
3. **¿Y si al empleado se le olvida?**  
   El administrador le pica a *"Restablecer Contraseña"*. El API le genera una nueva llave genérica (o el admin le escribe una), el admin vuelve a poder verla, se la puede mandar por WhatsApp, y el ciclo vuelve a empezar hasta que el empleado la vuelva a cambiar.

---

## 🛠️ Nuevas Propiedades en los Tipos de Datos (TypeScript)

Actualiza tu interfaz de `User` en el frontend:

```typescript
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: {
    _id: string;
    name: string;
    description: string;
  };
  branches: string[];
  isActive: boolean;
  
  // 🌟 NUEVOS CAMPOS:
  defaultPassword?: string | null;  // Texto en claro si NO la ha cambiado; null si ya la cambió
  isDefaultPassword: boolean;       // true = sigue con la temporal; false = ya tiene su contraseña privada
}
```

Y en el perfil actual (`/api/auth/me`):
```typescript
export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  branches: string[];
  lastLoginAt: string | null;
  isDefaultPassword: boolean; // 🌟 true si el usuario actual debe cambiar su contraseña
}
```

---

## 📝 Tareas Paso a Paso para el Frontend

### Tarea 1: Aviso de "Cambio de Contraseña Obligatorio" (Para cualquier usuario)

**Objetivo:** Si el usuario logueado todavía tiene la contraseña default (`isDefaultPassword: true`), invitarlo u obligarlo a cambiarla.

1. **Dónde:** En tu layout principal o en el guard de autenticación (después de llamar a `GET /api/auth/me`).
2. **Condición:**
   ```typescript
   if (profile.isDefaultPassword) {
     // Mostrar banner superior o modal persistente:
     // "Estás usando una contraseña temporal. Por seguridad, debes actualizarla."
   }
   ```
3. **Formulario del Modal:**
   - Campo 1: **Contraseña Actual** (`currentPassword`)
   - Campo 2: **Nueva Contraseña** (`newPassword`, mín. 6 caracteres)
   - Campo 3: **Confirmar Nueva Contraseña** (validación local en frontend)
4. **Petición HTTP:**
   - **Método:** `PATCH`
   - **URL:** `/api/auth/change-password`
   - **Headers:** `Authorization: Bearer <accessToken>`
   - **Body:**
     ```json
     {
       "currentPassword": "Temporal123!",
       "newPassword": "MiNuevaPasswordSegura456!"
     }
     ```
5. **Manejo de Respuestas:**
   - **Éxito (200):**
     - Mostrar notificación: *"Contraseña actualizada con éxito"*.
     - Actualizar tu estado global/auth: `user.isDefaultPassword = false`.
     - Cerrar el modal.
   - **Error (400):**
     - Si la actual no coincide: *"La contraseña actual es incorrecta"*.
     - Si puso la misma contraseña: *"La nueva contraseña no puede ser igual a la anterior"*.

---

### Tarea 2: Ver Contraseña en la Tabla de Usuarios (Para el Administrador)

**Objetivo:** Que el admin sepa quién sigue con contraseña provisional y pueda consultarla con un clic.

1. **Dónde:** En la pantalla del listado de usuarios (`/admin/users` o módulo de Usuarios).
2. **En la columna "Contraseña / Acceso":**
   - **Caso A: `user.isDefaultPassword === true` y `user.defaultPassword` tiene texto:**
     - Renderizar un componente con ojito 👁️ o input oculto tipo password con botón de copiar:
       ```tsx
       <div className="flex items-center gap-2">
         <span className="font-mono bg-amber-50 text-amber-800 px-2 py-1 rounded text-xs">
           {showPassword ? user.defaultPassword : '••••••••'}
         </span>
         <button onClick={() => setShowPassword(!showPassword)}>👁️</button>
         <button onClick={() => copyToClipboard(user.defaultPassword)}>📋</button>
       </div>
       ```
     - Etiqueta o Badge: `[Temporal / Por Defecto]`
   - **Caso B: `user.isDefaultPassword === false` o `user.defaultPassword === null`:**
     - Renderizar un Badge verde o candadito cerrado:
       ```tsx
       <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
         🔒 Contraseña privada
       </span>
       ```
     - No hay texto que mostrar (el sistema la tiene cifrada de forma irreversible).

---

### Tarea 3: Botón "Restablecer Contraseña" en la Fila de Usuario (Solo Admin)

**Objetivo:** Que el admin pueda resetear la contraseña de un mecánico, vendedor, etc.

1. **Dónde:** En el menú de tres puntos `...` o botón de acciones de cada usuario en la tabla.
2. **Al hacer clic en "Restablecer Contraseña":**
   - Abrir un modal: *"Restablecer contraseña de {user.name}"*.
   - Input opcional: *"Escribir contraseña nueva (dejar en blanco para autogenerar)"*.
   - Botón: `[Restablecer Contraseña]`
3. **Petición HTTP:**
   - **Método:** `PATCH`
   - **URL:** `/api/users/{userId}/password`
   - **Headers:** `Authorization: Bearer <accessToken>`
   - **Body (si escribió una manual):**
     ```json
     {
       "newPassword": "NuevaPasswordManual123!"
     }
     ```
   - **Body (si la dejó vacía para que el sistema la invente):**
     ```json
     {}
     ```
4. **Manejo de Respuesta Exitosa (200):**
   - El API responde con:
     ```json
     {
       "success": true,
       "data": {
         "user": { ... },
         "tempPassword": "password_asignada_o_generada",
         "message": "¡Hola Carlos! Tu contraseña...",
         "whatsappUrl": "https://api.whatsapp.com/send?phone=528112345678&text=..."
       },
       "message": "Contraseña restablecida exitosamente"
     }
     ```
   - **Modal de Confirmación:**
     - Mostrar la contraseña que se generó/asignó: `data.tempPassword` con botón de copiar 📋.
     - Si `data.whatsappUrl` existe (el usuario tiene teléfono registrado):
       - Mostrar botón verde grande: **📲 Enviar credenciales por WhatsApp**.
       - Al darle clic: `window.open(data.whatsappUrl, '_blank')`.
     - Actualizar la fila en la tabla de usuarios localmente para reflejar la nueva `defaultPassword` y `isDefaultPassword: true`.

---

### Tarea 4: Formulario de Crear Usuario (`POST /api/users`)

**Objetivo:** El admin ya no está obligado a inventar una contraseña al registrar un nuevo usuario.

1. **En el formulario de creación de usuario:**
   - Cambiar el campo de contraseña para que sea **opcional**:
     - Placeholder: *"Opcional: Se generará una automáticamente si se deja vacío"*.
   - Si no se escribe nada, enviar `{ ...otrosCampos }` (sin `password` o con `password: ""`).
2. Al recibir la respuesta exitosa `201`:
   - El response contiene `data.tempPassword` y `data.whatsappUrl`.
   - Mostrar el modal de bienvenida con el botón de WhatsApp como ya está funcionando.

---

## ⚡ Cheat Sheet de Endpoints para Postman / Axios

| Acción | Método | Endpoint | Body | Permiso |
| :--- | :---: | :--- | :--- | :--- |
| **Usuario cambia su propia contraseña** | `PATCH` | `/api/auth/change-password` | `{ currentPassword, newPassword }` | Cualquier usuario logueado |
| **Admin resetea contraseña de un usuario** | `PATCH` | `/api/users/:id/password` | `{ newPassword?: string }` | Solo Admin |
| **Consultar perfil propio** | `GET` | `/api/auth/me` | *Ninguno* | Cualquier usuario logueado |
| **Listar todos los usuarios** | `GET` | `/api/users` | *Query params* | Solo Admin |
| **Consultar un usuario** | `GET` | `/api/users/:id` | *Ninguno* | Solo Admin |

---

¡Listo! Con estas 4 tareas el frontend tendrá una experiencia de usuario segura, intuitiva y conectada al 100% con WhatsApp. 🚀
