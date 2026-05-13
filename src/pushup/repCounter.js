export const DEFAULT_REP_COUNTER_CONFIG = {
  upThreshold: 160,
  downThreshold: 110,
  depthThreshold: 90,
};

export class RepCounter {
  constructor(config = {}) {
    this.config = { ...DEFAULT_REP_COUNTER_CONFIG, ...config };
    this.state = 'UP';
    this.minAngle = Infinity;
    this.repStartedAt = 0;
    this.nextIndex = 0;
  }

  update(angle, timestampMs) {
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
      const rep = {
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

  get currentState() {
    return this.state;
  }

  get currentMinAngle() {
    return this.minAngle;
  }

  reset() {
    this.state = 'UP';
    this.minAngle = Infinity;
    this.repStartedAt = 0;
    this.nextIndex = 0;
  }
}
