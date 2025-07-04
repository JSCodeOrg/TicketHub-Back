# 🛡️ TicketHub Backend

El **backend de TicketHub** es el núcleo del sistema de gestión de eventos y entradas digitales. Su propósito es centralizar la lógica de negocio, exponer una API REST segura y confiable, y garantizar la integridad de los procesos relacionados con:
- Gestión de usuarios y roles.
- Creación y administración de eventos.
- Generación y validación de tickets digitales.
- Integración con apps móviles (usuario y escáner QR).

---

## 🚀 **¿Qué hace el backend de TicketHub?**

✅ **Gestión de usuarios**
- Registro e inicio de sesión seguro.
- Generación y validación de tokens JWT para autenticación.
- Control de roles (usuario, administrador).

✅ **Gestión de eventos**
- Creación de eventos por parte de usuarios autorizados.
- Exposición de eventos activos mediante endpoints públicos/privados.

✅ **Gestión de tickets**
- Generación de tickets con códigos únicos (QR con token JWT).
- Verificación de tickets al ingreso del evento (estado, validez, evento correcto).
- Marcado de tickets como usados para evitar reuso fraudulento.

✅ **Seguridad**
- Validación de datos con **DTOs** antes de procesar cualquier solicitud.
- Firma y verificación de tokens con **HMAC SHA256** y clave secreta.
- Protección de rutas con middleware de autenticación.

---

## 🛠 **Tecnologías utilizadas**

| Tecnología           | Propósito                                   |
|-----------------------|---------------------------------------------|
| **Node.js + Express** | API REST backend                           |
| **TypeScript**        | Tipado fuerte para mayor robustez          |
| **TypeORM**           | ORM para base de datos relacional          |
| **JWT (jsonwebtoken)**| Generación y validación de tokens          |
| **DTOs** | Validación de datos entrantes         |
| **MVC**               | Separación clara de responsabilidades      |

---

## ⚙ **Flujo típico de uso**

**Login**
- El usuario inicia sesión desde la app.
- La app envía las credenciales al endpoint `/login`.
- El backend valida los datos, genera un **token JWT** y responde.
- La app guarda el token para futuras solicitudes autenticadas.

**Compra de entradas**
- El usuario compra una entrada.
- El backend registra el ticket en la base de datos.
- El backend genera un token único para el ticket (firmado digitalmente).
- El backend responde con el QR/token para la app.

**Escaneo y validación**
- El QR Scanner envía el token y el ID del evento al backend.
- El backend:
  - Valida la firma del token.
  - Verifica que el ticket corresponda al evento correcto.
  - Verifica que el ticket esté activo.
  - Marca el ticket como usado.
  - Responde con el resultado de la validación.

---

## 🔐 **Seguridad**

- Los tokens JWT se firman usando **HMAC SHA256** y una clave secreta del servidor.
- Esto garantiza:
  - Que el ticket no ha sido modificado.
  - Que el ticket proviene del sistema TicketHub.
  - Que tickets falsificados son detectados y rechazados.

- El backend valida en cada escaneo:
  - Que el ticket pertenece al evento correcto.
  - Que el ticket no fue usado previamente.

---

## 🌱 **Arquitectura técnica**

- **Modularidad:** Separación en controladores, servicios, repositorios y entidades.
- **Escalable:** Preparado para integrarse con nuevos módulos (por ejemplo: web, nuevos roles).
- **Mantenible:** Uso de TypeScript, DTOs y validadores para minimizar errores.

---

## 👨‍💻 **Desarrolladores**

| Nombre                       | Rol                |
|-------------------------------|-------------------|
| Jairo Andrés Gómez Cardona     | Backend Developer |
| Juan Camilo Diaz Valencia      | Backend Developer |
| Juan David Rojas Narvaez       | Backend Developer |
| Jhony Fernando Duque Villada   | Backend Developer |
| Carlos Stiven Ruiz Rojas       | Backend Developer |

---

## 🎓 **Proyecto académico**

> _Desarrollo de Aplicaciones Móviles_  
> **Universidad del Valle**  
> _Semestre: 2025-1_

---

## 📌 **Repositorio**

> Este repositorio contiene el **backend de TicketHub**.  
> El **frontend** y el **QR Scanner** se desarrollaron como módulos independientes.
