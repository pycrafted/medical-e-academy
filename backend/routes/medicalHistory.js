// backend/routes/medicalHistory.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyDoctor, verifyToken } = require('../middleware/auth');

// Ajouter un élément à l'historique médical
router.post('/', verifyDoctor, async (req, res) => {
  const { patient_id, condition_name, diagnosis_date, status, notes } = req.body;

  try {
    await db.promise().query(
      'INSERT INTO medical_history (patient_id, doctor_id, condition_name, diagnosis_date, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [patient_id, req.user.id, condition_name, diagnosis_date, status, notes]
    );
    res.status(201).json({ message: 'Historique médical mis à jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir l'historique médical d'un patient
router.get('/:patient_id', verifyToken, async (req, res) => {
  const patientId = req.params.patient_id;
  const user = req.user;

  try {
    // Vérifier les permissions
    if (user.role === 'patient' && user.id !== parseInt(patientId)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const [results] = await db.promise().query(
      'SELECT * FROM medical_history WHERE patient_id = ? ORDER BY diagnosis_date DESC',
      [patientId]
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;