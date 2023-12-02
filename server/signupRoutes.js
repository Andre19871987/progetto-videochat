// signupRoutes.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Aggiungi qui la logica per gestire la registrazione
router.post('/', async (req, res) => {
    try {
      const { email, password, name, surname, username, phone, address, profileImage } = req.body;
  
      // Esegui la creazione di un nuovo utente nel database utilizzando Prisma
      const newUser = await prisma.user.create({
        data: {
          email,
          password,
          name,
          surname,
          username,
          phone,
          address,
          profileImage,
        },
      });
  
      // Invia una risposta di successo al client
      res.json({ success: true, message: 'Registrazione avvenuta con successo!', user: newUser });
    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      res.status(500).json({ success: false, message: 'Errore durante la registrazione.' });
    }
  });
  
  module.exports = router;