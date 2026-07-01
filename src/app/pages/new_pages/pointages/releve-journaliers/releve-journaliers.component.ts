import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServicePointageService } from '../../../../services/service-pointage.service';

@Component({
  selector: 'app-releve-journaliers',
  imports: [CommonModule, FormsModule],
  templateUrl: './releve-journaliers.component.html',
  styleUrl: './releve-journaliers.component.css',
})
export class ReleveJournaliersComponent implements OnInit {
  moisCourant = signal(new Date());
  secteurFiltre = '';
  employeOuvert = signal<string | null>(null);

  employes = signal<any[]>([]);
  erreurChargement = signal<string | null>(null);

  constructor(private pointageParser: ServicePointageService) { }

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
    this.chargerDonnees();
  }

  /** Charge et parse le fichier correspondant au mois actuellement sélectionné. */
  private chargerDonnees() {
    const url = this.urlFichierPourMois(this.moisCourant());

    console.log("URL",url)
    this.erreurChargement.set(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Fichier introuvable: ${url}`);
        return res.text();
      })
      .then(xml => {
        // Garde-fou : si le serveur a renvoyé du HTML (404 silencieuse -> index.html)
        if (xml.trim().startsWith('<!DOCTYPE') || xml.trim().startsWith('<html')) {
          throw new Error(`Le fichier n'existe pas réellement à: ${url}`);
        }
        const employes = this.pointageParser.parseRapportXml(xml);
        if (employes.length === 0) {
          this.erreurChargement.set('Aucune donnée trouvée dans le fichier pour ce mois.');
        }
        this.employes.set(employes);
      })
      .catch(err => {
        console.error('Erreur de chargement du relevé:', err);
        this.employes.set([]);
        this.erreurChargement.set('Aucune donnée disponible pour ce mois.');
      });
  }

  /**
   * Construit le chemin du fichier selon l'année/mois sélectionnés.
   * Exemple: /assets/2026/06-Resume.xls
   */
  private urlFichierPourMois(date: Date): string {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0'); // 05, 06, ...
    return `/${annee}/${mois}-Resume.xls`;
  }

  toggleEmploye(id: string) {
    this.employeOuvert.set(this.employeOuvert() === id ? null : id);
  }

  moisPrecedent() {
    const d = new Date(this.moisCourant());
    d.setMonth(d.getMonth() - 1);
    this.moisCourant.set(d);
    this.chargerDonnees();
  }

  moisSuivant() {
    const d = new Date(this.moisCourant());
    d.setMonth(d.getMonth() + 1);
    this.moisCourant.set(d);
    this.chargerDonnees();
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
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