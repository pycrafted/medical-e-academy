// backend/routes/patients.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyAssistant, verifyDoctor, verifyPatient, verifyToken } = require('../middleware/auth');

// Créer un dossier patient (accessible aux assistants)
router.post('/', verifyAssistant, async (req, res) => {
  const { name, email, date_of_birth, gender, doctor_id, blood_type, allergies } = req.body;

  try {
    // Vérification des champs requis
    if (!name || !email || !date_of_birth || !gender || !doctor_id) {
      return res.status(400).json({ message: 'Tous les champs obligatoires sont requis' });
    }

    // Vérifier si le médecin existe
    const [doctorResults] = await db.promise().query(
      'SELECT id FROM users WHERE id = ? AND role = "doctor"',
      [doctor_id]
    );

    if (doctorResults.length === 0) {
      return res.status(400).json({ message: 'Médecin non trouvé' });
    }

    // Vérifier si l'email existe déjà
    const [userResults] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (userResults.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Hacher le mot de passe par défaut
    const defaultPassword = 'passer@123';
    const hashedPassword = require('bcryptjs').hashSync(defaultPassword, 10);

    // Commencer une transaction
    await db.promise().query('START TRANSACTION');

    // Insérer l'utilisateur
    const [userResult] = await db.promise().query(
      'INSERT INTO users (name, email, password, role, is_default_password) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'patient', true]
    );

    const userId = userResult.insertId;

    // Insérer le patient avec les données médicales
    await db.promise().query(
      'INSERT INTO patients (id, name, email, date_of_birth, gender, doctor_id, blood_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, date_of_birth, gender, doctor_id, blood_type]
    );

    // Insérer les allergies si elles existent
    if (allergies && allergies.length > 0) {
      for (const allergy of allergies) {
        await db.promise().query(
          'INSERT INTO patient_allergies (patient_id, allergy_name, severity) VALUES (?, ?, ?)',
          [userId, allergy.name, allergy.severity]
        );
      }
    }

    // Valider la transaction
    await db.promise().query('COMMIT');

    res.status(201).json({
      message: 'Patient créé avec succès',
      patientId: userId
    });

  } catch (err) {
    // Annuler la transaction en cas d'erreur
    await db.promise().query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création du patient' });
  }
});

// Obtenir le dossier médical complet
router.get('/:id/medical-record', verifyToken, async (req, res) => {
  const patientId = req.params.id;
  const user = req.user;

  try {
    // Vérifier les permissions
    if (user.role === 'patient' && user.id !== parseInt(patientId)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Récupérer les informations de base du patient
    const [patientResults] = await db.promise().query(
      `SELECT p.*, u.name as doctor_name
       FROM patients p
       LEFT JOIN users u ON p.doctor_id = u.id
       WHERE p.id = ?`,
      [patientId]
    );

    if (patientResults.length === 0) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    const patient = patientResults[0];

    // Récupérer les informations médicales
    const [allergies] = await db.promise().query(
      'SELECT * FROM patient_allergies WHERE patient_id = ?',
      [patientId]
    );

    const [prescriptions] = await db.promise().query(
      `SELECT p.*, u.name as doctor_name
       FROM prescriptions p
       LEFT JOIN users u ON p.doctor_id = u.id
       WHERE p.patient_id = ? ORDER BY p.created_at DESC`,
      [patientId]
    );

    const [appointments] = await db.promise().query(
      `SELECT a.*, u.name as doctor_name
       FROM appointments a
       LEFT JOIN users u ON a.doctor_id = u.id
       WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`,
      [patientId]
    );

    const [dicomStudies] = await db.promise().query(
      'SELECT study_instance_uid FROM patient_dicom_studies WHERE patient_id = ?',
      [patientId]
    );

    const [medicalHistory] = await db.promise().query(
      `SELECT m.*, u.name as doctor_name
       FROM medical_history m
       LEFT JOIN users u ON m.doctor_id = u.id
       WHERE m.patient_id = ? ORDER BY m.diagnosis_date DESC`,
      [patientId]
    );

    res.json({
      patientInfo: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        blood_type: patient.blood_type,
        doctor: {
          id: patient.doctor_id,
          name: patient.doctor_name
        }
      },
      medicalData: {
        allergies,
        prescriptions,
        appointments,
        dicomStudies: dicomStudies.map(s => s.study_instance_uid),
        medicalHistory
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Lister les patients d'un médecin
router.get('/', verifyDoctor, async (req, res) => {
  try {
    const [results] = await db.promise().query(
      `SELECT p.id, p.name, p.email, p.date_of_birth, p.gender
       FROM patients p
       WHERE p.doctor_id = ?`,
      [req.user.id]
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;