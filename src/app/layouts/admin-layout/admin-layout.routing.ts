import { Routes } from '@angular/router';

import { DashboardComponent } from '../../dashboard/dashboard.component';
import { UserProfileComponent } from '../../user-profile/user-profile.component';
import { TableListComponent } from '../../table-list/table-list.component';
import { TripListComponent } from '../../pages/trip-list/trip-list.component';

import { TypographyComponent } from '../../typography/typography.component';
import { IconsComponent } from '../../icons/icons.component';
import { MapsComponent } from '../../maps/maps.component';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { UpgradeComponent } from '../../upgrade/upgrade.component';

export const AdminLayoutRoutes: Routes = [

  // Main pages
  { path: 'dashboard', component: DashboardComponent },
  { path: 'table-list', component: TableListComponent },
  { path: 'trip-list', component: TripListComponent },
  { path: 'user-profile', component: UserProfileComponent },

  // Optional template pages (can remove later)
  { path: 'typography', component: TypographyComponent },
  { path: 'icons', component: IconsComponent },
  { path: 'maps', component: MapsComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'upgrade', component: UpgradeComponent },

  // Default inside admin
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
