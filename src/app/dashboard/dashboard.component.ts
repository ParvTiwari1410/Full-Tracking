import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  stats = [];
  trips = [];
  alerts = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.http.get<any[]>('http://localhost:3000/api/vehicles')
      .subscribe(data => {

        const total = data.length;
        const online = data.filter(v => v.status !== 'offline').length;
        const offline = data.filter(v => v.status === 'offline').length;
        const alerts = data.filter(v => v.speed > 80);

        this.stats = [
          { label: 'Total Vehicles', value: total, icon: 'directions_car', color: 'card-header-info', note: 'All registered' },
          { label: 'Online', value: online, icon: 'wifi', color: 'card-header-success', note: 'Currently active' },
          { label: 'Offline', value: offline, icon: 'wifi_off', color: 'card-header-danger', note: 'No signal' },
          { label: 'Alerts Today', value: alerts.length, icon: 'warning', color: 'card-header-warning', note: 'Speed > 80' }
        ];

        // Recent Trips (last 5 moving vehicles)
        this.trips = data
          .filter(v => v.status === 'moving')
          .slice(0, 5)
          .map(v => ({
            vehicle: v.rc_no,
            from: v.latitude.toFixed(2),
            to: v.longitude.toFixed(2),
            distance: v.speed
          }));

        // Alerts list
        this.alerts = alerts.map(v =>
          `${v.rc_no} overspeeding at ${v.speed} km/h`
        );

      });
  }
}
