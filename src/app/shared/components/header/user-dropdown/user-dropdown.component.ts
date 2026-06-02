import { Component, inject, OnInit } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemTwoComponent]
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;
  token: any = null;
  historiques: any;
  private http = inject(HttpClient);
  private router = inject(Router);

  async ngOnInit() {
    const data = localStorage.getItem('utilisateur');
    if (data) {
      this.token = JSON.parse(data);
      console.log(this.token)

    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

logout() {
  // 1. On nettoie tout
  localStorage.removeItem('utilisateur');
  localStorage.removeItem('token');
  localStorage.clear(); 

  // 2. On vérifie en direct si c'est vide AVANT de naviguer
  console.log('Vérification immédiate :', localStorage.getItem('utilisateur')); // Doit afficher null

  // 3. On navigue après un micro-délai
  setTimeout(() => {
    this.router.navigateByUrl('/signin');
  }, 100);
}

}