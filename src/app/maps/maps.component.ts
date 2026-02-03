import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../services/api.config';
@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements OnInit {

  vehicles: any[] = [];
  searchVehicleNo: string = '';

  showMap: boolean = false;
  errorMsg: string = '';

  center!: google.maps.LatLngLiteral;
  markerPosition!: google.maps.LatLngLiteral;
  zoom: number = 15;

  // 🔥 Speed related
  currentSpeed: number = 0;
  vehicleStatus: 'MOVING' | 'OFFLINE' = 'OFFLINE';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchVehicles();
  }

  fetchVehicles() {
    this.http.get<any[]>(`${API_URL}/vehicles`)
      .subscribe({
        next: data => this.vehicles = data,
        error: err => console.error(err)
      });
  }

  searchVehicle() {
    console.log('Search clicked');
    console.log('Entered vehicle:', this.searchVehicleNo);

    const vehicle = this.vehicles.find(v =>
      v.rc_no.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ===
      this.searchVehicleNo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    );

    console.log('Matched vehicle:', vehicle);

    if (!vehicle) {
      this.errorMsg = 'Vehicle not found';
      this.showMap = false;
      return;
    }

    this.errorMsg = '';

    this.center = {
      lat: Number(vehicle.latitude),
      lng: Number(vehicle.longitude)
    };

    this.markerPosition = this.center;
    this.zoom = 16;

    // 🔥 Fake status logic (replace later with backend)
    const isMoving = Math.random() > 0.5;

    if (isMoving) {
      this.vehicleStatus = 'MOVING';
      this.generateRandomSpeed();
    } else {
      this.vehicleStatus = 'OFFLINE';
      this.currentSpeed = 0;
    }

    // show map after everything is ready
    setTimeout(() => {
      this.showMap = true;
    }, 0);
  }

  generateRandomSpeed() {
    // realistic speed range
    this.currentSpeed = Math.floor(Math.random() * (90 - 20 + 1)) + 20;
  }
}
