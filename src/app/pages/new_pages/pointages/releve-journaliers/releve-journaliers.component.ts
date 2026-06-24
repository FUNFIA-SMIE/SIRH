import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-releve-journaliers',
  imports: [CommonModule, FormsModule],
  templateUrl: './releve-journaliers.component.html',
  styleUrl: './releve-journaliers.component.css',
})
export class ReleveJournaliersComponent implements OnInit{
  moisCourant = signal(new Date());
  secteurFiltre = '';
  employeOuvert = signal<string | null>(null);

  employes = signal<any[]>([]);

  moisAffiche = computed(() => {
    return this.moisCourant().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  employesFiltres = computed(() => {
    const f = this.secteurFiltre;
    return this.employes().filter(e => !f || e.secteur === f);
  });

  statsGlobales = computed(() => {
    let presents = 0, absents = 0, retards = 0;
    for (const e of this.employes()) {
      presents += e.jours_presents;
      absents += e.jours_absents;
      retards += e.retards;
    }
    return { presents, absents, retards };
  });

  joursOuvres() {
    const d = this.moisCourant();
    const annee = d.getFullYear();
    const mois = d.getMonth();
    let jours = 0;
    const total = new Date(annee, mois + 1, 0).getDate();
    for (let i = 1; i <= total; i++) {
      const j = new Date(annee, mois, i).getDay();
      if (j !== 0 && j !== 6) jours++;
    }
    return jours;
  }

  ngOnInit() {
    this.employes.set(this.genererDonneesDemo());
  }

  toggleEmploye(id: string) {
    this.employeOuvert.set(this.employeOuvert() === id ? null : id);
  }

  moisPrecedent() {
    const d = new Date(this.moisCourant());
    d.setMonth(d.getMonth() - 1);
    this.moisCourant.set(d);
    this.employes.set(this.genererDonneesDemo());
  }

  moisSuivant() {
    const d = new Date(this.moisCourant());
    d.setMonth(d.getMonth() + 1);
    this.moisCourant.set(d);
    this.employes.set(this.genererDonneesDemo());
  }

  rowClass(statut: string): string {
    const base = 'transition-colors ';
    if (statut === 'weekend' || statut === 'ferie')
      return base + 'bg-gray-50/60 dark:bg-gray-800/20 opacity-60';
    if (statut === 'absent')
      return base + 'bg-red-50/40 dark:bg-red-950/20';
    if (statut === 'retard')
      return base + 'bg-amber-50/40 dark:bg-amber-950/20';
    return base + 'hover:bg-gray-50 dark:hover:bg-gray-800/30';
  }

  heureClass(heure: string, type: 'in' | 'out'): string {
    if (!heure) return 'text-gray-300 dark:text-gray-700';
    if (heure.includes('*')) return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-gray-700 dark:text-gray-300';
  }

  statutBadgeClass(statut: string): string {
    const base = 'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ';
    switch (statut) {
      case 'present': return base + 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
      case 'absent': return base + 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
      case 'retard': return base + 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
      case 'partiel': return base + 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
      case 'weekend': return base + 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500';
      case 'ferie': return base + 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
      default: return base + 'bg-gray-100 dark:bg-gray-800 text-gray-500';
    }
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      present: 'Présent', absent: 'Absent', retard: 'Retard',
      partiel: 'Partiel', weekend: 'W-E', ferie: 'Férié'
    };
    return labels[statut] || statut;
  }

  private genererDonneesDemo(): any[] {
    const jours = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    const d = this.moisCourant();
    const annee = d.getFullYear();
    const mois = d.getMonth();
    const nbJours = new Date(annee, mois + 1, 0).getDate();

    const genPointages = (tauxAbsence: number): any[] => {
      const pts: any[] = [];
      for (let i = 1; i <= nbJours; i++) {
        const date = new Date(annee, mois, i);
        const jourIdx = date.getDay();
        const isWE = jourIdx === 0 || jourIdx === 6;
        if (isWE) {
          pts.push({
            date: `${String(mois + 1).padStart(2, '0')}.${String(i).padStart(2, '0')}`,
            jour: jours[jourIdx], matin_in: '', matin_out: '', apmidi_in: '',
            apmidi_out: '', soir_in: '', soir_out: '', statut: 'weekend'
          });
        } else {
          const rand = Math.random();
          if (rand < tauxAbsence) {
            pts.push({
              date: `${String(mois + 1).padStart(2, '0')}.${String(i).padStart(2, '0')}`,
              jour: jours[jourIdx], matin_in: '', matin_out: '', apmidi_in: '',
              apmidi_out: '', soir_in: '', soir_out: '', statut: 'absent'
            });
          } else {
            const retard = Math.random() < 0.2;
            const minIn = retard ? 7 * 60 + 30 + Math.floor(Math.random() * 20) + 10 : 7 * 60 + 20 + Math.floor(Math.random() * 15);
            const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
            pts.push({
              date: `${String(mois + 1).padStart(2, '0')}.${String(i).padStart(2, '0')}`,
              jour: jours[jourIdx],
              matin_in: fmt(minIn) + (retard ? '*' : ' '),
              matin_out: '',
              apmidi_in: '',
              apmidi_out: fmt(17 * 60 + Math.floor(Math.random() * 10)) + (Math.random() < 0.3 ? '*' : ' '),
              soir_in: '', soir_out: '',
              statut: retard ? 'retard' : 'present',
              heures_total: '8.5'
            });
          }
        }
      }
      return pts;
    };

    return [
      {
        id: '1', matricule: '00001', nom: 'LALAINA', prenom: 'Jean', secteur: 'BUREAU',
        poste: 'Comptable', horaire: '07:30-17:00',
        jours_planifies: 22, jours_presents: 17, jours_absents: 5, retards: 3, heures_total: '144.5',
        pointages: genPointages(0.22)
      },
      {
        id: '2', matricule: '00002', nom: 'RAKOTO', prenom: 'Marie', secteur: 'BUREAU',
        poste: 'Secrétaire', horaire: '07:30-17:00',
        jours_planifies: 22, jours_presents: 20, jours_absents: 2, retards: 1, heures_total: '170.0',
        pointages: genPointages(0.09)
      },
      {
        id: '3', matricule: '00003', nom: 'ANDRIANA', prenom: 'Paul', secteur: 'TERRAIN',
        poste: 'Technicien', horaire: '07:00-16:30',
        jours_planifies: 22, jours_presents: 19, jours_absents: 3, retards: 4, heures_total: '160.5',
        pointages: genPointages(0.13)
      }
    ];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    // support MM.DD or MM.DD.YYYY
    const m = dateStr.match(/^(\d{2})\.(\d{2})(?:\.(\d{4}))?$/);
    if (m) {
      const month = parseInt(m[1], 10) - 1;
      const day = parseInt(m[2], 10);
      const year = m[3] ? parseInt(m[3], 10) : (this.moisCourant ? this.moisCourant().getFullYear() : new Date().getFullYear());
      const d = new Date(year, month, day);
      const monthName = d.toLocaleString('fr-FR', { month: 'long' });
      return day === 1 ? `1er ${monthName} ${year}` : `${day} ${monthName} ${year}`;
    }
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

}
