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
 *               
 * 
 */
var express = require('express');
var router = express.Router();
var request = require('request');
var SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
var fs = require('fs');
var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var upload = multer({ dest: 'uploads/' })

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

var aibril_username = config.aibril.username;
var aibril_password = config.aibril.password;
var aibril_url = config.aibril.url;

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
    console.debug('kyubeom:', languageModels)
    // 404 코드 Return
    if (res.statusCode == 404) return res.status(404).send({ message: JSON.parse(body).message });
    
    // 정상 조회 완료 시
    let result = JSON.stringify(languageModels, null, 2);
    body = JSON.parse(result);
    console.debug(result);

    // 조회 완료 시, 200 코드 Return
    res.status(200).send(body);
  })
  .catch(err => {
    console.log('error:', err);
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
 *         description:
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
 *       409:
 *         description:
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
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
    console.debug(result);

    // 조회 완료 시, 200 코드 Return
    res.status(200).send(body);
  })
  .catch(err => {
  console.log('error:', err);
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
 *       - in: "query"
 *         name: "username"
 *         description: 
 *         required: true
 *       - in: "query"
 *         name: "password"
 *         description: 
 *         required: true
 *       - in: "query"
 *         name: "customization_id"
 *         description: 
 *         required: true
 *       - in: "formData"
 *         name: "body"
 *         description: 
 *         required: true
 *         type: file
 *     responses:
 *       200:
 *         description: 음성 인식 성공
 *         schema:
 *           type: object
 *           description: Custom model ID
 *       400:
 *         description:
 *         schema:
 *           $ref: '#/definitions/ErrorMessage'
 *       409:
 *         description:
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
    console.log('error:', err);
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
  console.log(req.body.videofile)
  var speechToText = new SpeechToTextV1({
    username: req.query.username,
    password: req.query.password,
    // username: req.body.username,
    // password: req.body.password,
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

// Add Corpora & Training
/**
 * @swagger
 * /vedio:
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

/* Export */
router.get('/export', function(req, res, next) {
  // Add Corpus : /customizations/{customization_id}/corpora/corpus1
  const addCorpusParams = {
    customization_id: '{customization_id}',
    corpus_file: fs.createReadStream('./corpus1.txt'),
    corpus_name: 'corpus1',
  };
  
  speechToText.addCorpus(addCorpusParams)
    .then(result => {
      // Poll for corpus status.
    })
    .catch(err => {
      console.log('error:', err);
    });

  // Training Language Model - POST /v1/customizations/{customization_id}/train
    const trainLanguageModelParams = {
      customization_id: '{customization_id}',
    };
  
    speechToText.trainLanguageModel(trainLanguageModelParams)
    .then(result => {
      // Poll for language model status.
     })
    .catch(err => {
      console.log('error:', err);
    });
});

module.exports = router;