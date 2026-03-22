import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init(data) {
    this.playerState = data.playerState;
    this.levelKey = data.levelKey || 'Level1Scene';
  }

  create() {
    const padding = 16;

    // HUD Background panel
    this.hudBg = this.add.graphics();
    this.hudBg.fillStyle(0x000000, 0.5);
    this.hudBg.fillRoundedRect(8, 8, 260, 140, 8);

    this.gameOverTriggered = false;

    // Hunger bar
    this.add.text(padding, 16, '🐟 Hunger', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFB347'
    });
    this.hungerBarBg = this.add.graphics();
    this.hungerBarBg.fillStyle(0x333333);
    this.hungerBarBg.fillRoundedRect(padding + 80, 18, 160, 14, 4);
    this.hungerBar = this.add.graphics();

    // Thirst bar
    this.add.text(padding, 38, '💧 Thirst', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#4FC3F7'
    });
    this.thirstBarBg = this.add.graphics();
    this.thirstBarBg.fillStyle(0x333333);
    this.thirstBarBg.fillRoundedRect(padding + 80, 40, 160, 14, 4);
    this.thirstBar = this.add.graphics();

    // Health bar
    this.add.text(padding, 60, '❤️ Health', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#FF6B6B'
    });
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x333333);
    this.healthBarBg.fillRoundedRect(padding + 80, 62, 160, 14, 4);
    this.healthBar = this.add.graphics();

    // Map pieces counter
    this.add.text(padding, 84, '🗺️ Map:', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700'
    });
    this.mapText = this.add.text(padding + 55, 84, '0/7', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
      fontStyle: 'bold'
    });

    // Tuna counter
    this.tunaText = this.add.text(padding + 110, 84, '🐟 x0', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#4a90d9'
    });

    // Active character display
    this.charLabel = this.add.text(padding, 102, '🐱 Whiskers', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#FF8C42',
      fontStyle: 'bold'
    });

    this.partyText = this.add.text(padding + 120, 102, '', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888'
    });

    // Lives display
    this.livesText = this.add.text(padding, 120, '🐾 Lives: 9', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff6699',
      fontStyle: 'bold'
    });

    // Pounce cooldown indicator
    this.pounceText = this.add.text(1024 - padding, 16, '[X] POUNCE READY', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#44FF44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0);

    // Night Vision indicator (hidden until Luna joins)
    this.nvText = this.add.text(1024 - padding, 34, '[V] NIGHT VISION', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0).setAlpha(0);

    // Character switch hint (hidden until party > 1)
    this.switchText = this.add.text(1024 - padding, 52, '[TAB] SWITCH CHARACTER', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#AA88FF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0).setAlpha(0);

    // Interaction hint
    this.interactHint = this.add.text(512, 576 - 40, 'Press E to talk', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#00000080',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setAlpha(0);

    // Zone name display
    const zoneNames = {
      'Level1Scene': 'Zone 1: Purrville Meadows',
      'Level2Scene': 'Zone 2: Whispering Woods',
      'Level3Scene': 'Zone 3: Tuna Bay Docks',
      'Level4Scene': 'Zone 4: Catnip Canyon',
      'Level5Scene': 'Zone 5: The Yarn Factory',
      'Level6Scene': 'Zone 6: Snowpaw Summit',
      'Level7Scene': 'Zone 7: Dog King\'s Fortress'
    };
    this.add.text(1024 / 2, 14, zoneNames[this.levelKey] || '', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#FFFFFF',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0).setAlpha(0.7);

    // Music volume control
    this.musicVolume = 0.4;
    this.volumeText = this.add.text(1024 - padding, 576 - 34, 'M/N: Vol 40%', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#AAAAAA',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 1).setAlpha(0.6);

    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);

    // Controls reminder
    this.add.text(1024 - padding, 576 - 16, 'ARROWS: Move | SHIFT: Run | SPACE: Jump | X: Pounce | E: Talk | TAB: Switch | V: Night Vision | M/N: Volume', {
      fontSize: '9px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 1).setAlpha(0.5);

    // Listen for vitals updates
    const level = this.scene.get(this.levelKey);
    if (level) {
      level.events.on('updateVitals', this.updateBars, this);
    }

    this.updateBars(this.playerState);
  }

  updateBars(state) {
    const padding = 16;
    const barX = padding + 80;
    const barWidth = 160;

    // Hunger bar
    this.hungerBar.clear();
    const hungerPct = state.hunger / 100;
    const hungerColor = hungerPct > 0.5 ? 0xFFB347 : hungerPct > 0.25 ? 0xFF8C00 : 0xFF4444;
    this.hungerBar.fillStyle(hungerColor);
    this.hungerBar.fillRoundedRect(barX, 18, barWidth * hungerPct, 14, 4);

    // Thirst bar
    this.thirstBar.clear();
    const thirstPct = state.thirst / 100;
    const thirstColor = thirstPct > 0.5 ? 0x4FC3F7 : thirstPct > 0.25 ? 0x0288D1 : 0xFF4444;
    this.thirstBar.fillStyle(thirstColor);
    this.thirstBar.fillRoundedRect(barX, 40, barWidth * thirstPct, 14, 4);

    // Health bar
    this.healthBar.clear();
    const healthPct = state.health / state.maxHealth;
    const healthColor = healthPct > 0.5 ? 0xFF6B6B : healthPct > 0.25 ? 0xFF4444 : 0xCC0000;
    this.healthBar.fillStyle(healthColor);
    this.healthBar.fillRoundedRect(barX, 62, barWidth * healthPct, 14, 4);

    // Map pieces
    this.mapText.setText(`${state.mapPieces}/7`);

    // Tuna counter
    this.tunaText.setText(`🐟 x${state.tunasCollected}`);

    // Active character
    const charInfo = {
      'whiskers': { name: '🐱 Whiskers', color: '#FF8C42' },
      'luna': { name: '🌙 Luna', color: '#AA88FF' },
      'boots': { name: '👟 Boots', color: '#44AAFF' },
      'cleo': { name: '🐾 Cleo', color: '#FFAA44' },
      'mochi': { name: '🍡 Mochi', color: '#AADDAA' }
    };
    const active = charInfo[state.activeChar] || charInfo['whiskers'];
    if (this.charLabel) {
      this.charLabel.setText(active.name);
      this.charLabel.setColor(active.color);
    }

    // Party info
    if (state.party && state.party.length > 1 && this.partyText) {
      const others = state.party
        .filter(c => c !== state.activeChar)
        .map(c => charInfo[c]?.name || c);
      this.partyText.setText(`Party: ${others.join(', ')}`);
    }

    // Pounce status
    if (state.pounceReady) {
      this.pounceText.setText('[X] POUNCE READY');
      this.pounceText.setColor('#44FF44');
    } else {
      this.pounceText.setText('[X] COOLDOWN...');
      this.pounceText.setColor('#FF4444');
    }

    // Show Night Vision and Switch hints when party has Luna
    if (state.party && state.party.includes('luna')) {
      this.nvText.setAlpha(1);
      this.switchText.setAlpha(1);

      // NV active indicator
      const level = this.scene.get(this.levelKey);
      if (level && level.nightVisionActive) {
        this.nvText.setText('[V] NV: ON');
        this.nvText.setColor('#44FF44');
      } else {
        this.nvText.setText('[V] NIGHT VISION');
        this.nvText.setColor(state.activeChar === 'luna' ? '#44FF44' : '#666666');
      }
    }

    // Lives display
    if (state.lives !== undefined && this.livesText) {
      this.livesText.setText(`🐾 Lives: ${state.lives}`);
      if (state.lives <= 3) {
        this.livesText.setColor('#FF4444');
      }
    }

    // Game over when lives hit 0 (life deduction handled by each level)
    if (state.lives !== undefined && state.lives <= 0 && !this.gameOverTriggered) {
      this.gameOverTriggered = true;
      const level = this.scene.get(this.levelKey);
      if (level) level.scene.pause();
      this.triggerGameOver();
    }

    // Low vitals warning
    if (state.hunger < 25 || state.thirst < 25) {
      if (!this.warningTween) {
        this.warningTween = this.tweens.add({
          targets: state.hunger < 25 ? this.hungerBar : this.thirstBar,
          alpha: 0.4,
          duration: 300,
          yoyo: true,
          repeat: -1
        });
      }
    } else if (this.warningTween) {
      this.warningTween.stop();
      this.warningTween = null;
      this.hungerBar.setAlpha(1);
      this.thirstBar.setAlpha(1);
    }
  }

  update() {
    const level = this.scene.get(this.levelKey);
    if (level && level.nearbyNpc) {
      this.interactHint.setAlpha(1);
    } else {
      this.interactHint.setAlpha(0);
    }

    // Volume down (M)
    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      this.musicVolume = Math.max(0, this.musicVolume - 0.1);
      this.sound.setVolume(this.musicVolume);
      this.volumeText.setText(`M/N: Vol ${Math.round(this.musicVolume * 100)}%`);
    }

    // Volume up (N)
    if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
      this.musicVolume = Math.min(1, this.musicVolume + 0.1);
      this.sound.setVolume(this.musicVolume);
      this.volumeText.setText(`M/N: Vol ${Math.round(this.musicVolume * 100)}%`);
    }
  }

  triggerGameOver() {
    // Stop all music and play game over music
    this.sound.stopAll();
    this.sound.play('gameover', { loop: false, volume: 0.5 });

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 1024, 576);
    overlay.setDepth(200);

    // Game Over text
    this.add.text(512, 180, 'GAME OVER', {
      fontSize: '64px',
      fontFamily: 'Georgia, serif',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(201);

    this.add.text(512, 260, 'All 9 lives used up...', {
      fontSize: '22px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(201);

    this.add.text(512, 320, 'The cats are exhausted and need a nap.', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(201);

    // Try again button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff6644, 1);
    btnBg.fillRoundedRect(412, 380, 200, 50, 12);
    btnBg.setDepth(201);
    btnBg.setInteractive(new Phaser.Geom.Rectangle(412, 380, 200, 50), Phaser.Geom.Rectangle.Contains);

    const btnText = this.add.text(512, 405, 'Try Again', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(202);

    btnBg.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xff8866, 1);
      btnBg.fillRoundedRect(412, 380, 200, 50, 12);
    });
    btnBg.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xff6644, 1);
      btnBg.fillRoundedRect(412, 380, 200, 50, 12);
    });
    btnBg.on('pointerdown', () => {
      this.sound.stopAll();
      const level = this.scene.get(this.levelKey);
      if (level) {
        level.scene.stop();
      }
      this.scene.stop();
      this.scene.start('TitleScene');
    });
  }
}
