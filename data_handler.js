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
        res.write('{');
        res.write(dataFiles.map(({fileName, key}) => {
          const fileContent = fs.readFileSync(fileName);
          return JSON.stringify(key) + ':' + fileContent;
        }, []).join(','));
        res.write('}');
        res.end();
      } else {
        res.status(500).send('Failed to read data directory');
      }
    });
  };
}
