import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        "path": '',
        "loadComponent": () => import('./dashboard/dashboard').then(m => m.DashboardComponent)
    },
    {
        "path": 'real-agentic',
        "loadComponent": () => import('./components/real-agent.component').then(m => m.RealAgentComponent)
    },
    // Optional: Redirect any unknown paths back to dashboard
    { path: '**', redirectTo: '' }
];
