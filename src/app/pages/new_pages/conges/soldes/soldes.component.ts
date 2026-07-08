import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceSirhService } from '../../../../services/service-sirh.service';
import { uuidv4 } from '../../../../shared/utils/uuid';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface PersonnelSolde {
  id: number;
  nom: string;
  initiales: string;
  departement: string;
  soldeCP: number;
  soldeRTT: number;
}

@Component({
  selector: 'app-soldes',
  imports: [CommonModule, FormsModule],
  templateUrl: './soldes.component.html',
  styleUrl: './soldes.component.css',
})
export class SoldesComponent implements OnInit {

  personnels: any[] = [];
  searchQuery = '';
  isModalOpen = false;
  showHistorique = false;
  selectedPersonnel: any = null;
  typeSelectionne: any = null;
  valeurAjout = 0;
  motif = '';
  soldeActuel = 0;
  soldePreview = 0;
  histFilter = 'tous';


  filtresHistorique = [
    { label: 'Tous', value: 'tous' },
    { label: 'Congés payés', value: 'CP' },
    { label: 'RTT', value: 'RTT' },
    { label: 'Maladie', value: 'MAL' },
  ];
  type_conge_data: any[] | undefined;

  ngOnInit(): void {
    this.loadPersonnels();
  }
  trackByPersonnel(index: number, personnel: any): string {
    return personnel.id; // Ou personnel.matricule
  }

  constructor(private sirhService: ServiceSirhService, private sanitizer: DomSanitizer) { }
  async loadPersonnels(): Promise<void> {
    this.personnels = await this.sirhService.solde_conges_employe().toPromise();
    this.type_conge_data = await this.sirhService.getTypesConge().toPromise();
    console.log('Personnels chargés :', this.personnels);
  }

  // Données d'exemple — remplacez par votre API
  absencesData: Record<number, any[]> = {
    1: [
      { type: 'CP', label: 'Congés payés', debut: '2025-07-14', fin: '2025-07-25', jours: 9, statut: 'approved' },
      { type: 'MAL', label: 'Maladie', debut: '2025-03-10', fin: '2025-03-12', jours: 3, statut: 'approved' },
    ],
  };

  get totalCP(): number {
    return this.personnels.reduce((s, p) => s + (p.soldes?.[0]?.solde_restant || 0), 0);
  }

  get personnelsFiltres(): any[] {
    if (!this.searchQuery) return this.personnels;
    const q = this.searchQuery.toLowerCase();
    return this.personnels.filter(p =>
      p.nom?.toLowerCase().includes(q) || p.prenom?.toLowerCase().includes(q)
    );
  }

  get absencesFiltrees(): any[] {
    const list = this.absencesData[this.selectedPersonnel?.id] || [];
    return this.histFilter === 'tous' ? list : list.filter(a => a.type === this.histFilter);
  }

  getPillClass(v: number): string {
    if (v >= 15) return 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    if (v >= 8) return 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
    return 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  }

  isLoadingHistorique = false;

  async ouvrirHistorique(p: any): Promise<void> {
    this.selectedPersonnel = p;
    this.showHistorique = true;
    this.histFilter = 'tous';
    this.isModalOpen = false;
    this.absencesData[p.id] = [];
    this.isLoadingHistorique = true;

    const data = await this.sirhService.getAllConges_liste().toPromise();

    data?.filter((c: any) => c.employe_id === p.employe_id).forEach((c: any) => {
      this.absencesData[p.id].push({
        type: c.code_type,
        label: this.type_conge_data?.find(t => t.code === c.code_type)?.libelle || c.code_type,
        debut: c.date_debut,
        fin: c.date_fin,
        jours: c.nb_jours,
        motif: c.motif,
        statut: c.statut ?? 'approved',
      });
    });

    this.isLoadingHistorique = false;
  }
  fermerHistorique(): void {
    this.showHistorique = false;
    this.selectedPersonnel = null;
  }

  ouvrirModal(p: any): void {
    this.selectedPersonnel = p;
    this.valeurAjout = 0;
    this.motif = '';
    this.typeSelectionne = this.type_conge_data?.[0] || null;
    this.isModalOpen = true;
    this.showHistorique = false;
    this.updatePreview();
  }

  fermerModal(): void { this.isModalOpen = false; }

  updatePreview(): void {
    const selectedCode = this.typeSelectionne?.code;
    const base = selectedCode === 'CP'
      ? this.selectedPersonnel?.soldes?.[0]?.solde_restant || 0
      : selectedCode === 'RTT'
        ? this.selectedPersonnel?.soldes?.[1]?.solde_restant || 0
        : selectedCode === 'DISPO'
          ? this.selectedPersonnel?.soldes?.[2]?.solde_restant || 0
          : 0;

    this.soldeActuel = base;
    this.soldePreview = base + (this.valeurAjout || 0);

    console.log('Mise à jour de l\'aperçu :', {
      typeSelectionne: this.typeSelectionne?.id,
      soldeActuel: this.soldeActuel,
      soldePreview: this.soldePreview,
    });
  }
  validerAjout(): void {
    if (!this.selectedPersonnel || !this.valeurAjout || !this.typeSelectionne?.id) return;

    const payload = {
      id: uuidv4(),
      employe_id: this.selectedPersonnel?.employe_id,
      type_conge_id: this.typeSelectionne.id,
      annee: new Date().getFullYear(),
      delta_jours: this.valeurAjout,
      motif: this.motif || null,
      auteur_id: null,
    };

    this.sirhService.Ajustement_solde_conge(payload).subscribe({
      next: () => {
        console.log('Ajustement solde envoyé', payload);
        this.loadPersonnels();
        this.fermerModal();
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajustement du solde :', err);
      }
    });
  }
}