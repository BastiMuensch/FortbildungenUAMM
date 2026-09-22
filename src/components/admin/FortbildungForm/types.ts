/** Daten, die die Serverseite an das Formular reicht. */

export interface OrtOption {
  id: string;
  name: string;
  ort: string | null;
  istOnline: boolean;
}

export interface KompetenzOption {
  code: string;
  titel: string;
  istPlatzhalter: boolean;
}

export interface KompetenzBereichOption {
  code: string;
  titel: string;
  beschreibung: string | null;
  children: KompetenzOption[];
}

export interface BezirkOption {
  id: string;
  name: string;
  pflichtSchlagworte: string[];
}

export interface ReferentOption {
  bezirkIds: string[];
  id: string;
  vorname: string;
  nachname: string;
  organisation: string | null;
}

/** Vorbelegung beim Bearbeiten. */
export interface FortbildungWerte {
  bezirkId: string;
  id: string;
  titel: string;
  kurztitel: string | null;
  beschreibungHtml: string;
  organisationsform: string;
  maxTn: number;
  format: string;
  beginn: Date;
  ende: Date;
  veranstaltungsortId: string;
  schularten: string[];
  fach: string | null;
  niveaustufe: string | null;
  fibsLehrgangsnummer: string | null;
  fibsUrl: string | null;
  status: string;
  kompetenzCodes: string[];
  schlagwortNamen: string[];
  referentIds: string[];
}
