import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService implements CanActivate, CanActivateChild {
  private router = inject(Router);
  private authService = inject(AuthService);

  canActivate(): boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    return this.router.createUrlTree(['/signin']);
  }

  canActivateChild(): boolean | UrlTree {
    return this.canActivate();
  }
}
