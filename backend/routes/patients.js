const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { verifyAssistant, verifyDoctor, verifyPatient, verifyToken } = require('../middleware/auth');

// Créer un dossier patient (accessible uniquement aux assistants)
router.post('/', verifyAssistant, (req, res) => {
  const { name, email, date_of_birth, gender, doctor_id } = req.body;

  if (!name || !email || !date_of_birth || !gender || !doctor_id) {
    return res.status(400).json({ message: 'Tous les champs sont requis, y compris l’ID du médecin' });
  }

  // Vérifier si le médecin existe
  db.query('SELECT id FROM users WHERE id = ? AND role = "doctor"', [doctor_id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length === 0) {
      return res.status(400).json({ message: 'Médecin non trouvé' });
    }

    // Vérifier si l'email existe déjà dans users
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, userResults) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (userResults.length > 0) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }

      // Hacher le mot de passe par défaut
      const defaultPassword = 'passer@123';
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

      // Insérer l'utilisateur avec le mot de passe par défaut
      db.query(
        'INSERT INTO users (name, email, password, role, is_default_password) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, 'patient', true],
        (err, userResult) => {
          if (err) {
            return res.status(500).json({ message: 'Erreur lors de la création de l’utilisateur' });
          }

          const userId = userResult.insertId;

          // Insérer le patient
          db.query(
            'INSERT INTO patients (id, name, email, date_of_birth, gender, doctor_id) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, email, date_of_birth, gender, doctor_id],
            (err, patientResult) => {
              if (err) {
                // Supprimer l'utilisateur créé en cas d'erreur
                db.query('DELETE FROM users WHERE id = ?', [userId]);
                return res.status(500).json({ message: 'Erreur lors de la création du patient' });
              }
              res.status(201).json({ message: 'Patient créé', patientId: userId });
            }
          );
        }
      );
    });
  });
});

// Consulter un dossier patient (accessible au patient ou au médecin assigné)
router.get('/:id', verifyToken, (req, res) => {
  const patientId = req.params.id;
  const user = req.user; // Via middleware verifyToken

  let query = 'SELECT * FROM patients WHERE id = ?';
  let params = [patientId];

  if (user.role === 'patient') {
    query += ' AND id = ?';
    params.push(user.id);
  } else if (user.role === 'doctor') {
    query += ' AND doctor_id = ?';
    params.push(user.id);
  } else {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Patient non trouvé ou accès non autorisé' });
    }
    res.json(results[0]);
  });
});

// Lister les patients assignés à un médecin
router.get('/', verifyDoctor, (req, res) => {
  const user = req.user;

  db.query('SELECT id, name, email, date_of_birth, gender FROM patients WHERE doctor_id = ?', [user.id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

module.exports = router;