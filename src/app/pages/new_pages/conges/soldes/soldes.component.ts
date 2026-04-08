import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceSirhService } from '../../../../services/service-sirh.service';

interface SoldeConge {
  typeLibelle: string;
  annee: number;
  soldeInitial: number;
  soldeAcquis: number;
  soldePris: number;
  soldeEnAttente: number;
  soldeRestant: number;
}

@Component({
  selector: 'app-soldes',
  imports: [CommonModule],
  templateUrl: './soldes.component.html',
  styleUrl: './soldes.component.css',
})
export class SoldesComponent implements OnInit {
  soldes: SoldeConge[] = [];

  constructor(private sirhService: ServiceSirhService) {}

  ngOnInit() {
    this.loadSoldes();
  }

  loadSoldes() {
    // TODO: Replace with actual API call
    // this.sirhService.getSoldesConge().subscribe(data => this.soldes = data);
    // Mock data for now
    this.soldes = [
      {
        typeLibelle: 'Congé Annuel',
        annee: 2024,
        soldeInitial: 25,
        soldeAcquis: 5,
        soldePris: 10,
        soldeEnAttente: 2,
        soldeRestant: 18
      },
      {
        typeLibelle: 'Congé Maladie',
        annee: 2024,
        soldeInitial: 0,
        soldeAcquis: 0,
        soldePris: 0,
        soldeEnAttente: 0,
        soldeRestant: 0
      }
    ];
  }
}
