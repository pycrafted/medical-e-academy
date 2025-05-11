const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

const verifyDoctor = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Accès réservé aux médecins' });
    }
    next();
  });
};

const verifyPatient = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Accès réservé aux patients' });
    }
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    next();
  });
};

const verifyAssistant = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'assistant') {
      return res.status(403).json({ message: 'Accès réservé aux assistants' });
    }
    next();
  });
};

module.exports = { verifyToken, verifyDoctor, verifyPatient, verifyAdmin, verifyAssistant };