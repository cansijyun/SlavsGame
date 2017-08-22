/// <reference path="Scene.ts"/>
/// <reference path="../game.ts"/>
/// <reference path="../Events.ts"/>

class SimpleBandit extends Scene {

    static TYPE = 3;

    initScene(game:Game) {
        let self = this;
        game.sceneManager = this;

        BABYLON.SceneLoader.Load("assets/scenes/map01/", "map01.babylon", game.engine, function (scene) {
            game.sceneManager = self;
            self
                .setDefaults(game)
                .optimizeScene(scene)
                .setCamera(scene);

            let sceneIndex = game.scenes.push(scene);
            game.activeScene = sceneIndex - 1;
            let assetsManager = new BABYLON.AssetsManager(scene);

            scene.executeWhenReady(function () {
                self.environment = new Environment(game, scene);
                self.initFactories(scene, assetsManager);
                assetsManager.onFinish = function (tasks) {
                    game.controller.registerControls(scene);
                    game.client.socket.emit('changeScenePre', {
                        sceneType: SimpleBandit.TYPE,
                    });
                };
                assetsManager.load();
                document.addEventListener(Events.PLAYER_CONNECTED, function () {
                    game.player.mesh.position = new BABYLON.Vector3(3, 0.1, 11);
                    game.player.emitPosition();

                    game.client.socket.emit('changeScenePost', {
                        sceneType: SimpleBandit.TYPE,
                    });
                });

            });

        });


    }

    public getType(): number {
        return SimpleBandit.TYPE;
    }
}