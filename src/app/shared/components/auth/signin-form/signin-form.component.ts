import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-signin-form',
  standalone: true,
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  private http = inject(HttpClient);
  private router = inject(Router);

  // Propriétés d'état de l'interface graphique
  showPassword = false;
  isChecked = false;
  isLoading = false;
  errorMessage = '';

  // Données du formulaire
  identifiant = '';
  mot_de_passe = '';

  private apiUrl = 'http://localhost:3000';

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onLogin(): Promise<void> {
    this.errorMessage = '';

    console.log('--- Tentative de connexion ---');
    console.log('Identifiant capturé :', this.identifiant);

    if (!this.identifiant || !this.identifiant.trim()) {
      this.errorMessage = 'Identifiant requis';
      await this.showErrorAlert('Champ manquant', 'Veuillez saisir votre identifiant.');
      return;
    }
    if (!this.mot_de_passe || !this.mot_de_passe.trim()) {
      this.errorMessage = 'Mot de passe requis';
      await this.showErrorAlert('Champ manquant', 'Veuillez saisir votre mot de passe.');
      return;
    }

    this.isLoading = true;

    this.http.post<any>(`${this.apiUrl}/auth/login`, {
      identifiant: this.identifiant.trim(),
      mot_de_passe: this.mot_de_passe.trim()
    }).subscribe({
      next: (res) => {
        this.isLoading = false;

        // 1. SÉCURITÉ : On nettoie FORCÉMENT le localStorage avant d'écrire
        // Cela évite que le navigateur fusionne ou garde de vieilles données en cache
        localStorage.removeItem('token');
        localStorage.removeItem('utilisateur');

        // 2. DÉBOGAGE FRONT-END : On inspecte DIRECTEMENT la réponse brute du serveur
        console.log('--- Réponse brute reçue du Serveur ---', res);
        console.log('Contenu de res.utilisateur :', res.utilisateur);

        // 3. Sauvegarde de la session fraîche
        localStorage.setItem('token', res.token);
        localStorage.setItem('utilisateur', JSON.stringify(res.utilisateur));

        // 4. Redirection vers le Dashboard
        this.router.navigateByUrl('/dashboard/all_employees');
      },
      error: async (err) => {
        this.isLoading = false;
        console.error('Erreur HTTP capturée :', err);

        let titre: string;
        let message: string;

        switch (err.status) {
          case 401:
            titre = '⛔ Identifiants incorrects';
            message = 'Identifiant ou mot de passe incorrect.';
            break;
          case 403:
            titre = '🔒 Accès refusé';
            message = err?.error?.error || 'Votre compte est désactivé.';
            break;
          default:
            titre = '❌ Erreur';
            message = 'Une erreur inconnue est survenue.';
        }

        this.errorMessage = message;
        await this.showErrorAlert(titre, message);
      }
    });
  }
  private async showErrorAlert(titre: string, message: string): Promise<void> {
    console.warn(`[Alerte de connexion] ${titre} : ${message}`);
  }
}