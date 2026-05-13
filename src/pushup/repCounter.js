//seuil par défaut en degrés
export const DEFAULT_REP_COUNTER_CONFIG = {
  //bras tendu
  upThreshold: 160,
  //bras plié
  downThreshold: 110,
  //angle minimal à atteindre pour valider la rep
  depthThreshold: 90,
};

export class RepCounter {
  constructor(config = {}) {
    this.config = { ...DEFAULT_REP_COUNTER_CONFIG, ...config };
    this.state = 'UP';
    this.minAngle = Infinity;
    this.repStartedAt = 0;
    this.nextIndex = 0;
    this.postureLost = false;
  }
  // appelé à chaque frame
  update(angle, timestampMs, isPostureValid = true) {
    if (this.state === 'UP') {
      if (angle < this.config.downThreshold && isPostureValid) {
        this.state = 'DOWN';
        this.minAngle = angle;
        this.repStartedAt = timestampMs;
        this.postureLost = false;
      }
      return null;
    }
    //vérifie que la rep est bien valide selon tous les critères définis plus tot
    if (!isPostureValid) this.postureLost = true;
    if (angle < this.minAngle) this.minAngle = angle;
    if (angle > this.config.upThreshold) {
      const depthOk = this.minAngle < this.config.depthThreshold;
      const postureOk = !this.postureLost;
      const faults = [];
      if (!depthOk) faults.push('INSUFFICIENT_DEPTH');
      if (!postureOk) faults.push('POSTURE_LOST');
      const rep = {
        index: this.nextIndex++,
        startedAt: this.repStartedAt,
        endedAt: timestampMs,
        minElbowAngle: this.minAngle,
        valid: depthOk && postureOk,
        faults,
      };
      this.state = 'UP';
      this.minAngle = Infinity;
      this.postureLost = false;
      return rep;
    }
    return null;
  }

  //getters
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
    this.postureLost = false;
  }
}
