const sqlite3 = require('sqlite3');
let db = {};
let dbApi = {};

dbApi.connect = function(){
    return new Promise(function (resolve) {
        db = new sqlite3.Database('db/miners.sqlite3', function(err) {
            if (err) {
                console.error(err.message);
                resolve(false);
            } else {
                console.log("Connected to database!");
                resolve(true);
            }
        });
    });
};

dbApi.createTables = function(){
    return new Promise(async function (resolve) {
        const isCreated = await createTableMiners();
        resolve(isCreated);
    });
};

function createTableMiners(){
    return new Promise(function (resolve) {
        // user = user identification, total = total hashes, withdrawn = total withdrawn hashes, balace = balance of hashes
        db.run(`CREATE TABLE IF NOT EXISTS miners (user TEXT PRIMARY KEY, total INTEGER, withdrawn INTEGER, balance INTEGER);`, function(err) {
            if (err) {
                console.error(err.message);
                resolve(false);
            } else {
                console.log("Table miners OK!");
                resolve(true);
            }
        });
    });
}

dbApi.loginMiner = function(user){
    // insert one row into the langs table
    db.run(`insert or ignore INTO miners(user, total, withdrawn, balance) VALUES (?, 0, 0, 0);`, user, function(err) {
        if (err) {
            return console.log(err.message);
        }
    });
};

dbApi.addHashes = function(user, amount){
    db.run(`UPDATE miners SET total = total + ? WHERE user = ?;`, amount, user, function(err) {
        if (err) {
            return console.log(err.message);
        } else {
            db.run(`UPDATE miners SET balance = total - withdrawn WHERE user = ?;`, user, function(err) {
                if (err) {
                    return console.log(err.message);
                }
            });
        }
    });
};

dbApi.getBalance = function(user){
    return new Promise(function (resolve) {
        db.get(`SELECT * FROM miners WHERE user = ?`, user, (err, row) => {
            if (err) {
                resolve({s:false, m:err.message});
            } else if(row) {
                resolve({s:true, b:row.balance});
            } else {
                resolve({s:true, b:0});
            }
        });
    });
};

dbApi.withdrawBalance = function(user, amount){
    return new Promise(function (resolve) {
        db.run(`UPDATE miners SET withdrawn = withdrawn + ? WHERE user = ?;`, amount, user, function(err) {
            if (err) {
                return console.log(err.message);
            } else {
                db.run(`UPDATE miners SET balance = total - withdrawn WHERE user = ?;`, user, function(err) {
                    if (err) {
                        resolve({s:false, m:err.message});
                    } else {
                        resolve({s:true});
                    }
                });
            }
        });
    });
};

dbApi.resetBalance = function(user){
    return new Promise(function (resolve) {
        db.run(`UPDATE miners SET total = 0, withdrawn = 0, balance = 0 WHERE user = ?;`, user, function(err) {
            if (err) {
                resolve(err.message);
            } else {
                resolve("Done!");
            }
        });
    });
};

dbApi.addUserAndHashes = function(user, amount){
    return new Promise(function (resolve) {
        db.run(`insert or ignore INTO miners(user, total, withdrawn, balance) VALUES (?, 0, 0, 0);`, user, function(err) {
            if (err) {
                resolve({s:false, m:err.message});
            } else {
                db.run(`UPDATE miners SET total = total + ? WHERE user = ?;`, amount, user, function(err) {
                    if (err) {
                        resolve({s:false, m:err.message});
                    } else {
                        db.run(`UPDATE miners SET balance = total - withdrawn WHERE user = ?;`, user, function(err) {
                            if (err) {
                                resolve({s:false, m:err.message});
                            } else {
                                resolve({s:true});
                            }
                        });
                    }
                });
            }
        });
    });
};


dbApi.close = function() {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        // Now we can kill process
        process.exit();
    });
};



module.exports = dbApi;