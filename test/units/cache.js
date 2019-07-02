var assert = require("assert"),
    Cache = require("../../lib").Cache,
    MemoryStore = require("../../lib").MemoryStore;

var cache = new Cache({
    namespace: "test",
    policy: {
        maxEntries: 1
    },
    backend: MemoryStore
});

var cacheMulti = new Cache({
    namespace: "multi",
    policy: {
        maxEntries: 10
    },
    backend: MemoryStore
})

describe("cache with 1 item", function() {
    it("can set and get entry", function(done) {
        cache.setItem("key1", "value1")
        .then(() => {
            return cache.getItem("key1")
        })
        .then((res) => {
            assert.equal(res, "value1")
            done();
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can get a nonexistant item", function(done) {
        cache.getItem("doesnotexist")
        .then((res) => {
            assert.equal(res, null)
            done()
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can delete entry", function(done) {
        cache.setItem("key1", "value1")
        .then(() => {
            return cache.removeItem("key1")
        })
        .then(() => {
            return cache.getItem("key1")
        })
        .then((res) => {
            assert(!res)
            done()
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("evicts entries in lastAccessed order", function(done) {
        cache.setItem("key1", "value1")
        .then(() => {
            return cache.setItem("key2", "value2")
        })
        .then(() => {
            return cache.getItem("key1")
        })
        .then((res) => {
            assert(!res)

            return cache.getItem("key2")
        })
        .then((res) => {
            assert.equal(res, "value2");
            done()
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can peek at a message", function(done) {
        cache.setItem("key1", "value1")
        .then(() => {
            return cache.peekItem("key1")
        })
        .then((res) => {
            assert.equal(res, "value1");
            done();
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can get all elements", function(done) {
        cache.getAll()
        .then((res) => {
            assert.equal(Object.keys(res).length, 1);
            assert.equal(res["key1"].value, "value1");
            done();
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can add multiple elements at once", function(done) {
        var promiseArray = []
        for (let i = 0; i < 50; i++) {
            promiseArray.push(cache.setItem("key" + i, "value1"))
        }

        Promise.all(promiseArray)
        .then(() => {
            return cache.getAll()
        })
        .then((res) => {
            assert.equal(Object.keys(res).length, 1)
            done()
        })
        .catch(e => {
            console.log(e)
        })
    }) 

    it("can clear all elements", function(done) {
        cache.clearAll()
        .then(() => {
            return cache.getAll()
        })
        .then((res) => {
            assert.equal(Object.keys(res).length, 0)
            done()
        })
        .catch(e => {
            console.log(e)
        })
    });
});

describe("cache with 10 items", function() {
    it("can set and get multiple entries", function(done) {
        cacheMulti.setItem("key1", "value1")
        .then(() => {
            return cacheMulti.setItem("key2", "value2")
        })
        .then(() => {
            return cacheMulti.setItem("key3", "value3")
        })
        .then(() => {
            return cacheMulti.getItem("key1")
        })
        .then((res) => {
            assert.equal(res, "value1")
            return cacheMulti.getItem("key2")
        })
        .then((res) => {
            assert.equal(res, "value2")
            return cacheMulti.getItem("key3")
        })
        .then((res) => {
            assert.equal(res, "value3")
            done()
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can get a nonexistant item", function(done) {
        cacheMulti.getItem("doesnotexist")
        .then((res) => {
            assert.equal(res, null)
            done()
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can delete entry", function(done) {
        cacheMulti.setItem("key1", "value1")
        .then(() => {
            return cacheMulti.removeItem("key1")
        })
        .then(() => {
            return cacheMulti.getItem("key1")
        })
        .then((res) => {
            assert(!res)
            done()
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can peek at a message", function(done) {
        cacheMulti.setItem("key1", "value1")
        .then(() => {
            return cacheMulti.peekItem("key1")
        })
        .then((res) => {
            assert.equal(res, "value1");
            done();
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can get all elements", function(done) {
        cacheMulti.getAll()
        .then((res) => {
            assert.equal(Object.keys(res).length, 3);
            assert.equal(res["key1"].value, "value1");
            done();
        })
        .catch(e => {
            console.log(e)
        })
    });

    it("can add multiple elements at once", function(done) {
        var promiseArray = []
        for (let i = 0; i < 50; i++) {
            promiseArray.push(cacheMulti.setItem("key" + i, "value1"))
        }

        Promise.all(promiseArray)
        .then(() => {
            return cacheMulti.getAll()
        })
        .then((res) => {
            assert.equal(Object.keys(res).length, 10)
            done()
        })
        .catch(e => {
            console.log(e)
        })
    }) 

    it("evicted oldest elements from elements added at once", function(done) {
        cache.getItem("key1")
        .then((res) => {
            assert(!res)
            done()
        })
        .catch(e => {
            console.log(e)
        })
    })

    it("can clear all elements", function(done) {
        cacheMulti.clearAll()
        .then(() => {
            return cacheMulti.getAll()
        })
        .then((res) => {
            assert.equal(Object.keys(res).length, 0)
            done()
        })
        .catch(e => {
            console.log(e)
        })
    });
});

