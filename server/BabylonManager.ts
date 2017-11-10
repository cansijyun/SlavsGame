namespace Server {

    export class BabylonManager {

        protected slavsServer:SlavsServer;
        protected engine:BABYLON.NullEngine;
        protected scene:BABYLON.Scene;
        protected socket;

        /* Game Data */

        protected enemies = [];
        protected players = [];

        constructor(slavsServer:SlavsServer) {
            this.slavsServer = slavsServer;
            this.socket = socketIOClient.connect('http://127.0.0.1:' + config.server.port, {query: 'monsterServer=1'});
            this.enemies = [];
            this.players = [];
            this.initEngine();
        }

        public initEngine() {
            this.engine = new BABYLON.NullEngine();
            let scene = new BABYLON.Scene(this.engine);
            this.scene = scene;
            let camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, BABYLON.Vector3.Zero(), scene);
            this
                .socketShowEnemies(scene)
                .socketPlayerConnected(scene)
                .socketUpdatePlayer(scene)
                .removePlayer();
            this.engine.runRenderLoop(function () {
                scene.render();
            })


        }


        /**
         * @returns {SocketIOClient}
         */
        public socketShowEnemies(scene:BABYLON.Scene) {
            let self = this;
            this.socket.on('showEnemies', function (data) {
                data.forEach(function (enemyData, key) {
                    let enemy = self.enemies[key];
                    if (!enemy) {
                        let box = BABYLON.Mesh.CreateBox(data.id, 3, scene, false);
                        box.position = new BABYLON.Vector3(enemyData.position.x, enemyData.position.y, enemyData.position.z);

                        let visibilityArea = BABYLON.MeshBuilder.CreateBox('enemy_visivilityArea', {
                            width: 30,
                            height: 1,
                            size: 30
                        }, scene);
                        visibilityArea.parent = box;

                        enemy = {
                            mesh: box,
                            haveTarget: false,
                            activeTargetPoints: [],
                            visibilityAreaMesh: visibilityArea
                        };
                        self.enemies[key] = enemy;
                    }
                });
            });

            return this;
        }

        public socketPlayerConnected(scene:BABYLON.Scene) {
            let self = this;

            this.socket.on('newPlayerConnected', function (data) {
                console.log('connected new player');
                data.forEach(function (socketRemotePlayer) {
                    let remotePlayerKey = null;

                    if (socketRemotePlayer.id !== self.socket.id) {
                        self.players.forEach(function (remotePlayer, key) {
                            if (remotePlayer.id == socketRemotePlayer.id) {
                                remotePlayerKey = key;

                                return;
                            }
                        });

                        if (remotePlayerKey === null) {
                            console.log('added new player to remote player array');

                            let activePlayer = socketRemotePlayer.characters[socketRemotePlayer.activePlayer];
                            let box = BABYLON.Mesh.CreateBox(socketRemotePlayer.id, 3, scene, false);
                            box.position = new BABYLON.Vector3(activePlayer.positionX, activePlayer.positionY, activePlayer.positionZ);
                            box.actionManager = new BABYLON.ActionManager(scene);

                            let remotePlayer = {
                                id: socketRemotePlayer.id,
                                mesh: box
                            };
                            self.players.push(remotePlayer);
                            self.registerPlayerInEnemyActionManager(box);
                        }
                    }
                });
            });

            return this;
        }

        /**
         *
         * @returns {SocketIOClient}
         */
        protected removePlayer() {
            let self = this;
            this.socket.on('removePlayer', function (id) {
                self.players.forEach(function (remotePlayer, key) {
                    if (remotePlayer.id == id) {
                        let player = self.players[key];
                        //TODO: null engine bug
                        player.mesh.actionManager.dispose();

                        self.players.splice(key, 1);
                    }
                });
            });

            return this;
        }
        
        protected registerPlayerInEnemyActionManager(playerMesh: BABYLON.AbstractMesh) {
            let self = this;

            this.enemies.forEach(function(enemy, key) {
                enemy.activeTargetPoints[playerMesh.id] = function () {
                        let mesh = enemy.mesh;
                    console.log(key                    );
                        mesh.lookAt(playerMesh.position);

                        if(mesh.intersectsMesh(playerMesh)) {
                            self.scene.unregisterBeforeRender(enemy.activeTargetPoints[playerMesh.id]);
                        }

                        let rotation = mesh.rotation;
                        if (mesh.rotationQuaternion) {
                            rotation = mesh.rotationQuaternion.toEulerAngles();
                        }
                        rotation.negate();
                        let forwards = new BABYLON.Vector3(-parseFloat(Math.sin(rotation.y)) / 8, 0, -parseFloat(Math.cos(rotation.y)) / 8);
                        mesh.moveWithCollisions(forwards);
                        mesh.position.y = 0;
                };

                playerMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: enemy.mesh
                }, function () {
                    if(enemy.haveTarget) {
                        self.socket.emit('setEnemyTarget', {
                            enemyKey: key,
                            position: enemy.mesh.position,
                            target: playerMesh.id,
                            attack: true
                        });
                        self.scene.unregisterBeforeRender(enemy.activeTargetPoints[playerMesh.id]);
                        console.log('Box coliision enter: start attack' + playerMesh.id);
                    }
                });

                playerMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnIntersectionExitTrigger,
                    parameter: enemy.mesh
                }, function () {
                    if(enemy.haveTarget) {
                        self.socket.emit('setEnemyTarget', {
                            enemyKey: key,
                            position: enemy.mesh.position,
                            target: playerMesh.id,
                            attack: false
                        });
                        //self.scene.registerBeforeRender(enemy.activeTargetPoints[playerMesh.id]);
                        console.log('Box coliision exit: stop attack' + playerMesh.id);
                    }
                });

                playerMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
                trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                parameter: enemy.visibilityAreaMesh
            }, function () {
                    if(!enemy.haveTarget) {
                        self.socket.emit('setEnemyTarget', {
                            enemyKey: key,
                            position: enemy.mesh.position,
                            target: playerMesh.id
                        });
                        enemy.haveTarget = true;
                        self.scene.unregisterBeforeRender(enemy.activeTargetPoints[playerMesh.id]);
                        self.scene.registerBeforeRender(enemy.activeTargetPoints[playerMesh.id]);
                        console.log('coliision enter:' + playerMesh.id);
                    }
            }));

                playerMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
                trigger: BABYLON.ActionManager.OnIntersectionExitTrigger,
                parameter: enemy.visibilityAreaMesh
            }, function () {
                    if(enemy.haveTarget) {
                        self.socket.emit('setEnemyTarget', {
                            enemyKey: key,
                            position: enemy.mesh.position,
                            target: null
                        });
                        enemy.haveTarget = false;
                        console.log('coliision exit:' + playerMesh.id);
                    }

                    self.scene.unregisterBeforeRender(enemy.activeTargetPoints[playerMesh.id]);
                }));
            });

        }

        public socketUpdatePlayer(scene:BABYLON.Scene) {
            let self = this;
            let activeTargetPoints = [];
            this.socket.on('updatePlayer', function (updatedPlayer) {
                let remotePlayerKey = null;
                let player = null;

                self.players.forEach(function (remotePlayer, key) {
                    if (remotePlayer.id == updatedPlayer.id) {
                        remotePlayerKey = key;
                        return;
                    }
                });

                if (remotePlayerKey != null) {
                    player = self.players[remotePlayerKey].mesh;

                    if (player) {
                        if (updatedPlayer.attack == true) {
                            console.log('playerAttack');

                            return;
                        }

                        if (activeTargetPoints[remotePlayerKey] !== undefined) {
                            scene.unregisterBeforeRender(activeTargetPoints[remotePlayerKey]);
                        }

                        if (updatedPlayer.targetPoint) {
                            let mesh = player;
                            let targetPoint = updatedPlayer.targetPoint;
                            let targetPointVector3 = new BABYLON.Vector3(targetPoint.x, 0, targetPoint.z);
                            mesh.lookAt(targetPointVector3);

                            activeTargetPoints[remotePlayerKey] = function () {
                                if (mesh.intersectsPoint(targetPointVector3)) {
                                    //console.log('player intersect with target');
                                    scene.unregisterBeforeRender(activeTargetPoints[remotePlayerKey]);
                                } else {
                                    let rotation = mesh.rotation;
                                    if (mesh.rotationQuaternion) {
                                        rotation = mesh.rotationQuaternion.toEulerAngles();
                                    }
                                    rotation.negate();
                                    let animationRatio = scene.getAnimationRatio();
                                    let walkSpeed = 2.3 * (125 / 100) / animationRatio;

                                    let forwards = new BABYLON.Vector3(-parseFloat(Math.sin(rotation.y)) / walkSpeed, 0, -parseFloat(Math.cos(rotation.y)) / walkSpeed);
                                    mesh.moveWithCollisions(forwards);
                                    mesh.position.y = 0;

                                }

                            }

                            scene.registerBeforeRender(activeTargetPoints[remotePlayerKey]);
                        }
                    }
                }
            });

            return this;

        }

    }
}
