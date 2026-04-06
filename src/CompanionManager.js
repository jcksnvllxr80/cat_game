import Phaser from 'phaser';

/**
 * CompanionManager — manages the cat party follow system.
 * All cats in the party are visible sprites that follow the active character.
 * When switching, control transfers to the next cat and others follow.
 */

const TEXTURE_MAP = {
  whiskers: 'cat_whiskers_f0',
  luna: 'cat_luna_f0',
  boots: 'cat_boots_f0',
  cleo: 'cat_cleo_f0',
  mochi: 'cat_mochi_f0',
};

const FOLLOW_DISTANCE = 40; // Horizontal spacing between followers
const HISTORY_LENGTH = 120; // Frames of position history to store
const FOLLOW_DELAY = 15; // Frames of delay between each follower

export class CompanionManager {
  /**
   * @param {Phaser.Scene} scene - The level scene
   * @param {object} playerState - The shared playerState object
   * @param {Phaser.Physics.Arcade.Sprite} player - The player sprite
   * @param {Phaser.Physics.Arcade.StaticGroup} platforms - Platforms group for collisions
   */
  constructor(scene, playerState, player, platforms) {
    this.scene = scene;
    this.playerState = playerState;
    this.player = player;
    this.platforms = platforms;
    this.companions = []; // Array of { key, sprite, shadow }
    this.positionHistory = []; // Array of { x, y, flipX, moving, onGround }
    this.playerShadow = null;

    // Create shadow under the player
    this.playerShadow = scene.add.image(player.x, player.y + 18, 'cat_shadow');
    this.playerShadow.setDepth(9);
    this.playerShadow.setScale(1.2, 1);

    // Create companion sprites for existing party members (excluding active)
    this.syncCompanions();
  }

  /** Rebuild companion sprites to match playerState.party */
  syncCompanions() {
    // Destroy existing companion sprites
    this.companions.forEach(c => {
      c.sprite.destroy();
      c.shadow.destroy();
    });
    this.companions = [];

    const party = this.playerState.party;
    const active = this.playerState.activeChar;

    party.forEach((catKey, i) => {
      if (catKey === active) return;

      const texture = TEXTURE_MAP[catKey] || `cat_${catKey}_f0`;
      const sprite = this.scene.physics.add.sprite(
        this.player.x - (this.companions.length + 1) * FOLLOW_DISTANCE,
        this.player.y,
        texture
      );
      sprite.setScale(1.5);
      sprite.body.setSize(20, 22);
      sprite.body.setOffset(14, 14);
      sprite.setCollideWorldBounds(true);
      sprite.setBounce(0);
      sprite.setDepth(8); // Behind the player (depth 10)
      sprite.setFlipX(this.player.flipX);
      // Slightly transparent to distinguish from player
      sprite.setAlpha(0.9);

      // Collide with platforms
      this.scene.physics.add.collider(sprite, this.platforms);

      // Shadow under companion
      const shadow = this.scene.add.image(sprite.x, sprite.y + 18, 'cat_shadow');
      shadow.setDepth(7);
      shadow.setScale(1.2, 1);

      this.companions.push({ key: catKey, sprite, shadow });
    });
  }

  /** Call when a new cat joins the party */
  addToParty(catKey) {
    // Already synced through playerState.party, just rebuild
    this.syncCompanions();
  }

  /** Switch active character — transfers control, all others become followers */
  switchCharacter() {
    const party = this.playerState.party;
    if (party.length < 2) return;

    const currentIdx = party.indexOf(this.playerState.activeChar);
    const nextIdx = (currentIdx + 1) % party.length;
    const newActive = party[nextIdx];
    const oldActive = this.playerState.activeChar;

    // Find the companion sprite that will become the player
    const newActiveCompanion = this.companions.find(c => c.key === newActive);
    if (!newActiveCompanion) return;

    // Save current player position/velocity
    const prevX = this.player.x;
    const prevY = this.player.y;
    const prevVelX = this.player.body.velocity.x;
    const prevVelY = this.player.body.velocity.y;
    const prevFlipX = this.player.flipX;

    // Move player sprite to new active companion's position
    const newX = newActiveCompanion.sprite.x;
    const newY = newActiveCompanion.sprite.y;
    this.player.setPosition(newX, newY);
    this.player.setVelocity(0, 0);

    // Set player texture to new active character
    const newTexture = TEXTURE_MAP[newActive] || `cat_${newActive}_f0`;
    this.player.setTexture(newTexture);
    this.player.body.setSize(20, 22);
    this.player.body.setOffset(14, 14);
    this.player.setFlipX(newActiveCompanion.sprite.flipX);

    // Move the old active companion to where the player was
    newActiveCompanion.key = oldActive;
    const oldTexture = TEXTURE_MAP[oldActive] || `cat_${oldActive}_f0`;
    newActiveCompanion.sprite.setTexture(oldTexture);
    newActiveCompanion.sprite.setPosition(prevX, prevY);
    newActiveCompanion.sprite.setVelocity(prevVelX, prevVelY);
    newActiveCompanion.sprite.setFlipX(prevFlipX);
    newActiveCompanion.sprite.body.setSize(20, 22);
    newActiveCompanion.sprite.body.setOffset(14, 14);

    // Update state
    this.playerState.activeChar = newActive;

    // Clear position history so followers smoothly regroup
    this.positionHistory = [];

    // Camera follows the player (which is now at the new position)
    this.scene.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Flash effect
    this.player.setTint(0xaa88ff);
    this.scene.time.delayedCall(200, () => this.player.clearTint());

    const charNames = { whiskers: 'Whiskers', luna: 'Luna', boots: 'Boots', cleo: 'Cleo', mochi: 'Mochi' };
    this.scene.showQuickMessage(`Switched to ${charNames[newActive]}!`, 0xaa88ff);
  }

