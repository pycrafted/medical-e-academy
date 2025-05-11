const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyAdmin, verifyToken } = require('../middleware/auth'); // Ajouter verifyToken
require('dotenv').config();

// Inscription
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  if (!['patient', 'doctor', 'assistant', 'admin', 'researcher'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide' });
  }

  // Vérifier si l'email existe déjà
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Hacher le mot de passe
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insérer l'utilisateur
    db.query(
      'INSERT INTO users (name, email, password, role, is_default_password) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, false],
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de l’inscription' });
        }
        res.status(201).json({ message: 'Inscription réussie' });
      }
    );
  });
});

// Connexion
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  // Vérifier l'utilisateur
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length === 0) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = results[0];

    // Vérifier le mot de passe
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_default_password: user.is_default_password,
      },
    });
  });
});

// Créer un utilisateur par un administrateur
router.post('/create-user', verifyAdmin, (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  if (!['doctor', 'assistant', 'researcher'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide. Seuls les rôles médecin, assistant ou chercheur sont autorisés.' });
  }

  // Vérifier si l'email existe déjà
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Hacher le mot de passe
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insérer l'utilisateur
    db.query(
      'INSERT INTO users (name, email, password, role, is_default_password) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, false],
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de la création de l’utilisateur' });
        }
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
      }
    );
  });
});

// Lister les utilisateurs (pour AdminDashboard)
router.get('/users', verifyAdmin, (req, res) => {
  db.query('SELECT id, name, email, role FROM users', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Supprimer un utilisateur
router.delete('/users/:id', verifyAdmin, (req, res) => {
  const userId = req.params.id;

  db.query('DELETE FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur supprimé avec succès' });
  });
});

// Lister les médecins (pour le formulaire de création de patient)
router.get('/doctors', (req, res) => {
  db.query('SELECT id, name, email FROM users WHERE role = "doctor"', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// Changer le mot de passe
router.post('/change-password', verifyToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Mot de passe actuel et nouveau requis' });
  }

  // Vérifier l'utilisateur
  db.query('SELECT * FROM users WHERE id = ?', [user.id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const dbUser = results[0];

    // Vérifier le mot de passe actuel
    if (!bcrypt.compareSync(currentPassword, dbUser.password)) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Hacher le nouveau mot de passe
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    // Mettre à jour le mot de passe et is_default_password
    db.query(
      'UPDATE users SET password = ?, is_default_password = ? WHERE id = ?',
      [hashedNewPassword, false, user.id],
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
        }
        res.json({ message: 'Mot de passe changé avec succès' });
      }
    );
  });
});

module.exports = router;