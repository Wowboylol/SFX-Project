import { Component, OnInit } from '@angular/core';
import { FileService } from 'src/app/services/file-service/file.service';
import { File } from 'src/app/shared/file.model';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.css']
})
export class FileListComponent {
  files: File[] = [];

  constructor(private fileService: FileService) {}

  ngOnInit() {
    this.fileService.filesChanged.subscribe((files: File[]) => {
      this.files = files;
    });
    this.fileService.getFiles();
  }
}
