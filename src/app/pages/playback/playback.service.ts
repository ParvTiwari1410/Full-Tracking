import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PlaybackService {

  private API = 'http://10.0.20.204:3000/api';

  constructor(private http: HttpClient) {}

  getPlayback(vehicleId: string, from: string, to: string) {
    return this.http.get(
      `${this.API}/playback?vehicleId=${vehicleId}&from=${from}&to=${to}`
    );
  }
}
