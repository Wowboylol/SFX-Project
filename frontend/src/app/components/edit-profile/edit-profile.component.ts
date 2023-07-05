import { Component } from '@angular/core';
import { NgForm, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UserData } from 'src/app/services/user-service/user.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent {
  get user(): UserData {
    return this.userService.user;
  }

  form: FormGroup;
  keyControl: FormControl;

  constructor(private router:Router, private userService: UserService) {
    this.keyControl = new FormControl(this.user.key,[ Validators.minLength(64), Validators.maxLength(64) ])

    this.form = new FormGroup({
      fname: new FormControl(this.user.firstName),
      lname: new FormControl(this.user.lastName),
      key: this.keyControl
    });

    
  }

  onSubmit() {
    if(!this.form.valid) return;
    this.user.firstName = this.form.value.fname;
    this.user.lastName = this.form.value.lname;
    this.user.key = this.form.value.key;
    this.userService.setUser(this.user);
    this.userService.updateUser(this.user.firstName,this.user.lastName,this.user.key);
    this.router.navigate(['/profile']);
  }

  onCancel() {
    this.form.reset();
    this.router.navigate(['/profile']);
  }

  generateKey() {
    this.keyControl.setValue(this.randHex(64));
  }

  randHex(size: number):string {
    const hex = '0123456789ABCDEF';
    let res = '';
    for (let i = 0; i < size; ++i) {
        res += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return res;
  }
}
