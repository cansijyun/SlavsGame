class OnRefreshRandomSpecialItems extends SocketEvent {
    /**
     * @returns {SocketIOClient}
     */
    public listen() {
        let game = this.game;
        this.socket.on('refreshRandomSpecialItems', function (randomSpecialItems) {

            game.getSceneManger().randomSpecialItems.forEach(function (randomSpecialItem) {
                randomSpecialItem.mesh.dispose();
                randomSpecialItem.tooltip.container.dispose();
            });
            game.getSceneManger().randomSpecialItems = [];

            randomSpecialItems.forEach(function (randomSpecialItem, randomSpecialItemKey) {
                if (!randomSpecialItem.picked) {
                    game.getSceneManger().randomSpecialItems.push(new RandomSpecialItem(game, randomSpecialItem, randomSpecialItemKey));
                }
            });
        });

        return this;
    }
}
