import fs from 'fs';
import path from 'path';

export default function dataHander(dataDir) {
  return function(req, res) {
    fs.readdir(dataDir, (err, files) => {
      if (!err) {
        const responseBody = '{' + files.reduce((result, file) => {
          const matchData = file.match(/^(.*?)\.json$/);
          if (matchData) {
            const key = matchData[1];
            const fileContent = fs.readFileSync(path.join(dataDir, file));
            result.push(JSON.stringify(key) + ':' + fileContent);
          }
          return result;
        }, []).join(',') + '}';
        res.set('Content-Type', 'application/json').send(responseBody);
      } else {
        res.status(500).send('Failed to read data directory');
      }
    });
  };
}
