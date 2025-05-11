const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyDoctor, verifyToken } = require('../middleware/auth');

// Créer une prescription (médecins uniquement)
router.post('/', verifyDoctor, (req, res) => {
  const { patient_id, medication, dosage, instructions } = req.body;

  if (!patient_id || !medication || !dosage || !instructions) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  db.query(
    'INSERT INTO prescriptions (patient_id, doctor_id, medication, dosage, instructions) VALUES (?, ?, ?, ?, ?)',
    [patient_id, req.user.id, medication, dosage, instructions],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la création de la prescription' });
      }
      res.status(201).json({ message: 'Prescription créée' });
    }
  );
});

// Consulter les prescriptions
router.get('/:patient_id', verifyToken, (req, res) => {
  const patientId = req.params.patient_id;
  const user = req.user;

  let query = 'SELECT * FROM prescriptions WHERE patient_id = ?';
  let params = [patientId];

  if (user.role === 'patient') {
    query += ' AND patient_id = ?';
    params.push(user.id);
  } else if (user.role === 'doctor') {
    query += ' AND doctor_id = ?';
    params.push(user.id);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

module.exports = router;