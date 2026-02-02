import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface PlaybackPoint {
  lat: number;
  lng: number;
  speed: number;
  created_at: string;
}

interface PlaybackResponse {
  vehicle: {
    id: string;
    driverName: string;
  };
  points: PlaybackPoint[];
}

interface TripSummary {
  vehicleId: string;
  driverName: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  totalDistanceKm: number;
  avgSpeed: number;
  maxSpeed: number;
}

@Component({
  selector: 'app-playback',
  templateUrl: './playback.component.html',
  styleUrls: ['./playback.component.css']
})
export class PlaybackComponent implements OnInit, OnDestroy {

  vehicleId = '';
  fromTime = '';
  toTime = '';

  playbackPoints: PlaybackPoint[] = [];
  currentIndex = 0;
  isPlaying = false;

  rangeStart!: Date;
  rangeEnd!: Date;

  tripSummary: TripSummary | null = null;

  // ===============================
  // GOOGLE MAPS STATE
  // ===============================
  zoom = 13;

  center: google.maps.LatLngLiteral = {
    lat: 28.6139,
    lng: 77.2090
  };

  currentPosition: google.maps.LatLngLiteral | null = null;
  path: google.maps.LatLngLiteral[] = [];

  polylineOptions: google.maps.PolylineOptions = {
    strokeColor: '#1976d2',
    strokeOpacity: 1,
    strokeWeight: 4
  };

  private interval?: number;

  // ===============================
  // SMOOTH ANIMATION
  // ===============================
  animationFrameId: number | null = null;
  animationSteps = 30; // more = smoother

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.pause();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // ===============================
  // CLOCK
  // ===============================
  get currentPlaybackTime(): string {
    if (!this.playbackPoints.length) return '--:--:--';

    const date = new Date(this.playbackPoints[this.currentIndex].created_at);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // ===============================
  // LOAD PLAYBACK DATA
  // ===============================
  loadPlayback(): void {
    if (!this.vehicleId || !this.fromTime || !this.toTime) {
      alert('Please fill in all fields');
      return;
    }

    this.pause();

    this.rangeStart = new Date(this.fromTime);
    this.rangeEnd = new Date(this.toTime);

    const url =
      `http://localhost:3000/api/playback` +
      `?vehicleId=${this.vehicleId}` +
      `&from=${this.fromTime}` +
      `&to=${this.toTime}`;

    this.http.get<PlaybackResponse>(url).subscribe({
      next: (res) => {
        const points = res.points;

        if (!points || points.length === 0) {
          alert('No playback data found for selected range');
          return;
        }

        this.playbackPoints = points;
        this.currentIndex = 0;

        // Polyline
        this.path = points.map(p => ({
          lat: p.lat,
          lng: p.lng
        }));

        // Initial marker
        this.currentPosition = this.path[0];
        this.center = this.path[0];
        this.zoom = 15;

        // Trip summary
        const startTime = new Date(points[0].created_at);
        const endTime = new Date(points[points.length - 1].created_at);

        this.tripSummary = {
          vehicleId: res.vehicle.id,
          driverName: res.vehicle.driverName,
          startTime,
          endTime,
          durationMinutes: Math.round(
            (endTime.getTime() - startTime.getTime()) / 60000
          ),
          totalDistanceKm: 0,

          // 🎲 Random avg speed
          avgSpeed: Math.floor(Math.random() * 60) + 20,

          // Real max speed
          maxSpeed: Math.max(...points.map(p => p.speed ?? 0))
        };
      },
      error: () => {
        alert('Failed to load playback data');
      }
    });
  }

  // ===============================
  // SMOOTH MARKER MOVEMENT
  // ===============================
  private moveMarkerSmooth(): void {
    if (this.currentIndex >= this.playbackPoints.length - 1) return;

    const start = this.playbackPoints[this.currentIndex];
    const end = this.playbackPoints[this.currentIndex + 1];

    let step = 0;

    const animate = () => {
      step++;
      const progress = step / this.animationSteps;

      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;

      this.currentPosition = { lat, lng };
      this.center = this.currentPosition;

      if (step < this.animationSteps) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // ===============================
  // PLAYBACK CONTROLS
  // ===============================
  play(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.interval = window.setInterval(() => {
      if (this.currentIndex < this.playbackPoints.length - 1) {
        this.moveMarkerSmooth();
        this.currentIndex++;
      } else {
        this.pause();
      }
    }, 1000);
  }

  pause(): void {
    this.isPlaying = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  forward(): void {
    if (this.currentIndex < this.playbackPoints.length - 1) {
      this.moveMarkerSmooth();
      this.currentIndex++;
    }
  }

  reverse(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const point = this.playbackPoints[this.currentIndex];
      this.currentPosition = { lat: point.lat, lng: point.lng };
      this.center = this.currentPosition;
    }
  }

  // ===============================
  // JUMP TO TIME
  // ===============================
  jumpTo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) return;

    const [h, m] = input.value.split(':').map(Number);

    const target = new Date(this.rangeStart);
    target.setHours(h, m, 0, 0);

    if (target < this.rangeStart || target > this.rangeEnd) return;

    const index = this.playbackPoints.findIndex(p =>
      new Date(p.created_at) >= target
    );

    if (index !== -1) {
      this.currentIndex = index;
      const point = this.playbackPoints[this.currentIndex];
      this.currentPosition = { lat: point.lat, lng: point.lng };
      this.center = this.currentPosition;
    }
  }
}
