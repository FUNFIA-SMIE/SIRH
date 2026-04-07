import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ModalService } from '../../../../shared/services/modal.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceSirhService } from '../../../../services/service-sirh.service';

@Component({
  selector: 'app-poste',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './poste.component.html',
  styleUrl: './poste.component.css',
})
export class PosteComponent {

  modalOpen$!: Observable<boolean>;
  postes: any[] = [];
  posteForm: FormGroup;
  isEditing = false;
  currentPosteId: string | null = null;

  constructor(
    private modalService: ModalService,
    private posteService: ServiceSirhService,
    private fb: FormBuilder
  ) {
    this.modalOpen$ = this.modalService.isOpen$;
    this.posteForm = this.fb.group({
      code: ['', Validators.required],
      intitule: ['', Validators.required],
      famille_metier: [''],
      classification: [''],
      organisation_id: ['0226b11d-fa98-499c-a856-37f919df0fa5'], // Valeur par défaut, à adapter selon votre logique
      salaire_min: [null],
      salaire_max: [null],
      description: [''],
      competences_requises: [''] // On splitera cette string en array avant l'envoi
    });
  }

  ngOnInit() {
    this.loadPostes();
  }

  loadPostes() {
    this.posteService.getAllPostes().subscribe(data => this.postes = data);
  }
  MY_ORG_ID = '0226b11d-fa98-499c-a856-37f919df0fa5';

  openModal(poste?: any) {
    if (poste) {
      // MODE EDITION
      this.isEditing = true;
      this.currentPosteId = poste.id;

      this.posteForm.patchValue({
        ...poste, // On prend les données existantes
        // On s'assure que l'ID d'organisation est bien celui-là s'il manque dans l'objet poste
        organisation_id: '0226b11d-fa98-499c-a856-37f919df0fa5',
        competences_requises: Array.isArray(poste.competences_requises)
          ? poste.competences_requises.join(', ')
          : ''
      });
    } else {
      // MODE CRÉATION
      this.isEditing = false;
      this.currentPosteId = null;

      // reset() vide tout, donc on repasse l'objet par défaut
      this.posteForm.reset({
        organisation_id: '0226b11d-fa98-499c-a856-37f919df0fa5',
        famille_metier: '', // Valeur par défaut pour le select
        intitule: '',
        code: ''
      });
    }
    this.modalService.openModal();
  }

  onSubmit() {
    if (this.posteForm.invalid) return;

    const rawValue = this.posteForm.value;
    const payload = {
      ...rawValue,
      // Conversion de la string en tableau pour le JSONB PostgreSQL
      competences_requises: rawValue.competences_requises
        ? rawValue.competences_requises.split(',').map((s: string) => s.trim())
        : []
    };

    if (this.isEditing && this.currentPosteId) {
      this.posteService.modifierPoste(this.currentPosteId, payload).subscribe(() => {
        this.loadPostes();
        this.modalService.closeModal();
      });
    } else {
      this.posteService.NouveauPoste(payload).subscribe(() => {
        this.loadPostes();
        this.modalService.closeModal();
      });
    }
  }

  onDelete(id: any) {
    if (confirm('Supprimer ce poste ?')) {
      this.posteService.deletePoste(id).subscribe(() => this.loadPostes());
    }
  }

  closeModal() {
    this.modalService.closeModal();
  }

}
