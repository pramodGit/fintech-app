import {
  Component, inject, ViewChild, ElementRef,
  AfterViewChecked, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RealAgentService } from '../services/real-agent.service_gemini';

interface Preset {
  label: string;
  prompt: string;
}

@Component({
  selector: 'app-real-agent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './real-agent.component.html',
  styleUrl:    './real-agent.component.scss',
})
export class RealAgentComponent implements AfterViewChecked {
  readonly agent = inject(RealAgentService);

  @ViewChild('convoBody')    convoBody!: ElementRef<HTMLDivElement>;
  @ViewChild('inspectorBody') inspectorBody!: ElementRef<HTMLDivElement>;

  followUpText  = '';
  expandedTool: string | null = null;
  private prevThoughtCount = 0;

  // ── Preset prompts — each exercises a different part of the agent ──────────
  presets: Preset[] = [
    {
      label: '📊 Analyse my portfolio',
      prompt: 'Analyse my portfolio for user_001. Check all risk factors and tell me if anything needs attention.',
    },
    {
      label: '⚠️ Risk breach check',
      prompt: 'Is my portfolio (user_001) breaching any risk thresholds? If so, what should I do?',
    },
    {
      label: '📉 Rebalancing plan',
      prompt: 'My portfolio is too concentrated in tech. Compute a rebalancing plan to get risk score under 5.5.',
    },
    {
      label: '🌩️ Volatility impact',
      prompt: 'How is current NASDAQ volatility affecting my portfolio risk for user_001?',
    },
  ];

  // Auto-scroll when new thoughts arrive
  ngAfterViewChecked() {
    const thoughts = this.agent.thoughts();
    if (thoughts.length !== this.prevThoughtCount) {
      this.prevThoughtCount = thoughts.length;
      if (this.convoBody) {
        const el = this.convoBody.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }
  }

  runPreset(prompt: string) {
    this.agent.runAgent(prompt);
  }

  sendFollowUp() {
    if (!this.followUpText.trim() || this.agent.isRunning()) return;
    const msg = this.followUpText.trim();
    this.followUpText = '';
    this.agent.sendFollowUp(msg);
  }

  toggleTool(id: string) {
    this.expandedTool = this.expandedTool === id ? null : id;
  }

  reset() {
    this.agent.reset();
    this.expandedTool = null;
    this.followUpText = '';
  }
}