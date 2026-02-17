import { useState } from 'react';

const STAMP_IMAGE_URL = '/stamp-netsysteme.png';

/**
 * Tampon officiel NETSYSTEME : affiche l'image du tampon si disponible,
 * sinon le tampon dessiné (texte + signature).
 * Utilisé sur les factures, devis et pro forma.
 */
export default function StampNetsysteme({ className = '', size = 'w-36 h-36' }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageFailed) {
    return (
      <div className={`flex-shrink-0 ${className}`}>
        <img
          src={STAMP_IMAGE_URL}
          alt="Tampon Netsysteme - Le Directeur"
          className={`${size} object-contain rounded-full`}
          onError={() => setImageFailed(true)}
          style={{ maxWidth: '144px', maxHeight: '144px' }}
        />
      </div>
    );
  }

  return (
    <div className={`${size} border-[3px] border-blue-900 rounded-full flex flex-col items-center justify-center bg-white relative flex-shrink-0 ${className}`} style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div className="absolute top-2 left-0 right-0 px-2">
        <p className="text-[7px] font-bold text-blue-900 text-center leading-tight" style={{ transform: 'scaleY(0.6)', letterSpacing: '0.5px' }}>
          Netsysteme Informatique et Télécommunication
        </p>
      </div>
      <div className="absolute bottom-5 left-0 right-0 flex justify-between px-8">
        <span className="text-[10px] text-blue-900 font-bold">★</span>
        <span className="text-[10px] text-blue-900 font-bold">★</span>
      </div>
      <div className="flex flex-col items-center justify-center mt-4">
        <div className="w-16 h-12 mb-1 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 40 Q22 18, 38 40 T68 40" stroke="#1e3a8a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 52 Q32 28, 48 52" stroke="#1e3a8a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M52 36 Q62 24, 72 36" stroke="#1e3a8a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
            <path d="M60 48 Q68 40, 76 48" stroke="#1e3a8a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="border-2 border-blue-900 rounded px-2 py-1 mt-1 bg-white">
          <p className="text-[9px] font-bold text-blue-900 text-center leading-tight">Le Directeur</p>
        </div>
        <p className="text-[7px] text-blue-900 text-center mt-0.5 leading-tight">site: www.netsys-info.com</p>
      </div>
    </div>
  );
}
