var ffmpeg = require('fluent-ffmpeg');
var command = ffmpeg();

// Example Code
let file = 'path/to/vedioFile.mp4';
let convert = 'convertedFile.mp3';

ffmpeg(file, convert)
    .videoCodec('') // Video Codec 
    .format('')     // 변경하고자 하는 format
    .on('error', err => {  // 변경 도중 오류 발생시
        console.log('[ffmpeg] Error Occured: ' + err.message);
    }).on('end', () => {  // 변경 완료시
        console.log('[ffmpeg] Processing Finished.')
    }).save(convert);

module.exports = vedioToAudio;