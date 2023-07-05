import { HttpErrorResponse } from '@angular/common/http';
import { Component, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { RegValidationService } from 'src/app/services/reg-validation/reg-validation.service';
import { UserData, UserService } from 'src/app/services/user-service/user.service';
import { Router } from '@angular/router';
import { EmailService } from 'src/app/services/email-service/email.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent {
  constructor(private emailService: EmailService, private router: Router, private userService: UserService, private regValidationService: RegValidationService) {
    //Forces password confirmation field to revalidate when main password field changes
    this.registrationForm.controls.password.valueChanges.subscribe(() => {
      this.registrationForm.controls.passwordConfirmation.updateValueAndValidity();
    });
  }

  registrationForm = new FormGroup(
    {
      email: new FormControl("", this.regValidationService.emailValidation),
      fname: new FormControl("", this.regValidationService.nameValidation),
      lname: new FormControl("", this.regValidationService.nameValidation),
      password: new FormControl("", this.regValidationService.passwordValidation),
      passwordConfirmation: new FormControl("", this.regValidationService.passwordConfirmationValidation),
    }
  );

  waitingForResponse = false;
  async onSubmitRegister() {
    try {
      if(this.registrationForm.invalid) throw new Error("Invalid Form Inputs")
      const controls = this.registrationForm.controls;
      const userData: UserData = {
        _id: "",
        email: controls.email.value || "",
        firstName: controls.fname.value || "",
        lastName: controls.lname.value || "",
        key: "",
        password: controls.password.value || "",
      }
      this.waitingForResponse = true;
      const response = await this.userService.registerUser(userData) as HttpErrorResponse;
      this.waitingForResponse = false;
      console.log(response);

      if(response.ok) {
        this.emailService.sendWelcomeEmail(userData.email, userData);
        this.registrationForm.reset();
        this.router.navigate(['/auth']);
      }
      else {
        if((response.error as Error).cause == "User Exists") {
          console.log(response.error.message);
          const currentErrors = controls.email.errors || { };
          currentErrors["Email already in use"] = true;
          controls.email.setErrors(currentErrors);
          controls.email.markAsTouched();
        };
      }
    }
    catch(error) {
      console.error(error);
      this.waitingForResponse = false;
      this.registrationForm.markAllAsTouched();
    }
  }

  //Gets first error in a list of errors
  getAnError(errors: ValidationErrors | null) {
    if(!errors) return null;
    return Object.keys(errors)[0]
  }
}
