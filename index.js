#!/usr/bin/env node
var cp = require('child_process');

var inquirer = require('inquirer');

var show = function(cmd, args) {
  return new Promise(function(resolve, reject) {
    cp.spawn(cmd, args, {stdio:'inherit'})
    .on('exit', function (error) {
      if(error){
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

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
  return exec('git branch -D "' + branch + '"');
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

var COMMIT_ALL = 'Commit All';
var CHANGE_BRANCH = 'Change Branch';
var DELETE_BRANCHES = 'Delete Branches';
var DELETE_UNTRACKED = 'Delete Untracked Files';
var EXIT = 'Exit';

var asChoices = function (names) {
  return names.map(function(name){
    return {name};
  });
}

var changeBranch = function (branches) {
    inquirer.prompt([{
        type: 'list',
        message: 'Change to branch:',
        name: 'branch',
        choices: asChoices(branches),
      }
    ]).then(function (answers) {
      exec('git checkout "' + answers.branch  +'"')
    });
};

var showStatus = function () {
  return show('git', ['status', '-sb']);
};

var commitAll = function () {
  exec('git add --all').then(function(){
    showStatus().then(function() {
      inquirer.prompt([{
          message: 'Commit Message:',
          name: 'message'
        }
      ]).then(function (answers) {
        if (answers.message) {
          exec('git commit -m "' + answers.message + '"')
        } else {
          console.log('Changed not commited.')
        }
      });
    });
  });
}

var deleteBranches = function (branches) {
    inquirer.prompt([
      {
        type: 'checkbox',
        message: 'Branches to delete:',
        name: 'branches',
        choices: asChoices(branches),
      },
      confirm
    ]).then(function (answers) {
      if (answers.confirmed) {
        return Promise.all(answers.branches.map(deleteBranch));
      }
    });
}

var deleteFile = function(file) {
  return exec('rm "' + file + '"');
};

var listUntrackedFiles = function() {
  return exec('git ls-files --others --exclude-standard').then(function(out) {
    var trimmed = out ? out.trim() : '';
    return trimmed ? trimmed.split('\n') : [];
  });
};

var deleteUntracked = function(untrackedFiles) {
  inquirer.prompt([
    {
      type: 'confirm',
      message: 'Delete ' + untrackedFiles.length + ' untracked files?',
      name: 'confirmed',
      default: false,
    }
  ]).then(function (answers) {
    if (answers.confirmed) {
      return Promise.all(untrackedFiles.map(deleteFile));
    }
  });
};

var runCommand = function (branches, current, untrackedFiles) {
  return function (option) {
    switch(option.command) {
      case CHANGE_BRANCH:
        changeBranch([current].concat(branches));
        break;
      case COMMIT_ALL:
        commitAll();
        break;
      case DELETE_BRANCHES:
        deleteBranches(branches);
        break;
      case DELETE_UNTRACKED:
        deleteUntracked(untrackedFiles);
        break;
      case EXIT:
        showStatus();
      default:
        break;
      }
    };
};

getBranches()
.then(function(result) {
  listUntrackedFiles().then(function(untrackedFiles) {
    const commands = [{name: EXIT}];
    if (result.branches.length) {
      commands.push({name: CHANGE_BRANCH});
      commands.push({name: DELETE_BRANCHES});
    }
    if (untrackedFiles.length>0) {
      commands.push({name: DELETE_UNTRACKED});
    }
    commands.push({name: COMMIT_ALL});

    inquirer.prompt([{
      type: 'list',
      message: 'What would you like to do?',
      name: 'command',
      choices: commands,
    }]).then(runCommand(result.branches, result.current, untrackedFiles));
  });
})
.catch(function(error) {
  console.log('Unable to list git branches.')
  process.exit(1);
});
