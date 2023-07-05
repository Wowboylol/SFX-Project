import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from './auth.service';
import { UserService } from '../services/user-service/user.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit
{
  public isLoading = false;

  constructor(private router: Router, private authService: AuthService, private userService: UserService) { }

  ngOnInit(): void {
    if(this.userService.user.firstName) this.router.navigate(["/home"])
  }

  public onSubmit(form: NgForm)
  {
    if(!form.valid) return;
    const email = form.value.email;
    const password = form.value.password;
    console.log(email + " : " + password)

    this.authService.login(email, password);
  }
}
