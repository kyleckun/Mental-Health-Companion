// src/components/Chat/CrisisAlert.tsx
import React from 'react';

interface CrisisAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

const CrisisAlert: React.FC<CrisisAlertProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  };

  const modalStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'slideIn 0.3s ease-out',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#dc2626',
    margin: 0,
  };

  const contentStyle: React.CSSProperties = {
    marginBottom: '24px',
    lineHeight: '1.6',
    color: '#374151',
  };

  const hotlineStyle: React.CSSProperties = {
    background: '#fef2f2',
    border: '2px solid #fca5a5',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  };

  const hotlineItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#991b1b',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
  };

  const buttonStyle = (primary: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: primary ? '#dc2626' : '#e5e7eb',
    color: primary ? 'white' : '#374151',
  });

  return (
    <>
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={headerStyle}>
            <span style={{ fontSize: '32px' }}>!</span>
            <h2 style={titleStyle}>Crisis Support</h2>
          </div>

          <div style={contentStyle}>
            <p>
              <strong>We're here to help.</strong> If you're experiencing a mental health
              crisis or having thoughts of self-harm, please reach out to these
              professional support services immediately:
            </p>
          </div>

          <div style={hotlineStyle}>
            <div style={hotlineItemStyle}>
              <span>PHONE</span>
              <div>
                <div>Emergency Services</div>
                <div style={{ fontSize: '20px', color: '#dc2626' }}>000</div>
              </div>
            </div>

            <div style={hotlineItemStyle}>
              <span>TEXT</span>
              <div>
                <div>Lifeline Australia</div>
                <div style={{ fontSize: '20px', color: '#dc2626' }}>13 11 14</div>
              </div>
            </div>

            <div style={hotlineItemStyle}>
              <span>SUPPORT</span>
              <div>
                <div>Beyond Blue</div>
                <div style={{ fontSize: '20px', color: '#dc2626' }}>1300 22 4636</div>
              </div>
            </div>

            <div style={hotlineItemStyle}>
              <span>HELP</span>
              <div>
                <div>Suicide Call Back Service</div>
                <div style={{ fontSize: '20px', color: '#dc2626' }}>1300 659 467</div>
              </div>
            </div>
          </div>

          <div style={contentStyle}>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              These services are available 24/7 and provide free, confidential support.
              You don't have to face this alone.
            </p>
          </div>

          <div style={buttonContainerStyle}>
            <button style={buttonStyle(true)} onClick={onClose}>
              I Understand
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default CrisisAlert;