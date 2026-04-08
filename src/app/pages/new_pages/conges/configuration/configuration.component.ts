import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceSirhService } from '../../../../services/service-sirh.service';

interface TypeConge {
  id?: string;
  code: string;
  libelle: string;
  typeEnum: string;
  soldeInitialJours: number;
  validationRh: boolean;
  seuilRhJours?: number;
  delaiReponseH: number;
  anticipationMinJ: number;
  justificatifRequis: boolean;
  deductibleSolde: boolean;
  actif: boolean;
}

@Component({
  selector: 'app-configuration',
  imports: [CommonModule, FormsModule],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
})
export class ConfigurationComponent implements OnInit {
  typesConge: TypeConge[] = [];
  currentType: TypeConge = this.resetType();
  isEditing = false;

  constructor(private sirhService: ServiceSirhService) {}

  ngOnInit() {
    this.loadTypesConge();
  }

  resetType(): TypeConge {
    return {
      code: '',
      libelle: '',
      typeEnum: 'annuel',
      soldeInitialJours: 0,
      validationRh: false,
      delaiReponseH: 48,
      anticipationMinJ: 0,
      justificatifRequis: false,
      deductibleSolde: true,
      actif: true
    };
  }

  loadTypesConge() {
    // TODO: Replace with actual API call
    // this.sirhService.getTypesConge().subscribe(data => this.typesConge = data);
    // Mock data
    this.typesConge = [
      {
        id: '1',
        code: 'CA',
        libelle: 'Congé Annuel',
        typeEnum: 'annuel',
        soldeInitialJours: 25,
        validationRh: false,
        delaiReponseH: 48,
        anticipationMinJ: 0,
        justificatifRequis: false,
        deductibleSolde: true,
        actif: true
      },
      {
        id: '2',
        code: 'CM',
        libelle: 'Congé Maladie',
        typeEnum: 'maladie',
        soldeInitialJours: 0,
        validationRh: true,
        seuilRhJours: 3,
        delaiReponseH: 24,
        anticipationMinJ: 0,
        justificatifRequis: true,
        deductibleSolde: false,
        actif: true
      }
    ];
  }

  saveTypeConge() {
    if (this.isEditing) {
      // Update
      console.log('Update type', this.currentType);
      // this.sirhService.updateTypeConge(this.currentType.id, this.currentType).subscribe(() => {
      //   this.loadTypesConge();
      //   this.cancelEdit();
      // });
    } else {
      // Create
      console.log('Create type', this.currentType);
      // this.sirhService.createTypeConge(this.currentType).subscribe(() => {
      //   this.loadTypesConge();
      //   this.currentType = this.resetType();
      // });
    }
  }

  editType(type: TypeConge) {
    this.currentType = { ...type };
    this.isEditing = true;
  }

  deleteType(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce type de congé ?')) {
      console.log('Delete type', id);
      // this.sirhService.deleteTypeConge(id).subscribe(() => this.loadTypesConge());
    }
  }

  cancelEdit() {
    this.currentType = this.resetType();
    this.isEditing = false;
  }
}
