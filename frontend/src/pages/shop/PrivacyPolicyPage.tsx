import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={18} className="text-brand-600" />
        <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">Nadační fond České stopy</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Zásady ochrany osobních údajů</h1>
      <p className="text-sm text-slate-400 mb-10">Platné od 1. října 2026 · <a href="https://darek.fondceskestopy.eu" className="hover:text-brand-600">darek.fondceskestopy.eu</a></p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700">

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">1. Správce osobních údajů</h2>
          <p className="text-sm leading-relaxed">
            Správcem osobních údajů je <strong>Nadační fond České stopy</strong>, provozující dárcovskou platformu na adrese{' '}
            <a href="https://darek.fondceskestopy.eu" className="text-brand-600 hover:underline">https://darek.fondceskestopy.eu</a>.
            V případě dotazů nás kontaktujte na e-mailu uvedeném na webu.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">2. Jaké osobní údaje shromažďujeme</h2>
          <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
            <li><strong>Jméno a příjmení</strong> — pro vystavení potvrzení o daru a pro komunikaci</li>
            <li><strong>E-mailová adresa</strong> — pro zaslání potvrzení o daru, aktualit a platebních instrukcí</li>
            <li><strong>Telefonní číslo</strong> — volitelně, pro doručení dárku</li>
            <li><strong>Doručovací adresa</strong> — pokud si vyberete fyzický dárek</li>
            <li><strong>Informace o platbě</strong> — variabilní symbol pro párování platby (číslo účtu ani platební kartu neuchováváme)</li>
            <li><strong>Přihlašovací údaje</strong> — v případě registrace e-mailem (heslo je uloženo v zašifrované podobě); nebo identifikátor z Google/Facebook v případě přihlášení přes OAuth</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">3. Za jakým účelem údaje zpracováváme</h2>
          <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
            <li>Zpracování a evidenci darů a darovacích smluv</li>
            <li>Zaslání potvrzení o přijetí daru (PDF) a platebních instrukcí</li>
            <li>Doručení dárku na zadanou adresu</li>
            <li>Zasílání aktualit od vojenských jednotek (pouze se souhlasem)</li>
            <li>Správu uživatelského účtu</li>
            <li>Plnění zákonných povinností (účetnictví, daňová evidence)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">4. Právní základ zpracování</h2>
          <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
            <li><strong>Plnění smlouvy</strong> (čl. 6 odst. 1 písm. b) GDPR) — zpracování nezbytné pro vyřízení daru a doručení dárku</li>
            <li><strong>Oprávněný zájem</strong> (čl. 6 odst. 1 písm. f) GDPR) — vedení evidence darů a komunikace s dárci</li>
            <li><strong>Souhlas</strong> (čl. 6 odst. 1 písm. a) GDPR) — zasílání aktualit a newsletteru; souhlas můžete kdykoli odvolat</li>
            <li><strong>Zákonná povinnost</strong> (čl. 6 odst. 1 písm. c) GDPR) — uchování dokladů pro účetní a daňové účely</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">5. Komu údaje předáváme</h2>
          <p className="text-sm leading-relaxed mb-2">
            Vaše osobní údaje neprodáváme ani nepřenášíme třetím stranám pro marketingové účely. Údaje mohou být sdíleny pouze s:
          </p>
          <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
            <li><strong>Google LLC</strong> — v případě přihlášení přes Google (OAuth)</li>
            <li><strong>Meta Platforms, Inc. (Facebook)</strong> — v případě přihlášení přes Facebook (OAuth)</li>
            <li><strong>Zásilkovna s.r.o.</strong> — při doručení dárku přes Zásilkovnu</li>
            <li><strong>Poskytovatel e-mailových služeb</strong> — pro odesílání potvrzení a notifikací</li>
            <li><strong>Orgány veřejné moci</strong> — pokud to ukládá zákon</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">6. Jak dlouho údaje uchováváme</h2>
          <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
            <li>Záznamy o darech a darovací smlouvy — <strong>10 let</strong> (zákonná povinnost pro účetní doklady)</li>
            <li>Uživatelský účet — po dobu aktivního používání, poté do odvolání nebo na žádost o výmaz</li>
            <li>E-mailová komunikace — <strong>3 roky</strong> od posledního kontaktu</li>
            <li>Odhlásíte-li se z newsletteru, váš e-mail z odběru okamžitě odstraníme</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">7. Vaše práva</h2>
          <p className="text-sm leading-relaxed mb-2">Jako subjekt údajů máte právo:</p>
          <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
            <li><strong>Přístupu</strong> — požádat o informaci, jaké údaje o vás zpracováváme</li>
            <li><strong>Opravy</strong> — nechat opravit nepřesné údaje (přímo v profilu nebo na požádání)</li>
            <li><strong>Výmazu</strong> — požádat o smazání účtu a osobních údajů (pokud není v rozporu se zákonnou povinností)</li>
            <li><strong>Omezení zpracování</strong> — v zákonem stanovených případech</li>
            <li><strong>Přenositelnosti</strong> — obdržet své údaje ve strojově čitelném formátu</li>
            <li><strong>Odvolání souhlasu</strong> — kdykoli odvolat souhlas se zasíláním newsletteru</li>
            <li><strong>Podání stížnosti</strong> — u Úřadu pro ochranu osobních údajů (uoou.cz)</li>
          </ul>
          <p className="text-sm leading-relaxed mt-3">
            Pro uplatnění práv nás kontaktujte e-mailem. Žádosti vyřizujeme do 30 dnů.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">8. Zabezpečení</h2>
          <p className="text-sm leading-relaxed">
            Veškerá komunikace je šifrována protokolem HTTPS. Hesla jsou uložena výhradně v hashované podobě (bcrypt).
            Přístup k databázi je omezen pouze na autorizované systémy. Pravidelně provádíme zálohy a monitorujeme přístupy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">9. Cookies</h2>
          <p className="text-sm leading-relaxed">
            Platforma používá pouze technické cookies nezbytné pro fungování přihlášení a košíku.
            Nepoužíváme analytické ani marketingové cookies třetích stran.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">10. Změny těchto zásad</h2>
          <p className="text-sm leading-relaxed">
            V případě podstatných změn vás budeme informovat e-mailem nebo oznámením na webu.
            Aktuální verze je vždy dostupná na této stránce.
          </p>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-slate-200">
        <Link to="/" className="text-sm text-brand-600 hover:underline">← Zpět na eshop</Link>
      </div>
    </div>
  );
}
