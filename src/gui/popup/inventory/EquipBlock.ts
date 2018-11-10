abstract class EquipBlock {
        protected inventory: GUI.Inventory;

        protected item: Items.Item;
        protected blockWidth: string;
        protected blockHeight: string;
        protected blockTop: string;
        protected blockLeft: string;

        public block: BABYLON.GUI.Rectangle;
        public image: BABYLON.GUI.Image;

        constructor(inventory: GUI.Inventory) {
            this.inventory = inventory;
        }

        /**
         * @returns {GUI.Inventory.EquipBlock}
         */
        protected createBlockWithImage() {
            if (this.item) {
                let panelItem = new BABYLON.GUI.Rectangle();
                panelItem.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
                panelItem.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                panelItem.thickness = 0;
                panelItem.width = this.blockWidth;
                panelItem.height = this.blockHeight;
                panelItem.top = this.blockTop;
                panelItem.left = this.blockLeft;
                panelItem.isPointerBlocker = true;

                this.inventory.container.addControl(panelItem);
                this.block = panelItem;
                this.createImage();

                let blockWidth = this.blockWidth;
                let blockHeight = this.blockHeight;
                let blockTop = this.blockTop;
                let blockLeft = this.blockLeft;
                let checkSizeListener = function (width) {
                    if (width > 1819) {
                        panelItem.width = blockWidth;
                        panelItem.height = blockHeight;
                        panelItem.top = blockTop;
                        panelItem.left = blockLeft;
                    } else {
                        panelItem.width = parseInt(blockWidth)/2+'px';
                        panelItem.height = parseInt(blockHeight)/2+'px';
                        panelItem.top = parseInt(blockTop)/2+'px';
                        panelItem.left = parseInt(blockLeft)/2+'px';
                    }
                };
                checkSizeListener(window.innerWidth);
                window.addEventListener("resize", function () {
                    let width = window.innerWidth;
                    checkSizeListener(width);
                });

            }
            return this;
        }

        /**
         * @returns {GUI.Inventory.EquipBlock}
         */
        protected createImage() {
            let self = this;
            let item = this.item;
            let image = this.inventory.createItemImage(this.item);

            TooltipHelper.createTooltipOnInventoryItemButton(self.inventory.guiTexture, item, image, function() {
                self.inventory.guiMain.game.player.inventory.emitEquip(self.item);
                self.inventory.guiTexture.removeControl(self.block);
                self.inventory.showItems();
                self.inventory.guiMain.attributes.refreshPopup();
            });

            this.block.addControl(image);

            return this;
        }

    }
