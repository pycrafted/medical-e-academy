import React, { useState } from 'react';
import axios from 'axios';

function DicomUpload({ patientId, onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Veuillez sélectionner au moins un fichier DICOM');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('patient_id', patientId);
    files.forEach((file) => {
      formData.append('dicomFiles', file);
    });

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/dicom/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Fichiers DICOM uploadés avec succès');
      setFiles([]);
      setError('');
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l’upload des fichiers');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dicom-upload">
      <h3>Uploader des fichiers DICOM pour le patient</h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Sélectionner les fichiers DICOM :</label>
          <input
            type="file"
            accept=".dcm,application/dicom"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
        <button type="submit" disabled={uploading || files.length === 0}>
          {uploading ? 'Upload en cours...' : 'Uploader'}
        </button>
      </form>
    </div>
  );
}

export default DicomUpload;