# blueprints-range

## Use

### api/blueprints/find.js

    var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
    var createFind = require('blueprints-range/lib/actions/createFind');
    
    module.exports = createFind(actionUtil);
