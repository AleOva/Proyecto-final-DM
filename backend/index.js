const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { sql, poolPromise } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Límite amplio para recibir fotos en Base64

// 1. ENDPOINT DE REGISTRO
app.post('/api/registro', async (req, res) => {
  const { nombre, correo, password } = req.body;
  try {
    const pool = await poolPromise;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.request()
      .input('nombre', sql.VarChar, nombre)
      .input('correo', sql.VarChar, correo)
      .input('password', sql.VarChar, hashedPassword)
      .query('INSERT INTO usuarios (nombre, correo, password) VALUES (@nombre, @correo, @password)');

    res.status(201).json({ ok: true, mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'El correo ya existe o hubo un error en el servidor.' });
  }
});

// 2. ENDPOINT DE LOGIN
app.post('/api/login', async (req, res) => {
  const { correo, password } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('correo', sql.VarChar, correo)
      .query('SELECT * FROM usuarios WHERE correo = @correo');

    if (result.recordset.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    const usuario = result.recordset[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ ok: false, mensaje: 'Contraseña incorrecta' });
    }

    res.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        imagen_perfil: usuario.imagen_perfil
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ENDPOINT DE PRUEBA DE CONEXIÓN
app.get('/api/test', (req, res) => {
  res.json({ message: '¡Conexión exitosa a SQL Server!' });
});

// 3. ENDPOINT PARA ACTUALIZAR IMAGEN (EN BASE64 EN LA BD)
app.put('/api/usuario/:id/imagen', async (req, res) => {
  const { id } = req.params;
  const { imagen } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('imagen', sql.VarChar(sql.MAX), imagen)
      .query('UPDATE usuarios SET imagen_perfil = @imagen WHERE id = @id');

    res.json({ ok: true, mensaje: 'Imagen actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});