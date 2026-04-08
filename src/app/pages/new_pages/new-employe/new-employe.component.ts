import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';import { FormsModule } from '@angular/forms';import { ServiceSirhService } from '../../../services/service-sirh.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-new-employe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-employe.component.html',
  styleUrl: './new-employe.component.css',
})
export class NewEmployeComponent implements OnInit {
  JSON = JSON;

  isPreviewModalOpen: boolean = false;
  isEditMode: boolean = false;
  viewMode: boolean = false;
  isLoading: boolean = false;
  data_departement: any[] = [];
  data_postes: any[] = [];
  data_employe: any;
  photoPreview: string | null = null;
  cvFileName: string | null = null;
  cvFile: File | null = null;
  photoFile: File | null = null;
  successMessage: string = '';
  errorMessage: string = '';

  employe = {
    id: null as any,
    organisation_id: null as any,
    civilite: '',
    matricule: '',
    nom: '',
    prenom: '',
    nom_usage: '',
    genre: '',
    date_naissance: '',
    lieu_naissance: '',
    nationalite: 'Malagasy',
    cin: '',
    num_securite_sociale: '',
    email_pro: '',
    email_perso: '',
    telephone_pro: '',
    telephone_perso: '',
    adresse: '',
    ville: 'Fianarantsoa',
    code_postal: '',
    pays: 'Madagascar',
    departement_id: '',
    poste_id: '',
    manager_id: '',
    site_travail: '',
    statut: 'actif',
    date_entree: '',
    date_sortie: '',
    motif_sortie: '',
    photo_url: '',
    cv_url: '',
    notes_rh: ''
  };
  
  constructor(private service: ServiceSirhService, private route: ActivatedRoute, private router: Router) { }

  openPreview() {
    this.isPreviewModalOpen = true;
  }

