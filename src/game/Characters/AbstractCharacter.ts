import {Game} from "../Game";
import * as BABYLON from 'babylonjs';

export abstract class AbstractCharacter {

    public static ANIMATION_WALK:string = 'Run';
    public static ANIMATION_DEATH:string = 'death';
    public static ANIMATION_STAND_WEAPON:string = 'Stand_with_weapon';
    public static ANIMATION_ATTACK_01:string = 'Attack';
    public static ANIMATION_ATTACK_02:string = 'Attack02';
    public static ANIMATION_SKILL_01:string = 'Skill01';
    public static ANIMATION_SKILL_02:string = 'Skill02';

    public mesh:BABYLON.Mesh;
    public meshForMove:BABYLON.Mesh;
    public id:any;
    public name:string;

    /** Character atuts */
    public statistics;

    public game:Game;
    public animation:BABYLON.Animatable;
    public isControllable:boolean;
    public isAttack: boolean;
    public isWalk: boolean;
    public isStand: boolean;
    public isDeath: boolean;

    public sfxWalk: BABYLON.Sound;
    protected sfxHit: BABYLON.Sound;

    public bloodParticles: BABYLON.IParticleSystem;
    public walkSmoke: BABYLON.IParticleSystem;
    public dynamicFunction;
    public particleSystemEmitter;
    public navAgentIndex: number;

    constructor(name:string, game:Game) {
        this.name = name;
        this.game = game;
    }

    protected initPatricleSystemDamage() {
        let emitterDamage = BABYLON.Mesh.CreateBox("emitter0", 0.1, this.game.getBabylonScene());
        emitterDamage.parent = this.mesh;
        emitterDamage.position.y = 4;
        emitterDamage.visibility = 0;
        this.particleSystemEmitter = emitterDamage;

        return this;
    }

    public showDamage(damage) {
        let dynamicTexture = new BABYLON.DynamicTexture(null, 128, this.game.getBabylonScene(), true);
        let font = "44px RuslanDisplay";
        dynamicTexture.drawText(damage, 64, 80, font, "white", null, true, true);

        let particleSystemDamage = new BABYLON.ParticleSystem(null, 1 /*Capacity, i.e. max of 1 at a time*/, this.game.getBabylonScene());
        particleSystemDamage.emitter = this.particleSystemEmitter;
        particleSystemDamage.emitRate = 100;
        particleSystemDamage.minSize = 2.0;
        particleSystemDamage.maxSize = 4.0;
        particleSystemDamage.gravity = new BABYLON.Vector3(0, -9.81*2, 0);
        particleSystemDamage.direction1 = new BABYLON.Vector3(0, 10, 0);
        particleSystemDamage.direction2 = new BABYLON.Vector3(0,10, 0);
        particleSystemDamage.minAngularSpeed = -Math.PI;
        particleSystemDamage.maxAngularSpeed = Math.PI;
        particleSystemDamage.minLifeTime = 1;
        particleSystemDamage.maxLifeTime = 1;
        particleSystemDamage.targetStopDuration = 0.8;
        particleSystemDamage.particleTexture = dynamicTexture;
        particleSystemDamage.layerMask = 2;
        particleSystemDamage.start();

        setTimeout(function() {
            dynamicTexture.dispose();
            particleSystemDamage.dispose();
        },1500);
    }

    protected createBoxForMove(position: BABYLON.Vector3) {
        const scene = this.game.getBabylonScene();

        this.meshForMove = BABYLON.Mesh.CreateBox(this.name+'_moveBox', 4, scene, false);
        this.meshForMove.checkCollisions = true;
        this.meshForMove.visibility = 0;
        this.meshForMove.position = position;
        this.meshForMove.layerMask = 2;

        return this;
    }

    public runAnimationHit(animation: string, callbackStart = null, callbackEnd = null, loop: boolean = false): void {
        if (this.animation) {
            this.animation.stop();
        }
        let self = this;
        let mesh = this.mesh;
        let skeleton = mesh.skeleton;
        this.isAttack = true;

        if (callbackEnd) {
            callbackStart();
        }

        if (self.sfxHit) {
            self.sfxHit.play();
        }

        self.animation = skeleton.beginAnimation(animation, loop, 1, function () {
            if (callbackEnd) {
                callbackEnd();
            }

            self.runAnimationDeathOrStand();
            self.isAttack = false;
        });
    }

    public runAnimationSkill(animation: string, callbackStart = null, callbackEnd = null, loop: boolean = false, speed: number = 1, standAnimationOnFinish: boolean = true): void {
        let self = this;
        let mesh = this.mesh;
        let skeleton = mesh.skeleton;

        if (callbackStart) {
            callbackStart();
        }

        self.animation = skeleton.beginAnimation(animation, loop, speed, function () {
            if (callbackEnd) {
                callbackEnd();
            }

            if(standAnimationOnFinish) {
                self.runAnimationDeathOrStand();
            }
        });
    }


    public runAnimationWalk():void {
        let skeleton = this.mesh.skeleton;

        if(!this.isWalk && !this.isAttack && skeleton) {
            let self = this;
            this.isWalk = true;

            self.sfxWalk.play();
            self.onWalkStart();
            self.animation = skeleton.beginAnimation(AbstractCharacter.ANIMATION_WALK, true, 1.2, function () {
                self.runAnimationDeathOrStand();
                self.animation = null;
                self.isWalk = false;
                self.sfxWalk.stop();
                self.onWalkEnd();
            });
        }
    }

    public runAnimationStand():void {
        let skeleton = this.mesh.skeleton;

        if(!this.isStand && skeleton) {
            let self = this;
            this.isStand = true;

            self.animation = skeleton.beginAnimation(AbstractCharacter.ANIMATION_STAND_WEAPON, true, 1, function () {
                self.animation = null;
                self.isStand = false;
                if(self.isDeath) {
                    self.runAnimationDeath();
                }
            });
        }
    }

    public runAnimationDeath():void {
        this.animation = this.mesh.skeleton.beginAnimation(AbstractCharacter.ANIMATION_DEATH);
    }

    public runAnimationDeathOrStand():void {
        if(this.isDeath) {
            this.runAnimationDeath();
        } else {
            this.runAnimationStand();
        }
    }

    public getWalkSpeed() {
        let animationRatio = this.game.getBabylonScene().getAnimationRatio();

        return this.statistics.walkSpeed / animationRatio;
    };

    abstract removeFromWorld();

    /** Events */
    protected onWalkStart() {};
    protected onWalkEnd() {};
}
