var fs = require('fs');
var path = require('path');
module.exports = function(app){
    fs.readdirSync(__dirname).forEach(function(folder) {
      var folder = folder;
      if (folder == "index.js") return;
      fs.readdirSync(__dirname+'/'+folder).forEach(function(file) {
        var name = file.substr(0, file.indexOf('.'));
        require('./' + folder+'/'+name)(app);
      });
    });
    //console.log(__dirname);
    var dir = __dirname.substring(0, __dirname.length - 11);
    //console.log(dir);
    // Defaults for sending non valid routes to index.html
    // Add catch routes to redirect to index.html
    //console.log('Initialized Routes');
}
