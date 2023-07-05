import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors} from "@angular/forms";

@Injectable({
  providedIn: 'root'
})
export class RegValidationService {

  constructor() {}

  //------------------------------
  //Functions return a ValidationErrors list containing list of errors
  //------------------------------

  emailValidation(control: AbstractControl): ValidationErrors {
      const errors: ValidationErrors = {}
      const value = control.value;
      if(value) {
        if(value.length <= 0) errors["Email cannot be empty"] = true;
        //Detects invalid emails
        if(!((new RegExp('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$')).test(value))) errors["Not a valid email"] = true;
      }
      else {
        errors["Email cannot be empty"] = true;
      }
      return errors;
  }

  passwordValidation(control: AbstractControl): ValidationErrors {
      const errors: ValidationErrors = {}
      const value = control.value;
      if(value) {
        if(value.length <= 0) errors["Password cannot be empty"] = true;
        if(value.length < 5) errors["Password minimum length is 5"] = true;
        if(value.length > 30) errors["Password max length is 30"] = true;
      }
      else{
        errors["Password cannot be empty"] = true;
      }

      return errors;
  }

  passwordConfirmationValidation(control: AbstractControl): ValidationErrors {
      const errors: ValidationErrors = {}
      const mainPasswordInput = control.parent?.get("password");
      //Makes sure that confirmation field is the same as main password field
      if(!mainPasswordInput || control.value != mainPasswordInput.value) errors["Confirmation password does not match"] = true;

      return errors;
  }

  nameValidation(control: AbstractControl): ValidationErrors {
      const errors: ValidationErrors = {}
      const value = control.value;
      if(value) {
        if(value.length <= 0) errors["Name is required"] = true;
        if(value.length > 25) errors["Name cannot be longer than 25 characters"] = true;
        //Detects if the are any non alphabetic characters in the field
        if(!/^[a-zA-Z]+$/.test(value)) errors["Invalid characters in name"] = true;
      }
      else{
        errors["Name is required"] = true;
      }
      
      return errors;
  }
}
