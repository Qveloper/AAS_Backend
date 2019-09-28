// AAS API List
/**
 * @swagger
 * tags:
 *   name: AAS
 *   description: [Custom Model]
 * definitions:
 *   ErrorMessage:
 *     type: object
 *     properties:
 *       message:
 *         type: string
 *         description: 에러 메시지
 *   CustomModel:
 *     type: object
 *     properties:
 *       customization_id:
 *         type: string
 *         description: 
 *       created:
 *         type: string
 *         description: 
 *       updated:
 *         type: string
 *         description:
 *       language:
 *         type: string
 *         description:
 *       dialect:
 *         type: string
 *         description:
 *       versions:
 *         type: array
 *         description:
 *         items:
 *           type: string
 *       owner:
 *         type: string
 *         description:
 *       name:
 *         type: string
 *         description:
 *       description:
 *         type: string
 *         description:
 *       base_model_name:
 *         type: string
 *         description:
 *       status:
 *         type: string
 *         description:
 *       progress:
 *         type: number
 *         description:
 *       error:
 *         type: string
 *         description: 
 *       warning:
 *         type: string
 *         description: 
 *   Corpus:
 *     type: object
 *     properties:
 *       customization_id:
 *         type: string
 *         description:
 *       corpus_name:
 *         type: number
 *         description:
 *       corpus_file:
 *         type: number
 *         description:
 *       allow_overwrite:
 *         type: boolean
 *         description:
 *   RecognizeResult:
 *     type: object
 *     properties:
 *       result_index:
 *         type: integer
 *         format: int32
 *       results:
 *         type: array
 *         description: 인식 결과 배열
 *         items:
 *           type: object
 *           properties:
 *             alternatives:
 *               type: array
 *               description: 변환 결과 배열
 *               items:
 *                 type: object
 *                 properties:
 *                   confidence:
 *                     type: number
 *                     format: float
 *                   timestamps:
 *                     type: array
 *                     items:
 *                       type: array
 *                       items:
 *                         type: string
 *                   transcript:
 *                     type: string
 *             final:
 *               type: boolean
 *   Subtitles:
 *     type: array
 *     descriptotion: 자막 객체를 담은 배열
 *     items:
 *       type: object
 *       properties:
 *         start:
 *           type: number
 *           format: float
 *         end:
 *           type: number
 *           format: float
 *         text:
 *           type: string
 */
var express = require('express');
var router = express.Router();
var request = require('request');
var SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
var fs = require('fs');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
const { stringify } = require('subtitle') // Build srt
var upload = multer({ dest: 'uploads/' })

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const xmlBuilder = require('../modules/xmlBuilder.js')
const txtBuilder = require('../modules/txtBuilder.js')

var aibril_username = config.aibril.username;
var aibril_password = config.aibril.password;
var aibril_url = config.aibril.url;

function sec2time (timeInSeconds) {
  var pad = function(num, size) { return ('000' + num).slice(size * -1); },
  time = parseFloat(timeInSeconds).toFixed(3),
  hours = Math.floor(time / 60 / 60),
  minutes = Math.floor(time / 60) % 60,
  seconds = Math.floor(time - minutes * 60),
  milliseconds = time.slice(-3);

  return pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2) + ',' + pad(milliseconds, 3);
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// login
/**
 * @swagger
 * /customizations:
 *   get:
 *     summary: Custom Model 조회 (Login)
 *     tags: [AAS]
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - in: "query"
 *         name: "username"
 *         description: 
 *         required: true
 *       - in: "query"
 *         name: "password"
 *         description: 
 *         required: true
 *     responses:
 *       200:
 *         description: Custom Model List가 성공적으로 조회 되었을 때
 *         schema:
 *           type: object
 *           properties:
 *             customizations:
 *               type: array
 *               description: Custom Model list
 *               items: 
 *                 $ref: '#/definitions/CustomModel'
 *       401:
 *         description: Credential 인증 실패 시
 */

