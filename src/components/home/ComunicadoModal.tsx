import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/components/ComunicadoModal.css';

export default function ComunicadoModal() {
  const { t } = useTranslation();
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
    <div 
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comunicado-dialog-title"
    >
      <div className="modal-content fade-in slide-up">
        <div className="modal-header">
          <h3 id="comunicado-dialog-title">{t('comunicado.important', 'Importante')}</h3>
          <button 
            className="close-button" 
            onClick={handleClose}
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <h2 className="comunicado-title">{t('comunicado.title', 'COMUNICADO')}</h2>
          <p className="comunicado-subtitle">{t('comunicado.subtitle', 'Estimados usuarios, antes de realizar su compra, tenga en cuenta lo siguiente:')}</p>
          
          <ul className="comunicado-list">
            <li>{t('comunicado.item1', 'La compra de pasajes debe realizarse a nombre de la persona que hará uso del servicio.')}</li>
            <li>{t('comunicado.item2', 'Los menores de edad que viajen sin sus padres deberán contar con la autorización notarial correspondiente.')}</li>
            <li>{t('comunicado.item3', 'Está prohibido realizar el viaje bajo los efectos de alcohol o cualquier estupefaciente.')}</li>
          </ul>
          
          <p className="comunicado-footer">
            {t('comunicado.footer', 'Recuerde que su compra está sujeta a los términos y condiciones establecidos por la empresa y publicados en esta página.')}
          </p>
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-primary modal-close-btn" onClick={handleClose}>
            {t('common.close', 'Cerrar')}
          </button>
        </div>
      </div>
    </div>
  );
}
