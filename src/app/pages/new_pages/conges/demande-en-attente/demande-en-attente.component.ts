import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceSirhService } from '../../../../services/service-sirh.service';

interface DemandeConge {
  id: string;
  employeNom: string;
  typeConge: string;
  dateDebut: Date;
  dateFin: Date;
  nbJours: number;
  statut: string;
  motif?: string;
}

@Component({
  selector: 'app-demande-en-attente',
  imports: [CommonModule],
  templateUrl: './demande-en-attente.component.html',
  styleUrl: './demande-en-attente.component.css',
})
export class DemandeEnAttenteComponent implements OnInit {
  demandesEnAttente: DemandeConge[] = [];

  constructor(private sirhService: ServiceSirhService) {}

  ngOnInit() {
    this.loadDemandesEnAttente();
  }

  loadDemandesEnAttente() {
    // TODO: Replace with actual API call
    // this.sirhService.getDemandesEnAttente().subscribe(data => this.demandesEnAttente = data);
    // Mock data
    this.demandesEnAttente = [
      {
        id: '1',
        employeNom: 'Jean Dupont',
        typeConge: 'Congé Annuel',
        dateDebut: new Date('2024-05-01'),
        dateFin: new Date('2024-05-05'),
        nbJours: 5,
        statut: 'en_attente',
        motif: 'Vacances familiales'
      },
      {
        id: '2',
        employeNom: 'Marie Martin',
        typeConge: 'Congé Maladie',
        dateDebut: new Date('2024-04-15'),
        dateFin: new Date('2024-04-16'),
        nbJours: 2,
        statut: 'soumis'
      }
    ];
  }

  approuverDemande(id: string) {
    // TODO: Implement approval logic
    console.log('Approuver demande', id);
    // this.sirhService.approuverDemande(id).subscribe(() => this.loadDemandesEnAttente());
  }

  refuserDemande(id: string) {
    // TODO: Implement rejection logic
    console.log('Refuser demande', id);
    // this.sirhService.refuserDemande(id).subscribe(() => this.loadDemandesEnAttente());
  }

  voirDetails(id: string) {
    // TODO: Navigate to details page or open modal
    console.log('Voir détails', id);
  }
}
