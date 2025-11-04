const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Path Traversal
app.get('/read', (req, res) => {
  const file = req.query.file;
  if (!file || typeof file !== 'string') return res.status(400).send('Invalid file');
  const fullPath = path.resolve(__dirname, file);
  // Ensure the resolved path is inside the application directory
  if (!fullPath.startsWith(__dirname + path.sep) && fullPath !== __dirname) return res.status(400).send('Invalid file path');

  // Prefer O_NOFOLLOW to avoid following symlinks at open time (mitigates TOCTOU symlink swap).
  // If O_NOFOLLOW isn't available on the platform, fall back to lstat-based check and reject symlinks.
  const hasONoFollow = fs.constants && (typeof fs.constants.O_NOFOLLOW !== 'undefined');
  const openFlags = hasONoFollow ? (fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW) : fs.constants.O_RDONLY;

  const finishWithFd = (fd) => {
    fs.readFile(fd, 'utf8', (err, data) => {
      fs.close(fd, () => {});
      if (err) {
        console.error(err);
        return res.status(500).send('Unable to read file');
      }
      res.send(data);
    });
  };

  if (hasONoFollow) {
    fs.open(fullPath, openFlags, (err, fd) => {
      if (err) {
        console.error(err);
        return res.status(400).send('Invalid file path');
      }
      finishWithFd(fd);
    });
  } else {
    // Fallback: reject if the path is a symlink (reduces TOCTOU window on platforms without O_NOFOLLOW)
    fs.lstat(fullPath, (err, stats) => {
      if (err) {
        console.error(err);
        return res.status(400).send('Invalid file path');
      }
      if (stats.isSymbolicLink()) return res.status(400).send('Invalid file path');
      fs.open(fullPath, openFlags, (err, fd) => {
        if (err) {
          console.error(err);
          return res.status(400).send('Invalid file path');
        }
        finishWithFd(fd);
      });
    });
  }
});

app.listen(3001, () => console.log('Disk vuln on port 3001'));
