import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
// Importez l'interface directement depuis le service pour éviter les doublons
import { ServiceTypeCongeService, TypeConge } from '../../../../services/service-type-conge.service';
@Component({
  selector: 'app-configuration',
  standalone: true, // Assurez-vous qu'il est standalone si vous utilisez imports
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
})
export class ConfigurationComponent implements OnInit {
  data: TypeConge[] = [];
  filteredData: TypeConge[] = [];
  pagedData: TypeConge[] = [];
 
  searchQuery = '';
  filterType = '';
  filterActif = '';
 
  currentPage = 1;
  perPage = 5;
  totalPages = 1;
 
  stats = { total: 0, actifs: 0, avecValidRH: 0, avecJustif: 0 };
 
  showModal = false;
  editId: string | null = null;
  form!: FormGroup;
 
  showConfirm = false;
  confirmMsg = '';
  deleteTarget: TypeConge | null = null;
 
  typeEnumOptions: any[] = [
    { value: 'ANNUEL',      label: 'Annuel'      },
    { value: 'MALADIE',     label: 'Maladie'     },
    { value: 'MATERNITE',   label: 'Maternité'   },
    { value: 'PATERNITE',   label: 'Paternité'   },
    { value: 'EXCEPTIONNEL',label: 'Exceptionnel'},
    { value: 'SANS_SOLDE',  label: 'Sans solde'  },
  ];
 
  constructor(
    private fb: FormBuilder,
    private typeCongeService: ServiceTypeCongeService,
  ) {}
 
  ngOnInit(): void {
    this.buildForm();
    this.loadData();
  }
 
  buildForm(): void {
    this.form = this.fb.group({
      code:                 ['', [Validators.required, Validators.maxLength(30)]],
      libelle:              ['', [Validators.required, Validators.maxLength(100)]],
      type_enum:            ['ANNUEL', Validators.required],
      solde_initial_jours:  [0,  Validators.min(0)],
      delai_reponse_h:      [48, Validators.min(0)],
      anticipation_min_j:   [0,  Validators.min(0)],
      validation_rh:        [false],
      justificatif_requis:  [false],
      deductible_solde:     [true],
      actif:                [true],
      seuil_rh_jours:       [null],
    });
  }
 
  loadData(): void {
    this.typeCongeService.getAll().subscribe({
      next: (res) => {
        this.data = res;
        this.computeStats();
        this.applyFilters();
      },
      error: (err) => console.error('Erreur chargement:', err),
    });
  }
 
  computeStats(): void {
    this.stats = {
      total:       this.data.length,
      actifs:      this.data.filter(r => r.actif).length,
      avecValidRH: this.data.filter(r => r.validation_rh).length,
      avecJustif:  this.data.filter(r => r.justificatif_requis).length,
    };
  }
 
  applyFilters(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredData = this.data.filter(r => {
      const matchSearch = !q || r.code.toLowerCase().includes(q) || r.libelle.toLowerCase().includes(q);
      const matchType   = !this.filterType || r.type_enum === this.filterType;
      const matchActif  = this.filterActif === '' || String(r.actif) === this.filterActif;
      return matchSearch && matchType && matchActif;
    });
    this.totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.perPage));
    this.currentPage = 1;
    this.updatePage();
  }
 
  updatePage(): void {
    const start = (this.currentPage - 1) * this.perPage;
    this.pagedData = this.filteredData.slice(start, start + this.perPage);
  }
 
  goPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.updatePage();
  }
 
  openModal(record?: TypeConge): void {
    console.log('Open modal for record:', record);
    this.editId = record?.id ?? null;
    this.form.reset({
      code:                record?.code                ?? '',
      libelle:             record?.libelle             ?? '',
      type_enum:           record?.type_enum           ?? 'ANNUEL',
      solde_initial_jours: record?.solde_initial_jours ?? 0,
      delai_reponse_h:     record?.delai_reponse_h     ?? 48,
      anticipation_min_j:  record?.anticipation_min_j  ?? 0,
      validation_rh:       record?.validation_rh       ?? false,
      justificatif_requis: record?.justificatif_requis ?? false,
      deductible_solde:    record?.deductible_solde    ?? true,
      actif:               record?.actif               ?? true,
      seuil_rh_jours:      record?.seuil_rh_jours      ?? null,
    });
    this.showModal = true;
  }
 
  closeModal(): void {
    this.showModal = false;
    this.editId = null;
  }
 
  saveRecord(): void {
    if (this.form.invalid) { 
      this.form.markAllAsTouched(); 
      return; 
    }
    
    const payload: TypeConge = this.form.getRawValue();
 
    if (this.editId) {
      this.typeCongeService.update(this.editId, payload).subscribe({
        next: () => { this.closeModal(); this.loadData(); },
        error: (err) => console.error('Erreur modification:', err),
      });
    } else {
      this.typeCongeService.create(payload).subscribe({
        next: () => { this.closeModal(); this.loadData(); },
        error: (err) => console.error('Erreur création:', err),
      });
    }
  }
 
  openConfirm(record: TypeConge): void {
    this.deleteTarget = record;
    this.confirmMsg = `Supprimer "${record.libelle}" (${record.code}) ?`;
    this.showConfirm = true;
  }
 
  closeConfirm(): void {
    this.showConfirm = false;
    this.deleteTarget = null;
  }
 
  confirmDelete(): void {
    if (!this.deleteTarget?.id) return;
    this.typeCongeService.delete(this.deleteTarget.id).subscribe({
      next: () => { this.closeConfirm(); this.loadData(); },
      error: (err) => console.error('Erreur suppression:', err),
    });
  }
 
  getTypeLabel(value: string): string {
    return this.typeEnumOptions.find(t => t.value === value)?.label ?? value;
  }

  get f() { 
    return this.form.controls; 
  }

  
}