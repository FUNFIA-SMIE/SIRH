import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceSirhService } from '../../../../services/service-sirh.service';
import { SoldesComponent } from '../soldes/soldes.component';

export interface TypeConge {
  id: string;
  code: string;
  libelle: string;
  validation_rh: boolean;        // ← snake_case comme la BDD
  seuil_rh_jours: number | null;
  justificatif_requis: boolean;  // ← snake_case
  deductible_solde: boolean;     // ← nouveau champ
  actif: boolean;
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

export interface SoldeConge {
  libelle: string;
  code: string;
  solde_initial: number;
  solde_acquis: number;
  solde_pris: number;
  solde_en_attente: number;
  solde_restant: number;
}

@Component({
  selector: 'app-demande-en-attente',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './demande-en-attente.component.html',
  styleUrl: './demande-en-attente.component.css',
})
export class DemandeEnAttenteComponent implements OnInit {
  private allDemandes: any;
  filtered: any;
  typesConge: any;

  // ── Filtres ────────────────────────────────────────────────
  searchQuery = '';
  filterStatut = '';
  filterType = '';
  solde_par_employe: any;

  // ── KPI ───────────────────────────────────────────────────
  get countEnAttente() { return this.allDemandes.filter((d: { statut: string; }) => d.statut === 'en_attente_manager' || d.statut === 'en_attente_rh').length; }
  get totalJoursDemandes() { return Math.round(this.allDemandes.reduce((s: any, d: { nbJours: any; }) => s + d.nbJours, 0)); }
  get countApprouves() { return this.allDemandes.filter((d: { statut: string; }) => d.statut === 'approuve').length; }
  get countRefuses() { return this.allDemandes.filter((d: { statut: string; }) => d.statut === 'refuse').length; }

  // ── Modal refus ───────────────────────────────────────────
  modalRefusVisible = false;
  motifRefus = '';
  motifRefusError = false;
  private demandeEnCours: DemandeConge | null = null;

  // ── Modal création ────────────────────────────────────────
  modalCreationVisible = false;
  fileName = '';
  selectedEmploye: any | null = null;
  listeEmployes: any;

  // ── Avatar palette ────────────────────────────────────────
  private readonly AVATARS = [
    { bg: '#EEF2FF', color: '#4338CA' }, { bg: '#FFF7ED', color: '#C2410C' },
    { bg: '#F0FDF4', color: '#15803D' }, { bg: '#FDF4FF', color: '#9333EA' },
    { bg: '#ECFEFF', color: '#0E7490' }, { bg: '#FEF2F2', color: '#DC2626' },
  ];

  congeForm!: FormGroup;

