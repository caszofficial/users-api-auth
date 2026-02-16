# Users API (Node.js + SQL) ✅

API REST simple para portafolio: **registro/login**, **hash de contraseñas**, **JWT**, y **CRUD protegido** sobre usuarios.

- Node.js + Express
- PostgreSQL (SQL)
- bcrypt (hash)
- JWT (auth)

## 1) Requisitos

- Node 18+
- PostgreSQL 13+

## 2) Instalación

```bash
npm install
cp .env.example .env
```

# Antes de Ejecutar

## 1) Crear BD y tabla

 Crea la base de datos (ejemplo):

```sql
CREATE DATABASE users_api;
```

## 2) Ejecuta el siguiente comando
```bash
node db/init.js
```

## 3) Correr el servidor

```bash
npm run dev
# o
npm start
```

Servidor por defecto: `http://localhost:3000`

## 3) Endpoints

### Auth

**POST** `/api/auth/register`

Body:
```json
{ "name": "Santi", "email": "santi@mail.com", "password": "12345678" }
```

**POST** `/api/auth/login`

Body:
```json
{ "email": "santi@mail.com", "password": "12345678" }
```

Respuesta (ambos):
```json
{ "user": { "id": "...", "name": "...", "email": "...", "role": "user" }, "token": "..." }
```

### Users (Protegido con JWT)

Header:
```
Authorization: Bearer <TOKEN>
```

**GET** `/api/users/me` → tu usuario

**GET** `/api/users` → lista usuarios (**solo admin**)

**GET** `/api/users/:id` → self o admin

**PATCH** `/api/users/:id` → self o admin

Body (ejemplos):
```json
{ "name": "Nuevo Nombre" }
```

> Cambiar `role` solo lo puede hacer un **admin**.

**DELETE** `/api/users/:id` → self o admin

