function isCreepA(creep, type) {
    return type === (creep.memory.role === undefined ? creep.name.split('-')[0] : creep.memory.role);
}

module.exports = {
    isCreepA: isCreepA
};