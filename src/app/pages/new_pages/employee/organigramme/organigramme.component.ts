import { NgTemplateOutlet, NgIf, NgFor, NgClass } from '@angular/common';
import { Component } from '@angular/core';

// employee.model.ts
interface Employee {
  name: string;
  role: string;
  status: 'Actif' | 'En congé';
  imageUrl: string;
  isExpanded: boolean;
  children: Employee[];
}

@Component({
  selector: 'app-organigramme',
  imports: [NgTemplateOutlet, 
    NgIf, 
    NgFor, 
    NgClass],
    standalone: true,
  templateUrl: './organigramme.component.html',
  styleUrl: './organigramme.component.css',
})
export class OrganigrammeComponent {

rootEmployee: Employee = {
    name: 'ANDRIAMIHOATRA Nantenaina',
    role: 'Fullstack Developer',
    status: 'Actif',
    imageUrl: 'https://i.pravatar.cc/150?u=1',
    isExpanded: true,
    children: [
      {
        name: 'Jean Dupont',
        role: 'Frontend Dev',
        status: 'Actif',
        imageUrl: 'https://i.pravatar.cc/150?u=2',
        isExpanded: true,
        children: []
      },
      {
        name: 'Alice Moreau',
        role: 'Secrétaire Médicale',
        status: 'En congé',
        imageUrl: 'https://i.pravatar.cc/150?u=3',
        isExpanded: true,
        children: []
      }
    ]
  };

}
