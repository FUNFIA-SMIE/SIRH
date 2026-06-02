import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate {
  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('token');
    
    if (token) {
      return true;
    }

    // Renvoie un UrlTree pour rediriger proprement
    return this.router.createUrlTree(['/signin']);
  }
}