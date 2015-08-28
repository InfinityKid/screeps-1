import Distributor from 'Distributor';
import Population from 'Population';
import DepositManager from 'DepositManager';
import ResourceManager from 'ResourceManager';
import ConstructionManager from 'ConstructionManager';
import CreepFactory from 'CreepFactory';

/**
 * Main logic class
 */
export default class Room {
    get game() {
        return this.roomManager.mainManager.game;
    }

    get name() {
        return this.room.name;
    }

    /**
     * Builds the room
     *
     * 1) Finds all spawns for the room
     * 2) Gets the population of the current room
     * 3) Builds the deposit manager (manages all the spawns and their deposit buildings in the room)
     * 4) Builds the resource manager (manages all the sources in the room)
     * 5) Builds the construction manager (manages the buildings in the room
     * 6) Sets the maxes for miners, builders, and carriers
     * 7) Builds the creep factory
     *
     * @param room
     * @param roomManager
     */
    constructor(room, roomManager) {
        this.room        = room;
        this.roomManager = roomManager;

        this.spawns = room.find(FIND_MY_SPAWNS);
        this.creeps = [];

        this.distributor         = new Distributor(this);
        this.population          = new Population(this.room);
        this.depositManager      = new DepositManager(this.game, this.room, this.spawns);
        this.resourceManager     = new ResourceManager(this.game, this.room, this.population);
        this.constructionManager = new ConstructionManager(this.game, this.room);

        this.population.distro.CreepBuilder.max = this.getBuilderMax();
        this.population.distro.CreepMiner.max   = this.getMinerMax();
        this.population.distro.CreepCarrier.max = this.population.distro.CreepBuilder.total + this.population.distro.CreepMiner.total;

        this.creepFactory = this.createCreepFactory();
    }

    getBuilderMax() {
        let pop   = this.population.getTotalPopulation();

        if (pop < 4) {
            return 0;
        }

        if (pop < 10) {
            return 1
        }

        if (pop < 20) {
            return 2;
        }

        if (pop < 50) {
            return 4;
        }

        return 6;
    }

    getMinerMax() {
        let count = this.resourceManager.getSources().length,
            pop   = this.population.getTotalPopulation();

        if (pop < 4) {
            return count * .5;
        }

        if (pop < 20) {
            return count * 1;
        }

        if (pop < 50) {
            return count * 2;
        }

        return count * 3;
    }

    createCreepFactory() {
        return new CreepFactory(
            this.game,
            this.depositManager,
            this.resourceManager,
            this.constructionManager,
            this.population,
            this.roomManager
        );
    }

    /**
     * Finds all creeps of the given type
     *
     * @param type
     * @returns {Array}
     */
    getCreepsOfType(type) {
        let creeps = [];

        for (let i = 0; i < this.creeps.length; i++) {
            let creep = this.creeps[i];
            if (creep.remember('role') !== type) {
                continue;
            }

            creeps.push(creep);
        }

        return creeps;
    }

    askForReinforcements() {
        console.log(this.room.name + ': ask for reinforcements.');
        this.roomManager.requestReinforcement(this);
    }

    sendReinforcements(room) {
        global.log("Sending reinforcements?");
        return;

        if (!Memory[this.room.name]) {
            Memory[this.room.name] = {};
        }
        let alreadySending = false;
        for (let i = 0; i < this.population.creeps.length; i++) {
            let creep = this.population.creeps[i];
            if (creep.memory.targetRoom == room.room.name) {
                alreadySending = true;
                break;
            }
        }
        if (alreadySending) {
            console.log(this.room.name + ': already given reinforcements');
            return;
        }
        if (this.population.getTotalPopulation() < this.population.getMaxPopulation() * 0.8) {
            console.log(this.room.name + ': Not enough resources ' + '(' + this.population.getTotalPopulation() + '/' + this.population.getMaxPopulation() * 0.8 + ')');
            return;
        }

        let sentType = [];
        for (let i = 0; i < this.population.creeps.length; i++) {
            let creep = this.population.creeps[i];
            if (creep.ticksToLive < 1000) {
                continue;
            }
            if (sentType.indexOf(creep.memory.role) == -1) {
                sentType.push(creep.memory.role);
                console.log('sending: ' + creep.memory.role);
                creep.memory.targetRoom = room.room.name;
            }
        }
    }

    /**
     * Runs through the spawns, and creates new creeps if necessary
     */
    populate() {
        // Disabling for now
        // If there are no spawns in this room, and less than 10 creeps, ask for more reinforcements
        //if (this.depositManager.spawns.length == 0 && this.population.getTotalPopulation() < 10) {
        //    this.askForReinforcements()
        //}

        for (let i = 0; i < this.spawns.length; i++) {
            let spawn = this.spawns[i];

            // If we are currently spawning at this spawn, just skip it
            if (spawn.spawning) {
                continue;
            }

            // If theres more than 20% of the energy capacity in storage, start the spawning process
            if ((this.depositManager.energy() / this.depositManager.energyCapacity()) <= 0.2) {
                continue;
            }

            let types = this.population.getTypes();
            for (let name in types) {
                if (!types.hasOwnProperty(name)) {
                    continue;
                }

                let type = types[name];

                // Check to make sure we have enough extension buildings for the given type
                if (this.depositManager.deposits.length < type.minExtensions) {
                    continue;
                }

                //global.log(name, type.currentPercentage, type.goalPercentage, type.total, type.max);
                // Check to see if we've met the goal for the given number of creeps
                if (type.currentPercentage >= type.goalPercentage && type.total >= type.max) {
                    continue;
                }

                // Everything passed, so lets create a new creep for this spawn
                if (this.creepFactory.new(name, spawn)) {
                    break;
                }

                break;
            }
        }

    }

    /**
     * Grabs all the creeps in the room, and runs them through the creep factory to get their type
     */
    loadCreeps() {
        let creeps = this.room.find(FIND_MY_CREEPS);
        for (let name in creeps) {
            let creep = this.creepFactory.load(creeps[name]);
            if (creep) {
                this.creeps.push(creep);
            }
        }
    }

    distributeCreeps() {
        this.distributor.distribute();
    }
}
