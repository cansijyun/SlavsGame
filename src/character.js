var Character = (function () {
    function Character(mesh, name, game) {
        this.mesh = mesh;
        this.name = name;
        this.game = game;
        this.items = [];
        this.createItems();
        game.scene.beginAnimation(mesh.skeleton, 45, 80, true);
        this.mount(this.items.weapon, 'hand.R');
    }
    Character.prototype.createItems = function () {
        var sword = this.game.items.sword.clone();
        sword.visibility = true;
        this.game.shadowGenerator.getShadowMap().renderList.push(sword);
        sword.physicsImpostor = new BABYLON.PhysicsImpostor(sword, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 1 }, this.game.scene);
        this.items.weapon = sword;
    };
    Character.prototype.mount = function (mesh, boneName) {
        var boneIndice = -1;
        for (var i = 0; i < this.mesh.skeleton.bones.length; i++) {
            if (this.mesh.skeleton.bones[i].name == boneName) {
                boneIndice = i;
                break;
            }
        }
        var bone = this.mesh.skeleton.bones[boneIndice];
        mesh.attachToBone(bone, this.mesh);
        // mesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        mesh.position = new BABYLON.Vector3(0, 0, 0);
        mesh.rotation = new BABYLON.Vector3(0, 0, 80);
    };
    ;
    /**
     * ANIMATIONS
     */
    Character.prototype.runAnimationHit = function () {
        var self = this;
        self.animation = this.game.scene.beginAnimation(this.mesh.skeleton, 0, 30, false, 1, function () {
            self.game.scene.beginAnimation(self.mesh.skeleton, 45, 80, true);
            self.animation = null;
        });
    };
    Character.prototype.runAnimationWalk = function (emit) {
        var self = this;
        var rotation;
        if (emit && self.game.client.socket) {
            if (self.mesh.rotationQuaternion) {
                rotation = self.mesh.rotationQuaternion;
            }
            else {
                rotation = new BABYLON.Quaternion(0, 0, 0, 0);
            }
            self.game.client.socket.emit('moveTo', {
                p: self.mesh.position,
                r: rotation
            });
        }
        if (!this.animation) {
            self.animation = this.game.scene.beginAnimation(this.mesh.skeleton, 90, 109, false, 1, function () {
                self.game.scene.beginAnimation(self.mesh.skeleton, 45, 80, true);
                self.animation = null;
            });
        }
    };
    Character.prototype.isAnimationEnabled = function () {
        return this.animation;
    };
    return Character;
})();
//# sourceMappingURL=character.js.map