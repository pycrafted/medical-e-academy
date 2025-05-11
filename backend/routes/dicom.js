const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const db = require('../config/db');
const { verifyDoctor, verifyToken } = require('../middleware/auth');
require('dotenv').config();

const upload = multer({ storage: multer.memoryStorage() });

const auth = {
  auth: {
    username: process.env.ORTHANC_USER,
    password: process.env.ORTHANC_PASSWORD,
  },
};

// Fonction utilitaire pour convertir db.query en promesse
const queryPromise = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

router.get('/studies', async (req, res) => {
  try {
    const studiesResponse = await axios.get(`${process.env.ORTHANC_URL}/studies`, auth);
    const orthancIds = studiesResponse.data;

    const studies = [];
    for (const orthancId of orthancIds) {
      const studyResponse = await axios.get(`${process.env.ORTHANC_URL}/studies/${orthancId}`, auth);
      const studyData = studyResponse.data;
      const studyInstanceUID = studyData.MainDicomTags.StudyInstanceUID;
      if (studyInstanceUID) {
        studies.push(studyInstanceUID);
      }
    }
    res.json(studies);
  } catch (err) {
    console.error('Erreur Orthanc:', err.message);
    res.status(500).json({ message: 'Erreur lors de la récupération des études' });
  }
});

router.post('/upload', verifyDoctor, upload.array('dicomFiles'), async (req, res) => {
  try {
    const { patient_id } = req.body;
    if (!patient_id) {
      return res.status(400).json({ message: 'patient_id est requis' });
    }

    // Vérifier que le patient appartient au médecin
    const patientResults = await queryPromise(
      'SELECT id FROM patients WHERE id = ? AND doctor_id = ?',
      [patient_id, req.user.id]
    );
    if (patientResults.length === 0) {
      return res.status(403).json({ message: 'Accès non autorisé à ce patient' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Aucun fichier DICOM fourni' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const response = await axios.post(`${process.env.ORTHANC_URL}/instances`, file.buffer, {
        ...auth,
        headers: { 'Content-Type': 'application/dicom' },
      });
      return response.data;
    });

    const results = await Promise.all(uploadPromises);
    const instanceId = results[0].ID;
    const studyResponse = await axios.get(`${process.env.ORTHANC_URL}/instances/${instanceId}/study`, auth);
    const studyInstanceUID = studyResponse.data.MainDicomTags.StudyInstanceUID;

    // Associer l'étude au patient
    await queryPromise(
      'INSERT INTO patient_dicom_studies (patient_id, study_instance_uid) VALUES (?, ?)',
      [patient_id, studyInstanceUID]
    );

    res.status(201).json({ message: 'Fichiers DICOM uploadés et associés au patient', studyInstanceUID });
  } catch (err) {
    console.error('Erreur lors de l’upload vers Orthanc:', err.message);
    res.status(500).json({ message: 'Erreur lors de l’upload des fichiers DICOM' });
  }
});

router.get('/patient/:patient_id', verifyToken, async (req, res) => {
  try {
    const patientId = req.params.patient_id;
    const user = req.user;

    let query = 'SELECT study_instance_uid FROM patient_dicom_studies WHERE patient_id = ?';
    let params = [patientId];

    if (user.role === 'patient') {
      if (user.id !== parseInt(patientId)) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
    } else if (user.role === 'doctor') {
      query += ' AND patient_id IN (SELECT id FROM patients WHERE doctor_id = ?)';
      params.push(user.id);
    } else {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const results = await queryPromise(query, params);
    const studies = results.map((row) => row.study_instance_uid);
    res.json(studies);
  } catch (err) {
    console.error('Erreur lors de la récupération des études du patient:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;