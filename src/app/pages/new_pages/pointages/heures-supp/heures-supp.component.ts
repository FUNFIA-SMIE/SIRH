import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServicePointageService } from '../../../../services/service-pointage.service';

interface EmployeGroup {
  employe_id: string;
  employe_nom: string;
  employe_prenom: string;
  departement: string;
  heures: any[];
}

@Component({
  selector: 'app-heures-supp',
  imports: [CommonModule, FormsModule],
  templateUrl: './heures-supp.component.html',
  styleUrl: './heures-supp.component.css',
})
export class HeuresSuppComponent implements OnInit {
  moisCourant = signal(new Date());
  statutFiltre = signal('');
  heuresSupp = signal<any[]>([]);
  expandedEmployes = signal<Set<string>>(new Set());
  erreurChargement = signal<string | null>(null);

  constructor(private pointageService: ServicePointageService) { }

  moisAffiche = computed(() =>
    this.moisCourant().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  );

  hsFiltrees = computed(() => {
    const f = this.statutFiltre();
    return this.heuresSupp().filter(h => !f || h.statut === f);
  });

  employesGroupes = computed(() => {
    const grouped = new Map<string, EmployeGroup>();

    this.hsFiltrees().forEach(hs => {
      const key = hs.employe_id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          employe_id: hs.employe_id,
          employe_nom: hs.employe_nom,
          employe_prenom: hs.employe_prenom,
          departement: hs.departement,
          heures: []
        });
      }
      grouped.get(key)!.heures.push(hs);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.employe_nom.localeCompare(b.employe_nom)
    );
  });

  totaux = computed(() => {
    const all = this.heuresSupp();
    return {
      heures: all.reduce((s, h) => s + h.duree_h, 0),
      enAttente: all.filter(h => h.statut === 'en_attente').length,
      employes: new Set(all.map(h => h.employe_id)).size
    };
  });

  ngOnInit() {
    this.chargerDonnees();
  }

  /** Charge le fichier du mois sélectionné et dérive les heures supp réelles. */
  private chargerDonnees() {
    const url = this.urlFichierPourMois(this.moisCourant());
    this.erreurChargement.set(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Fichier introuvable: ${url}`);
        return res.text();
      })
      .then(xml => {
        if (xml.trim().startsWith('<!DOCTYPE') || xml.trim().startsWith('<html')) {
          throw new Error(`Le fichier n'existe pas réellement à: ${url}`);
        }
        const employes = this.pointageService.parseRapportXml(xml);
        const hs = this.pointageService.extraireHeuresSupplementaires(employes);
        if (hs.length === 0) {
          this.erreurChargement.set('Aucune heure supplémentaire détectée ce mois-ci.');
        }
        this.heuresSupp.set(hs);
      })
      .catch(err => {
        console.error('Erreur de chargement des heures supp:', err);
        this.heuresSupp.set([]);
        this.erreurChargement.set('Aucune donnée disponible pour ce mois.');
      });
  }

  /** Même convention de nommage que pour le relevé journalier: /assets/{annee}/{mm}-Resume.xls */
  private urlFichierPourMois(date: Date): string {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    return `/${annee}/${mois}-Resume.xls`;
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

  toggleEmploye(employe_id: string) {
    const updated = new Set(this.expandedEmployes());
    if (updated.has(employe_id)) {
      updated.delete(employe_id);
    } else {
      updated.add(employe_id);
    }
    this.expandedEmployes.set(updated);
  }

  isExpanded(employe_id: string): boolean {
    return this.expandedEmployes().has(employe_id);
  }

  getTotalHeures(heures: any[]): number {
    return heures.reduce((s, h) => s + h.duree_h, 0);
  }

  getStatusCount(heures: any[], statut: string): number {
    return heures.filter(h => h.statut === statut).length;
  }

  // NOTE: ces validations ne sont que locales (front) — elles ne sont pas
  // persistées côté fichier source. À brancher sur une vraie API si tu veux
  // que la validation soit sauvegardée durablement.
  valider(id: string) {
    this.heuresSupp.update(hs => hs.map(h => h.id === id ? { ...h, statut: 'valide' as const } : h));
  }

  refuser(id: string) {
    this.heuresSupp.update(hs => hs.map(h => h.id === id ? { ...h, statut: 'refuse' as const } : h));
  }

  typeBadge(type: string): string {
    const b = 'inline-flex px-1.5 py-0.5 rounded text-xs font-medium ';
    return ({
      normal: b + 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      nuit: b + 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
      dimanche: b + 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
      samedi: b + 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
      ferie: b + 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    } as Record<string, string>)[type] || b;
  }

  typeLabel(t: string): string {
    return ({ normal: 'Normal', nuit: 'Nuit', dimanche: 'Dimanche', samedi: 'Samedi', ferie: 'Férié' } as Record<string, string>)[t] || t;
  }

  statutBadge(s: string): string {
    const b = 'inline-flex px-1.5 py-0.5 rounded text-xs font-medium ';
    return ({
      en_attente: b + 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      valide: b + 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      refuse: b + 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      paye: b + 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
    } as Record<string, string>)[s] || b;
  }

  statutLabel(s: string): string {
    return ({ en_attente: 'En attente', valide: 'Validé', refuse: 'Refusé', paye: 'Payé' } as Record<string, string>)[s] || s;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const m = dateStr.match(/^(\d{2})\.(\d{2})(?:\.(\d{4}))?$/);
    if (m) {
      const month = parseInt(m[1], 10) - 1;
      const day = parseInt(m[2], 10);
      const year = m[3] ? parseInt(m[3], 10) : this.moisCourant().getFullYear();
      const d = new Date(year, month, day);
      const monthName = d.toLocaleString('fr-FR', { month: 'long' });
      if (m[3]) {
        return day === 1 ? `1er ${monthName} ${year}` : `${day} ${monthName} ${year}`;
      }
      return day === 1 ? `1er ${monthName}` : `${day} ${monthName}`;
    }
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}