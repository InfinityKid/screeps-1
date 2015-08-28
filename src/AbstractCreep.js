export default class AbstractCreep {
    get creep() {
        return this._creep;
    }

    set creep(creep) {
        this._creep = creep;
    }

    get name() {
        return this.creep.name;
    }

    get memory() {
        return this.creep.memory;
    }

    constructor(game, creep) {
        this.game  = game;
        this.creep = creep;
    }

    remember(key, value) {
        if (value === undefined) {
            return this.creep.memory[key];
        }

        this.creep.memory[key] = value;

        return value;
    }

    forget(key) {
        delete this.creep.memory[key];
    }

    getAvoidedArea() {
        return global.Cache.remember(
            'avoid-enemies-' + this.creep.room.name,
            function () {
                var calculateArea = function (x, y) {
                    var avoidPosArray = [];

                    for (var n = -4; n < 4; n++) {
                        for (var i = -4; i < 4; i++) {
                            avoidPosArray.push({
                                x: x + n,
                                y: y + i
                            });
                        }
                    }


                    return avoidPosArray;
                };

                var avoidPosArray = [];
                var enemies       = this.creep.room.find(FIND_HOSTILE_CREEPS, {
                    filter: function (t) {
                        return t.owner.username == 'Source Keeper';

                    }
                });

                for (var i = 0; i < enemies.length; i++) {
                    var startPosX = enemies[i].pos.x;
                    var startPosY = enemies[i].pos.y;
                    var positions = calculateArea(startPosX, startPosY);
                    for (var n = 0; n < positions.length; n++) {
                        avoidPosArray.push(
                            this.creep.room.getPositionAt(positions[n].x, positions[n].y)
                        );
                    }
                }

                return avoidPosArray;
            }.bind(this)
        );
    }

    moveToNewRoom() {
        var targetRoom = this.remember('targetRoom'),
            srcRoom    = this.remember('srcRoom');

        if (targetRoom) {
            if (targetRoom != this.creep.room.name) {
                var exitDir = this.creep.room.findExitTo(targetRoom);
                var exit    = this.creep.pos.findClosest(exitDir);
                this.creep.moveTo(exit);
                return true;
            } else {
                this.creep.moveTo(30, 30);
                targetRoom = this.remember('targetRoom', false);
                srcRoom    = this.remember('srcRoom', this.creep.room.name);
            }
        } else {
            return false;
        }

    }

    randomMovement() {
        if (!this.remember('temp-pos')) {
            this.remember('temp-pos', {x: parseInt(Math.random() * 50), y: parseInt(Math.random() * 50)});
        }
        if (!this.remember('last-pos')) {
            this.remember('last-pos', {x: 0, y: 0});
        }
        if (!this.remember('last-energy')) {
            this.remember('last-energy', 0);
        }
        if (!this.remember('move-counter')) {
            this.remember('move-counter', 0);
        }
        if (!this.remember('move-attempts')) {
            this.remember('move-attempts', 0);
        }

        var avoidArea    = this.getAvoidedArea(),
            moveCounter  = this.remember('move-counter'),
            moveAttempts = this.remember('move-attempts'),
            lastEnergy   = this.remember('last-energy'),
            tempPos      = this.remember('temp-pos'),
            lastPos      = this.remember('last-pos'),
            currPos      = this.creep.pos;

        if (lastEnergy != this.creep.carry.energy) {
            moveAttempts = this.remember('move-attempts', 0);
        }

        if (lastPos.x == currPos.x && lastPos.y == currPos.y && this.creep.fatigue == 0) {
            moveAttempts++;
            if (moveAttempts >= 7) {
                moveAttempts = 0;
                moveCounter  = 3;
            }
            this.remember('move-attempts', moveAttempts)
            this.remember('move-counter', moveCounter)
        }

        if (moveCounter) {
            moveCounter--;
            this.remember('move-counter', moveCounter);
            this.creep.moveTo(tempPos.x, tempPos.y, {avoid: avoidArea});
            if (typeof this.onRandomMovement === 'function') {
                this.onRandomMovement();
            }
            return true;
        }

        this.remember('last-pos', {x: this.creep.pos.x, y: this.creep.pos.y});
        this.remember('last-energy', this.creep.carry.energy);

        return false;
    }
}