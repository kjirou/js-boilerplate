import assert from 'assert';
import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import webdriver, { until } from 'selenium-webdriver';


const PUBLIC_DIST_ROOT = path.join(__dirname, '../public/dist');
const APP_JS_FILE_PATH = path.join(PUBLIC_DIST_ROOT, 'app.js');
const APP_CSS_FILE_PATH = path.join(PUBLIC_DIST_ROOT, 'app.css');


export const buildDriver = () => {
  const driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();
  return driver.manage().window().setSize(1024, 768)
    .then(() => webdriver.promise.fulfilled(driver));
};

export const deleteDistDir = (callback) => {
  rimraf(PUBLIC_DIST_ROOT, callback);
};


describe('self inspection', () => {

  //let driver;

  //before(done => {
  //  buildDriver()
  //    .then(newDriver => {
  //      driver = newDriver;
  //      done();
  //    }, err => done(err));
  //});

  //after(done => {
  //  driver.quit()
  //    .then(() => done(), err => done(err));
  //});

  beforeEach(done => {
    deleteDistDir(done);
  });


  describe('build tasks', () => {

    it('js', done => {
      childProcess.exec('gulp build:js', (err, stdout, stderr) => {
        if (err) {
          return done(err);
        }
        fs.stat(APP_JS_FILE_PATH, err => {
          if (err) {
            return done(err);
          }
          done();
        })
      });
    });

    it('css', done => {
      childProcess.exec('gulp build:css', (err, stdout, stderr) => {
        if (err) {
          return done(err);
        }
        fs.stat(APP_CSS_FILE_PATH, err => {
          if (err) {
            return done(err);
          }
          done();
        })
      });
    });
  });


  describe('tests', () => {

    it('normal unit test', done => {
      childProcess.exec('mocha test/components.js', (err, stdout, stderr) => {
        if (err) {
          return done(err);
        }
        assert(!/failing/.test(stdout));
        done();
      });
    });

    it('should be applied power-assert', done => {
      childProcess.exec('mocha test/power-assert.js', (err, stdout, stderr) => {
        if (!err) {
          return done(new Error('Error did not occur'));
        }
        assert('assert.deepEqual(actual, expected)'.indexOf(stdout) !== -1);
        assert('Object{foo:1,bar:#Array#}'.indexOf(stdout) !== -1);
        assert('Object{foo:1,bar:#Array#}'.indexOf(stdout) !== -1);
        done();
      });
    });
  });
});