/* Get custom models (Log in) */
router.get('/customizations', function (req, res, next) {
  let speechToText = new SpeechToTextV1({
    username: req.query.username,
    password: req.query.password,
    url: aibril_url
  });
  let body;

  // List Custom Model(LM) - GET /v1/customizations
  speechToText.listLanguageModels()
  .then(languageModels => {
    // 정상 조회 완료 시
    let result = JSON.stringify(languageModels, null, 2);
    body = JSON.parse(result);

    // 조회 완료 시, 200 코드 Return
    res.status(200).send(body);
  })
  .catch(err => {
    // 401 코드 Return
    if (err.code == 401) return res.status(401).send({ message: err.error });
  });
});
      
// Create Custom Model
/**
 * @swagger
 * /customizations:
 *   post:
 *     summary: Custom Model 추가 
 *     tags: [AAS]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: 
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *             name:
 *               type: string
 *             base_model_name:
 *               type: string
 *             description:
 *               type: string
 *     responses:
 *       201:
 *         description: Custom Model 추가 성공
 *         schema:
 *           type: object
 *           properties: 
 *             customization_id:
 *               type: string
 *               description: Custom model ID
 *       400:
 *         description: 필수 parameter 누락시 (name, base_model_id)
 *       401:
 *         description: Credential 인증 실패 시
 */
router.post('/customizations', function(req, res, next) {
  var body;
  var speechToText = new SpeechToTextV1({
    username: req.body.username,
    password: req.body.password,
    url: aibril_url
  });
  // Create Custom Model (LM) - POST /v1/customizations
  const createLanguageModelParams = {
    name: req.body.name,
    base_model_name: req.body.base_model_name,
    description: req.body.description,
  };
  speechToText.createLanguageModel(createLanguageModelParams)
  .then(languageModel => {
    var result = JSON.stringify(languageModel, null, 2);
    body = JSON.parse(result);

    // 조회 완료 시, 201 코드 Return
    res.status(201).send(body);
  })
  .catch(err => {
    // 401 코드 Return
    if (err.code == 401) return res.status(401).send({ message: err.error });
    // 400 코드 Return
    else return res.status(400).send({ message: err });
  });
});

// Delete Custom Model
/**
 * @swagger
 * /customizations:
 *   delete:
 *     summary: Custom Model 삭제
 *     tags: [AAS]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: 
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *             customization_id:
 *               type: string
 *     responses:
 *       200:
 *         description: Custom model 삭제 성공
 *         schema:
 *           type: object
 *           description: Custom model ID
 *       400:
 *         description: Bad Request. The specified customization ID is invalid
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
 *       401:
 *         description: Unauthorized
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
 */
router.delete('/customizations', function (req, res) {
  var speechToText = new SpeechToTextV1({
    username: req.body.username,
    password: req.body.password,
    url: aibril_url
  });
  // Delete Custom Model (LM) - Delete /v1/customizations
  const deleteLanguageModelParams = {
    customization_id: req.body.customization_id,
  };
  
  speechToText.deleteLanguageModel(deleteLanguageModelParams)
  .then(result => {
    // 삭제 완료 시, 200 코드 Return
    res.status(200).send(result);
  })
  .catch(err => {
    // 400 코드 Return
    if (err.code == 400) return res.status(400).send({ message: err.message });
    // 401 코드 Return
    if (err.code == 401) return res.status(401).send({ message: err.message });
  });
});

// Recognize Audio
/**
 * @swagger
 * /recognize:
 *   post:
 *     summary: Audio Recognize
 *     tags: [AAS]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: 
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *             name:
 *               type: string
 *             base_model_name:
 *               type: string
 *             description:
 *               type: string
 *     responses:
 *       201:
 *         description: Custom Model 추가 성공
 *         schema:
 *           $ref: '#/definitions/RecognizeResult'
 *       400:
 *         description:
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
 *       409:
 *         description:
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
 */
router.post('/recognize', upload.single('videofile'), function(req, res, next) {
  var speechToText = new SpeechToTextV1({
    username: req.query.username,
    password: req.query.password,
    url: aibril_url
  });

  // Recognize Audio - POST /v1/recognize
  const recognizeParams = {
    audio: fs.createReadStream('uploads/' + req.file.filename),
    model: 'ko-KR_BroadbandModel',
    inactivity_timeout: -1,
    language_customization_id: req.query.customization_id,
    timestamps: true,
    content_type: 'audio/mp3',
  };
  
  speechToText.recognize(recognizeParams)
    .then(speechRecognitionResults => {
      // 조회 완료 시, 200 코드 Return
      res.status(200).send(speechRecognitionResults);
    })
    .catch(err => {
      console.log('error:', err);
    });
});

