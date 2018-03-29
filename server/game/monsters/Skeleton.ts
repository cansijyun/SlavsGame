namespace Monsters {
    export class Skeleton extends AbstractMonster {

        constructor(id, position, itemsToDrop, specialItemsToDrop:Array) {
            super(id, position, itemsToDrop, specialItemsToDrop);

            this.name = 'Skeleton';
            this.type = 'skeletons';
            this.meshName = 'Skeleton';
            this.lvl = 3;
            this.experience = 25;
            this.attackAreaSize = 2;
            this.visibilityAreaSize = 15;
            this.statistics = new Attributes.CharacterStatistics(300, 300, 100, 3, 10, 6, 0, 100);
        }

    }
}