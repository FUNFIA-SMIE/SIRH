import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceSirhService } from '../../../../services/service-sirh.service';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule,FormsModule],
  templateUrl: './soldes.component.html',
  styleUrl: './soldes.component.css',
})
export class SoldesComponent implements OnInit {
personnels: any;
  
  // État de la modale
  isModalOpen = false;
  selectedPersonnel: PersonnelSolde | null = null;
  
  // Champs du formulaire
  typeSelectionne: 'CP' | 'RTT' = 'CP';
  valeurAjout: number = 0;
  motif: string = '';

  constructor(private sirhService: ServiceSirhService) {} 

  ngOnInit() {
    this.loadPersonnels();
  }

  async loadPersonnels() {

    this.personnels = await this.sirhService.solde_conges_employe().toPromise();
    console.log('Personnels chargés :', this.personnels);
/*
    this.personnels = [
      { id: 1, nom: 'Alice Marchand', initiales: 'AM', departement: 'Marketing', soldeCP: 18, soldeRTT: 3.5 },
      { id: 2, nom: 'Lucas Bernard', initiales: 'LB', departement: 'Développement', soldeCP: 12, soldeRTT: 5 },
      { id: 3, nom: 'Sarah Kone', initiales: 'SK', departement: 'RH', soldeCP: 22, soldeRTT: 2 }
    ];
    */
  }

  ouvrirModal(personne: PersonnelSolde) {
    this.selectedPersonnel = personne;
    this.valeurAjout = 0;
    this.motif = '';
    this.isModalOpen = true;
  }

  fermerModal() {
    this.isModalOpen = false;
    this.selectedPersonnel = null;
  }

  validerAjout() {
    if (this.selectedPersonnel && this.valeurAjout !== 0) {
      // Logique métier
      if (this.typeSelectionne === 'CP') {
        this.selectedPersonnel.soldeCP += this.valeurAjout;
      } else {
        this.selectedPersonnel.soldeRTT += this.valeurAjout;
      }

      console.log(`Ajout de ${this.valeurAjout}j (${this.typeSelectionne}) à ${this.selectedPersonnel.nom}. Motif: ${this.motif}`);
      
      // Ici appel API: this.sirhService.postSolde(...)
      
      this.fermerModal();
    }
  }
}