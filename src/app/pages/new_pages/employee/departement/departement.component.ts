import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ServiceSirhService } from '../../../../services/service-sirh.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-departement',
  imports: [RouterModule, CommonModule],
  templateUrl: './departement.component.html',
  styleUrl: './departement.component.css',
})
export class DepartementComponent implements OnInit {
  departement: any[] = [];

  constructor(private srvc: ServiceSirhService, private router: Router) { }

  ngOnInit(): void {
    this.loadDepartements();
  }

  loadDepartements(): void {
    this.srvc.getAllDepartments().subscribe({
      next: (data: any[]) => {
        this.departement = data;
        console.log('Departments loaded:', this.departement);
      },
      error: (error) => {
        console.error('Erreur chargement départements:', error);
      },
    });
  }

  onEdit(departement: any): void {
    if (!departement || !departement.id) {
      return;
    }
    this.router.navigate(['/new-departement'], { queryParams: { id: departement.id } });
  }

  onDelete(departement: any): void {
    if (!departement || !departement.id) {
      return;
    }
    const confirmed = window.confirm(`Confirmer la suppression du département ${departement.nom_departement || departement.nom || ''} ?`);
    if (!confirmed) {
      return;
    }

    this.srvc.deleteDepartment(departement.id).then(() => {
      this.loadDepartements();
    }).catch((error) => {
      console.error('Erreur suppression département :', error);
      alert('Impossible de supprimer le département.');
    });
  }

}
