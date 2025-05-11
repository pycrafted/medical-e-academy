// backend/index.js - Ajouter la nouvelle route
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const dicomRoutes = require('./routes/dicom');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const medicalHistoryRoutes = require('./routes/medicalHistory'); // Nouveau

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/dicom', dicomRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/medical-history', medicalHistoryRoutes); // Nouveau

app.get('/', (req, res) => {
  res.send('Bienvenue sur MediConnect Backend !');
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});