import { Component } from '@angular/core';
import { UserService } from './services/user-service/user.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private userService: UserService, private authService: AuthService){}
  title = 'frontend';
}