  constructor(
    private service: ServiceSirhService,
    private fb: FormBuilder) {
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
async loadData(): Promise<void> {
  try {
    // 1. Initialisation pour éviter les erreurs "undefined" dans le template
    this.allDemandes = [];
    this.filtered = [];

    // 2. Récupération des données
    const rawDemandes = await this.service.getAllConges().toPromise() || [];
    this.typesConge = await this.service.getTypes().toPromise() || [];
    this.listeEmployes = await this.service.getAllEmployees().toPromise() || [];

    // 3. Transformation des données "plates" du SQL en format "imbriqué" pour le HTML
    this.allDemandes = rawDemandes.map((d: any) => ({
      ...d,
      // On crée l'objet 'employe' attendu par d.employe.nom dans le HTML
      employe: {
        nom: d.nom,
        prenom: d.prenom,
        matricule: d.matricule,
        poste: d.poste || 'Collaborateur'
      },
      // On crée l'objet 'typeConge' attendu par d.typeConge.libelle
      typeConge: {
        libelle: d.type_conge,
        code: d.code_type || 'CP',
        validation_rh: d.validation_rh
      },
      // Mapping des noms de colonnes SQL vers les variables CamelCase du HTML
      dateDebut: d.date_debut,
      dateFin: d.date_fin,
      nbJours: d.nb_jours,
      createdAt: d.created_at,
      demiJourneeFin: d.demi_journee_fin,
      soldeRestant: d.solde_restant || 0
    }));

    console.log('Demandes restructurées :', this.allDemandes);
    this.applyFilters();

  } catch (error) {
    console.error('Erreur lors du chargement', error);
  }
}

applyFilters(): void {
  // Sécurité si loadData n'est pas fini
  if (!this.allDemandes) return;

  const q = this.searchQuery.toLowerCase().trim();
  const st = this.filterStatut;
  const ty = this.filterType;

  this.filtered = this.allDemandes.filter((d: any) => {
    const nomComplet = `${d.employe.nom} ${d.employe.prenom}`.toLowerCase();
    const typeLibelle = d.typeConge.libelle.toLowerCase();

    const matchQuery = !q || nomComplet.includes(q) || typeLibelle.includes(q);
    const matchStatut = !st || d.statut === st;
    const matchType = !ty || d.typeConge.libelle === ty;

    return matchQuery && matchStatut && matchType;
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
    /*
    if (d.typeConge.validationRh && niveauActuel === 1) {
      d.statut = 'en_attente_rh';
    } else {
      d.statut = 'approuve';
      d.soldeRestant = Math.max(0, d.soldeRestant - d.nbJours);
    }*/
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
    this.selectedEmploye = this.listeEmployes.find((e: { id: any; }) => e.id === id) ?? null;
    // Réinitialise le type de congé quand on change d'employé
    this.congeForm.patchValue({ type_conge_id: '' });
  }
  soldesEmploye: SoldeConge[] = [];
  loadingSoldes = false;

  async getSoldeAffiche(): Promise<any> {


    if (!this.selectedEmploye) return 0;
    const typeId = this.congeForm.get('type_conge_id')?.value;
    if (!typeId) return 0;


    this.solde_par_employe = await this.service.getSoldes(this.selectedEmploye.employe_id, typeId).toPromise();
    this.solde_par_employe = this.solde_par_employe[0].solde_restant;

    console.log('Soldes récupérés pour l\'employé', this.solde_par_employe);

    return this.solde_par_employe;

  }

  calculerJours(): number {
    const values = this.congeForm.value;
    if (!values.date_debut || !values.date_fin) return 0;

    const debut = new Date(values.date_debut);
    const fin = new Date(values.date_fin);

    if (isNaN(debut.getTime()) || isNaN(fin.getTime())) return 0;

    // On remet les heures à zéro pour ne comparer que les jours
    debut.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);

    if (fin < debut) return 0;

    // Calcul de la différence en jours (1000ms * 3600s * 24h)
    const diffTime = fin.getTime() - debut.getTime();
    let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Gestion des demi-journées
    if (values.demi_journee_debut) diffDays -= 0.5;
    if (values.demi_journee_fin) diffDays -= 0.5;

    return diffDays < 0 ? 0 : diffDays;
  }

  justificatifBase64: string | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        // Le résultat contient "data:image/png;base64,iVBOR..."
        this.justificatifBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  isJustificatifRequis(): boolean {
    const typeId = this.congeForm.get('type_conge_id')?.value;
    const typeSelectionne = this.typesConge.find((t: { id: any; }) => t.id === typeId);
    return !!typeSelectionne?.justificatifRequis;
  }
  /*
    async soumettreDemande(): Promise<void> {           // ← méthode manquante ajoutée
      if (this.congeForm.invalid) return;
  
      const v = this.congeForm.value;
      const employe = this.listeEmployes.find((e: { id: any; }) => e.id === v.employe_id)!;
      const typeConge = this.typesConge.find((t: { id: any; }) => t.id === v.type_conge_id)!;
  
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
        justificatifUrl: this.justificatifBase64 || null,
        commentaireRefus: null,
        soldeRestant: this.solde_par_employe,
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
  
      console.log('Nouvelle demande créée', nouvelle);
  
      // TODO: this.sirhService.creerDemande(nouvelle).subscribe(() => this.loadData());
    }
    */

  async soumettreDemande(): Promise<void> {
    if (this.congeForm.invalid) return;

    const v = this.congeForm.value;

    console.log('Form values', v);
    const typeId = this.congeForm.get('type_conge_id')?.value;

    // Préparation de l'objet pour le Backend (format snake_case comme la DB)
    const payload = {
      id: crypto.randomUUID(),
      employe_id: this.selectedEmploye.employe_id,
      type_conge_id: typeId,
      date_debut: v.date_debut,
      date_fin: v.date_fin,
      nb_jours: this.calculerJours(),
      motif: v.motif || null,
      demi_journee_debut: v.demi_journee_debut || false,
      demi_journee_fin: v.demi_journee_fin || false,
      justificatif: this.justificatifBase64 || null // La string Base64
    };

    this.service.creerConge(payload).subscribe({
      next: (res) => {
        this.showToast('Demande envoyée avec succès !', 'success');
        this.loadData();
        this.closeCreationModal(); this.justificatifBase64 = null; // Reset
      },
      error: (err) => {
        this.showToast(err.error.error || 'Une erreur est survenue', 'error');
      }
    });
  }

  notification: { message: string, type: 'success' | 'error' } | null = null;

  showToast(message: string, type: 'success' | 'error') {
    this.notification = { message, type };
    setTimeout(() => this.notification = null, 4000); // Disparaît après 4s
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
  /*
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
  },*/
];