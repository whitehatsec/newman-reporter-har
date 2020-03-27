const fs = require('fs'),
      path = require('path'),
      shell = require('shelljs'),
      outFile = 'out/newman-report.har';

describe('Newman Library', () => {

  beforeEach(done => {
    var tempDir = path.join(__dirname, '..', '.temp');

    fs.stat(tempDir, err => {
      if (err) {
        fs.existsSync(tempDir) && shell.rm('-rf', tempDir);
        fs.mkdirSync(tempDir);

        var reporterPkg = shell.exec('npm pack ../', { cwd: tempDir, silent: true }).stdout.trim();
        shell.exec(`npm i --prefix . ${reporterPkg}`, { cwd: tempDir, silent: true });
      }
    });

    global.newman = require(path.join(__dirname, '..', 'node_modules', 'newman'));

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

  test('generate successful har via newman library', done => {
    newman.run({
      collection: 'test/fixtures/jsonplaceholder-get-posts-1.postman_collection.json',
      reporters: ['har'],
      reporter: { har: { export: outFile } }
    }, function (err, summary) {
      if (err) { return done(err); }

      expect(summary.collection.name).toEqual('jsonplaceholder');
      expect(summary.run.stats.iterations.total).toEqual(1);
      fs.stat(outFile, done);
    });
  });
})
