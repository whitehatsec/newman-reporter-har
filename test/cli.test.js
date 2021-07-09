const fs = require('fs'),
      path = require('path'),
      shell = require('shelljs'),
      validate = require('har-validator');
const { exec } = require("child_process");

describe('Newman CLI', () => {
  const outFile = 'out/newman-report.har',
        newman = 'node ./.temp/node_modules/newman/bin/newman.js';

  beforeEach(done => {
    var tempDir = path.join(__dirname, '..', '.temp');

    fs.stat(tempDir, err => {
      if (err) {
        fs.existsSync(tempDir) && shell.rm('-rf', tempDir);
        fs.mkdirSync(tempDir);

        var newmanPkg = shell.exec('npm pack ../node_modules/newman', { cwd: tempDir, silent: true }).stdout.trim();
        var reporterPkg = shell.exec('npm pack ../', { cwd: tempDir, silent: true }).stdout.trim();
        shell.exec(`npm i --prefix . ${newmanPkg}`, { cwd: tempDir, silent: true });
        shell.exec(`npm i --prefix . ${reporterPkg}`, { cwd: tempDir, silent: true });
      }
    });

    fs.stat('out', err => {
      if (err) {
        return fs.mkdir('out', done);
      }

      done();
    });
  });

  afterEach(done => {
    fs.stat(outFile, err => {
      if (err) {
        return done();
      }

      fs.unlink(outFile, done);
    });
  });

  test('generate successful har', done => {
    exec(`${newman} run test/fixtures/jsonplaceholder-get-posts-1.postman_collection.json -r har --reporter-har-export ${outFile}`, code => {
      fs.stat(outFile, () => {
        done();
      });
      expect(code).toBeFalsy();

      var res;

      new Promise((resolve, reject) => {
        fs.readFile(outFile, (err, data) => {
          if (err === null) {
            res = data;
            resolve(data);
          } else {
            reject(err);
          }
        })
      })
      .then((data) => {
        var obj = JSON.parse(data);
        expect(obj.log.entries[0].request.headers.some(e => e['name'] === 'X-Extra')).toBeFalsy();
        resolve(obj);
      }).then(validate.har)
      .then(data => expect(data).toEqual(res))
      .catch(error => console.error);
    });
  });
})
