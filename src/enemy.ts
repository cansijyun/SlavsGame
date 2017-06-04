class Enemy {

    public x:number;
    public y:number;
    public z:number;
    public character:Character;
    public afterRender;

    protected visibilityArea: Mesh;
    protected attackArea: Mesh;

    constructor(game: Game) {
        let mesh = game.characters['worm'].clone();
        let skeleton = game.characters['worm'].skeleton.clone();
        let material = game.characters['worm'].material.clone();

        mesh.visibility = true;
        mesh.skeleton = skeleton;
        mesh.material = material;
        mesh.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
        mesh.position = new BABYLON.Vector3(Game.randomNumber(3,-10), 1.1, Game.randomNumber(-10,-16));
        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass:1, friction:0.01, restitution:0.2}, game.scene);

        let attackArea = BABYLON.MeshBuilder.CreateBox('enemy_attackArea', { width: 5, height: 0.1, size: 5}, game.scene);
        attackArea.parent = mesh;
        attackArea.visibility = false;

        let visivilityArea = BABYLON.MeshBuilder.CreateBox('enemy_visivilityArea', { width: 32, height: 0.1, size: 32}, game.scene);
        visivilityArea.parent = mesh;
        visivilityArea.visibility = false;

        mesh.physicsImpostor.physicsBody.fixedRotation = true;
        mesh.physicsImpostor.physicsBody.updateMassProperties();

        this.visibilityArea = visivilityArea;
        this.attackArea = attackArea;

        game.sceneManager.shadowGenerator.getShadowMap().renderList.push(mesh);

        this.character = new Worm(mesh, name, game);

        game.enemies.push(this);
        let self = this;
        this.afterRender = function() {
            if(game.player) {
                if (self.visibilityArea.intersectsMesh(game.player.character.mesh, false)) {
                    self.character.mesh.lookAt(game.player.character.mesh.position);

                    var playerMesh = game.player.character.mesh.getChildMeshes()[0];
                    if(self.attackArea.intersectsMesh(playerMesh, false)) {
                        self.character.runAnimationHit();

                        //if (self.character.items.weapon.intersectsMesh(game.player.character.mesh, false)) {
                        //    playerMesh.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
                        //
                        //    var value = game.guiElements.hpBar.getValue();
                        //
                        //    game.guiElements.hpBar.updateValue(value - 0.2);
                        //
                        //    if(value-0.1 < 0) {
                        //        alert('Padłeś');
                        //        window.location.reload();
                        //    }
                        //} else {
                        //    playerMesh.material.emissiveColor = new BABYLON.Color4(0, 0, 0, 0);
                        //}

                    } else {
                        var velocity = BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0, 0, -0.041), self.character.mesh.computeWorldMatrix());
                        self.character.mesh.moveWithCollisions(velocity);
                        self.character.runAnimationWalk();

                    }
                }
            }
        };
        game.scene.registerAfterRender(this.afterRender);
    }
}