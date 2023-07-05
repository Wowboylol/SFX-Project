import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { saveAs } from "file-saver";
import { File } from '../../../shared/file.model';
import { UserService } from '../../../services/user-service/user.service';
import { FileService } from 'src/app/services/file-service/file.service';

@Component({
  selector: 'app-file-item',
  templateUrl: './file-item.component.html',
  styleUrls: ['./file-item.component.css']
})
export class FileItemComponent 
{
  @Input() file: File;
  @ViewChild('email') emailRef:ElementRef;
  public isSearching = false;
  public errorMessage = "";

  constructor(private userService: UserService, private fileService: FileService) { }

  onChange()
  {
    const email = this.emailRef.nativeElement.value;

    this.isSearching = true;
    this.errorMessage = null;
   
    if(email == this.userService.getUser().email) {
      this.errorMessage = "Cannot share a file with yourself!";
      this.isSearching = false;
      return;
    }
    else if(email == "") {
      this.errorMessage = "Please enter a email";
      this.isSearching = false;
      return;
    }

    let userSearchObservable = this.userService.searchUser(email);
    userSearchObservable.subscribe(
      (res) => {
        if(res.status == 200) {
          console.log("User found!");
          this.isSearching = false;
        }
      },
      (errorMessage) => {
        this.errorMessage = "User not found!"
        this.isSearching = false;
      }
    );
  }

  onShare() 
  { 
    console.log("Sharing file with user: " + this.emailRef.nativeElement.value);
    
    let shareFileObservable = this.fileService.shareFile(this.file._id, this.emailRef.nativeElement.value);
    shareFileObservable.subscribe(
      (res) => {
        console.log("File shared!");
      },
      (errorMessage) => {
        console.log("Error sharing file!");
      }
    );
  }

  onDownload()
  {
    const downloadObservable = this.fileService.downloadFile(this.file._id);
    downloadObservable.subscribe(
      {
        complete: () => {
          console.log("File downloaded");
        },
        next: (blob) => {
          saveAs(blob, this.file.name);
        },
        error: (error) => {
          console.log(error);
        }
      }
    );
  }

  onDelete()
  {
    console.log("Deleting file: " + this.file._id);

    let deleteFileObservable = this.fileService.deleteFile(this.file._id);
    deleteFileObservable.subscribe(
      (res) => {
        this.fileService.getFiles();
        return res["message"];
      },
      (errorMessage) => {
        return errorMessage["message"];
      }
    );
  }
}
