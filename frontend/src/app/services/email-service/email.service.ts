import { Injectable } from '@angular/core';
import { UserData } from '../user-service/user.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient) { }

  sendWelcomeEmail(recipient: string, userData: UserData) {
    const body = {
      recipientEmail: recipient,
      userData: userData
    }
    this.http.post("/api/sendwelcomemail", body)
      .subscribe(
        {
          complete: () => {
            console.log("Send welcome email");
          },
          error: (error) => {
            console.error(error);
          }
        }
    );

  }
}
