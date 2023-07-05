import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent 
{
  public collapsed = true;

  constructor(private authService: AuthService, private router: Router) { }

  public isLoggedIn(): boolean { return this.authService.getIsLoggedIn(); }

  public onLogout(): void 
  { 
    this.authService.logout(); 
  }
}
