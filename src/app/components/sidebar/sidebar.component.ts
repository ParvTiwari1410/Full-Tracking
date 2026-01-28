import { Component, OnInit } from '@angular/core';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
}

export const ROUTES: RouteInfo[] = [
  { path: '/dashboard', title: 'Dashboard', icon: 'dashboard' },
  { path: '/table-list', title: 'Vehicles', icon: 'directions_car' },
  { path: '/maps', title: 'Live Tracking', icon: 'map' },
  { path: '/user-profile', title: 'Drivers', icon: 'person' },
  { path: '/notifications', title: 'Alerts', icon: 'warning' },
  { path: '/trip-list', title: 'Trips', icon: 'timeline' },
  { path: '/playback', title: 'Playback', icon: 'history' }
];


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  menuItems: any[];

  constructor() { }

  ngOnInit() {
    this.menuItems = ROUTES;
  }
}
