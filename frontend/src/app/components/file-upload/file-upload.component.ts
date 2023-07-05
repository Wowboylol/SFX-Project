import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  fileName = '';
  fileData: FormData;
  
  constructor(private http: HttpClient, private router: Router) {}
  
  onFileSelected(event) {
    const file: File = event.target.files[0];
    if (file) {
      this.fileName = file.name;
      this.fileData = new FormData();
      this.fileData.append("upload", file);
    }
  }

  onSubmit() {
    this.http.post("/api/files", this.fileData).subscribe((res) => {
      console.log(Object.values(res)[0]);
      this.router.navigate(['files']);
    });
  }
}
