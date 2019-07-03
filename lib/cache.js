const MemoryStore = require('./memoryStore');

function Cache(options) {
    this.namespace = options.namespace || 'cache';
    this.backend = options.backend || MemoryStore;
    this.policy = options.policy || { maxEntries: 50000 };
    this.lru = []
    this.storage = {}
}

Cache.prototype.initializeCache = function() {
    return new Promise((resolve, reject) => {
        this.backend.getItem(this.getLRUKey())
        .then((res) => {
            this.lru = res ? JSON.parse(res) : []
            return this.getAll()
        })
        .then((res) => {
            this.storage = res ? res : {}
            resolve()
        })
        .catch(e => {
            reject(e)
        })
    });
}

Cache.prototype.getLRUKey = function() {
    return this.makeCompositeKey('_lru');
};

Cache.prototype.saveLRU = function() {
    return new Promise((resolve, reject) => {
        this.backend.setItem(this.getLRUKey(), JSON.stringify(this.lru))
        .then(() => {
            resolve()
        })
        .catch(e => {
            reject(e)
        })
    });
}

Cache.prototype.removeItem = function(key) {
    var compositeKey = this.makeCompositeKey(key);

    this.lru.splice(this.lru.indexOf(key), 1)
    delete this.storage[key]
    return new Promise((resolve, reject) => {
        this.saveLRU()
        .then(() => {
            return this.backend.removeItem(compositeKey)
        })
        .then(() => {
            resolve()
        })
        .catch(e => {
            reject(e)
        })
    });
};

Cache.prototype.refreshLRU = function(key) {
    let newLRU = this.lru.filter(item => {
        return item !== key;
    });
    
    newLRU.push(key)
    this.lru = newLRU
}

Cache.prototype.getItem = function(key) {
    if (this.lru.includes(key)) {
        this.refreshLRU(key)
        return new Promise((resolve, reject) => {
            this.saveLRU()
            .then(() => {
                resolve(this.peekItem(key))
            })
            .catch(e => {
                reject(e)
            })
        })
    } else {
        return new Promise((resolve) => { resolve(null) })
    }
};

Cache.prototype.makeCompositeKey = function(key) {
    return this.namespace + ':' + key;
};

Cache.prototype.peekItem = function(key) {
    var compositeKey = this.makeCompositeKey(key);
    let entry = null
    let value = null
    if (this.storage[compositeKey]) {
        entry = JSON.parse(this.storage[compositeKey])
    }

    if (entry) value = entry.value

    return value
};

Cache.prototype.setItem = function(key, value) {
    let self = this;
    let entry = {
        created: new Date(),
        value: value
    };

    let compositeKey = this.makeCompositeKey(key)
    let entryString = JSON.stringify(entry)
    this.refreshLRU(key)

    let victimList = this.enforceLimitsLRU()

    victimList.forEach(function(key) {
        delete self.storage[key];
    }); 
    this.storage[compositeKey] = entryString
    
    let toStore = []

    for (let key in this.storage) {
        toStore.push([key, JSON.stringify(this.storage[key])])
    }
    
    return new Promise((resolve, reject) => {
        self.saveLRU()
        .then(() => {
            if (toStore.length > 0) {
                return self.backend.multiSet(toStore)
            } else {
                return null
            }
        })
        .then(() => {
            if (victimList.length > 0) {
              return self.backend.multiRemove(victimList)
            } else {
              return null
            }
        })
        .then(() => {
            resolve()
        })
        .catch(e => {
            reject(e)
        })
    });
};

Cache.prototype.clearStorage = function() {
    let self = this

    return new Promise((resolve, reject) => {
        this.backend.getAllKeys()
        .then((keys) => {
            var namespaceKeys = keys.filter(key => {
                return key.substr(0, self.namespace.length) == self.namespace;
            });

            return self.backend.multiRemove(namespaceKeys)
        })
        .then(() => {
            resolve()
        })
        .catch(e => {
            reject(e)
        })
    })
}

Cache.prototype.clearAll = function() {
    let self = this
    this.storage = []
    this.lru = []

    return new Promise((resolve, reject) => {
        this.backend.getAllKeys()
        .then((keys) => {
            var namespaceKeys = keys.filter(key => {
                return key.substr(0, self.namespace.length) == self.namespace;
            });

            return Promise.all[self.backend.multiRemove(namespaceKeys), self.saveLRU()]
        })
        .then(() => {
            resolve()
        })
        .catch(e => {
            reject(e)
        })
    })
};

Cache.prototype.getAll = function() {
    var self = this;

    return new Promise((resolve, reject) => {
        this.backend.getAllKeys()
        .then((keys) => {
            let namespaceKeys = keys.filter(key => {
                return key.substr(0, self.namespace.length) == self.namespace;
            });

            return self.backend.multiGet(namespaceKeys)
        })
        .then((values) => {
            var allEntries = {};
            values.forEach(result => {
                var keyComponents = result[0].split(':');

                if (keyComponents.length !== 2) return;

                var key = keyComponents[1];

                if (key === '_lru') return;

                allEntries[key] = JSON.parse(result[1]);
            });

            resolve(allEntries)
        })
        .catch(e => {
            reject(e)
        })
    })
};

Cache.prototype.enforceLimitsLRU = function() {
    let self = this
    if (!this.policy.maxEntries) {
        return;
    }

    let victimCount = Math.max(0, this.lru.length - this.policy.maxEntries)
    let victimList = this.lru.splice(0, victimCount)
    victimList.forEach(function(value, index, array) {
        array[index] = self.makeCompositeKey(value)
    });


    return victimList
}

module.exports = Cache;
