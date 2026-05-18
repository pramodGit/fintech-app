import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // Required if using Standalone Components

@Component({
  selector: 'app-root',
  standalone: true, // Only if you are using modern Angular (v14+)
  imports: [RouterOutlet], // Makes sure the <router-outlet> tag works
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Global app properties only (like the website title)
  title = 'my-angular-app'; 
  
  // Do NOT put dashboard-specific methods or variables here anymore!
}