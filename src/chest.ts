import { random } from './utils';
import { Item } from './item';
import { Types } from './gametypes';
var _ = require('underscore')
export class Chest extends Item{
    items: any;
    constructor (id, x, y) {
        super(id, Types.Entities.CHEST, x, y);
    }
    
    setItems(items) {
        this.items = items;
    }
    
    getRandomItem() {
        var nbItems = _.size(this.items),
            item = null;

        if(nbItems > 0) {
            item = this.items[random(nbItems)];
        }
        return item;
    }
}