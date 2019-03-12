import { Entity } from './entity';
import { randomOrientation } from './utils';
import { Attack, Health } from './message';

export class Character extends Entity{
    orientation: any;
    attackers: {};
    target: any;
    maxHitPoints: any;
    hitPoints: any;
    constructor (id, type, kind, x, y) {
        super(id, type, kind, x, y);
        
        this.orientation = randomOrientation();
        
        this.attackers = {};
        this.target = null;
    }
    
    
    getState () {
        var basestate = this._getBaseState(),
            state = [];
        
        state.push(this.orientation);
        if(this.target) {
            state.push(this.target);
        }
        
        return basestate.concat(state);
    }
    
    resetHitPoints (maxHitPoints) {
        this.maxHitPoints = maxHitPoints;
        this.hitPoints = this.maxHitPoints;
    }
    
    regenHealthBy (value) {
        var hp = this.hitPoints,
            max = this.maxHitPoints;
            
        if(hp < max) {
            if(hp + value <= max) {
                this.hitPoints += value;
            }
            else {
                this.hitPoints = max;
            }
        }
    }
    
    hasFullHealth () {
        return this.hitPoints === this.maxHitPoints;
    }
    
    setTarget (entity) {
        this.target = entity.id;
    }
    
    clearTarget () {
        this.target = null;
    }
    
    hasTarget () {
        return this.target !== null;
    }
    
    attack () {
        return new Attack(this.id, this.target);
    }
    
    health () {
        return new Health(this.hitPoints, false);
    }
    
    regen () {
        return new Health(this.hitPoints, true);
    }
    
    addAttacker (entity) {
        if(entity) {
            this.attackers[entity.id] = entity;
        }
    }
    
    removeAttacker (entity) {
        if(entity && entity.id in this.attackers) {
            delete this.attackers[entity.id];
            console.log(this.id +" REMOVED ATTACKER "+ entity.id)
        }
    }
    
    forEachAttacker (callback) {
        for(var id in this.attackers) {
            callback(this.attackers[id]);
        }
    }
}