import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../services/api.config';

interface Vehicle {
  rc_no: string;
  speed: number;
  status: string;
  latitude: number;
  longitude: number;
  last_updated: string;
  lastSeen?: string;
}

@Component({
  selector: 'app-table-list',
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.css']
})
export class TableListComponent implements OnInit {

  vehicles: Vehicle[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.http.get<Vehicle[]>(`${API_URL}/vehicles`)
      .subscribe(data => {
        this.vehicles = data.map(v => ({
          ...v,
          lastSeen: v.last_updated   // ✅ correct field
        }));
      });
  }
}
