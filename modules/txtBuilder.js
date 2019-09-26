// 사용자가 Export XML 기능을 실행했을 때, request의 xml 변환용 데이터를 사용한다.
const tmp = require('tmp');
const fs = require('fs');
const os = require('os');

let tmpFile;

let txtBuilder = {
  build: (subArray) => {
    tmpFile = tmp.fileSync({keep: true});
    console.debug(tmpFile.name);
    let txt = "";

    subArray.forEach((element) => {
      txt += element.text + os.EOL;
    });

    fs.writeFile(tmpFile.name, txt, (err) => {
      if (err) {
        console.debug('error: ', err)
      }
    });
  },
  delete: () => {
    tmpFile.removeCallback();
  }
}

module.exports = txtBuilder;