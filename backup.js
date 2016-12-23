#!/usr/bin/env node

'use strict';

const spawn = require('child_process').spawn;

const args = process.argv.slice(2);

function home() {
  return process.env.HOME || process.env.USERPROFILE || '~';
}

const config = {
  backupPath: home() + '/backup',
  archives: {
    limit: 3
  },
  remote: {
    user: '',
    host: '',
    dir:  ''
  }
};

const dateStr = (function() {
  const now = new Date();

  function numberToString(number, size) {
    let str = '' + number.toString();

    while (str.length < size) {
      str = '0' + str;
    }

    return str;
  }

  const date = numberToString(now.getFullYear(), 4) + numberToString(now.getMonth() + 1, 2) + numberToString(now.getDate(), 2);
  const time = numberToString(now.getHours(), 2) + numberToString(now.getMinutes(), 2) + numberToString(now.getSeconds(), 2);

  return date + '-' + time;
})();

const types = {
  'dev':    home() + '/dev'
};

const methods = {
  'local-sync': (type, path) => {
    return launch('rsync', [
      '-a',
      path,
      config.backupPath
    ]);
  },
  'remote-sync': (type, path) => {
    function startSync() {
      return launch('rsync', [
        '-az',
        path,
        remote(type)
      ]);
    }

    return launch('mkdir', [
      '-p',
      remote(type, false)
    ], true).then(_ => {
      return startSync();
    }).catch(_ => {
      return startSync();
    })
  },
  'local-archive': (type, path) => {
    const dest = config.backupPath + '/archives/';
    const prefix = type + '_';

    return launch('tar', [
      '-C',
      path,
      '-czf',
      dest + prefix + dateStr + '.tar.gz',
      '.'
    ]).then(_ => {
      if (config.archives.limit <= 0)
        return;

      const fs = require('fs');

      fs.readdir(dest, (err, files) => {
        if (err)
          throw err;

        let archives = files.filter((filename) => { // first we get the files for the current type
          return filename.indexOf(prefix) === 0;
        }).sort((first, second) => { // next we sort them by creation date
          let a = fs.statSync(dest + first), b = fs.statSync(dest + second);

          if (a.mtime > b.mtime)
            return 1;
          else if (b.mtime > a.mtime)
            return -1;
          else
            return 0;
        });

        if (archives.length < config.archives.limit)
          return;

        archives.slice(0, -1 * config.archives.limit) // just take all but last items
          .forEach((filename) => { // and ... delete them
            fs.unlink(dest + filename, (err) => {
              if (err)
                console.error('Failed to delete an archive: ' + dest + filename);
            });
          });
      });
    });
  }
};

function exit(reason, level) {
  if (level === undefined || level === null || level === false)
    level = 1;
  else if (level === true)
    level = 0;

  if (level !== 0)
    console.error(reason);
  else
    console.log(reason);

  process.exit(level);
}

if (args.length <= 0) {
  console.log('Directories');
  for (let type in types) {
    console.log('  ' + type + ' - ' + types[type])
  }
  console.log('');

  console.log('Methods');
  for (let method in methods) {
    console.log('  --' + method)
  }
  console.log('');

  exit('Give at least one directory and one method', 0);
}

function remote(dir, prefix) {
  if (prefix === undefined || prefix === null)
    prefix = true;

  let remote = '';

  if (prefix) {
    if ('user' in config.remote)
      remote += config.remote.user + '@';

    remote += config.remote.host;
  }

  if (!!dir) {
    if (prefix)
      remote += ':';

    if (typeof config.remote !== 'string') {
      if ('dir' in config.remote)
        remote += config.remote.dir;
      else if ('user' in config.remote)
        remote += '/home/' + config.remote.user;
    } else {
      remote += '~';
    }

    remote += '/' + dir;
  }

  return remote;
}

function launch(command, args, distant) {
  if (!args)
    args = [];

  if (distant === true) {
    let realCommand = command + ' ' + args.join(' ');
    command = 'ssh';

    args = [];

    if ('port' in config.remote) {
      args.push('-p');
      args.push(config.remote.port.toString());
    }

    args.push(remote());
    args.push(realCommand);
  }

  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let stderr = '', stdout = '';

    process.on('close', (code) => {
      if (code === 0)
        resolve(stdout);
      else
        reject(stderr);
    });

    process.stderr.on('data', (data) => {
      stderr += data;
    });

    process.stdout.on('data', (data) => {
      stdout += data;
    });
  });
}

const notifications = {
  all:     0,
  cli:     1,
  desktop: 2,
  file:    4,
};

function notify(title, content, outputs) {
  if (outputs === undefined || outputs === null)
    outputs = notifications.all;

  if (outputs === notifications.all || (outputs & notifications.cli) === notifications.cli)
    console.log(title, content);

  if (outputs === notifications.all || (outputs & notifications.desktop) === notifications.desktop)
    launch('notify-send', [ title, content ]);
}

function startMethod(type, path, method) {
  const run = methods[method];
  notify('Start ' + type + ' backup', 'Method: ' + method, notifications.cli);

  if (typeof path === 'string') {
    run(type, path).then((stdout) => {
      notify('Succeded ' + type + ' backup', 'Method: ' + method);
    }).catch((stderr) => {
      notify('Failed ' + type + ' backup', 'Method: ' + method);
      console.error(stderr);
    });
  } else {
    const total = path.length;
    let failed = [], success = [], finished = function(path, result) {
      if (result)
        success.push(path);
      else
        failed.push(path);

      if (failed.length + success.length === total) {
        if (success.length > 0)
          notify('Succeded ' + type + ' backup', 'Method: ' + method + ', files: ' + success.join(', '));

        if (failed.length > 0)
          notify('Failed ' + type + ' backup', 'Method: ' + method + ', files: ' + failed.join(', '));
      }
    };

    for (let i in path) {
      run(type, path[i]).then((stdout) => {
        finished(path[i], true);
      }).catch((stderr) => {
        finished(path[i], false);
        console.error(stderr);
      });
    }
  }
}

for (let type in types) {
  if (args.indexOf(type) >= 0) {
    const path = types[type];

    for (let method in methods) {
      if (args.indexOf('--' + method) >= 0){
        startMethod(type, path, method);
      }
    }
  }
}
