export type RepState = 'UP' | 'DOWN';
export type Fault = 'INSUFFICIENT_DEPTH';

export interface Rep {
  index: number;
  startedAt: number;
  endedAt: number;
  minElbowAngle: number;
  valid: boolean;
  faults: Fault[];
}

export interface RepCounterConfig {
  upThreshold: number;
  downThreshold: number;
  depthThreshold: number;
}

export const DEFAULT_REP_COUNTER_CONFIG: RepCounterConfig = {
  upThreshold: 160,
  downThreshold: 110,
  depthThreshold: 90,
};

export class RepCounter {
  private readonly config: RepCounterConfig;
  private state: RepState = 'UP';
  private minAngle = Infinity;
  private repStartedAt = 0;
  private nextIndex = 0;

  constructor(config: Partial<RepCounterConfig> = {}) {
    this.config = { ...DEFAULT_REP_COUNTER_CONFIG, ...config };
  }

  update(angle: number, timestampMs: number): Rep | null {
    if (this.state === 'UP') {
      if (angle < this.config.downThreshold) {
        this.state = 'DOWN';
        this.minAngle = angle;
        this.repStartedAt = timestampMs;
      }
      return null;
    }
    if (angle < this.minAngle) this.minAngle = angle;
    if (angle > this.config.upThreshold) {
      const valid = this.minAngle < this.config.depthThreshold;
      const rep: Rep = {
        index: this.nextIndex++,
        startedAt: this.repStartedAt,
        endedAt: timestampMs,
        minElbowAngle: this.minAngle,
        valid,
        faults: valid ? [] : ['INSUFFICIENT_DEPTH'],
      };
      this.state = 'UP';
      this.minAngle = Infinity;
      return rep;
    }
    return null;
  }

  get currentState(): RepState {
    return this.state;
  }

  get currentMinAngle(): number {
    return this.minAngle;
  }

  reset(): void {
    this.state = 'UP';
    this.minAngle = Infinity;
    this.repStartedAt = 0;
    this.nextIndex = 0;
  }
}
