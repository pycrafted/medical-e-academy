const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Prendre un rendez-vous
router.post('/', (req, res) => {
  const { patient_id, doctor_id, appointment_date } = req.body;

  if (!patient_id || !doctor_id || !appointment_date) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  db.query(
    'INSERT INTO appointments (patient_id, doctor_id, appointment_date) VALUES (?, ?, ?)',
    [patient_id, doctor_id, appointment_date],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la création du rendez-vous' });
      }
      res.status(201).json({ message: 'Rendez-vous créé' });
    }
  );
});

// Lister les rendez-vous d’un patient ou médecin
router.get('/', (req, res) => {
  const user = req.user;
  let query = 'SELECT * FROM appointments WHERE';
  let params = [];

  if (user.role === 'patient') {
    query += ' patient_id = ?';
    params.push(user.id);
  } else if (user.role === 'doctor') {
    query += ' doctor_id = ?';
    params.push(user.id);
  } else {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

module.exports = router;