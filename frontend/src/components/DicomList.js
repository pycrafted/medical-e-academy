import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DicomViewer from './DicomViewer';

function DicomList() {
  const [studies, setStudies] = useState([]);
  const [error, setError] = useState('');
  const [selectedStudy, setSelectedStudy] = useState(null);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dicom/studies');
        console.log('Études récupérées:', response.data);
        setStudies(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des images DICOM');
        console.error('Erreur fetchStudies:', err);
      }
    };
    fetchStudies();
  }, []);

  return (
    <div className="dicom-list">
      <h2>Bibliothèque d’images DICOM</h2>
      {error && <p className="error">{error}</p>}

      <div className="card">
        {studies.length === 0 ? (
          <p>Aucune image DICOM disponible pour le moment.</p>
        ) : (
          <div>
            <ul>
              {studies.map((studyId) => (
                <li key={studyId}>
                  Étude ID: {studyId}{' '}
                  <button onClick={() => setSelectedStudy(studyId)}>
                    Visualiser
                  </button>
                </li>
              ))}
            </ul>
            {selectedStudy && (
              <div>
                <h3>Visualisation de l’étude {selectedStudy}</h3>
                <DicomViewer studyId={selectedStudy} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DicomList;