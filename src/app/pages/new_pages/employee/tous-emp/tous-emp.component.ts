import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceSirhService } from '../../../../services/service-sirh.service';

@Component({
  selector: 'app-tous-emp',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './tous-emp.component.html',
  styleUrl: './tous-emp.component.css',
})
export class TousEmpComponent implements OnInit {
  isDarkMode = false;



  employees = [
    {
      id: 1,
      name: 'Jean Dupont',
      email: 'jean.dupont@funfia.mg',
      role: 'Médecin Généraliste',
      department: 'Médecine du travail',
      status: 'Actif',
      // Image réaliste via Unsplash Source
      imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?&w=200&q=80&auto=format&fit=crop'
    },
    {
      id: 2,
      name: 'Alice Moreau',
      email: 'alice.m@funfia.mg',
      role: 'Secrétaire Médicale',
      department: 'Administration',
      status: 'En congé',
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?&w=200&q=80&auto=format&fit=crop'
    },
    {
      id: 3,
      name: 'Dr. Marc Chen',
      email: 'marc.chen@funfia.mg',
      role: 'Cardiologue',
      department: 'Médecine du travail',
      status: 'Actif',
      imageUrl: 'https://images.unsplash.com/photo-1547037579-f0fc020ac3be?&w=200&q=80&auto=format&fit=crop'
    },
    {
      id: 4,
      name: 'Sophie Dubois',
      email: 'sophie.d@funfia.mg',
      role: 'Infirmière',
      department: 'Médecine du travail',
      status: 'Actif',
      imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?&w=200&q=80&auto=format&fit=crop'
    },
    // Ajoutez plus d'employés ici...
  ];
  data_employe: any;

  constructor(
    @Inject(DOCUMENT)
    private document: Document,
    private serviceSirh: ServiceSirhService
  ) {
    // Optionnel : Vérifier les préférences du système au chargement
    this.detectSystemTheme();
  }
  async ngOnInit(): Promise<void> {
    this.data_employe = await this.serviceSirh.getAllEmployees().toPromise();
    console.log(this.data_employe);
  }

  // Méthode pour basculer le mode sombre
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.document.documentElement.classList.add('dark');
    } else {
      this.document.documentElement.classList.remove('dark');
    }
  }

  // Optionnel : Détecter la préférence du système
  private detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.isDarkMode = true;
      this.document.documentElement.classList.add('dark');
    }
  }
}
