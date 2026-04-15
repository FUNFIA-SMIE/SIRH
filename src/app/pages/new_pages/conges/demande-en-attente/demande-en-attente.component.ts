import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

export interface TypeConge {
  id: string;
  code: string;
  libelle: string;
  validationRh: boolean;
  seuilRhJours: number | null;
  justificatifRequis: boolean;
}

export interface WorkflowEtape {
  id: string;
  niveau: number;
  approbateur: string;
  action: 'soumis' | 'approuve' | 'refuse' | 'relance' | 'escalade' | 'annule';
  commentaire: string | null;
  createdAt: Date;
}

export interface DemandeConge {
  id: string;
  employe: { id: string; nom: string; poste: string; matricule: string };
  typeConge: TypeConge;
  dateDebut: Date;
  dateFin: Date;
  nbJours: number;
  demiJourneeDebut: boolean;
  demiJourneeFin: boolean;
  statut: 'brouillon' | 'en_attente_manager' | 'en_attente_rh' | 'approuve' | 'refuse' | 'annule';
  motif: string | null;
  justificatifUrl: string | null;
  commentaireRefus: string | null;
  soldeRestant: number;
  createdAt: Date;
  workflow: WorkflowEtape[];
}

// Interface pour la liste des employés du formulaire de création
export interface EmployeLight {
  id: string;
  nom_employe: string;
  prenom_employe: string;
  matricule: string;
  photo_url: string;
  soldes: Record<string, number>; // typeCongeId -> solde
}

@Component({
  selector: 'app-demande-en-attente',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './demande-en-attente.component.html',
  styleUrl: './demande-en-attente.component.css',
})
export class DemandeEnAttenteComponent implements OnInit {
  private allDemandes: DemandeConge[] = [];
  filtered: DemandeConge[] = [];
  typesConge: TypeConge[] = [];

  // ── Filtres ────────────────────────────────────────────────
  searchQuery = '';
  filterStatut = '';
  filterType = '';

  // ── KPI ───────────────────────────────────────────────────
  get countEnAttente() { return this.allDemandes.filter(d => d.statut === 'en_attente_manager' || d.statut === 'en_attente_rh').length; }
  get totalJoursDemandes() { return Math.round(this.allDemandes.reduce((s, d) => s + d.nbJours, 0)); }
  get countApprouves() { return this.allDemandes.filter(d => d.statut === 'approuve').length; }
  get countRefuses() { return this.allDemandes.filter(d => d.statut === 'refuse').length; }

  // ── Modal refus ───────────────────────────────────────────
  modalRefusVisible = false;
  motifRefus = '';
  motifRefusError = false;
  private demandeEnCours: DemandeConge | null = null;

  // ── Modal création ────────────────────────────────────────
  modalCreationVisible = false;
  fileName = '';
  selectedEmploye: EmployeLight | null = null;
  listeEmployes: EmployeLight[] = MOCK_EMPLOYES;

  // ── Avatar palette ────────────────────────────────────────
  private readonly AVATARS = [
    { bg: '#EEF2FF', color: '#4338CA' }, { bg: '#FFF7ED', color: '#C2410C' },
    { bg: '#F0FDF4', color: '#15803D' }, { bg: '#FDF4FF', color: '#9333EA' },
    { bg: '#ECFEFF', color: '#0E7490' }, { bg: '#FEF2F2', color: '#DC2626' },
  ];

  congeForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  initForm(): void {
    this.congeForm = this.fb.group({
      employe_id: ['', Validators.required],       // ← ajouté
      type_conge_id: ['', Validators.required],
      date_debut: ['', Validators.required],
      date_fin: ['', Validators.required],
      demi_journee_debut: [false],
      demi_journee_fin: [false],
      motif: [''],
      justificatif_url: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  // ── Chargement ────────────────────────────────────────────
  loadData(): void {
    this.allDemandes = MOCK_DEMANDES;
    this.typesConge = [...new Map(MOCK_DEMANDES.map(d => [d.typeConge.id, d.typeConge])).values()];
    this.applyFilters();
  }

  // ── Filtrage ──────────────────────────────────────────────
  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    const st = this.filterStatut;
    const ty = this.filterType;
    this.filtered = this.allDemandes.filter(d => {
      const mq = !q || d.employe.nom.toLowerCase().includes(q) || d.typeConge.libelle.toLowerCase().includes(q);
      const ms = !st || d.statut === st;
      const mt = !ty || d.typeConge.libelle === ty;
      return mq && ms && mt;
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  initiales(nom: string): string {
    return nom.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  avatarStyle(index: number): Record<string, string> {
    const a = this.AVATARS[index % this.AVATARS.length];
    return { background: a.bg, color: a.color, borderColor: a.bg };
  }

  accentColor(statut: string): string {
    const m: Record<string, string> = {
      en_attente_manager: '#F59E0B', en_attente_rh: '#3B82F6',
      approuve: '#22C55E', refuse: '#EF4444', brouillon: '#9CA3AF',
    };
    return m[statut] ?? '#9CA3AF';
  }

  accentTextClass(statut: string): string {
    const m: Record<string, string> = {
      en_attente_manager: 'text-amber-600 dark:text-amber-400',
      en_attente_rh: 'text-blue-600 dark:text-blue-400',
      approuve: 'text-emerald-600 dark:text-emerald-400',
      refuse: 'text-red-600 dark:text-red-400',
    };
    return m[statut] ?? 'text-gray-900 dark:text-slate-100';
  }

  statutLabel(statut: string): string {
    const m: Record<string, string> = {
      en_attente_manager: 'Attente manager', en_attente_rh: 'Attente RH',
      approuve: 'Approuvé', refuse: 'Refusé', brouillon: 'Brouillon', annule: 'Annulé',
    };
    return m[statut] ?? statut;
  }

  statutBadgeClass(statut: string): string {
    const m: Record<string, string> = {
      en_attente_manager: 'bg-amber-50  border-amber-200  text-amber-800  dark:bg-amber-950  dark:border-amber-800  dark:text-amber-300',
      en_attente_rh: 'bg-blue-50   border-blue-200   text-blue-800   dark:bg-blue-950   dark:border-blue-800   dark:text-blue-300',
      approuve: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300',
      refuse: 'bg-red-50    border-red-200    text-red-800    dark:bg-red-950    dark:border-red-800    dark:text-red-300',
      brouillon: 'bg-gray-100  border-gray-200   text-gray-600   dark:bg-slate-800  dark:border-slate-700  dark:text-slate-400',
    };
    return m[statut] ?? 'bg-gray-100 border-gray-200 text-gray-600';
  }

  statutDotClass(statut: string): string {
    const m: Record<string, string> = {
      en_attente_manager: 'bg-amber-500', en_attente_rh: 'bg-blue-500',
      approuve: 'bg-emerald-500', refuse: 'bg-red-500', brouillon: 'bg-gray-400',
    };
    return m[statut] ?? 'bg-gray-400';
  }

  soldeClass(solde: number): string {
    if (solde <= 3) return 'text-red-600 dark:text-red-400';
    if (solde <= 10) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  }

  isActionnable(statut: string): boolean {
    return statut === 'en_attente_manager' || statut === 'en_attente_rh';
  }

  // ── Actions liste ─────────────────────────────────────────
  approuver(d: DemandeConge): void {
    const niveauActuel = d.workflow.at(-1)?.niveau ?? 1;
    d.workflow.push({
      id: crypto.randomUUID(),
      niveau: niveauActuel,
      approbateur: 'Vous',
      action: 'approuve',
      commentaire: null,
      createdAt: new Date(),
    });
    if (d.typeConge.validationRh && niveauActuel === 1) {
      d.statut = 'en_attente_rh';
    } else {
      d.statut = 'approuve';
      d.soldeRestant = Math.max(0, d.soldeRestant - d.nbJours);
    }
    this.applyFilters();
  }

  demanderRefus(d: DemandeConge): void {
    this.demandeEnCours = d;
    this.motifRefus = '';
    this.motifRefusError = false;
    this.modalRefusVisible = true;
  }

  confirmerRefus(): void {
    if (!this.motifRefus.trim()) { this.motifRefusError = true; return; }
    const d = this.demandeEnCours!;
    d.statut = 'refuse';
    d.commentaireRefus = this.motifRefus.trim();
    d.workflow.push({
      id: crypto.randomUUID(),
      niveau: d.workflow.at(-1)?.niveau ?? 1,
      approbateur: 'Vous',
      action: 'refuse',
      commentaire: this.motifRefus.trim(),
      createdAt: new Date(),
    });
    this.closeModal();
    this.applyFilters();
  }

  closeModal(): void {
    this.modalRefusVisible = false;
    this.demandeEnCours = null;
    this.motifRefusError = false;
  }

  voirDetails(d: DemandeConge): void {
    console.log('Détails demande', d.id);
  }

  // ── Modal création ────────────────────────────────────────
  ouvrirModalNouveauConge(): void {
    this.congeForm.reset({
      employe_id: '',
      type_conge_id: '',
      date_debut: '',
      date_fin: '',
      demi_journee_debut: false,
      demi_journee_fin: false,
      motif: '',
      justificatif_url: ''
    });
    this.selectedEmploye = null;
    this.fileName = '';
    this.modalCreationVisible = true;
  }

  closeCreationModal(): void {         // ← méthode manquante ajoutée
    this.modalCreationVisible = false;
    this.selectedEmploye = null;
    this.fileName = '';
  }

  onEmployeSelected(): void {          // ← méthode manquante ajoutée
    const id = this.congeForm.get('employe_id')?.value;
    this.selectedEmploye = this.listeEmployes.find(e => e.id === id) ?? null;
    // Réinitialise le type de congé quand on change d'employé
    this.congeForm.patchValue({ type_conge_id: '' });
  }

  getSoldeAffiche(): number {          // ← méthode manquante ajoutée
    if (!this.selectedEmploye) return 0;
    const typeId = this.congeForm.get('type_conge_id')?.value;
    return this.selectedEmploye.soldes[typeId] ?? 0;
  }

  calculerJours(): number {
    const values = this.congeForm.value;
    if (!values.date_debut || !values.date_fin) return 0;
    const debut = new Date(values.date_debut);
    const fin = new Date(values.date_fin);
    if (isNaN(debut.getTime()) || isNaN(fin.getTime())) return 0;
    let diff = (fin.getTime() - debut.getTime()) / (1000 * 3600 * 24) + 1;
    if (this.congeForm.get('demi_journee_debut')?.value) diff -= 0.5;
    if (this.congeForm.get('demi_journee_fin')?.value) diff -= 0.5;
    return diff < 0 ? 0 : diff;
  }

  isJustificatifRequis(): boolean {
    const typeId = this.congeForm.get('type_conge_id')?.value;
    const typeSelectionne = this.typesConge.find(t => t.id === typeId);
    return !!typeSelectionne?.justificatifRequis;
  }

  soumettreDemande(): void {           // ← méthode manquante ajoutée
    if (this.congeForm.invalid) return;

    const v = this.congeForm.value;
    const employe = this.listeEmployes.find(e => e.id === v.employe_id)!;
    const typeConge = this.typesConge.find(t => t.id === v.type_conge_id)!;

    const nouvelle: DemandeConge = {
      id: crypto.randomUUID(),
      employe: {
        id: employe.id,
        nom: `${employe.nom_employe} ${employe.prenom_employe}`,
        poste: 'N/A',
        matricule: employe.matricule,
      },
      typeConge,
      dateDebut: new Date(v.date_debut),
      dateFin: new Date(v.date_fin),
      nbJours: this.calculerJours(),
      demiJourneeDebut: v.demi_journee_debut,
      demiJourneeFin: v.demi_journee_fin,
      statut: 'en_attente_manager',
      motif: v.motif || null,
      justificatifUrl: v.justificatif_url || null,
      commentaireRefus: null,
      soldeRestant: this.getSoldeAffiche(),
      createdAt: new Date(),
      workflow: [{
        id: crypto.randomUUID(),
        niveau: 1,
        approbateur: 'Système',
        action: 'soumis',
        commentaire: null,
        createdAt: new Date(),
      }],
    };

    this.allDemandes.unshift(nouvelle);
    this.applyFilters();
    this.closeCreationModal();

    // TODO: this.sirhService.creerDemande(nouvelle).subscribe(() => this.loadData());
  }
}

// ── Mock employés (pour la modal de création) ─────────────────
const MOCK_EMPLOYES: EmployeLight[] = [
  {
    id: 'e1', nom_employe: 'Rakoto', prenom_employe: 'Jean',
    matricule: 'EMP2601', photo_url: '',
    soldes: { t1: 22, t2: 5, t3: 0, t4: 3 }
  },
  {
    id: 'e2', nom_employe: 'Rasoa', prenom_employe: 'Marie',
    matricule: 'EMP2602', photo_url: '',
    soldes: { t1: 18, t2: 8, t3: 0, t4: 3 }
  },
  {
    id: 'e3', nom_employe: 'Andry', prenom_employe: 'Paul',
    matricule: 'EMP2603', photo_url: '',
    soldes: { t1: 10, t2: 5, t3: 0, t4: 3 }
  },
  {
    id: 'e4', nom_employe: 'Fara', prenom_employe: 'Noro',
    matricule: 'EMP2604', photo_url: '',
    soldes: { t1: 15, t2: 5, t3: 0, t4: 3 }
  },
];

// ── Mock demandes ─────────────────────────────────────────────
const MOCK_DEMANDES: DemandeConge[] = [
  {
    id: '1',
    employe: { id: 'e1', nom: 'Rakoto Jean', poste: 'Développeur Full Stack', matricule: 'EMP2601' },
    typeConge: { id: 't1', code: 'CA', libelle: 'Congé annuel', validationRh: false, seuilRhJours: 10, justificatifRequis: false },
    dateDebut: new Date('2026-05-05'), dateFin: new Date('2026-05-09'), nbJours: 5,
    demiJourneeDebut: false, demiJourneeFin: false,
    statut: 'en_attente_manager', motif: 'Vacances en famille pendant les ponts de mai.',
    justificatifUrl: null, commentaireRefus: null, soldeRestant: 22, createdAt: new Date('2026-04-07'),
    workflow: [{ id: 'w1', niveau: 1, approbateur: 'Dr Rasoa (Manager)', action: 'soumis', commentaire: null, createdAt: new Date('2026-04-07') }],
  },
  {
    id: '2',
    employe: { id: 'e2', nom: 'Rasoa Marie', poste: 'Responsable RH', matricule: 'EMP2602' },
    typeConge: { id: 't2', code: 'MAL', libelle: 'Congé maladie', validationRh: true, seuilRhJours: null, justificatifRequis: true },
    dateDebut: new Date('2026-04-14'), dateFin: new Date('2026-04-15'), nbJours: 2,
    demiJourneeDebut: false, demiJourneeFin: false,
    statut: 'en_attente_rh', motif: null, justificatifUrl: 'certificat_medical.pdf',
    commentaireRefus: null, soldeRestant: 8, createdAt: new Date('2026-04-08'),
    workflow: [
      { id: 'w2', niveau: 1, approbateur: 'Andry Paul (Manager)', action: 'approuve', commentaire: null, createdAt: new Date('2026-04-08') },
      { id: 'w3', niveau: 2, approbateur: 'DRH', action: 'soumis', commentaire: null, createdAt: new Date('2026-04-08') },
    ],
  },
  {
    id: '3',
    employe: { id: 'e3', nom: 'Andry Paul', poste: 'Comptable Senior', matricule: 'EMP2603' },
    typeConge: { id: 't3', code: 'SS', libelle: 'Sans solde', validationRh: true, seuilRhJours: null, justificatifRequis: false },
    dateDebut: new Date('2026-05-20'), dateFin: new Date('2026-05-31'), nbJours: 10,
    demiJourneeDebut: false, demiJourneeFin: false,
    statut: 'en_attente_manager', motif: 'Formation professionnelle externe non prise en charge.',
    justificatifUrl: 'attestation_formation.pdf', commentaireRefus: null, soldeRestant: 0, createdAt: new Date('2026-04-06'),
    workflow: [{ id: 'w4', niveau: 1, approbateur: 'Fara Noro (Manager)', action: 'soumis', commentaire: null, createdAt: new Date('2026-04-06') }],
  },
  {
    id: '4',
    employe: { id: 'e4', nom: 'Fara Noro', poste: 'Chef de projet', matricule: 'EMP2604' },
    typeConge: { id: 't4', code: 'EXC', libelle: 'Exceptionnel', validationRh: false, seuilRhJours: null, justificatifRequis: true },
    dateDebut: new Date('2026-04-11'), dateFin: new Date('2026-04-11'), nbJours: 1,
    demiJourneeDebut: false, demiJourneeFin: true,
    statut: 'en_attente_manager', motif: 'Cérémonie de mariage familiale.',
    justificatifUrl: null, commentaireRefus: null, soldeRestant: 15, createdAt: new Date('2026-04-09'),
    workflow: [{ id: 'w5', niveau: 1, approbateur: 'Hery Lanto (Manager)', action: 'soumis', commentaire: null, createdAt: new Date('2026-04-09') }],
  },
];