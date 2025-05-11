const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const dicomRoutes = require('./routes/dicom');
const patientRoutes = require('./routes/patients'); // Nouveau
const appointmentRoutes = require('./routes/appointments'); // Nouveau
const prescriptionRoutes = require('./routes/prescriptions'); // Nouveau

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/dicom', dicomRoutes);
app.use('/api/patients', patientRoutes); // Nouveau
app.use('/api/appointments', appointmentRoutes); // Nouveau
app.use('/api/prescriptions', prescriptionRoutes); // Nouveau

app.get('/', (req, res) => {
  res.send('Bienvenue sur MediConnect Backend !');
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});