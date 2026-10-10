export class KeyManager {
  private keys: string[];
  private currentIndex: number = 0;

  constructor(envKeyName: string) {
    const keyString = process.env[envKeyName] || "";
    // Allow comma separated keys
    this.keys = keyString.split(",").map(k => k.trim()).filter(k => k.length > 0);
  }

  public getKey(): string | null {
    if (this.keys.length === 0) return null;
    return this.keys[this.currentIndex];
  }

  public getNextKey(): string | null {
    if (this.keys.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`[KeyManager] Rotated to API key index ${this.currentIndex + 1}/${this.keys.length}`);
    return this.keys[this.currentIndex];
  }

  public hasMultipleKeys(): boolean {
    return this.keys.length > 1;
  }
}
