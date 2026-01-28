import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-trip-list',
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.css']
})
export class TripListComponent implements OnInit {

  trips: any[] = [];
  filteredTrips: any[] = [];
  searchText = '';

  // report modal
  selectedReport: any = null;

  driverNames = [
    'Ramesh Kumar',
    'Suresh Yadav',
    'Anil Sharma',
    'Vijay Rao',
    'Mahesh Patil'
  ];

  reasons = [
    'Tyre replacement',
    'Lunch break',
    'Dinner break',
    'Minor accident',
    'Engine overheating'
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:3000/api/trips')
      .subscribe(data => {

        this.trips = data.map(t => {
          const totalStops = Math.floor(Math.random() * 6); // 0–5
          const longStops = totalStops > 0
            ? Math.floor(Math.random() * totalStops)
            : 0;

          return {
            ...t,
            stoppages: totalStops,
            longStoppages: longStops,
            driver: this.randomFrom(this.driverNames),
            reason: this.randomFrom(this.reasons)
          };
        });

        this.filteredTrips = this.trips;
      });
  }

  randomFrom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  search() {
    const term = this.searchText.toLowerCase();
    this.filteredTrips = this.trips.filter(t =>
      t.rc_no.toLowerCase().includes(term)
    );
  }

  generateReport(trip: any) {
    this.selectedReport = trip;
  }

  closeReport() {
    this.selectedReport = null;
  }
}
