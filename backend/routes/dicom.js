const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

// Configuration de multer pour stocker temporairement les fichiers
const upload = multer({ storage: multer.memoryStorage() });

// Middleware pour ajouter les identifiants Orthanc
const auth = {
  auth: {
    username: process.env.ORTHANC_USER,
    password: process.env.ORTHANC_PASSWORD,
  },
};

// Lister les études (studies)
router.get('/studies', async (req, res) => {
  try {
    // Récupérer la liste des Orthanc IDs
    const studiesResponse = await axios.get(`${process.env.ORTHANC_URL}/studies`, auth);
    const orthancIds = studiesResponse.data;

    // Pour chaque Orthanc ID, récupérer les métadonnées et extraire le StudyInstanceUID
    const studies = [];
    for (const orthancId of orthancIds) {
      const studyResponse = await axios.get(`${process.env.ORTHANC_URL}/studies/${orthancId}`, auth);
      const studyData = studyResponse.data;

      // Extraire le StudyInstanceUID depuis les métadonnées DICOM
      const studyInstanceUID = studyData.MainDicomTags.StudyInstanceUID;
      if (studyInstanceUID) {
        studies.push(studyInstanceUID);
      }
    }

    console.log('StudyInstanceUIDs envoyés:', studies);
    res.json(studies);
  } catch (err) {
    console.error('Erreur Orthanc:', err.message);
    res.status(500).json({ message: 'Erreur lors de la récupération des études' });
  }
});

// Uploader des fichiers DICOM
router.post('/upload', verifyToken, upload.array('dicomFiles'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Aucun fichier DICOM fourni' });
    }

    const uploadPromises = req.files.map(async (file) => {
      // Envoyer chaque fichier DICOM à Orthanc via l'API /instances
      const response = await axios.post(`${process.env.ORTHANC_URL}/instances`, file.buffer, {
        ...auth,
        headers: {
          'Content-Type': 'application/dicom',
        },
      });
      return response.data;
    });

    const results = await Promise.all(uploadPromises);
    res.status(201).json({ message: 'Fichiers DICOM uploadés avec succès', results });
  } catch (err) {
    console.error('Erreur lors de l’upload vers Orthanc:', err.message);
    res.status(500).json({ message: 'Erreur lors de l’upload des fichiers DICOM' });
  }
});

module.exports = router;