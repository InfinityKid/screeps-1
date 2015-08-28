function sizeOf(hash) {
    let count = 0;
    for (var i in hash) {
        if (hash.hasOwnProperty(i)) {
            count++;
        }
    }

    return count;
}

module.exports = {
    sizeOf: sizeOf
};