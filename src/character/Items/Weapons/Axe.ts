/// <reference path="Weapon.ts"/>

namespace Items.Weapons {
    export class Axe extends Items.Weapon {

        constructor(game:Game) {
            super(game);

            this.name = 'Axe';
            this.image = 'BigSword';
            this.mesh = game.factories['character'].createInstance('Axe');
            this.mesh.visibility = 0;
            this.statistics = new Attributes.ItemStatistics(0, 0, 0, 10, 0, 0, 0, 0);

            this.sfxHit = new BABYLON.Sound("Fire", "/babel/Items/Sword/Sword.wav", this.game.getScene(), null, {
                loop: false,
                autoplay: false
            });

        }
    }
}