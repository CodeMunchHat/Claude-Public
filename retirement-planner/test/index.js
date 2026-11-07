// Entry point so `node --test test/` works on Node 22+, where a directory argument is resolved as a module.
['regression', 'debt', 'goals', 'tax', 'plan'].forEach((n) => require('./' + n + '.test.js'));
