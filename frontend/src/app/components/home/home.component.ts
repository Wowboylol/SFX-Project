import { Component} from '@angular/core';
import { HttpClient } from '@angular/common/http';
//import { SessionService } from 'src/app/services/session-service/session.service';
//import { User } from 'src/app/shared/user.model';
import { UserService, UserData } from 'src/app/services/user-service/user.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(private authService:AuthService, private http: HttpClient, protected userService: UserService, private router: Router) {
  }

  profileClass = "show";
  promptClass = "hide";

  get user(): UserData {
    return this.userService.user;
  }
  
  ngOnInit(): void {
    if(this.authService.finishedFetch) {
      if(!this.user.email) { 
        this.router.navigate(["/auth"]);
      }
    }
  }
  

  promptLogin() {
    this.profileClass = "hide";
    this.promptClass = "show";
  }
}
