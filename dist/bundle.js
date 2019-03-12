var main;
(function (main) {
    class Area {
        constructor(id, x, y, width, height, world) {
            this.id = id;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.world = world;
            this.entities = [];
            this.hasCompletelyRespawned = true;
        }
        _getRandomPositionInsideArea() {
            var pos = { x: 0, y: 0 }, valid = false;
            while (!valid) {
                pos.x = this.x + main.Utils.random(this.width + 1);
                pos.y = this.y + main.Utils.random(this.height + 1);
                valid = this.world.isValidPosition(pos.x, pos.y);
            }
            return pos;
        }
        removeFromArea(entity) {
            //在entities中循环所有元素,将有id属性的id列表返回
            //计算entity.id在id列表中的下标
            // var i = _.indexOf(_.pluck(this.entities, 'id'), entity.id);
            // this.entities.splice(i, 1);
            let array = this.entities;
            for (let index = 0; index < array.length; index++) {
                const element = array[index];
                if (element.id == entity.id) {
                    array.splice(index, 1);
                    break;
                }
            }
            if (this.isEmpty() && this.hasCompletelyRespawned && this.empty_callback) {
                this.hasCompletelyRespawned = false;
                this.empty_callback();
            }
        }
        addToArea(entity) {
            if (entity) {
                this.entities.push(entity);
                entity.area = this;
                if (entity instanceof main.Mob) {
                    this.world.addMob(entity);
                }
            }
            if (this.isFull()) {
                this.hasCompletelyRespawned = true;
            }
        }
        setNumberOfEntities(nb) {
            this.nbEntities = nb;
        }
        isEmpty() {
            let array = this.entities;
            for (let index = 0; index < array.length; index++) {
                const entity = array[index];
                if (!entity.isDead) {
                    return false;
                }
            }
            return true;
        }
        isFull() {
            return !this.isEmpty() && (this.nbEntities === this.entities.length);
        }
        onEmpty(callback) {
            this.empty_callback = callback;
        }
    }
    main.Area = Area;
})(main || (main = {}));
var main;
(function (main) {
    class Entity {
        constructor(id, type, kind, x, y) {
            this.id = parseInt(id);
            this.type = type;
            this.kind = kind;
            this.x = x;
            this.y = y;
        }
        destroy() {
        }
        _getBaseState() {
            return [
                this.id,
                this.kind,
                this.x,
                this.y
            ];
        }
        getState() {
            return this._getBaseState();
        }
        spawn() {
            return new main.Messages.Spawn(this);
        }
        despawn() {
            return new main.Messages.Despawn(this.id);
        }
        setPosition(x, y) {
            this.x = x;
            this.y = y;
        }
        getPositionNextTo(entity) {
            var pos = null;
            if (entity) {
                pos = {};
                // This is a quick & dirty way to give mobs a random position
                // close to another entity.
                var r = main.Utils.random(4);
                pos.x = entity.x;
                pos.y = entity.y;
                if (r === 0)
                    pos.y -= 1;
                if (r === 1)
                    pos.y += 1;
                if (r === 2)
                    pos.x -= 1;
                if (r === 3)
                    pos.x += 1;
            }
            return pos;
        }
    }
    main.Entity = Entity;
})(main || (main = {}));
///<reference path="entity.ts"/>
var main;
(function (main) {
    class Character extends main.Entity {
        constructor(id, type, kind, x, y) {
            super(id, type, kind, x, y);
            this.orientation = main.Utils.randomOrientation();
            this.attackers = {};
            this.target = null;
        }
        getState() {
            var basestate = this._getBaseState(), state = [];
            state.push(this.orientation);
            if (this.target) {
                state.push(this.target);
            }
            return basestate.concat(state);
        }
        resetHitPoints(maxHitPoints) {
            this.maxHitPoints = maxHitPoints;
            this.hitPoints = this.maxHitPoints;
        }
        regenHealthBy(value) {
            var hp = this.hitPoints, max = this.maxHitPoints;
            if (hp < max) {
                if (hp + value <= max) {
                    this.hitPoints += value;
                }
                else {
                    this.hitPoints = max;
                }
            }
        }
        hasFullHealth() {
            return this.hitPoints === this.maxHitPoints;
        }
        setTarget(entity) {
            this.target = entity.id;
        }
        clearTarget() {
            this.target = null;
        }
        hasTarget() {
            return this.target !== null;
        }
        attack() {
            return new main.Messages.Attack(this.id, this.target);
        }
        health() {
            return new main.Messages.Health(this.hitPoints, false);
        }
        regen() {
            return new main.Messages.Health(this.hitPoints, true);
        }
        addAttacker(entity) {
            if (entity) {
                this.attackers[entity.id] = entity;
            }
        }
        removeAttacker(entity) {
            if (entity && entity.id in this.attackers) {
                delete this.attackers[entity.id];
                console.log(this.id + " REMOVED ATTACKER " + entity.id);
            }
        }
        forEachAttacker(callback) {
            for (var id in this.attackers) {
                callback(this.attackers[id]);
            }
        }
    }
    main.Character = Character;
})(main || (main = {}));
var main;
(function (main) {
    class Checkpoint {
        constructor(id, x, y, width, height) {
            this.id = id;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        getRandomPosition() {
            var pos = { x: 0, y: 0 };
            pos.x = this.x + main.Utils.randomInt(0, this.width - 1);
            pos.y = this.y + main.Utils.randomInt(0, this.height - 1);
            return pos;
        }
    }
    main.Checkpoint = Checkpoint;
})(main || (main = {}));
var main;
(function (main) {
    class Item extends main.Entity {
        constructor(id, kind, x, y) {
            super(id, "item", kind, x, y);
            this.isStatic = false;
            this.isFromChest = false;
        }
        handleDespawn(params) {
            var self = this;
            this.blinkTimeout = setTimeout(function () {
                params.blinkCallback();
                self.despawnTimeout = setTimeout(params.despawnCallback, params.blinkingDuration);
            }, params.beforeBlinkDelay);
        }
        destroy() {
            if (this.blinkTimeout) {
                clearTimeout(this.blinkTimeout);
            }
            if (this.despawnTimeout) {
                clearTimeout(this.despawnTimeout);
            }
            if (this.isStatic) {
                this.scheduleRespawn(30000);
            }
        }
        scheduleRespawn(delay) {
            var self = this;
            setTimeout(function () {
                if (self.respawn_callback) {
                    self.respawn_callback();
                }
            }, delay);
        }
        onRespawn(callback) {
            this.respawn_callback = callback;
        }
    }
    main.Item = Item;
})(main || (main = {}));
///<reference path="item.ts"/>
var main;
(function (main) {
    class Chest extends main.Item {
        constructor(id, x, y) {
            super(id, main.Types.Entities.CHEST, x, y);
        }
        setItems(items) {
            this.items = items;
        }
        getRandomItem() {
            var nbItems = _.size(this.items), item = null;
            if (nbItems > 0) {
                item = this.items[main.Utils.random(nbItems)];
            }
            return item;
        }
    }
    main.Chest = Chest;
})(main || (main = {}));
var main;
(function (main) {
    class ChestArea extends main.Area {
        constructor(id, x, y, width, height, cx, cy, items, world) {
            super(id, x, y, width, height, world);
            this.items = items;
            this.chestX = cx;
            this.chestY = cy;
        }
        contains(entity) {
            if (entity) {
                return entity.x >= this.x
                    && entity.y >= this.y
                    && entity.x < this.x + this.width
                    && entity.y < this.y + this.height;
            }
            else {
                return false;
            }
        }
    }
    main.ChestArea = ChestArea;
})(main || (main = {}));
var main;
(function (main) {
    class FormatChecker {
        constructor() {
            this.formats = [];
            this.formats[main.Types.Messages.HELLO] = ['s', 'n', 'n'],
                this.formats[main.Types.Messages.MOVE] = ['n', 'n'],
                this.formats[main.Types.Messages.LOOTMOVE] = ['n', 'n', 'n'],
                this.formats[main.Types.Messages.AGGRO] = ['n'],
                this.formats[main.Types.Messages.ATTACK] = ['n'],
                this.formats[main.Types.Messages.HIT] = ['n'],
                this.formats[main.Types.Messages.HURT] = ['n'],
                this.formats[main.Types.Messages.CHAT] = ['s'],
                this.formats[main.Types.Messages.LOOT] = ['n'],
                this.formats[main.Types.Messages.TELEPORT] = ['n', 'n'],
                this.formats[main.Types.Messages.ZONE] = [],
                this.formats[main.Types.Messages.OPEN] = ['n'],
                this.formats[main.Types.Messages.CHECK] = ['n'];
        }
        check(msg) {
            var message = msg.slice(0), type = message[0], format = this.formats[type];
            message.shift();
            if (format) {
                if (message.length !== format.length) {
                    return false;
                }
                for (var i = 0, n = message.length; i < n; i += 1) {
                    if (format[i] === 'n' && !_.isNumber(message[i])) {
                        return false;
                    }
                    if (format[i] === 's' && !_.isString(message[i])) {
                        return false;
                    }
                }
                return true;
            }
            else if (type === main.Types.Messages.WHO) {
                // WHO messages have a variable amount of params, all of which must be numbers.
                return message.length > 0 && _.all(message, function (param) { return _.isNumber(param); });
            }
            else {
                console.log("Unknown message type: " + type);
                return false;
            }
        }
    }
    main.FormatChecker = FormatChecker;
    var checker = new FormatChecker;
    function check(msg) {
        return checker.check(msg);
    }
    main.check = check;
})(main || (main = {}));
var main;
(function (main) {
    class Formulas {
        static dmg(weaponLevel, armorLevel) {
            var dealt = weaponLevel * main.Utils.randomInt(5, 10), absorbed = armorLevel * main.Utils.randomInt(1, 3), dmg = dealt - absorbed;
            //console.log("abs: "+absorbed+"   dealt: "+ dealt+"   dmg: "+ (dealt - absorbed));
            if (dmg <= 0) {
                return main.Utils.randomInt(0, 3);
            }
            else {
                return dmg;
            }
        }
        static hp(armorLevel) {
            var hp = 80 + ((armorLevel - 1) * 30);
            return hp;
        }
    }
    main.Formulas = Formulas;
})(main || (main = {}));
var main;
(function (main) {
    class Types {
        static getWeaponRank(weaponKind) {
            return _.indexOf(Types.rankedWeapons, weaponKind);
        }
        static getArmorRank(armorKind) {
            return _.indexOf(Types.rankedArmors, armorKind);
        }
        static isPlayer(kind) {
            return kinds.getType(kind) === "player";
        }
        static isMob(kind) {
            return kinds.getType(kind) === "mob";
        }
        static isNpc(kind) {
            return kinds.getType(kind) === "npc";
        }
        static isCharacter(kind) {
            return Types.isMob(kind) || Types.isNpc(kind) || Types.isPlayer(kind);
        }
        static isArmor(kind) {
            return kinds.getType(kind) === "armor";
        }
        static isWeapon(kind) {
            return kinds.getType(kind) === "weapon";
        }
        static isObject(kind) {
            return kinds.getType(kind) === "object";
        }
        static isChest(kind) {
            return kind === Types.Entities.CHEST;
        }
        static isItem(kind) {
            return Types.isWeapon(kind)
                || Types.isArmor(kind)
                || (Types.isObject(kind) && !Types.isChest(kind));
        }
        static isHealingItem(kind) {
            return kind === Types.Entities.FLASK
                || kind === Types.Entities.BURGER;
        }
        static isExpendableItem(kind) {
            return Types.isHealingItem(kind)
                || kind === Types.Entities.FIREPOTION
                || kind === Types.Entities.CAKE;
        }
        static getKindFromString(kind) {
            if (kind in kinds) {
                return kinds[kind][0];
            }
        }
        static getKindAsString(kind) {
            for (var k in kinds) {
                if (kinds[k][0] === kind) {
                    return k;
                }
            }
        }
        static forEachKind(callback) {
            for (var k in kinds) {
                callback(kinds[k][0], k);
            }
        }
        static forEachArmor(callback) {
            Types.forEachKind(function (kind, kindName) {
                if (Types.isArmor(kind)) {
                    callback(kind, kindName);
                }
            });
        }
        static forEachMobOrNpcKind(callback) {
            Types.forEachKind(function (kind, kindName) {
                if (Types.isMob(kind) || Types.isNpc(kind)) {
                    callback(kind, kindName);
                }
            });
        }
        static forEachArmorKind(callback) {
            Types.forEachKind(function (kind, kindName) {
                if (Types.isArmor(kind)) {
                    callback(kind, kindName);
                }
            });
        }
        static getOrientationAsString(orientation) {
            switch (orientation) {
                case Types.Orientations.LEFT:
                    return "left";
                    break;
                case Types.Orientations.RIGHT:
                    return "right";
                    break;
                case Types.Orientations.UP:
                    return "up";
                    break;
                case Types.Orientations.DOWN:
                    return "down";
                    break;
            }
        }
        static getRandomItemKind(item) {
            var all = _.union(this.rankedWeapons, this.rankedArmors), forbidden = [Types.Entities.SWORD1, Types.Entities.CLOTHARMOR], itemKinds = _.difference(all, forbidden), i = Math.floor(Math.random() * _.size(itemKinds));
            return itemKinds[i];
        }
        static getMessageTypeAsString(type) {
            var typeName;
            _.each(Types.Messages, function (value, name) {
                if (value === type) {
                    typeName = name;
                }
            });
            if (!typeName) {
                typeName = "UNKNOWN";
            }
            return typeName;
        }
    }
    Types.Messages = {
        HELLO: 0,
        WELCOME: 1,
        SPAWN: 2,
        DESPAWN: 3,
        MOVE: 4,
        LOOTMOVE: 5,
        AGGRO: 6,
        ATTACK: 7,
        HIT: 8,
        HURT: 9,
        HEALTH: 10,
        CHAT: 11,
        LOOT: 12,
        EQUIP: 13,
        DROP: 14,
        TELEPORT: 15,
        DAMAGE: 16,
        POPULATION: 17,
        KILL: 18,
        LIST: 19,
        WHO: 20,
        ZONE: 21,
        DESTROY: 22,
        HP: 23,
        BLINK: 24,
        OPEN: 25,
        CHECK: 26
    };
    Types.Entities = {
        WARRIOR: 1,
        // Mobs
        RAT: 2,
        SKELETON: 3,
        GOBLIN: 4,
        OGRE: 5,
        SPECTRE: 6,
        CRAB: 7,
        BAT: 8,
        WIZARD: 9,
        EYE: 10,
        SNAKE: 11,
        SKELETON2: 12,
        BOSS: 13,
        DEATHKNIGHT: 14,
        // Armors
        FIREFOX: 20,
        CLOTHARMOR: 21,
        LEATHERARMOR: 22,
        MAILARMOR: 23,
        PLATEARMOR: 24,
        REDARMOR: 25,
        GOLDENARMOR: 26,
        // Objects
        FLASK: 35,
        BURGER: 36,
        CHEST: 37,
        FIREPOTION: 38,
        CAKE: 39,
        // NPCs
        GUARD: 40,
        KING: 41,
        OCTOCAT: 42,
        VILLAGEGIRL: 43,
        VILLAGER: 44,
        PRIEST: 45,
        SCIENTIST: 46,
        AGENT: 47,
        RICK: 48,
        NYAN: 49,
        SORCERER: 50,
        BEACHNPC: 51,
        FORESTNPC: 52,
        DESERTNPC: 53,
        LAVANPC: 54,
        CODER: 55,
        // Weapons
        SWORD1: 60,
        SWORD2: 61,
        REDSWORD: 62,
        GOLDENSWORD: 63,
        MORNINGSTAR: 64,
        AXE: 65,
        BLUESWORD: 66
    };
    Types.Orientations = {
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4
    };
    Types.rankedWeapons = [
        Types.Entities.SWORD1,
        Types.Entities.SWORD2,
        Types.Entities.AXE,
        Types.Entities.MORNINGSTAR,
        Types.Entities.BLUESWORD,
        Types.Entities.REDSWORD,
        Types.Entities.GOLDENSWORD
    ];
    Types.rankedArmors = [21, 22, 23, 24, 25, 26];
    main.Types = Types;
    var kinds = {
        warrior: [Types.Entities.WARRIOR, "player"],
        rat: [Types.Entities.RAT, "mob"],
        skeleton: [Types.Entities.SKELETON, "mob"],
        goblin: [Types.Entities.GOBLIN, "mob"],
        ogre: [Types.Entities.OGRE, "mob"],
        spectre: [Types.Entities.SPECTRE, "mob"],
        deathknight: [Types.Entities.DEATHKNIGHT, "mob"],
        crab: [Types.Entities.CRAB, "mob"],
        snake: [Types.Entities.SNAKE, "mob"],
        bat: [Types.Entities.BAT, "mob"],
        wizard: [Types.Entities.WIZARD, "mob"],
        eye: [Types.Entities.EYE, "mob"],
        skeleton2: [Types.Entities.SKELETON2, "mob"],
        boss: [Types.Entities.BOSS, "mob"],
        sword1: [Types.Entities.SWORD1, "weapon"],
        sword2: [Types.Entities.SWORD2, "weapon"],
        axe: [Types.Entities.AXE, "weapon"],
        redsword: [Types.Entities.REDSWORD, "weapon"],
        bluesword: [Types.Entities.BLUESWORD, "weapon"],
        goldensword: [Types.Entities.GOLDENSWORD, "weapon"],
        morningstar: [Types.Entities.MORNINGSTAR, "weapon"],
        firefox: [Types.Entities.FIREFOX, "armor"],
        clotharmor: [Types.Entities.CLOTHARMOR, "armor"],
        leatherarmor: [Types.Entities.LEATHERARMOR, "armor"],
        mailarmor: [Types.Entities.MAILARMOR, "armor"],
        platearmor: [Types.Entities.PLATEARMOR, "armor"],
        redarmor: [Types.Entities.REDARMOR, "armor"],
        goldenarmor: [Types.Entities.GOLDENARMOR, "armor"],
        flask: [Types.Entities.FLASK, "object"],
        cake: [Types.Entities.CAKE, "object"],
        burger: [Types.Entities.BURGER, "object"],
        chest: [Types.Entities.CHEST, "object"],
        firepotion: [Types.Entities.FIREPOTION, "object"],
        guard: [Types.Entities.GUARD, "npc"],
        villagegirl: [Types.Entities.VILLAGEGIRL, "npc"],
        villager: [Types.Entities.VILLAGER, "npc"],
        coder: [Types.Entities.CODER, "npc"],
        scientist: [Types.Entities.SCIENTIST, "npc"],
        priest: [Types.Entities.PRIEST, "npc"],
        king: [Types.Entities.KING, "npc"],
        rick: [Types.Entities.RICK, "npc"],
        nyan: [Types.Entities.NYAN, "npc"],
        sorcerer: [Types.Entities.SORCERER, "npc"],
        agent: [Types.Entities.AGENT, "npc"],
        octocat: [Types.Entities.OCTOCAT, "npc"],
        beachnpc: [Types.Entities.BEACHNPC, "npc"],
        forestnpc: [Types.Entities.FORESTNPC, "npc"],
        desertnpc: [Types.Entities.DESERTNPC, "npc"],
        lavanpc: [Types.Entities.LAVANPC, "npc"],
        getType: function (kind) {
            return kinds[Types.getKindAsString(kind)][1];
        }
    };
})(main || (main = {}));
var main;
(function (main_1) {
    function main() {
        let 服务器配置文件路径 = 'config.json';
        fs.readFile(服务器配置文件路径, 'utf8', function (异常, JSON数据) {
            if (异常) {
                console.error("无法打开配置文件:", 异常.path);
            }
            else {
                let 服务器配置 = JSON.parse(JSON数据);
            }
        });
    }
    main_1.main = main;
})(main || (main = {}));
function 获取世界分布(worlds) {
    let 分布 = [];
    for (let index = 0; index < worlds.length; index++) {
        const world = worlds[index];
        分布.push(world.playerCount);
    }
    return 分布;
}
//将main命名空间引用置于exports上
var exports;
exports.main = main;
var main;
(function (main) {
    class Map {
        constructor(filepath) {
            var filepath = filepath || "./server/maps/world_server.json";
            var self = this;
            this.isLoaded = false;
            if (fs.lstatSync(filepath).isFile()) {
                fs.readFile(filepath, function (err, file) {
                    var json = JSON.parse(file.toString());
                    self.initMap(json);
                });
            }
            else {
                console.log(filepath + " doesn't exist.");
            }
        }
        initMap(map) {
            this.width = map.width;
            this.height = map.height;
            this.collisions = map.collisions;
            this.mobAreas = map.roamingAreas;
            this.chestAreas = map.chestAreas;
            this.staticChests = map.staticChests;
            this.staticEntities = map.staticEntities;
            this.isLoaded = true;
            // zone groups
            this.zoneWidth = 28;
            this.zoneHeight = 12;
            this.groupWidth = Math.floor(this.width / this.zoneWidth);
            this.groupHeight = Math.floor(this.height / this.zoneHeight);
            this.initConnectedGroups(map.doors);
            this.initCheckpoints(map.checkpoints);
            if (this.ready_func) {
                this.ready_func();
            }
        }
        ready(f) {
            this.ready_func = f;
        }
        tileIndexToGridPosition(tileNum) {
            var x = 0, y = 0;
            var getX = function (num, w) {
                if (num == 0) {
                    return 0;
                }
                return (num % w == 0) ? w - 1 : (num % w) - 1;
            };
            tileNum -= 1;
            x = getX(tileNum + 1, this.width);
            y = Math.floor(tileNum / this.width);
            return { x: x, y: y };
        }
        GridPositionToTileIndex(x, y) {
            return (y * this.width) + x + 1;
        }
        generateCollisionGrid() {
            this.grid = [];
            if (this.isLoaded) {
                var tileIndex = 0;
                for (var j, i = 0; i < this.height; i++) {
                    this.grid[i] = [];
                    for (j = 0; j < this.width; j++) {
                        if (_.include(this.collisions, tileIndex)) {
                            this.grid[i][j] = 1;
                        }
                        else {
                            this.grid[i][j] = 0;
                        }
                        tileIndex += 1;
                    }
                }
                console.log("Collision grid generated.");
            }
        }
        isOutOfBounds(x, y) {
            return x <= 0 || x >= this.width || y <= 0 || y >= this.height;
        }
        isColliding(x, y) {
            if (this.isOutOfBounds(x, y)) {
                return false;
            }
            return this.grid[y][x] === 1;
        }
        GroupIdToGroupPosition(id) {
            var posArray = id.split('-');
            return pos(parseInt(posArray[0]), parseInt(posArray[1]));
        }
        forEachGroup(callback) {
            var width = this.groupWidth, height = this.groupHeight;
            for (var x = 0; x < width; x += 1) {
                for (var y = 0; y < height; y += 1) {
                    callback(x + '-' + y);
                }
            }
        }
        getGroupIdFromPosition(x, y) {
            var w = this.zoneWidth, h = this.zoneHeight, gx = Math.floor((x - 1) / w), gy = Math.floor((y - 1) / h);
            return gx + '-' + gy;
        }
        getAdjacentGroupPositions(id) {
            var self = this, position = this.GroupIdToGroupPosition(id), x = position.x, y = position.y, 
            // surrounding groups
            list = [pos(x - 1, y - 1), pos(x, y - 1), pos(x + 1, y - 1),
                pos(x - 1, y), pos(x, y), pos(x + 1, y),
                pos(x - 1, y + 1), pos(x, y + 1), pos(x + 1, y + 1)];
            // groups connected via doors
            _.each(this.connectedGroups[id], function (position) {
                // don't add a connected group if it's already part of the surrounding ones.
                if (!_.any(list, function (groupPos) { return equalPositions(groupPos, position); })) {
                    list.push(position);
                }
            });
            return _.reject(list, function (pos) {
                return pos.x < 0 || pos.y < 0 || pos.x >= self.groupWidth || pos.y >= self.groupHeight;
            });
        }
        forEachAdjacentGroup(groupId, callback) {
            if (groupId) {
                _.each(this.getAdjacentGroupPositions(groupId), function (pos) {
                    callback(pos.x + '-' + pos.y);
                });
            }
        }
        initConnectedGroups(doors) {
            var self = this;
            this.connectedGroups = {};
            _.each(doors, function (door) {
                var groupId = self.getGroupIdFromPosition(door.x, door.y), connectedGroupId = self.getGroupIdFromPosition(door.tx, door.ty), connectedPosition = self.GroupIdToGroupPosition(connectedGroupId);
                if (groupId in self.connectedGroups) {
                    self.connectedGroups[groupId].push(connectedPosition);
                }
                else {
                    self.connectedGroups[groupId] = [connectedPosition];
                }
            });
        }
        initCheckpoints(cpList) {
            var self = this;
            this.checkpoints = {};
            this.startingAreas = new Array();
            _.each(cpList, function (cp) {
                var checkpoint = new main.Checkpoint(cp.id, cp.x, cp.y, cp.w, cp.h);
                self.checkpoints[checkpoint.id] = checkpoint;
                if (cp.s === 1) {
                    self.startingAreas.push(checkpoint);
                }
            });
        }
        getCheckpoint(id) {
            return this.checkpoints[id];
        }
        getRandomStartingPosition() {
            let nbAreas = this.startingAreas.length;
            let i = main.Utils.randomInt(0, nbAreas - 1);
            let area = this.startingAreas[i];
            return area.getRandomPosition();
        }
    }
    main.Map = Map;
    var pos = function (x, y) {
        return { x: x, y: y };
    };
    var equalPositions = function (pos1, pos2) {
        return pos1.x === pos2.x && pos2.y === pos2.y;
    };
})(main || (main = {}));
var main;
(function (main) {
    let Messages;
    (function (Messages) {
        class Message {
        }
        class Spawn extends Message {
            constructor(entity) {
                super();
                this.entity = entity;
            }
            serialize() {
                var spawn = [main.Types.Messages.SPAWN];
                return spawn.concat(this.entity.getState());
            }
        }
        Messages.Spawn = Spawn;
        class Despawn extends Message {
            constructor(entityId) {
                super();
                this.entityId = entityId;
            }
            serialize() {
                return [main.Types.Messages.DESPAWN, this.entityId];
            }
        }
        Messages.Despawn = Despawn;
        class Move extends Message {
            constructor(entity) {
                super();
                this.entity = entity;
            }
            serialize() {
                return [main.Types.Messages.MOVE,
                    this.entity.id,
                    this.entity.x,
                    this.entity.y];
            }
        }
        Messages.Move = Move;
        class LootMove extends Message {
            constructor(entity, item) {
                super();
                this.entity = entity;
                this.item = item;
            }
            serialize() {
                return [main.Types.Messages.LOOTMOVE,
                    this.entity.id,
                    this.item.id];
            }
        }
        Messages.LootMove = LootMove;
        class Attack extends Message {
            constructor(attackerId, targetId) {
                super();
                this.attackerId = attackerId;
                this.targetId = targetId;
            }
            serialize() {
                return [main.Types.Messages.ATTACK,
                    this.attackerId,
                    this.targetId];
            }
        }
        Messages.Attack = Attack;
        class Health extends Message {
            constructor(points, isRegen) {
                super();
                this.points = points;
                this.isRegen = isRegen;
            }
            serialize() {
                var health = [main.Types.Messages.HEALTH,
                    this.points];
                if (this.isRegen) {
                    health.push(1);
                }
                return health;
            }
        }
        Messages.Health = Health;
        class HitPoints extends Message {
            constructor(maxHitPoints) {
                super();
                this.maxHitPoints = maxHitPoints;
            }
            serialize() {
                return [main.Types.Messages.HP,
                    this.maxHitPoints];
            }
        }
        Messages.HitPoints = HitPoints;
        class EquipItem extends Message {
            constructor(player, itemKind) {
                super();
                this.playerId = player.id;
                this.itemKind = itemKind;
            }
            serialize() {
                return [main.Types.Messages.EQUIP,
                    this.playerId,
                    this.itemKind];
            }
        }
        Messages.EquipItem = EquipItem;
        class Drop extends Message {
            constructor(mob, item) {
                super();
                this.mob = mob;
                this.item = item;
            }
            serialize() {
                var drop = [main.Types.Messages.DROP,
                    this.mob.id,
                    this.item.id,
                    this.item.kind,
                    _.pluck(this.mob.hatelist, "id")];
                return drop;
            }
        }
        Messages.Drop = Drop;
        class Chat extends Message {
            constructor(player, message) {
                super();
                this.playerId = player.id;
                this.message = message;
            }
            serialize() {
                return [main.Types.Messages.CHAT,
                    this.playerId,
                    this.message];
            }
        }
        Messages.Chat = Chat;
        class Teleport extends Message {
            constructor(entity) {
                super();
                this.entity = entity;
            }
            serialize() {
                return [main.Types.Messages.TELEPORT,
                    this.entity.id,
                    this.entity.x,
                    this.entity.y];
            }
        }
        Messages.Teleport = Teleport;
        class Damage extends Message {
            constructor(entity, points) {
                super();
                this.entity = entity;
                this.points = points;
            }
            serialize() {
                return [main.Types.Messages.DAMAGE,
                    this.entity.id,
                    this.points];
            }
        }
        Messages.Damage = Damage;
        class Population extends Message {
            constructor(world, total) {
                super();
                this.world = world;
                this.total = total;
            }
            serialize() {
                return [main.Types.Messages.POPULATION,
                    this.world,
                    this.total];
            }
        }
        Messages.Population = Population;
        class Kill extends Message {
            constructor(mob) {
                super();
                this.mob = mob;
            }
            serialize() {
                return [main.Types.Messages.KILL,
                    this.mob.kind];
            }
        }
        Messages.Kill = Kill;
        class List extends Message {
            constructor(ids) {
                super();
                this.ids = ids;
            }
            serialize() {
                var list = this.ids;
                list.unshift(main.Types.Messages.LIST);
                return list;
            }
        }
        Messages.List = List;
        class Destroy extends Message {
            constructor(entity) {
                super();
                this.entity = entity;
            }
            serialize() {
                return [main.Types.Messages.DESTROY,
                    this.entity.id];
            }
        }
        Messages.Destroy = Destroy;
        class Blink extends Message {
            constructor(item) {
                super();
                this.item = item;
            }
            serialize() {
                return [main.Types.Messages.BLINK,
                    this.item.id];
            }
        }
        Messages.Blink = Blink;
    })(Messages = main.Messages || (main.Messages = {}));
})(main || (main = {}));
var main;
(function (main) {
    class Metrics {
        constructor(config) {
            var self = this;
            this.config = config;
            this.client = new memcache.Client(config.memcached_port, config.memcached_host);
            this.client.connect();
            this.isReady = false;
            this.client.on('connect', function () {
                console.log("Metrics enabled: memcached client connected to " + config.memcached_host + ":" + config.memcached_port);
                self.isReady = true;
                if (self.ready_callback) {
                    self.ready_callback();
                }
            });
        }
        ready(callback) {
            this.ready_callback = callback;
        }
        updatePlayerCounters(worlds, updatedCallback) {
            var self = this, config = this.config, numServers = _.size(config.game_servers), playerCount = _.reduce(worlds, function (sum, world) { return sum + world.playerCount; }, 0);
            if (this.isReady) {
                // Set the number of players on this server
                this.client.set('player_count_' + config.server_name, playerCount, function () {
                    var total_players = 0;
                    // Recalculate the total number of players and set it
                    _.each(config.game_servers, function (server) {
                        self.client.get('player_count_' + server.name, function (error, result) {
                            var count = result ? parseInt(result) : 0;
                            total_players += count;
                            numServers -= 1;
                            if (numServers === 0) {
                                self.client.set('total_players', total_players, function () {
                                    if (updatedCallback) {
                                        updatedCallback(total_players);
                                    }
                                });
                            }
                        });
                    });
                });
            }
            else {
                console.log("Memcached client not connected");
            }
        }
        updateWorldDistribution(worlds) {
            this.client.set('world_distribution_' + this.config.server_name, worlds);
        }
        getOpenWorldCount(callback) {
            this.client.get('world_count_' + this.config.server_name, function (error, result) {
                callback(result);
            });
        }
        getTotalPlayers(callback) {
            this.client.get('total_players', function (error, result) {
                callback(result);
            });
        }
    }
    main.Metrics = Metrics;
})(main || (main = {}));
var main;
(function (main) {
    class Mob extends main.Character {
        constructor(id, kind, x, y) {
            super(id, "mob", kind, x, y);
            this.updateHitPoints();
            this.spawningX = x;
            this.spawningY = y;
            this.armorLevel = main.Properties.getArmorLevel(this.kind);
            this.weaponLevel = main.Properties.getWeaponLevel(this.kind);
            this.hatelist = [];
            this.respawnTimeout = null;
            this.returnTimeout = null;
            this.isDead = false;
        }
        destroy() {
            this.isDead = true;
            this.hatelist = [];
            this.clearTarget();
            this.updateHitPoints();
            this.resetPosition();
            this.handleRespawn();
        }
        receiveDamage(points, playerId) {
            this.hitPoints -= points;
        }
        hates(playerId) {
            return _.any(this.hatelist, function (obj) {
                return obj.id === playerId;
            });
        }
        increaseHateFor(playerId, points) {
            if (this.hates(playerId)) {
                _.detect(this.hatelist, function (obj) {
                    return obj.id === playerId;
                }).hate += points;
            }
            else {
                this.hatelist.push({ id: playerId, hate: points });
            }
            /*
            log.debug("Hatelist : "+this.id);
            _.each(this.hatelist, function(obj) {
                log.debug(obj.id + " -> " + obj.hate);
            });*/
            if (this.returnTimeout) {
                // Prevent the mob from returning to its spawning position
                // since it has aggroed a new player
                clearTimeout(this.returnTimeout);
                this.returnTimeout = null;
            }
        }
        getHatedPlayerId(hateRank) {
            var i, playerId, sorted = _.sortBy(this.hatelist, function (obj) { return obj.hate; }), size = _.size(this.hatelist);
            if (hateRank && hateRank <= size) {
                i = size - hateRank;
            }
            else {
                i = size - 1;
            }
            if (sorted && sorted[i]) {
                playerId = sorted[i].id;
            }
            return playerId;
        }
        forgetPlayer(playerId, duration) {
            this.hatelist = _.reject(this.hatelist, function (obj) { return obj.id === playerId; });
            if (this.hatelist.length === 0) {
                this.returnToSpawningPosition(duration);
            }
        }
        forgetEveryone() {
            this.hatelist = [];
            this.returnToSpawningPosition(1);
        }
        drop(item) {
            if (item) {
                return new main.Messages.Drop(this, item);
            }
        }
        handleRespawn() {
            var delay = 30000, self = this;
            if (this.area && this.area instanceof main.MobArea) {
                // Respawn inside the area if part of a MobArea
                this.area.respawnMob(this, delay);
            }
            else {
                if (this.area && this.area instanceof main.ChestArea) {
                    this.area.removeFromArea(this);
                }
                setTimeout(function () {
                    if (self.respawn_callback) {
                        self.respawn_callback();
                    }
                }, delay);
            }
        }
        onRespawn(callback) {
            this.respawn_callback = callback;
        }
        resetPosition() {
            this.setPosition(this.spawningX, this.spawningY);
        }
        returnToSpawningPosition(waitDuration) {
            var self = this, delay = waitDuration || 4000;
            this.clearTarget();
            this.returnTimeout = setTimeout(function () {
                self.resetPosition();
                self.move(self.x, self.y);
            }, delay);
        }
        onMove(callback) {
            this.move_callback = callback;
        }
        move(x, y) {
            this.setPosition(x, y);
            if (this.move_callback) {
                this.move_callback(this);
            }
        }
        updateHitPoints() {
            this.resetHitPoints(main.Properties.getHitPoints(this.kind));
        }
        distanceToSpawningPoint(x, y) {
            return main.Utils.distanceTo(x, y, this.spawningX, this.spawningY);
        }
    }
    main.Mob = Mob;
})(main || (main = {}));
var main;
(function (main) {
    class MobArea extends main.Area {
        constructor(id, nb, kind, x, y, width, height, world) {
            super(id, x, y, width, height, world);
            this.nb = nb;
            this.kind = kind;
            this.respawns = [];
            this.setNumberOfEntities(this.nb);
            //this.initRoaming();
        }
        spawnMobs() {
            for (var i = 0; i < this.nb; i += 1) {
                this.addToArea(this._createMobInsideArea());
            }
        }
        _createMobInsideArea() {
            var k = main.Types.getKindFromString(this.kind), pos = this._getRandomPositionInsideArea(), mob = new main.Mob('1' + this.id + '' + k + '' + this.entities.length, k, pos.x, pos.y);
            mob.onMove(this.world.onMobMoveCallback.bind(this.world));
            return mob;
        }
        respawnMob(mob, delay) {
            var self = this;
            this.removeFromArea(mob);
            setTimeout(function () {
                var pos = self._getRandomPositionInsideArea();
                mob.x = pos.x;
                mob.y = pos.y;
                mob.isDead = false;
                self.addToArea(mob);
                self.world.addMob(mob);
            }, delay);
        }
        initRoaming(mob) {
            var self = this;
            setInterval(function () {
                // _.each(self.entities, function(mob) {
                //     var canRoam = (random(20) === 1),
                //         pos: { x: any; y: any; };
                //     if(canRoam) {
                //         if(!mob.hasTarget() && !mob.isDead) {
                //             pos = self._getRandomPositionInsideArea();
                //             mob.move(pos.x, pos.y);
                //         }
                //     }
                // });
            }, 500);
        }
        createReward() {
            var pos = this._getRandomPositionInsideArea();
            return { x: pos.x, y: pos.y, kind: main.Types.Entities.CHEST };
        }
    }
    main.MobArea = MobArea;
})(main || (main = {}));
var main;
(function (main) {
    class Npc extends main.Entity {
        constructor(id, kind, x, y) {
            super(id, "npc", kind, x, y);
        }
    }
    main.Npc = Npc;
})(main || (main = {}));
var main;
(function (main) {
    class Player extends main.Character {
        constructor(connection, worldServer) {
            super(connection.id, "player", main.Types.Entities.WARRIOR, 0, 0);
            var self = this;
            this.server = worldServer;
            this.connection = connection;
            this.hasEnteredGame = false;
            this.isDead = false;
            this.haters = {};
            this.lastCheckpoint = null;
            this.formatChecker = new main.FormatChecker();
            this.disconnectTimeout = null;
            this.connection.listen(function (message) {
                var action = parseInt(message[0]);
                console.log("Received: " + message);
                if (!main.check(message)) {
                    self.connection.close("Invalid " + main.Types.getMessageTypeAsString(action) + " message format: " + message);
                    return;
                }
                if (!self.hasEnteredGame && action !== main.Types.Messages.HELLO) { // HELLO must be the first message
                    self.connection.close("Invalid handshake message: " + message);
                    return;
                }
                if (self.hasEnteredGame && !self.isDead && action === main.Types.Messages.HELLO) { // HELLO can be sent only once
                    self.connection.close("Cannot initiate handshake twice: " + message);
                    return;
                }
                self.resetTimeout();
                if (action === main.Types.Messages.HELLO) {
                    var name = main.Utils.sanitize(message[1]);
                    // If name was cleared by the sanitizer, give a default name.
                    // Always ensure that the name is not longer than a maximum length.
                    // (also enforced by the maxlength attribute of the name input element).
                    self.name = (name === "") ? "lorem ipsum" : name.substr(0, 15);
                    self.kind = main.Types.Entities.WARRIOR;
                    self.equipArmor(message[2]);
                    self.equipWeapon(message[3]);
                    self.orientation = main.Utils.randomOrientation();
                    self.updateHitPoints();
                    self.updatePosition();
                    self.server.addPlayer(self);
                    self.server.enter_callback(self);
                    self.send([main.Types.Messages.WELCOME, self.id, self.name, self.x, self.y, self.hitPoints]);
                    self.hasEnteredGame = true;
                    self.isDead = false;
                }
                else if (action === main.Types.Messages.WHO) {
                    message.shift();
                    self.server.pushSpawnsToPlayer(self, message);
                }
                else if (action === main.Types.Messages.ZONE) {
                    self.zone_callback();
                }
                else if (action === main.Types.Messages.CHAT) {
                    var msg = main.Utils.sanitize(message[1]);
                    // Sanitized messages may become empty. No need to broadcast empty chat messages.
                    if (msg && msg !== "") {
                        msg = msg.substr(0, 60); // Enforce maxlength of chat input
                        self.broadcastToZone(new main.Messages.Chat(self, msg), false);
                    }
                }
                else if (action === main.Types.Messages.MOVE) {
                    if (self.move_callback) {
                        var x = message[1], y = message[2];
                        if (self.server.isValidPosition(x, y)) {
                            self.setPosition(x, y);
                            self.clearTarget();
                            self.broadcast(new main.Messages.Move(self));
                            self.move_callback(self.x, self.y);
                        }
                    }
                }
                else if (action === main.Types.Messages.LOOTMOVE) {
                    if (self.lootmove_callback) {
                        self.setPosition(message[1], message[2]);
                        var item = self.server.getEntityById(message[3]);
                        if (item) {
                            self.clearTarget();
                            self.broadcast(new main.Messages.LootMove(self, item));
                            self.lootmove_callback(self.x, self.y);
                        }
                    }
                }
                else if (action === main.Types.Messages.AGGRO) {
                    if (self.move_callback) {
                        self.server.handleMobHate(message[1], self.id, 5);
                    }
                }
                else if (action === main.Types.Messages.ATTACK) {
                    var mob = self.server.getEntityById(message[1]);
                    if (mob) {
                        self.setTarget(mob);
                        self.server.broadcastAttacker(self);
                    }
                }
                else if (action === main.Types.Messages.HIT) {
                    var mob = self.server.getEntityById(message[1]);
                    if (mob) {
                        var dmg = main.Formulas.dmg(self.weaponLevel, mob.armorLevel);
                        if (dmg > 0) {
                            mob.receiveDamage(dmg, self.id);
                            self.server.handleMobHate(mob.id, self.id, dmg);
                            self.server.handleHurtEntity(mob, self, dmg);
                        }
                    }
                }
                else if (action === main.Types.Messages.HURT) {
                    var mob = self.server.getEntityById(message[1]);
                    if (mob && self.hitPoints > 0) {
                        self.hitPoints -= main.Formulas.dmg(mob.weaponLevel, self.armorLevel);
                        self.server.handleHurtEntity(self, mob);
                        if (self.hitPoints <= 0) {
                            self.isDead = true;
                            if (self.firepotionTimeout) {
                                clearTimeout(self.firepotionTimeout);
                            }
                        }
                    }
                }
                else if (action === main.Types.Messages.LOOT) {
                    var item = self.server.getEntityById(message[1]);
                    if (item) {
                        var kind = item.kind;
                        if (main.Types.isItem(kind)) {
                            self.broadcast(item.despawn());
                            self.server.removeEntity(item);
                            if (kind === main.Types.Entities.FIREPOTION) {
                                self.updateHitPoints();
                                self.broadcast(self.equip(main.Types.Entities.FIREFOX));
                                self.firepotionTimeout = setTimeout(function () {
                                    self.broadcast(self.equip(self.armor)); // return to normal after 15 sec
                                    self.firepotionTimeout = null;
                                }, 15000);
                                self.send(new main.Messages.HitPoints(self.maxHitPoints).serialize());
                            }
                            else if (main.Types.isHealingItem(kind)) {
                                var amount;
                                switch (kind) {
                                    case main.Types.Entities.FLASK:
                                        amount = 40;
                                        break;
                                    case main.Types.Entities.BURGER:
                                        amount = 100;
                                        break;
                                }
                                if (!self.hasFullHealth()) {
                                    self.regenHealthBy(amount);
                                    self.server.pushToPlayer(self, self.health());
                                }
                            }
                            else if (main.Types.isArmor(kind) || main.Types.isWeapon(kind)) {
                                self.equipItem(item);
                                self.broadcast(self.equip(kind));
                            }
                        }
                    }
                }
                else if (action === main.Types.Messages.TELEPORT) {
                    var x = message[1], y = message[2];
                    if (self.server.isValidPosition(x, y)) {
                        self.setPosition(x, y);
                        self.clearTarget();
                        self.broadcast(new main.Messages.Teleport(self));
                        self.server.handlePlayerVanish(self);
                        self.server.pushRelevantEntityListTo(self);
                    }
                }
                else if (action === main.Types.Messages.OPEN) {
                    var chest = self.server.getEntityById(message[1]);
                    if (chest && chest instanceof main.Chest) {
                        self.server.handleOpenedChest(chest, self);
                    }
                }
                else if (action === main.Types.Messages.CHECK) {
                    var checkpoint = self.server.map.getCheckpoint(message[1]);
                    if (checkpoint) {
                        self.lastCheckpoint = checkpoint;
                    }
                }
                else {
                    if (self.message_callback) {
                        self.message_callback(message);
                    }
                }
            });
            this.connection.onClose(function () {
                if (self.firepotionTimeout) {
                    clearTimeout(self.firepotionTimeout);
                }
                clearTimeout(self.disconnectTimeout);
                if (self.exit_callback) {
                    self.exit_callback();
                }
            });
            this.connection.sendUTF8("go"); // Notify client that the HELLO/WELCOME handshake can start
        }
        zone_callback() {
            throw new Error("Method not implemented.");
        }
        weaponLevel(weaponLevel, armorLevel) {
            throw new Error("Method not implemented.");
        }
        armorLevel(weaponLevel, armorLevel) {
            throw new Error("Method not implemented.");
        }
        armor(armor) {
            throw new Error("Method not implemented.");
        }
        destroy() {
            var self = this;
            this.forEachAttacker(function (mob) {
                mob.clearTarget();
            });
            this.attackers = {};
            this.forEachHater(function (mob) {
                mob.forgetPlayer(self.id);
            });
            this.haters = {};
        }
        getState() {
            var basestate = this._getBaseState(), state = [this.name, this.orientation, this.armor, this.weapon];
            if (this.target) {
                state.push(this.target);
            }
            return basestate.concat(state);
        }
        send(message) {
            this.connection.send(message);
        }
        broadcast(message, ignoreSelf) {
            if (this.broadcast_callback) {
                this.broadcast_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
            }
        }
        broadcastToZone(message, ignoreSelf) {
            if (this.broadcastzone_callback) {
                this.broadcastzone_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
            }
        }
        onExit(callback) {
            this.exit_callback = callback;
        }
        onMove(callback) {
            this.move_callback = callback;
        }
        onLootMove(callback) {
            this.lootmove_callback = callback;
        }
        onZone(callback) {
            this.zone_callback = callback;
        }
        onOrient(callback) {
            this.orient_callback = callback;
        }
        onMessage(callback) {
            this.message_callback = callback;
        }
        onBroadcast(callback) {
            this.broadcast_callback = callback;
        }
        onBroadcastToZone(callback) {
            this.broadcastzone_callback = callback;
        }
        equip(item) {
            return new main.Messages.EquipItem(this, item);
        }
        addHater(mob) {
            if (mob) {
                if (!(mob.id in this.haters)) {
                    this.haters[mob.id] = mob;
                }
            }
        }
        removeHater(mob) {
            if (mob && mob.id in this.haters) {
                delete this.haters[mob.id];
            }
        }
        forEachHater(callback) {
            _.each(this.haters, function (mob) {
                callback(mob);
            });
        }
        equipArmor(kind) {
            this.armor = kind;
            this.armorLevel = main.Properties.getArmorLevel(kind);
        }
        equipWeapon(kind) {
            this.weapon = kind;
            this.weaponLevel = main.Properties.getWeaponLevel(kind);
        }
        equipItem(item) {
            if (item) {
                console.log(this.name + " equips " + main.Types.getKindAsString(item.kind));
                if (main.Types.isArmor(item.kind)) {
                    this.equipArmor(item.kind);
                    this.updateHitPoints();
                    this.send(new main.Messages.HitPoints(this.maxHitPoints).serialize());
                }
                else if (main.Types.isWeapon(item.kind)) {
                    this.equipWeapon(item.kind);
                }
            }
        }
        updateHitPoints() {
            this.resetHitPoints(main.Formulas.hp(this.armorLevel));
        }
        updatePosition() {
            if (this.requestpos_callback) {
                var pos = this.requestpos_callback();
                this.setPosition(pos.x, pos.y);
            }
        }
        onRequestPosition(callback) {
            this.requestpos_callback = callback;
        }
        resetTimeout() {
            clearTimeout(this.disconnectTimeout);
            this.disconnectTimeout = setTimeout(this.timeout.bind(this), 1000 * 60 * 15); // 15 min.
        }
        timeout() {
            this.connection.sendUTF8("timeout");
            this.connection.close("Player was idle for too long");
        }
    }
    main.Player = Player;
})(main || (main = {}));
var main;
(function (main) {
    class Properties {
        static getArmorLevel(kind) {
            try {
                if (main.Types.isMob(kind)) {
                    return Properties[main.Types.getKindAsString(kind)].armor;
                }
                else {
                    return main.Types.getArmorRank(kind) + 1;
                }
            }
            catch (e) {
                console.log("No level found for armor: " + main.Types.getKindAsString(kind));
            }
        }
        ;
        static getWeaponLevel(kind) {
            try {
                if (main.Types.isMob(kind)) {
                    return Properties[main.Types.getKindAsString(kind)].weapon;
                }
                else {
                    return main.Types.getWeaponRank(kind) + 1;
                }
            }
            catch (e) {
                console.log("No level found for weapon: " + main.Types.getKindAsString(kind));
            }
        }
        ;
        static getHitPoints(kind) {
            return Properties[main.Types.getKindAsString(kind)].hp;
        }
    }
    Properties.rat = {
        drops: {
            flask: 40,
            burger: 10,
            firepotion: 5
        },
        hp: 25,
        armor: 1,
        weapon: 1
    };
    Properties.skeleton = {
        drops: {
            flask: 40,
            mailarmor: 10,
            axe: 20,
            firepotion: 5
        },
        hp: 110,
        armor: 2,
        weapon: 2
    };
    Properties.goblin = {
        drops: {
            flask: 50,
            leatherarmor: 20,
            axe: 10,
            firepotion: 5
        },
        hp: 90,
        armor: 2,
        weapon: 1
    };
    Properties.ogre = {
        drops: {
            burger: 10,
            flask: 50,
            platearmor: 20,
            morningstar: 20,
            firepotion: 5
        },
        hp: 200,
        armor: 3,
        weapon: 2
    };
    Properties.spectre = {
        drops: {
            flask: 30,
            redarmor: 40,
            redsword: 30,
            firepotion: 5
        },
        hp: 250,
        armor: 2,
        weapon: 4
    };
    Properties.deathknight = {
        drops: {
            burger: 95,
            firepotion: 5
        },
        hp: 250,
        armor: 3,
        weapon: 3
    };
    Properties.crab = {
        drops: {
            flask: 50,
            axe: 20,
            leatherarmor: 10,
            firepotion: 5
        },
        hp: 60,
        armor: 2,
        weapon: 1
    };
    Properties.snake = {
        drops: {
            flask: 50,
            mailarmor: 10,
            morningstar: 10,
            firepotion: 5
        },
        hp: 150,
        armor: 3,
        weapon: 2
    };
    Properties.skeleton2 = {
        drops: {
            flask: 60,
            platearmor: 15,
            bluesword: 15,
            firepotion: 5
        },
        hp: 200,
        armor: 3,
        weapon: 3
    };
    Properties.eye = {
        drops: {
            flask: 50,
            redarmor: 20,
            redsword: 10,
            firepotion: 5
        },
        hp: 200,
        armor: 3,
        weapon: 3
    };
    Properties.bat = {
        drops: {
            flask: 50,
            axe: 10,
            firepotion: 5
        },
        hp: 80,
        armor: 2,
        weapon: 1
    };
    Properties.wizard = {
        drops: {
            flask: 50,
            platearmor: 20,
            firepotion: 5
        },
        hp: 100,
        armor: 2,
        weapon: 6
    };
    Properties.boss = {
        drops: {
            goldensword: 100
        },
        hp: 700,
        armor: 6,
        weapon: 7
    };
    main.Properties = Properties;
})(main || (main = {}));
var main;
(function (main) {
    let Utils;
    (function (Utils) {
        function sanitize(string) {
            // Strip unsafe tags, then escape as html entities.
            return sanitizer.escape(sanitizer.sanitize(string));
        }
        Utils.sanitize = sanitize;
        function random(range) {
            return Math.floor(Math.random() * range);
        }
        Utils.random = random;
        function randomRange(min, max) {
            return min + (Math.random() * (max - min));
        }
        Utils.randomRange = randomRange;
        function randomInt(min, max) {
            return min + Math.floor(Math.random() * (max - min + 1));
        }
        Utils.randomInt = randomInt;
        function clamp(min, max, value) {
            if (value < min) {
                return min;
            }
            else if (value > max) {
                return max;
            }
            else {
                return value;
            }
        }
        Utils.clamp = clamp;
        function randomOrientation() {
            var o, r = random(4);
            if (r === 0)
                o = main.Types.Orientations.LEFT;
            if (r === 1)
                o = main.Types.Orientations.RIGHT;
            if (r === 2)
                o = main.Types.Orientations.UP;
            if (r === 3)
                o = main.Types.Orientations.DOWN;
            return o;
        }
        Utils.randomOrientation = randomOrientation;
        function Mixin(target, source) {
            if (source) {
                for (var key, keys = Object.keys(source), l = keys.length; l--;) {
                    key = keys[l];
                    if (source.hasOwnProperty(key)) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        }
        Utils.Mixin = Mixin;
        function distanceTo(x, y, x2, y2) {
            var distX = Math.abs(x - x2);
            var distY = Math.abs(y - y2);
            return (distX > distY) ? distX : distY;
        }
        Utils.distanceTo = distanceTo;
    })(Utils = main.Utils || (main.Utils = {}));
})(main || (main = {}));
var main;
(function (main) {
    class 世界服务器 {
        constructor(id, maxPlayers, websocketServer) {
            var self = this;
            this.id = id;
            this.maxPlayers = maxPlayers;
            this.server = websocketServer;
            this.ups = 50;
            this.map = null;
            this.entities = {};
            this.players = {};
            this.mobs = {};
            this.attackers = {};
            this.items = {};
            this.equipping = {};
            this.hurt = {};
            this.npcs = {};
            this.mobAreas = [];
            this.chestAreas = [];
            this.groups = {};
            this.outgoingQueues = {};
            this.itemCount = 0;
            this.playerCount = 0;
            this.zoneGroupsReady = false;
            this.onPlayerConnect(function (player) {
                player.onRequestPosition(function () {
                    if (player.lastCheckpoint) {
                        return player.lastCheckpoint.getRandomPosition();
                    }
                    else {
                        return self.map.getRandomStartingPosition();
                    }
                });
            });
            this.onPlayerEnter(function (player) {
                console.log(player.name + " has joined " + self.id);
                if (!player.hasEnteredGame) {
                    self.incrementPlayerCount();
                }
                // Number of players in this world
                // and in the overall server world
                //self.pushToPlayer(player, new Messages.Population(self.playerCount, self.server.connectionsCount()));
                self.updatePopulation();
                self.pushRelevantEntityListTo(player);
                var move_callback = function (x, y) {
                    console.log(player.name + " is moving to (" + x + ", " + y + ").");
                    player.forEachAttacker(function (mob) {
                        var target = self.getEntityById(mob.target);
                        if (target) {
                            var pos = self.findPositionNextTo(mob, target);
                            if (mob.distanceToSpawningPoint(pos.x, pos.y) > 50) {
                                mob.clearTarget();
                                mob.forgetEveryone();
                                player.removeAttacker(mob);
                            }
                            else {
                                self.moveEntity(mob, pos.x, pos.y);
                            }
                        }
                    });
                };
                player.onMove(move_callback);
                player.onLootMove(move_callback);
                player.onZone(function () {
                    var hasChangedGroups = self.handleEntityGroupMembership(player);
                    if (hasChangedGroups) {
                        self.pushToPreviousGroups(player, new main.Messages.Destroy(player));
                        self.pushRelevantEntityListTo(player);
                    }
                });
                player.onBroadcast(function (message, ignoreSelf) {
                    self.pushToAdjacentGroups(player.group, message, ignoreSelf ? player.id : null);
                });
                player.onBroadcastToZone(function (message, ignoreSelf) {
                    self.pushToGroup(player.group, message, ignoreSelf ? player.id : null);
                });
                player.onExit(function () {
                    console.log(player.name + " has left the game.");
                    self.removePlayer(player);
                    self.decrementPlayerCount();
                    if (self.removed_callback) {
                        self.removed_callback();
                    }
                });
                if (self.added_callback) {
                    self.added_callback();
                }
            });
            // Called when an entity is attacked by another entity
            this.onEntityAttack(function (attacker) {
                var target = self.getEntityById(attacker.target);
                if (target && attacker.type === "mob") {
                    var pos = self.findPositionNextTo(attacker, target);
                    self.moveEntity(attacker, pos.x, pos.y);
                }
            });
            this.onRegenTick(function () {
                self.forEachCharacter(function (character) {
                    if (!character.hasFullHealth()) {
                        character.regenHealthBy(Math.floor(character.maxHitPoints / 25));
                        if (character.type === 'player') {
                            self.pushToPlayer(character, character.regen());
                        }
                    }
                });
            });
        }
        run(mapFilePath) {
            var self = this;
            this.map = new main.Map(mapFilePath);
            this.map.ready(function () {
                self.initZoneGroups();
                self.map.generateCollisionGrid();
                // Populate all mob "roaming" areas
                _.each(self.map.mobAreas, function (a) {
                    var area = new main.MobArea(a.id, a.nb, a.type, a.x, a.y, a.width, a.height, self);
                    area.spawnMobs();
                    area.onEmpty(self.handleEmptyMobArea.bind(self, area));
                    self.mobAreas.push(area);
                });
                // Create all chest areas
                _.each(self.map.chestAreas, function (a) {
                    var area = new main.ChestArea(a.id, a.x, a.y, a.w, a.h, a.tx, a.ty, a.i, self);
                    self.chestAreas.push(area);
                    area.onEmpty(self.handleEmptyChestArea.bind(self, area));
                });
                // Spawn static chests
                _.each(self.map.staticChests, function (chest) {
                    var c = self.createChest(chest.x, chest.y, chest.i);
                    self.addStaticItem(c);
                });
                // Spawn static entities
                self.spawnStaticEntities();
                // Set maximum number of entities contained in each chest area
                _.each(self.chestAreas, function (area) {
                    area.setNumberOfEntities(area.entities.length);
                });
            });
            var regenCount = this.ups * 2;
            var updateCount = 0;
            setInterval(function () {
                self.processGroups();
                self.processQueues();
                if (updateCount < regenCount) {
                    updateCount += 1;
                }
                else {
                    if (self.regen_callback) {
                        self.regen_callback();
                    }
                    updateCount = 0;
                }
            }, 1000 / this.ups);
            console.log("" + this.id + " 创建成功 (可容纳: " + this.maxPlayers + " 玩家).");
        }
        setUpdatesPerSecond(ups) {
            this.ups = ups;
        }
        onInit(callback) {
            this.init_callback = callback;
        }
        onPlayerConnect(callback) {
            this.connect_callback = callback;
        }
        onPlayerEnter(callback) {
            this.enter_callback = callback;
        }
        onPlayerAdded(callback) {
            this.added_callback = callback;
        }
        onPlayerRemoved(callback) {
            this.removed_callback = callback;
        }
        onRegenTick(callback) {
            this.regen_callback = callback;
        }
        pushRelevantEntityListTo(player) {
            var entities;
            if (player && (player.group in this.groups)) {
                entities = _.keys(this.groups[player.group].entities);
                entities = _.reject(entities, function (id) { return id == player.id; });
                entities = _.map(entities, function (id) { return parseInt(id); });
                if (entities) {
                    this.pushToPlayer(player, new main.Messages.List(entities));
                }
            }
        }
        pushSpawnsToPlayer(player, ids) {
            var self = this;
            _.each(ids, function (id) {
                var entity = self.getEntityById(id);
                if (entity) {
                    self.pushToPlayer(player, new main.Messages.Spawn(entity));
                }
            });
            console.log("Pushed " + _.size(ids) + " new spawns to " + player.id);
        }
        pushToPlayer(player, message) {
            if (player && player.id in this.outgoingQueues) {
                this.outgoingQueues[player.id].push(message.serialize());
            }
            else {
                console.log("pushToPlayer: player was undefined");
            }
        }
        pushToGroup(groupId, message, ignoredPlayer) {
            var self = this, group = this.groups[groupId];
            if (group) {
                _.each(group.players, function (playerId) {
                    if (playerId != ignoredPlayer) {
                        self.pushToPlayer(self.getEntityById(playerId), message);
                    }
                });
            }
            else {
                console.log("groupId: " + groupId + " is not a valid group");
            }
        }
        pushToAdjacentGroups(groupId, message, ignoredPlayer) {
            var self = this;
            self.map.forEachAdjacentGroup(groupId, function (id) {
                self.pushToGroup(id, message, ignoredPlayer);
            });
        }
        pushToPreviousGroups(player, message) {
            var self = this;
            // Push this message to all groups which are not going to be updated anymore,
            // since the player left them.
            _.each(player.recentlyLeftGroups, function (id) {
                self.pushToGroup(id, message);
            });
            player.recentlyLeftGroups = [];
        }
        pushBroadcast(message, ignoredPlayer) {
            for (var id in this.outgoingQueues) {
                if (id != ignoredPlayer) {
                    this.outgoingQueues[id].push(message.serialize());
                }
            }
        }
        processQueues() {
            var self = this, connection;
            for (var id in this.outgoingQueues) {
                if (this.outgoingQueues[id].length > 0) {
                    connection = this.server.getConnection(id);
                    connection.send(this.outgoingQueues[id]);
                    this.outgoingQueues[id] = [];
                }
            }
        }
        addEntity(entity) {
            this.entities[entity.id] = entity;
            this.handleEntityGroupMembership(entity);
        }
        removeEntity(entity) {
            if (entity.id in this.entities) {
                delete this.entities[entity.id];
            }
            if (entity.id in this.mobs) {
                delete this.mobs[entity.id];
            }
            if (entity.id in this.items) {
                delete this.items[entity.id];
            }
            if (entity.type === "mob") {
                this.clearMobAggroLink(entity);
                this.clearMobHateLinks(entity);
            }
            entity.destroy();
            this.removeFromGroups(entity);
            console.log("Removed " + main.Types.getKindAsString(entity.kind) + " : " + entity.id);
        }
        addPlayer(player) {
            this.addEntity(player);
            this.players[player.id] = player;
            this.outgoingQueues[player.id] = [];
            //console.log("Added player : " + player.id);
        }
        removePlayer(player) {
            player.broadcast(player.despawn());
            this.removeEntity(player);
            delete this.players[player.id];
            delete this.outgoingQueues[player.id];
        }
        addMob(mob) {
            this.addEntity(mob);
            this.mobs[mob.id] = mob;
        }
        addNpc(kind, x, y) {
            var npc = new main.Npc('8' + x + '' + y, kind, x, y);
            this.addEntity(npc);
            this.npcs[npc.id] = npc;
            return npc;
        }
        addItem(item) {
            this.addEntity(item);
            this.items[item.id] = item;
            return item;
        }
        createItem(kind, x, y) {
            var id = '9' + this.itemCount++, item = null;
            if (kind === main.Types.Entities.CHEST) {
                item = new main.Chest(id, x, y);
            }
            else {
                item = new main.Item(id, kind, x, y);
            }
            return item;
        }
        createChest(x, y, items) {
            var chest = this.createItem(main.Types.Entities.CHEST, x, y);
            chest.setItems(items);
            return chest;
        }
        addStaticItem(item) {
            item.isStatic = true;
            item.onRespawn(this.addStaticItem.bind(this, item));
            return this.addItem(item);
        }
        addItemFromChest(kind, x, y) {
            var item = this.createItem(kind, x, y);
            item.isFromChest = true;
            return this.addItem(item);
        }
        /**
         * The mob will no longer be registered as an attacker of its current target.
         */
        clearMobAggroLink(mob) {
            var player = null;
            if (mob.target) {
                player = this.getEntityById(mob.target);
                if (player) {
                    player.removeAttacker(mob);
                }
            }
        }
        clearMobHateLinks(mob) {
            var self = this;
            if (mob) {
                _.each(mob.hatelist, function (obj) {
                    var player = self.getEntityById(obj.id);
                    if (player) {
                        player.removeHater(mob);
                    }
                });
            }
        }
        forEachEntity(callback) {
            for (var id in this.entities) {
                callback(this.entities[id]);
            }
        }
        forEachPlayer(callback) {
            for (var id in this.players) {
                callback(this.players[id]);
            }
        }
        forEachMob(callback) {
            for (var id in this.mobs) {
                callback(this.mobs[id]);
            }
        }
        forEachCharacter(callback) {
            this.forEachPlayer(callback);
            this.forEachMob(callback);
        }
        handleMobHate(mobId, playerId, hatePoints) {
            var mob = this.getEntityById(mobId), player = this.getEntityById(playerId), mostHated;
            if (player && mob) {
                mob.increaseHateFor(playerId, hatePoints);
                player.addHater(mob);
                if (mob.hitPoints > 0) { // only choose a target if still alive
                    this.chooseMobTarget(mob);
                }
            }
        }
        chooseMobTarget(mob, hateRank) {
            var player = this.getEntityById(mob.getHatedPlayerId(hateRank));
            // If the mob is not already attacking the player, create an attack link between them.
            if (player && !(mob.id in player.attackers)) {
                this.clearMobAggroLink(mob);
                player.addAttacker(mob);
                mob.setTarget(player);
                this.broadcastAttacker(mob);
                console.log(mob.id + " is now attacking " + player.id);
            }
        }
        onEntityAttack(callback) {
            this.attack_callback = callback;
        }
        getEntityById(id) {
            if (id in this.entities) {
                return this.entities[id];
            }
            else {
                console.log("Unknown entity : " + id);
            }
        }
        getPlayerCount() {
            var count = 0;
            for (var p in this.players) {
                if (this.players.hasOwnProperty(p)) {
                    count += 1;
                }
            }
            return count;
        }
        broadcastAttacker(character) {
            if (character) {
                this.pushToAdjacentGroups(character.group, character.attack(), character.id);
            }
            if (this.attack_callback) {
                this.attack_callback(character);
            }
        }
        handleHurtEntity(entity, attacker, damage) {
            var self = this;
            if (entity.type === 'player') {
                // A player is only aware of his own hitpoints
                this.pushToPlayer(entity, entity.health());
            }
            if (entity.type === 'mob') {
                // Let the mob's attacker (player) know how much damage was inflicted
                this.pushToPlayer(attacker, new main.Messages.Damage(entity, damage));
            }
            // If the entity is about to die
            if (entity.hitPoints <= 0) {
                if (entity.type === "mob") {
                    var mob = entity, item = this.getDroppedItem(mob);
                    this.pushToPlayer(attacker, new main.Messages.Kill(mob));
                    this.pushToAdjacentGroups(mob.group, mob.despawn()); // Despawn must be enqueued before the item drop
                    if (item) {
                        this.pushToAdjacentGroups(mob.group, mob.drop(item));
                        this.handleItemDespawn(item);
                    }
                }
                if (entity.type === "player") {
                    this.handlePlayerVanish(entity);
                    this.pushToAdjacentGroups(entity.group, entity.despawn());
                }
                this.removeEntity(entity);
            }
        }
        despawn(entity) {
            this.pushToAdjacentGroups(entity.group, entity.despawn());
            if (entity.id in this.entities) {
                this.removeEntity(entity);
            }
        }
        spawnStaticEntities() {
            var self = this, count = 0;
            _.each(this.map.staticEntities, function (kindName, tid) {
                var kind = main.Types.getKindFromString(kindName), pos = self.map.tileIndexToGridPosition(tid);
                if (main.Types.isNpc(kind)) {
                    self.addNpc(kind, pos.x + 1, pos.y);
                }
                if (main.Types.isMob(kind)) {
                    var mob = new main.Mob('7' + kind + count++, kind, pos.x + 1, pos.y);
                    mob.onRespawn(function () {
                        mob.isDead = false;
                        self.addMob(mob);
                        if (mob.area && mob.area instanceof main.ChestArea) {
                            mob.area.addToArea(mob);
                        }
                    });
                    mob.onMove(self.onMobMoveCallback.bind(self));
                    self.addMob(mob);
                    self.tryAddingMobToChestArea(mob);
                }
                if (main.Types.isItem(kind)) {
                    self.addStaticItem(self.createItem(kind, pos.x + 1, pos.y));
                }
            });
        }
        isValidPosition(x, y) {
            if (this.map && _.isNumber(x) && _.isNumber(y) && !this.map.isOutOfBounds(x, y) && !this.map.isColliding(x, y)) {
                return true;
            }
            return false;
        }
        handlePlayerVanish(player) {
            var self = this, previousAttackers = [];
            // When a player dies or teleports, all of his attackers go and attack their second most hated player.
            player.forEachAttacker(function (mob) {
                previousAttackers.push(mob);
                self.chooseMobTarget(mob, 2);
            });
            _.each(previousAttackers, function (mob) {
                player.removeAttacker(mob);
                mob.clearTarget();
                mob.forgetPlayer(player.id, 1000);
            });
            this.handleEntityGroupMembership(player);
        }
        setPlayerCount(count) {
            this.playerCount = count;
        }
        incrementPlayerCount() {
            this.setPlayerCount(this.playerCount + 1);
        }
        decrementPlayerCount() {
            if (this.playerCount > 0) {
                this.setPlayerCount(this.playerCount - 1);
            }
        }
        getDroppedItem(mob) {
            var kind = main.Types.getKindAsString(mob.kind), drops = main.Properties[kind].drops, v = main.Utils.random(100), p = 0, item = null;
            for (var itemName in drops) {
                var percentage = drops[itemName];
                p += percentage;
                if (v <= p) {
                    item = this.addItem(this.createItem(main.Types.getKindFromString(itemName), mob.x, mob.y));
                    break;
                }
            }
            return item;
        }
        onMobMoveCallback(mob) {
            this.pushToAdjacentGroups(mob.group, new main.Messages.Move(mob));
            this.handleEntityGroupMembership(mob);
        }
        findPositionNextTo(entity, target) {
            var valid = false, pos;
            while (!valid) {
                pos = entity.getPositionNextTo(target);
                valid = this.isValidPosition(pos.x, pos.y);
            }
            return pos;
        }
        initZoneGroups() {
            var self = this;
            this.map.forEachGroup(function (id) {
                self.groups[id] = { entities: {},
                    players: [],
                    incoming: [] };
            });
            this.zoneGroupsReady = true;
        }
        removeFromGroups(entity) {
            var self = this, oldGroups = [];
            if (entity && entity.group) {
                var group = this.groups[entity.group];
                if (entity instanceof main.Player) {
                    group.players = _.reject(group.players, function (id) { return id === entity.id; });
                }
                this.map.forEachAdjacentGroup(entity.group, function (id) {
                    if (entity.id in self.groups[id].entities) {
                        delete self.groups[id].entities[entity.id];
                        oldGroups.push(id);
                    }
                });
                entity.group = null;
            }
            return oldGroups;
        }
        /**
         * Registers an entity as "incoming" into several groups, meaning that it just entered them.
         * All players inside these groups will receive a Spawn message when WorldServer.processGroups is called.
         */
        addAsIncomingToGroup(entity, groupId) {
            var self = this, isChest = entity && entity instanceof main.Chest, isItem = entity && entity instanceof main.Item, isDroppedItem = entity && isItem && !entity.isStatic && !entity.isFromChest;
            if (entity && groupId) {
                this.map.forEachAdjacentGroup(groupId, function (id) {
                    var group = self.groups[id];
                    if (group) {
                        if (!_.include(group.entities, entity.id)
                            //  Items dropped off of mobs are handled differently via DROP messages. See handleHurtEntity.
                            && (!isItem || isChest || (isItem && !isDroppedItem))) {
                            group.incoming.push(entity);
                        }
                    }
                });
            }
        }
        addToGroup(entity, groupId) {
            var self = this, newGroups = [];
            if (entity && groupId && (groupId in this.groups)) {
                this.map.forEachAdjacentGroup(groupId, function (id) {
                    self.groups[id].entities[entity.id] = entity;
                    newGroups.push(id);
                });
                entity.group = groupId;
                if (entity instanceof main.Player) {
                    this.groups[groupId].players.push(entity.id);
                }
            }
            return newGroups;
        }
        logGroupPlayers(groupId) {
            console.log("Players inside group " + groupId + ":");
            _.each(this.groups[groupId].players, function (id) {
                console.log("- player " + id);
            });
        }
        handleEntityGroupMembership(entity) {
            var hasChangedGroups = false;
            if (entity) {
                var groupId = this.map.getGroupIdFromPosition(entity.x, entity.y);
                if (!entity.group || (entity.group && entity.group !== groupId)) {
                    hasChangedGroups = true;
                    this.addAsIncomingToGroup(entity, groupId);
                    var oldGroups = this.removeFromGroups(entity);
                    var newGroups = this.addToGroup(entity, groupId);
                    if (_.size(oldGroups) > 0) {
                        entity.recentlyLeftGroups = _.difference(oldGroups, newGroups);
                        console.log("group diff: " + entity.recentlyLeftGroups);
                    }
                }
            }
            return hasChangedGroups;
        }
        processGroups() {
            var self = this;
            if (this.zoneGroupsReady) {
                this.map.forEachGroup(function (id) {
                    var spawns = [];
                    if (self.groups[id].incoming.length > 0) {
                        spawns = _.each(self.groups[id].incoming, function (entity) {
                            if (entity instanceof main.Player) {
                                self.pushToGroup(id, new main.Messages.Spawn(entity), entity.id);
                            }
                            else {
                                self.pushToGroup(id, new main.Messages.Spawn(entity));
                            }
                        });
                        self.groups[id].incoming = [];
                    }
                });
            }
        }
        moveEntity(entity, x, y) {
            if (entity) {
                entity.setPosition(x, y);
                this.handleEntityGroupMembership(entity);
            }
        }
        handleItemDespawn(item) {
            var self = this;
            if (item) {
                item.handleDespawn({
                    beforeBlinkDelay: 10000,
                    blinkCallback: function () {
                        self.pushToAdjacentGroups(item.group, new main.Messages.Blink(item));
                    },
                    blinkingDuration: 4000,
                    despawnCallback: function () {
                        self.pushToAdjacentGroups(item.group, new main.Messages.Destroy(item));
                        self.removeEntity(item);
                    }
                });
            }
        }
        handleEmptyMobArea(area) {
        }
        handleEmptyChestArea(area) {
            if (area) {
                var chest = this.addItem(this.createChest(area.chestX, area.chestY, area.items));
                this.handleItemDespawn(chest);
            }
        }
        handleOpenedChest(chest, player) {
            this.pushToAdjacentGroups(chest.group, chest.despawn());
            this.removeEntity(chest);
            var kind = chest.getRandomItem();
            if (kind) {
                var item = this.addItemFromChest(kind, chest.x, chest.y);
                this.handleItemDespawn(item);
            }
        }
        tryAddingMobToChestArea(mob) {
            _.each(this.chestAreas, function (area) {
                if (area.contains(mob)) {
                    area.addToArea(mob);
                }
            });
        }
        updatePopulation(totalPlayers) {
            totalPlayers = totalPlayers ? totalPlayers : this.server.connectionsCount();
            console.log("Updating population: " + this.playerCount + " " + totalPlayers);
            this.pushBroadcast(new main.Messages.Population(this.playerCount, totalPlayers));
        }
    }
    main.世界服务器 = 世界服务器;
})(main || (main = {}));
var main;
(function (main) {
    class 服务器 {
        constructor(port) {
            this.所有连接 = {};
            this._counter = 0;
            this.port = port;
        }
        /** 当有客户端连接上服务器时调用 */
        监听连接(回调函数) {
            this.连接回调函数 = 回调函数;
        }
        onError(callback) {
            this.error_callback = callback;
        }
        broadcast(message) {
            throw "Not implemented";
        }
        /**
         * 循环所有连接
         * @param callback
         */
        forEachConnection(callback) {
            let object = this.所有连接;
            for (const key in object) {
                if (object.hasOwnProperty(key)) {
                    const element = object[key];
                    callback(element);
                }
            }
        }
        /**
         * 添加一个连接
         * @param connection
         */
        addConnection(connection) {
            this.所有连接[connection.id] = connection;
        }
        /**
         * 删除一个连接
         * @param id
         */
        removeConnection(id) {
            delete this.所有连接[id];
        }
        /**
         * 获取一个连接
         * @param id
         */
        getConnection(id) {
            return this.所有连接[id];
        }
        /**
         * 获取连接数量
         */
        connectionsCount() {
            return Object.keys(this.所有连接).length;
        }
    }
    class 连接 {
        constructor(id, connection, server) {
            this._connection = connection;
            this._server = server;
            this.id = id;
        }
        onClose(callback) {
            this.close_callback = callback;
        }
        listen(callback) {
            this.listen_callback = callback;
        }
        broadcast(message) {
            throw "Not implemented";
        }
        send(message) {
            throw "Not implemented";
        }
        sendUTF8(data) {
            throw "Not implemented";
        }
        close(logError) {
            console.log("Closing connection to " + this._connection.remoteAddress + ". Error: " + logError);
            this._connection.close();
        }
    }
    class socketIO服务器 extends 服务器 {
        constructor(host, port) {
            super(port);
            let self = this;
            self.host = host;
            self.port = port;
            // var app = require('express')()
            // var http = require('http').Server(app)
            // self.io = require('socket.io')(http)
            self.io = socketIO(http.Server(app));
            self.io.on('connection', function (connection) {
                console.log('一个用户连接上了');
                connection.remoteAddress = connection.handshake.address.address;
                var c = new socketIO连接(self._createId(), connection, self);
                if (self.连接回调函数) {
                    self.连接回调函数(c);
                }
                self.addConnection(c);
            });
            self.io.on('error', function (err) {
                console.log(err.stack);
                self.error_callback();
            });
            http.listen(port, function () {
                console.log('listening on *:' + port);
            });
        }
        _createId() {
            return '5' + main.Utils.random(99) + '' + (this._counter++);
        }
        broadcast(message) {
            this.io.emit("message", message);
        }
        onRequestStatus(status_callback) {
            this.status_callback = status_callback;
        }
    }
    main.socketIO服务器 = socketIO服务器;
    class socketIO连接 extends 连接 {
        constructor(id, connection, server) {
            super(id, connection, server);
            var self = this;
            // HANDLE DISPATCHER IN HERE
            connection.on("dispatch", function (message) {
                console.log("收到对调度系统的请求");
                self._connection.emit("dispatched", { "status": "OK", host: server.host, port: server.port });
            });
            connection.on("message", function (message) {
                console.log("收到: " + message);
                if (self.listen_callback)
                    self.listen_callback(message);
            });
            connection.on("disconnect", function () {
                if (self.close_callback) {
                    self.close_callback();
                }
                //delete self._server.removeConnection(self.id);
                self._server.removeConnection(self.id);
            });
        }
        broadcast(message) {
            throw "Not implemented";
        }
        send(message) {
            this._connection.emit("message", message);
        }
        sendUTF8(data) {
            this.send(data);
        }
        close(logError) {
            console.log("Closing connection to socket" + ". 异常: " + logError);
            this._connection.disconnect();
        }
    }
    main.socketIO连接 = socketIO连接;
})(main || (main = {}));
//# sourceMappingURL=bundle.js.map