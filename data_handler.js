import fs from 'fs';
import path from 'path';

export default function dataHander(dataDir) {
  return function(req, res) {
    fs.readdir(dataDir, (err, fileNames) => {
      if (!err) {
        res.set('Content-Type', 'application/json');
        const dataFiles = fileNames.reduce((result, fileName) => {
          const matchData = fileName.match(/^(.*?)\.json$/);
          if (matchData) {
            result.push({
              fileName: path.join(dataDir, fileName),
              key: matchData[1]
            });
          }
          return result;
        }, []);
        let filesSent = 0;
        res.write('{');
        dataFiles.forEach(({fileName, key}) => {
          fs.readFile(fileName, (err, fileContent) => {
            if (!err) {
              if (filesSent) res.write(',');
              res.write(JSON.stringify(key) + ':' + fileContent);
            }
            filesSent++;
            if (filesSent === dataFiles.length) {
              res.write('}');
              res.end();
            }
          });
        });
      } else {
        res.status(500).send('Failed to read data directory');
      }
    });
  };
}
