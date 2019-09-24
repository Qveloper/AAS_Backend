const app = require('../app');
const request = require('supertest');
const should = require('should');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const testCredential = config.aibril;
let testCustomModel = {};

console.debug("Test ENV: " + process.env.NODE_ENV);
describe('index.js', () => {
  // Customizations 관련 API Test Case
  // Customizations 생성
  describe('POST /customizations 는', () => {
    describe('성공시', () => {
      it('customization_id를 반환한다.', (done) => {
        request(app)
          .post('/customizations')
          .send({ 
            username: testCredential.username, 
            password: testCredential.password, 
            name: "test", 
            base_model_name: "ko-KR_BroadbandModel",
            description: "for Test"
          })
          .expect(201)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              body = JSON.parse(res.text);
              body.should.have.property('customization_id');
              testCustomModel.customization_id = body.customization_id;
              done();
            }
          });
      });
    });
    describe('실패시', () => {
      it('name 누락 시, 400 에러를 반환한다.', (done) => {
        request(app)
          .post('/customizations')
          .send({ 
            username: testCredential.username, 
            password: testCredential.password, 
            name: "", 
            base_model_name: "ko-KR_BroadbandModel",
            description: "for Test"
          })
          .expect(400)
          .end(done);
      });
      it('base_model_name 누락 시, 400 에러를 반환한다.', (done) => {
        request(app)
          .post('/customizations')
          .send({ 
            username: testCredential.username, 
            password: testCredential.password, 
            name: "test", 
            base_model_name: "",
            description: "for Test"
          })
          .expect(400)
          .end(done);
      });
      it('인증 실패 시, 401 에러를 반환한다.', (done) => {
        request(app)
          .post('/customizations')
          .send({ 
            username: "test", 
            password: "test", 
            name: "test", 
            base_model_name: "ko-KR_BroadbandModel",
            description: "for Test"
          })
          .expect(401)
          .end(done);
      });
    });
  });
  // Customizations 조회
  describe('GET /customizations 는', () => {
    describe('성공시', () => {
      let body;
      before((done) => {
        request(app)
          .get('/customizations')
          .query({ username: testCredential.username, password: testCredential.password })
          .expect(200)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              body = JSON.parse(res.text);
              done();
            }
          });
      });
      it('배열을 반환한다.', () => {
        body.should.have.property('customizations');
        body.customizations.should.be.instanceOf(Array);
      });
      it('배열은 Customization 객체로 이루어져 있다.', () => {
        body.customizations[0].should.have.property('customization_id');
      });
    });
    describe('실패시', () => {
      it('인증 실패 시, 401 에러를 반환한다.', (done) => {
        request(app)
          .get('/customizations')
          .query({ username: "test", password: "test" })
          .expect(401)
          .end(done);
      });
    });
  });
  // Customizations 삭제
  describe('DELETE /customizations 는', () => {
    describe('성공시', () => {
      it('200 코드를 반환한다.', () => {
        request(app)
          .delete('/customizations')
          .send({ 
            username: testCredential.username, 
            password: testCredential.password, 
            customization_id: testCustomModel.customization_id
          })
          .expect(200)
          .end((err, res) => {
            if (err) {
              done(err);
            } else {
              done();
            }
          });
      });
    });
    describe('실패시', () => {
      it('customization_id가 유효하지 않을 경우, 400 에러를 반환한다.', (done) => {
        request(app)
          .delete('/customizations')
          .send({ 
            username: testCredential.username, 
            password: testCredential.password, 
            customization_id: "test"
          })
          .expect(400)
          .end(done);
      });
      it('인증 실패 시, 401 에러를 반환한다.', (done) => {
        request(app)
          .delete('/customizations')
          .send({ 
            username: "test", 
            password: "test", 
            customization_id: testCustomModel.customization_id
          })
          .expect(401)
          .end(done);
      });
    });
  });
});
