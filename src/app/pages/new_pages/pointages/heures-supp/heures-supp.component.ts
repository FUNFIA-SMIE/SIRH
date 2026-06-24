import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
export class HeuresSuppComponent {
  moisCourant = signal(new Date());
  statutFiltre = signal('');
  heuresSupp = signal<any[]>([]);
  expandedEmployes = signal<Set<string>>(new Set());

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
    this.heuresSupp.set(this.demoData()); 
  }

  moisPrecedent() {
    const d = new Date(this.moisCourant());
    d.setMonth(d.getMonth() - 1);
    this.moisCourant.set(d);
  }

  moisSuivant() {
    const d = new Date(this.moisCourant());
    d.setMonth(d.getMonth() + 1);
    this.moisCourant.set(d);
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

  valider(id: string) {
    this.heuresSupp.update(hs => hs.map(h => h.id === id ? { ...h, statut: 'valide' as const } : h));
  }

  refuser(id: string) {
    this.heuresSupp.update(hs => hs.map(h => h.id === id ? { ...h, statut: 'refuse' as const } : h));
  }

  typeBadge(type: string): string {
    const b = 'inline-flex px-1.5 py-0.5 rounded text-xs font-medium ';
    return ({
      normal:   b + 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      nuit:     b + 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
      dimanche: b + 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
      ferie:    b + 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    } as Record<string, string>)[type] || b;
  }

  typeLabel(t: string): string {
    return ({ normal: 'Normal', nuit: 'Nuit', dimanche: 'Dimanche', ferie: 'Férié' } as Record<string, string>)[t] || t;
  }

  statutBadge(s: string): string {
    const b = 'inline-flex px-1.5 py-0.5 rounded text-xs font-medium ';
    return ({
      en_attente: b + 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      valide:     b + 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      refuse:     b + 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      paye:       b + 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
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

  private demoData(): any[] {
    return [
      {
        id: '1', employe_id: 'e1', employe_nom: 'LALAINA', employe_prenom: 'Jean', matricule: '00001',
        departement: 'Bureau', date: '06.03.2026', heure_debut: '17:00', heure_fin: '20:00',
        duree_h: 3, type: 'normal', statut: 'valide', motif: 'Clôture mensuelle', valideur: 'Chef service'
      },
      {
        id: '2', employe_id: 'e2', employe_nom: 'RAKOTO', employe_prenom: 'Marie', matricule: '00002',
        departement: 'Bureau', date: '06.07.2026', heure_debut: '08:00', heure_fin: '12:00',
        duree_h: 4, type: 'dimanche', statut: 'en_attente', motif: 'Inventaire trimestriel'
      },
      {
        id: '3', employe_id: 'e3', employe_nom: 'ANDRIANA', employe_prenom: 'Paul', matricule: '00003',
        departement: 'Terrain', date: '06.10.2026', heure_debut: '20:00', heure_fin: '23:00',
        duree_h: 3, type: 'nuit', statut: 'paye', motif: 'Maintenance urgente', valideur: 'Directeur'
      },
      {
        id: '4', employe_id: 'e1', employe_nom: 'LALAINA', employe_prenom: 'Jean', matricule: '00001',
        departement: 'Bureau', date: '06.15.2026', heure_debut: '17:00', heure_fin: '19:30',
        duree_h: 2.5, type: 'normal', statut: 'en_attente', motif: 'Rapport DRH'
      },
      {
        id: '5', employe_id: 'e4', employe_nom: 'RASOAMAIVO', employe_prenom: 'Clara', matricule: '00004',
        departement: 'Production', date: '06.19.2026', heure_debut: '12:00', heure_fin: '17:00',
        duree_h: 5, type: 'ferie', statut: 'refuse', motif: 'Commande urgente client'
      },
      {
        id: '6', employe_id: 'e2', employe_nom: 'RAKOTO', employe_prenom: 'Marie', matricule: '00002',
        departement: 'Bureau', date: '06.20.2026', heure_debut: '18:00', heure_fin: '20:30',
        duree_h: 2.5, type: 'normal', statut: 'valide', motif: 'Soutien comptabilité'
      },
    ];
  }
}