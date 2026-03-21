import Phaser from 'phaser';

export class DialogScene extends Phaser.Scene {
  constructor() {
    super('DialogScene');
  }

  init(data) {
    this.lines = data.lines || [];
    this.currentLine = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Semi-transparent overlay
    this.overlay = this.add.graphics();
    this.overlay.fillStyle(0x000000, 0.3);
    this.overlay.fillRect(0, 0, width, height);

    // Dialog box
    const boxY = height - 160;
    const boxHeight = 140;

    this.dialogBox = this.add.graphics();
    this.dialogBox.fillStyle(0x1a1a2e, 0.95);
    this.dialogBox.fillRoundedRect(20, boxY, width - 40, boxHeight, 12);
    this.dialogBox.lineStyle(3, 0xFFD700, 0.8);
    this.dialogBox.strokeRoundedRect(20, boxY, width - 40, boxHeight, 12);

    // Speaker name
    this.speakerText = this.add.text(50, boxY + 12, '', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#FFD700',
      fontStyle: 'bold'
    });

    // Dialog text
    this.dialogText = this.add.text(50, boxY + 40, '', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      wordWrap: { width: width - 120 },
      lineSpacing: 4
    });

    // Continue prompt
    this.continueText = this.add.text(width - 60, boxY + boxHeight - 24, '▼', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
      fontStyle: 'bold'
    });

    this.tweens.add({
      targets: this.continueText,
      y: this.continueText.y + 5,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Show first line
    this.showLine();

    // Click or key to advance
    this.input.on('pointerdown', () => this.nextLine());
    this.input.keyboard.on('keydown-SPACE', () => this.nextLine());
    this.input.keyboard.on('keydown-E', () => this.nextLine());
    this.input.keyboard.on('keydown-ENTER', () => this.nextLine());

    // Typewriter state
    this.isTyping = false;
    this.fullText = '';
  }

  showLine() {
    if (this.currentLine >= this.lines.length) {
      this.closeDialog();
      return;
    }

    const line = this.lines[this.currentLine];

    // Speaker color based on character
    const colors = {
      'Whiskers': '#FF8C42',
      'Mr. Pawston': '#AAAAAA',
      'Grandma Mittens': '#DDDDFF',
      'Sgt. Fluffbottom': '#FFDDAA',
      'Luna': '#AA88FF',
      'Boots': '#88DDFF',
      'Cleo': '#FFB3D9',
      'Mochi': '#AADDAA',
      'King Biscuit': '#FFD700',
      'Frightened Mouse': '#BB9977',
      'Professor Hoot': '#CC9944',
      'Wandering Cat': '#FFAA66',
      'Captain Saltwhisker': '#5588AA',
      'Dock Worker': '#CC8844',
      'Fish Merchant': '#66AACC',
      'Shopkeeper Cat': '#DDAA66',
      'Traveling Cat': '#FFAA66',
      'Kit': '#FFCC88',
      'Canyon Guide': '#CC7744',
      'Old Factory Cat': '#888888',
      'Maintenance Mouse': '#BBAA88',
      'Shivering Cat': '#99BBDD',
      'Mountain Goat': '#CCCCAA',
      'Fortress Mouse': '#AAAAAA',
      'King Biscuit': '#FFD700',
      'Head Squirrel': '#AA7744'
    };

    this.speakerText.setText(line.speaker);
    this.speakerText.setColor(colors[line.speaker] || '#FFD700');

    // Typewriter effect
    this.fullText = line.text;
    this.dialogText.setText('');
    this.isTyping = true;
    this.typeIndex = 0;

    if (this.typeTimer) this.typeTimer.destroy();
    this.typeTimer = this.time.addEvent({
      delay: 30,
      callback: () => {
        this.typeIndex++;
        this.dialogText.setText(this.fullText.substring(0, this.typeIndex));
        if (this.typeIndex >= this.fullText.length) {
          this.isTyping = false;
          this.typeTimer.destroy();
        }
      },
      repeat: this.fullText.length - 1
    });

    this.continueText.setAlpha(0);
    this.time.delayedCall(this.fullText.length * 30 + 200, () => {
      this.continueText.setAlpha(1);
    });
  }

  nextLine() {
    if (this.isTyping) {
      // Skip to full text
      this.isTyping = false;
      if (this.typeTimer) this.typeTimer.destroy();
      this.dialogText.setText(this.fullText);
      this.continueText.setAlpha(1);
      return;
    }

    this.currentLine++;
    this.showLine();
  }

  closeDialog() {
    // Resume whichever level scene is paused
    const levels = ['Level7Scene', 'Level6Scene', 'Level5Scene', 'Level4Scene', 'Level3Scene', 'Level2Scene', 'Level1Scene'];
    for (const level of levels) {
      if (this.scene.isActive(level) || this.scene.isPaused(level)) {
        this.scene.resume(level);
        break;
      }
    }
    this.scene.stop();
  }
}