  closePreview() {
    this.isPreviewModalOpen = false;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.photoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
        this.employe.photo_url = e.target.result; // Stocker le base64
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onCVSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.cvFileName = input.files[0].name;
      this.cvFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.employe.cv_url = e.target.result; // Stocker le base64 du PDF
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      this.data_departement = await this.service.getAllDepartments().toPromise();
      this.data_postes = await this.service.getAllPostes().toPromise();
      this.data_employe = await this.service.getAllEmployees().toPromise();

      const id = this.route.snapshot.paramMap.get('id');
      const mode = this.route.snapshot.queryParamMap.get('mode');
      if (mode === 'detail') {
        this.viewMode = true;
      }
      if (id) {
        await this.loadEmployeById(id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }

  async saveEmploye(): Promise<void> {
    if (!this.validateForm()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (Matricule, Nom, Prénom, Email Pro, Date d\'entrée)';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      // Les fichiers sont déjà convertis en base64 dans photo_url et cv_url
      
      // Nettoyer les champs vides
      const employeData: any = { ...this.employe };
      Object.keys(employeData).forEach(key => {
        if (employeData[key] === '') {
          employeData[key] = null;
        }
      });

      if (this.isEditMode && this.employe.id) {
        // Modification
        await this.service.updateEmploye(this.employe.id, employeData).toPromise();
        this.successMessage = 'Employé modifié avec succès';
        this.showSuccessAlert('Succès', 'Employé modifié avec succès');
        setTimeout(() => {
          this.router.navigate(['/all_employees']).then(() => {
            window.location.reload();
          });
        }, 1500);
      } else {
        // Création
        await this.service.createEmploye(employeData).toPromise();
        this.successMessage = 'Employé créé avec succès';
        this.showSuccessAlert('Succès', 'Employé créé avec succès');
        setTimeout(() => {
          this.router.navigate(['/all_employees']).then(() => {
            window.location.reload();
          });
        }, 1500);
        this.resetForm();
      }

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMsg = error?.error?.message || error?.error?.error || error?.message || 'Erreur lors de la sauvegarde. Veuillez réessayer.';
      this.errorMessage = errorMsg;
      this.showErrorAlert('Erreur', errorMsg);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteEmploye(id: any): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.')) {
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      await this.service.deleteEmploye(id).toPromise();
      this.successMessage = 'Employé supprimé avec succès';
      this.showSuccessAlert('Succès', 'Employé supprimé avec succès');
      this.resetForm();
      setTimeout(() => {
        this.router.navigate(['/all_employees']).then(() => {
          window.location.reload();
        });
      }, 1500);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      const errorMsg = error?.error?.message || error?.error?.error || error?.message || 'Erreur lors de la suppression. Veuillez réessayer.';
      this.errorMessage = errorMsg;
      this.showErrorAlert('Erreur', errorMsg);
    } finally {
      this.isLoading = false;
    }
  }

  async loadEmployeById(id: string): Promise<void> {
    try {
      const emp = await this.service.getEmployeeById(id);
      if (emp) {
        this.isEditMode = !this.viewMode;
        this.employe = { ...this.employe, ...emp, id: emp.id || emp.employe_id };
        this.photoPreview = emp.photo_url || null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'employé :', error);
    }
  }

  resetForm(): void {
    this.employe = {
      id: null,
      organisation_id: null,
      civilite: '',
      matricule: '',
      nom: '',
      prenom: '',
      nom_usage: '',
      genre: '',
      date_naissance: '',
      lieu_naissance: '',
      nationalite: 'Malagasy',
      cin: '',
      num_securite_sociale: '',
      email_pro: '',
      email_perso: '',
      telephone_pro: '',
      telephone_perso: '',
      adresse: '',
      ville: 'Fianarantsoa',
      code_postal: '',
      pays: 'Madagascar',
      departement_id: '',
      poste_id: '',
      manager_id: '',
      site_travail: '',
      statut: 'actif',
      date_entree: '',
      date_sortie: '',
      motif_sortie: '',
      photo_url: '',
      cv_url: '',
      notes_rh: ''
    };
    this.photoPreview = null;
    this.photoFile = null;
    this.cvFileName = null;
    this.cvFile = null;
    this.isEditMode = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  private validateForm(): boolean {
    return !!(this.employe.matricule?.trim() && 
              this.employe.nom?.trim() && 
              this.employe.prenom?.trim() && 
              this.employe.email_pro?.trim() && 
              this.employe.date_entree?.trim());
  }

  updatePreview(): void {
    // Mise à jour de l'aperçu en temps réel (optionnel)
    console.log('Employé actuel:', this.employe);
  }

  isPdf(url: string | null): boolean {
    if (!url) {
      return false;
    }
    return url.startsWith('data:application/pdf') || url.toLowerCase().endsWith('.pdf');
  }

  showSuccessAlert(title: string, message: string): void {
    // Créer une alerte personnalisée de succès
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #10b981;
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      font-family: Arial, sans-serif;
      max-width: 400px;
      animation: slideIn 0.3s ease-in-out;
      border-left: 5px solid #059669;
    `;
    alertDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">✓ ${title}</div>
      <div>${message}</div>
    `;
    document.body.appendChild(alertDiv);

    // Ajouter l'animation CSS
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Supprimer l'alerte après 3 secondes
    setTimeout(() => {
      alertDiv.style.animation = 'slideOut 0.3s ease-in-out';
      setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
  }

  showErrorAlert(title: string, message: string): void {
    // Créer une alerte personnalisée d'erreur
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #ef4444;
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      font-family: Arial, sans-serif;
      max-width: 400px;
      animation: slideIn 0.3s ease-in-out;
      border-left: 5px solid #dc2626;
    `;
    alertDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">✕ ${title}</div>
      <div>${message}</div>
      <div style="margin-top: 12px; font-size: 12px; opacity: 0.9;">Cliquez pour fermer</div>
    `;
    
    // Ajouter un event listener pour fermer en cliquant
    alertDiv.addEventListener('click', () => {
      alertDiv.style.animation = 'slideOut 0.3s ease-in-out';
      setTimeout(() => alertDiv.remove(), 300);
    });
    
    document.body.appendChild(alertDiv);

    // Ajouter l'animation CSS si ce n'est pas déjà fait
    if (!document.getElementById('slideAnimation')) {
      const style = document.createElement('style');
      style.id = 'slideAnimation';
      style.innerHTML = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Supprimer l'alerte automatiquement après 5 secondes
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => {
          if (alertDiv.parentNode) {
            alertDiv.remove();
          }
        }, 300);
      }
    }, 5000);
  }
}
