var store = {};

function MemoryStore() {}

MemoryStore.getItem = function(key) {
    return new Promise((resolve) => {
        resolve(store[key])
    });
};

MemoryStore.setItem = function(key, value) {
    return new Promise((resolve) => {
        store[key] = value
        resolve()
    });
};

MemoryStore.removeItem = function(key) {
    return new Promise((resolve) => {
        delete store[key]
        resolve()
    });
};

MemoryStore.getAllKeys = function() {
    return new Promise((resolve) => {
        resolve(Object.keys(store))
    });
};

MemoryStore.multiRemove = function(keys) {
    return new Promise((resolve) => {
        if (keys) {
            keys.forEach(function(key) {
                delete store[key];
            });    
        }
        
        resolve()
    });
};

MemoryStore.multiGet = function(keys) {
    return new Promise((resolve) => {
        var results = [];
        keys.forEach(function(key) {
            results.push([key, store[key]]);
        });

        resolve(results)
    });
};

MemoryStore.multiSet = function(keyVals) {
    return new Promise((resolve) => {
        keyVals.forEach(function(keyVal) {
            store[keyVal[0]] = keyVal[1]
        });

        resolve()
    });
};

module.exports = MemoryStore;
