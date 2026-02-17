/**
 * Tampon officiel SSE (La Sénégalaise de Sécurité et d'Équipement).
 * Affiche l'image du tampon (stamp-sse.png).
 */
const STAMP_IMAGE_URL = '/stamp-sse.png';

export default function StampSSE({ className = '', size = 'w-36 h-36' }) {
  return (
    <div className={`flex-shrink-0 ${className}`}>
      <img
        src={STAMP_IMAGE_URL}
        alt="Tampon SSE - Le Directeur"
        className={`${size} object-contain`}
        style={{ maxWidth: '144px', maxHeight: '144px' }}
      />
    </div>
  );
}
