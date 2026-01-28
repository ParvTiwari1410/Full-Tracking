import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';
import { PlaybackComponent } from './pages/playback/playback.component';
import { LoginComponent } from './pages/login/login.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

const routes: Routes = [

  // Login page
  { path: 'login', component: LoginComponent },

  // Admin shell (everything after login)
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./layouts/admin-layout/admin-layout.module')
            .then(m => m.AdminLayoutModule)
      }
    ]
  },
  { path: 'playback', component: PlaybackComponent },
  // Only redirect EMPTY path
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(routes, { useHash: true })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
