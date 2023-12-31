import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SessionService
{
  constructor(private http: HttpClient) { }

  public getProfile()
  {
    return this.http.get('/api/profile',{observe: 'body', responseType: 'json'});
  }
}
