const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cerca l'utente nel database utilizzando Prisma
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Verifica se l'utente esiste e la password è corretta (assicurati di usare bcrypt per l'hashing delle password)
    if (user && user.password === password) {
      // Genera un token di accesso
      const accessToken = jwt.sign({ userId: user.id, email: user.email }, 'ambra', {
        expiresIn: '1h', // Scadenza del token (puoi impostare il valore desiderato)
      });

      // Invia una risposta di successo al client con il token di accesso
      res.json({ success: true, message: 'Login avvenuto con successo!', accessToken });
    } else {
      // Invia una risposta di errore se le credenziali non sono valide
      res.status(401).json({ success: false, message: 'Credenziali non valide.' });
    }
  } catch (error) {
    console.error('Errore durante il login:', error);
    res.status(500).json({ success: false, message: 'Errore durante il login.' });
  }
});

module.exports = router;
