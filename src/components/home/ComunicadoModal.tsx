import { useState, useEffect } from 'react';
import '../../styles/components/ComunicadoModal.css';

export default function ComunicadoModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verificar si ya se mostró en esta sesión
    const hasSeenModal = sessionStorage.getItem('hasSeenComunicado');
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenComunicado', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in slide-up">
        <div className="modal-header">
          <h3>Importante</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <h2 className="comunicado-title">COMUNICADO</h2>
          <p className="comunicado-subtitle">Estimados usuarios, antes de realizar su compra, tenga en cuenta lo siguiente:</p>
          
          <ul className="comunicado-list">
            <li>La compra de pasajes debe realizarse a nombre de la persona que hará uso del servicio.</li>
            <li>Los menores de edad que viajen sin sus padres deberán contar con la autorización notarial correspondiente.</li>
            <li>Está prohibido realizar el viaje bajo los efectos de alcohol o cualquier estupefaciente.</li>
          </ul>
          
          <p className="comunicado-footer">
            Recuerde que su compra está sujeta a los términos y condiciones establecidos por la empresa y publicados en esta página.
          </p>
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
