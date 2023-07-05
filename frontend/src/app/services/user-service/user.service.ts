import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, lastValueFrom } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface UserData {
  _id: string,
  email: string,
  firstName: string,
  lastName: string,
  key: string,
  password: string,
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: UserData = {} as UserData;

  constructor(private http: HttpClient) {}

  setUser(new_user: UserData) {
    this.user = new_user;
  }

  getUser(): UserData {
    return this.user;
  }

  async registerUser(userData: UserData) {
    console.log("Sending Post Request", userData);

    const backendURI = `/api/register`;
    const httpOptions = {
      headers: new HttpHeaders({
       "Content-Type": "application/json"
      }),
      //responseType: 'text' as const // Otherwise, response is read as an object
    };
    
    /*
    const postObservable = this.http.post(backendURI, userData, httpOptions)
     
    .subscribe((response) => { 
        console.log(response);
      });
      
    console.log("SENDING");
    const response = await lastValueFrom(postObservable);
    console.log(response as Error);
    console.log("END");
    */

    try {
      const postObservable = this.http.post(backendURI, userData, httpOptions)
      console.log("SENDING");
      const response = await lastValueFrom(postObservable);
      console.log(response);
      return response;
    }
    catch(error) {
      console.error((error as HttpErrorResponse).error.message);
      return (error);
    }
    //return response;
  }

  public searchUser(email: string) {
    return this.http.post('/api/search-user', { email: email }, {observe: 'response', responseType: 'text'})
  }

  async updateUser(fname: string, lname: string, key: string) {
    const uri = `/api/profile`;
    const data = {fname: fname, lname: lname, key: key};
    try {
      const postObservable = this.http.post(uri, data, {observe: 'body', responseType: 'text'});
      console.log("SENDING");
      const response = await lastValueFrom(postObservable);
      console.log(response);
      return response;
    }
    catch(error) {
      console.error((error as HttpErrorResponse).error.message);
      return (error);
    }
  }

}