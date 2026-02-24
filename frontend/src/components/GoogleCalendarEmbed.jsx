import { Calendar } from 'lucide-react';
import { GOOGLE_CALENDAR_EMBED_URL } from '../config';

/** URL par défaut : calendrier public (jours fériés France) si aucune URL n'est configurée */
const DEFAULT_CALENDAR_EMBED_URL = 'https://calendar.google.com/calendar/embed?src=fr.french%23holiday%40group.v.calendar.google.com&ctz=Africa%2FDakar';

const GoogleCalendarEmbed = () => {
  const embedUrl = GOOGLE_CALENDAR_EMBED_URL || DEFAULT_CALENDAR_EMBED_URL;
  const isCustom = Boolean(GOOGLE_CALENDAR_EMBED_URL);

  return (
    <div className="card p-0 overflow-hidden border-none shadow-2xl">
      <div className="py-3 px-4 border-b border-slate-100 bg-white flex items-center justify-center sm:justify-start">
        <div className="p-2 rounded-xl bg-primary-100 text-primary-600" title="Calendrier">
          <Calendar className="w-5 h-5" />
        </div>
      </div>
      {!isCustom && (
        <div className="bg-amber-50 border-b border-amber-200/60 p-4 sm:p-5">
          <h3 className="text-sm font-bold text-amber-900 mb-2">Comment configurer votre calendrier Google</h3>
          <ol className="text-sm text-amber-900/90 space-y-1.5 list-decimal list-inside">
            <li>Ouvrez <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Calendar</a> sur ordinateur.</li>
            <li>À gauche, cliquez sur le calendrier à afficher → <strong>Paramètres et partage</strong> (ou les 3 points).</li>
            <li>Descendez à la section <strong>« Intégrer le calendrier »</strong>.</li>
            <li>Copiez l’URL indiquée dans le cadre (celle qui commence par <code className="bg-amber-100/80 px-1 rounded text-xs">https://calendar.google.com/calendar/embed?src=...</code>).</li>
            <li>Dans le dossier <strong>frontend</strong> du projet, ouvrez le fichier <code className="bg-amber-100/80 px-1 rounded text-xs">.env</code> (créez-le à partir de <code className="bg-amber-100/80 px-1 rounded text-xs">.env.example</code> s’il n’existe pas).</li>
            <li>Ajoutez ou modifiez la ligne (sans espaces autour du <code className="bg-amber-100/80 px-1 rounded text-xs">=</code>) :<br />
              <code className="block mt-1.5 p-2 bg-slate-800 text-slate-100 rounded text-xs overflow-x-auto">VITE_GOOGLE_CALENDAR_EMBED_URL=https://calendar.google.com/calendar/embed?src=VOTRE_ID&amp;ctz=Africa/Dakar</code>
            </li>
            <li>Remplacez par l’URL que vous avez copiée, puis <strong>redémarrez le serveur</strong> (<code className="bg-amber-100/80 px-1 rounded text-xs">npm run dev</code>) ou refaites un build.</li>
          </ol>
          <p className="text-xs text-amber-800/80 mt-3">Le calendrier doit être rendu « accessible à tous » (paramètres de partage) pour être visible dans l’embed.</p>
        </div>
      )}
      <div className="bg-white p-4 sm:p-6">
        <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50" style={{ minHeight: '380px' }}>
          <iframe
            title="Calendrier Google"
            src={embedUrl}
            style={{ border: 0, width: '100%', height: '400px', minHeight: '380px', display: 'block' }}
            frameBorder="0"
            scrolling="no"
            allow="calendar"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarEmbed;