  /** Call every frame in update() — records position history and moves companions */
  update() {
    const moving = this.player.body.velocity.x !== 0;
    const onGround = this.player.body.blocked.down;

    // Record player position each frame
    this.positionHistory.unshift({
      x: this.player.x,
      y: this.player.y,
      flipX: this.player.flipX,
      moving,
      onGround,
    });

    // Trim history
    if (this.positionHistory.length > HISTORY_LENGTH) {
      this.positionHistory.length = HISTORY_LENGTH;
    }

    // Update player shadow
    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 18);
      // Scale shadow based on whether player is in air
      const airScale = onGround ? 1.2 : 0.8;
      this.playerShadow.setScale(airScale, 1);
      this.playerShadow.setAlpha(onGround ? 0.35 : 0.15);
    }

    // Update each companion to follow the position history with delay
    this.companions.forEach((comp, i) => {
      const delay = (i + 1) * FOLLOW_DELAY;
      const historyIdx = Math.min(delay, this.positionHistory.length - 1);

      if (historyIdx < 0 || this.positionHistory.length === 0) return;

      const target = this.positionHistory[historyIdx];
      const sprite = comp.sprite;

      // Smoothly move toward the historical position
      const dx = target.x - sprite.x;
      const dy = target.y - sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 4) {
        // Move toward target position
        const speed = Math.min(dist * 4, 400);
        sprite.setVelocityX((dx / dist) * speed);

        // Only adjust vertical velocity if not on ground and target is significantly above/below
        if (Math.abs(dy) > 10 && !sprite.body.blocked.down) {
          sprite.setVelocityY(dy * 3);
        } else if (dy < -20 && sprite.body.blocked.down) {
          // Need to jump to follow player up
          sprite.setVelocityY(this.playerState.jumpPower || -400);
        }
      } else {
        sprite.setVelocityX(0);
      }

      // Match facing direction
      sprite.setFlipX(target.flipX);

      // Play appropriate animation
      const animPrefix = comp.key;
      const isMoving = Math.abs(sprite.body.velocity.x) > 20;
      const compOnGround = sprite.body.blocked.down;

      if (!compOnGround) {
        sprite.anims.stop();
      } else if (isMoving) {
        const walkAnim = `${animPrefix}_walk`;
        if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== walkAnim) {
          sprite.play(walkAnim);
        }
        // Speed up animation if moving fast
        if (Math.abs(sprite.body.velocity.x) > 250) {
          sprite.anims.msPerFrame = 80;
        } else {
          sprite.anims.msPerFrame = 125;
        }
      } else {
        sprite.play(`${animPrefix}_idle`, true);
      }

      // Update companion shadow
      if (comp.shadow) {
        comp.shadow.setPosition(sprite.x, sprite.y + 18);
        const compAir = compOnGround ? 1.2 : 0.8;
        comp.shadow.setScale(compAir, 1);
        comp.shadow.setAlpha(compOnGround ? 0.3 : 0.12);
      }
    });
  }

  /** Clean up all companion sprites and shadows */
  destroy() {
    this.companions.forEach(c => {
      c.sprite.destroy();
      c.shadow.destroy();
    });
    this.companions = [];
    if (this.playerShadow) {
      this.playerShadow.destroy();
      this.playerShadow = null;
    }
  }

  /** Get all companion sprites (for adding collision with enemies, etc.) */
  getCompanionSprites() {
    return this.companions.map(c => c.sprite);
  }
}
