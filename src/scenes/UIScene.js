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
    this.hudBg.fillRoundedRect(8, 8, 260, 120, 8);

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
      'Level2Scene': 'Zone 2: Whispering Woods'
    };
    this.add.text(1024 / 2, 14, zoneNames[this.levelKey] || '', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#FFFFFF',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0).setAlpha(0.7);

    // Controls reminder
    this.add.text(1024 - padding, 576 - 16, 'ARROWS: Move | SHIFT: Run | SPACE: Jump | X: Pounce | E: Talk | TAB: Switch | V: Night Vision', {
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
      'luna': { name: '🌙 Luna', color: '#AA88FF' }
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
  }
}
