#!/usr/bin/env node
var cp = require('child_process');

var inquirer = require('inquirer');

var exec = function(cmd) {
  return new Promise(function(resolve, reject) {
    cp.exec(cmd, function(err, stdout, stderr) {
      if (err) {
        reject(err);
      } else {
        resolve(stdout, stderr);
      }
    });
  });
};

var getBranches = function () {
  return exec('git branch')
  .then(function(stdout) {
    var current;
    var branches = [];
    var lines = stdout.trim().split('\n');
    for (i=0; i<lines.length; ++i) {
      var line = lines[i].trim();
      if (line.startsWith('* ')) {
        current = line.substr(2);
      } else if (line) {
        branches.push(line);
      }
    }
    return {current: current, branches: branches};
  });
};

var deleteBranch = function (branch) {
  return exec('git branch -D ' + branch);
};

var confirm = {
  type: 'confirm',
  message: 'Confirm delete branches?',
  name: 'confirmed',
  default: false,
  when: function (answers) {
    return answers.branches.length > 0;
  },
};

getBranches()
.then(function(result) {
  var choices = result.branches.map(function(branch) {
    return {name: branch};
  });
  if (choices.length === 0) {
    console.log('No local deletable branches.');
  } else {
    inquirer.prompt([
      {
        type: 'checkbox',
        message: 'Branches to delete:',
        name: 'branches',
        choices: choices,
      },
      confirm
    ]).then(function (answers) {
      if (answers.confirmed) {
        return Promise.all(answers.branches.map(function(branch) {
          return deleteBranch(branch);
        }));
      }
    });
  }
})
.catch(function(error) {
  console.log('Unable to list git branches.')
  process.exit(1);
});
