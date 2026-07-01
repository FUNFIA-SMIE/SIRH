import { Injectable } from '@angular/core';

interface Pointage {
  date: string; jour: string;
  matin_in: string; matin_out: string;
  apmidi_in: string; apmidi_out: string;
  soir_in: string; soir_out: string;
  statut: string; heures_total?: string;
}

@Injectable({ providedIn: 'root' })
export class ServicePointageService {

  parseRapportXml(xmlText: string): any[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const ns = 'urn:schemas-microsoft-com:office:spreadsheet';

    // récupère uniquement la feuille "Rapports sur place"
    const worksheets = Array.from(doc.getElementsByTagNameNS(ns, 'Worksheet'));
    const ws = worksheets.find(w =>
      w.getAttributeNS(ns, 'Name') === 'Rapports sur place' ||
      w.getAttribute('ss:Name') === 'Rapports sur place'
    );
    if (!ws) return [];

    const table = ws.getElementsByTagNameNS(ns, 'Table')[0];
    const rows = Array.from(table.getElementsByTagNameNS(ns, 'Row'));

    const getCellsText = (row: Element): string[] => {
      const cells = Array.from(row.getElementsByTagNameNS(ns, 'Cell'));
      return cells.map(c => {
        const data = c.getElementsByTagNameNS(ns, 'Data')[0];
        return data?.textContent?.trim() ?? '';
      });
    };

    const employes: any[] = [];
    let i = 0;

    while (i < rows.length) {
      const cells = getCellsText(rows[i]);
      const secteurCell = cells[0] || '';

      if (secteurCell.startsWith('Secteur:')) {
        const secteur = secteurCell.replace('Secteur:', '');
        const nom = (cells[1] || '').replace('Nom:', '');
        const id = (cells[2] || '').replace('ID:', '');

        // ligne plan: "Plan:22(D)  C'est vrai.:17(D) ... Manque:5(D) ..."
        const planLine = getCellsText(rows[i + 1])[0] || '';
        const jours_planifies = +(planLine.match(/Plan:(\d+)/)?.[1] ?? 0);
        const jours_presents = +(planLine.match(/vrai\.:(\d+)/)?.[1] ?? 0);
        const jours_absents = +(planLine.match(/Manque:(\d+)/)?.[1] ?? 0);
        const retardsCount = +(planLine.match(/retard:(\d+)/)?.[1] ?? 0);

        const horaireLine = getCellsText(rows[i + 2])[0] || '';
        const horaireMatch = horaireLine.match(/\((.*?)\)/);

        // IMPORTANT: on lit toute la colonne de gauche d'abord (jours 1 à ~15/16),
        // puis toute la colonne de droite ensuite (jours ~16/17 à fin de mois)
        const pointagesGauche: Pointage[] = [];
        const pointagesDroite: Pointage[] = [];
        let r = i + 5; // saute en-tête + sous-en-tête (IN/OUT)

        while (r < rows.length) {
          const dayCells = getCellsText(rows[r]);
          if (!dayCells[0] || dayCells[0].startsWith('Secteur:') || dayCells.length < 8) break;

          pointagesGauche.push(this.buildPointage(dayCells.slice(0, 8)));

          if (dayCells.length >= 16 && dayCells[8]) {
            pointagesDroite.push(this.buildPointage(dayCells.slice(8, 16)));
          }
          r++;
        }

        const pointages = [...pointagesGauche, ...pointagesDroite];

        employes.push({
          id, matricule: id, nom, prenom: '', secteur,
          poste: '', horaire: horaireMatch?.[1] ?? '',
          jours_planifies, jours_presents, jours_absents, retards: retardsCount,
          heures_total: pointages.reduce((s, p) => s + (+(p.heures_total || 0)), 0).toFixed(1),
          pointages
        });

        i = r;
      } else {
        i++;
      }
    }

    return employes;
  }

