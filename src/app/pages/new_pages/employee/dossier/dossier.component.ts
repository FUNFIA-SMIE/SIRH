import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

export interface Folder {
  id: string;
  name: string;
  category: 'Recrutement' | 'Médical' | 'Administratif' | 'Paie';
  owner: string;
  updatedAt: Date;
  status: 'Complet' | 'Incomplet' | 'En révision';
  documentCount: number;
}

@Component({
  selector: 'app-dossier',
  imports: [CommonModule],
  templateUrl: './dossier.component.html',
  styleUrl: './dossier.component.css',
})
export class DossierComponent {
folders = [
    {
      id: '1',
      name: 'ANDRIAMIHOATRA Nantenaina',
      category: 'Administratif',
      owner: 'RH Principal',
      updatedAt: new Date(),
      status: 'Complet',
      documentCount: 12
    },
    {
      id: '2',
      name: 'Recrutement - Développeur Java',
      category: 'Recrutement',
      owner: 'RH Adjoint',
      updatedAt: new Date(),
      status: 'Incomplet',
      documentCount: 4
    },
    {
      id: '3',
      name: 'Dossier Médical - FUNFIA',
      category: 'Médical',
      owner: 'Médecin Chef',
      updatedAt: new Date(),
      status: 'En révision',
      documentCount: 8
    }
    // ...
  ];
}
