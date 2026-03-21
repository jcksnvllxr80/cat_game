import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;

    // Gradient sky background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xFFB347, 0xFFB347);
    bg.fillRect(0, 0, width, height);

    // Rolling hills
    bg.fillStyle(0x4CAF50);
    for (let i = 0; i < width; i += 2) {
      const hillHeight = Math.sin(i * 0.008) * 40 + Math.sin(i * 0.015) * 20;
      bg.fillRect(i, height - 120 + hillHeight, 2, 120 - hillHeight);
    }
    bg.fillStyle(0x388E3C);
    for (let i = 0; i < width; i += 2) {
      const hillHeight = Math.sin(i * 0.012 + 1) * 30 + Math.sin(i * 0.02) * 15;
      bg.fillRect(i, height - 80 + hillHeight, 2, 80 - hillHeight);
    }

    // Ground
    bg.fillStyle(0x6B4914);
    bg.fillRect(0, height - 40, width, 40);
    bg.fillStyle(0x4CAF50);
    bg.fillRect(0, height - 44, width, 8);

    // Clouds
    this.createCloud(150, 80);
    this.createCloud(400, 50);
    this.createCloud(700, 90);
    this.createCloud(900, 40);

    // Title
    const titleShadow = this.add.text(width / 2 + 3, 83, 'PAWS OF DESTINY', {
      fontSize: '52px',
      fontFamily: 'Georgia, serif',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.3);

    const title = this.add.text(width / 2, 80, 'PAWS OF DESTINY', {
      fontSize: '52px',
      fontFamily: 'Georgia, serif',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#8B4513',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 135, 'The Quest for the Dog King', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#FFFFFF',
      fontStyle: 'italic',
      stroke: '#333333',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Animated cat silhouette on title screen
    const cat = this.add.sprite(width / 2, height - 160, 'cat_whiskers_f0').setScale(3);
    cat.play('whiskers_walk');

    // Bobbing animation for cat
    this.tweens.add({
      targets: cat,
      y: height - 170,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Title float animation
    this.tweens.add({
      targets: [title, titleShadow],
      y: '+=5',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Play button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff8c42, 1);
    btnBg.fillRoundedRect(width / 2 - 100, height - 100, 200, 50, 12);
    btnBg.lineStyle(3, 0xFFD700);
    btnBg.strokeRoundedRect(width / 2 - 100, height - 100, 200, 50, 12);

    const playText = this.add.text(width / 2, height - 75, 'START ADVENTURE', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Make button interactive
    const hitZone = this.add.zone(width / 2, height - 75, 200, 50).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xffa555, 1);
      btnBg.fillRoundedRect(width / 2 - 100, height - 100, 200, 50, 12);
      btnBg.lineStyle(3, 0xFFD700);
      btnBg.strokeRoundedRect(width / 2 - 100, height - 100, 200, 50, 12);
    });

    hitZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xff8c42, 1);
      btnBg.fillRoundedRect(width / 2 - 100, height - 100, 200, 50, 12);
      btnBg.lineStyle(3, 0xFFD700);
      btnBg.strokeRoundedRect(width / 2 - 100, height - 100, 200, 50, 12);
    });

    hitZone.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('Level1Scene');
      });
    });

    // Controls hint
    this.add.text(width / 2, height - 30, 'Arrow Keys: Move  |  SPACE: Jump  |  X: Pounce  |  E: Interact', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Blink the play text
    this.tweens.add({
      targets: playText,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.cameras.main.fadeIn(500);
  }

  createCloud(x, y) {
    const cloud = this.add.graphics();
    cloud.fillStyle(0xffffff, 0.8);
    cloud.fillEllipse(x, y, 60, 30);
    cloud.fillEllipse(x + 25, y - 8, 40, 25);
    cloud.fillEllipse(x - 20, y - 5, 35, 22);

    // Slow drift
    this.tweens.add({
      targets: cloud,
      x: 30,
      duration: 20000 + Math.random() * 10000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}