  private buildPointage(c: string[]): Pointage {
    const [date, jour, m_in, m_out, am_in, am_out, s_in, s_out] = c.map(v => (v ?? '').trim());
    const allEmpty = ![m_in, m_out, am_in, am_out, s_in, s_out].some(v => v);
    const isWeekend = ['SAM', 'DIM'].includes((jour || '').toUpperCase());
    const hasRetard = [m_in, m_out, am_in, am_out, s_in, s_out].some(v => v.includes('*'));

    let statut = 'present';
    if (isWeekend) statut = 'weekend';
    else if (allEmpty) statut = 'absent';
    else if (hasRetard) statut = 'retard';

    return {
      date, jour: (jour || '').toUpperCase(),
      matin_in: m_in, matin_out: m_out,
      apmidi_in: am_in, apmidi_out: am_out,
      soir_in: s_in, soir_out: s_out,
      statut,
      heures_total: statut === 'present' || statut === 'retard' ? '8.5' : ''
    };
  }
/**
 * Heure supplémentaire = tout temps travaillé un samedi ou un dimanche.
 * (La logique de dépassement en soirée en semaine a été retirée.)
 */
/*
extraireHeuresSupplementaires(employes: any[]): any[] {
  const result: any[] = [];
  let compteur = 1;

  for (const emp of employes) {
    for (const p of emp.pointages) {
      const isWeekend = p.jour === 'SAM' || p.jour === 'DIM';
      if (!isWeekend) continue;

      const { debut, fin } = this.plageJournee(p);
      if (!debut || !fin) continue;

      const duree = this.dureeEnHeures(debut, fin);
      if (duree <= 0) continue;

      result.push({
        id: `${emp.id}-${p.date}-${compteur++}`,
        employe_id: emp.id,
        employe_nom: emp.nom,
        employe_prenom: emp.prenom || '',
        matricule: emp.matricule,
        departement: emp.secteur,
        date: p.date,
        heure_debut: debut.replace('*', '').trim(),
        heure_fin: fin.replace('*', '').trim(),
        duree_h: duree,
        type: p.jour === 'DIM' ? 'dimanche' : 'samedi',
        statut: 'en_attente',
        motif: ''
      });
    }
  }

  return result;
}
*/


extraireHeuresSupplementaires(employes: any[]): any[] {
  const result: any[] = [];
  let compteur = 1;
  const PLAFOND_SAMEDI_MIN = 11 * 60; // 11h00

  for (const emp of employes) {
    for (const p of emp.pointages) {
      const isSamedi = p.jour === 'SAM';
      const isDimanche = p.jour === 'DIM';
      if (!isSamedi && !isDimanche) continue;

      const { debut, fin } = this.plageJournee(p);
      if (!debut || !fin) continue;

      let finMin = this.heureEnMinutes(fin);
      const debutMin = this.heureEnMinutes(debut);

      if (isSamedi) {
        // au-delà de 11h, ça ne compte plus
        finMin = Math.min(finMin, PLAFOND_SAMEDI_MIN);
      }

      const dureeMin = finMin - debutMin;
      if (dureeMin <= 0) continue;
      const duree = Math.round((dureeMin / 60) * 100) / 100;

      result.push({
        id: `${emp.id}-${p.date}-${compteur++}`,
        employe_id: emp.id,
        employe_nom: emp.nom,
        employe_prenom: emp.prenom || '',
        matricule: emp.matricule,
        departement: emp.secteur,
        date: p.date,
        heure_debut: debut.replace('*', '').trim(),
        heure_fin: isSamedi && this.heureEnMinutes(fin) > PLAFOND_SAMEDI_MIN
          ? '11:00'
          : fin.replace('*', '').trim(),
        duree_h: duree,
        type: isDimanche ? 'dimanche' : 'samedi',
        statut: 'en_attente',
        motif: ''
      });
    }
  }

  return result;
}
/** Première heure IN et dernière heure OUT de la journée, toutes plages confondues */
private plageJournee(p: any): { debut: string | null; fin: string | null } {
  const ins = [p.matin_in, p.apmidi_in, p.soir_in].filter(v => v && v.trim());
  const outs = [p.matin_out, p.apmidi_out, p.soir_out].filter(v => v && v.trim());
  if (ins.length === 0 || outs.length === 0) return { debut: null, fin: null };

  const debut = ins.reduce((min, v) => this.heureEnMinutes(v) < this.heureEnMinutes(min) ? v : min);
  const fin = outs.reduce((max, v) => this.heureEnMinutes(v) > this.heureEnMinutes(max) ? v : max);
  return { debut, fin };
}

private heureEnMinutes(h: string): number {
  const clean = h.replace('*', '').trim();
  const [hh, mm] = clean.split(':').map(Number);
  if (isNaN(hh) || isNaN(mm)) return 0;
  return hh * 60 + mm;
}

private dureeEnHeures(debut: string, fin: string): number {
  const m1 = this.heureEnMinutes(debut);
  const m2 = this.heureEnMinutes(fin);
  const diff = m2 - m1;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}
}