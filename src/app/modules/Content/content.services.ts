import httpStatus from "http-status";
import { AppError } from "../../errors";
import { Content } from "./content.model";
import type { ContentType, IContent } from "./content.interface";

const DEFAULT_CONTENTS: Record<ContentType, { title: string; content: string }> = {
   impressum: {
      title: "Impressum / Legal Notice",
      content: `<h3>Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</h3>
<p><strong>MedRide Technologies GmbH</strong><br />Musterstraße 42<br />10115 Berlin, Deutschland</p>
<h3>Kontakt</h3>
<p>Telefon: +49 (0) 30 12345678<br />E-Mail: legal@medride-transport.de<br />Website: https://medride-transport.de</p>
<h3>Vertreten durch</h3>
<p>Geschäftsführung: Max Mustermann</p>
<h3>Registereintrag</h3>
<p>Eintragung im Handelsregister.<br />Registergericht: Amtsgericht Charlottenburg (Berlin)<br />Registernummer: HRB 123456 B</p>
<h3>Umsatzsteuer-ID</h3>
<p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />DE 123 456 789</p>
<h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
<p>Max Mustermann<br />Musterstraße 42, 10115 Berlin</p>
<h3>EU-Streitschlichtung</h3>
<p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer">https://ec.europa.eu/consumers/odr/</a>. Wir sind nicht verpflichtet oder bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>`,
   },
   terms: {
      title: "Allgemeine Geschäftsbedingungen (Terms of Service)",
      content: `<h3>1. Geltungsbereich und Vertragsgegenstand</h3>
<p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle über die Plattform MedRide vermittelten oder gebuchten qualifizierten und nicht-qualifizierten Krankenfahrten sowie Patiententransporte.</p>
<h3>2. Leistungsbeschreibung</h3>
<p>MedRide stellt eine Buchungs- und Vermittlungsplattform bereit, über welche Patienten, Angehörige und medizinische Einrichtungen qualifizierte Transportunternehmen (Krankenfahrdienste) für Fahrten zum Arzt, ins Krankenhaus, zur Dialyse oder Reha beauftragen können.</p>
<h3>3. Abrechnung mit gesetzlichen Krankenkassen (GKV)</h3>
<p>Für Fahrten im Rahmen der gesetzlichen Krankenversicherung ist das Vorliegen einer gültigen ärztlichen Verordnung (Muster 4) zwingend erforderlich. Sofern keine gesetzliche Zuzahlungsbefreiung vorliegt, ist der gesetzliche Eigenanteil (10%, min. 5 €, max. 10 € je Fahrt) zu entrichten.</p>
<h3>4. Privatfahrten und Zahlungsbedingungen</h3>
<p>Bei privaten Buchungen ohne Kostenübernahmeerklärung der Krankenkasse gilt der vor Fahrtantritt ausgewiesene bzw. mit dem ausführenden Transportunternehmen vereinbarte Tarif.</p>
<h3>5. Stornierungen und Wartezeiten</h3>
<p>Stornierungen bis zu 2 Stunden vor der geplanten Abholzeit sind in der Regel kostenfrei. Bei späteren Stornierungen oder Nichterscheinen kann eine Ausfallpauschale berechnet werden.</p>
<h3>6. Haftungsbeschränkung</h3>
<p>MedRide haftet nach den gesetzlichen Bestimmungen für Vorsatz und grobe Fahrlässigkeit. Für die ordnungsgemäße Durchführung der Personenbeförderung haftet das jeweils beauftragte und zugelassene Transportunternehmen.</p>`,
   },
   privacy: {
      title: "Datenschutzerklärung (Privacy Policy)",
      content: `<h3>1. Datenschutz auf einen Blick</h3>
<p>Der Schutz Ihrer persönlichen und insbesondere gesundheitsbezogenen Daten hat für uns höchste Priorität. Diese Datenschutzerklärung informiert Sie darüber, welche Daten wir erheben und wie wir sie nutzen.</p>
<h3>2. Verantwortliche Stelle</h3>
<p>MedRide Technologies GmbH<br />Musterstraße 42, 10115 Berlin<br />E-Mail: datenschutz@medride-transport.de</p>
<h3>3. Erhebung und Verarbeitung personenbezogener Daten</h3>
<p>Wir verarbeiten personenbezogene Daten (z. B. Name, Anschrift, Telefonnummer, E-Mail-Adresse) sowie Gesundheitsdaten (Transportart, z. B. sitzend, Rollstuhl, Verordnungsstatus Muster 4) ausschließlich zur Vermittlung, Disposition und Durchführung von Krankenfahrten gemäß Art. 6 Abs. 1 lit. b DSGVO sowie Art. 9 Abs. 2 lit. h DSGVO.</p>
<h3>4. Weitergabe an Transportunternehmen</h3>
<p>Zur Durchführung Ihres Fahrauftrags übermitteln wir die erforderlichen Abhol- und Zielinformationen an das von Ihnen ausgewählte bzw. disponierte Partnerunternehmen.</p>
<h3>5. Cookies und Einwilligungsmanagement</h3>
<p>Unsere Website verwendet essenzielle Cookies, die für den Betrieb der Plattform erforderlich sind, sowie optionale Analyse-Cookies. Sie können Ihre Cookie-Einstellungen jederzeit über den Link 'Cookie Settings' im Footer anpassen oder widerrufen.</p>
<h3>6. Ihre Rechte</h3>
<p>Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Berichtigung, Sperrung oder Löschung sowie das Recht auf Datenübertragbarkeit.</p>`,
   },
};

const upsertContent = async (payload: IContent) => {
   const { type, title, content, updatedBy } = payload;
   const result = await Content.findOneAndUpdate(
      { type },
      { title, content, updatedBy },
      { new: true, upsert: true, runValidators: true }
   );
   return result;
};

const getContentByType = async (type: ContentType) => {
   let doc = await Content.findOne({ type });

   // If not yet saved in DB, return default template and optionally seed
   if (!doc && DEFAULT_CONTENTS[type]) {
      doc = await Content.create({
         type,
         title: DEFAULT_CONTENTS[type].title,
         content: DEFAULT_CONTENTS[type].content,
      });
   }

   if (!doc) {
      throw new AppError(httpStatus.NOT_FOUND, `Content for '${type}' not found!`);
   }

   return doc;
};

const getAllContents = async () => {
   // Seed all defaults if not existing
   const types: ContentType[] = ["impressum", "terms", "privacy"];
   for (const type of types) {
      const exists = await Content.findOne({ type });
      if (!exists && DEFAULT_CONTENTS[type]) {
         await Content.create({
            type,
            title: DEFAULT_CONTENTS[type].title,
            content: DEFAULT_CONTENTS[type].content,
         });
      }
   }

   return Content.find();
};

export const ContentServices = {
   upsertContent,
   getContentByType,
   getAllContents,
};

