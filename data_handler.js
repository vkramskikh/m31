import fs from 'fs';
import path from 'path';

export default function dataHander(dataDir) {
  return function(req, res) {
    res.json(fs.readdirSync(dataDir).reduce((result, file) => {
      let matchData = file.match(/^(.*?)\.json$/);
      if (matchData) {
        let key = matchData[1];
        let fileContent = JSON.parse(fs.readFileSync(path.join(dataDir, file)));
        result[key] = fileContent;
      }
      return result;
    }, {}));
  };
}
