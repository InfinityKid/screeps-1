export default class ResourceManager {
    constructor(game, room, population) {
        this.game       = game;
        this.room       = room;
        this.population = population;
    }

    getAvailableResource() {
        // Some kind of unit counter per resource (with Population)
        let srcs     = this.getSources(),
            srcIndex = Math.floor(Math.random() * srcs.length);

        return srcs[srcIndex];
    }

    getResourceById(id) {
        return this.game.getObjectById(id);
    }

    getSources() {
        return global.Cache.remember(
            'sources',
            () => {
                return this.room.find(
                    FIND_SOURCES,
                    {
                        filter: function (src) {
                            return src.pos.findInRange(FIND_HOSTILE_CREEPS, 3).length == 0;
                        }
                    }
                );
            }
        );
    }
}
