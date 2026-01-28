import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Vehicle {
  rc_no: string;
  speed: number;
  status: string;
  latitude: number;
  longitude: number;
  formatted_date: string;
  formatted_time: string;
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
    this.http.get<any[]>('http://localhost:3000/api/vehicles')

      .subscribe(data => {
        this.vehicles = data.map(v => ({
  ...v,
  lastSeen: `${v.formatted_date.replace(/_/g,'-')} ${v.formatted_time}`
}));

      });
  }
}
