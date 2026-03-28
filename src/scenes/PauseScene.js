import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  init(data) {
    this.callerScene = data.callerScene || 'Level1Scene';
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Semi-transparent dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);

    // Menu box
    const boxW = 320;
    const boxH = 220;
    const boxX = cx - boxW / 2;
    const boxY = cy - boxH / 2;

    const box = this.add.graphics();
    box.fillStyle(0x1a1a2e, 0.97);
    box.fillRoundedRect(boxX, boxY, boxW, boxH, 16);
    box.lineStyle(3, 0xFFD700, 0.9);
    box.strokeRoundedRect(boxX, boxY, boxW, boxH, 16);

    // Title
    this.add.text(cx, boxY + 36, 'PAUSED', {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Resume button
    const resumeBtn = this.add.text(cx, boxY + 100, '▶  Resume', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      backgroundColor: '#2a2a4e',
      padding: { x: 24, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerover', () => resumeBtn.setColor('#FFD700'));
    resumeBtn.on('pointerout', () => resumeBtn.setColor('#FFFFFF'));
    resumeBtn.on('pointerdown', () => this.resume());

    // Main Menu button
    const menuBtn = this.add.text(cx, boxY + 160, '⌂  Main Menu', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      backgroundColor: '#2a2a4e',
      padding: { x: 24, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#FF8888'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#FFFFFF'));
    menuBtn.on('pointerdown', () => this.goToMainMenu());

    // ESC to resume
    this.input.keyboard.on('keydown-ESC', () => this.resume());
    this.input.keyboard.on('keydown-P', () => this.resume());
  }

  resume() {
    this.scene.resume(this.callerScene);
    this.scene.stop();
  }

  goToMainMenu() {
    this.scene.stop(this.callerScene);
    this.scene.stop('UIScene');
    this.scene.stop();
    this.scene.start('TitleScene');
  }
}