/* Export */
/**
 * @swagger
 * /export:
 *   post:
 *     summary: Premiere Pro CC 용 .xmeml 파일 생성
 *     tags: [AAS]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: srt 변환을 위한 Object
 *         required: true
 *         schema:
 *           $ref: '#/definitions/Subtitles'
 *     responses:
 *       200:
 *         description: .xml 파일 변환 성공
 *         schema:
 *           type: file
 *       400:
 *         description: Parameter가 잘못 되었을 경우
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
 */
router.post('/export', function(req, res, next) {
  let speechToText = new SpeechToTextV1({
    username: req.body.username,
    password: req.body.password,
    url: aibril_url
  });

  // srtBuilder의 포맷으로 전달 된 요청의 body
  let subtitles = req.body.subtitles;

  // txt파일 생성
  txtBuilder.build(subtitles)

  subtitles.forEach(element => {
    // STT Result 내 sec(소수)를 hh:mm:ss,ms(srt 포맷)으로 변환
    element.start = sec2time(element.start)
    element.end = sec2time(element.end)
  });

  // srt로 변환 (string) 
  const srt = stringify(subtitles);
  const result = xmlBuilder.build(srt);

  // Custom 영역 추후 개발
  const addCorpusParams = {
    customization_id: req.body.customization_id,
    corpus_file: fs.createReadStream(txtBuilder.getFileName()),
    corpus_name: req.body.fileName + '_' + new Date().toISOString(),
  };
  
  speechToText.addCorpus(addCorpusParams)
    .then(result => {
      // Poll for corpus status.
      // txtBuilder.delete();
    })
    .catch(err => {
      // 400 코드 Return
      if (err.code == 400) return res.status(400).send({ message: err.message });
      console.log('error:', err);
      // txtBuilder.delete();
    });

  res.setHeader('Content-disposition', 'attachment; filename=' + new Date().toISOString() + ".xml");
  res.setHeader('Content-type', 'application/xml');
  res.send(result);


  // // Training Language Model - POST /v1/customizations/{customization_id}/train
  //   const trainLanguageModelParams = {
  //     customization_id: '{customization_id}',
  //   };
  
  //   speechToText.trainLanguageModel(trainLanguageModelParams)
  //   .then(result => {
  //     // Poll for language model status.
  //    })
  //   .catch(err => {
  //     console.log('error:', err);
  //   });

});

// Add Corpora & Training
/**
 * @swagger
 * /video:
 *   post:
 *     summary: Corpora 추가 및 Training
 *     tags: [AAS]
 *     consumes:
 *       - "application/json"
 *     produces:
 *       - "application/json"
 *     parameters:
 *       - in: "body"
 *         name: "body"
 *         description: 
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *             file:
 *               type: string
 *     responses:
 *       201:
 *         description: Custom Model 추가 성공
 *         schema:
 *           type: object
 *           properties: 
 *             customization_id:
 *               type: string
 *               description: Custom model ID
 *       400:
 *         description:
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
 *       409:
 *         description:
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
 */
/* Recognize Video */
router.get('/video', function(req, res, next) {
  // Recognize Audio - URI /v1/recognize
  var speechToText = new SpeechToTextV1({
    username: req.body.username,
    password: req.body.password,
    url: aibril_url
  });
  var params = {
    // From file
    audio: fs.createReadStream('./resources/speech.wav'),
    content_type: 'audio/l16; rate=44100'
  };
  speechToText.recognize(params)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(err => {
      console.log(err);
    });
  
  // or streaming
  fs.createReadStream('./resources/speech.wav')
    .pipe(speechToText.recognizeUsingWebSocket({ content_type: 'audio/l16; rate=44100' }))
    .pipe(fs.createWriteStream('./transcription.txt'));
});

module.exports = router;