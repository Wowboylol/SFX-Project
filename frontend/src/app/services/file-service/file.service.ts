import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class FileService {
  public filesChanged = new EventEmitter<File[]>();

  constructor(private http: HttpClient) { }

  public getFiles() {
    const uri = `/api/files`;
    this.http.get(uri, {observe: 'body', responseType: 'json'})
      .subscribe((resObj) => {
        if(resObj == null) return;

        var tmp:File[] = [];
        var res = Object.values(resObj);
        res.forEach((file) => {
          tmp.push(file);
        })
        this.filesChanged.emit(tmp.slice());
      }
    );
  }

  public shareFile(fileId: string, email: string) {
    return this.http.post('/api/share-file', { file_id: fileId, email: email }, {observe: 'body', responseType: 'json'});
  }

  public downloadFile(fileId: string) {
    return this.http.get(`/api/download/${fileId}`, {responseType: "blob"});
  }

  public deleteFile(fileId: string) {
    return this.http.delete('/api/delete-file', { body: { file_id: fileId }});
  }
}
