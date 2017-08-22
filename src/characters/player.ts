/// <reference path="AbstractCharacter.ts"/>
/// <reference path="../game.ts"/>

class Player extends AbstractCharacter {

    public walkSmoke: BABYLON.ParticleSystem;
    public inventory: Character.Inventory;
    public playerLight: BABYLON.PointLight;

    public constructor(game:Game, id, name, registerMoving: boolean) {
        this.id = id;
        this.name = name;

        this.statistics = new Attributes.CharacterStatistics(100, 100, 100, 10, 10, 125, 50, 100).setPlayer(this);
        this.isControllable = registerMoving;

        this.sfxWalk = new BABYLON.Sound("CharacterWalk", "/assets/Characters/Warrior/walk.wav", game.getScene(), null, { loop: true, autoplay: false });
        this.sfxHit = new BABYLON.Sound("CharacterHit", "/", game.getScene(), null, { loop: false, autoplay: false });

        let mesh = game.factories['character'].createInstance('Warrior', true);
        mesh.position = new BABYLON.Vector3(1, 0.1, 11);
        mesh.rotation = new BABYLON.Vector3(0, 0.1, 0);
        game.getScene().activeCamera.position = mesh.position;
        mesh.scaling = new BABYLON.Vector3(1.4, 1.4, 1.4);
        this.mesh = mesh;
        this.game = game;
        this.bloodParticles = new Particles.Blood(game, this.mesh).particleSystem;

        mesh.actionManager = new BABYLON.ActionManager(game.getScene());
        this.createItems();

        if(this.isControllable) {
            this.mesh.isPickable = false;


            //let playerLight = new BABYLON.PointLight("playerLightSpot", new BABYLON.Vector3(0, 5, 0), game.getScene());
            var playerLight = new BABYLON.SpotLight("playerLightSpot",
                new BABYLON.Vector3(0, 25, 0),
                new BABYLON.Vector3(0, -1, 0),
                null,
                null,
                game.getScene());
            playerLight.diffuse = new BABYLON.Color4(1, 0.7, 0.3, 1);
            playerLight.angle = 2;
            playerLight.exponent = 15;
            playerLight.intensity = 0.8;
            playerLight.parent = this.mesh;
            this.playerLight = playerLight;
            //
            //var playerLightPoint = new BABYLON.PointLight("pointLighPLayer",
            //    new BABYLON.Vector3(0, 1, 0),
            //    game.getScene());
            //playerLightPoint.diffuse = new BABYLON.Color4(1, 0.7, 0.3, 1);
            //playerLightPoint.intensity = 0.3;
            //playerLightPoint.parent = this.mesh;
            //
            //this.playerLight = playerLightPoint;
            game.getScene().lights.push(playerLight);

            game.gui = new GUI.Main(game, this);

            let attackArea = BABYLON.MeshBuilder.CreateBox('player_attackArea', {
                width: 4,
                height: 0.1,
                size: 4
            }, game.getScene());
            attackArea.parent = this.mesh;
            attackArea.visibility = 0;
            attackArea.isPickable = false;

            this.attackArea = attackArea;
        }

        this.walkSmoke = new Particles.WalkSmoke(game, this.mesh).particleSystem;

        super(name, game);
    }

    /**
     * Moving events
     */
    protected registerMoving() {
        let walkSpeed = AbstractCharacter.WALK_SPEED * (this.statistics.getWalkSpeed() / 100);
        let game = this.game;
        let mesh = this.mesh;

        if (game.controller.left) {
            mesh.rotate(BABYLON.Axis.Y, -AbstractCharacter.ROTATION_SPEED, BABYLON.Space.LOCAL);
            this.emitPosition();
        }

        if (game.controller.right) {
            mesh.rotate(BABYLON.Axis.Y, AbstractCharacter.ROTATION_SPEED, BABYLON.Space.LOCAL);
            this.emitPosition();
        }

        if (game.controller.forward) {
            mesh.translate(BABYLON.Axis.Z, -walkSpeed, BABYLON.Space.LOCAL);
            this.runAnimationWalk(true);

            return;
        }
        if (game.controller.back) {
            mesh.translate(BABYLON.Axis.Z, walkSpeed, BABYLON.Space.LOCAL);
            this.runAnimationWalk(true);

            return;
        }

        ///stop move and start attack animation
        if(this.animation && !this.attackAnimation) {
            this.animation.stop();
        }
    }

    /**
     * Attack Collisions
     * 
     * @returns {Player}
     */
    protected weaponCollisions() {
        let game = this.game;
        let self = this;

        if(this.attackArea && this.attackAnimation && !this.attackHit) {
            this.attackHit = true;
            for (var i = 0; i < game.enemies.length; i++) {
                var enemy = game.enemies[i];
                let enemyMesh = enemy.mesh;
                if (this.attackArea.intersectsMesh(enemy.attackArea, false)) {
                    let animationEnemty = enemy;
                    setTimeout(function () {
                        if (!animationEnemty.sfxHit.isPlaying) {
                            animationEnemty.sfxHit.setVolume(2);
                            animationEnemty.sfxHit.play();
                        }
                        this.game.gui.characterTopHp.showHpCharacter(animationEnemty);
                        animationEnemty.bloodParticles.start();
                        let newValue = animationEnemty.statistics.getHp() - self.statistics.getDamage();
                        animationEnemty.statistics.hp = (newValue);
                        this.game.gui.characterTopHp.hpBar.value = newValue;
                        if (newValue <= 0) {
                            animationEnemty.removeFromWorld();
                            game.controller.attackPoint = null;
                        }
                    }, 300);
                }
            }
        }

        return this;
    }

    public removeFromWorld() {
        this.game.getScene().unregisterAfterRender(this.afterRender);
        this.mesh.dispose();
        //this.items.weapon.mesh.dispose();
        //this.items.shield.mesh.dispose();

    }


    protected registerFunctionAfterRender() {
        let self = this;
        this.afterRender = function() {
            if (self.isControllable) {
                self.weaponCollisions();
                self.registerMoving();
                if(self.game.controller.forward) {
                    self.game.getScene().activeCamera.position = self.mesh.position;
                }
            }
        }
    }

    public createItems() {
        this.inventory = new Character.Inventory(this.game, this);
        this.inventory.initPlayerItems();
    }

    protected onHitStart() {
        //this.items.weapon.sfxHit.play(0.3);
    };

    protected onHitEnd() {
        this.attackHit = false;
    };

    protected onWalkStart() {
        this.walkSmoke.start();
    }

    protected onWalkEnd() {
        this.walkSmoke.stop();
    }

}