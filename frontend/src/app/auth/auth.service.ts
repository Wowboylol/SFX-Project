import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserService, UserData } from 'src/app/services/user-service/user.service';
import { SessionService } from 'src/app/services/session-service/session.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService
{
  public finishedFetch = false;
  private isLoggedIn = false;

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private sessionService: SessionService, 
    private userService: UserService
  ) {
    this.http.get("/api/relogin", {headers:{responseType: "application/json"}}).subscribe(
      {
        complete: () => {
          console.log("relogined");
        },
        next: (res) => {
          console.log("Found existing login", res);
          this.isLoggedIn = true;
          this.finishedFetch = true;
          this.saveUser().then(() => this.router.navigate(["/home"]));
        },
        error: (error) => {
          console.log("Could not restore session");
          this.finishedFetch = true;
          this.router.navigate(["/auth"]);
        }
      }
    )


  }

  public login(email: string, password: string)
  {
    this.http.post('/api/login', { email: email, password: password }, {observe: 'response', responseType: 'text'})
      .subscribe(async (res) => {
        if(res.status == 200) {
          this.isLoggedIn = true;
          await this.saveUser();
          this.router.navigate(['/home']);
        }
        console.log(res.body);
      });
  }

  public logout() 
  { 
    this.isLoggedIn = false;

    this.http.post('/api/logout', {}, {observe: 'response', responseType: 'text'})
      .subscribe((res) => {
        if(res.status == 200) {
          this.userService.setUser({} as UserData);
          this.router.navigate(['/auth']);
        }
      }
    );
  }

  public getIsLoggedIn():boolean { return this.isLoggedIn; }

  private async saveUser() {
    try {
      const resObj = await lastValueFrom(this.sessionService.getProfile());
      if (resObj == null) return;

      var res = Object.values(resObj);
      console.log(res);

      var user: UserData = {
        _id: res[0],
        email: res[1],
        firstName: res[2],
        lastName: res[3],
        key: res[4],
        password: ""
      };
      this.userService.setUser(user);
    }
    catch (error) {
      console.error(error);
    }
  }
}


