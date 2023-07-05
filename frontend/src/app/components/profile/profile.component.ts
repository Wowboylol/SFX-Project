import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionService } from 'src/app/services/session-service/session.service';
import { Router } from '@angular/router';
import { UserService, UserData } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  get user(): UserData {
    return this.userService.user;
  }

  constructor(private http: HttpClient, private sessionService: SessionService, private router: Router, private userService: UserService) {
  }

  onEdit() {
    this.router.navigate(['profile/edit']);
  }

  /*
  getProfile() {
    this.sessionService.getProfile()
      .subscribe((resObj)=>{
        if(resObj == null) {
          return;
        };
        
        var res = Object.values(resObj);
        console.log(res);
        this.user = {
          email: res[0],
          fname: res[1],
          lname: res[2],
          key: ""
        }
      }
    );
  }
  */
}
