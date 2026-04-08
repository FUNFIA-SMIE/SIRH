import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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



  data_employe: any[] = [];

  constructor(
    @Inject(DOCUMENT)
    private document: Document,
    private serviceSirh: ServiceSirhService,
    private router: Router
  ) {
    // Optionnel : Vérifier les préférences du système au chargement
    this.detectSystemTheme();
  }
  async ngOnInit(): Promise<void> {
    try {
      this.data_employe = await this.serviceSirh.getAllEmployees().toPromise() as any[];
      console.log('Employés récupérés :', this.data_employe);
    } catch (error) {
      console.error('Erreur lors du chargement des employés :', error);
      this.data_employe = [];
    }
  }

  async editEmployee(id: string): Promise<void> {
    await this.router.navigate(['/new_employe', id], { queryParams: { mode: 'edit' } });
  }

  async viewEmployee(id: string): Promise<void> {
    await this.router.navigate(['/new_employe', id], { queryParams: { mode: 'detail' } });
  }

  async deleteEmployee(id: string): Promise<void> {
    const confirmed = confirm('Voulez-vous vraiment supprimer cet employé ?');
    if (!confirmed) {
      return;
    }

    try {
      await this.serviceSirh.deleteEmploye(id).toPromise();
      this.data_employe = this.data_employe.filter(emp => (emp.employe_id || emp.id) !== id);
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      alert('Erreur lors de la suppression de l\'employé.');
    }
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
