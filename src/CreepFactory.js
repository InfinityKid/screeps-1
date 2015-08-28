import CreepBuilder from 'CreepBuilder';
import CreepMiner from 'CreepMiner';
import CreepDefender from 'CreepDefender';
import CreepHealer from 'CreepHealer';
import CreepCarrier from 'CreepCarrier';
import CreepAttacker from 'CreepAttacker';
import CreepScout from 'CreepScout';

import settings from 'settings';

export default class CreepFactory {
    static ERRORS = {
        "-1":  'ERR_NOT_OWNER',
        "-3":  "ERR_NAME_EXISTS",
        "-4":  "ERR_BUSY",
        "-6":  "ERR_NOT_ENOUGH_ENERGY",
        "-10": "ERR_INVALID_ARGS"
    };

    constructor(game, depositManager, resourceManager, constructionManager, population, roomHandler) {
        this.game                = game;
        this.depositManager      = depositManager;
        this.resourceManager     = resourceManager;
        this.constructionManager = constructionManager;
        this.population          = population;
        this.roomHandler         = roomHandler;

        this.levels = this.setLevels();
    }

    load(creep) {
        var loadedCreep = null;
        var role        = creep.memory.role;
        if (!role) {
            role = creep.name.split('-')[0];
        }

        switch (role) {
            case 'CreepBuilder':
                loadedCreep = new CreepBuilder(this.game, creep, this.depositManager, this.constructionManager);
                break;
            case 'CreepMiner':
                loadedCreep = new CreepMiner(this.game, creep, this.population, this.resourceManager);
                break;
            case 'CreepDefender':
                loadedCreep = new CreepDefender(this.game, creep);
                break;
            case 'CreepHealer':
                loadedCreep = new CreepHealer(this.game, creep);
                break;
            case 'CreepCarrier':
                loadedCreep = new CreepCarrier(this.game, creep, this.depositManager, this.resourceManager, this.constructionManager);
                break;
            case 'CreepAttacker':
                loadedCreep = new CreepAttacker(this.game, creep);
                break;
            case 'CreepScout':
                loadedCreep = new CreepScout(this.game, creep, this.roomHandler);
                break;
        }

        if (!loadedCreep) {
            return false;
        }

        loadedCreep.init();

        return loadedCreep;
    }

    setLevels() {
        let creeps = settings.creeps;

        for (let type in creeps) {
            if (!creeps.hasOwnProperty(type)) {
                continue;
            }

            let data = creeps[type];
            for (let i = 0; i < data.levels.length; i++) {
                let levelData               = data.levels[i];
                creeps[type].levels[i].cost = this.getPointsForAbilities(levelData.abilities);
            }
        }

        return creeps;
    }

    getBestCreepOfType(type) {
        const data       = this.levels[type],
              maxEnergy  = this.depositManager.energyCapacity() - 50,
              finalStats = data.finalStats;

        let best      = null,
            bestIndex = null;

        // If we have no way of getting energy back to spawn, then lets only do level ones
        if (this.population.getTotalPopulation() < 5) {
            best = data.levels[0];
            bestIndex = 0;
        } else {
            for (let i = 0; i < data.levels.length; i++) {
                let level = data.levels[i];
                if (maxEnergy < level.cost) {
                    break;
                }

                best      = level;
                bestIndex = i;
            }
        }

        if (bestIndex === data.levels.length - 1) {
            let index = 0;
            while (true) {
                let addedCost = this.getPointsForAbilities(finalStats);
                if (best.cost + addedCost < maxEnergy) {
                    break;
                }

                index++;
                best.abilities.concat(finalStats);
            }

            best.level = best.level + ' + ' + index;
        }

        return best;
    }

    new(creepType, spawn) {
        let id        = ("" + new Date().getTime()).substr(4),
            data      = this.getBestCreepOfType(creepType),
            level     = data.level,
            abilities = data.abilities;

        let canBuild = spawn.canCreateCreep(abilities, creepType + '-' + id);
        if (canBuild !== 0) {
            //**
            console.log(
                'Can not build creep: ' + creepType + ' @ ' + level + ' (' + CreepFactory.ERRORS[canBuild] + ')',
                '(Energy: ' + this.depositManager.energy() + '/' + this.getPointsForAbilities(abilities) + ')'
            );
            //*/
            return false;
        }

        let status = spawn.createCreep(abilities, creepType + '-' + level + '-' + id, {role: creepType});
        global.log('Spawn level ' + level + ' ' + creepType, status);

        return status === OK;
    }

    getPointsForAbilities(abilities) {
        const POINTS = {
            tough:         10,
            move:          50,
            carry:         50,
            attack:        80,
            work:          100,
            ranged_attack: 150,
            heal:          200
        };

        let points = 0;
        for (var index in abilities) {
            points += POINTS[abilities[index]];
        }

        return points;
    }
}
